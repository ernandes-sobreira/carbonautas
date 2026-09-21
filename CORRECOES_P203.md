# Carbonautas P203 — manter o seu jeito, reduzir falhas

Esta etapa preserva fotos, mural, laboratório, jogo, medalhas, cards e as expressões do Carbonautas. Nenhum registro real foi alterado ou excluído.

## Aplicativo

- Agenda mantém as pessoas selecionadas ao mudar a busca e limpa a seleção ao abrir outro evento.
- Falhas ao carregar módulos podem ser tentadas novamente; o carregamento só confirma após terminar.
- Histórico visual do repositório reutiliza os dados já recebidos, sem consultas repetidas antes do login.
- Nomes como `Capítulo d'água.pdf` não quebram os comandos de abrir/baixar.
- PDF.js recebe `isEvalSupported: false`, mitigação documentada para CVE-2024-4367. A migração para uma versão atual do leitor permanece separada para verificar compatibilidade.
- O editor envia a autenticação apenas ao servidor fixo `https://docs.carbonautas.online`.
- Escape/toque no fundo respeitam o salvamento do editor. Falha na confirmação mantém o texto do acompanhamento.
- Edição de acompanhamento evita clique duplo, usa transação e detecta alterações concorrentes pelo `updatedAt`.
- No formulário, aluno continua editando os próprios itens; decisões Aprovado/Reprovado ficam para o orientador. Alterar um item decidido volta para revisão. **Impedir chamadas diretas ao banco depende das regras da P204.**
- Salvamentos Office comuns/privados comparam a revisão de abertura antes de gravar. Uma colisão não sobrescreve outra edição; é oferecido download de recuperação. Revisões com IDs determinísticos também rejeitam colisão.
- Notificações/pontos são posteriores à gravação e não transformam um salvamento confirmado em mensagem falsa de falha.
- Relatório Excel passa a ter esse nome; CSV neutraliza entradas que poderiam virar fórmulas.
- Logout limpa coleções da conta em memória. Reparação do navegador preserva sessões e dados de outros aplicativos; limpeza do service worker se restringe aos caches Carbonautas.

## Próxima etapa preparada: P204

Depende de publicar as regras no Firebase: aprovação/reprovação protegidas no banco; versão anterior do acompanhamento; convite pessoal com e-mail verificado; correções de `projetosAluno` e `storagePath`; proteção contra troca de autoria nas reações.

A P204 deve ser ativada com regras e aplicativo juntos. Alterar somente o HTML não publica regras Firebase. As regras foram testadas em emulador com contas fictícias; os dados reais não foram usados.

## Backup

A pasta `ops/` contém exportação, verificação de integridade, restauração de itens ausentes e agendamento externo criptografado. **Preparado; não ativado no VPS.** Ver `ops/README.md` para o checklist consolidado e as limitações (inclusive Firebase Authentication).

## Limites e pendências preservadas

O console Firebase respondeu 502 neste ambiente. Nenhuma regra, IAM, Storage ou configuração de servidor foi publicada. Não há acesso SSH disponível nesta sessão. Não repetimos a instalação/testes do bridge P16 relatados no histórico. Não se deve substituir o servidor atual pelos scripts históricos do repositório.

As coleções legadas abertas (`records`, `chat`, `photos`, `upload_history`, `atmospheric`, `diary`, `schedule`) pertencem ao projeto compartilhado e permanecem pendentes de identificação dos aplicativos consumidores antes de fechá-las. Não são as coleções `rede_*`. Esse risco não foi resolvido por atualizar o site.

A revisão dos fluxos atuais do VPS (callback, previews e exclusão) exige o `server.js` efetivo, não repetir testes de funcionamento já feitos. Não há certificação de segurança total ou de restauração real concluída.
