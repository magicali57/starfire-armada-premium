/**
 * Shared entity + render-state types for the Rapid-Fire gameplay slice.
 *
 * These were previously private to RapidFireEngine. They live here so the
 * simulation (RapidFireEngine) and the renderer (PixiRenderer) can share the
 * exact same data shapes without a circular import: both modules depend on
 * this file; neither depends on the other's implementation.
 *
 * The renderer only ever READS these. All mutation (movement, collisions,
 * lifetimes, hitboxes) stays owned by the simulation.
 */
import type { BoltKind } from "./firepowerConfig";
import type { EnemyKind } from "./enemyConfig";
import type { FormationPhase, FormationType } from "./formationConfig";
import type { VfxSystem } from "./spriteAnimation";

export interface Vec {
  x: number;
  y: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  scale: number;
  glow: number;
  kind: BoltKind;
  hostile: boolean;
  /** Hostile art variant. */
  hostileKind?: "small" | "aimed";
  rotation: number;
  alive: boolean;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hull: number;
  radius: number;
  w: number;
  h: number;
  shootCd: number;
  shotIndex: number;
  /** Presentation state. */
  swayPhase: number;
  entryMs: number;
  flashMs: number;
  recoilMs: number;
  dying: boolean;
  dyingMs: number;
  alive: boolean;
  dropped: boolean;
  /** Formation choreography (every enemy belongs to a formation group). */
  formation: FormationType;
  slot: number;
  slotCount: number;
  formationSpawnedAtMs: number;
  formationPhase: FormationPhase;
  canFire: boolean;
}

export interface Pickup {
  x: number;
  y: number;
  vy: number;
  radius: number;
  phase: number;
  alive: boolean;
}

export interface Debris {
  angle: number;
  dist: number;
  speed: number;
  len: number;
}

/**
 * Procedural destruction burst: a white-hot ignition, layered orange fireball
 * and short ember trails, size-scaled by `scale`. Rendered by PixiRenderer as
 * additive glow + reused vector Graphics — no per-frame display allocation.
 */
export interface ExplosionFx {
  x: number;
  y: number;
  ageMs: number;
  durationMs: number;
  scale: number;
  /** Hex color for ring/flash, e.g. 0xff963c. */
  color: number;
  debris: Debris[];
}

export interface BgStar {
  x: number;
  y: number;
  r: number;
  speedMul: number;
  a: number;
}

/**
 * Everything the renderer needs for one frame. The engine mutates the scalar
 * fields on a single persistent instance and points the array fields at its
 * live entity arrays each frame — so handing this to the renderer allocates
 * nothing per frame.
 */
export interface RenderState {
  elapsedMs: number;
  bank: number;
  recoil: number;
  damageFlashMs: number;
  invulnMs: number;
  shakeMs: number;
  shakeMag: number;

  firepower: number;
  maxActive: boolean;
  atMax: boolean;

  playerX: number;
  playerY: number;
  playerW: number;
  playerH: number;

  bgScroll: number;
  streakScroll: number;
  stars: BgStar[];

  playerShots: Projectile[];
  hostileShots: Projectile[];
  enemies: Enemy[];
  pickups: Pickup[];
  explosions: ExplosionFx[];
  vfx: VfxSystem | null;
}
