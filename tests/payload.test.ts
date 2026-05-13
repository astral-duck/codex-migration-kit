import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { chunkFile, reassembleChunkedFile, sha256File, writeChecksums } from "../src/payload.ts";

test("chunks, reassembles, and verifies file checksums", async () => {
  const root = await mkdtemp(path.join(tmpdir(), "codex-payload-"));
  try {
    const source = path.join(root, "source.bin");
    const chunksDir = path.join(root, "chunks");
    const restored = path.join(root, "restored.bin");
    await writeFile(source, "abcdefghijklmnopqrstuvwxyz");

    const chunks = await chunkFile(source, chunksDir, 10);
    assert.deepEqual(chunks.map((chunk) => path.basename(chunk)), ["part-001", "part-002", "part-003"]);

    await reassembleChunkedFile(chunksDir, restored);
    assert.equal(await readFile(restored, "utf8"), "abcdefghijklmnopqrstuvwxyz");

    const checksum = await sha256File(restored);
    await writeChecksums([{ logicalPath: "state_5.sqlite", checksum }], path.join(root, "checksums.sha256"));
    const checksumFile = await readFile(path.join(root, "checksums.sha256"), "utf8");
    assert.match(checksumFile, /state_5\.sqlite/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
