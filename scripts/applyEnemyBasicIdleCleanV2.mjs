import fs from "node:fs";

const rendererPath = "src/gameplay/rapidFire/pixiRenderer.ts";
const marker = "[enemy-basic-idle-clean-v2]";
let source = fs.readFileSync(rendererPath, "utf8");

if (source.includes(marker)) {
  console.info(`${marker} Renderer patch already applied.`);
  process.exit(0);
}

function replaceOnce(needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0) {
    throw new Error(`${marker} Could not find ${label}.`);
  }
  if (source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`${marker} Found multiple matches for ${label}.`);
  }
  source = source.replace(needle, replacement);
}

replaceOnce(
  'import { ANIM } from "./animationDefs";',
  'import { ANIM } from "./animationDefs";\n' +
    'import { ENEMY_BASIC_IDLE_FPS, ENEMY_BASIC_IDLE_FRAME_URLS } from "./enemyBasicIdleFrames";',
  "ANIM import",
);

replaceOnce(
  "  private generatedTextures: Texture[] = [];",
  "  private generatedTextures: Texture[] = [];\n" +
    "  private enemyBasicIdleFrames: Texture[] = [];",
  "generated texture field",
);

const probeComment =
  "  /** Probe for WebGL support on a throwaway canvas (never the game canvas). */";
const loaderMethod = `  /**
   * Load the eight basic-enemy frames as ordinary image textures.
   *
   * No atlas slicing, canvas cropping, or render-loop texture allocation is
   * used here. A failed frame load falls back to the known-good static enemy.
   */
  private async loadEnemyBasicIdleFrames(): Promise<void> {
    const loadTexture = (src: string): Promise<Texture> =>
      new Promise((resolve, reject) => {
        const image = new Image();
        image.decoding = "async";
        image.onload = () => resolve(Texture.from(image));
        image.onerror = () =>
          reject(new Error(\`${marker} Failed to load \${src}\`));
        image.src = src;
      });

    try {
      const frames = await Promise.all(
        ENEMY_BASIC_IDLE_FRAME_URLS.map(loadTexture),
      );
      this.enemyBasicIdleFrames = frames;
      this.generatedTextures.push(...frames);
      console.info(
        \`${marker} Loaded \${frames.length} independent frames.\`,
      );
    } catch (error) {
      this.enemyBasicIdleFrames = [];
      console.error(
        "${marker} Falling back to the static basic enemy.",
        error,
      );
    }
  }

`;
replaceOnce(probeComment, loaderMethod + probeComment, "WebGL probe insertion point");

replaceOnce(
  "    this.glowTex = this.makeGlowTexture();\n    this.sliceSheets();",
  "    this.glowTex = this.makeGlowTexture();\n" +
    "    this.sliceSheets();\n" +
    "    await this.loadEnemyBasicIdleFrames();",
  "renderer texture initialization",
);

replaceOnce(
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
        ? this.enemyBasicIdleFrames[frameIndex]
        : staticTex;
      if (!tex) continue;`,
  "enemy texture selection",
);

replaceOnce(
  "      const side = e.h;",
  "      const side = e.h;\n" +
    "      // The generated frames contain transparent safety padding. Scale the\n" +
    "      // visual only; simulation size and hitboxes remain untouched.\n" +
    "      const spriteSide = hasBasicIdleFrames ? side * 1.28 : side;",
  "enemy visual size",
);

replaceOnce(
  "      const amp = flapAmplitude(e.kind);",
  "      // The real frame loop replaces the interim squash animation for basic enemies.\n" +
    "      const amp = hasBasicIdleFrames ? 0 : flapAmplitude(e.kind);",
  "procedural flap amplitude",
);

replaceOnce(
  "      const flapW = side * (1 - amp * fold);\n" +
    "      const flapH = side * (1 + amp * 0.25 * fold);",
  "      const flapW = spriteSide * (1 - amp * fold);\n" +
    "      const flapH = spriteSide * (1 + amp * 0.25 * fold);",
  "enemy display dimensions",
);

replaceOnce(
  "      const rot = Math.PI + bank;",
  "      // Existing static art is nose-up; the new frames are already nose-down.\n" +
    "      const rot = hasBasicIdleFrames ? bank : Math.PI + bank;",
  "enemy rotation",
);

fs.writeFileSync(rendererPath, source, "utf8");
console.info(`${marker} Applied independent-frame renderer integration.`);
