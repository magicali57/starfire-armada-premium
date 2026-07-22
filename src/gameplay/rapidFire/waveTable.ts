import type { EnemyKind } from "./enemyConfig";

export interface WaveSpawnEvent {
  /** Time from battle start (ms). */
  atMs: number;
  kind: EnemyKind;
  /** Normalized 0–1 x spawn (0.5 = center). */
  xNorm: number;
  /** Optional horizontal drift px/s. */
  driftX?: number;
}

export interface WaveDefinition {
  index: number;
  label: string;
  /** Inclusive start of wave window (ms). */
  startMs: number;
  spawns: WaveSpawnEvent[];
}

/**
 * Deterministic ~82s prototype stage for ch1-stage-1.
 * 11 Power Carriers (10 guaranteed + 1 Overdrive test).
 * Pacing targets: FP3~20s, FP5~35s, FP8~60s, FP10 before final wave.
 */
export const WAVE_COUNT = 5;

export const STAGE_WAVES: readonly WaveDefinition[] = [
  {
    index: 1,
    label: "Wave 1",
    startMs: 0,
    spawns: [
      { atMs: 1200, kind: "basic", xNorm: 0.3, driftX: 20 },
      { atMs: 1800, kind: "basic", xNorm: 0.7, driftX: -20 },
      { atMs: 3200, kind: "basic", xNorm: 0.5 },
      { atMs: 5000, kind: "powerCarrier", xNorm: 0.45 },
      { atMs: 7000, kind: "basic", xNorm: 0.25 },
      { atMs: 7800, kind: "basic", xNorm: 0.75 },
      { atMs: 10000, kind: "powerCarrier", xNorm: 0.55 },
      { atMs: 12000, kind: "shooter", xNorm: 0.35 },
      { atMs: 14000, kind: "basic", xNorm: 0.6 },
    ],
  },
  {
    index: 2,
    label: "Wave 2",
    startMs: 16000,
    spawns: [
      { atMs: 16500, kind: "basic", xNorm: 0.2 },
      { atMs: 17000, kind: "basic", xNorm: 0.8 },
      { atMs: 18500, kind: "powerCarrier", xNorm: 0.4 }, // ~FP3 target
      { atMs: 20000, kind: "shooter", xNorm: 0.65 },
      { atMs: 21000, kind: "basic", xNorm: 0.5, driftX: 30 },
      { atMs: 23000, kind: "powerCarrier", xNorm: 0.7 },
      { atMs: 25000, kind: "basic", xNorm: 0.3 },
      { atMs: 26000, kind: "basic", xNorm: 0.55 },
      { atMs: 28000, kind: "shooter", xNorm: 0.25 },
    ],
  },
  {
    index: 3,
    label: "Wave 3",
    startMs: 30000,
    spawns: [
      { atMs: 31000, kind: "basic", xNorm: 0.35 },
      { atMs: 31800, kind: "basic", xNorm: 0.65 },
      { atMs: 33500, kind: "powerCarrier", xNorm: 0.5 }, // ~FP5 target
      { atMs: 35000, kind: "shooter", xNorm: 0.3 },
      { atMs: 36000, kind: "shooter", xNorm: 0.7 },
      { atMs: 38000, kind: "basic", xNorm: 0.45, driftX: -25 },
      { atMs: 40000, kind: "powerCarrier", xNorm: 0.25 },
      { atMs: 42000, kind: "basic", xNorm: 0.8 },
      { atMs: 44000, kind: "basic", xNorm: 0.55 },
      { atMs: 46000, kind: "powerCarrier", xNorm: 0.6 },
    ],
  },
  {
    index: 4,
    label: "Wave 4",
    startMs: 48000,
    spawns: [
      { atMs: 49000, kind: "shooter", xNorm: 0.4 },
      { atMs: 50000, kind: "basic", xNorm: 0.2 },
      { atMs: 51000, kind: "basic", xNorm: 0.8 },
      { atMs: 53000, kind: "powerCarrier", xNorm: 0.5 },
      { atMs: 55000, kind: "shooter", xNorm: 0.28 },
      { atMs: 57000, kind: "basic", xNorm: 0.7, driftX: 20 },
      { atMs: 59000, kind: "powerCarrier", xNorm: 0.35 }, // ~FP8 target
      { atMs: 61000, kind: "basic", xNorm: 0.55 },
      { atMs: 63000, kind: "shooter", xNorm: 0.75 },
      { atMs: 65000, kind: "basic", xNorm: 0.4 },
    ],
  },
  {
    index: 5,
    label: "Wave 5",
    startMs: 67000,
    spawns: [
      { atMs: 68000, kind: "powerCarrier", xNorm: 0.45 }, // push toward FP10
      { atMs: 69500, kind: "shooter", xNorm: 0.3 },
      { atMs: 70000, kind: "shooter", xNorm: 0.7 },
      { atMs: 72000, kind: "basic", xNorm: 0.5 },
      { atMs: 73500, kind: "basic", xNorm: 0.25 },
      { atMs: 74000, kind: "basic", xNorm: 0.75 },
      { atMs: 76000, kind: "powerCarrier", xNorm: 0.55 }, // Overdrive test (+1)
      { atMs: 78000, kind: "shooter", xNorm: 0.4 },
      { atMs: 80000, kind: "basic", xNorm: 0.6 },
      { atMs: 82000, kind: "basic", xNorm: 0.35 },
    ],
  },
];

/** Flattened chronological spawn list. */
export function getOrderedSpawns(): WaveSpawnEvent[] {
  return STAGE_WAVES.flatMap((wave) => wave.spawns).slice().sort((a, b) => a.atMs - b.atMs);
}

export function getWaveIndexAt(elapsedMs: number): number {
  let current = 1;
  for (const wave of STAGE_WAVES) {
    if (elapsedMs >= wave.startMs) current = wave.index;
  }
  return current;
}

export const STAGE_DURATION_HINT_MS = 85000;
