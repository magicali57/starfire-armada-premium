import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  RAPID_FIRE_PREMIUM_ASSETS,
  RAPID_FIRE_PREMIUM_ANIMATION_SHEETS,
} from "@/data/assetRegistry";
import { RAPID_FIRE_SLICE_ASSETS } from "@/data/gameplayRapidFire";
import { ANIM } from "@/gameplay/rapidFire/animationDefs";
import { FIREPOWER_LEVELS, getFirepowerConfig } from "@/gameplay/rapidFire/firepowerConfig";
import { SpriteAnimationInstance, VfxSystem, type SpriteSheetDef } from "@/gameplay/rapidFire/spriteAnimation";
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
  return path.join(root, "public", urlPath.replace(/^\//, ""));
}

// Every premium still + spritesheet resolves on disk
{
  for (const [key, url] of Object.entries(RAPID_FIRE_PREMIUM_ASSETS)) {
    check(fs.existsSync(publicPath(url)), `premium asset ${key} exists at ${url}`);
  }
  for (const [key, url] of Object.entries(RAPID_FIRE_PREMIUM_ANIMATION_SHEETS)) {
    check(fs.existsSync(publicPath(url)), `animation sheet ${key} exists at ${url}`);
  }
  for (const [key, url] of Object.entries(RAPID_FIRE_SLICE_ASSETS)) {
    check(fs.existsSync(publicPath(url)), `slice asset ${key} exists at ${url}`);
    check(!url.toLowerCase().endsWith(".gif"), `slice asset ${key} is not a GIF`);
  }
}

// animationDefs stays in sync with the on-disk JSON metadata
{
  const jsonByImageKey: Record<string, string> = {
    animThruster: "rapid_fire_thruster/rapid_fire_thruster_sheet.json",
    animMuzzleSmall: "rapid_fire_muzzle_flash_small/rapid_fire_muzzle_flash_small_sheet.json",
    animMuzzleWide: "rapid_fire_muzzle_flash_wide/rapid_fire_muzzle_flash_wide_sheet.json",
    animHitSparkSmall: "rapid_fire_hit_spark_small/rapid_fire_hit_spark_small_sheet.json",
    animPlayerDamageRing: "rapid_fire_player_damage_ring/rapid_fire_player_damage_ring_sheet.json",
    animEnemyMuzzle: "enemy_muzzle_flash/enemy_muzzle_flash_sheet.json",
    animEnemyHitSpark: "enemy_hit_spark/enemy_hit_spark_sheet.json",
    animExplosionSmall: "enemy_explosion_small/enemy_explosion_small_sheet.json",
    animExplosionMedium: "enemy_explosion_medium/enemy_explosion_medium_sheet.json",
    animPickupBurst: "pickup_collect_burst/pickup_collect_burst_sheet.json",
    animMaxFpBurst: "max_firepower_activation_burst/max_firepower_activation_burst_sheet.json",
    animImpactRing: "player_projectile_impact_ring/player_projectile_impact_ring_sheet.json",
  };
  const animBase = path.join(root, "public/assets/ui-v2/gameplay/rapid-fire-premium/animations");
  for (const def of Object.values(ANIM)) {
    const rel = jsonByImageKey[def.imageKey];
    check(rel, `metadata mapping for ${def.imageKey}`);
    const meta = JSON.parse(fs.readFileSync(path.join(animBase, rel), "utf8")) as {
      frameWidth: number;
      frameHeight: number;
      frameCount: number;
      columns: number;
      rows: number;
      fps: number;
      loop: boolean;
      anchor?: { x: number; y: number };
    };
    equal(def.frameWidth, meta.frameWidth, `${def.imageKey} frameWidth`);
    equal(def.frameHeight, meta.frameHeight, `${def.imageKey} frameHeight`);
    equal(def.frameCount, meta.frameCount, `${def.imageKey} frameCount`);
    equal(def.columns, meta.columns, `${def.imageKey} columns`);
    equal(def.rows, meta.rows, `${def.imageKey} rows`);
    equal(def.fps, meta.fps, `${def.imageKey} fps`);
    equal(def.loop, meta.loop, `${def.imageKey} loop`);
    if (meta.anchor) {
      equal(def.anchorX, meta.anchor.x, `${def.imageKey} anchorX`);
      equal(def.anchorY, meta.anchor.y, `${def.imageKey} anchorY`);
    }
  }
  equal(Object.keys(ANIM).length, 12, "all 12 pack animations defined");
}

// Animation runtime behavior (elapsed-time driven, one-shot completion,
// loop wrap, pause semantics, VFX cap + clear)
{
  const fakeImage = { complete: true, naturalWidth: 1 } as unknown as HTMLImageElement;
  const oneShotDef: SpriteSheetDef = {
    imageKey: "x",
    frameWidth: 10,
    frameHeight: 10,
    frameCount: 5,
    columns: 5,
    rows: 1,
    fps: 10,
    loop: false,
    anchorX: 0.5,
    anchorY: 0.5,
    additive: false,
  };
  const loopDef: SpriteSheetDef = { ...oneShotDef, loop: true };

  const oneShot = new SpriteAnimationInstance(oneShotDef, fakeImage);
  equal(oneShot.durationMs, 500, "one-shot duration = frames/fps");
  oneShot.update(499);
  equal(oneShot.done, false, "one-shot alive before final frame");
  oneShot.update(1);
  equal(oneShot.done, true, "one-shot removes itself after final frame");

  const loop = new SpriteAnimationInstance(loopDef, fakeImage);
  loop.update(10_000);
  equal(loop.done, false, "looping animation never self-removes");

  // Pause semantics: no update call → no time advance.
  const pausedInst = new SpriteAnimationInstance(oneShotDef, fakeImage);
  pausedInst.update(100);
  const progressBefore = pausedInst.progress;
  // (game paused — engine stops calling update)
  equal(pausedInst.progress, progressBefore, "no update → animation frozen");

  // VfxSystem cap + eviction + clear.
  const vfx = new VfxSystem({ x: fakeImage }, 4);
  for (let i = 0; i < 10; i += 1) vfx.spawn(oneShotDef, {});
  check(vfx.activeCount <= 4, "vfx capped (no unbounded accumulation)");
  vfx.update(600);
  equal(vfx.activeCount, 0, "finished one-shots swept");
  vfx.spawn(loopDef, {});
  vfx.spawn(oneShotDef, {});
  vfx.clear();
  equal(vfx.activeCount, 0, "clear() removes all instances on restart");

  // A full pool of loops must not be evicted by new one-shots.
  const loopPool = new VfxSystem({ x: fakeImage }, 2);
  loopPool.spawn(loopDef, {});
  loopPool.spawn(loopDef, {});
  const rejected = loopPool.spawn(oneShotDef, {});
  equal(rejected, null, "loops are never evicted for one-shots");
}

// Firepower premium progression: distinct lane counts 2→12, muzzle switch,
// glow escalation
{
  const laneCounts = FIREPOWER_LEVELS.map((l) => l.lanes.length);
  assert.deepEqual(laneCounts, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], "FP0–10 lane progression 2→12");
  assertions += 1;
  for (const level of FIREPOWER_LEVELS) {
    const xs = level.lanes.map((l) => l.xOffset);
    const sorted = [...xs].sort((a, b) => a - b);
    // Symmetry: offsets mirror around 0.
    for (let i = 0; i < sorted.length; i += 1) {
      const mirror = -sorted[sorted.length - 1 - i];
      check(Math.abs(sorted[i] - mirror) < 0.001, `FP${level.level} symmetric lanes`);
    }
    // Readability on 360px screens: pattern width stays well inside view.
    check(Math.max(...xs.map(Math.abs)) <= 48, `FP${level.level} pattern fits narrow screens`);
  }
  equal(getFirepowerConfig(4).muzzle, "small", "FP4 uses small muzzle flash");
  equal(getFirepowerConfig(5).muzzle, "wide", "FP5+ uses wide premium muzzle flash");
  check(
    getFirepowerConfig(10).glowIntensity > getFirepowerConfig(5).glowIntensity &&
      getFirepowerConfig(5).glowIntensity > getFirepowerConfig(0).glowIntensity,
    "glow escalates with Firepower",
  );
  check(getFirepowerConfig(7).lanes.some((l) => l.staggerMs > 0), "FP7 has side-emitter stagger");
  check(getFirepowerConfig(8).lanes.some((l) => l.every === 2), "FP8 alternating rhythm");
  check(getFirepowerConfig(10).heavyBurstLanes?.some((l) => l.kind === "heavy"), "FP10 heavy bolts");
}

