# Normalization

The manifest does not store machine-specific absolute paths as restore targets.

## Source Profiles

Windows Codex home:

```text
%USERPROFILE%\.codex
```

macOS Codex home:

```text
~/.codex
```

## Manifest Paths

Paths are stored relative to Codex home:

```text
sessions/2026/example.jsonl
session_index.jsonl
.codex-global-state.json
memories/MEMORY.md
state_5.sqlite
```

Restore maps those logical paths to the target Codex home for the current OS. V1 does not rewrite SQLite rows or session file contents.
