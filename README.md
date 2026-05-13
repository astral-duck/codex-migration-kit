# Codex Migration Kit

Unofficial, source-first toolkit for moving local Codex state between Windows and macOS.

This repo contains reusable code and documentation only. It does not contain, publish, or request your private Codex payload. Each migration creates a local payload ZIP that you move privately between machines.

## Support Matrix

| Source | Target | Status |
| --- | --- | --- |
| Windows | macOS | V1 supported |
| macOS | Windows | V1 supported |
| Linux | Windows/macOS | Not supported in V1 |
| Cursor | Any | Out of scope |

## Quick Start

Inspect the source machine:

```bash
npx codex-migration-kit inspect
```

Export a standard Codex payload:

```bash
npx codex-migration-kit export --target macos --profile standard
```

Move `codex-migration-payload.zip` privately to the target machine, then restore:

```bash
npx codex-migration-kit restore --payload ./codex-migration-payload.zip
codex --login
```

Use `--profile full` only when you want large Codex log databases included.

## What Is Migrated

The `standard` profile includes Codex configuration, memories, skills, plugin/cache data, sessions, archived sessions, automations, and `state_*.sqlite`.

The `full` profile includes everything in `standard` plus `logs_*.sqlite`.

## What Is Never Migrated

Authentication files, shell/project env files, SSH keys, token-like files, arbitrary workspace folders, project-specific data, Cursor data, and SQLite sidecars are excluded by default.

Run:

```bash
npx codex-migration-kit doctor
```

for common failure explanations.
