import { mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { copyFileEnsuringDir, moveToBackupIfExists } from "./fs-utils.ts";
import { fromPortablePath } from "./path-profiles.ts";
import { reassembleChunkedFile, verifyFileChecksum } from "./payload.ts";
import { validatePayload } from "./validate.ts";
import type { Manifest, OsProfile } from "./types.ts";

export type RestoreOptions = {
  payloadRoot: string;
  targetOs: OsProfile;
  targetCodexHome: string;
};

export type RestoreResult = {
  restoredFiles: number;
  backupDir?: string;
};

export async function restoreCodexHome(options: RestoreOptions): Promise<RestoreResult> {
  const payloadDir = path.join(options.payloadRoot, "payload");
  const manifest = JSON.parse(await readFile(path.join(payloadDir, "manifest.json"), "utf8")) as Manifest;
  const validation = await validatePayload(options.payloadRoot);
  if (!validation.ok) {
    throw new Error(validation.errors.join("\n"));
  }
  const backupDir = await moveToBackupIfExists(options.targetCodexHome);
  await mkdir(options.targetCodexHome, { recursive: true });

  for (const file of manifest.files) {
    const chunkDir = path.join(payloadDir, "chunks", "codex-home", ...file.logicalPath.split("/"));
    const tempTarget = path.join(options.targetCodexHome, ".restore-tmp", ...file.logicalPath.split("/"));
    await reassembleChunkedFile(chunkDir, tempTarget);
    await verifyFileChecksum(tempTarget, file.checksum);
    await copyFileEnsuringDir(tempTarget, fromPortablePath(options.targetCodexHome, file.logicalPath));
  }

  await rm(path.join(options.targetCodexHome, ".restore-tmp"), { recursive: true, force: true });
  return { restoredFiles: manifest.files.length, backupDir };
}
