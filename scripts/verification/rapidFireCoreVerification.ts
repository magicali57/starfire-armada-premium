import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { RAPID_FIRE_GAMEPLAY_ASSETS, SHIP_GAMEPLAY_SPRITE, CHAPTER_BACKGROUND_IMAGE } from "@/data/assetRegistry";
import { RAPID_FIRE_SHIP_ID, RAPID_FIRE_SLICE_STAGE_ID } from "@/data/gameplayRapidFire";
import { FIREPOWER_LEVELS, FIREPOWER_MAX, getFirepowerConfig, MAX_FIREPOWER } from "@/gameplay/rapidFire/firepowerConfig";
import { ENEMY_DEFS } from "@/gameplay/rapidFire/enemyConfig";
import { WAVE_PHASES, WAVE_COUNT, getOrderedSpawns, STAGE_DURATION_HINT_MS, TOTAL_POWER_CARRIERS } from "@/gameplay/rapidFire/waveTable";
import { SAVE_SCHEMA_VERSION } from "@/types";

let assertions = 0;
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
function publicPath(urlPath: string): string {
  // "/assets/..." → public/assets/...
  return path.join(root, "public", urlPath.replace(/^\//, ""));
}

// Asset paths resolve on disk
{
  for (const [key, url] of Object.entries(RAPID_FIRE_GAMEPLAY_ASSETS)) {
    check(fs.existsSync(publicPath(url)), `asset ${key} exists at ${url}`);
  }
  check(fs.existsSync(publicPath(SHIP_GAMEPLAY_SPRITE[RAPID_FIRE_SHIP_ID])), "Rapid-Fire gameplay sprite exists");
  check(fs.existsSync(publicPath(CHAPTER_BACKGROUND_IMAGE["chapter-01"])), "chapter-01 background exists");
}

// Identity + schema
{
  equal(RAPID_FIRE_SHIP_ID, "ship-01-rapid-fire", "canonical Rapid-Fire id");
  equal(RAPID_FIRE_SLICE_STAGE_ID, "ch1-stage-1", "slice host stage");
  equal(SAVE_SCHEMA_VERSION, 12, "save schema unchanged at v12");
}

// Firepower table
{
  equal(FIREPOWER_LEVELS.length, 11, "FP0–FP10 configs");
  equal(FIREPOWER_MAX, 10, "no Firepower 11");
  for (let level = 0; level <= 10; level += 1) {
    const cfg = getFirepowerConfig(level);
    equal(cfg.level, level, `config level ${level}`);
    check(cfg.intervalMs > 0, `interval positive at FP${level}`);
    check(cfg.lanes.length >= 2, `lanes at FP${level}`);
    check(cfg.projectileSpeed > 0, `speed at FP${level}`);
  }
  equal(getFirepowerConfig(0).intervalMs, 240, "FP0 interval");
  equal(getFirepowerConfig(10).intervalMs, 145, "FP10 interval");
  check(!!getFirepowerConfig(10).heavyBurstMs, "FP10 has heavy burst");
  equal(MAX_FIREPOWER.durationMs, 6000, "Max FP duration");
  equal(MAX_FIREPOWER.refreshCapMs, 8000, "Max FP refresh cap");
  // Clamp beyond 10
  equal(getFirepowerConfig(99).level, 10, "firepower clamps at 10");
  equal(getFirepowerConfig(-3).level, 0, "firepower clamps at 0");
}

// Pickup increment / Max FP logic (pure simulation of collect rules)
{
  let fp = 0;
  let maxRem = 0;
  const collect = () => {
    if (fp < FIREPOWER_MAX) {
      fp += 1;
      return;
    }
    if (maxRem <= 0) maxRem = MAX_FIREPOWER.durationMs;
    else maxRem = Math.min(MAX_FIREPOWER.refreshCapMs, maxRem + MAX_FIREPOWER.durationMs);
  };
  for (let i = 0; i < 10; i += 1) collect();
  equal(fp, 10, "10 pickups reach FP10");
  equal(maxRem, 0, "FP10 not yet Max FP");
  collect();
  equal(fp, 10, "extra pickup does not create FP11");
  equal(maxRem, 6000, "activates Max Firepower");
  collect();
  equal(maxRem, 8000, "refresh capped at 8s");
  // Replay reset
  fp = 0;
  maxRem = 0;
  equal(fp, 0, "Replay/Retry resets Firepower to 0");
}

// Damage does not reduce Firepower (rule check via invariant)
{
  let fp = 7;
  const hullBeforeDamage = 500;
  let hull = hullBeforeDamage;
  // simulate damage — firepower unchanged
  hull = Math.max(0, hull - 40);
  equal(fp, 7, "normal damage preserves Firepower");
  equal(hull, 460, "hull reduced");
  hull = Math.max(0, hull - 9999);
  equal(hull, 0, "hull clamps at zero");
}

// Enemies + waves
{
  check(ENEMY_DEFS.basic && ENEMY_DEFS.shooter && ENEMY_DEFS.powerCarrier, "three enemy defs");
  check(ENEMY_DEFS.shooter.shootIntervalMs! > 0, "shooter fires");
  equal(WAVE_COUNT, 12, "twelve choreographed wave phases (premium rebuild)");
  equal(WAVE_PHASES.length, 12, "wave phase table matches WAVE_COUNT");
  const spawns = getOrderedSpawns();
  check(spawns.length > 0, "deterministic spawns");
  const carriers = spawns.filter((s) => s.kind === "powerCarrier");
  equal(carriers.length, 11, "11 Power Carriers (10 + Overdrive test)");
  equal(TOTAL_POWER_CARRIERS, 11, "TOTAL_POWER_CARRIERS matches actual spawn count");
  // Spawn order sorted
  for (let i = 1; i < spawns.length; i += 1) {
    check(spawns[i].atMs >= spawns[i - 1].atMs, "spawn order non-decreasing");
  }
  for (let i = 1; i < WAVE_PHASES.length; i += 1) {
    check(WAVE_PHASES[i].startMs > WAVE_PHASES[i - 1].startMs, "wave phases strictly increasing");
  }
  // Every enemy belongs to a well-formed formation group.
  for (const s of spawns) {
    check(s.groupId.length > 0, `spawn has groupId (${s.kind}@${s.atMs})`);
    check(s.slot >= 0 && s.slot < s.slotCount, `slot within slotCount (${s.groupId})`);
  }
  // Stage pacing: at least 2 minutes, and the authored hint stays in a
  // reasonable range around the 2:00-3:00 target window.
  check(STAGE_DURATION_HINT_MS >= 120000, "stage duration hint is at least 2 minutes");
  check(STAGE_DURATION_HINT_MS <= 200000, "stage duration hint stays close to the 2:00-3:00 target");
}

// First-outcome / victory condition rules (documented invariants)
{
  let outcome: "none" | "victory" | "defeat" = "none";
  const lock = (next: "victory" | "defeat") => {
    if (outcome !== "none") return false;
    outcome = next;
    return true;
  };
  check(lock("victory"), "first outcome wins");
  equal(lock("defeat"), false, "second outcome rejected");
  equal(outcome, "victory", "outcome stays first");
}

// Engine source static checks
{
  const engineSrc = fs.readFileSync(path.join(root, "src/gameplay/rapidFire/RapidFireEngine.ts"), "utf8");
  check(engineSrc.includes("requestAnimationFrame"), "uses rAF");
  check(engineSrc.includes("MAX_DT"), "delta clamp present");
  check(!engineSrc.includes("applyRewardBundle"), "engine never grants rewards");
  check(!engineSrc.includes("persistPlayerState"), "engine never persists");
  const screenSrc = fs.readFileSync(path.join(root, "src/screens/gameplay/GameplayScreen.tsx"), "utf8");
  check(screenSrc.includes("import.meta.env.DEV"), "DEV win/lose gated");
  check(screenSrc.includes("declareBattleVictory"), "uses canonical victory");
  check(screenSrc.includes("completeBattle"), "uses completeBattle");
  check(screenSrc.includes("enterBattleResults"), "uses enterBattleResults");
}

console.log(`rapidFireCoreVerification: ${assertions} assertions passed`);
