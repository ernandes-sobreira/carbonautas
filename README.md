# Carbonautas · Science OS

Plataforma da Rede Carbonautas (LIPAN/LEFA/CELBE, UNEMAT). Arquivo unico `index.html` publicado no GitHub Pages, Firestore e Storage no projeto `brasa-pantanal`, bridge ONLYOFFICE e Laboratorio de Dados no VPS.

## Estrutura do repositorio

| Caminho | Uso |
|---|---|
| `index.html` | O aplicativo inteiro. Todas as camadas P44 a P196 estao dentro dele, no fim do `<body>`, cada uma marcada com `data-src` (nome do arquivo de origem) |
| `sw.js` | Service worker. So cache e pagina offline. Nao injeta mais nada no HTML |
| `game.html`, `recovery.html`, `chrome-reset.html`, `manifest.webmanifest`, icones | Publicar junto na raiz |
| `firestore.rules` | Unica fonte das regras. Publicar no Console do Firebase. Contem tambem as regras de outros sistemas (`projects/`) |
| `index.html.sha512` | Hash da versao publicada (registro INPI). Regerar a cada publicacao |
| `backups/` | Ponto de restauracao: o repositorio exatamente como estava antes da consolidacao (P126, 19/09/2026) |
| `vps/` | Scripts ja aplicados no VPS. Referencia e reinstalacao |
| `docs-antigos/` | LEIA-ME, checklists e copias antigas de regras. Historico |

## Ponto de restauracao

O arquivo `backups/carbonautas-P126-2026-09-19-antes-da-consolidacao.zip` contem a raiz completa anterior (index.html P28 + sw.js P123 + 80 arquivos de patch). Para voltar a ela: apagar a raiz, descompactar o zip na raiz e publicar.

No Git, marcar o commit anterior a este antes de enviar a P127:

```
git tag -a P126-pre-consolidacao -m "Ultima versao com patches injetados pelo sw.js"
git push origin P126-pre-consolidacao
```

Para restaurar por Git: `git checkout P126-pre-consolidacao -- .`

## Como atualizar

1. Editar `index.html`. Nao criar mais arquivos `*-pNN.js`; a alteracao entra no proprio `index.html`, na camada correspondente ou no codigo base.
2. Trocar a constante `CACHE` no `sw.js` e o `?v=` do registro do service worker no `index.html` a cada publicacao.
3. Se a alteracao mexer em regras, publicar `firestore.rules` no Console. Se mexer no VPS, guardar o script em `vps/`.
4. Testar em janela anonima.

## CHANGELOG

### P196 · 2026-09-20 · Swipe físico nos passa-cards
- Cards acompanham o dedo ou mouse durante o arraste horizontal.
- Swipe para a esquerda avança; swipe para a direita volta ao card anterior.
- Soltar antes do limite devolve o card com efeito de mola.
- Swipe concluído lança o card para fora da tela e traz o seguinte com animação.
- Botões Passar, Abrir e Dispensar continuam disponíveis como alternativa.
- Não alterado: dados, regras, Firebase, VPS ou permissões.

### P195 · 2026-09-20 · Capa mínima em passa-card
- Um único card flutuante por vez reúne pendências e novidades.
- Passar avança; Dispensar só tira da capa durante a sessão.
- Saem da capa os atalhos duplicados, os blocos repetidos, o hero e os KPIs.
- Destaques do mês passam para Ó nóis! (Mural), antes dos filtros.
- Ações secundárias ficam atrás do botão ⋯.
- Não alterado: dados, regras, VPS ou permissões.

### P194 · 2026-09-20 · Home em cards flutuantes
- Nova hierarquia visual no Painel: “Precisa de você”, “Só acompanhar” e “Atalhos” em destaque.
- Mural, Agenda, Repositório e Pessoas viram atalhos compactos.
- Saúde dos projetos, produtos e check-in ficam recolhidos em “Mais do painel”.
- “Sobre o Carbonautas” e “Lab” ficam discretos no rodapé.
- Não alterado: dados, regras do Firebase, VPS ou permissões.

### P193 · 2026-09-20 · Menos polling redundante
- Removido o `setInterval(enhanceSubNav,900)` da camada de chat; a mesma atualização já ocorre pelo wrapper de `renderSubNav`.
- Mantidos os demais pollings quando ainda há dependência funcional ou de notificações.
- Não alterado: Firebase, regras, VPS, dados ou layout.

