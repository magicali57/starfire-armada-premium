import fs from "node:fs";

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, source) {
  fs.writeFileSync(path, source, "utf8");
}

function replaceOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first === -1) throw new Error(`Could not find ${label}.`);
  if (source.indexOf(needle, first + needle.length) !== -1) {
    throw new Error(`Found more than one ${label}.`);
  }
  return source.slice(0, first) + replacement + source.slice(first + needle.length);
}

// 1. Register the new sheet in the existing normal preload registry.
{
  const path = "src/data/assetRegistry.ts";
  let source = read(path);
  if (!source.includes("animEnemyBasicIdle:")) {
    source = replaceOnce(
      source,
      '  animImpactRing: `${RF_PREMIUM}/animations/player_projectile_impact_ring/player_projectile_impact_ring_sheet.png`,\n} as const;',
      '  animImpactRing: `${RF_PREMIUM}/animations/player_projectile_impact_ring/player_projectile_impact_ring_sheet.png`,\n  animEnemyBasicIdle: `${RF_PREMIUM}/animations/enemy_basic_idle/enemy_basic_idle_sheet.png`,\n} as const;',
      "animation registry closing block",
    );
  }
  write(path, source);
}

// 2. Add a non-additive 4x2 / 8-frame definition.
{
  const path = "src/gameplay/rapidFire/animationDefs.ts";
  let source = read(path);
  if (!source.includes("additive = true")) {
    source = replaceOnce(
      source,
      "  anchorX = 0.5,\n  anchorY = 0.5,\n): SpriteSheetDef => ({",
      "  anchorX = 0.5,\n  anchorY = 0.5,\n  additive = true,\n): SpriteSheetDef => ({",
      "animation definition parameters",
    );
    source = replaceOnce(
      source,
      "  additive: true,\n});",
      "  additive,\n});",
      "animation additive property",
    );
  }
  if (!source.includes("enemyBasicIdle:")) {
    source = replaceOnce(
      source,
      '  impactRing: def("animImpactRing", 256, 256, 6, 6, 1, 30, false),',
      '  impactRing: def("animImpactRing", 256, 256, 6, 6, 1, 30, false),\n  enemyBasicIdle: def("animEnemyBasicIdle", 128, 128, 8, 4, 2, 10, true, 0.5, 0.5, false),',
      "impact-ring animation definition",
    );
  }
  write(path, source);
}

