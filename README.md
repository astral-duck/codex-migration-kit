# Codex Migration Kit

Unofficial, source-first toolkit for moving local Codex state between Windows and macOS.

This repo contains reusable code and documentation only. It does not contain, publish, or request your private Codex payload. Each migration creates a local payload ZIP that you move privately between machines.

Codex internals can change. Run `inspect`, `validate`, and `doctor` before relying on a restored environment.

## Support Matrix

| Source | Target | Status |
| --- | --- | --- |
| Windows | macOS | V1 supported |
| macOS | Windows | V1 supported |
| Linux | Windows/macOS | Not supported in V1 |
| Cursor | Any | Out of scope |

## Quick Start

Use Node 24 or newer.

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

## Running From A Git Clone

Before this package is published to npm, clone the public repo and run the CLI directly:

```bash
git clone <repo-url>
cd codex-migration-kit
node bin/codex-migrate.js inspect
node bin/codex-migrate.js export --target macos --profile standard
```

Replace `macos` with `windows` when exporting from macOS to a Windows target.

## Best File Transfer Method

The generated `codex-migration-payload.zip` is private. The best path is direct local transfer:

1. Export on the source computer.
2. Validate the ZIP on the source computer.
3. Move the ZIP by USB drive, external SSD, AirDrop, or private local network share.
4. Validate the ZIP again on the target computer.
5. Restore on the target computer.
6. Run `codex --login` on the target computer.

Avoid Git, Git LFS, public file hosts, issue uploads, and email attachments for generated payloads. See [Local Transfer](docs/LOCAL_TRANSFER.md) for the detailed handoff model.

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

## Agentic Development

Agents working in this repo should read [AGENTS.md](AGENTS.md) before making changes. The most important rule is that privacy protections are part of the product contract: restore must validate before mutation, auth must stay excluded, and generated payloads must never be committed.
