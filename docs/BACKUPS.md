# Backups y recuperación

Backup diario recomendado:

```bash
mysqldump --single-transaction --routines --triggers enlazate | gzip > /var/backups/enlazate-$(date +%F).sql.gz
```

Conservar copias cifradas fuera del VPS y probar una restauración mensualmente:

```bash
gunzip -c enlazate-2026-01-01.sql.gz | mysql enlazate
```

Respaldar también `storage/uploads`, sin incluir `.env`. Mantener al menos 7 copias diarias, 4 semanales y 3 mensuales.