### P192 · 2026-09-20 · Sobre mais encontrável sem aumentar o menu
- Mantido o menu principal enxuto.
- “Sobre o Carbonautas” passa a aparecer como atalho discreto no fim da tela “Coisa pra resolver”.
- O botão antigo escondido dentro do resumo do Painel deixa de ser exibido para evitar duplicidade.
- Não alterado: dados, regras, Firebase e VPS.

### P191 · 2026-09-20 · Versionamento alinhado
- Build do app, registro do service worker e cache do `sw.js` passam a usar `P191-20260920`.
- README atualizado para refletir a versao corrente apos as correcoes de seguranca, Storage e mobile.
- `index.html.sha512` regenerado a partir do `index.html` publicado.
- Nao alterado: regras, dados, layout e VPS.

### P129 · 2026-09-19 · Menos na tela, abertura mais leve
- Fofoca geral sem temas: saem a barra de temas e o seletor por mensagem. Mensagens antigas continuam visiveis.
- Jogo sai do Painel e Lab sai do menu. Os dois viram cards no topo do Repositorio. As telas continuam existindo.
- Um so badge em Conversas (equipe + privadas somadas).
- Painel sem os quatro KPIs numericos. Ficam as listas curtas e o bloco Acessos.
- d3, mammoth, xlsx e pdf.js deixam de carregar na abertura. Cada um baixa na primeira vez que a tela precisa (grafo da Rede, preview de DOCX, planilha, PDF, exportacoes). Cerca de 1,3 MB a menos no primeiro acesso.
- Corrigido: a primeira visita recarregava a pagina sozinha (o service worker antigo e a camada P85 forcavam reload ao assumir o controle). Agora abre uma vez so.
- Repositorio no celular: botao grande "Enviar arquivo" no topo, Science Dock recolhido atras de "Criar documento", botoes secundarios atras de "Mais". No computador nada muda.
- Nao alterado: regras, VPS, dados, Agenda, notificacoes, reacoes dos destaques.

### P128 · 2026-09-19 · Menos coisas na tela
- Medalhas, pontos e ranking saem da interface (botao, resumo e cards). Os dados continuam no Firestore; nada foi apagado.
- Check-in com texto sai. Entrar no app registra presenca em `rede_members.lastSeenAt` (uma vez a cada 30 min, so no proprio cadastro).
- Painel da coordenacao ganha o bloco "Acessos": nome e quando entrou (hoje, ontem, N dias). Alunos nao veem esse bloco.
- Pessoas: ao abrir um integrante aparece a "Linha do tempo" (prazos, tarefas, arquivos, fotos e destaques da pessoa, mais recente primeiro; 12 itens e botao "Ver tudo").
- Painel com menos palavras: frases de explicacao reduzidas a uma linha.
- O jogo so carrega quando a tela do jogo e aberta. Antes o three.js baixava em todo acesso.
- Novo `vps/P128_lembretes_email.js`: lembrete diario de prazos por e-mail, gratuito (Gmail com senha de app), com resumo para a coordenacao. Instrucoes no cabecalho do arquivo.
- Novo `vps/P128_ONLYOFFICE_LEVE.txt`: como abrir o editor no modo mobile e com barra compacta.
- Nao alterado: regras, VPS, dados, conversas, mural, destaques, repositorio.

### P127 · 2026-09-19 · Consolidacao
- `index.html` passa a conter as 64 camadas (49 scripts e 2 CSS que o `sw.js` injetava, mais 9 scripts e 4 CSS que a camada P91 carregava em cadeia), na mesma ordem de execucao de antes. Primeira visita ja abre a versao completa; nao depende mais do service worker instalar e recarregar a pagina.
- `sw.js` reduzido a cache e pagina offline.
- Corrigido erro de sintaxe em `dashboard-clarity-p68.js` (chave faltando na funcao `decorateReview`). Esse arquivo era carregado em producao mas o navegador o descartava inteiro, entao a separacao "Precisa de voce / So acompanhar" do Painel nunca chegou a funcionar. Agora funciona.
- Removidos 15 arquivos que nenhum caminho carregava: acompanhamento-medalhas-v1, agenda-soft-p107, agenda-stable-media-p119, agenda-swipe-p111, calendar-sync-v2 e v3, chat-notifications-reactions-p124 (identico ao p116), dashboard-panel-cleanup-p77, editor-chat-mobile-p60, editor-mobile-edit-p61, pwa-mobile-fix-p82, repository-card-deck-p89, repository-ui-p53, tabs-stability-p49, tracking-cards-p96. Nenhum deles estava no ar.
- Removido `app-p28-base.html` (copia identica do `index.html` antigo).
- Raiz limpa: scripts de VPS em `vps/`, documentos antigos em `docs-antigos/`, copia integral da versao anterior em `backups/`.
- Nao alterado: regras, VPS, dados, comportamento visual das telas.



