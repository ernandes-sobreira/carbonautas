# P204 — regras e histórico preparados para ativação conjunta

**Estado: código testado e enviado à branch `fix/p204-regras-convites`; ainda não ativado em produção.** A publicação no GitHub foi autorizada pelo usuário. O console Firebase não abriu neste ambiente (HTTP 502). Nenhuma regra real foi modificada; a versão em uso permanece P203.

## O que muda

- Aluno continua criando, editando e excluindo os próprios acompanhamentos. O coordenador continua editando todos e decidindo aprovação/reprovação.
- As regras impedem aluno de criar ou manter `aprovado`/`reprovado` na gravação. No formulário, editar um registro decidido o devolve para revisão. Concluir uma tarefa continua sendo uma ação do aluno e não equivale a aprovação acadêmica.
- Ao editar pelo formulário de acompanhamento, a transação grava uma cópia anterior em `history`. As regras conferem essa cópia contra o documento e impedem sua alteração/exclusão. O botão “Versões anteriores” mostra até 30 registros. Isso não reconstrói edições feitas antes da P204 nem transforma todos os caminhos antigos em trilha obrigatória. Outros fluxos/SDK ainda podem editar conforme suas permissões; portanto não é uma auditoria inviolável de cada mudança do sistema.
- O autocadastro passa a usar convite pessoal, exclusivo do e-mail confirmado, com validade de 7 dias e uso único. A conta ainda é criada pelo aluno. Na ficha de pessoa, o coordenador usa “Convite pessoal” para gerar/copiar o código; não é enviado e-mail automaticamente pelo app. Os logins existentes não são migrados nem redefinidos.
- Contas sem vínculo não podem mais listar todos os perfis. O cadastro não depende de ler o perfil completo antes de vinculá-lo.
- `projetosAluno` é permitido na edição do próprio perfil.
- Dono lógico/colaborador pode salvar `storagePath` no Office; novo caminho deve pertencer ao UID que enviou a edição.
- Reações preservam a autoria; uma pessoa não pode sobrescrever a reação de outra trocando `actorUid`.

## Ordem de ativação

1. Preservar as regras atualmente publicadas no Firebase em uma cópia privada. Comparar com a base do repositório: o projeto é compartilhado com outros sistemas.
2. Publicar o `firestore.rules` desta versão e atualizar imediatamente o aplicativo P204. Durante esse pequeno intervalo, novo autocadastro pelo código compartilhado deixa de funcionar; contas existentes seguem válidas.
3. Verificar somente os fluxos alterados com uma conta de teste autorizada: convite, edição própria, decisão do coordenador, projeto e salvamento compartilhado. Não repetir a instalação do VPS.
4. Ativar o backup conforme `ops/README.md`, depois confirmar a primeira cópia externa e o ensaio de restauração. Sem isso, backup automático permanece pendente.

Publicar apenas o HTML P204 antes das regras faria gravações de histórico e convites falharem. Por isso a P203 foi separada como atualização compatível com as regras anteriores, e esta etapa permanece em branch própria.

## Validação

`npm ci`, `npm test`, `npm run test:rules`. O comando de regras usa o projeto fictício `demo-carbonautas`, emulador local; nunca `brasa-pantanal`. Java é necessário. A versão exata das dependências está no lockfile. Testes cobrem permissões positivas e negativas, tipos/bytes de backup, restauração que preserva dados existentes, agenda, falhas de carregamento, conflitos de edição e sintaxe.

## Pendências que continuam reais

- Backup externo ainda não ativado; destino privado e credenciais locais não foram definidos.
- Storage/IAM/regras publicadas e servidor efetivo não foram acessados. Scripts antigos em `vps/` não foram tratados como versão instalada.
- Coleções legadas abertas do projeto compartilhado continuam pendentes de análise dos consumidores, sem bloqueio automático que poderia quebrar outros sistemas.
- Autenticação/senhas, regras/índices em produção e estado não salvo do editor não integram o exportador de dados; ver limites em `ops/README.md`.
- Não houve teste autenticado do aplicativo real após implantação, pois a implantação não ocorreu.
