import type { PlayerState, ResolvedReward, RewardEntry } from "@/types";
import type { DailyActivityClaimResult } from "@/types/dailyMissions";
import { getDailyActivityMilestoneById } from "@/data/dailyMissions";
import { applyRewardBundle } from "@/systems/rewards/applyRewards";
import { ensureCurrentDailyMissionState } from "./dailyMissionDay";

export function buildDailyActivityClaimFailure(
  state: PlayerState,
  milestoneId: string,
  errorCode: NonNullable<DailyActivityClaimResult["errorCode"]>,
): DailyActivityClaimResult {
  const milestone = getDailyActivityMilestoneById(milestoneId);
  const daily = ensureCurrentDailyMissionState(state.dailyMissions).state;
  return {
    success: false,
    milestoneId,
    requiredPoints: milestone?.requiredPoints ?? 0,
    activityPoints: daily.activityPoints,
    appliedRewards: [],
    errorCode,
  };
}

/**
 * Atomic Daily Activity milestone claim.
 * Manual claim only — never auto-grants from mission claims.
 */
export function claimDailyActivityMilestone(
  player: PlayerState,
  milestoneId: string,
  now: number = Date.now(),
): { state: PlayerState; result: DailyActivityClaimResult } {
  const failure = (errorCode: NonNullable<DailyActivityClaimResult["errorCode"]>) => ({
    state: player,
    result: buildDailyActivityClaimFailure(player, milestoneId, errorCode),
  });

  const ensured = ensureCurrentDailyMissionState(player.dailyMissions, now);
  const daily = ensured.state;
  const basePlayer: PlayerState = { ...player, dailyMissions: daily };

  const milestone = getDailyActivityMilestoneById(milestoneId);
  if (!milestone) return failure("invalid-milestone-id");
  if (daily.claimedMilestoneIds.includes(milestoneId)) return failure("already-claimed");
  if (daily.activityPoints < milestone.requiredPoints) return failure("insufficient-activity");
  if (milestone.rewards.length === 0) return failure("invalid-reward-entry");

  const resolved: ResolvedReward[] = milestone.rewards.map((entry) => ({
    entry,
    source: "daily-activity",
    rarity: milestone.tier === "epic" ? "epic" : milestone.tier === "rare" ? "rare" : "common",
  }));
  const application = applyRewardBundle(basePlayer, resolved);
  if (!application.result.success) return failure("invalid-reward-entry");

  const nextDaily = {
    ...daily,
    claimedMilestoneIds: [...daily.claimedMilestoneIds, milestoneId],
  };
  const appliedRewards: RewardEntry[] = application.result.applied.map((reward) => reward.entry);

  return {
    state: { ...application.state, dailyMissions: nextDaily },
    result: {
      success: true,
      milestoneId,
      requiredPoints: milestone.requiredPoints,
      activityPoints: nextDaily.activityPoints,
      appliedRewards,
    },
  };
}
