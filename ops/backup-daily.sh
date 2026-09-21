#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${GOOGLE_APPLICATION_CREDENTIALS:?Falta credencial local do Firebase}"
: "${RESTIC_REPOSITORY:?Defina o repositório externo criptografado de backup}"
: "${RESTIC_PASSWORD_FILE:?Defina o arquivo local com a senha do backup}"
# Offsite is mandatory: a directory on the same VPS is not protection against VPS loss.
case "$RESTIC_REPOSITORY" in s3:*|gs:*|sftp:*|rest:https://*|azure:*|b2:*) ;; *) echo 'Use um destino externo suportado pelo restic.' >&2; exit 1;; esac
command -v restic >/dev/null
command -v node >/dev/null
mkdir -p /var/lib/carbonautas-backup
exec 9>/var/lib/carbonautas-backup/run.lock
flock -n 9 || exit 0
backup_stage=$(mktemp -d /var/lib/carbonautas-backup/stage.XXXXXX)
trap 'rm -rf -- "$backup_stage"' EXIT
backup_tools=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
# This fails early if the repository is unavailable or the password is wrong.
restic snapshots --json > /dev/null
node "$backup_tools/backup.cjs" export "$backup_stage/data"
node "$backup_tools/backup.cjs" verify "$backup_stage/data"
# Stable path inside snapshots and actual server source/config, encrypted by restic.
(cd "$backup_stage" && restic backup --tag carbonautas data /opt/carbonautas-bridge /etc/caddy /etc/systemd/system/carbonautas-bridge.service)
restic check
# Record success only after export, upload and repository metadata integrity succeed.
date --iso-8601=seconds > /var/lib/carbonautas-backup/last-success.txt
# No automatic forget/prune: retention needs a deliberate choice after real restore validation.
