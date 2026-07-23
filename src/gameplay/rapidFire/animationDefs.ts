import type { SpriteSheetDef } from "./spriteAnimation";

/**
 * Spritesheet definitions for the Rapid-Fire premium animation pack.
 * Values mirror the adjacent JSON metadata shipped with each sheet in
 * public/assets/ui-v2/gameplay/rapid-fire-premium/animations/ — keep in sync
 * with those files (they remain the on-disk source of truth).
 */

const def = (
  imageKey: string,
  frameWidth: number,
  frameHeight: number,
  frameCount: number,
  columns: number,
  rows: number,
  fps: number,
  loop: boolean,
  anchorX = 0.5,
  anchorY = 0.5,
): SpriteSheetDef => ({
  imageKey,
  frameWidth,
  frameHeight,
  frameCount,
  columns,
  rows,
  fps,
  loop,
  anchorX,
  anchorY,
  additive: true,
});

export const ANIM = {
  /** Loops behind the player ship; anchor near the top of the flame. */
  thruster: def("animThruster", 256, 256, 8, 4, 2, 24, true, 0.5, 0.04),
  muzzleSmall: def("animMuzzleSmall", 256, 256, 4, 4, 1, 30, false),
  muzzleWide: def("animMuzzleWide", 512, 256, 5, 5, 1, 30, false),
  hitSparkSmall: def("animHitSparkSmall", 444, 444, 8, 4, 2, 20, false),
  playerDamageRing: def("animPlayerDamageRing", 512, 512, 8, 4, 2, 24, false),
  enemyMuzzle: def("animEnemyMuzzle", 256, 256, 4, 4, 1, 30, false),
  enemyHitSpark: def("animEnemyHitSpark", 256, 256, 5, 5, 1, 30, false),
  explosionSmall: def("animExplosionSmall", 256, 256, 5, 5, 1, 22, false),
  explosionMedium: def("animExplosionMedium", 384, 384, 14, 7, 2, 24, false),
  pickupBurst: def("animPickupBurst", 320, 320, 10, 5, 2, 24, false),
  maxFpBurst: def("animMaxFpBurst", 512, 512, 14, 7, 2, 24, false),
  impactRing: def("animImpactRing", 256, 256, 6, 6, 1, 30, false),
} as const satisfies Record<string, SpriteSheetDef>;
