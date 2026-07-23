import type { EnemyKind } from "./enemyConfig";

/**
 * Enemy formation choreography.
 *
 * Every enemy in `ch1-stage-1` now belongs to a named formation group instead
 * of simply falling straight down. `computeFormationPose` is a pure function
 * of (formation type, slot within the group, group size, elapsed time since
 * the group's first member spawned) — it returns a normalized position
 * (0–1 across the playfield) plus a coarse behavior phase used by the engine
 * to gate firing and drive banking/sway. The engine multiplies xNorm/yNorm
 * by the logical playfield size; nothing here depends on exact pixel
 * dimensions, so it stays reusable across viewport sizes.
 */

export type FormationType =
  | "vFormationTop"
  | "sideSweepLeft"
  | "sideSweepRight"
  | "twoRowShooter"
  | "carrierEscort"
  | "arcFormation"
  | "staggeredLane"
  | "splitFormation"
  | "alternatingDive"
  | "denseMixedFinal";

export type FormationPhase =
  | "entering"
  | "forming"
  | "holding"
  | "attacking"
  | "repositioning"
  | "diving"
  | "exiting";

export interface FormationSpawnEvent {
  /** 1-based wave phase this group belongs to (see waveTable.ts). */
  phase: number;
  /** Delay after the phase becomes active before this group spawns (ms). */
  delayMs: number;
  kind: EnemyKind;
  formation: FormationType;
  /** Groups every simultaneously-choreographed enemy together. */
  groupId: string;
  /** Position within the group (0-based). */
  slot: number;
  slotCount: number;
}

export interface FormationPose {
  xNorm: number;
  yNorm: number;
  phase: FormationPhase;
  /** Whether this enemy is allowed to fire right now (still gated by its own cooldown). */
  canFire: boolean;
  /** Visual bank hint, -1..1, blended by the engine. */
  bank: number;
}

