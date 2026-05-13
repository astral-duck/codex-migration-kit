# Security

Codex Migration Kit is designed around a private payload model.

The public repo contains only scripts, docs, tests, and examples. The generated payload is local to the user and should be moved through a private channel.

Recommended transfer channels are USB/external drive, AirDrop where available, or a trusted private local network share. Do not push generated payloads to Git or Git LFS.

## Always Excluded

- `auth.json`
- `cap_sid`
- `installation_id`
- `.env` and `.env.*`
- SSH private keys and PEM/key files
- token, secret, credential, or password-like files
- SQLite `-wal` and `-shm` sidecars
- arbitrary workspace folders
- project env files
- Cursor data

V1 intentionally has no `--include-auth` option. After restore, run:

```bash
codex --login
```

on the target machine.

## Reporting Issues

If you find a path that should be excluded but is not, treat any generated payload as sensitive and open an issue without attaching private files.
