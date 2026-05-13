import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { exportCodexHome } from "../src/exporter.ts";
import { restoreCodexHome } from "../src/restore.ts";

async function createFixtureCodexHome(root: string) {
  const codexHome = path.join(root, ".codex");
  await mkdir(path.join(codexHome, "sessions", "2026"), { recursive: true });
  await mkdir(path.join(codexHome, "memories"), { recursive: true });
  await mkdir(path.join(codexHome, "plugins", "cache"), { recursive: true });
  await mkdir(path.join(codexHome, "rules"), { recursive: true });
  await mkdir(path.join(codexHome, "cache", "codex_apps_tools"), { recursive: true });
  await mkdir(path.join(codexHome, "shell_snapshots"), { recursive: true });
  await mkdir(path.join(codexHome, "vendor_imports", "skills"), { recursive: true });
  await writeFile(path.join(codexHome, "config.toml"), "model = \"gpt\"\n");
  await writeFile(path.join(codexHome, ".codex-global-state.json"), "{}\n");
  await writeFile(path.join(codexHome, "models_cache.json"), "[]\n");
  await writeFile(path.join(codexHome, "session_index.jsonl"), "{}\n");
  await writeFile(path.join(codexHome, "memories", "MEMORY.md"), "public fixture memory\n");
  await writeFile(path.join(codexHome, "sessions", "2026", "rollout.jsonl"), "{}\n");
  await writeFile(path.join(codexHome, "rules", "default.rules"), "rule\n");
  await writeFile(path.join(codexHome, "cache", "codex_apps_tools", "tool.json"), "{}\n");
  await writeFile(path.join(codexHome, "shell_snapshots", "thread.sh"), "echo fixture\n");
  await writeFile(path.join(codexHome, "vendor_imports", "skills", "skill.json"), "{}\n");
  await writeFile(path.join(codexHome, "state_5.sqlite"), "sqlite-state");
  await writeFile(path.join(codexHome, "logs_2.sqlite"), "sqlite-logs");
  await writeFile(path.join(codexHome, "auth.json"), "secret");
  await writeFile(path.join(codexHome, ".env"), "SECRET=1");
  return codexHome;
}