function easeInOut(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 2 * c * c : 1 - Math.pow(-2 * c + 2, 2) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const HOLD_SWAY = (tMs: number, phase: number) => Math.sin(tMs / 650 + phase) * 0.035;

/**
 * Spreads slotCount members symmetrically around 0.5 across `spread` width.
 */
function spreadX(slot: number, slotCount: number, spread: number): number {
  if (slotCount <= 1) return 0.5;
  const t = slot / (slotCount - 1); // 0..1
  return 0.5 + (t - 0.5) * spread;
}

export function computeFormationPose(
  type: FormationType,
  slot: number,
  slotCount: number,
  tMs: number,
): FormationPose {
  switch (type) {
    case "vFormationTop": {
      // Enter from top center into a V, hold and fire, then dive together.
      const target = spreadX(slot, slotCount, 0.62);
      const depth = Math.abs(slot - (slotCount - 1) / 2) * 0.05;
      const enterMs = 900;
      const holdMs = 4000;
      if (tMs < enterMs) {
        const t = easeInOut(tMs / enterMs);
        return { xNorm: lerp(0.5, target, t), yNorm: lerp(-0.15, 0.16 + depth, t), phase: "entering", canFire: false, bank: (target - 0.5) * 0.6 };
      }
      if (tMs < enterMs + holdMs) {
        const localT = tMs - enterMs;
        return { xNorm: target + HOLD_SWAY(localT, slot), yNorm: 0.16 + depth, phase: "holding", canFire: true, bank: HOLD_SWAY(localT, slot) * 4 };
      }
      const diveT = (tMs - enterMs - holdMs) / 1400;
      return { xNorm: target, yNorm: lerp(0.16 + depth, 1.2, easeInOut(diveT)), phase: "diving", canFire: diveT < 0.4, bank: 0 };
    }

    case "sideSweepLeft":
    case "sideSweepRight": {
      const fromLeft = type === "sideSweepLeft";
      const yBand = 0.16 + (slot % 3) * 0.06;
      const sweepMs = 4200;
      const startX = fromLeft ? -0.3 : 1.3;
      const endX = fromLeft ? 1.3 : -0.3;
      const staggerMs = slot * 220;
      const local = Math.max(0, tMs - staggerMs);
      const t = easeInOut(Math.min(1, local / sweepMs));
      const x = lerp(startX, endX, t);
      const phase: FormationPhase = local < 300 ? "entering" : t >= 1 ? "exiting" : "attacking";
      return { xNorm: x, yNorm: yBand + HOLD_SWAY(tMs, slot) * 0.4, phase, canFire: t > 0.08 && t < 0.95, bank: fromLeft ? 0.35 : -0.35 };
    }

    case "twoRowShooter": {
      const row = slot % 2;
      const rowSlots = Math.ceil(slotCount / 2);
      const rowIndex = Math.floor(slot / 2);
      const target = spreadX(rowIndex, rowSlots, 0.55);
      const targetY = row === 0 ? 0.22 : 0.33;
      const enterMs = 950;
      const holdMs = 4200;
      if (tMs < enterMs) {
        const t = easeInOut(tMs / enterMs);
        return { xNorm: lerp(target, target, t), yNorm: lerp(-0.15, targetY, t), phase: "entering", canFire: false, bank: 0 };
      }
      if (tMs < enterMs + holdMs) {
        const localT = tMs - enterMs;
        return { xNorm: target + HOLD_SWAY(localT, slot) * 0.6, yNorm: targetY, phase: "holding", canFire: true, bank: HOLD_SWAY(localT, slot) * 3 };
      }
      const exitT = easeInOut((tMs - enterMs - holdMs) / 1200);
      return { xNorm: target, yNorm: lerp(targetY, 1.2, exitT), phase: "exiting", canFire: false, bank: 0 };
    }

    case "carrierEscort": {
      const isCarrier = slot === 0;
      const escortIndex = slot - 1;
      const side = escortIndex % 2 === 0 ? -1 : 1;
      const rank = Math.floor(escortIndex / 2) + 1;
      const targetX = isCarrier ? 0.5 : 0.5 + side * (0.16 * rank);
      const targetY = isCarrier ? 0.24 : 0.24 + 0.03 * rank;
      const enterMs = 1000;
      const holdMs = 4400;
      if (tMs < enterMs) {
        const t = easeInOut(tMs / enterMs);
        return { xNorm: lerp(0.5, targetX, t), yNorm: lerp(-0.15, targetY, t), phase: "entering", canFire: false, bank: side * 0.3 };
      }
      if (tMs < enterMs + holdMs) {
        const localT = tMs - enterMs;
        return { xNorm: targetX + HOLD_SWAY(localT, slot), yNorm: targetY, phase: "holding", canFire: true, bank: HOLD_SWAY(localT, slot) * 3 };
      }
      const diveT = easeInOut((tMs - enterMs - holdMs) / 1300);
      return { xNorm: targetX, yNorm: lerp(targetY, 1.2, diveT), phase: "diving", canFire: diveT < 0.3, bank: 0 };
    }

    case "arcFormation": {
      const angle = slotCount <= 1 ? Math.PI / 2 : (slot / (slotCount - 1)) * Math.PI;
      const targetX = 0.5 - Math.cos(angle) * 0.42;
      const targetY = 0.14 + Math.sin(angle) * 0.16;
      const enterMs = 1100;
      const holdMs = 3600;
      if (tMs < enterMs) {
        const t = easeInOut(tMs / enterMs);
        return { xNorm: lerp(0.5, targetX, t), yNorm: lerp(-0.15, targetY, t), phase: "entering", canFire: false, bank: 0 };
      }
      if (tMs < enterMs + holdMs) {
        const localT = tMs - enterMs;
        return { xNorm: targetX, yNorm: targetY + HOLD_SWAY(localT, slot) * 0.5, phase: "holding", canFire: true, bank: HOLD_SWAY(localT, slot) * 4 };
      }
      // Peel off downward, staggered by slot so the arc unwinds visibly.
      const peelStagger = slot * 160;
      const local = Math.max(0, tMs - enterMs - holdMs - peelStagger);
      const t = easeInOut(local / 1200);
      return { xNorm: targetX, yNorm: lerp(targetY, 1.2, t), phase: "exiting", canFire: t < 0.3, bank: 0 };
    }

    case "staggeredLane": {
      const lane = spreadX(slot, slotCount, 0.72);
      // Descend with alternating pause/advance segments so it reads as
      // deliberate lane pressure rather than uniform fall speed.
      const cycleMs = 1600;
      const cycle = tMs % cycleMs;
      const advancing = cycle < cycleMs * 0.55;
      const cyclesElapsed = Math.floor(tMs / cycleMs);
      const yBase = -0.15 + cyclesElapsed * 0.22;
      const withinT = advancing ? easeInOut(cycle / (cycleMs * 0.55)) : 1;
      const y = yBase + withinT * 0.22;
      return {
        xNorm: lane,
        yNorm: y,
        phase: y > 1 ? "exiting" : "attacking",
        canFire: !advancing,
        bank: 0,
      };
    }

    case "splitFormation": {
      const half = slotCount / 2;
      const goingRight = slot >= half;
      const localSlot = goingRight ? slot - half : slot;
      const localCount = Math.max(1, goingRight ? slotCount - half : half);
      const enterMs = 850;
      const formMs = 700;
      const holdMs = 3400;
      if (tMs < enterMs) {
        const t = easeInOut(tMs / enterMs);
        return { xNorm: lerp(0.5, 0.5, t), yNorm: lerp(-0.15, 0.16, t), phase: "entering", canFire: false, bank: 0 };
      }
      if (tMs < enterMs + formMs) {
        const t = easeInOut((tMs - enterMs) / formMs);
        const targetX = goingRight ? 0.66 + localSlot * 0.06 : 0.34 - localSlot * 0.06;
        return { xNorm: lerp(0.5, targetX, t), yNorm: 0.16 + localSlot * 0.02, phase: "forming", canFire: false, bank: goingRight ? 0.3 : -0.3 };
      }
      const targetX = goingRight ? 0.66 + localSlot * 0.06 : 0.34 - localSlot * 0.06;
      if (tMs < enterMs + formMs + holdMs) {
        const localT = tMs - enterMs - formMs;
        return { xNorm: targetX + HOLD_SWAY(localT, localSlot), yNorm: 0.16 + localSlot * 0.02, phase: "holding", canFire: true, bank: 0 };
      }
      const diveT = easeInOut((tMs - enterMs - formMs - holdMs) / 1300);
      void localCount;
      return { xNorm: targetX, yNorm: lerp(0.16, 1.2, diveT), phase: "diving", canFire: diveT < 0.3, bank: 0 };
    }

    case "alternatingDive": {
      // Hold briefly in a loose line, then dive one at a time, alternating
      // left/right diagonal attack runs toward the player.
      const holdX = spreadX(slot, slotCount, 0.5);
      const enterMs = 850;
      const preHoldMs = 700 + slot * 90;
      if (tMs < enterMs) {
        const t = easeInOut(tMs / enterMs);
        return { xNorm: lerp(0.5, holdX, t), yNorm: lerp(-0.15, 0.2, t), phase: "entering", canFire: false, bank: 0 };
      }
      if (tMs < enterMs + preHoldMs) {
        const localT = tMs - enterMs;
        return { xNorm: holdX + HOLD_SWAY(localT, slot), yNorm: 0.2, phase: "holding", canFire: true, bank: 0 };
      }
      const diveDir = slot % 2 === 0 ? -1 : 1;
      const diveT = easeInOut((tMs - enterMs - preHoldMs) / 1500);
      return {
        xNorm: holdX + diveDir * 0.22 * diveT,
        yNorm: lerp(0.2, 1.2, diveT),
        phase: "diving",
        canFire: false,
        bank: diveDir * 0.5,
      };
    }

    case "denseMixedFinal":
    default: {
      // Final wave: full-width holding line with continual sway and a
      // rotating subset peeling into dive attacks — the densest but still
      // readable formation.
      const target = spreadX(slot, slotCount, 0.86);
      const enterMs = 1000;
      const holdMs = 5200;
      const diveWindowStart = 1800 + (slot % 4) * 700;
      if (tMs < enterMs) {
        const t = easeInOut(tMs / enterMs);
        return { xNorm: lerp(0.5, target, t), yNorm: lerp(-0.15, 0.15 + (slot % 2) * 0.05, t), phase: "entering", canFire: false, bank: 0 };
      }
      const localT = tMs - enterMs;
      const baseY = 0.15 + (slot % 2) * 0.05;
      if (localT < holdMs) {
        const inDive = localT > diveWindowStart && localT < diveWindowStart + 900;
        if (inDive) {
          const diveT = easeInOut((localT - diveWindowStart) / 900);
          return { xNorm: target, yNorm: lerp(baseY, baseY + 0.32, Math.sin(diveT * Math.PI)), phase: "attacking", canFire: true, bank: 0 };
        }
        return { xNorm: target + HOLD_SWAY(localT, slot), yNorm: baseY, phase: "holding", canFire: true, bank: HOLD_SWAY(localT, slot) * 3 };
      }
      const exitT = easeInOut((localT - holdMs) / 1400);
      return { xNorm: target, yNorm: lerp(baseY, 1.2, exitT), phase: "exiting", canFire: exitT < 0.25, bank: 0 };
    }
  }
}
