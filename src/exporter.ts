import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { walkFiles } from "./fs-utils.ts";
import { normalizeForManifest, toPortablePath } from "./path-profiles.ts";
import { chunkFile, fileSize, sha256File, writeChecksums } from "./payload.ts";
import { classifyPath } from "./security.ts";
import type { Manifest, OsProfile, PayloadProfile } from "./types.ts";

export type ExportOptions = {
  sourceOs: OsProfile;
  targetOs: OsProfile;
  sourceCodexHome: string;
  outputDir: string;
  profile: PayloadProfile;
  chunkSizeBytes?: number;
};

export async function exportCodexHome(options: ExportOptions): Promise<Manifest> {
  const payloadDir = path.join(options.outputDir, "payload");
  const chunksRoot = path.join(payloadDir, "chunks", "codex-home");
  await rm(payloadDir, { recursive: true, force: true });
  await mkdir(chunksRoot, { recursive: true });

  const manifest: Manifest = {
    schemaVersion: 1,
    tool: "codex-migration-kit",
    createdAt: new Date().toISOString(),
    sourceOs: options.sourceOs,
    targetOs: options.targetOs,
    profile: options.profile,
    files: [],
    excluded: [],
    notes: [
      "Auth files are intentionally excluded. Run codex --login on the target machine after restore.",
      "Codex internals may change; inspect and validate before relying on restored state.",
    ],
  };

  const sourceFiles = await walkFiles(options.sourceCodexHome);
  for (const source of sourceFiles) {
    const logicalPath = normalizeForManifest(options.sourceOs, source, options.sourceCodexHome);
    const pathClass = classifyPath(logicalPath);
    if (pathClass === "excluded" || (pathClass === "full" && options.profile !== "full")) {
      manifest.excluded.push(logicalPath);
      continue;
    }

    const chunksDir = path.join(chunksRoot, ...toPortablePath(logicalPath).split("/"));
    const chunkPaths = await chunkFile(source, chunksDir, options.chunkSizeBytes);
    manifest.files.push({
      logicalPath,
      checksum: await sha256File(source),
      size: await fileSize(source),
      chunks: chunkPaths.map((chunk) => toPortablePath(path.relative(payloadDir, chunk))),
    });
  }

  manifest.files.sort((a, b) => a.logicalPath.localeCompare(b.logicalPath));
  manifest.excluded.sort();
  await writeFile(path.join(payloadDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeChecksums(manifest.files, path.join(payloadDir, "checksums.sha256"));
  return manifest;
}
