import fs from "node:fs";

const enginePath = "src/gameplay/rapidFire/RapidFireEngine.ts";
const rendererPath = "src/gameplay/rapidFire/pixiRenderer.ts";
const gameplayScreenPath = "src/screens/gameplay/GameplayScreen.tsx";
const marker = "[enemy-basic-idle-canvas-v5]";

function replaceOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) {
    throw new Error(`${marker} Could not find ${label}.`);
  }
  if (source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`${marker} Found multiple matches for ${label}.`);
  }
  return source.replace(needle, replacement);
}

// ---------------------------------------------------------------------------
// 1. Add the eight frame URLs to the engine's existing asset preloader.
// ---------------------------------------------------------------------------
let engine = fs.readFileSync(enginePath, "utf8");
if (!engine.includes(marker)) {
  engine = replaceOnce(
    engine,
    'import { RAPID_FIRE_SLICE_ASSETS } from "@/data/gameplayRapidFire";',
    'import { RAPID_FIRE_SLICE_ASSETS } from "@/data/gameplayRapidFire";\n' +
      'import { ENEMY_BASIC_IDLE_FRAME_URLS } from "./enemyBasicIdleFrames";',
    "engine asset import",
  );

  engine = replaceOnce(
    engine,
    "    const assets = RAPID_FIRE_SLICE_ASSETS;",
    `    // ${marker} Load the eight PNGs through the same proven preloader as
    // every other gameplay image. The renderer receives fully decoded images.
    const assets: Record<string, string> = {
      ...RAPID_FIRE_SLICE_ASSETS,
      ...Object.fromEntries(
        ENEMY_BASIC_IDLE_FRAME_URLS.map((src, index) => [
          \`enemyBasicIdle\${index + 1}\`,
          src,
        ]),
      ),
    };`,
    "engine asset collection",
  );

  fs.writeFileSync(enginePath, engine, "utf8");
  console.info(`${marker} Added frames to the engine preloader.`);
} else {
  console.info(`${marker} Engine preload patch already applied.`);
}

