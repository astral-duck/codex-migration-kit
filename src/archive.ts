import { execFile } from "node:child_process";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function createPayloadZip(payloadRoot: string, zipPath = `${payloadRoot}.zip`): Promise<string> {
  if (process.platform === "win32") {
    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-Command",
      "Compress-Archive -Path payload -DestinationPath $args[0] -Force",
      zipPath,
    ], { cwd: payloadRoot });
    return zipPath;
  }

  await execFileAsync("zip", ["-qry", zipPath, "payload"], { cwd: payloadRoot });
  return zipPath;
}

export async function materializePayload(inputPath: string): Promise<string> {
  if (!inputPath.toLowerCase().endsWith(".zip")) return inputPath;

  const target = await mkdtemp(path.join(tmpdir(), "codex-migration-payload-"));
  if (process.platform === "win32") {
    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-Command",
      "Expand-Archive -Path $args[0] -DestinationPath $args[1] -Force",
      inputPath,
      target,
    ]);
    return target;
  }

  await execFileAsync("unzip", ["-q", inputPath, "-d", target]);
  return target;
}
