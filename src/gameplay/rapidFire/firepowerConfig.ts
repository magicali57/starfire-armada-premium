/**
 * Firepower 0–10 pattern table — premium animation pass.
 *
 * Each level is a distinct emitter layout (not just "more bullets"):
 * lane offsets define emitter positions, angleDeg gives projectile
 * direction, damageMul/scale/glow define center-vs-wing emphasis, and
 * staggerMs adds subtle side-emitter timing. Muzzle treatment switches from
 * the small flash to the wide premium flash at FP5.
 *
 * Lane counts follow the approved progression:
 * FP0=2, FP1=3, FP2=4, FP3=5, FP4=6, FP5=7, FP6=8, FP7=9, FP8=10,
 * FP9=11, FP10=12.
 */

export const FIREPOWER_MAX = 10;

export type BoltKind = "primary" | "heavy";

export interface FireLane {
  /** Horizontal emitter offset from ship center (logical px). */
  xOffset: number;
  /** Projectile direction in degrees off straight-up (positive = right). */
  angleDeg: number;
  /** Damage multiplier vs base bolt damage. */
  damageMul: number;
  /** Render scale multiplier (collision radius scales separately). */
  scale: number;
  /** 0–1 additive glow intensity for this lane's projectiles. */
  glow: number;
  /** Delay after the volley starts before this lane fires (ms). */
  staggerMs: number;
  /** Bolt art. */
  kind: BoltKind;
  /** Optional volley rhythm: fire only when (volleyIndex % every) === phase. */
  every?: number;
  phase?: number;
}

export interface FirepowerLevelConfig {
  level: number;
  intervalMs: number;
  projectileSpeed: number;
  /** Muzzle flash treatment for this level's volleys. */
  muzzle: "small" | "wide";
  /** Overall glow character of the level (drives muzzle/aura brightness). */
  glowIntensity: number;
  lanes: FireLane[];
  /** FP10 heavy concentrated burst period (ms). */
  heavyBurstMs?: number;
  heavyBurstLanes?: FireLane[];
}

interface LaneOpts {
  angleDeg?: number;
  damageMul?: number;
  scale?: number;
  glow?: number;
  staggerMs?: number;
  kind?: BoltKind;
  every?: number;
  phase?: number;
}

const lane = (xOffset: number, opts: LaneOpts = {}): FireLane => ({
  xOffset,
  angleDeg: opts.angleDeg ?? 0,
  damageMul: opts.damageMul ?? 1,
  scale: opts.scale ?? 1,
  glow: opts.glow ?? 0.25,
  staggerMs: opts.staggerMs ?? 0,
  kind: opts.kind ?? "primary",
  every: opts.every,
  phase: opts.phase,
});

