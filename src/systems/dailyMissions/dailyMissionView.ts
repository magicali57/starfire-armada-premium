import type { PlayerState } from "@/types";
import type { DailyActivityMilestoneDefinition, DailyMissionDefinition } from "@/types/dailyMissions";
import {
  getActiveDailyMissionDefinitions,
  getOrderedDailyActivityMilestones,
  getDailyMissionDefinitionById,
} from "@/data/dailyMissions";
import { toRewardDisplayRows, type RewardDisplayRow } from "@/data/rewardDisplay";
import { ensureCurrentDailyMissionState } from "@/systems/dailyMissions/dailyMissionDay";

export type DailyMissionActionState = "go" | "claim" | "completed";

export interface DailyMissionViewItem {
  definition: DailyMissionDefinition;
  progress: number;
  target: number;
  progressPercent: number;
  completed: boolean;
  claimed: boolean;
  claimable: boolean;
  action: DailyMissionActionState;
  rewardRows: RewardDisplayRow[];
}

export interface DailyActivityMilestoneViewItem {
  definition: DailyActivityMilestoneDefinition;
  claimed: boolean;
  claimable: boolean;
  reached: boolean;
  rewardRows: RewardDisplayRow[];
}

export interface DailyMissionsScreenView {
  dayKey: string;
  activityPoints: number;
  maxActivityPoints: number;
  activityPercent: number;
  missions: DailyMissionViewItem[];
  milestones: DailyActivityMilestoneViewItem[];
  allMissionsClaimed: boolean;
}

function rewardRowsFor(definition: DailyMissionDefinition | DailyActivityMilestoneDefinition): RewardDisplayRow[] {
  const rarity =
    "tier" in definition
      ? definition.tier === "epic"
        ? "epic"
        : definition.tier === "rare"
          ? "rare"
          : "common"
      : "common";
  const source = "tier" in definition ? "daily-activity" : "daily-mission";
  return toRewardDisplayRows(
    definition.rewards.map((entry) => ({
      entry,
      source,
      rarity,
    })),
  );
}

/** Pure UI selector — never mutates PlayerState / never grants rewards. */
export function getDailyMissionsScreenView(player: PlayerState, now: number = Date.now()): DailyMissionsScreenView {
  const daily = ensureCurrentDailyMissionState(player.dailyMissions, now).state;
  const milestonesDefs = getOrderedDailyActivityMilestones();
  const maxActivityPoints = milestonesDefs.length > 0 ? milestonesDefs[milestonesDefs.length - 1].requiredPoints : 100;

  const missions: DailyMissionViewItem[] = getActiveDailyMissionDefinitions().map((definition) => {
    const row = daily.missions[definition.id] ?? { progress: 0, claimed: false };
    const progress = Math.min(definition.target, Math.max(0, row.progress));
    const completed = progress >= definition.target;
    const claimed = row.claimed === true;
    const claimable = completed && !claimed;
    const action: DailyMissionActionState = claimed ? "completed" : claimable ? "claim" : "go";
    return {
      definition,
      progress,
      target: definition.target,
      progressPercent: definition.target > 0 ? Math.min(100, Math.round((progress / definition.target) * 100)) : 0,
      completed,
      claimed,
      claimable,
      action,
      rewardRows: rewardRowsFor(definition),
    };
  });

  const milestones: DailyActivityMilestoneViewItem[] = milestonesDefs.map((definition) => {
    const claimed = daily.claimedMilestoneIds.includes(definition.id);
    const reached = daily.activityPoints >= definition.requiredPoints;
    return {
      definition,
      claimed,
      claimable: reached && !claimed,
      reached,
      rewardRows: rewardRowsFor(definition),
    };
  });

  return {
    dayKey: daily.dayKey,
    activityPoints: daily.activityPoints,
    maxActivityPoints,
    activityPercent: maxActivityPoints > 0 ? Math.min(100, Math.round((daily.activityPoints / maxActivityPoints) * 100)) : 0,
    missions,
    milestones,
    allMissionsClaimed: missions.length > 0 && missions.every((mission) => mission.claimed),
  };
}

export function getMissionGoRoute(missionId: string): string | null {
  return getDailyMissionDefinitionById(missionId)?.goToRoute ?? null;
}
