export type OsProfile = "windows" | "macos";
export type PayloadProfile = "standard" | "full";
export type PathClass = "standard" | "full" | "excluded";

export type ManifestFile = {
  logicalPath: string;
  restorePath?: string;
  checksum: string;
  size: number;
  chunks: string[];
  transforms?: string[];
};

export type Manifest = {
  schemaVersion: 1;
  tool: "codex-migration-kit";
  createdAt: string;
  sourceOs: OsProfile;
  targetOs: OsProfile;
  profile: PayloadProfile;
  summary: {
    includedFiles: number;
    excludedFiles: number;
    totalBytes: number;
    transferModel: "local-zip-overlay";
  };
  files: ManifestFile[];
  excluded: string[];
  notes: string[];
};