test("exports standard payload and restores it across OS profiles without secrets or logs", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "codex-export-standard-"));
  try {
    const sourceHome = await createFixtureCodexHome(path.join(root, "source"));
    const payloadRoot = path.join(root, "payload-standard");
    await exportCodexHome({
      sourceOs: "windows",
      targetOs: "macos",
      sourceCodexHome: sourceHome,
      outputDir: payloadRoot,
      profile: "standard",
      chunkSizeBytes: 8,
    });

    const manifest = JSON.parse(await readFile(path.join(payloadRoot, "payload", "manifest.json"), "utf8"));
    assert.equal(manifest.profile, "standard");
    assert.equal(manifest.files.some((file: { logicalPath: string }) => file.logicalPath === "logs_2.sqlite"), false);
    assert.equal(manifest.files.some((file: { logicalPath: string }) => file.logicalPath === "auth.json"), false);
    assert.equal(manifest.files.some((file: { logicalPath: string }) => file.logicalPath === ".env"), false);
    assert.equal(manifest.files.some((file: { logicalPath: string }) => file.logicalPath === "session_index.jsonl"), true);
    assert.equal(manifest.files.some((file: { logicalPath: string }) => file.logicalPath === ".codex-global-state.json"), true);
    assert.equal(manifest.files.some((file: { logicalPath: string }) => file.logicalPath === "rules/default.rules"), true);
    assert.equal(manifest.files.some((file: { logicalPath: string }) => file.logicalPath === "cache/codex_apps_tools/tool.json"), true);

    const targetHome = path.join(root, "target", ".codex");
    await restoreCodexHome({
      payloadRoot,
      targetOs: "macos",
      targetCodexHome: targetHome,
    });

    assert.equal(await readFile(path.join(targetHome, "config.toml"), "utf8"), "model = \"gpt\"\n");
    assert.equal(await readFile(path.join(targetHome, "session_index.jsonl"), "utf8"), "{}\n");
    assert.equal(await readFile(path.join(targetHome, "rules", "default.rules"), "utf8"), "rule\n");
    assert.equal(await readFile(path.join(targetHome, "shell_snapshots", "thread.sh"), "utf8"), "echo fixture\n");
    assert.equal(await readFile(path.join(targetHome, "state_5.sqlite"), "utf8"), "sqlite-state");
    await assert.rejects(readFile(path.join(targetHome, "logs_2.sqlite"), "utf8"));
    await assert.rejects(readFile(path.join(targetHome, "auth.json"), "utf8"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("exports full payload with logs and restores macOS to Windows fixture with backup", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "codex-export-full-"));
  try {
    const sourceHome = await createFixtureCodexHome(path.join(root, "source"));
    const payloadRoot = path.join(root, "payload-full");
    await exportCodexHome({
      sourceOs: "macos",
      targetOs: "windows",
      sourceCodexHome: sourceHome,
      outputDir: payloadRoot,
      profile: "full",
      chunkSizeBytes: 8,
    });

    const manifest = JSON.parse(await readFile(path.join(payloadRoot, "payload", "manifest.json"), "utf8"));
    assert.equal(manifest.profile, "full");
    assert.equal(manifest.files.some((file: { logicalPath: string }) => file.logicalPath === "logs_2.sqlite"), true);

    const targetHome = path.join(root, "target", ".codex");
    await mkdir(targetHome, { recursive: true });
    await writeFile(path.join(targetHome, "config.toml"), "old = true\n");
    const result = await restoreCodexHome({
      payloadRoot,
      targetOs: "windows",
      targetCodexHome: targetHome,
    });

    assert.match(result.backupDir, /\.backup-/);
    assert.equal(await readFile(path.join(targetHome, "logs_2.sqlite"), "utf8"), "sqlite-logs");
    assert.equal(await readFile(path.join(targetHome, "config.toml"), "utf8"), "model = \"gpt\"\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("restore rejects unsafe manifest paths before moving the target home", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "codex-unsafe-restore-"));
  try {
    const payloadRoot = path.join(root, "payload-root");
    await mkdir(path.join(payloadRoot, "payload", "chunks", "codex-home", "..", "escape"), { recursive: true });
    await writeFile(path.join(payloadRoot, "payload", "manifest.json"), JSON.stringify({
      schemaVersion: 1,
      tool: "codex-migration-kit",
      createdAt: new Date().toISOString(),
      sourceOs: "windows",
      targetOs: "macos",
      profile: "standard",
      files: [{
        logicalPath: "../escape",
        checksum: "bad",
        size: 3,
        chunks: ["chunks/codex-home/../escape/part-001"],
      }],
      excluded: [],
      notes: [],
    }, null, 2));
    await writeFile(path.join(payloadRoot, "payload", "checksums.sha256"), "bad  ../escape\n");
    await writeFile(path.join(payloadRoot, "payload", "chunks", "codex-home", "..", "escape", "part-001"), "bad");

    const targetHome = path.join(root, "target", ".codex");
    await mkdir(targetHome, { recursive: true });
    await writeFile(path.join(targetHome, "config.toml"), "old = true\n");

    await assert.rejects(
      restoreCodexHome({ payloadRoot, targetOs: "macos", targetCodexHome: targetHome }),
      /Unsafe|Forbidden|Checksum/,
    );
    assert.equal(await readFile(path.join(targetHome, "config.toml"), "utf8"), "old = true\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("restore verifies checksums before moving existing target state", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "codex-corrupt-restore-"));
  try {
    const sourceHome = await createFixtureCodexHome(path.join(root, "source"));
    const payloadRoot = path.join(root, "payload");
    await exportCodexHome({
      sourceOs: "windows",
      targetOs: "macos",
      sourceCodexHome: sourceHome,
      outputDir: payloadRoot,
      profile: "standard",
      chunkSizeBytes: 8,
    });
    await writeFile(path.join(payloadRoot, "payload", "chunks", "codex-home", "config.toml", "part-001"), "corrupt");

    const targetHome = path.join(root, "target", ".codex");
    await mkdir(targetHome, { recursive: true });
    await writeFile(path.join(targetHome, "config.toml"), "old = true\n");

    await assert.rejects(
      restoreCodexHome({ payloadRoot, targetOs: "macos", targetCodexHome: targetHome }),
      /Checksum verification failed/,
    );
    assert.equal(await readFile(path.join(targetHome, "config.toml"), "utf8"), "old = true\n");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