### P27 · 2026-09-12
- Agenda reconstruida com tres visoes: Mes (grade com pontos coloridos por tipo, vermelho quando atrasado, toque no dia mostra a lista do dia), Ano (12 mini-meses com intensidade por quantidade, toque abre o mes) e Lista (Atrasado, Hoje, Esta semana, Este mes, Depois, Concluido).
- Itens da agenda compactos: hora, titulo, quem. Descricao so aparece ao tocar em "detalhes".
- Os tres botoes de criacao viraram um unico "+ Novo" com tres opcoes. Filtros escondidos atras do botao Filtros.
- Repositorio: cabecalho alinhado no celular (dois botoes por linha, publicacao em linha inteira), titulo e subtitulo encurtados.
- Nao alterado: regras, VPS, dados. A Agenda usa os mesmos dados (rede_schedule, prazos dos membros, agenda privada).

### P26 · 2026-09-12
- Navegacao reduzida de 10 para 7 destinos: Repositorio (destaque, largura total no menu), Painel, Pessoas (Rede + Acompanhamento), Agenda (antigo Cronograma), Conversas (Equipe + Privadas), Mural (Mural + Fotos), Lab.
- Grupos com duas telas ganham uma sub-navegacao em pilulas no topo. Nenhum modulo foi reescrito; as telas antigas continuam existindo por baixo.
- Removidos o rodape "O botao MENU funciona em qualquer tela", o selo de versao no menu, o chip P22 do Science Dock e a versao no titulo da aba.
- Fotos no celular: so o filtro de projeto fica visivel; os demais abrem no botao Filtros.
- Nao alterado: regras, VPS, dados.

### P25b · 2026-09-11
- Regras: removido o teste `is list` na leitura de `rede_repository_packages` e `rede_personal_repositories`, que podia negar a consulta de listagem inteira. **Publicar `firestore.rules`.**
- Meu Repositorio mostra na tela o motivo quando o Firestore bloqueia a listagem ou quando o vinculo conta/pessoa esta inconsistente, em vez de ficar vazio em silencio.

### P25 · 2026-09-11
- Corrigido: quatro funcoes chamadas mas inexistentes no `index.html` (`renderRepoPackagePeople`, `updateRepoPackageAccessUI`, `rootAllowedMemberIds`, `fileToDataUrl`). A primeira quebrava o script na inicializacao e deixava sem evento os botoes Criar pasta, Publicar e o chat privado. A segunda impedia o modal Nova pasta de abrir. Isso era a causa de "Meu Repositorio nao abre para salvar".
- Corrigido (regras): leitura de `rede_personal_repositories/{id}` inexistente devolvia permission-denied e a raiz privada nunca era criada. Agora `get` e `list` sao separados. **Publicar `firestore.rules`.**
- Fotos: mural minimalista em grade, sem legenda no cartao (aparece ao passar o mouse e no lightbox). Reacoes e comentarios continuam no lightbox.
- Fotos: filtros por projeto, pessoa, ano, tipo (foto/print) e busca por texto.
- Fotos: modo Selecionar, com "selecionar todas as filtradas", e download em ZIP. O ZIP organiza as imagens em pasta por projeto, nomeia por data_autor_legenda e inclui `fotos.csv` com projeto, data, autor, legenda e acao, pronto para relatorio.
- Fotos: envio de varias imagens de uma vez, todas com o mesmo projeto, data e acao.
- Repositorio limpo: scripts de VPS em `vps/`, LEIA-ME antigos em `docs-antigos/`, quatro copias de regras removidas (a versao valida e `firestore.rules`).
- Nao alterado: VPS, Lab, chats, ONLYOFFICE.

### P24 · 2026-09-10
Mensagem privada por arquivo, colaboradores por arquivo, sala do arquivo. VPS: `vps/P24_VPS_COLABORADORES_OFFICE.txt`.

### P22
Conversa por arquivo e edicao ONLYOFFICE no Meu Repositorio. VPS: `vps/P22_VPS_MEU_REPOSITORIO_OFFICE.txt`.

### P4 a P16
Historico em `docs-antigos/`.

## Pendencia conhecida
O download em ZIP usa `fetch` nas URLs do Storage. Se o console mostrar erro de CORS, aplicar uma vez no bucket:

```
gsutil cors set cors.json gs://brasa-pantanal.firebasestorage.app
```

com `cors.json`:

```
[{"origin":["https://ernandes-sobreira.github.io"],"method":["GET"],"maxAgeSeconds":3600}]
```
