import { copyFile, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
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
    summary: {
      includedFiles: 0,
      excludedFiles: 0,
      totalBytes: 0,
      transferModel: "local-zip-overlay",
    },
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

    const staged = await stageSourceFile(source, logicalPath, pathClass);
    const exportLogicalPath = staged.logicalPath;
    const chunksDir = path.join(chunksRoot, ...toPortablePath(exportLogicalPath).split("/"));
    const chunkPaths = await chunkFile(staged.sourcePath, chunksDir, options.chunkSizeBytes);
    manifest.files.push({
      logicalPath: exportLogicalPath,
      restorePath: staged.restorePath,
      checksum: await sha256File(staged.sourcePath),
      size: await fileSize(staged.sourcePath),
      chunks: chunkPaths.map((chunk) => toPortablePath(path.relative(payloadDir, chunk))),
      transforms: staged.transforms,
    });
    await staged.cleanup?.();
  }

  manifest.files.sort((a, b) => a.logicalPath.localeCompare(b.logicalPath));
  manifest.excluded.sort();
  manifest.summary.includedFiles = manifest.files.length;
  manifest.summary.excludedFiles = manifest.excluded.length;
  manifest.summary.totalBytes = manifest.files.reduce((sum, file) => sum + file.size, 0);
  await writeFile(path.join(payloadDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeChecksums(manifest.files, path.join(payloadDir, "checksums.sha256"));
  return manifest;
}

async function stageSourceFile(sourcePath: string, logicalPath: string, pathClass: string): Promise<{
  sourcePath: string;
  logicalPath: string;
  restorePath?: string;
  transforms?: string[];
  cleanup?: () => Promise<void>;
}> {
  if (pathClass !== "full" || !/^logs_\d+\.sqlite$/i.test(path.basename(logicalPath))) {
    return { sourcePath, logicalPath };
  }

  const stagedPath = path.join(tmpdir(), `codex-migration-${path.basename(logicalPath)}-${process.pid}.copy`);
  await copyFile(sourcePath, stagedPath);
  return {
    sourcePath: stagedPath,
    logicalPath: `${logicalPath}.copy`,
    restorePath: logicalPath,
    transforms: ["sqlite-vacuum-copy"],
    cleanup: () => rm(stagedPath, { force: true }),
  };
}
