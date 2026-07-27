import fs from "node:fs";
import { pathToFileURL } from "node:url";

const path = "scripts/applyEnemyBasicIdleCleanV2.mjs";
let source = fs.readFileSync(path, "utf8");

// Keep the drawY declaration out of the later replaceAll("e.y + recoil", ...)
// pass. Only the three actual sprite-position expressions should be replaced.
source = source.replace(
  "const drawY = e.y + recoil + frameBob;",
  "const drawY = e.y + frameBob + recoil;",
);

fs.writeFileSync(path, source, "utf8");
await import(`${pathToFileURL(path).href}?run=${Date.now()}`);
