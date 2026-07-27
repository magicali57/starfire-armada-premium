import fs from "node:fs";

const enginePath = "src/gameplay/rapidFire/RapidFireEngine.ts";
const rendererPath = "src/gameplay/rapidFire/pixiRenderer.ts";
const gameplayScreenPath = "src/screens/gameplay/GameplayScreen.tsx";
const marker = "[enemy-basic-idle-preloaded-v4]";

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
// 1. Add the eight frame URLs to the engine's existing, proven asset preloader.
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
    `    // ${marker} Use the same preload path as every known-good gameplay image.
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
// 2. Read the already-preloaded textures in Pixi. No second Image loader,
//    no atlas slicing, no canvas cropping, and no Promise inside renderer init.
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
    `    for (const [key, img] of Object.entries(images)) {
      this.textures[key] = Texture.from(img);
    }
    this.glowTex = this.makeGlowTexture();`,
    `    for (const [key, img] of Object.entries(images)) {
      this.textures[key] = Texture.from(img);
    }
    // ${marker} Frames arrived through RapidFireEngine's normal preload path.
    const basicFrames = Array.from({ length: 8 }, (_, index) =>
      this.textures[\`enemyBasicIdle\${index + 1}\`],
    ).filter((texture): texture is Texture => Boolean(texture));
    this.enemyBasicIdleFrames = basicFrames.length === 8 ? basicFrames : [];
    console.info(
      "${marker}",
      \`Ready with \${this.enemyBasicIdleFrames.length} preloaded frames.\`,
    );
    this.glowTex = this.makeGlowTexture();`,
    "renderer base texture initialization",
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
    "      const side = e.h;",
    "      const side = e.h;\n" +
      "      // Generated frames include transparent safety padding. This changes\n" +
      "      // presentation size only; simulation and hitboxes are untouched.\n" +
      "      const spriteSide = hasBasicIdleFrames ? side * 1.28 : side;",
    "enemy visual size",
  );

  renderer = replaceOnce(
    renderer,
    "      const amp = flapAmplitude(e.kind);",
    "      // The real frame loop replaces the interim squash animation for basic enemies.\n" +
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
    "      // Existing static art is nose-up; these generated frames are nose-down.\n" +
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
    `      // ${marker} The old dark duplicate works for tightly cropped static
      // art, but turns the padded animation frames into large black rectangles.
      // Keep it for the untouched shooter/carrier art only.
      if (!hasBasicIdleFrames) {
        const op = outlinePool.next();
        op.texture = tex;
        op.position.set(e.x + sway, e.y + recoil);
        op.width = flapW * 1.1;
        op.height = flapH * 1.1;
        op.rotation = rot;
        op.alpha = 0.55 * alpha;
      }

      const sp = pool.next();`,
    "animated enemy outline",
  );

  renderer = replaceOnce(
    renderer,
    "      sp.alpha = alpha;",
    "      sp.alpha = alpha;\n" +
      "      sp.tint = 0xffffff;\n" +
      "      sp.blendMode = \"normal\";",
    "animated enemy sprite reset",
  );

  fs.writeFileSync(rendererPath, renderer, "utf8");
  console.info(`${marker} Applied preloaded-frame renderer integration.`);
} else {
  console.info(`${marker} Renderer patch already applied.`);
}

// ---------------------------------------------------------------------------
// 3. This isolated preview must show renderer errors on the phone even though
//    it is a production build. The normal main build is not modified.
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
