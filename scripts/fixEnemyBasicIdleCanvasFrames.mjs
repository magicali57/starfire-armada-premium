import fs from "node:fs";

const path = "src/gameplay/rapidFire/pixiRenderer.ts";
let source = fs.readFileSync(path, "utf8");

const oldCall = "    this.sliceSheets();";
const newCall = "    this.sliceSheets(images);";
if (source.includes(oldCall)) {
  source = source.replace(oldCall, newCall);
}

const oldSignature = "  private sliceSheets(): void {\n    for (const def of Object.values(ANIM)) {\n      const base = this.textures[def.imageKey];";
const newSignature = `  private sliceSheets(images: Record<string, HTMLImageElement>): void {
    for (const def of Object.values(ANIM)) {
      // The basic-enemy test sheet is cropped into eight standalone canvas-backed
      // textures. This avoids the mobile WebGL subtexture artifact that rendered
      // the transparent frame cells as black rectangles.
      if (def.imageKey === ANIM.enemyBasicIdle.imageKey) {
        const image = images[def.imageKey];
        if (!image) continue;
        const frames: Texture[] = [];
        for (let i = 0; i < def.frameCount; i += 1) {
          const col = i % def.columns;
          const row = Math.floor(i / def.columns);
          const canvas = document.createElement("canvas");
          canvas.width = def.frameWidth;
          canvas.height = def.frameHeight;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Could not create enemy idle frame canvas");
          context.clearRect(0, 0, def.frameWidth, def.frameHeight);
          context.drawImage(
            image,
            col * def.frameWidth,
            row * def.frameHeight,
            def.frameWidth,
            def.frameHeight,
            0,
            0,
            def.frameWidth,
            def.frameHeight,
          );
          const texture = Texture.from(canvas);
          frames.push(texture);
          this.generatedTextures.push(texture);
        }
        this.frameTextures.set(def.imageKey, frames);
        continue;
      }

      const base = this.textures[def.imageKey];`;

if (source.includes(oldSignature)) {
  source = source.replace(oldSignature, newSignature);
} else if (!source.includes("canvas-backed\n      // textures")) {
  throw new Error("[enemy-basic-idle-test] Could not patch canvas-backed frame slicing.");
}

fs.writeFileSync(path, source, "utf8");
console.info("[enemy-basic-idle-test] Using canvas-backed textures for all eight basic-enemy frames.");
