# Auditoria Carbonautas — 22/09/2026

## Estado da entrega

Refatoração em branch, **não homologada em produção**. Base auditada: `4437898f26d865377576e24ec4da1b953169eafe`; ZIP fornecido e `main` tinham o mesmo index.html. Não houve exclusão de documentos reais, migração de dados ou alteração do Lab.as/VPS.

## Arquitetura e diagnóstico

- `index.html`: aplicação principal, estado lexical, autenticação e assinaturas, renderizações, upload inicial, visualizadores, mensagens e diversas gerações inline.
- `modules/dossier-p132.js`: carregamento sob demanda dos módulos de Pessoas, Projetos, Mural e Acompanhamento.
- `modules/agenda-core-p213.js` / `agenda-integration-p213.js`: agenda recente; permanecem.
- P214: troca de arquivos com transação, mas reconstrução periódica de botões; lia `window.state` embora o estado real fosse `let state`; download era link cross-origin com target blank, registrado antes de obter bytes.
- P215–P220: seis implementações concorrentes para ações/histórico/estilo. P219 carregado duas vezes, inclusive por workflow que modificava main automaticamente.
- P54/P55/P58/P63: versões anteriores de decoração de cartões; P65 consertava a duplicação causada por P64.
- P88/P90/P91/P92: versões da navegação de arquivos; P90 clonava DOM e fazia proxy de eventos por posição no array de botões. Perdia identidade, histórico e handlers quando outros módulos alteravam os cartões.
- P64: roteamento/contexto de privadas misturado com decoração periódica do Repositório e segunda assinatura das mesmas mensagens.
- `firestore.rules`: publicações legíveis por perfis ativos; pastas privadas com ACL; threads privadas por dois UIDs; novas regras necessárias para recibos e versões em documentos de revisão.
- `sw.js`: network-first existente; build/cache e registro atualizados em conjunto.
- `vps/`: bridge/editor e Lab.as. Não modificados.

## Decisões e alterações

**Manter:** coleções, documentos antigos, versões históricas, Auth/Storage, renderizadores de visualização, chat privado canônico, upload inicial, módulos fora do Repositório e Lab.as.

**Consolidar:**

- `modules/file-handoff.js`: leitura autoritativa; normalização de arquivos públicos e de pastas; identidade única de thread; histórico compatível; download como Blob; devolução + mensagem + notificação + turno na mesma transação; recusa de edição concorrente e limpeza de upload órfão.
- `modules/repository.js`: um componente de arquivo para lista, pasta e carrossel; delegação única de cliques; somente quatro ações principais conforme permissão; contexto de mensagem no campo de composição, sem envio automático ao simplesmente abrir a conversa. Ao enviar a mensagem contextual, recibo e mensagem são gravados no mesmo batch. O contexto é consumido após o envio.
- `modules/repository.css`: aparência própria e diálogos nativos na top layer; visualização aberta depois do carrossel fica na frente. Escala de camadas definida para este fluxo.
- Ponte `CarbonautasApp` fornece getters do estado lexical sem duplicar estado ou subscriptions.
- P64 conserva compatibilidade de rotas antigas, mas perde seu loop de decoração e a instalação da assinatura paralela de mensagens.
- P59 mantém check-in, sem polling de decoração dos arquivos.

**Remover:** P214 (substituído pelo serviço), módulos P215–P220, scripts inline P52/P54/P55/P58/P63/P65/P88/P90/P91/P92 e `.github/workflows/p219-inject.yml`. Recuperação pelo histórico Git; nenhum histórico de dados foi removido.

O carrossel agora é aberto por “Folhear arquivos”, conserva Anterior/Próximo e renderiza pelos IDs. Organização por pessoa (A–Z), mês e pendência e pesquisa foram recuperadas no mesmo componente. Os filtros reorganizam os cartões existentes e alimentam o carrossel sem clonar o DOM. As pastas continuam no navegador de pastas existente; a antiga apresentação de pastas virtuais de P88 não foi recriada.

## Testes e alcance real

