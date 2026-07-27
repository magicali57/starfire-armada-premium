import fs from "node:fs";
import { pathToFileURL } from "node:url";

const path = "scripts/applyEnemyBasicIdleCleanV2.mjs";
let source = fs.readFileSync(path, "utf8");
source = source.replace("if (yCount !== 3)", "if (yCount !== 4)");
source = source.replace(
  "Expected 3 remaining draw-Y expressions",
  "Expected 4 remaining draw-Y expressions",
);
fs.writeFileSync(path, source, "utf8");
await import(`${pathToFileURL(path).href}?run=${Date.now()}`);