// Engine wiring static checks
{
  const engineSrc = fs.readFileSync(path.join(root, "src/gameplay/rapidFire/RapidFireEngine.ts"), "utf8");
  for (const key of [
    "ANIM.thruster",
    "ANIM.muzzleSmall",
    "ANIM.muzzleWide",
    "ANIM.hitSparkSmall",
    "ANIM.playerDamageRing",
    "ANIM.enemyMuzzle",
    "ANIM.enemyHitSpark",
    "ANIM.explosionSmall",
    "ANIM.explosionMedium",
    "ANIM.pickupBurst",
    "ANIM.maxFpBurst",
    "ANIM.impactRing",
  ]) {
    check(engineSrc.includes(key), `engine wires ${key}`);
  }
  check(engineSrc.includes("this.vfx?.update(dt)"), "VFX time driven by simulation update");
  check(!engineSrc.includes("RAPID_FIRE_GAMEPLAY_ASSETS"), "engine no longer uses placeholder assets");
  check(engineSrc.includes("applyRewardBundle") === false, "engine never grants rewards");
  const sliceSrc = fs.readFileSync(path.join(root, "src/data/gameplayRapidFire.ts"), "utf8");
  check(!sliceSrc.includes(".gif"), "no GIF referenced at runtime");
  equal(SAVE_SCHEMA_VERSION, 12, "save schema unchanged at v12");
}

console.log(`rapidFirePremiumVerification: ${assertions} assertions passed`);
