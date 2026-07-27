import fs from "node:fs";

const enginePath = "src/gameplay/rapidFire/RapidFireEngine.ts";
const rendererPath = "src/gameplay/rapidFire/pixiRenderer.ts";
const screenPath = "src/screens/gameplay/GameplayScreen.tsx";
const marker = "[enemy-basic-idle-canvas-v5]";

function replaceOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) throw new Error(`${marker} Missing ${label}.`);
  if (source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`${marker} Multiple matches for ${label}.`);
  }
  return source.replace(needle, replacement);
}

let engine = fs.readFileSync(enginePath, "utf8");
engine = replaceOnce(
  engine,
  'import { RAPID_FIRE_SLICE_ASSETS } from "@/data/gameplayRapidFire";',
  'import { RAPID_FIRE_SLICE_ASSETS } from "@/data/gameplayRapidFire";\n' +
    'import { ENEMY_BASIC_IDLE_FRAME_URLS } from "./enemyBasicIdleFrames";',
  "engine import",
);
engine = replaceOnce(
  engine,
  "    const assets = RAPID_FIRE_SLICE_ASSETS;",
  `    // ${marker}
    const assets: Record<string, string> = {
      ...RAPID_FIRE_SLICE_ASSETS,
      ...Object.fromEntries(
        ENEMY_BASIC_IDLE_FRAME_URLS.map((src, index) => [
          \`enemyBasicIdle\${index + 1}\`,
          src,
        ]),
      ),
    };`,
  "engine asset list",
);
fs.writeFileSync(enginePath, engine, "utf8");

