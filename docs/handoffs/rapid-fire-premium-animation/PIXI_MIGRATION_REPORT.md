# Rapid-Fire Gameplay — PixiJS 8 Renderer Migration

Renderer-only migration. The Rapid-Fire vertical slice now draws through a
PixiJS 8 **WebGL** renderer instead of Canvas2D. Everything the request asked
to preserve is preserved: the migration touched only the presentation layer.

## 1. What changed (and what deliberately did not)

**Changed — the draw layer only:**
- New `src/gameplay/rapidFire/pixiRenderer.ts` — a `PixiRenderer` class that
  owns a Pixi `Application` (WebGL), a layered scene graph, pooled sprites,
  pre-sliced spritesheet textures, a generated radial-glow texture, and a
  single bloom `BlurFilter`. It exposes `init(images)`, `render(state)`, and
  `destroy()`.
- New `src/gameplay/rapidFire/renderTypes.ts` — the shared entity/render-state
  types (`Projectile`, `Enemy`, `Pickup`, `ExplosionFx`, `BgStar`,
  `RenderState`, …), moved out of the engine so the engine and renderer can
  share shapes with no circular import.
- `RapidFireEngine.ts` — all `draw*` methods and the 2D context were removed
  (~360 lines). The engine no longer calls `getContext("2d")`. It builds a
  persistent `RenderState` each frame and calls `this.renderer.render(rs)`.
- `spriteAnimation.ts` — added two read-only accessors (`frameIndex`,
  `resolvePose()`) and `VfxSystem.forEachActive()` so the renderer can draw
  the existing one-shot spritesheet VFX as Pixi sprites.

**Preserved — verified unchanged (simulation owns all of it):**
RapidFireEngine simulation, formations + phase-flow state machine, Firepower
0–10 progression, enemy HP/damage/contact/collisions and every hitbox (all
still computed in `resolveCollisions` against `enemy.radius` / `player.radius`
— the renderer never touches them), Fire-Up pickups, the whole audio system
and every event trigger, `BattlePerformance`, `BattleSession`, Results and
reward flow, and **save schema v12**. The three simulation verification
scripts (1,742 assertions total) still pass unchanged.

## 2. Architecture

```
RapidFireEngine (simulation, unchanged in behavior)
  └─ requestAnimationFrame loop  ← the ONE loop
       ├─ update(dt)      only when running (paused/outcome freezes it)
       └─ renderFrame()   every frame → PixiRenderer.render(renderState)

PixiRenderer (presentation only)
  Application (WebGL, autoStart:false, ticker stopped)
   stage
    └─ viewport            (scaled logical 390×700 → CSS px; carries screen shake)
        ├─ layerBg         TilingSprite bg + dim + pooled stars + streaks
        ├─ layerWorld      enemies, pickups, projectile bodies, hostile bolts
        ├─ layerGlow       additive glow twins + explosion cores + VFX + player glow/aura
        │                    └─ filters:[BlurFilter]   ← bloom (created once)
        ├─ layerFx         Graphics: explosion shockwave rings + debris (vector)
        └─ layerPlayer     the player ship sprite
```

- **One loop.** Pixi's ticker is never started (`autoStart:false` +
  `ticker.stop()`); the engine's existing rAF is the sole driver and calls
  `app.renderer.render(app.stage)` once per frame. Canvas2D and Pixi never run
  together — the engine no longer acquires a 2D context on the canvas (a canvas
  supports only one context type, so this is structurally guaranteed).
- **Preload / reuse.** Textures are created once from the engine's
  already-preloaded `HTMLImageElement`s (`Texture.from`). Each spritesheet is
  pre-sliced into per-frame sub-textures once (`sliceSheets`). A soft radial
  glow texture is generated once. All sprites come from `SpritePool`s that grow
  on demand and hide-not-destroy unused sprites each frame. The bloom
  `BlurFilter` is created once. The `render()` hot path constructs **no**
  sprites, textures, filters, or graphics (asserted structurally).
- **The premium jump** (what WebGL buys over Canvas2D): additive-blend glow
  twins on every projectile, additive explosion cores, additive muzzle/impact
  VFX and player glow/aura, all under a real Gaussian **bloom** filter — the
  soft light-bleed Canvas2D could not do. Projectile trails, ship, enemies, and
  bullets composite on the GPU.

## 3. Pause / cleanup correctness

- **Pause** freezes everything: the engine stops calling `update(dt)` when
  paused, so `elapsedMs`/scroll/entity state stop advancing; the renderer keeps
  drawing the frozen `RenderState`, so sprites, particles, background scroll,
  and spritesheet VFX all hold in place (their frame indices are functions of
  the frozen sim time).
- **Teardown** (`destroy()`, on unmount and on retry): the engine calls
  `renderer.destroy()`, which disconnects the `ResizeObserver`, destroys every
  sprite pool, clears and destroys the bloom filter, destroys the Pixi
  `Application` with `removeView:false` (the React-owned `<canvas>` stays), and
  destroys the generated + base textures. No ticker callbacks are ever
  registered, so none can leak. The async-init race (unmount during
  `await app.init`) is handled: `start()` disposes the just-created renderer if
  the engine was destroyed mid-init.

## 4. Changed / new files

