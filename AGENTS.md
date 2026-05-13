# Agent Instructions

This repository is an unofficial, public Codex migration kit. Treat privacy and recoverability as product requirements, not optional hardening.

## Scope

- Keep this repo Codex-only.
- Do not add Cursor migration, workspace migration, project env restore, or arbitrary folder sync to V1.
- Do not commit generated payloads, real `.codex` directories, auth files, logs from a real user, or machine-specific paths.
- Keep all examples generic.

## Security Rules

- Never add an `--include-auth` option.
- Always exclude `auth.json`, `cap_sid`, `installation_id`, `.env*`, private keys, token/secret/credential/password-like files, and SQLite `-wal`/`-shm` sidecars.
- Restore must validate payload paths and checksums before moving or replacing an existing target Codex home.
- Restore must back up existing target state before copying files.
- Generated payloads are private local artifacts and must never be pushed to Git.

## Development

- Use Node 24 or newer.
- Keep CLI behavior source-first and auditable.
- Prefer small modules with focused responsibilities:
  - path profiles and normalization
  - security classification
  - payload chunking/checksums
  - export
  - restore
  - validation
  - CLI glue
- Add tests before changing migration behavior.

## Verification

Run these before calling work complete:

```bash
npm test
npm run check:personal-data
npm --cache /private/tmp/npm-cache pack --dry-run
```

For CLI smoke checks:

```bash
node bin/codex-migrate.js inspect
node bin/codex-migrate.js doctor
```

## Documentation

- Update `README.md` when commands or support status changes.
- Update `SECURITY.md` when exclusion rules change.
- Update `docs/TRANSFER_MODEL.md` and `docs/LOCAL_TRANSFER.md` when payload movement changes.
- Keep prompts generic and free of user-specific names, repo names, or local paths.

## Release Readiness

- CI must pass on macOS, Windows, and Linux.
- A public release should include a tag, changelog entry, and package dry-run evidence.
- Before claiming Windows support beyond fixture tests, run a real Windows export/restore smoke test.
