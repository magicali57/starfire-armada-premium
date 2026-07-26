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
  | "denseMixedFinal"
  // Grid-block formations (reference-arcade style): a large group streams in
  // along curved paths one after another, settles into an assigned row/column
  // slot, then the whole block drifts as a unit while individuals peel off to
  // dive and return. See gridPose().
  | "gridStreamTop"
  | "gridStreamSides"
  | "gridStreamLoop";

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

/** Cubic Bezier on one axis (used for curved entry/dive paths). */
function cubicAt(a: number, b: number, c: number, d: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * a + 3 * mt * mt * t * b + 3 * mt * t * t * c + t * t * t * d;
}

// ---------------------------------------------------------------------------
// Grid-block formation timing. A group streams in (one member every
// GRID_STAGGER_MS), each taking GRID_ENTRY_MS to fly its curve into slot; the
// block then holds together, and finally exits as a unit. Total on-stage time
// for a 25-strong group is roughly 2.9s in + 11s hold + 1.5s out ≈ 15.4s — but
// the phase ends as soon as the player clears it, so good play is faster.
// ---------------------------------------------------------------------------
const GRID_STAGGER_MS = 72;
const GRID_ENTRY_MS = 1150;
const GRID_HOLD_MS = 11000;
const GRID_EXIT_MS = 1500;
const GRID_DIVE_MS = 1800;

/** Columns/rows for a block of `slotCount`, capped at 7 wide like the reference. */
function gridDims(slotCount: number): { cols: number; rows: number } {
  const cols = Math.max(1, Math.min(7, Math.ceil(slotCount / 3)));
  const rows = Math.max(1, Math.ceil(slotCount / cols));
  return { cols, rows };
}

/** Normalized resting position of a slot inside the block. */
function gridSlotPos(slot: number, slotCount: number): { x: number; y: number } {
  const { cols } = gridDims(slotCount);
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  const spread = 0.74;
  const x = cols > 1 ? 0.5 + (col / (cols - 1) - 0.5) * spread : 0.5;
  const y = 0.12 + row * 0.075;
  return { x, y };
}

/**
 * Grid-block choreography: streamed curved entry → held block that drifts as
 * one unit → periodic single-ship dive-outs that return to slot → group exit.
 * Pure function of (slot, slotCount, elapsed), so it stays deterministic and
 * testable; dive scheduling is derived arithmetically from the slot index
 * rather than from random state or player position.
 */