- `npm test`: 45 testes, incluindo sintaxe de todos os scripts inline/módulos; backup; CSV; agenda; história/versões; sequências v1/v2/v3 para DOCX/XLSX/PPTX/PDF/CSV/PNG/ZIP; mensagem obrigatória; rejeição de conflito; rollback/limpeza; download com erro HTTP; versão recebida durante corrida; service worker.
- `npm run test:rules`: Firestore real **no emulador**, com perfis fictícios. Transações v1/v2/v3, recibos, mensagens, notificações e pastas privadas. Leitura de conversas/arquivos privados por terceiro negada; alteração de participantes e adulteração de histórico negadas. Os documentos v1 são semeados no teste; isto não valida upload inicial de um usuário real.
- `npm run test:browser`: Chromium headless em 1440, 390, 360 e 430 px. Componente real, Firebase e conteúdo da prévia simulados. Navegação repetida, histórico único, uma ação por clique, formulário, visualizador no topo, fechar/retornar, conversa correta/contexto/foco e ausência de overflow horizontal.
- Smoke adicional do HTML completo, com serviços externos bloqueados e estado fictício: cartão renderizado e nenhum pageerror na janela observada. Não equivale a validar login e todas as telas.
- Workflow de validação novo é read-only; não injeta scripts nem cria commits.

## Pendências impeditivas para merge/deploy

1. **Firebase de produção não autenticado neste ambiente** (`firebase login:list`: nenhuma conta). Regras preparadas/testadas, não publicadas. Não misturar este cliente com regras antigas: recibos de leitores e devoluções de pastas/revisões podem ser negados.
2. Homologar com duas contas reais: upload inicial via Storage, prévias reais DOC/DOCX/XLS/XLSX/PPT/PPTX/PDF/imagens, download com CORS vigente, devolução e notificações. Prévia de formatos legados/PPT depende dos visualizadores existentes; não foi demonstrada ponta a ponta.
3. Chrome Android em aparelho e PWA instalada não testados. Viewport móvel em Chromium não é um aparelho Android. Validar atualização entre abas e app instalado.
4. Agenda, Acompanhamento e notificações gerais não tiveram todos os botões auditados ponta a ponta. `docs/runtime-observers.md` enumera watchers/timers remanescentes. Não declarar que toda a plataforma está livre de polling/flicker.
5. Código interno do editor online ainda existe no monólito para compatibilidade com chamadas antigas; removido do novo fluxo de arquivos, não eliminado integralmente. Os módulos remanescentes precisam de auditoria própria antes de exclusão segura.
6. Histórico continua no array existente: documentos com grande quantidade de eventos podem atingir o limite de documento do Firestore. Não foi feita migração destrutiva ou silenciosa.
7. Pastas com múltiplos colaboradores agora têm seleção explícita de destinatário no envio e na conversa. A ACL é revalidada na transação; perda de acesso interrompe o envio e limpa o objeto recém-enviado. Não amplia acesso privado para o coordenador.
8. GitHub Pages de produção só pode ser validado para esta entrega após publicar as regras, homologar e fazer merge. Branch/PR não são deploy de produção.

## Execução final necessária

- Autenticar um operador autorizado no Firebase e publicar **somente Firestore rules** revisadas; não alterar Lab.as ou VPS.
- Homologar a branch com aluno/professor e arquivos reais, incluindo permissões negativas.
- Executar CI, revisar diff, então merge e verificar Pages e atualização da PWA.

Não há ação de VPS nesta alteração. Não afirmar conclusão da auditoria completa enquanto as pendências acima permanecerem.

## Segunda revisão — 22/09/2026

- Correção de ciclo de vida: ao fechar, o visualizador compartilhado sai do diálogo do Repositório e volta ao seu contêiner original. Outras telas podem reabri-lo. Download registrado fica disponível durante o carregamento da prévia.
- Contadores divergentes de versões legadas conservam o maior valor. Removidos helpers de reconhecimento/decoração de DOM que ficaram sem consumidores após a consolidação.
- Testes adicionais: filtros/carrossel, escolha e cancelamento de destinatário em quatro larguras, reabertura do visualizador por outra tela, destinatário perdendo acesso durante upload e retorno ao proprietário não duplicado na ACL.
- Auditoria encontrou uma desativação explícita de Panelinhas no estilo `p210-panelinhas-off`. Ela foi preservada; não foi tratada como erro acidental nem removida. A implementação inativa ainda contém polling e seleção de participantes que se perde ao filtrar; exige revisão antes de eventual reativação.
- Estes testes continuam usando Firebase simulado ou emulado. Não comprovam a operação na produção ou em PWA instalada.
