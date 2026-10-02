# Home do Carbonautas: cadeia real de montagem e o que foi corrigido (02/10/2026)

Auditoria feita sobre a `main` em 8857f62, reproduzida em Chromium headless (390 px e 1366 px) com Firebase simulado em `tests/fixtures/`. Os números abaixo vêm de `tests/home-stability.browser.cjs` e do harness que o originou.

## A cadeia como ela era

```
AUTH (handleAuthUser)
  -> bootstrap(): rede_members, rede_settings, subscribeAll()
  -> hidratação inicial (members, schedule, publicacoes, activities, notifications)
  -> renderPainel()  =  P176 wrapper -> P174 wrapper -> P87 "stable" -> P68 -> P56 (substitui o renderPainel original)
       P87 disparava 'carbonautas-panel-rendered' em requestAnimationFrame (um frame depois)
  -> 'carbonautas-session-ready'
       P195 monta o cartão AGORA, P117 assina destaques, P128 presença, P78/P69/P70/P72/P73/P85 agendam decorações em rAF,
       P144 e P194 reorganizam acordeões (tudo dentro de .p142-home-grid, que o CSS do P195 esconde)
  -> body.carbonautas-session-ready (Home visível)
  -> LOADER (modules/dossier-p132.js): MutationObserver no body + setInterval de 150 ms detectam o app aberto
       -> fetch de agenda-foco-p174.js, agenda-mural-home-p176.js, home-olha-rapidao-p181.js, checkin-mobile-p171.js,
          destaques-ui-p173.js, runtime-integrity.js, mona-p216.js
       -> P174 insere #p174AgendaFocus ("SUA AGENDA", lista vertical) no topo da Home JÁ VISÍVEL
       -> P181 (MutationObserver na caixa + setInterval 120 ms) reescreve o título para "OLHA RAPIDÃO" e troca botões
       -> P176 (MutationObserver na caixa + rAF) reescreve subtítulo, KPIs e transforma a lista em faixa horizontal
  -> P59 showCheckin (setInterval 250 ms) abre o card "Check-in diário registrado" sobre a Home (6,4 s)
  -> P171 reposiciona esse card no celular
  -> P57 p57Arrival (setInterval 300 ms) mostra o toast "Tcheguei Hodje Xomano!" sobre a navegação (4,2 s)
  -> Mona diz oi (P216)
```

Medido na `main`, celular, rede rápida: 23 escritas no `#viewPainel` depois da revelação (todas de P174/P176/P181), dois layout shifts a 235 ms e 267 ms (CLS 0,23), e os três avisos de entrada aparecendo e sumindo em tempos diferentes. Com rede lenta a capa chega 1 a 2 s depois da Home. Isso é o "monta em etapas".

Além disso, o commit cdd1cb1 ("Simplificar caixa inicial") passou a ler `p56BuildItems`, que não é global, e o cartão AGORA ficou preso em "Tudo certo" para todo mundo. O Arquivo Vivo (`modules/repository.js`) depende da mesma função.

## O que mudou

1. `bootstrap()` aguarda `CarbonautasLoader.ensureHome()` (P174 + P176 + P181 + destaques + integridade) antes do primeiro `renderPainel()` e da revelação. A camada visual deixa de chegar depois da Home visível.
2. A capa "Olha rapidão" é composta em um único render síncrono: `renderHome()` do P174 gera o markup, chama `__carbonautasHomeDecorate` (P176) e `__carbonautasHomePatch` (P181) na mesma tarefa, antes da pintura, e só reconstrói quando a assinatura (agenda + Mural) muda. Os MutationObservers de P176 e P181 sobre a caixa, o setInterval do P181 e o observer do P174 em `#dashKpis` foram removidos.
3. P87 dispara `carbonautas-panel-rendered` de forma síncrona, dentro do render, em vez de um frame depois.
4. `window.p56BuildItems` volta a existir. O cartão AGORA e o Arquivo Vivo voltam a receber itens.
5. Avisos de entrada retirados: P59 `showCheckin` (card de check-in diário), P57 `p57Arrival` (toast de chegada) e a camada P171 deixa de ser carregada. A presença continua registrada em silêncio pelo P128 (`rede_members.lastSeenAt`).

Resultado medido (celular rápido, celular lento, desktop): zero escritas no `#viewPainel` após a revelação, zero layout shift, AGORA com "1 de N" no primeiro frame, uma mudança real de dados reescreve o cartão AGORA uma única vez e não reconstrói a capa. As diferenças de pixel que restam entre frames são a animação da Mona.

## O que continua como dívida (não mexido nesta rodada)

- 15 `setInterval` permanentes (P44, P45, P47, P57, P62, P74, P79, P80, P85, P86, P99, P101, P183 e a sonda do loader) e cerca de 40 `MutationObserver`. Nenhum deles escreve na Home visível depois da revelação, mas gastam CPU no celular e três reescrevem textos de telas ocultas a cada 1,2 a 1,8 s (P47, P44, P100).
- 28 `onSnapshot` abertos na entrada, com duplicatas (`rede_chat` x4, `rede_members` x3, `rede_notifications` x2, `rede_settings` x2) criadas pelas camadas de chat. Não afetam a Home, mas custam leituras.
- O trabalho invisível do Painel (P56 -> P68 -> P69/P70/P72/P73/P85 -> P144/P194) continua rodando a cada render dentro de `.p142-home-grid`, que o P195 esconde. É o candidato natural para a próxima fusão: o cartão AGORA e o Arquivo Vivo precisam apenas de `p56BuildItems`.
- `sw.js` está passivo e o `index.html` desregistra qualquer service worker do escopo ao carregar. O service worker antigo (`55c30a6`) era network-first para HTML, então telefones online recebem o `index.html` novo sem precisar de reset manual.
- Regras do Firestore não foram tocadas. `rede_group_threads` existe em `firestore.rules`; P48 só assina a coleção quando a tela de panelinhas é aberta.

## Como validar

```
npm ci
npm test
CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:home     # ou npx playwright install chromium e sem a variável
npm run test:browser
```