function gridPose(
  slot: number,
  slotCount: number,
  tMs: number,
  style: "top" | "sides" | "loop",
): FormationPose {
  const { cols } = gridDims(slotCount);
  const col = slot % cols;
  const row = Math.floor(slot / cols);
  const target = gridSlotPos(slot, slotCount);
  const fromLeft = style === "sides" ? slot % 2 === 0 : col < cols / 2;

  const stagger = slot * GRID_STAGGER_MS;
  const local = tMs - stagger;
  const allInMs = (slotCount - 1) * GRID_STAGGER_MS + GRID_ENTRY_MS;
  const groupT = Math.max(0, tMs - allInMs);

  // Keep the rows rigid while the squadron follows one clearly readable
  // path, with a small opposing row shift to avoid a pasted-on feel.
  const driftX = Math.sin(groupT / 1250) * 0.055 + Math.sin(groupT / 3100) * 0.015;
  const driftY = Math.sin(groupT / 1850) * 0.018;
  const rowShift = Math.sin(groupT / 900 + row * Math.PI) * 0.012;
  const driftBank = Math.cos(groupT / 1250) * 0.34;

  // Waiting its turn in the stream: parked off the top edge.
  if (local < 0) {
    return { xNorm: 0.5, yNorm: -0.25, phase: "entering", canFire: false, bank: 0 };
  }

  // Stream into a tight staging column/wing, then visibly unfold into the
  // assigned grid slot. This two-beat entrance mirrors the reference better
  // than sending every ship directly to its final coordinate.
  if (local < GRID_ENTRY_MS) {
    const t = easeInOut(local / GRID_ENTRY_MS);
    const split = 0.54;
    const spineLane = (slot % 3) - 1;
    const spineX =
      style === "sides"
        ? fromLeft
          ? 0.28
          : 0.72
        : 0.5 + spineLane * 0.026;
    const spineY = 0.065 + (slot % 9) * 0.033;

    if (style !== "loop") {
      if (t < split) {
        const gatherT = easeInOut(t / split);
        const startX = style === "sides" ? (fromLeft ? -0.2 : 1.2) : 0.5;
        return {
          xNorm: lerp(startX, spineX, gatherT),
          yNorm: lerp(-0.2, spineY, gatherT),
          phase: "entering",
          canFire: false,
          bank: fromLeft ? 0.5 : -0.5,
        };
      }

      const unfoldT = easeInOut((t - split) / (1 - split));
      const side = target.x < spineX ? -1 : 1;
      return {
        xNorm: cubicAt(
          spineX,
          spineX + side * 0.12,
          target.x - side * 0.05,
          target.x,
          unfoldT,
        ),
        yNorm: cubicAt(spineY, spineY + 0.055, target.y - 0.025, target.y, unfoldT),
        phase: "forming",
        canFire: false,
        bank: side * (1 - unfoldT) * 0.65,
      };
    }

    let x0: number, y0: number, x1: number, y1: number, x2: number, y2: number;
    // Loop groups keep one broad arc before curling into the same rigid block.
    x0 = fromLeft ? -0.2 : 1.2;
    y0 = -0.1;
    x1 = fromLeft ? 0.9 : 0.1;
    y1 = 0.2;
    x2 = fromLeft ? 0.12 : 0.88;
    y2 = 0.42;
    const x = cubicAt(x0, x1, x2, target.x + driftX, t);
    const y = cubicAt(y0, y1, y2, target.y + driftY, t);
    return {
      xNorm: x,
      yNorm: y,
      phase: "entering",
      canFire: false,
      bank: fromLeft ? 0.32 : -0.32,
    };
  }

  const holdEnd = allInMs + GRID_HOLD_MS;
  if (tMs < holdEnd) {
    const localSway = Math.sin(groupT / 520 + slot * 0.8) * 0.004;
    const baseX = Math.max(
      0.07,
      Math.min(0.93, target.x + driftX + rowShift + localSway),
    );
    const baseY = target.y + driftY;

    // Dive-out: only part of the block ever dives, and departures are spread
    // across the hold window, so at most a couple of ships are out of
    // formation at any moment (the block must still read as a block).
    // Selection and scheduling are derived from separate bits of a hash so
    // they don't correlate and collapse into a few synchronized buckets.
    const h = (slot * 2654435761) >>> 0;
    const divesAtAll = h % 100 < 44;
    const diveAt = allInMs + 1200 + ((h >>> 7) % 7) * 1250;
    if (divesAtAll && tMs >= diveAt && tMs < diveAt + GRID_DIVE_MS) {
      const dt = (tMs - diveAt) / GRID_DIVE_MS;
      // Always swoop toward the centre, never outward: an outer-column ship
      // curving away would fly off the side of the playfield mid-dive.
      const side = baseX > 0.5 ? -1 : 1;
      const x = cubicAt(baseX, baseX + side * 0.32, baseX + side * 0.2, baseX, dt);
      const y = cubicAt(baseY, baseY + 0.5, baseY + 0.58, baseY, dt);
      const diveBank = side * Math.sin(dt * Math.PI) * 0.85;
      return { xNorm: x, yNorm: y, phase: "attacking", canFire: true, bank: diveBank };
    }

    return {
      xNorm: baseX,
      yNorm: baseY,
      phase: "holding",
      canFire: true,
      bank: driftBank,
    };
  }

  // The block leaves together.
  const exitT = easeInOut((tMs - holdEnd) / GRID_EXIT_MS);
  return {
    xNorm: target.x + driftX,
    yNorm: lerp(target.y + driftY, 1.3, exitT),
    phase: "exiting",
    canFire: exitT < 0.3,
    bank: 0,
  };
}

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
    case "gridStreamTop":
      return gridPose(slot, slotCount, tMs, "top");
    case "gridStreamSides":
      return gridPose(slot, slotCount, tMs, "sides");
    case "gridStreamLoop":
      return gridPose(slot, slotCount, tMs, "loop");

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
