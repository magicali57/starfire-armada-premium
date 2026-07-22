import type { PlayerState } from "@/types";
import type { DailyMissionEvent, DailyMissionState } from "@/types/dailyMissions";
import { getActiveDailyMissionDefinitions } from "@/data/dailyMissions";
import { ensureCurrentDailyMissionState } from "./dailyMissionDay";

/**
 * Apply a successful canonical transaction event to daily mission progress.
 * Pure state-in/state-out — never grants rewards. Progress clamps at target.
 * Claimed missions stay claimed and do not re-accrue display progress beyond target.
 */
export function recordDailyMissionEvent(
  player: PlayerState,
  event: DailyMissionEvent,
  now: number = Date.now(),
): { state: PlayerState; daily: DailyMissionState; changed: boolean } {
  const ensured = ensureCurrentDailyMissionState(player.dailyMissions, now);
  let daily = ensured.state;
  let changed = ensured.didReset || ensured.repaired;
  const amount = Math.max(1, Math.trunc(event.amount ?? 1));

  const missions = { ...daily.missions };
  for (const definition of getActiveDailyMissionDefinitions()) {
    if (definition.eventType !== event.type) continue;
    const current = missions[definition.id] ?? { progress: 0, claimed: false };
    const nextProgress = Math.min(definition.target, current.progress + amount);
    if (nextProgress !== current.progress) {
      missions[definition.id] = { ...current, progress: nextProgress };
      changed = true;
    }
  }

  if (changed) {
    daily = { ...daily, missions };
  }

  if (!changed && daily === player.dailyMissions) {
    return { state: player, daily, changed: false };
  }

  return {
    state: { ...player, dailyMissions: daily },
    daily,
    changed: true,
  };
}
