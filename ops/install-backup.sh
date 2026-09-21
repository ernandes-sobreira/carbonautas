#!/usr/bin/env bash
# Run only on the VPS after /etc/carbonautas-backup.env and offsite restic repo exist.
set -euo pipefail
[ "$(id -u)" = 0 ] || { echo 'Execute como root no VPS.' >&2; exit 1; }
command -v restic >/dev/null || { echo 'Instale o restic pelo gerenciador de pacotes do Ubuntu.' >&2; exit 1; }
[ -s /etc/carbonautas-backup.env ] || { echo 'Preencha primeiro /etc/carbonautas-backup.env com base em backup.env.example.' >&2; exit 1; }
chmod 600 /etc/carbonautas-backup.env
backup_source=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
install -d -m 700 /opt/carbonautas-backup /var/lib/carbonautas-backup /root/.cache/restic
for backup_file in backup.cjs backup-daily.sh; do
 if [ "$backup_source/$backup_file" != "/opt/carbonautas-backup/$backup_file" ]; then install -m 700 "$backup_source/$backup_file" "/opt/carbonautas-backup/$backup_file"; fi
done
install -m 644 "$backup_source/carbonautas-backup.service" /etc/systemd/system/carbonautas-backup.service
install -m 644 "$backup_source/carbonautas-backup.timer" /etc/systemd/system/carbonautas-backup.timer
systemctl daemon-reload
# Do not enable a daily job that has never completed successfully.
systemctl start carbonautas-backup.service
systemctl enable --now carbonautas-backup.timer
systemctl list-timers carbonautas-backup.timer --no-pager
