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

// Make the idle loop visibly breathe while keeping every frame fully on-canvas.
source = source.replace(
  "const spriteSide = hasBasicIdleFrames ? side * 1.34 : side;",
  `const frameScale = hasBasicIdleFrames
        ? [1, 1.03, 1.06, 1.03, 1, 0.97, 0.94, 0.97][frameIndex] ?? 1
        : 1;
      const spriteSide = hasBasicIdleFrames
        ? side * 1.3 * frameScale
        : side;`,
);

fs.writeFileSync(path, source, "utf8");
await import(`${pathToFileURL(path).href}?run=${Date.now()}`);
