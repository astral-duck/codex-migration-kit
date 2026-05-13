import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    createReadStream(filePath)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolve);
  });
  return hash.digest("hex");
}

export async function chunkFile(source: string, chunksDir: string, chunkSizeBytes = 64 * 1024 * 1024): Promise<string[]> {
  await mkdir(chunksDir, { recursive: true });
  const chunks: string[] = [];
  const input = createReadStream(source, { highWaterMark: chunkSizeBytes });
  let index = 1;

  for await (const chunk of input) {
    const partPath = path.join(chunksDir, `part-${String(index).padStart(3, "0")}`);
    await writeFile(partPath, chunk);
    chunks.push(partPath);
    index += 1;
  }

  if (chunks.length === 0) {
    const partPath = path.join(chunksDir, "part-001");
    await writeFile(partPath, "");
    chunks.push(partPath);
  }

  return chunks;
}

export async function reassembleChunkedFile(chunksDir: string, target: string): Promise<void> {
  await mkdir(path.dirname(target), { recursive: true });
  const parts = (await readdir(chunksDir)).filter((name) => name.startsWith("part-")).sort();
  await new Promise<void>(async (resolve, reject) => {
    const output = createWriteStream(target);
    output.on("error", reject);
    output.on("finish", resolve);

    try {
      for (const part of parts) {
        const buffer = await readFile(path.join(chunksDir, part));
        if (!output.write(buffer)) {
          await new Promise((drainResolve) => output.once("drain", drainResolve));
        }
      }
      output.end();
    } catch (error) {
      output.destroy();
      reject(error);
    }
  });
}

export async function writeChecksums(files: { logicalPath: string; checksum: string }[], target: string): Promise<void> {
  const lines = files
    .slice()
    .sort((a, b) => a.logicalPath.localeCompare(b.logicalPath))
    .map((file) => `${file.checksum}  ${file.logicalPath}`)
    .join("\n");
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${lines}\n`);
}

export async function verifyFileChecksum(filePath: string, expected: string): Promise<void> {
  const actual = await sha256File(filePath);
  if (actual !== expected) {
    throw new Error(`Checksum mismatch for ${filePath}: expected ${expected}, got ${actual}`);
  }
}

export async function fileSize(filePath: string): Promise<number> {
  return (await stat(filePath)).size;
}
