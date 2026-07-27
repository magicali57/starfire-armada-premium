import fs from "node:fs";

const path = "src/gameplay/rapidFire/pixiRenderer.ts";
let source = fs.readFileSync(path, "utf8");
const before = `      const frameBob = hasBasicIdleFrames
        ? [0, -2, -4, -2, 0, 2, 4, 2][frameIndex]
        : 0;`;
const after = `      const frameBob = hasBasicIdleFrames
        ? ([0, -2, -4, -2, 0, 2, 4, 2][frameIndex] ?? 0)
        : 0;`;
if (!source.includes(before)) {
  throw new Error("Could not find the enemy frame-bob lookup.");
}
source = source.replace(before, after);
fs.writeFileSync(path, source, "utf8");
console.info("[enemy-basic-idle-canvas-v5] Strict frame indexing fixed.");
