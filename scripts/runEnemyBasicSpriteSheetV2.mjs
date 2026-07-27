import fs from "node:fs";
import { pathToFileURL } from "node:url";

const patchPath = "scripts/applyEnemyBasicSpriteSheetV2.mjs";
let source = fs.readFileSync(patchPath, "utf8");
const broken = '  const replacement = `${needle}  animEnemyBasicIdle: \\`${RF_PREMIUM}/animations/enemy_basic_idle/enemy_basic_idle_sheet.png\\`,\\n`;';
const fixed = '  const replacement = needle + \'  animEnemyBasicIdle: `${RF_PREMIUM}/animations/enemy_basic_idle/enemy_basic_idle_sheet.png`,\\n\';';

if (source.includes(broken)) {
  source = source.replace(broken, fixed);
  fs.writeFileSync(patchPath, source, "utf8");
} else if (!source.includes(fixed)) {
  throw new Error("Could not repair the asset-registry insertion in the sprite-sheet patch.");
}

await import(`${pathToFileURL(patchPath).href}?run=${Date.now()}`);
