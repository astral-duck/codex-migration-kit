import { mkdir, readdir, stat, copyFile, rm, rename } from "node:fs/promises";
import path from "node:path";

export async function walkFiles(root: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(current: string) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        found.push(full);
      }
    }
  }

  await walk(root);
  return found.sort();
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function copyFileEnsuringDir(source: string, target: string): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(source, target);
}

export async function moveToBackupIfExists(target: string): Promise<string | undefined> {
  if (!(await pathExists(target))) return undefined;
  const backup = `${target}.backup-${new Date().toISOString().replace(/[:.]/g, "-")}`;
  await rm(backup, { recursive: true, force: true });
  await mkdir(path.dirname(backup), { recursive: true });
  await rename(target, backup);
  return backup;
}
