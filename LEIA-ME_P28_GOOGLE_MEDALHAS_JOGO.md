# Carbonautas P28 — Google Agenda + Medalhas + Jogo

Data: 14/09/2026

## O que entrou nesta versão

1. **Agenda privada + Google Agenda**
   - O compromisso “Só para mim” continua em `rede_private_schedule` e só o próprio UID pode lê-lo.
   - Botão **G · Google Agenda** na Agenda.
   - Sincronização manual Carbonautas → Google e Google → Carbonautas para os eventos criados pelo Carbonautas.
   - No Google, o evento é enviado com `visibility: "private"`.
   - O token OAuth do Google fica somente na memória da aba/sessão; não é gravado no Firestore.
   - O Firestore guarda somente `googleEventId`, `googleHtmlLink` e `googleSyncedAt` no documento privado do próprio usuário.

2. **Pontos e Medalhas**
   - Nova coleção: `rede_points_events`.
   - IDs determinísticos evitam pontuar duas vezes a mesma ação normal.
   - O ranking do mês atual é provisório; meses anteriores aparecem como resultado final.
   - 1º, 2º e 3º lugares aparecem como 🥇 🥈 🥉.
   - Reações, mensagens rápidas e comentários não geram pontos.

### Valores atuais

| Ação | Pontos |
|---|---:|
| Check-in mensal | 20 |
| Nova pasta/conjunto no repositório | 20 |
| Publicação/arquivo no repositório | 20 |
| Produto registrado | 15 |
| Pedido de ajuda/colaboração no mural | 12 |
| Acompanhamento registrado | 10 |
| Acompanhamento concluído | 10 |
| Ciclo completo no jogo | 10 (máx. 1x/dia) |
| Prazo acadêmico concluído | 8 |
| Foto com metadados | 6 |
| Publicação comum no mural | 5 |

3. **Jogo Carbonauta embutido**
   - Arquivo: `game.html`.
   - Abre dentro da área **🎮 Jogo** do Carbonautas.
   - Ao concluir os sete mundos, o jogo envia o resultado ao app e gera +10 pontos no ranking, no máximo uma vez por dia.
   - Game over não gera bônus.

## PASSO 1 — publicar os arquivos no GitHub Pages

Substitua/adicione no repositório que publica `https://ernandes-sobreira.github.io/carbonautas/`:

- `index.html`
- `game.html` **(novo)**
- `sw.js`
- `manifest.webmanifest`
- demais arquivos do pacote, mantendo os ícones e arquivos auxiliares já existentes.

O cache do PWA foi alterado para `carbonautas-p28-20260914` para reduzir o risco de o celular continuar abrindo a versão antiga.

## PASSO 2 — Firestore: publicar a regra COMPLETA

No Firebase Console do projeto **brasa-pantanal**:

**Firestore Database → Rules**

Copie TODO o conteúdo de:

`FIRESTORE_RULES_P28_COMPLETAS.txt`

Cole no editor de Rules e clique em **Publish**.

**IMPORTANTE:** não cole apenas o bloco de medalhas. O arquivo fornecido é a regra completa já mesclada com as regras existentes do Brasa Pantanal/Carbonautas, justamente para não apagar permissões de outras partes do Firebase grande.

Nenhuma regra nova de Firebase Storage é necessária para o jogo, medalhas ou Google Agenda.

## PASSO 3 — ativar o Google Agenda

No Google Cloud Console:

1. Crie ou escolha um projeto para o Carbonautas.
2. Ative a **Google Calendar API**.
3. Configure a tela de consentimento OAuth.
4. Crie um **OAuth 2.0 Client ID** do tipo **Web application**.
5. Em **Authorized JavaScript origins**, adicione exatamente:

   `https://ernandes-sobreira.github.io`

   Observação: origem é domínio + protocolo, sem `/carbonautas/` no final.
6. Copie o Client ID, que termina em `.apps.googleusercontent.com`.
7. Entre no Carbonautas com a conta da coordenação.
8. Vá em **Agenda → G · Google Agenda**.
9. Cole o Client ID em **Configuração da coordenação** e salve.

Não coloque **Client Secret** no HTML. Aplicação Web JavaScript não deve expor segredo de cliente.

### Contas dos alunos

Cada aluno faz a própria autorização do Google. O Carbonautas não recebe a senha da Conta Google.

- Se o OAuth estiver em modo **Testing / External**, adicione as contas Google dos alunos como usuários de teste.
- Se todos estiverem dentro de uma mesma organização Google Workspace, é possível usar configuração **Internal**, conforme a política da organização.
- Para abrir o recurso a um público externo maior usando escopos sensíveis, o Google pode exigir verificação do aplicativo.

## Como o aluno usa

1. Agenda → **G · Google Agenda**.
2. **Conectar meu Google Agenda**.
3. Autorizar a permissão de eventos de agenda.
4. Usar **Enviar Carbonautas → Google** para mandar os compromissos privados.
5. Depois de alterar no Google, usar **Trazer alterações Google → Carbonautas**.
6. Também é possível usar o botão **G** em um compromisso específico.

A sincronização desta versão é **manual**. Isso é proposital para funcionar no GitHub Pages sem guardar refresh token de Google em banco. Sincronização automática contínua em segundo plano deve ser implementada futuramente em backend seguro (por exemplo, Cloud Functions).

## Privacidade

- Agenda Carbonautas: somente `ownerUid` lê o próprio documento.
- Coordenação não recebe exceção de leitura para `rede_private_schedule`.
- Google: os eventos enviados pela integração recebem `visibility: "private"`.
- Metadados que ligam o evento ao Carbonautas usam `extendedProperties.private`.
- Token OAuth Google: somente memória da sessão do navegador.

## Observação sobre segurança da gamificação

A versão P28 impede duplicação normal pelo ID determinístico do evento de pontos e mantém extrato auditável no Firestore. Como o site é 100% client-side, um usuário tecnicamente avançado ainda poderia tentar adulterar chamadas pelo console do navegador. Para um campeonato com prêmio material ou necessidade de antifraude forte, o passo seguinte é mover a concessão de pontos para Cloud Functions/servidor.
