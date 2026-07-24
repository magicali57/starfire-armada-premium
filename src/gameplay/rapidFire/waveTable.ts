import type { EnemyKind } from "./enemyConfig";
import type { FormationSpawnEvent, FormationType } from "./formationConfig";

/**
 * Stage 1 wave design — mobile-playtest correction pass.
 *
 * Waves are no longer released on a flat absolute-time schedule. Each phase
 * is now a discrete, enemy-clear-gated beat: every group belonging to a
 * phase spawns (staggered by `delayMs` within the phase), the phase is
 * "complete" once every one of its enemies has been destroyed or has
 * exited via its own formation choreography (formations always eventually
 * leave the playfield on their own timer — see `formationConfig.ts` — so a
 * phase can never soft-lock even if the player does nothing), and only then
 * does the engine run the announcement gap (2s pause, 2s "WAVE N/12"
 * banner, 2s transition — `RapidFireEngine`'s `PHASE_GAP_*_MS` constants)
 * before releasing the next phase.
 *
 * Several phases now put 8–15 enemies on stage at once (multiple groups
 * with overlapping hold windows), per the mobile playtest note that the
 * game read as too sparse.
 */

export interface WavePhase {
  index: number;
  label: string;
}

interface GroupSpec {
  phase: number;
  /** Delay after the phase becomes active before this group spawns (ms). */
  delayMs: number;
  formation: FormationType;
  groupId: string;
  members: readonly EnemyKind[];
}

