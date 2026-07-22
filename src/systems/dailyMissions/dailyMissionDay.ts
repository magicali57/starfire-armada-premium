import type { DailyMissionState } from "@/types/dailyMissions";
import { createFreshDailyMissionState, createEmptyMissionProgressMap } from "@/data/dailyMissions";

/** Local calendar day key — YYYY-MM-DD in the player's local timezone. */
export function getDailyMissionDayKey(now: number = Date.now()): string {
  const date = new Date(now);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Lexicographic compare works for YYYY-MM-DD keys. */
export function compareDayKeys(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function isValidDayKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/**
 * Clock-safe ensure:
 * - same day → keep progress
 * - forward day → fresh missions/milestones, lastObserved advances
 * - backward clock → do NOT reset; keep lastObserved (prevents re-claiming)
 */
export function ensureCurrentDailyMissionState(
  state: DailyMissionState | null | undefined,
  now: number = Date.now(),
): { state: DailyMissionState; didReset: boolean; repaired: boolean } {
  const today = getDailyMissionDayKey(now);

  if (!state || !isValidDayKey(state.dayKey) || !isValidDayKey(state.lastObservedDayKey)) {
    return { state: createFreshDailyMissionState(today), didReset: true, repaired: true };
  }

  let repaired = false;
  let next: DailyMissionState = {
    dayKey: state.dayKey,
    lastObservedDayKey: state.lastObservedDayKey,
    missions: { ...state.missions },
    activityPoints: Number.isFinite(state.activityPoints) ? Math.max(0, Math.trunc(state.activityPoints)) : 0,
    claimedMilestoneIds: Array.isArray(state.claimedMilestoneIds)
      ? state.claimedMilestoneIds.filter((id) => typeof id === "string")
      : [],
  };
  if (next.activityPoints !== state.activityPoints) repaired = true;

  // Ensure every active mission id has a progress row; drop unknown ids.
  const freshMap = createEmptyMissionProgressMap();
  const mergedMissions: DailyMissionState["missions"] = {};
  for (const id of Object.keys(freshMap)) {
    const existing = next.missions[id];
    if (existing && typeof existing.progress === "number" && typeof existing.claimed === "boolean") {
      mergedMissions[id] = {
        progress: Math.max(0, Math.trunc(existing.progress)),
        claimed: existing.claimed === true,
      };
    } else {
      mergedMissions[id] = { progress: 0, claimed: false };
      repaired = true;
    }
  }
  next = { ...next, missions: mergedMissions };

  const observedCmp = compareDayKeys(today, next.lastObservedDayKey);
  if (observedCmp < 0) {
    // Clock moved backward — freeze at lastObserved; do not reopen claims.
    return { state: next, didReset: false, repaired };
  }

  if (observedCmp > 0 || compareDayKeys(today, next.dayKey) > 0) {
    // New forward day — full reset of mission/milestone claim state.
    return {
      state: {
        ...createFreshDailyMissionState(today),
        lastObservedDayKey: today,
      },
      didReset: true,
      repaired,
    };
  }

  // Same day — bump lastObserved if somehow behind dayKey (shouldn't happen).
  if (compareDayKeys(next.lastObservedDayKey, next.dayKey) < 0) {
    next = { ...next, lastObservedDayKey: next.dayKey };
    repaired = true;
  }

  return { state: next, didReset: false, repaired };
}

export function resetDailyMissionsIfNeeded(
  state: DailyMissionState | null | undefined,
  now: number = Date.now(),
): DailyMissionState {
  return ensureCurrentDailyMissionState(state, now).state;
}
