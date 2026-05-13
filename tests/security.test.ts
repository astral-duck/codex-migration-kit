import assert from "node:assert/strict";
import test from "node:test";
import { classifyPath, shouldExcludePath } from "../src/security.ts";

test("always excludes auth files, env files, key files, token files, and sqlite sidecars", () => {
  const excluded = [
    "auth.json",
    "cap_sid",
    "installation_id",
    ".env",
    ".env.local",
    "id_rsa",
    "private.pem",
    "github_token.txt",
    "state_5.sqlite-wal",
    "state_5.sqlite-shm",
  ];

  for (const file of excluded) {
    assert.equal(shouldExcludePath(file), true, `${file} should be excluded`);
  }
});

test("classifies standard, full-only, and unsupported Codex paths", () => {
  assert.equal(classifyPath("config.toml"), "standard");
  assert.equal(classifyPath("memories/MEMORY.md"), "standard");
  assert.equal(classifyPath("sessions/2026/rollout.jsonl"), "standard");
  assert.equal(classifyPath("state_5.sqlite"), "standard");
  assert.equal(classifyPath("logs_2.sqlite"), "full");
  assert.equal(classifyPath("random-workspace/.env"), "excluded");
  assert.equal(classifyPath("../outside"), "excluded");
});