let renderer = fs.readFileSync(rendererPath, "utf8");
renderer = replaceOnce(
  renderer,
  'import { ANIM } from "./animationDefs";',
  'import { ANIM } from "./animationDefs";\n' +
    'import { ENEMY_BASIC_IDLE_FPS } from "./enemyBasicIdleFrames";',
  "renderer import",
);
renderer = replaceOnce(
  renderer,
  "  private generatedTextures: Texture[] = [];",
  "  private generatedTextures: Texture[] = [];\n" +
    "  private enemyBasicIdleFrames: Texture[] = [];",
  "renderer frame field",
);
renderer = replaceOnce(
  renderer,
  `    // Base textures from preloaded images.
    for (const [key, img] of Object.entries(images)) {
      this.textures[key] = Texture.from(img);
    }
    this.glowTex = this.makeGlowTexture();`,
  `    // Base textures from preloaded images. The experimental frames use
    // Canvas-backed textures because ImageSource alpha rendered opaque on the
    // target mobile WebGL implementation.
    for (const [key, img] of Object.entries(images)) {
      if (key.startsWith("enemyBasicIdle")) continue;
      this.textures[key] = Texture.from(img);
    }

    const frameImages = Array.from({ length: 8 }, (_, index) =>
      images[\`enemyBasicIdle\${index + 1}\`],
    ).filter((image): image is HTMLImageElement => Boolean(image));

    this.enemyBasicIdleFrames = frameImages.length === 8
      ? frameImages.map((image, index) => {
          const canvas = document.createElement("canvas");
          canvas.width = image.naturalWidth || image.width;
          canvas.height = image.naturalHeight || image.height;
          const context = canvas.getContext("2d", {
            alpha: true,
            willReadFrequently: true,
          });
          if (!context) {
            throw new Error(
              \`${marker} Canvas creation failed for frame \${index + 1}.\`,
            );
          }
          context.clearRect(0, 0, canvas.width, canvas.height);
          context.globalCompositeOperation = "copy";
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          context.globalCompositeOperation = "source-over";
          const cornerAlpha = context.getImageData(0, 0, 1, 1).data[3];
          if (cornerAlpha !== 0) {
            throw new Error(
              \`${marker} Frame \${index + 1} has corner alpha \${cornerAlpha}.\`,
            );
          }
          const texture = Texture.from(canvas);
          this.generatedTextures.push(texture);
          return texture;
        })
      : [];

    console.info(
      "${marker}",
      \`Loaded \${this.enemyBasicIdleFrames.length} transparent canvas frames.\`,
    );
    this.glowTex = this.makeGlowTexture();`,
  "renderer texture initialization",
);
renderer = replaceOnce(
  renderer,
  "      const tex = this.textures[this.enemyTextureKey(e)];\n      if (!tex) continue;",
  `      const staticTex = this.textures[this.enemyTextureKey(e)];
      const hasBasicIdleFrames =
        e.kind === "basic" && this.enemyBasicIdleFrames.length === 8;
      const normalizedPhase =
        ((e.swayPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const phaseOffset = hasBasicIdleFrames
        ? Math.floor(
            (normalizedPhase / (Math.PI * 2)) *
              this.enemyBasicIdleFrames.length,
          )
        : 0;
      const frameIndex = hasBasicIdleFrames
        ? (
            Math.floor((s.elapsedMs / 1000) * ENEMY_BASIC_IDLE_FPS) +
            phaseOffset
          ) % this.enemyBasicIdleFrames.length
        : 0;
      const tex = hasBasicIdleFrames
        ? this.enemyBasicIdleFrames[frameIndex] ?? staticTex
        : staticTex;
      if (!tex) continue;`,
  "enemy texture selection",
);
renderer = replaceOnce(
  renderer,
  "      const recoil = e.recoilMs > 0 ? -(e.recoilMs / 130) * 3 : 0;\n      const side = e.h;",
  `      const recoil = e.recoilMs > 0 ? -(e.recoilMs / 130) * 3 : 0;
      const frameBob = hasBasicIdleFrames
        ? [0, -2, -4, -2, 0, 2, 4, 2][frameIndex]
        : 0;
      const drawY = e.y + recoil + frameBob;
      const side = e.h;
      const spriteSide = hasBasicIdleFrames ? side * 1.34 : side;`,
  "enemy draw geometry",
);
renderer = replaceOnce(
  renderer,
  "      const amp = flapAmplitude(e.kind);",
  "      const amp = hasBasicIdleFrames ? 0 : flapAmplitude(e.kind);",
  "enemy flap",
);
renderer = replaceOnce(
  renderer,
  "      const flapW = side * (1 - amp * fold);\n" +
    "      const flapH = side * (1 + amp * 0.25 * fold);",
  "      const flapW = spriteSide * (1 - amp * fold);\n" +
    "      const flapH = spriteSide * (1 + amp * 0.25 * fold);",
  "enemy display size",
);
renderer = replaceOnce(
  renderer,
  "      const rot = Math.PI + bank;",
  "      const rot = hasBasicIdleFrames ? bank : Math.PI + bank;",
  "enemy rotation",
);
renderer = replaceOnce(
  renderer,
  `      // Dark contour first (renders behind), then the sprite itself.
      const op = outlinePool.next();
      op.texture = tex;
      op.position.set(e.x + sway, e.y + recoil);
      op.width = flapW * 1.1;
      op.height = flapH * 1.1;
      op.rotation = rot;
      op.alpha = 0.55 * alpha;

      const sp = pool.next();`,
  `      if (!hasBasicIdleFrames) {
        const op = outlinePool.next();
        op.texture = tex;
        op.position.set(e.x + sway, drawY);
        op.width = flapW * 1.1;
        op.height = flapH * 1.1;
        op.rotation = rot;
        op.alpha = 0.55 * alpha;
      }

      const sp = pool.next();`,
  "enemy outline",
);
const yCount = renderer.split("e.y + recoil").length - 1;
if (yCount !== 3) {
  throw new Error(`${marker} Expected 3 remaining draw-Y expressions, found ${yCount}.`);
}
renderer = renderer.replaceAll("e.y + recoil", "drawY");
renderer = replaceOnce(
  renderer,
  "      sp.alpha = alpha;",
  "      sp.alpha = alpha;\n" +
    "      sp.tint = 0xffffff;\n" +
    '      sp.blendMode = "normal";',
  "enemy sprite reset",
);
renderer = replaceOnce(
  renderer,
  "      if (e.flashMs > 0) {",
  "      if (e.flashMs > 0 && !hasBasicIdleFrames) {",
  "enemy flash",
);
fs.writeFileSync(rendererPath, renderer, "utf8");

let screen = fs.readFileSync(screenPath, "utf8");
screen = replaceOnce(
  screen,
  "      {import.meta.env.DEV && hud?.renderError ? (",
  `      {/* ${marker}-error-ui */}
      {hud?.renderError ? (`,
  "renderer diagnostic UI",
);
fs.writeFileSync(screenPath, screen, "utf8");

console.info(`${marker} Applied.`);
