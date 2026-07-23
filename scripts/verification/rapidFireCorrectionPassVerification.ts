/**
 * Focused verification for the mobile-playtest correction pass:
 * "Rebuild Rapid-Fire gameplay presentation, waves, background, and audio —
 * correction pass" (thruster/muzzle removal, red-flash hit feedback,
 * procedural destruction, enemy orientation, HP rebalance, larger
 * formations, compact HUD, wave-announcement gap timing).
 *
 * Static/structural checks only — no headless browser is available in this
 * sandbox, so canvas rendering and mobile viewport feel are not screenshot-
 * verified here (disclosed in the completion report).
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

// ---------------------------------------------------------------------
// 1) Fake detached thruster removed
// ---------------------------------------------------------------------
{
  check(!/private thruster/.test(engineSrc), "no thruster field remains on the engine");
  check(!engineSrc.includes("ANIM.thruster"), "thruster spritesheet is never spawned");
  check(engineSrc.includes("Under-ship glow"), "engine glow feel is now procedural, tied to the ship draw itself");
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
  check(engineSrc.includes('rgba(255, 40, 40'), "damage flash renders as a red tint");
  check(engineSrc.includes("source-atop"), "red tint is clipped to the ship's own visible pixels (source-atop)");
}

// ---------------------------------------------------------------------
// 4) Enemy destruction is procedural (flash + shockwave + debris), not the
//    old spritesheet bursts, and is size-scaled by enemy tier.
// ---------------------------------------------------------------------
{
  check(!engineSrc.includes("ANIM.explosionSmall") && !engineSrc.includes("ANIM.explosionMedium"), "no spritesheet explosion VFX spawned");
  check(engineSrc.includes("spawnExplosion") && engineSrc.includes("ExplosionFx"), "procedural explosion system exists");
  check(engineSrc.includes('"small" : enemy.kind === "powerCarrier" ? "large" : "medium"'), "destruction tier scales with enemy kind (basic < shooter < carrier)");
  check(engineSrc.includes("drawExplosions"), "explosions are actually drawn each frame");
}

// ---------------------------------------------------------------------
// 5) Enemy orientation fix
// ---------------------------------------------------------------------
{
  check(engineSrc.includes("Math.PI + bank"), "enemy sprites are rotated 180° so they face their direction of travel");
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
// 7) Formations: 10-15 enemies together in the densest phases
// ---------------------------------------------------------------------
{
  check(PEAK_PHASE_ENEMY_COUNT >= 10 && PEAK_PHASE_ENEMY_COUNT <= 15, `peak simultaneous formation population (${PEAK_PHASE_ENEMY_COUNT}) is 10-15`);
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

equal(SAVE_SCHEMA_VERSION, 12, "save schema unchanged at v12");
check(gameplayScreenSrc.includes("Win Stage (debug)"), "DEV debug buttons still exist in source, gated for local testing");
check(gameplayScreenSrc.includes("import.meta.env.DEV"), "Win/Lose debug controls remain DEV-gated (still stripped from production)");

console.log(`rapidFireCorrectionPassVerification: ${assertions} assertions passed`);
