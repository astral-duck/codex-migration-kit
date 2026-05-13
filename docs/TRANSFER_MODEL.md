# Transfer Model

Codex Migration Kit uses a ZIP overlay model:

1. Clone or run the public kit on the source machine.
2. Export Codex-only state into a local payload folder.
3. Write `payload/manifest.json` with logical paths, checksums, source OS, target OS, and profile.
4. Store file contents under `payload/chunks/codex-home/...`.
5. Write `payload/checksums.sha256`.
6. Create `codex-migration-payload.zip`.
7. Move the ZIP privately by USB drive, external SSD, AirDrop, or private local network share.
8. Validate the ZIP again on the target machine.
9. Restore on the target machine.
10. Back up the existing target Codex home before copying restored files.
11. Run `codex --login`.

This avoids pushing private state through Git or Git LFS. If GitHub uploads or LFS stalls, the payload can still move through a private file-transfer channel.

See [Local Transfer](LOCAL_TRANSFER.md) for the recommended computer-to-computer handoff.

The standard payload keeps Codex thread/session continuity by including session JSONL files, archived sessions, `session_index.jsonl`, `.codex-global-state.json`, and `state_*.sqlite` while still excluding auth files and SQLite sidecars.

Before restore, `validate` reassembles chunked files in a temporary directory and verifies checksums. `restore --dry-run` uses the same validation path and reports whether an existing target Codex home would be backed up.
