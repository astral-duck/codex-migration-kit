import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runPreflight } from "../src/preflight.ts";

test("preflight reports codex home, payload profile, transfer guidance, and warnings", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "codex-preflight-"));
  try {
    const codexHome = path.join(root, ".codex");
    await mkdir(codexHome, { recursive: true });
    await writeFile(path.join(codexHome, "config.toml"), "model = \"gpt\"\n");
    await writeFile(path.join(codexHome, "auth.json"), "secret\n");
    await writeFile(path.join(codexHome, "logs_2.sqlite"), "large logs\n");

    const result = await runPreflight({
      sourceOs: "macos",
      targetOs: "windows",
      codexHome,
      profile: "standard",
    });

    assert.equal(result.ok, true);
    assert.equal(result.codexHome, codexHome);
    assert.equal(result.profile, "standard");
    assert.equal(result.transfer, "local-zip-overlay");
    assert.equal(result.warnings.some((warning) => warning.includes("auth files will be excluded")), true);
    assert.equal(result.warnings.some((warning) => warning.includes("logs_*.sqlite")), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
