# Mona no Carbonautas · P224

## O que esta versão prepara

- Abre uma conversa da Mona quando o aluno entra no Carbonautas.
- Pergunta o que foi feito e permite anexar PDF, planilha, documento ou foto.
- Reconhece retorno após sete ou mais dias e pergunta, com acolhimento, o que ocorreu no período.
- Analisa anexos; quando a mensagem contém um link, habilita busca na web para tentar localizar o artigo.
- Após a conversa, pede confirmação antes de registrar resumo e situação sobre avisar o orientador.
- Exibe à coordenação as 40 atividades mais recentes, sem expor o conteúdo dos arquivos.

## Dados e limites

O login Firebase protege as rotas. A chave OpenAI fica somente no ambiente do servidor. A conversa guarda até 12 mensagens recentes em `rede_ai_sessions`; os arquivos são enviados para análise e não são gravados no Firestore pelo assistente. O registro de acompanhamento só é criado depois da escolha explícita do aluno. A versão limita cada arquivo a 2 MB, até três arquivos por mensagem e 5 MB somados, aceita os formatos listados na interface e limita cada conta a 40 mensagens por hora.

As mensagens enviadas à API são processadas pela OpenAI para responder ao aluno. O sistema usa `store:false` na Responses API. A ferramenta de busca na web é usada somente quando a mensagem contém um link e pode acrescentar custo de busca.

## Ativação no VPS

O arquivo `vps/PREDATOR_P7_AI_ASSISTANT.sh` é um patch aditivo para a bridge atual. Ele cria backup do `server.js`, aumenta o limite JSON da aplicação para 12 MB, instala as rotas autenticadas, adiciona um `EnvironmentFile` protegido e reinicia `carbonautas-bridge`. Execute o script no VPS como administrador após revisar o backup e confirmar o caminho da instalação.

Depois, adicione `OPENAI_API_KEY=...` no arquivo `/etc/carbonautas-bridge/openai.env` usando um editor seguro no próprio VPS, mantenha a permissão `600` e reinicie `carbonautas-bridge`. Não coloque a chave no GitHub, no navegador ou em mensagens. Para trocar o modelo sem editar o código, defina opcionalmente `CARBONAUTAS_AI_MODEL` no mesmo arquivo.

## Publicação do front-end

O carregador `modules/dossier-p132.js` inclui `modules/carbonautas-assistant-p224.js` após o login. Publique os dois arquivos no GitHub Pages junto com o repositório. Sem as rotas no VPS, a Mona mostra uma mensagem de conexão pendente; sem `OPENAI_API_KEY`, a rota devolve status de configuração pendente.
