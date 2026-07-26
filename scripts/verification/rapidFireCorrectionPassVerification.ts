/**
 * Focused verification for the mobile-playtest correction pass:
 * "Rebuild Rapid-Fire gameplay presentation, waves, background, and audio —
 * correction pass" (thruster/muzzle removal, red-flash hit feedback,
 * procedural destruction, enemy orientation, HP rebalance, larger
 * formations, compact HUD, wave-announcement gap timing).
 *
 * Also covers the PixiJS renderer migration (section 12): the WebGL renderer
 * owns all drawing, the engine keeps the simulation and no longer touches
 * Canvas2D, one loop drives both, textures are preloaded/pooled, and teardown
 * disposes the Application/filter/observer.
 *
 * Static/structural checks only — no headless browser is available in this
 * sandbox, so actual WebGL rendering and mobile viewport feel are not
 * screenshot-verified here (disclosed in the completion report; the user
 * verifies visually + runs the full typecheck/build on their machine).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ENEMY_DEFS } from "@/gameplay/rapidFire/enemyConfig";
import { PEAK_PHASE_ENEMY_COUNT } from "@/gameplay/rapidFire/waveTable";
import { SAVE_SCHEMA_VERSION } from "@/types";

let assertions = 0;
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const engineSrc = fs.readFileSync(path.join(root, "src/gameplay/rapidFire/RapidFireEngine.ts"), "utf8");
const gameplayScreenSrc = fs.readFileSync(path.join(root, "src/screens/gameplay/GameplayScreen.tsx"), "utf8");
const gameplayCss = fs.readFileSync(path.join(root, "src/screens/gameplay/GameplayScreen.css"), "utf8");
// Since the PixiJS migration, drawing lives in pixiRenderer.ts. The behavior
// guarantees below are asserted against whichever file now owns them.
const rendererSrc = fs.readFileSync(path.join(root, "src/gameplay/rapidFire/pixiRenderer.ts"), "utf8");
const gameCanvasSrc = fs.readFileSync(path.join(root, "src/gameplay/rapidFire/GameCanvas.tsx"), "utf8");

// ---------------------------------------------------------------------
// 1) Fake detached thruster removed
// ---------------------------------------------------------------------
{
  check(!/private thruster/.test(engineSrc), "no thruster field remains on the engine");
  check(!engineSrc.includes("ANIM.thruster"), "thruster spritesheet is never spawned");
  check(/under-ship glow/i.test(rendererSrc), "ship glow feel is procedural (additive under-ship glow in the renderer), not a detached VFX");
}

// ---------------------------------------------------------------------
// 2) Muzzle flash / splash removed
// ---------------------------------------------------------------------
{
  check(!engineSrc.includes("spawnMuzzleFlash"), "spawnMuzzleFlash method is fully removed");
  check(!engineSrc.includes("ANIM.muzzleSmall") && !engineSrc.includes("ANIM.muzzleWide"), "no muzzle spritesheet spawns at the ship nose");
}

// ---------------------------------------------------------------------
// 3) Player-hit feedback is a red flash, not a spawned ring/spark VFX
// ---------------------------------------------------------------------
{
  check(engineSrc.includes("damageFlashMs"), "engine tracks a dedicated damage-flash timer");
  check(!engineSrc.includes("ANIM.playerDamageRing") && !engineSrc.includes("ANIM.hitSparkSmall"), "no ring/spark VFX spawned on player damage");
  check(rendererSrc.includes("damageFlashMs"), "renderer consumes the damage-flash timer");
  check(/damage flash/i.test(rendererSrc) && rendererSrc.includes("0xff"), "damage flash renders as a red tint on the ship sprite");
}

// ---------------------------------------------------------------------
// 4) Enemy destruction is procedural (ignition + fireball + embers), not the
//    old spritesheet bursts, and is size-scaled by enemy tier.
// ---------------------------------------------------------------------
{
  check(!engineSrc.includes("ANIM.explosionSmall") && !engineSrc.includes("ANIM.explosionMedium"), "no spritesheet explosion VFX spawned");
  check(engineSrc.includes("spawnExplosion") && engineSrc.includes("ExplosionFx"), "procedural explosion system exists");
  check(engineSrc.includes('"small" : enemy.kind === "powerCarrier" ? "large" : "medium"'), "destruction tier scales with enemy kind (basic < shooter < carrier)");
  check(
    rendererSrc.includes("syncExplosions") &&
      rendererSrc.includes("Layered filled fireball") &&
      rendererSrc.includes("Short warm ember trails"),
    "explosions are drawn each frame (ignition + filled fireball + embers) by the renderer",
  );
}

// ---------------------------------------------------------------------
// 5) Enemy orientation fix
// ---------------------------------------------------------------------
{
  check(rendererSrc.includes("Math.PI + bank"), "enemy sprites are rotated 180° so they face their direction of travel");
}

// ---------------------------------------------------------------------
// 6) Enemy durability rebalance
// ---------------------------------------------------------------------
{
  check(ENEMY_DEFS.basic.hull >= 100, "basic fighter no longer dies in 1-2 hits");
  check(ENEMY_DEFS.shooter.hull >= 250, "shooter is noticeably tougher");
  check(ENEMY_DEFS.powerCarrier.hull >= 450, "Power Carrier survives the longest");
}

// ---------------------------------------------------------------------
// 7) Formations: reference-arcade density in the densest phases
// ---------------------------------------------------------------------
{
  check(PEAK_PHASE_ENEMY_COUNT >= 20 && PEAK_PHASE_ENEMY_COUNT <= 36, `peak simultaneous formation population (${PEAK_PHASE_ENEMY_COUNT}) reaches reference density`);
}

// ---------------------------------------------------------------------
// 8) Compact reference-style HUD (no full-width bar; playfield fills screen)
// ---------------------------------------------------------------------
{
  check(gameplayScreenSrc.includes("gameplay-hud-compact"), "compact corner HUD markup exists");
  check(!gameplayScreenSrc.includes('className="gameplay-hud"'), "old full-width HUD container is removed");
  check(gameplayCss.includes(".gameplay-hud-compact {") && gameplayCss.includes("position: absolute"), "compact HUD floats over the playfield instead of consuming layout height");
  check(gameplayCss.includes("flex: 1 1 auto") , "playfield remains flex:1 so the canvas fills the full screen");
}

// ---------------------------------------------------------------------
// 9) Center-screen wave announcement with the 2s/2s/2s gap timing
// ---------------------------------------------------------------------
{
  check(engineSrc.includes("PHASE_GAP_PAUSE_MS = 2000"), "2s pause before the announcement");
  check(engineSrc.includes("PHASE_GAP_ANNOUNCE_MS = 2000"), "2s announcement display");
  check(engineSrc.includes("PHASE_GAP_TRANSITION_MS = 2000"), "2s transition before the next phase");
  check(engineSrc.includes('title: "WARNING"'), 'announcement uses a "WARNING" style title');
  check(gameplayScreenSrc.includes("gameplay-announcement"), "center-screen announcement overlay is rendered");
  check(!gameplayScreenSrc.includes("gameplay-hud__wave"), "the old constantly-shown wave counter markup is gone");
}

// ---------------------------------------------------------------------
// 10) Background motion: increased scroll speed vs. the prior (too-static) pass
// ---------------------------------------------------------------------
{
  check(engineSrc.includes("dt * 0.06") , "far-layer background scroll speed increased for visibly-alive motion");
  check(engineSrc.includes("dt * 0.26"), "near-layer speed streak scroll increased to match");
  check(rendererSrc.includes("tilePosition") && rendererSrc.includes("TilingSprite"), "renderer scrolls the background via a Pixi TilingSprite");
}

// ---------------------------------------------------------------------
// 11) Sound preserved — every prior event-mapped call site still present
// ---------------------------------------------------------------------
{
  for (const call of [
    "this.audio.playerShot",
    "this.audio.enemyShot",
    "this.audio.impact",
    "this.audio.explosion(",
    "this.audio.playerDamage",
    "this.audio.pickupCollect",
    "this.audio.maxFirepowerActivate",
    "this.audio.waveStart",
    "this.audio.warning",
    "this.audio.pauseCue",
    "this.audio.resumeCue",
    "this.audio.victory",
    "this.audio.defeat",
  ]) {
    check(engineSrc.includes(call), `sound event preserved: ${call}`);
  }
}

// ---------------------------------------------------------------------
// 12) PixiJS renderer migration: WebGL renderer owns drawing; the engine
//     keeps the simulation and no longer touches Canvas2D; one loop; textures
//     preloaded/reused; full teardown.
// ---------------------------------------------------------------------
{
  // Engine no longer acquires a 2D context (guarantees Canvas2D and Pixi
  // never run on the same canvas).
  check(!engineSrc.includes('getContext("2d")'), "engine no longer acquires a Canvas2D context");
  check(!engineSrc.includes("CanvasRenderingContext2D"), "engine has no Canvas2D type references left");
  check(!/private ctx/.test(engineSrc), "engine has no 2D ctx field");

  // Renderer wired in and driven from the engine's single loop.
  check(engineSrc.includes("new PixiRenderer") && engineSrc.includes("this.renderer"), "engine owns a PixiRenderer");
  check(engineSrc.includes("this.renderer.render(rs)"), "engine drives rendering from its own loop each frame");
  check(engineSrc.includes("renderFrame"), "engine has a single render step feeding sim state to the renderer");

  // One loop: Pixi's ticker is not the driver.
  check(rendererSrc.includes("autoStart: false"), "Pixi Application autoStart is disabled (no second loop)");
  check(rendererSrc.includes("ticker.stop()"), "Pixi ticker is explicitly stopped");
  check((rendererSrc.match(/new Application\(\)/g) ?? []).length === 1, "exactly one Pixi Application is created");

  // Preload / reuse: textures + pools built once.
  check(rendererSrc.includes("class SpritePool"), "sprites are pooled and reused, not created per frame");
  check(rendererSrc.includes("sliceSheets"), "spritesheets are pre-sliced into per-frame textures once");
  check(rendererSrc.includes("Texture.from"), "textures are created once from the preloaded images");
  // Filters are allowed only when scoped to a single sprite with explicit
  // bounds. A filter on a whole layer container forces a render-to-texture
  // pass over unstable/empty bounds, which is exactly the class of failure
  // that can blank the scene on mobile GPUs.
  for (const layer of ["layerGlow", "layerWorld", "layerFx", "layerPlayer", "layerBg", "viewport"]) {
    check(!new RegExp(`${layer}\\.filters`).test(rendererSrc), `no filter is applied to the ${layer} container`);
  }
  check(rendererSrc.includes("tiling.filters"), "backdrop filters are scoped to the background sprite only");
  check(rendererSrc.includes("filterArea"), "the filtered backdrop sprite declares an explicit filterArea");
  check(rendererSrc.includes('blendMode = "add"'), "gameplay glow is achieved with additive blending");
  // A throwing render must be surfaced, not silently swallowed by the loop.
  check(engineSrc.includes("Renderer failed"), "engine logs a render failure instead of silently drawing nothing");
  check(engineSrc.includes("getLastRenderError"), "engine exposes the first render error for diagnosis");

  // Regression guard (blank-canvas bug): a <canvas> only ever yields ONE
  // WebGL context, so the renderer must create/own its own canvas inside a
  // host element. Reusing a React-rendered <canvas> across engine instances
  // (StrictMode's double-effect, or a stage retry) hands the second instance a
  // dead context that draws nothing without throwing.
  check(rendererSrc.includes('document.createElement("canvas")'), "renderer creates its own canvas element");
  check(rendererSrc.includes("this.host.appendChild"), "renderer appends its canvas into the host element");
  check(rendererSrc.includes("removeView: true"), "renderer removes its canvas on teardown so the next instance gets a fresh context");
  check(engineSrc.includes("host: HTMLElement"), "engine takes a host element, not a canvas");
  // Ignore prose in comments; assert on the actual JSX element that is rendered.
  const gameCanvasCode = gameCanvasSrc.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  check(!/<canvas[\s/>]/.test(gameCanvasCode), "React renders a host element, not a <canvas>, for the gameplay renderer");
  check(/<div\s/.test(gameCanvasCode), "React renders a <div> host for the renderer to populate");
  check(!gameCanvasCode.includes("canvasRef"), "no React canvas ref remains");

  // The render() hot path must not allocate GPU objects. Slice out the
  // render method body and assert no per-frame construction of sprites,
  // textures, filters, or graphics inside it.
  const renderIdx = rendererSrc.indexOf("render(s: RenderState)");
  const renderBody = renderIdx >= 0 ? rendererSrc.slice(renderIdx, renderIdx + 1400) : "";
  check(renderIdx >= 0, "renderer exposes a render(state) entry point");
  check(
    !/new Sprite|new Texture|new BlurFilter|new Graphics|new TilingSprite/.test(renderBody),
    "render() allocates no sprites/textures/filters/graphics (pools + reused objects only)",
  );

  // Teardown: Application, pools, filter, and ResizeObserver all disposed.
  check(rendererSrc.includes("this.app?.destroy") || rendererSrc.includes("this.app.destroy"), "renderer destroys the Pixi Application");
  check(rendererSrc.includes("resizeObserver") && rendererSrc.includes("disconnect"), "renderer disconnects its ResizeObserver on teardown");
  check(engineSrc.includes("this.renderer?.destroy()"), "engine destroys the renderer on its own teardown/retry");
}

// ---------------------------------------------------------------------
// 13) Backdrop readability pass: the background must read as far away so
//     bright sprites separate from it (darkened, blurred, desaturated,
//     vignetted), and sprites carry a dark contour for separation.
// ---------------------------------------------------------------------
{
  check(rendererSrc.includes("new BlurFilter"), "backdrop is softened so its detail stops competing with sprites");
  check(rendererSrc.includes("new ColorMatrixFilter"), "backdrop is colour-graded");
  check(/saturate\(-/.test(rendererSrc), "backdrop is desaturated so it stops clashing with cyan gameplay art");
  check(/brightness\(0\.\d+/.test(rendererSrc), "backdrop value range is crushed downward");
  check(/tiling\.alpha\s*=\s*0\.5/.test(rendererSrc), "backdrop alpha reduced from the previous 0.85");
  check(rendererSrc.includes("makeVignetteTexture"), "a vignette focuses attention on the centre of play");
  check(/alpha:\s*0\.55/.test(rendererSrc), "the mood-dim overlay was strengthened");

  // Dark contour behind sprites (what keeps reference arcade art readable).
  check(rendererSrc.includes("enemyOutlinePool"), "enemies get a dark contour sprite");
  check(rendererSrc.includes("playerOutline"), "the player ship gets a dark contour sprite");
  // Contours must be created before the sprites they sit behind.
  check(
    rendererSrc.indexOf("this.enemyOutlinePool = new SpritePool") < rendererSrc.indexOf("this.enemyPool = new SpritePool"),
    "enemy contour pool is created before the enemy pool so it renders behind",
  );
}

// ---------------------------------------------------------------------
// 14) Idle animation on single-frame art: enemies "flap" by oscillating
//     their horizontal silhouette (measured from reference sprite sheets),
//     desynchronized per enemy, plus engine glow; the player's flame pulses.
// ---------------------------------------------------------------------
{
  check(rendererSrc.includes("FLAP_PERIOD_MS"), "enemies have a wing-flap cycle");
  check(rendererSrc.includes("flapAmplitude"), "flap amplitude varies by enemy weight class");
  check(/flapW/.test(rendererSrc) && /flapH/.test(rendererSrc), "flap drives sprite width and height");
  // The flap must be applied to the sprite, its contour and its hit-flash copy,
  // otherwise the layers visibly desynchronize.
  check((rendererSrc.match(/flapW/g) ?? []).length >= 3, "flap is applied to sprite, contour and flash copy alike");
  // Desynchronization is what stops fake animation reading as fake.
  check(rendererSrc.includes("e.swayPhase * 2.7"), "each enemy flaps on its own phase offset, not in unison");
  check(rendererSrc.includes("enemyGlowPool"), "enemies carry a pulsing engine glow");
  check(/Engine flame/i.test(rendererSrc), "the player's engine flame pulses");
}

equal(SAVE_SCHEMA_VERSION, 12, "save schema unchanged at v12");
check(gameplayScreenSrc.includes("Win Stage (debug)"), "DEV debug buttons still exist in source, gated for local testing");
check(gameplayScreenSrc.includes("import.meta.env.DEV"), "Win/Lose debug controls remain DEV-gated (still stripped from production)");

console.log(`rapidFireCorrectionPassVerification: ${assertions} assertions passed`);
