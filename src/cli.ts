import { mkdir } from "node:fs/promises";
import path from "node:path";
import { createPayloadZip, materializePayload } from "./archive.ts";
import { exportCodexHome } from "./exporter.ts";
import { defaultCodexHome, defaultHome, currentOsProfile } from "./path-profiles.ts";
import { restoreCodexHome } from "./restore.ts";
import { validatePayload } from "./validate.ts";
import type { OsProfile, PayloadProfile } from "./types.ts";

type ParsedArgs = {
  command?: string;
  values: Record<string, string | true>;
};

export async function main(argv: string[]): Promise<void> {
  const parsed = parseArgs(argv);
  switch (parsed.command) {
    case "inspect":
      await inspect(parsed);
      break;
    case "export":
      await runExport(parsed);
      break;
    case "restore":
      await runRestore(parsed);
      break;
    case "validate":
      await runValidate(parsed);
      break;
    case "doctor":
      doctor();
      break;
    default:
      usage();
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const [command, ...rest] = argv;
  const values: Record<string, string | true> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = rest[index + 1];
    if (next && !next.startsWith("--")) {
      values[key] = next;
      index += 1;
    } else {
      values[key] = true;
    }
  }
  return { command, values };
}

async function inspect(parsed: ParsedArgs): Promise<void> {
  const os = getOs(parsed.values.os) ?? currentOsProfile();
  const codexHome = String(parsed.values["codex-home"] ?? defaultCodexHome(os));
  console.log(JSON.stringify({ os, codexHome, authExcluded: true }, null, 2));
}

async function runExport(parsed: ParsedArgs): Promise<void> {
  const sourceOs = currentOsProfile();
  const targetOs = requiredOs(parsed.values.target, "--target must be windows or macos");
  const profile = getProfile(parsed.values.profile) ?? "standard";
  const sourceCodexHome = String(parsed.values["codex-home"] ?? defaultCodexHome(sourceOs));
  const outputDir = String(parsed.values.output ?? path.resolve("codex-migration-payload"));
  await mkdir(outputDir, { recursive: true });
  const manifest = await exportCodexHome({ sourceOs, targetOs, sourceCodexHome, outputDir, profile });
  console.log(`Exported ${manifest.files.length} Codex files to ${outputDir}`);
  if (parsed.values.zip !== "false" && parsed.values["no-zip"] !== true) {
    try {
      const zipPath = await createPayloadZip(outputDir);
      console.log(`Created ZIP overlay at ${zipPath}`);
    } catch (error) {
      console.warn(`Could not create ZIP automatically: ${error instanceof Error ? error.message : String(error)}`);
      console.warn("The payload folder is still usable. Zip it privately before transfer if desired.");
    }
  }
  console.log("Move this payload privately, then run codex-migrate restore on the target machine.");
}

async function runRestore(parsed: ParsedArgs): Promise<void> {
  const targetOs = currentOsProfile();
  const payloadRoot = String(parsed.values.payload ?? "");
  if (!payloadRoot) throw new Error("--payload is required");
  const materializedPayload = await materializePayload(payloadRoot);
  const targetCodexHome = String(parsed.values["codex-home"] ?? defaultCodexHome(targetOs, defaultHome(targetOs)));
  const result = await restoreCodexHome({ payloadRoot: materializedPayload, targetOs, targetCodexHome });
  console.log(`Restored ${result.restoredFiles} files to ${targetCodexHome}`);
  if (result.backupDir) console.log(`Existing Codex state was backed up to ${result.backupDir}`);
  console.log("Run codex --login on this machine before using Codex.");
}

async function runValidate(parsed: ParsedArgs): Promise<void> {
  const payloadRoot = String(parsed.values.payload ?? "");
  if (!payloadRoot) throw new Error("--payload is required");
  const materializedPayload = await materializePayload(payloadRoot);
  const result = await validatePayload(materializedPayload);
  if (!result.ok) {
    throw new Error(result.errors.join("\n"));
  }
  console.log(`Payload is valid. Files: ${result.fileCount}`);
}

function doctor(): void {
  console.log([
    "Codex Migration Kit doctor",
    "- If Git LFS or GitHub uploads stall, use the local payload folder/ZIP overlay instead.",
    "- Locked state_*.sqlite-wal or state_*.sqlite-shm files are SQLite sidecars and are excluded.",
    "- logs_*.sqlite files can be large; use --profile full only when you need logs.",
    "- Auth is never migrated. Run codex --login on the target machine.",
  ].join("\n"));
}

function usage(): void {
  console.log([
    "Usage:",
    "  codex-migrate inspect [--os windows|macos] [--codex-home PATH]",
    "  codex-migrate export --target windows|macos [--profile standard|full] [--codex-home PATH] [--output DIR]",
    "  codex-migrate restore --payload DIR_OR_ZIP [--codex-home PATH]",
    "  codex-migrate validate --payload DIR_OR_ZIP",
    "  codex-migrate doctor",
  ].join("\n"));
}

function getOs(value: string | true | undefined): OsProfile | undefined {
  if (value === "windows" || value === "macos") return value;
  return undefined;
}

function requiredOs(value: string | true | undefined, message: string): OsProfile {
  const os = getOs(value);
  if (!os) throw new Error(message);
  return os;
}

function getProfile(value: string | true | undefined): PayloadProfile | undefined {
  if (value === "standard" || value === "full") return value;
  return undefined;
}
