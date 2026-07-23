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

const GROUPS: FormationSpawnEvent[][] = [
  // Phase 1 — Approach: short introductory V of fighters teaches movement/firing.
  group({ phase: 1, delayMs: 0, formation: "vFormationTop", groupId: "p1-v", members: [B, B, B, B] }),
  group({ phase: 1, delayMs: 3000, formation: "carrierEscort", groupId: "p1-carrier", members: [C] }),

  // Phase 2 — Flank Sweep: opposing side sweeps cross the screen.
  group({ phase: 2, delayMs: 0, formation: "sideSweepLeft", groupId: "p2-left", members: [B, B, B, B] }),
  group({ phase: 2, delayMs: 1500, formation: "sideSweepRight", groupId: "p2-right", members: [B, B, B] }),
  group({ phase: 2, delayMs: 4000, formation: "carrierEscort", groupId: "p2-carrier", members: [C] }),

  // Phase 3 — Shooter Line: held two-row shooter formation.
  group({ phase: 3, delayMs: 0, formation: "twoRowShooter", groupId: "p3-rows", members: [S, S, S, S, S, S] }),
  group({ phase: 3, delayMs: 3500, formation: "carrierEscort", groupId: "p3-carrier", members: [C] }),

  // Phase 4 — Dive Runs: alternating left/right attack dives.
  group({
    phase: 4,
    delayMs: 0,
    formation: "alternatingDive",
    groupId: "p4-dive",
    members: [B, B, B, B, B, B, B],
  }),
  group({ phase: 4, delayMs: 3000, formation: "carrierEscort", groupId: "p4-carrier", members: [C] }),

  // Phase 5 — Escort Convoy: central Power Carrier with a full escort ring
  // (8 together), then an arc formation overlaps while the convoy still holds.
  group({
    phase: 5,
    delayMs: 0,
    formation: "carrierEscort",
    groupId: "p5-convoy",
    members: [C, B, B, B, B, B, B, B],
  }),
  group({ phase: 5, delayMs: 2500, formation: "arcFormation", groupId: "p5-arc", members: [B, B, B, B] }),

  // Phase 6 — Crossfire: split formation, a side sweep, and a carrier overlap
  // for the densest early-stage pressure (up to 13 on stage at once).
  group({
    phase: 6,
    delayMs: 0,
    formation: "splitFormation",
    groupId: "p6-split",
    members: [B, B, B, B, B, B, S, S],
  }),
  group({ phase: 6, delayMs: 2000, formation: "sideSweepRight", groupId: "p6-sweep", members: [B, B, S, S] }),
  group({ phase: 6, delayMs: 4000, formation: "carrierEscort", groupId: "p6-carrier", members: [C] }),

  // Phase 7 — Breather: brief pressure release, sparse arc only.
  group({ phase: 7, delayMs: 0, formation: "arcFormation", groupId: "p7-arc", members: [B, B, B] }),

  // Phase 8 — Carrier Wing: one large dedicated Power Carrier formation (10).
  group({
    phase: 8,
    delayMs: 0,
    formation: "carrierEscort",
    groupId: "p8-wing",
    members: [C, B, B, B, S, S, B, B, B, B],
  }),

  // Phase 9 — Cross-Screen Sweep: full-width mixed sweep formations.
  group({ phase: 9, delayMs: 0, formation: "sideSweepLeft", groupId: "p9-left", members: [B, S, B, B] }),
  group({ phase: 9, delayMs: 1800, formation: "sideSweepRight", groupId: "p9-right", members: [B, B, S, B] }),
  group({ phase: 9, delayMs: 3600, formation: "carrierEscort", groupId: "p9-carrier", members: [C] }),

  // Phase 10 — Advanced Shooter Wall: denser two-row shooter formation (8).
  group({
    phase: 10,
    delayMs: 0,
    formation: "twoRowShooter",
    groupId: "p10-wall",
    members: [S, S, S, S, S, S, S, S],
  }),
  group({ phase: 10, delayMs: 3500, formation: "carrierEscort", groupId: "p10-carrier", members: [C] }),

  // Phase 11 — Climax Formation: dense mixed final formation, 14 enemies at
  // once, plus a dedicated Overdrive-test carrier once Firepower is likely
  // already at 10.
  group({
    phase: 11,
    delayMs: 0,
    formation: "denseMixedFinal",
    groupId: "p11-climax",
    members: [B, S, B, C, B, S, B, S, B, B, S, B, B, S],
  }),
  group({ phase: 11, delayMs: 3500, formation: "carrierEscort", groupId: "p11-overdrive", members: [C] }),

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
