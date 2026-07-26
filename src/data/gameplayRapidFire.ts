import {
  CHAPTER_BACKGROUND_IMAGE,
  RAPID_FIRE_PREMIUM_ASSETS,
} from "@/data/assetRegistry";

/**
 * Focused manifest for the Rapid-Fire combat slice.
 *
 * Mobile deployment note: only critical gameplay art is loaded before the
 * engine starts. The large optional animation-sheet pack is intentionally not
 * part of this blocking manifest; VfxSystem and PixiRenderer already treat
 * absent animation sheets as optional and safely skip those effects. This
 * prevents a slow/failed sheet decode on a fresh mobile cache from leaving the
 * HUD visible over an empty black playfield. Animated VFX should be restored
 * later through a non-blocking/lazy loader rather than the startup Promise.all.
 */
export const RAPID_FIRE_SLICE_ASSETS = {
  background: CHAPTER_BACKGROUND_IMAGE["chapter-01"],
  // Ship + presentation
  shipSprite: RAPID_FIRE_PREMIUM_ASSETS.playerSprite,
  maxAura: RAPID_FIRE_PREMIUM_ASSETS.maxAura,
  backgroundSpeedStreak: RAPID_FIRE_PREMIUM_ASSETS.backgroundSpeedStreak,
  // Enemies
  enemyBasic: RAPID_FIRE_PREMIUM_ASSETS.enemyBasic,
  enemyShooter: RAPID_FIRE_PREMIUM_ASSETS.enemyShooter,
  enemyPowerCarrier: RAPID_FIRE_PREMIUM_ASSETS.enemyPowerCarrier,
  // Projectiles
  primaryBolt: RAPID_FIRE_PREMIUM_ASSETS.primaryBolt,
  heavyBolt: RAPID_FIRE_PREMIUM_ASSETS.heavyBolt,
  projectileTrail: RAPID_FIRE_PREMIUM_ASSETS.projectileTrail,
  enemyBulletSmall: RAPID_FIRE_PREMIUM_ASSETS.enemyBulletSmall,
  enemyBulletAimed: RAPID_FIRE_PREMIUM_ASSETS.enemyBulletAimed,
  // Pickups
  fireUpPickup: RAPID_FIRE_PREMIUM_ASSETS.fireUpPickup,
  pickupMagnetGlow: RAPID_FIRE_PREMIUM_ASSETS.pickupMagnetGlow,
} as const;

export const RAPID_FIRE_SHIP_ID = "ship-01-rapid-fire" as const;
export const RAPID_FIRE_SLICE_STAGE_ID = "ch1-stage-1" as const;
