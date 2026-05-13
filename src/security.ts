import path from "node:path";
import type { PathClass } from "./types.ts";
import { toPortablePath } from "./path-profiles.ts";

const exactForbidden = new Set(["auth.json", "cap_sid", "installation_id"]);
const standardFiles = new Set(["config.toml", ".codex-global-state.json", "models_cache.json", "session_index.jsonl"]);
const standardDirs = [
  "automations/",
  "cache/",
  "memories/",
  "plugins/",
  "rules/",
  "sessions/",
  "archived_sessions/",
  "shell_snapshots/",
  "skills/",
  "vendor_imports/",
];
const keyFilePattern = /(^|\/)(id_rsa|id_dsa|id_ecdsa|id_ed25519|.*\.pem|.*\.key)$/i;
const tokenPattern = /(^|\/).*(token|secret|credential|password).*$/i;

export function shouldExcludePath(filePath: string): boolean {
  const logical = toPortablePath(filePath);
  const base = path.posix.basename(logical);

  if (logical === ".." || logical.startsWith("../") || path.isAbsolute(logical)) return true;
  if (exactForbidden.has(base)) return true;
  if (base === ".env" || base.startsWith(".env.")) return true;
  if (base.endsWith("-wal") || base.endsWith("-shm")) return true;
  if (keyFilePattern.test(logical)) return true;
  if (tokenPattern.test(logical)) return true;
  return false;
}

export function classifyPath(filePath: string): PathClass {
  const logical = toPortablePath(filePath);
  const base = path.posix.basename(logical);

  if (shouldExcludePath(logical)) return "excluded";
  if (/^logs_\d+\.sqlite$/i.test(base)) return "full";
  if (/^state_\d+\.sqlite$/i.test(base)) return "standard";
  if (standardFiles.has(logical)) return "standard";
  if (standardDirs.some((dir) => logical.startsWith(dir))) return "standard";
  return "excluded";
}
