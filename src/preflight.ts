import { readdir } from "node:fs/promises";
import path from "node:path";
import { pathExists } from "./fs-utils.ts";
import type { OsProfile, PayloadProfile } from "./types.ts";

export type PreflightOptions = {
  sourceOs: OsProfile;
  targetOs: OsProfile;
  codexHome: string;
  profile: PayloadProfile;
};

export type PreflightResult = {
  ok: boolean;
  sourceOs: OsProfile;
  targetOs: OsProfile;
  codexHome: string;
  profile: PayloadProfile;
  transfer: "local-zip-overlay";
  warnings: string[];
};

export async function runPreflight(options: PreflightOptions): Promise<PreflightResult> {
  const warnings: string[] = [];
  const codexHomeExists = await pathExists(options.codexHome);
  if (!codexHomeExists) {
    warnings.push(`Codex home does not exist yet: ${options.codexHome}`);
  }

  if (await pathExists(path.join(options.codexHome, "auth.json"))) {
    warnings.push("auth files will be excluded; run codex --login on the target machine after restore");
  }

  const rootFiles = codexHomeExists ? await readdir(options.codexHome).catch(() => []) : [];
  if (options.profile === "standard" && rootFiles.some((file) => /^logs_\d+\.sqlite$/i.test(file))) {
    warnings.push("logs_*.sqlite files are present but excluded from the standard profile; use --profile full if you need logs");
  }

  return {
    ok: codexHomeExists,
    sourceOs: options.sourceOs,
    targetOs: options.targetOs,
    codexHome: options.codexHome,
    profile: options.profile,
    transfer: "local-zip-overlay",
    warnings,
  };
}