// 3. Replace only the presentation path for basic enemies.
{
  const path = "src/gameplay/rapidFire/pixiRenderer.ts";
  let source = read(path);
  const marker = "enemy-basic-spritesheet-v1";
  if (!source.includes(marker)) {
    const startNeedle = "  private syncEnemies(s: RenderState): void {";
    const endNeedle = "\n  private syncPlayerShots(s: RenderState): void {";
    const start = source.indexOf(startNeedle);
    const end = source.indexOf(endNeedle, start);
    if (start === -1 || end === -1) {
      throw new Error("Could not isolate PixiRenderer.syncEnemies().");
    }

    const replacement = `  private syncEnemies(s: RenderState): void {
    // enemy-basic-spritesheet-v1: use the existing pre-sliced texture pipeline.
    const pool = this.enemyPool!;
    const flashPool = this.enemyFlashPool!;
    const outlinePool = this.enemyOutlinePool!;
    const glowPool = this.enemyGlowPool!;
    const basicFrames = this.frameTextures.get(ANIM.enemyBasicIdle.imageKey);
    // The supplied art opens across both rows. Play the second row backwards so
    // the loop closes smoothly instead of snapping from fully open to closed.
    const basicFrameOrder = [0, 1, 2, 3, 7, 6, 5, 4] as const;

    pool.begin();
    flashPool.begin();
    outlinePool.begin();
    glowPool.begin();
    for (const e of s.enemies) {
      if (!e.alive) continue;
      if (e.dying && e.dyingMs >= ENEMY_DEATH_SPRITE_MS) continue;

      const staticTex = this.textures[this.enemyTextureKey(e)];
      const animatedBasic =
        e.kind === "basic" && basicFrames?.length === ANIM.enemyBasicIdle.frameCount;
      const phaseOffset = animatedBasic
        ? Math.floor(
            ((((e.swayPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) /
              (Math.PI * 2)) *
              basicFrameOrder.length,
          )
        : 0;
      const sequenceIndex = animatedBasic
        ? (Math.floor((s.elapsedMs / 1000) * ANIM.enemyBasicIdle.fps) + phaseOffset) %
          basicFrameOrder.length
        : 0;
      const sheetFrameIndex = basicFrameOrder[sequenceIndex] ?? 0;
      const animatedTex = animatedBasic ? basicFrames?.[sheetFrameIndex] : undefined;
      const tex = animatedTex ?? staticTex;
      if (!tex) continue;

      const sway = Math.sin(s.elapsedMs / 620 + e.swayPhase) * 3;
      const bank =
        clamp(e.vx * 0.012, -0.28, 0.28) + Math.sin(s.elapsedMs / 900 + e.swayPhase) * 0.04;
      const recoil = e.recoilMs > 0 ? -(e.recoilMs / 130) * 3 : 0;
      const side = e.h;
      const alpha = e.dying ? Math.max(0, 1 - e.dyingMs / ENEMY_DEATH_SPRITE_MS) : 1;

      let drawW = side;
      let drawH = side;
      let glowPulse = 1;
      if (!animatedBasic) {
        // Keep the existing static-art fallback for shooter and carrier enemies.
        const amp = flapAmplitude(e.kind);
        const wave = Math.sin((s.elapsedMs / FLAP_PERIOD_MS) * Math.PI * 2 + e.swayPhase * 2.7);
        const fold = 0.5 * (1 - wave);
        drawW = side * (1 - amp * fold);
        drawH = side * (1 + amp * 0.25 * fold);
        glowPulse = 1 - fold;
      } else {
        glowPulse = 0.5 + 0.5 * Math.sin(s.elapsedMs / 150 + e.swayPhase);
      }

      // The new sheet already faces down. Legacy static enemy art faces up.
      const rot = (animatedBasic ? 0 : Math.PI) + bank;

      // The old synthetic dark duplicate is intentionally omitted for this
      // transparent animated sheet. It remains unchanged for all static enemies.
      if (!animatedBasic) {
        const op = outlinePool.next();
        op.texture = tex;
        op.position.set(e.x + sway, e.y + recoil);
        op.width = drawW * 1.1;
        op.height = drawH * 1.1;
        op.rotation = rot;
        op.alpha = 0.55 * alpha;
      }

      const sp = pool.next();
      sp.texture = tex;
      sp.tint = 0xffffff;
      sp.position.set(e.x + sway, e.y + recoil);
      sp.width = drawW;
      sp.height = drawH;
      sp.rotation = rot;
      sp.alpha = alpha;

      const gp = glowPool.next();
      gp.position.set(e.x + sway, e.y + recoil - side * 0.3);
      const gs = side * (0.5 + 0.12 * glowPulse);
      gp.width = gs;
      gp.height = gs;
      gp.tint = e.kind === "basic" ? 0xff6a3c : e.kind === "shooter" ? 0xff4ea8 : 0xffa63c;
      gp.alpha = (0.32 + 0.16 * glowPulse) * alpha;

      if (e.flashMs > 0) {
        const fp = flashPool.next();
        fp.texture = tex;
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
    source = source.slice(0, start) + replacement + source.slice(end);
  }
  write(path, source);
}

// 4. Isolate mobile preview save data and guarantee test Energy.
{
  const path = "src/store/playerStore.tsx";
  let source = read(path);
  if (source.includes('const SAVE_KEY = "starfire-armada-v2:save";')) {
    source = source.replace(
      'const SAVE_KEY = "starfire-armada-v2:save";',
      'const SAVE_KEY = "starfire-armada-v2:enemy-basic-sheet-v1-save";\nconst ENEMY_BASIC_SHEET_PREVIEW_ENERGY = 100;',
    );
  }
  if (!source.includes("const previewState: PlayerState")) {
    source = replaceOnce(
      source,
      "  if (loaded.shouldPersist) persistPlayerState(loaded.state);\n  return loaded.state;",
      `  const previewState: PlayerState = {
    ...loaded.state,
    currencies: {
      ...loaded.state.currencies,
      energy: Math.max(loaded.state.currencies.energy, ENEMY_BASIC_SHEET_PREVIEW_ENERGY),
    },
  };
  if (loaded.shouldPersist || previewState.currencies.energy !== loaded.state.currencies.energy) {
    persistPlayerState(previewState);
  }
  return previewState;`,
      "player-state load return",
    );
  }
  write(path, source);
}

// 5. Keep the nested Pages preview self-contained; avoids delayed Pixi chunks.
{
  const path = "vite.config.ts";
  let source = read(path);
  if (!source.includes("inlineDynamicImports")) {
    source = replaceOnce(
      source,
      '    assetsDir: "assets",\n',
      '    assetsDir: "assets",\n    rollupOptions: { output: { inlineDynamicImports: true } },\n',
      "Vite assets directory setting",
    );
  }
  write(path, source);
}

console.info("Applied the real basic-enemy spritesheet implementation.");
