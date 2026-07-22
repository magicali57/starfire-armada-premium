/** Firepower 0–10 pattern table — prototype values from RAPID_FIRE_VERTICAL_SLICE_SPEC. */

export const FIREPOWER_MAX = 10;

export interface FireLane {
  /** Horizontal offset from ship center in logical px. */
  xOffset: number;
  /** Damage multiplier vs base bolt damage (1 = normal). */
  damageMul: number;
  /** Render scale multiplier. */
  scale: number;
  /** Optional: only fire when (volleyIndex % every) === phase. */
  every?: number;
  phase?: number;
}

export interface FirepowerLevelConfig {
  level: number;
  intervalMs: number;
  projectileSpeed: number;
  lanes: FireLane[];
  /** FP10 heavy burst period (ms). */
  heavyBurstMs?: number;
  heavyBurstLanes?: FireLane[];
}

const lane = (xOffset: number, damageMul = 1, scale = 1, every?: number, phase?: number): FireLane => ({
  xOffset,
  damageMul,
  scale,
  every,
  phase,
});

export const FIREPOWER_LEVELS: readonly FirepowerLevelConfig[] = [
  {
    level: 0,
    intervalMs: 240,
    projectileSpeed: 520,
    lanes: [lane(-10), lane(10)],
  },
  {
    level: 1,
    intervalMs: 240,
    projectileSpeed: 520,
    lanes: [lane(-14), lane(0, 1.05), lane(14)],
  },
  {
    level: 2,
    intervalMs: 215,
    projectileSpeed: 600,
    lanes: [lane(-14), lane(0, 1.05), lane(14)],
  },
  {
    level: 3,
    intervalMs: 215,
    projectileSpeed: 600,
    lanes: [lane(-22), lane(-8), lane(8), lane(22)],
  },
  {
    level: 4,
    intervalMs: 195,
    projectileSpeed: 620,
    lanes: [lane(-22), lane(-7, 1.25, 1.15), lane(7, 1.25, 1.15), lane(22)],
  },
  {
    level: 5,
    intervalMs: 190,
    projectileSpeed: 640,
    lanes: [lane(-28), lane(-14), lane(0, 1.2, 1.2), lane(14), lane(28)],
  },
  {
    level: 6,
    intervalMs: 185,
    projectileSpeed: 650,
    lanes: [
      lane(-28),
      lane(-14),
      lane(0, 1.2, 1.2),
      lane(14),
      lane(28),
      lane(-38, 0.55, 0.7, 3, 0),
      lane(38, 0.55, 0.7, 3, 0),
    ],
  },
  {
    level: 7,
    intervalMs: 180,
    projectileSpeed: 660,
    lanes: [lane(-28), lane(-14), lane(0, 1.35, 1.25), lane(14), lane(28)],
  },
  {
    level: 8,
    intervalMs: 165,
    projectileSpeed: 680,
    lanes: [
      lane(-30, 1, 1.15),
      lane(-12, 1.15, 1.2),
      lane(0, 1.35, 1.3),
      lane(12, 1.15, 1.2),
      lane(30, 1, 1.15),
      lane(-42, 0.7, 0.85, 2, 0),
      lane(42, 0.7, 0.85, 2, 0),
    ],
  },
  {
    level: 9,
    intervalMs: 160,
    projectileSpeed: 700,
    lanes: [
      lane(-36, 0.55, 0.75),
      lane(-24, 0.75, 0.9),
      lane(-10, 1.1, 1.1),
      lane(0, 1.35, 1.25),
      lane(10, 1.1, 1.1),
      lane(24, 0.75, 0.9),
      lane(36, 0.55, 0.75),
    ],
  },
  {
    level: 10,
    intervalMs: 145,
    projectileSpeed: 740,
    lanes: [
      lane(-36, 0.55, 0.8),
      lane(-24, 0.8, 0.95),
      lane(-10, 1.15, 1.15),
      lane(0, 1.4, 1.3),
      lane(10, 1.15, 1.15),
      lane(24, 0.8, 0.95),
      lane(36, 0.55, 0.8),
    ],
    heavyBurstMs: 1350,
    heavyBurstLanes: [
      lane(-18, 2.2, 1.55),
      lane(0, 2.8, 1.8),
      lane(18, 2.2, 1.55),
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