function group(spec: GroupSpec): FormationSpawnEvent[] {
  return spec.members.map((kind, slot) => ({
    phase: spec.phase,
    delayMs: spec.delayMs,
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
  { index: 1, label: "Approach" },
  { index: 2, label: "Flank Sweep" },
  { index: 3, label: "Shooter Line" },
  { index: 4, label: "Dive Runs" },
  { index: 5, label: "Escort Convoy" },
  { index: 6, label: "Crossfire" },
  { index: 7, label: "Breather" },
  { index: 8, label: "Carrier Wing" },
  { index: 9, label: "Cross-Screen Sweep" },
  { index: 10, label: "Advanced Shooter Wall" },
  { index: 11, label: "Climax Formation" },
  { index: 12, label: "Cleanup" },
];

export const WAVE_COUNT = WAVE_PHASES.length;

/**
 * Phase composition. Grid-block groups (gridStream*) carry the density the
 * reference arcade shooters have: a large squad streams in along curved paths,
 * settles into a row/column block, holds and attacks, then leaves. Smaller
 * sweep/dive/escort groups are layered on top for variety and to keep Power
 * Carriers threaded through the stage.
 *
 * Power Carriers total exactly 11 across the stage (10 to carry Firepower
 * 0→10, plus 1 near the climax to exercise MAX FIREPOWER refresh).
 */
const GROUPS: FormationSpawnEvent[][] = [
  // Phase 1 — Approach: a small grid streams in from the top and holds.
  group({ phase: 1, delayMs: 0, formation: "gridStreamTop", groupId: "p1-grid", members: [B, B, B, B, B, B, B, B, B, B] }),
  group({ phase: 1, delayMs: 3600, formation: "carrierEscort", groupId: "p1-carrier", members: [C] }),

  // Phase 2 — Flank Sweep: grid pours in alternately from both sides.
  group({ phase: 2, delayMs: 0, formation: "gridStreamSides", groupId: "p2-grid", members: [B, B, B, B, B, B, B, B, S, S, S, S] }),
  group({ phase: 2, delayMs: 4200, formation: "carrierEscort", groupId: "p2-carrier", members: [C] }),

  // Phase 3 — Shooter Line: shooter-heavy block holds and volleys.
  group({ phase: 3, delayMs: 0, formation: "gridStreamTop", groupId: "p3-grid", members: [S, S, S, S, S, S, B, B, B, B, B, B, B, B] }),
  group({ phase: 3, delayMs: 4200, formation: "carrierEscort", groupId: "p3-carrier", members: [C] }),

  // Phase 4 — Dive Runs: fast dive squad layered over a side-entry block.
  group({ phase: 4, delayMs: 0, formation: "alternatingDive", groupId: "p4-dive", members: [B, B, B, B, B, B, B] }),
  group({ phase: 4, delayMs: 1800, formation: "gridStreamSides", groupId: "p4-grid", members: [B, B, B, B, B, B, B, B] }),
  group({ phase: 4, delayMs: 5000, formation: "carrierEscort", groupId: "p4-carrier", members: [C] }),

  // Phase 5 — Escort Convoy: carrier + escort ring, with a grid overlapping.
  group({ phase: 5, delayMs: 0, formation: "carrierEscort", groupId: "p5-convoy", members: [C, B, B, B, B, B, B, B] }),
  group({ phase: 5, delayMs: 2500, formation: "gridStreamTop", groupId: "p5-grid", members: [B, B, B, B, B, B, B, B, B, B] }),

  // Phase 6 — Crossfire: corner-looping grid plus a crossing sweep.
  group({ phase: 6, delayMs: 0, formation: "gridStreamLoop", groupId: "p6-grid", members: [B, B, B, B, B, B, B, B, B, B, S, S, S, S] }),
  group({ phase: 6, delayMs: 2600, formation: "sideSweepRight", groupId: "p6-sweep", members: [B, B, S, S] }),
  group({ phase: 6, delayMs: 5200, formation: "carrierEscort", groupId: "p6-carrier", members: [C] }),

  // Phase 7 — Breather: brief pressure release, sparse arc only.
  group({ phase: 7, delayMs: 0, formation: "arcFormation", groupId: "p7-arc", members: [B, B, B, B] }),

  // Phase 8 — Carrier Wing: escort wing plus a full side-entry block.
  group({ phase: 8, delayMs: 0, formation: "carrierEscort", groupId: "p8-wing", members: [C, B, B, B, S, S, B, B] }),
  group({ phase: 8, delayMs: 2400, formation: "gridStreamSides", groupId: "p8-grid", members: [B, B, B, B, B, B, B, B, B, B, S, S] }),

  // Phase 9 — Cross-Screen Sweep: sweeps crossing under a held top block.
  group({ phase: 9, delayMs: 0, formation: "gridStreamTop", groupId: "p9-grid", members: [B, B, B, B, B, B, B, B, B, B, B, B, S, S] }),
  group({ phase: 9, delayMs: 2200, formation: "sideSweepLeft", groupId: "p9-left", members: [B, S, B, B] }),
  group({ phase: 9, delayMs: 3800, formation: "sideSweepRight", groupId: "p9-right", members: [B, B, S, B] }),
  group({ phase: 9, delayMs: 5600, formation: "carrierEscort", groupId: "p9-carrier", members: [C] }),

  // Phase 10 — Advanced Shooter Wall: a full block of shooters.
  group({ phase: 10, delayMs: 0, formation: "gridStreamTop", groupId: "p10-wall", members: [S, S, S, S, S, S, S, S, S, S, S, S, B, B, B, B] }),
  group({ phase: 10, delayMs: 4600, formation: "carrierEscort", groupId: "p10-carrier", members: [C] }),

  // Phase 11 — Climax Formation: the densest block of the stage (24), entering
  // as a corner-looping stream, plus an Overdrive-test carrier.
  group({
    phase: 11,
    delayMs: 0,
    formation: "gridStreamLoop",
    groupId: "p11-climax",
    members: [B, S, B, C, B, S, B, S, B, B, S, B, B, S, B, B, S, B, B, S, B, B, S, B],
  }),
  group({ phase: 11, delayMs: 4800, formation: "carrierEscort", groupId: "p11-overdrive", members: [C] }),

  // Phase 12 — Cleanup: short completion wave, staggered lanes.
  group({ phase: 12, delayMs: 0, formation: "staggeredLane", groupId: "p12-cleanup", members: [B, B, B, B, B] }),
];

/** All spawn groups for one phase, sorted by their in-phase delay. */
export function getSpawnsForPhase(phase: number): FormationSpawnEvent[] {
  return GROUPS.flat()
    .filter((s) => s.phase === phase)
    .sort((a, b) => a.delayMs - b.delayMs);
}

/** Every spawn across the whole stage — used for stage-wide counts/verification. */
export function getAllSpawns(): FormationSpawnEvent[] {
  return GROUPS.flat();
}

/** Total Power Carriers across the stage (Fire-Up progression + Overdrive test). */
export const TOTAL_POWER_CARRIERS = getAllSpawns().filter((s) => s.kind === "powerCarrier").length;

/** Largest number of enemies belonging to a single phase (peak on-stage count). */
export const PEAK_PHASE_ENEMY_COUNT = Math.max(
  ...WAVE_PHASES.map((p) => getSpawnsForPhase(p.index).length),
);

/**
 * Rough authored duration estimate: 12 phases, each resolving in roughly
 * 7-12s (formation entry + hold + exit) plus the fixed ~6s announcement gap
 * between phases, landing in the requested ~2-3 minute range. The real
 * stage never runs on a hard timer — each phase ends only when every one of
 * its enemies is destroyed or has exited.
 */
export const STAGE_DURATION_HINT_MS = 180000;
