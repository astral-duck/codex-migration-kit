# Contributing

Codex Migration Kit is privacy-sensitive software. Migration safety is part of the feature, not a separate concern.

## Before You Change Behavior

Read [AGENTS.md](AGENTS.md) and [SECURITY.md](SECURITY.md).

## Local Checks

Run:

```bash
npm test
npm run check:personal-data
npm pack --dry-run
```

## Pull Requests

- Keep changes Codex-only unless the project explicitly adds another migration adapter.
- Do not commit generated payloads or real user data.
- Add tests for export, restore, validation, path normalization, or exclusion behavior changes.
- Update docs when commands or safety behavior changes.

