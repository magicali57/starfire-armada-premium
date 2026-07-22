import type { PlayerState, ResolvedReward, RewardEntry } from "@/types";
import type { DailyMissionClaimResult } from "@/types/dailyMissions";
import { getDailyMissionDefinitionById } from "@/data/dailyMissions";
import { applyRewardBundle } from "@/systems/rewards/applyRewards";
import { ensureCurrentDailyMissionState } from "./dailyMissionDay";

export function buildDailyMissionClaimFailure(
  state: PlayerState,
  missionId: string,
  errorCode: NonNullable<DailyMissionClaimResult["errorCode"]>,
): DailyMissionClaimResult {
  const definition = getDailyMissionDefinitionById(missionId);
  const daily = ensureCurrentDailyMissionState(state.dailyMissions).state;
  return {
    success: false,
    missionId,
    missionTitle: definition?.title ?? "Unknown Mission",
    activityPointsAwarded: 0,
    activityPointsAfter: daily.activityPoints,
    appliedRewards: [],
    errorCode,
  };
}

/**
 * Atomic Daily Mission claim:
 * ensure day → validate → applyRewardBundle → mark claimed → add activity points.
 * On any failure returns the original player state untouched.
 */
export function claimDailyMissionReward(
  player: PlayerState,
  missionId: string,
  now: number = Date.now(),
): { state: PlayerState; result: DailyMissionClaimResult } {
  const failure = (errorCode: NonNullable<DailyMissionClaimResult["errorCode"]>) => ({
    state: player,
    result: buildDailyMissionClaimFailure(player, missionId, errorCode),
  });

  const ensured = ensureCurrentDailyMissionState(player.dailyMissions, now);
  const daily = ensured.state;
  const basePlayer: PlayerState = { ...player, dailyMissions: daily };

  const definition = getDailyMissionDefinitionById(missionId);
  if (!definition) return failure("invalid-mission-id");
  if (definition.status !== "active") return failure("inactive-mission");

  const progress = daily.missions[missionId] ?? { progress: 0, claimed: false };
  if (progress.claimed) return failure("already-claimed");
  if (progress.progress < definition.target) return failure("incomplete");
  if (definition.rewards.length === 0) return failure("invalid-reward-entry");

  const resolved: ResolvedReward[] = definition.rewards.map((entry) => ({
    entry,
    source: "daily-mission",
    rarity: "common",
  }));
  const application = applyRewardBundle(basePlayer, resolved);
  if (!application.result.success) return failure("invalid-reward-entry");

  const activityPointsAwarded = definition.activityPoints;
  const nextDaily = {
    ...daily,
    missions: {
      ...daily.missions,
      [missionId]: { progress: definition.target, claimed: true },
    },
    activityPoints: daily.activityPoints + activityPointsAwarded,
  };

  const appliedRewards: RewardEntry[] = application.result.applied.map((reward) => reward.entry);

  return {
    state: { ...application.state, dailyMissions: nextDaily },
    result: {
      success: true,
      missionId,
      missionTitle: definition.title,
      activityPointsAwarded,
      activityPointsAfter: nextDaily.activityPoints,
      appliedRewards,
    },
  };
}
