import assert from "node:assert/strict";
import test from "node:test";
import { defaultCodexHome, normalizeForManifest, resolveBucketTarget } from "../src/path-profiles.ts";

test("resolves default Codex homes for Windows and macOS", () => {
  assert.equal(defaultCodexHome("windows", "C:\\Users\\Ada"), "C:\\Users\\Ada\\.codex");
  assert.equal(defaultCodexHome("macos", "/Users/ada"), "/Users/ada/.codex");
});

test("normalizes paths into portable manifest paths without machine-specific roots", () => {
  assert.equal(
    normalizeForManifest("windows", "C:\\Users\\Ada\\.codex\\sessions\\2026\\rollout.jsonl"),
    "sessions/2026/rollout.jsonl",
  );
  assert.equal(
    normalizeForManifest("macos", "/Users/ada/.codex/memories/MEMORY.md"),
    "memories/MEMORY.md",
  );
});

test("resolves logical bucket targets on the destination OS", () => {
  assert.equal(resolveBucketTarget("macos", "/Users/ada", "sessions/2026/a.jsonl"), "/Users/ada/.codex/sessions/2026/a.jsonl");
  assert.equal(resolveBucketTarget("windows", "C:\\Users\\Ada", "state_5.sqlite"), "C:\\Users\\Ada\\.codex\\state_5.sqlite");
});
