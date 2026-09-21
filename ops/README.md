# Proteção de dados do Carbonautas

## Estado real

O código de backup está preparado e testado com dados sintéticos. **Não está instalado nem agendado no VPS e nenhuma cópia dos dados reais foi feita nesta intervenção.** O console do Firebase retornou HTTP 502 neste ambiente; não houve acesso ao servidor. O teste anterior do bridge P16, informado no histórico de 20/09/2026, foi preservado. Não foi reinstalado nem substituído o `server.js`.

O relatório Excel do aplicativo continua disponível, mas não é chamado de backup: contém apenas parte dos campos, sem os bytes das fotos/documentos.

## O que a rotina copia

- Todas as coleções de primeiro nível `rede_*` e suas subcoleções, inclusive sob documentos pais ausentes.
- Todos os objetos atuais cujo nome começa com `rede_` no bucket `brasa-pantanal.firebasestorage.app`: fotos, anexos e documentos. URLs externas não são baixadas.
- Tipos Firestore (timestamps com nanossegundos, referências, geopontos e bytes), IDs, caminhos e metadados de objetos.
- Arquivos do bridge, configuração Caddy e unidade systemd, dentro do snapshot criptografado restic. Não substituir o bridge pelo código histórico em `vps/`.

O exportador não copia senhas/contas do Firebase Authentication, regras publicadas, índices, IAM, versões antigas já apagadas do Storage ou alterações ainda não salvas no ONLYOFFICE. O Git preserva as regras e o aplicativo. Para recuperação integral de infraestrutura, guardar também a configuração efetiva do Storage/IAM e o backup do Firebase Authentication por ferramenta administrativa autorizada. Não há promessa de recuperação total sem esses itens.

A leitura ocorre ao longo do tempo, não em uma única transação entre Firestore e Storage. Arquivos são lidos pela geração identificada; se uma geração sumir durante a cópia, a execução falha em vez de indicar sucesso. Para uma restauração consistente de todo o grupo, executar em período sem edições ou adotar também backup nativo/PITR do Firestore. Não modificar as coleções dos outros sistemas do projeto.

## Ativação única no VPS

1. Escolher um destino **externo e privado** para o restic (S3 compatível, Google Cloud Storage separado, SFTP, entre outros). O utilitário não cria nem contrata serviços. Não usar GitHub nem o disco do próprio VPS como única cópia.
2. Instalar `restic` pelo gerenciador de pacotes do Ubuntu. Copiar os arquivos desta pasta para `/opt/carbonautas-backup/`.
3. Criar `/etc/carbonautas-backup.env` a partir de `backup.env.example`, com o destino real e credenciais necessárias; modo `600`. Usar a credencial já existente do bridge, sem a enviar ao chat ou ao repositório.
4. Criar o arquivo privado de senha do restic, modo `600`, e guardar uma segunda cópia da senha fora do VPS. Inicializar o repositório externo uma vez com `restic init` usando essas variáveis. Um destino previamente existente deve ser reutilizado, nunca reinicializado para contornar erro de senha.
5. Executar `bash /opt/carbonautas-backup/install-backup.sh`. O instalador só ativa o agendamento depois de a primeira cópia e a verificação de metadados concluírem. Não reinicia o bridge.

O timer agenda diariamente às 03h de Cuiabá, com até 10 minutos de variação. A frequência só oferece essa janela de recuperação após ativação e execuções bem-sucedidas. O programa não remove backups antigos automaticamente. Definir retenção/custos após o primeiro teste real de restauração. É preciso manter espaço livre no VPS para uma exportação completa e custos de leituras/downloads/armazenamento no destino.

## Conferir a execução, sem repetir os testes do editor

```sh
systemctl status carbonautas-backup.service --no-pager
systemctl list-timers carbonautas-backup.timer --no-pager
journalctl -u carbonautas-backup.service -n 40 --no-pager
cat /var/lib/carbonautas-backup/last-success.txt
```

`last-success.txt` só avança após exportar, verificar hashes, enviar ao destino e executar `restic check`. Esse comando verifica metadados; o teste de restauração abaixo verifica os bytes. Um serviço instalado não equivale a backup funcionando. Acompanhar falhas e data da última execução; alerta externo ainda não foi configurado.

## Restauração segura

Carregar as variáveis privadas no terminal do VPS. Listar snapshots com `restic snapshots --tag carbonautas`. Selecionar explicitamente o ID e extrair em uma pasta nova (nunca sobre o servidor ativo):

```sh
restic restore ID_DO_SNAPSHOT --target /var/lib/carbonautas-backup/ensaio --verify
node /opt/carbonautas-backup/backup.cjs verify /var/lib/carbonautas-backup/ensaio/data
node /opt/carbonautas-backup/backup.cjs restore-missing /var/lib/carbonautas-backup/ensaio/data
```

O último comando apenas mostra o plano, sem conectar ao Firebase. Confirmar o caminho `data` conforme a listagem do snapshot. Primeiro conferir fotos/documentos extraídos e contagens. Para recuperar itens **ausentes** no projeto original, após examinar esse plano:

```sh
node /opt/carbonautas-backup/backup.cjs restore-missing /var/lib/carbonautas-backup/ensaio/data --apply --confirm=brasa-pantanal
```

Essa operação nunca sobrescreve itens existentes: documentos usam `create`, objetos usam precondição `ifGenerationMatch: 0`. Se o objetivo for reverter um documento alterado que ainda existe, fazer uma recuperação seletiva separada; não apagar o documento para forçar esse comando. A rotina não restaura automaticamente autenticação, regras, índices ou o servidor. Os arquivos de configuração extraídos são referência privada para recuperação, não scripts para execução cega.

## Bases técnicas

- [Firebase: testes de regras](https://firebase.google.com/docs/rules/unit-tests)
- [Firestore: backup e restauração nativos](https://firebase.google.com/docs/firestore/backups)
- [Restic: repositório criptografado](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html)
- [Restic: restauração e verificação](https://restic.readthedocs.io/en/stable/050_restore.html)
