import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fromPortablePath } from "./path-profiles.ts";
import { reassembleChunkedFile, verifyFileChecksum } from "./payload.ts";
import { classifyPath, shouldExcludePath } from "./security.ts";
import type { Manifest } from "./types.ts";

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  fileCount: number;
};

export async function validatePayload(payloadRoot: string): Promise<ValidationResult> {
  const tempRoot = await mkdtemp(path.join(tmpdir(), "codex-migration-validate-"));
  const manifestPath = path.join(payloadRoot, "payload", "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as Manifest;
  const errors: string[] = [];

  try {
    for (const file of manifest.files) {
      if (shouldExcludePath(file.logicalPath) || classifyPath(file.logicalPath) === "excluded") {
        errors.push(`Forbidden file included in manifest: ${file.logicalPath}`);
        continue;
      }
      if (!file.checksum || file.chunks.length === 0) {
        errors.push(`Incomplete manifest entry: ${file.logicalPath}`);
        continue;
      }
      try {
        const chunkDir = path.join(payloadRoot, "payload", "chunks", "codex-home", ...file.logicalPath.split("/"));
        const assembled = fromPortablePath(tempRoot, file.logicalPath);
        await reassembleChunkedFile(chunkDir, assembled);
        await verifyFileChecksum(assembled, file.checksum);
      } catch (error) {
        errors.push(`Checksum verification failed for ${file.logicalPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }

  return { ok: errors.length === 0, errors, fileCount: manifest.files.length };
}