export const FIREPOWER_LEVELS: readonly FirepowerLevelConfig[] = [
  {
    // FP0 — 2 narrow central shots.
    level: 0,
    intervalMs: 240,
    projectileSpeed: 520,
    muzzle: "small",
    glowIntensity: 0.2,
    lanes: [lane(-8), lane(8)],
  },
  {
    // FP1 — 3-shot centered line.
    level: 1,
    intervalMs: 240,
    projectileSpeed: 540,
    muzzle: "small",
    glowIntensity: 0.22,
    lanes: [lane(-13), lane(0, { damageMul: 1.1, scale: 1.05, glow: 0.3 }), lane(13)],
  },
  {
    // FP2 — 4 lanes: two center, two outer.
    level: 2,
    intervalMs: 215,
    projectileSpeed: 580,
    muzzle: "small",
    glowIntensity: 0.25,
    lanes: [
      lane(-24, { glow: 0.2 }),
      lane(-8, { damageMul: 1.1, scale: 1.05, glow: 0.3 }),
      lane(8, { damageMul: 1.1, scale: 1.05, glow: 0.3 }),
      lane(24, { glow: 0.2 }),
    ],
  },
  {
    // FP3 — 5-shot mild spread (outer lanes angled slightly outward).
    level: 3,
    intervalMs: 215,
    projectileSpeed: 600,
    muzzle: "small",
    glowIntensity: 0.28,
    lanes: [
      lane(-26, { angleDeg: -4, glow: 0.2 }),
      lane(-13, { angleDeg: -1.5 }),
      lane(0, { damageMul: 1.15, scale: 1.1, glow: 0.35 }),
      lane(13, { angleDeg: 1.5 }),
      lane(26, { angleDeg: 4, glow: 0.2 }),
    ],
  },
  {
    // FP4 — 6-shot dual-center + wing pattern.
    level: 4,
    intervalMs: 195,
    projectileSpeed: 620,
    muzzle: "small",
    glowIntensity: 0.32,
    lanes: [
      lane(-30, { angleDeg: -5, damageMul: 0.85, scale: 0.9, glow: 0.2 }),
      lane(-16, { damageMul: 0.95 }),
      lane(-6, { damageMul: 1.25, scale: 1.12, glow: 0.4 }),
      lane(6, { damageMul: 1.25, scale: 1.12, glow: 0.4 }),
      lane(16, { damageMul: 0.95 }),
      lane(30, { angleDeg: 5, damageMul: 0.85, scale: 0.9, glow: 0.2 }),
    ],
  },
  {
    // FP5 — 7-shot strong center cluster + side support.
    // First obvious premium (wide) muzzle treatment.
    level: 5,
    intervalMs: 190,
    projectileSpeed: 640,
    muzzle: "wide",
    glowIntensity: 0.45,
    lanes: [
      lane(-32, { angleDeg: -6, damageMul: 0.75, scale: 0.85, glow: 0.2 }),
      lane(-18, { angleDeg: -2, damageMul: 0.9, glow: 0.25 }),
      lane(-8, { damageMul: 1.2, scale: 1.1, glow: 0.45 }),
      lane(0, { damageMul: 1.35, scale: 1.2, glow: 0.55 }),
      lane(8, { damageMul: 1.2, scale: 1.1, glow: 0.45 }),
      lane(18, { angleDeg: 2, damageMul: 0.9, glow: 0.25 }),
      lane(32, { angleDeg: 6, damageMul: 0.75, scale: 0.85, glow: 0.2 }),
    ],
  },
  {
    // FP6 — 8 symmetrical lanes with active wing emitters.
    level: 6,
    intervalMs: 185,
    projectileSpeed: 650,
    muzzle: "wide",
    glowIntensity: 0.5,
    lanes: [
      lane(-38, { angleDeg: -8, damageMul: 0.6, scale: 0.8, glow: 0.2 }),
      lane(-26, { angleDeg: -4, damageMul: 0.8, scale: 0.9, glow: 0.25 }),
      lane(-14, { damageMul: 1 }),
      lane(-5, { damageMul: 1.25, scale: 1.15, glow: 0.5 }),
      lane(5, { damageMul: 1.25, scale: 1.15, glow: 0.5 }),
      lane(14, { damageMul: 1 }),
      lane(26, { angleDeg: 4, damageMul: 0.8, scale: 0.9, glow: 0.25 }),
      lane(38, { angleDeg: 8, damageMul: 0.6, scale: 0.8, glow: 0.2 }),
    ],
  },
  {
    // FP7 — 9 lanes, thicker center, subtle side-emitter stagger.
    level: 7,
    intervalMs: 180,
    projectileSpeed: 660,
    muzzle: "wide",
    glowIntensity: 0.55,
    lanes: [
      lane(-40, { angleDeg: -9, damageMul: 0.55, scale: 0.8, glow: 0.2, staggerMs: 55 }),
      lane(-28, { angleDeg: -5, damageMul: 0.75, scale: 0.9, glow: 0.25, staggerMs: 30 }),
      lane(-16, { damageMul: 0.95 }),
      lane(-6, { damageMul: 1.3, scale: 1.2, glow: 0.55 }),
      lane(0, { damageMul: 1.4, scale: 1.28, glow: 0.6 }),
      lane(6, { damageMul: 1.3, scale: 1.2, glow: 0.55 }),
      lane(16, { damageMul: 0.95 }),
      lane(28, { angleDeg: 5, damageMul: 0.75, scale: 0.9, glow: 0.25, staggerMs: 30 }),
      lane(40, { angleDeg: 9, damageMul: 0.55, scale: 0.8, glow: 0.2, staggerMs: 55 }),
    ],
  },
  {
    // FP8 — 10 lanes, dense center + wide side coverage,
    // alternating center/side rhythm via every/phase.
    level: 8,
    intervalMs: 165,
    projectileSpeed: 680,
    muzzle: "wide",
    glowIntensity: 0.62,
    lanes: [
      lane(-44, { angleDeg: -11, damageMul: 0.55, scale: 0.8, glow: 0.2, staggerMs: 45, every: 2, phase: 1 }),
      lane(-32, { angleDeg: -6, damageMul: 0.7, scale: 0.88, glow: 0.25, every: 2, phase: 1 }),
      lane(-20, { angleDeg: -2, damageMul: 0.9, every: 2, phase: 0 }),
      lane(-10, { damageMul: 1.2, scale: 1.15, glow: 0.55, every: 2, phase: 0 }),
      lane(-4, { damageMul: 1.35, scale: 1.22, glow: 0.6 }),
      lane(4, { damageMul: 1.35, scale: 1.22, glow: 0.6 }),
      lane(10, { damageMul: 1.2, scale: 1.15, glow: 0.55, every: 2, phase: 0 }),
      lane(20, { angleDeg: 2, damageMul: 0.9, every: 2, phase: 0 }),
      lane(32, { angleDeg: 6, damageMul: 0.7, scale: 0.88, glow: 0.25, every: 2, phase: 1 }),
      lane(44, { angleDeg: 11, damageMul: 0.55, scale: 0.8, glow: 0.2, staggerMs: 45, every: 2, phase: 1 }),
    ],
  },
  {
    // FP9 — 11 lanes, strong center spine, longer/brighter projectiles.
    level: 9,
    intervalMs: 160,
    projectileSpeed: 700,
    muzzle: "wide",
    glowIntensity: 0.7,
    lanes: [
      lane(-46, { angleDeg: -12, damageMul: 0.5, scale: 0.8, glow: 0.25, staggerMs: 50 }),
      lane(-34, { angleDeg: -7, damageMul: 0.65, scale: 0.9, glow: 0.3, staggerMs: 25 }),
      lane(-22, { angleDeg: -3, damageMul: 0.85, glow: 0.35 }),
      lane(-12, { damageMul: 1.1, scale: 1.1, glow: 0.5 }),
      lane(-5, { damageMul: 1.35, scale: 1.28, glow: 0.65 }),
      lane(0, { damageMul: 1.45, scale: 1.35, glow: 0.7 }),
      lane(5, { damageMul: 1.35, scale: 1.28, glow: 0.65 }),
      lane(12, { damageMul: 1.1, scale: 1.1, glow: 0.5 }),
      lane(22, { angleDeg: 3, damageMul: 0.85, glow: 0.35 }),
      lane(34, { angleDeg: 7, damageMul: 0.65, scale: 0.9, glow: 0.3, staggerMs: 25 }),
      lane(46, { angleDeg: 12, damageMul: 0.5, scale: 0.8, glow: 0.25, staggerMs: 50 }),
    ],
  },
  {
    // FP10 — 12-shot maximum barrage: dominant center cluster, full side
    // lane support, strongest muzzle and projectile glow, plus the heavy
    // concentrated burst.
    level: 10,
    intervalMs: 145,
    projectileSpeed: 740,
    muzzle: "wide",
    glowIntensity: 0.85,
    lanes: [
      lane(-48, { angleDeg: -13, damageMul: 0.5, scale: 0.8, glow: 0.3, staggerMs: 50 }),
      lane(-36, { angleDeg: -8, damageMul: 0.6, scale: 0.9, glow: 0.35, staggerMs: 25 }),
      lane(-25, { angleDeg: -4, damageMul: 0.8, glow: 0.4 }),
      lane(-15, { angleDeg: -1.5, damageMul: 1, scale: 1.05, glow: 0.5 }),
      lane(-7, { damageMul: 1.3, scale: 1.22, glow: 0.7 }),
      lane(-2, { damageMul: 1.45, scale: 1.32, glow: 0.85 }),
      lane(2, { damageMul: 1.45, scale: 1.32, glow: 0.85 }),
      lane(7, { damageMul: 1.3, scale: 1.22, glow: 0.7 }),
      lane(15, { angleDeg: 1.5, damageMul: 1, scale: 1.05, glow: 0.5 }),
      lane(25, { angleDeg: 4, damageMul: 0.8, glow: 0.4 }),
      lane(36, { angleDeg: 8, damageMul: 0.6, scale: 0.9, glow: 0.35, staggerMs: 25 }),
      lane(48, { angleDeg: 13, damageMul: 0.5, scale: 0.8, glow: 0.3, staggerMs: 50 }),
    ],
    heavyBurstMs: 1350,
    heavyBurstLanes: [
      lane(-16, { damageMul: 2.2, scale: 1.5, glow: 0.9, kind: "heavy" }),
      lane(0, { damageMul: 2.8, scale: 1.75, glow: 1, kind: "heavy" }),
      lane(16, { damageMul: 2.2, scale: 1.5, glow: 0.9, kind: "heavy" }),
    ],
  },
];

export function getFirepowerConfig(level: number): FirepowerLevelConfig {
  const clamped = Math.max(0, Math.min(FIREPOWER_MAX, Math.trunc(level)));
  return FIREPOWER_LEVELS[clamped] ?? FIREPOWER_LEVELS[0];
}

export const MAX_FIREPOWER = {
  durationMs: 6000,
  refreshCapMs: 8000,
  fireRateBonus: 0.2,
  damageBonus: 0.15,
} as const;
