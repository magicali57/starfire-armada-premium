import fs from "node:fs";

const marker = "[enemy-basic-spritesheet-v2]";

function replaceOnce(source, search, replacement, label) {
  const count = source.split(search).length - 1;
  if (count !== 1) {
    throw new Error(`${marker} Expected one ${label}, found ${count}.`);
  }
  return source.replace(search, replacement);
}

// Register the sheet in the existing preload registry.
{
  const path = "src/data/assetRegistry.ts";
  let source = fs.readFileSync(path, "utf8");
  const needle = "  animImpactRing: `${RF_PREMIUM}/animations/player_projectile_impact_ring/player_projectile_impact_ring_sheet.png`,\n";
  const replacement = `${needle}  animEnemyBasicIdle: \`${RF_PREMIUM}/animations/enemy_basic_idle/enemy_basic_idle_sheet.png\`,\n`;
  source = replaceOnce(source, needle, replacement, "animation registry insertion point");
  fs.writeFileSync(path, source, "utf8");
}

// Define the normalized 4x2 sheet: 128x128 cells, 8 frames, 8 FPS.
{
  const path = "src/gameplay/rapidFire/animationDefs.ts";
  let source = fs.readFileSync(path, "utf8");
  const needle = "  impactRing: def(\"animImpactRing\", 256, 256, 6, 6, 1, 30, false),\n";
  const replacement = `${needle}  enemyBasicIdle: def(\"animEnemyBasicIdle\", 128, 128, 8, 4, 2, 8, true),\n`;
  source = replaceOnce(source, needle, replacement, "animation definition insertion point");
  fs.writeFileSync(path, source, "utf8");
}

// Replace only the enemy presentation method. Simulation and hitboxes stay untouched.
{
  const path = "src/gameplay/rapidFire/pixiRenderer.ts";
  let source = fs.readFileSync(path, "utf8");
  const start = source.indexOf("  private syncEnemies(s: RenderState): void {");
  const end = source.indexOf("\n  private syncPlayerShots(s: RenderState): void {", start);
  if (start < 0 || end < 0) {
    throw new Error(`${marker} Could not locate syncEnemies method.`);
  }

  const method = `  private syncEnemies(s: RenderState): void {
    const pool = this.enemyPool!;
    const flashPool = this.enemyFlashPool!;
    const outlinePool = this.enemyOutlinePool!;
    const glowPool = this.enemyGlowPool!;
    const basicFrames = this.frameTextures.get(ANIM.enemyBasicIdle.imageKey);

    pool.begin();
    flashPool.begin();
    outlinePool.begin();
    glowPool.begin();

    for (const e of s.enemies) {
      if (!e.alive) continue;
      if (e.dying && e.dyingMs >= ENEMY_DEATH_SPRITE_MS) continue;

      const hasBasicAnimation =
        e.kind === \"basic\" && basicFrames !== undefined && basicFrames.length === ANIM.enemyBasicIdle.frameCount;

      let animatedTexture: Texture | undefined;
      let framePulse = 0;
      if (hasBasicAnimation && basicFrames) {
        const normalizedPhase =
          (((e.swayPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) / (Math.PI * 2);
        const phaseFrames = Math.floor(normalizedPhase * basicFrames.length);
        const frameIndex =
          (Math.floor((s.elapsedMs / 1000) * ANIM.enemyBasicIdle.fps) + phaseFrames) % basicFrames.length;
        animatedTexture = basicFrames[frameIndex];
        framePulse = frameIndex / Math.max(1, basicFrames.length - 1);
      }

      const staticTexture = this.textures[this.enemyTextureKey(e)];
      const tex = animatedTexture ?? staticTexture;
      if (!tex) continue;

      const sway = Math.sin(s.elapsedMs / 620 + e.swayPhase) * 3;
      const bank =
        clamp(e.vx * 0.012, -0.28, 0.28) + Math.sin(s.elapsedMs / 900 + e.swayPhase) * 0.04;
      const recoil = e.recoilMs > 0 ? -(e.recoilMs / 130) * 3 : 0;
      const side = e.h;
      const alpha = e.dying ? Math.max(0, 1 - e.dyingMs / ENEMY_DEATH_SPRITE_MS) : 1;
      const rot = Math.PI + bank;

      let drawW = side;
      let drawH = side;
      let glowStrength = 0.75;

      if (!hasBasicAnimation) {
        // Keep the existing procedural fallback for enemy types that still use static art.
        const amp = flapAmplitude(e.kind);
        const wave = Math.sin((s.elapsedMs / FLAP_PERIOD_MS) * Math.PI * 2 + e.swayPhase * 2.7);
        const fold = 0.5 * (1 - wave);
        drawW = side * (1 - amp * fold);
        drawH = side * (1 + amp * 0.25 * fold);
        glowStrength = 1 - fold;

        const op = outlinePool.next();
        op.texture = tex;
        op.position.set(e.x + sway, e.y + recoil);
        op.width = drawW * 1.1;
        op.height = drawH * 1.1;
        op.rotation = rot;
        op.alpha = 0.55 * alpha;
      } else {
        // The sheet itself contains the wing and engine movement. Do not distort it.
        glowStrength = 0.55 + framePulse * 0.45;
      }

      const sp = pool.next();
      sp.texture = tex;
      sp.tint = 0xffffff;
      sp.blendMode = \"normal\";
      sp.position.set(e.x + sway, e.y + recoil);
      sp.width = drawW;
      sp.height = drawH;
      sp.rotation = rot;
      sp.alpha = alpha;

      const gp = glowPool.next();
      gp.position.set(e.x + sway, e.y + recoil - side * 0.3);
      const gs = side * (0.5 + 0.12 * glowStrength);
      gp.width = gs;
      gp.height = gs;
      gp.tint = e.kind === \"basic\" ? 0xff6a3c : e.kind === \"shooter\" ? 0xff4ea8 : 0xffa63c;
      gp.alpha = (0.32 + 0.16 * glowStrength) * alpha;

      if (e.flashMs > 0) {
        const fp = flashPool.next();
        fp.texture = tex;
        fp.tint = 0xffffff;
        fp.position.set(e.x + sway, e.y + recoil);
        fp.width = drawW;
        fp.height = drawH;
        fp.rotation = rot;
        fp.alpha = Math.min(1, e.flashMs / 90) * 0.85 * alpha;
      }
    }

    pool.end();
    flashPool.end();
    outlinePool.end();
    glowPool.end();
  }
`;

  source = source.slice(0, start) + method + source.slice(end);
  fs.writeFileSync(path, source, "utf8");
}

