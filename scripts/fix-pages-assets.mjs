import { promises as fs } from "node:fs";
import path from "node:path";

const DIST_DIR = path.resolve("dist");
const TEXT_EXTENSIONS = new Set([".html", ".js", ".css", ".json", ".map"]);

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

const files = await walk(DIST_DIR);
let changedFiles = 0;
let replacements = 0;

for (const file of files) {
  if (!TEXT_EXTENSIONS.has(path.extname(file))) continue;
  const original = await fs.readFile(file, "utf8");
  const matches = original.match(/\/assets\//g);
  if (!matches) continue;

  const updated = original.replaceAll("/assets/", "./assets/");
  await fs.writeFile(file, updated, "utf8");
  changedFiles += 1;
  replacements += matches.length;
}

console.log(`GitHub Pages asset fix: ${replacements} replacements across ${changedFiles} files.`);
