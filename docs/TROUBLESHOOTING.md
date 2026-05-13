# Troubleshooting

## GitHub or Git LFS Uploads Stall

Do not push payloads to Git. Use the generated ZIP overlay and transfer it privately.

## Locked SQLite Sidecars

Files ending in `-wal` or `-shm` are excluded. They are SQLite sidecars and can be recreated by the application.

## Large Logs

`logs_*.sqlite` files can be large. Use the `standard` profile unless you specifically need logs.

## Existing Target State

Restore moves an existing target Codex home to a timestamped backup before copying restored files.

## Cloud-Synced Folders

Avoid generating private payloads directly inside cloud-synced folders. Move the final ZIP through a channel you trust.