// Give the isolated phone preview its own save and enough Energy to start.
{
  const path = "src/store/playerStore.tsx";
  let source = fs.readFileSync(path, "utf8");
  source = replaceOnce(
    source,
    'const SAVE_KEY = "starfire-armada-v2:save";',
    'const SAVE_KEY = "starfire-armada-v2:enemy-basic-sheet-v2-save";\nconst ENEMY_SHEET_PREVIEW_ENERGY = 100;',
    "save key",
  );
  source = replaceOnce(
    source,
    "  if (loaded.shouldPersist) persistPlayerState(loaded.state);\n  return loaded.state;",
    `  const previewState: PlayerState = {
    ...loaded.state,
    currencies: {
      ...loaded.state.currencies,
      energy: Math.max(loaded.state.currencies.energy, ENEMY_SHEET_PREVIEW_ENERGY),
    },
  };
  if (loaded.shouldPersist || previewState.currencies.energy !== loaded.state.currencies.energy) {
    persistPlayerState(previewState);
  }
  return previewState;`,
    "player-state load return",
  );
  fs.writeFileSync(path, source, "utf8");
}

// Keep the nested Pages preview self-contained; avoid delayed dynamic Pixi chunks.
{
  const path = "vite.config.ts";
  let source = fs.readFileSync(path, "utf8");
  source = replaceOnce(
    source,
    '    assetsDir: "assets",\n',
    '    assetsDir: "assets",\n    rollupOptions: { output: { inlineDynamicImports: true } },\n',
    "Vite build settings",
  );
  fs.writeFileSync(path, source, "utf8");
}

console.info(`${marker} Applied real 8-frame basic-enemy spritesheet integration.`);
