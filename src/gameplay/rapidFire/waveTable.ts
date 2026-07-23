import type { EnemyKind } from "./enemyConfig";
import type { FormationSpawnEvent, FormationType } from "./formationConfig";

/**
 * Stage 1 wave design — premium choreography rebuild.
 *
 * ch1-stage-1 is now built from 12 named phases spanning ~2 minutes 45
 * seconds (target range: 2:00–3:00), instead of enemies simply falling
 * straight down. Every enemy belongs to a `FormationSpawnEvent` group; see
 * `formationConfig.ts` for how each formation type moves. Power Carriers are
 * threaded individually through the timeline (11 total: 10 guaranteed to
 * carry the player from Firepower 0 to 10, plus 1 extra so MAX FIREPOWER —
 * OVERDRIVE gets tested/refreshed near the climax), matching the prior
 * prototype's guarantee while fitting the new formation timeline.
 */

export interface WavePhase {
  index: number;
  label: string;
  startMs: number;
}

interface GroupSpec {
  atMs: number;
  formation: FormationType;
  groupId: string;
  members: readonly EnemyKind[];
}

function group(spec: GroupSpec): FormationSpawnEvent[] {
  return spec.members.map((kind, slot) => ({
    atMs: spec.atMs,
    kind,
    formation: spec.formation,
    groupId: spec.groupId,
    slot,
    slotCount: spec.members.length,
  }));
}

const B: EnemyKind = "basic";
const S: EnemyKind = "shooter";
const C: EnemyKind = "powerCarrier";

export const WAVE_PHASES: readonly WavePhase[] = [
  { index: 1, label: "Approach", startMs: 0 },
  { index: 2, label: "Flank Sweep", startMs: 12000 },
  { index: 3, label: "Shooter Line", startMs: 26000 },
  { index: 4, label: "Dive Runs", startMs: 42000 },
  { index: 5, label: "Escort Convoy", startMs: 58000 },
  { index: 6, label: "Crossfire", startMs: 76000 },
  { index: 7, label: "Breather", startMs: 96000 },
  { index: 8, label: "Carrier Wing", startMs: 104000 },
  { index: 9, label: "Cross-Screen Sweep", startMs: 124000 },
  { index: 10, label: "Advanced Shooter Wall", startMs: 142000 },
  { index: 11, label: "Climax Formation", startMs: 160000 },
  { index: 12, label: "Cleanup", startMs: 176000 },
];

export const WAVE_COUNT = WAVE_PHASES.length;

const GROUPS: FormationSpawnEvent[][] = [
  // Phase 1 — Approach: short introductory V of fighters teaches movement/firing.
  group({ atMs: 1500, formation: "vFormationTop", groupId: "p1-v", members: [B, B, B] }),
  group({ atMs: 8500, formation: "carrierEscort", groupId: "p1-carrier", members: [C] }),

  // Phase 2 — Flank Sweep: opposing side sweeps cross the screen.
  group({ atMs: 12500, formation: "sideSweepLeft", groupId: "p2-left", members: [B, B, B] }),
  group({ atMs: 15500, formation: "sideSweepRight", groupId: "p2-right", members: [B, B] }),
  group({ atMs: 20000, formation: "carrierEscort", groupId: "p2-carrier", members: [C] }),

  // Phase 3 — Shooter Line: held two-row shooter formation, ~FP3 target.
  group({ atMs: 26500, formation: "twoRowShooter", groupId: "p3-rows", members: [S, S, S, S] }),
  group({ atMs: 33000, formation: "carrierEscort", groupId: "p3-carrier", members: [C] }),

  // Phase 4 — Dive Runs: alternating left/right attack dives.
  group({ atMs: 42500, formation: "alternatingDive", groupId: "p4-dive", members: [B, B, B, B, B] }),
  group({ atMs: 51000, formation: "carrierEscort", groupId: "p4-carrier", members: [C] }),

  // Phase 5 — Escort Convoy: central Power Carrier with fighter escorts, ~FP5 target.
  group({ atMs: 58500, formation: "carrierEscort", groupId: "p5-convoy", members: [C, B, B, B, B] }),
  group({ atMs: 68000, formation: "arcFormation", groupId: "p5-arc", members: [B, B, B] }),

  // Phase 6 — Crossfire: split formation plus a shooter side sweep for density.
  group({ atMs: 76500, formation: "splitFormation", groupId: "p6-split", members: [B, B, B, B, S, S] }),
  group({ atMs: 86000, formation: "sideSweepRight", groupId: "p6-sweep", members: [B, B, S] }),
  group({ atMs: 92000, formation: "carrierEscort", groupId: "p6-carrier", members: [C] }),

  // Phase 7 — Breather: brief pressure release, sparse arc only.
  group({ atMs: 96500, formation: "arcFormation", groupId: "p7-arc", members: [B, B] }),

  // Phase 8 — Carrier Wing: dedicated Power Carrier formation, ~FP8 target.
  group({ atMs: 104500, formation: "carrierEscort", groupId: "p8-wing", members: [C, B, B, S, S, B] }),

  // Phase 9 — Cross-Screen Sweep: full-width mixed sweep formations.
  group({ atMs: 124500, formation: "sideSweepLeft", groupId: "p9-left", members: [B, S, B] }),
  group({ atMs: 130000, formation: "sideSweepRight", groupId: "p9-right", members: [B, B, S] }),
  group({ atMs: 137000, formation: "carrierEscort", groupId: "p9-carrier", members: [C] }),

  // Phase 10 — Advanced Shooter Wall: denser two-row shooter formation, pushes toward FP10.
  group({ atMs: 142500, formation: "twoRowShooter", groupId: "p10-wall", members: [S, S, S, S, S, S] }),
  group({ atMs: 152000, formation: "carrierEscort", groupId: "p10-carrier", members: [C] }),

  // Phase 11 — Climax Formation: dense mixed final formation, FP10 territory.
  group({
    atMs: 160500,
    formation: "denseMixedFinal",
    groupId: "p11-climax",
    members: [B, S, B, C, B, S, B, S, B, B],
  }),
  // Overdrive test — a second Power Carrier once the player is already at FP10.
  group({ atMs: 172000, formation: "carrierEscort", groupId: "p11-overdrive", members: [C] }),

  // Phase 12 — Cleanup: short completion wave, staggered lanes.
  group({ atMs: 176000, formation: "staggeredLane", groupId: "p12-cleanup", members: [B, B, B] }),
];

/** Flattened chronological spawn list consumed by the engine. */
export function getOrderedSpawns(): FormationSpawnEvent[] {
  return GROUPS.flat()
    .slice()
    .sort((a, b) => a.atMs - b.atMs);
}

export function getWaveIndexAt(elapsedMs: number): number {
  let current = 1;
  for (const wave of WAVE_PHASES) {
    if (elapsedMs >= wave.startMs) current = wave.index;
  }
  return current;
}

/** Total Power Carriers across the stage (Fire-Up progression + Overdrive test). */
export const TOTAL_POWER_CARRIERS = getOrderedSpawns().filter((s) => s.kind === "powerCarrier").length;

/**
 * Rough authored duration hint: last group's spawn time plus that
 * formation's own choreography length (entry + hold + exit), used only for
 * pacing verification — the real stage always ends when every spawned enemy
 * has been resolved (destroyed or exited), never a hard timer.
 */
export const STAGE_DURATION_HINT_MS = 184500;