```
NEW  src/gameplay/rapidFire/pixiRenderer.ts     WebGL renderer (Application, layers, pools, bloom, teardown)
NEW  src/gameplay/rapidFire/renderTypes.ts      shared entity + RenderState types (no circular import)
MOD  src/gameplay/rapidFire/RapidFireEngine.ts  removed 2D ctx + all draw*(); builds RenderState; drives renderer
MOD  src/gameplay/rapidFire/spriteAnimation.ts  frameIndex + resolvePose() + forEachActive() accessors
MOD  scripts/verification/rapidFireCorrectionPassVerification.ts  render assertions repointed to the renderer; +20 migration checks
```

`package.json` already lists `pixi.js@^8.19.0` (installed + committed by you
before this pass). No other dependencies added.

## 5. Verification performed here

- **esbuild bundle of `pixiRenderer.ts` with Pixi resolved (not external) —
  clean, zero errors.** This is the key gate available in my sandbox: it
  confirms every named import I use from `pixi.js` (`Application`, `BlurFilter`,
  `Container`, `Graphics`, `Rectangle`, `Sprite`, `Texture`, `TilingSprite`)
  actually exists in the installed package and the module graph bundles.
- esbuild transpile of `renderTypes.ts`, `pixiRenderer.ts`, and
  `RapidFireEngine.ts` — clean (syntax + local import resolution valid).
- API-shape spot checks against the installed Pixi `.d.ts`: confirmed
  `preference: "webgl"`, `BlurFilter({ strength, quality })`, and
  `renderer.render(Container)` are valid.
- `rapidFireCorrectionPassVerification.ts` — **66 assertions pass**, including
  20 new migration checks: engine has no 2D context/`ctx`, `PixiRenderer` is
  wired and driven from the engine loop, `autoStart:false` + `ticker.stop()`
  (one loop), exactly one `Application`, sprite pooling exists, the bloom filter
  is created once, spritesheets are pre-sliced, `render()` allocates no GPU
  objects, and teardown disposes Application + filter + ResizeObserver.
- Simulation intact: `rapidFireCoreVerification` (514), `rapidFireRebuild`
  (894), `rapidFirePremium` (334) — **all pass unchanged**.

## 6. Verification you should run on your machine

Full `tsc` and `vite build` exceed my sandbox's per-command time limit once
Pixi's large module graph is in play (the OneDrive-mount I/O is the bottleneck,
same wall that slowed the install) — so the authoritative type + build gate
runs on your side:

```
npm run typecheck        # tsc -b : the deep TypeScript type gate (I could not run this here)
npm run build            # tsc -b && vite build : confirms the production bundle
npm run dev              # play it
```

If `typecheck` flags anything, it'll be a Pixi option-object type detail
(esbuild strips types without checking them); paste it and I'll fix immediately.

## 7. Exact mobile gameplay checks for you to perform

Play `Campaign → Chapter 1 → Stage 1` on a phone (or mobile-emulated) and
confirm:

1. The game renders at all (WebGL canvas fills the screen, no black area, no
   blank/white canvas, no console errors).
2. Player ship draws, moves with your finger, banks left/right, and the
   under-ship glow shows (brighter at MAX Firepower).
3. Projectiles fire upward with a visible **glow/bloom** (this is the premium
   WebGL win — bolts should look like they emit light, not flat PNGs).
4. Enemies enter in formations, face **downward** (nose toward you), flash
   white when hit, and take several hits to die (not 1–2).
5. Enemy destruction shows the procedural burst: bright core flash + expanding
   ring + debris streaks, bigger for Power Carriers.
6. Getting hit flashes the ship **red** briefly (no floating rings/circles).
7. Fire-Up pickups bob with a glow and are collectable; Firepower bar fills.
8. MAX FIREPOWER: activation + a looping aura around the ship.
9. Background scrolls smoothly and seamlessly (no seam line, no stutter).
10. Center-screen "WARNING / WAVE N/12" appears between waves with the ~6s gap.
11. **Pause** freezes everything (ships, bullets, background, particles) and
    resume continues cleanly with no time jump.
12. Win/lose still routes to Results with correct rewards; replaying the stage
    (retry) starts fresh with no leftover sprites, no slowdown, no doubled
    audio, and no WebGL context warnings.
13. Performance: steady framerate on your device during the dense phases
    (Phase 8 / Phase 11, 10–15 enemies). If it drops, tell me — the bloom
    filter strength/quality and pool caps are the first things to tune.

## 8. Remaining risks / notes (disclosed)

- **No visual or mobile verification was done by me** — I cannot run WebGL or a
  browser in this sandbox. Everything above is structural + bundling
  verification. Item 7 is yours.
- **Deep TS type-check not run here** (sandbox time limit). esbuild confirms the
  imports resolve and the code bundles, but not every Pixi option-object type.
  `npm run typecheck` on your machine is the backstop.
- **Bloom cost on low-end mobile**: a full-layer `BlurFilter` is the one place I'd
  watch for frame drops. It's created once (not per frame) and strength is
  modest (5), but if you see slowdown, that's the knob.
- **Old Canvas draw code is fully removed** — if you ever want to A/B against the
  old renderer, it's in git history (the checkpoint commits you made).
- Both of your pre-migration checkpoints remain intact and recoverable in
  history; this pass adds one commit on top and is not pushed.

## 9. Local commit

One commit, message:

```
Migrate Rapid-Fire gameplay rendering to a PixiJS 8 WebGL renderer (renderer-only; simulation, formations, audio, collisions, schema v12 preserved)
```

Not pushed.
