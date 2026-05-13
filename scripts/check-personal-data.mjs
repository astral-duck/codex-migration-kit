import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const forbiddenTerms = [
  ["I", "F", "M"].join(""),
  ["align", "mint"].join(""),
  ["G", "S", "C"].join(""),
  ["C:", "Users", "steve"].join("\\"),
  ["", "Users", "steven"].join("/"),
];
const ignoredDirs = new Set([".git", "node_modules"]);
const root = process.cwd();
const findings = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    const relative = path.relative(root, full);
    const text = await readFile(full, "utf8").catch(() => "");
    for (const term of forbiddenTerms) {
      if (text.toLowerCase().includes(term.toLowerCase()) || relative.toLowerCase().includes(term.toLowerCase())) {
        findings.push(`${relative} matched a forbidden personal/project marker`);
      }
    }
  }
}

await walk(root);
if (findings.length > 0) {
  console.error(findings.join("\n"));
  process.exit(1);
}
