import {
  CHAPTER_BACKGROUND_IMAGE,
  RAPID_FIRE_PREMIUM_ASSETS,
  RAPID_FIRE_PREMIUM_ANIMATION_SHEETS,
} from "@/data/assetRegistry";

/**
 * Focused manifest for the Rapid-Fire ch1-stage-1 combat slice.
 * Premium pass (2026-07-23): combat art comes from the rapid-fire-premium
 * pack; the old placeholder combat assets and the roster gameplay sprite are
 * no longer used in combat.
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
  // Animation spritesheets (runtime PNGs; GIF previews are never loaded)
  ...RAPID_FIRE_PREMIUM_ANIMATION_SHEETS,
} as const;

export const RAPID_FIRE_SHIP_ID = "ship-01-rapid-fire" as const;
export const RAPID_FIRE_SLICE_STAGE_ID = "ch1-stage-1" as const;