// ---------------------------------------------------------------------------
// 2. Convert the decoded frame images into transparent Canvas-backed textures.
//
// The previous ImageSource route rendered transparent pixels as opaque black on
// the target mobile WebGL renderer. Canvas-backed textures are already proven in
// this renderer by its procedural glow texture. We verify a transparent corner
// before creating every texture, create them once during init, and reuse them.
// ---------------------------------------------------------------------------
let renderer = fs.readFileSync(rendererPath, "utf8");
if (!renderer.includes(marker)) {
  renderer = replaceOnce(
    renderer,
    'import { ANIM } from "./animationDefs";',
    'import { ANIM } from "./animationDefs";\n' +
      'import { ENEMY_BASIC_IDLE_FPS } from "./enemyBasicIdleFrames";',
    "renderer FPS import",
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
    `    // Base textures from preloaded images. The eight experimental enemy
    // frames are handled separately below so their HTMLImageElement alpha path
    // cannot create opaque black rectangles on mobile WebGL.
    for (const [key, img] of Object.entries(images)) {
      if (key.startsWith("enemyBasicIdle")) continue;
      this.textures[key] = Texture.from(img);
    }

    // ${marker} Build eight transparent Canvas-backed textures once.
    const frameImages = Array.from({ length: 8 }, (_, index) =>
      images[\`enemyBasicIdle\${index + 1}\`],
    ).filter((image): image is HTMLImageElement => Boolean(image));

    if (frameImages.length === 8) {
      this.enemyBasicIdleFrames = frameImages.map((image, index) => {
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth || image.width;
        canvas.height = image.naturalHeight || image.height;
        const context = canvas.getContext("2d", {
          alpha: true,
          willReadFrequently: true,
        });
        if (!context) {
          throw new Error(
            \`${marker} Could not create a transparent canvas for frame \${index + 1}.\`,
          );
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = "copy";
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        context.globalCompositeOperation = "source-over";

        const cornerAlpha = context.getImageData(0, 0, 1, 1).data[3];
        if (cornerAlpha !== 0) {
          throw new Error(
            \`${marker} Frame \${index + 1} failed transparency verification (corner alpha \${cornerAlpha}).\`,
          );
        }

        const texture = Texture.from(canvas);
        texture.source.alphaMode = "premultiply-alpha-on-upload";
        texture.source.autoGenerateMipmaps = false;
        this.generatedTextures.push(texture);
        return texture;
      });
    } else {
      this.enemyBasicIdleFrames = [];
    }

    console.info(
      "${marker}",
      \`Ready with \${this.enemyBasicIdleFrames.length} verified canvas frames.\`,
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
      // A clearly readable eight-step hover path confirms that frame playback
      // is happening even on a small phone display.
      const frameBob = hasBasicIdleFrames
        ? [0, -2, -4, -2, 0, 2, 4, 2][frameIndex]
        : 0;
      const drawY = e.y + recoil + frameBob;
      const side = e.h;
      // Generated frames include transparent safety padding. Presentation only;
      // hitboxes and all simulation dimensions remain unchanged.
      const spriteSide = hasBasicIdleFrames ? side * 1.34 : side;`,
    "enemy draw position and size",
  );

  renderer = replaceOnce(
    renderer,
    "      const amp = flapAmplitude(e.kind);",
    "      // The real frame loop replaces the old squash animation for basic enemies.\n" +
      "      const amp = hasBasicIdleFrames ? 0 : flapAmplitude(e.kind);",
    "procedural flap amplitude",
  );

  renderer = replaceOnce(
    renderer,
    "      const flapW = side * (1 - amp * fold);\n" +
      "      const flapH = side * (1 + amp * 0.25 * fold);",
    "      const flapW = spriteSide * (1 - amp * fold);\n" +
      "      const flapH = spriteSide * (1 + amp * 0.25 * fold);",
    "enemy display dimensions",
  );

  renderer = replaceOnce(
    renderer,
    "      const rot = Math.PI + bank;",
    "      // Existing art is nose-up; generated frames are already nose-down.\n" +
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
    `      // Keep the known-good contour only for untouched static enemy art.
      if (!hasBasicIdleFrames) {
        const op = outlinePool.next();
        op.texture = tex;
        op.position.set(e.x + sway, drawY);
        op.width = flapW * 1.1;
        op.height = flapH * 1.1;
        op.rotation = rot;
        op.alpha = 0.55 * alpha;
      }

      const sp = pool.next();`,
    "animated enemy outline",
  );

  const enemyYOccurrences = renderer.split("e.y + recoil").length - 1;
  if (enemyYOccurrences !== 3) {
    throw new Error(
      `${marker} Expected three remaining enemy draw Y expressions, found ${enemyYOccurrences}.`,
    );
  }
  renderer = renderer.replaceAll("e.y + recoil", "drawY");

  renderer = replaceOnce(
    renderer,
    "      sp.alpha = alpha;",
    "      sp.alpha = alpha;\n" +
      "      sp.tint = 0xffffff;\n" +
      '      sp.blendMode = "normal";',
    "animated enemy sprite reset",
  );

  // The regular hit-flash duplicate is safe for static art, but it uses the same
  // image-alpha path that failed for these frames. Use the main sprite only while
  // this animation is active; hit detection and damage remain unchanged.
  renderer = replaceOnce(
    renderer,
    "      if (e.flashMs > 0) {",
    "      if (e.flashMs > 0 && !hasBasicIdleFrames) {",
    "animated enemy flash duplicate",
  );

  fs.writeFileSync(rendererPath, renderer, "utf8");
  console.info(`${marker} Applied verified canvas-frame renderer integration.`);
} else {
  console.info(`${marker} Renderer patch already applied.`);
}

// ---------------------------------------------------------------------------
// 3. Keep renderer failures visible in the isolated production preview.
// ---------------------------------------------------------------------------
let screen = fs.readFileSync(gameplayScreenPath, "utf8");
if (!screen.includes(`${marker}-error-ui`)) {
  screen = replaceOnce(
    screen,
    "      {import.meta.env.DEV && hud?.renderError ? (",
    `      {/* ${marker}-error-ui */}
      {hud?.renderError ? (`,
    "production preview renderer error condition",
  );
  fs.writeFileSync(gameplayScreenPath, screen, "utf8");
  console.info(`${marker} Enabled on-device renderer diagnostics.`);
} else {
  console.info(`${marker} Renderer diagnostic UI already applied.`);
}
