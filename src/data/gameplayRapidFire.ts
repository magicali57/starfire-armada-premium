import {
  CHAPTER_BACKGROUND_IMAGE,
  RAPID_FIRE_PREMIUM_ASSETS,
  RAPID_FIRE_PREMIUM_ANIMATION_SHEETS,
} from "@/data/assetRegistry";

/**
 * Focused manifest for the Rapid-Fire combat slice.
 *
 * Critical gameplay art loads before the engine starts. Only the animation
 * sheets still used by the corrected presentation are exposed separately and
 * loaded sequentially after gameplay is already interactive, so a slow mobile
 * decode can never block the stage canvas.
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

/** Animations still used by the live gameplay correction pass. */
export const RAPID_FIRE_OPTIONAL_ANIMATION_ASSETS = {
  animImpactRing: RAPID_FIRE_PREMIUM_ANIMATION_SHEETS.animImpactRing,
  animEnemyHitSpark: RAPID_FIRE_PREMIUM_ANIMATION_SHEETS.animEnemyHitSpark,
  animEnemyMuzzle: RAPID_FIRE_PREMIUM_ANIMATION_SHEETS.animEnemyMuzzle,
  animPickupBurst: RAPID_FIRE_PREMIUM_ANIMATION_SHEETS.animPickupBurst,
  animMaxFpBurst: RAPID_FIRE_PREMIUM_ANIMATION_SHEETS.animMaxFpBurst,
} as const;

export const RAPID_FIRE_SHIP_ID = "ship-01-rapid-fire" as const;
export const RAPID_FIRE_SLICE_STAGE_ID = "ch1-stage-1" as const;
