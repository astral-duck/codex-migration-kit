import path from "node:path";
import type { OsProfile } from "./types.ts";

export function currentOsProfile(platform = process.platform): OsProfile {
  return platform === "win32" ? "windows" : "macos";
}

export function defaultHome(os: OsProfile): string {
  if (os === "windows") {
    return process.env.USERPROFILE ?? path.win32.join(process.env.HOMEDRIVE ?? "C:", process.env.HOMEPATH ?? "\\Users\\Default");
  }
  return process.env.HOME ?? "/Users/default";
}

export function defaultCodexHome(os: OsProfile, home = defaultHome(os)): string {
  return os === "windows" ? path.win32.join(home, ".codex") : path.posix.join(home, ".codex");
}

export function normalizeForManifest(os: OsProfile, filePath: string, codexHome?: string): string {
  const pathApi = os === "windows" ? path.win32 : path.posix;
  if (!codexHome) {
    const portable = toPortablePath(filePath);
    const marker = "/.codex/";
    const markerIndex = portable.toLowerCase().indexOf(marker);
    if (markerIndex >= 0) {
      return portable.slice(markerIndex + marker.length);
    }
  }
  const root = codexHome ?? defaultCodexHome(os);
  if (codexHome) {
    const hostRelative = path.relative(root, filePath);
    const portableHostRelative = toPortablePath(hostRelative);
    if (portableHostRelative && portableHostRelative !== ".." && !portableHostRelative.startsWith("../") && !path.isAbsolute(hostRelative)) {
      return portableHostRelative;
    }
  }
  const relative = pathApi.relative(root, filePath);
  return toPortablePath(relative);
}

export function resolveBucketTarget(os: OsProfile, home: string, logicalPath: string): string {
  const clean = toPortablePath(logicalPath);
  if (clean.startsWith("../") || clean === ".." || path.isAbsolute(clean)) {
    throw new Error(`Unsafe logical path: ${logicalPath}`);
  }
  const parts = clean.split("/").filter(Boolean);
  return os === "windows"
    ? path.win32.join(home, ".codex", ...parts)
    : path.posix.join(home, ".codex", ...parts);
}

export function toPortablePath(value: string): string {
  return value.replaceAll("\\", "/").replace(/^\/+/, "");
}

export function fromPortablePath(root: string, logicalPath: string): string {
  const clean = toPortablePath(logicalPath);
  if (clean.startsWith("../") || clean === ".." || path.isAbsolute(clean)) {
    throw new Error(`Unsafe logical path: ${logicalPath}`);
  }
  return path.join(root, ...clean.split("/").filter(Boolean));
}
