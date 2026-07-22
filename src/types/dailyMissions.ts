import type { RewardEntry } from "./reward";

/** Canonical daily-mission event types — emitted only from successful store transactions. */
export type DailyMissionEventType =
  | "battleStarted"
  | "battleCompleted"
  | "battleWon"
  | "energySpent"
  | "shipUpgraded"
  | "shipAbilityUpgraded"
  | "weaponUpgraded"
  | "moduleUpgraded"
  | "companionUpgraded"
  | "chestOpened"
  | "shopPurchaseCompleted";

export type DailyMissionDefinitionStatus = "active" | "planned" | "future";

export interface DailyMissionEvent {
  type: DailyMissionEventType;
  /** Optional magnitude — used by energySpent (Energy units spent). Defaults to 1. */
  amount?: number;
}

export interface DailyMissionDefinition {
  id: string;
  title: string;
  description: string;
  iconKey: string;
  eventType: DailyMissionEventType;
  target: number;
  activityPoints: number;
  rewards: RewardEntry[];
  /** Real RouteId string for GO navigation — never a fake destination. */
  goToRoute: string;
  sortOrder: number;
  status: DailyMissionDefinitionStatus;
}

export interface DailyMissionProgress {
  progress: number;
  claimed: boolean;
}

export interface DailyMissionState {
  /** Current active calendar day key (YYYY-MM-DD, local). */
  dayKey: string;
  /** Monotonic observed day — never moves backward with the device clock. */
  lastObservedDayKey: string;
  missions: Record<string, DailyMissionProgress>;
  activityPoints: number;
  claimedMilestoneIds: string[];
}

export interface DailyActivityMilestoneDefinition {
  id: string;
  requiredPoints: number;
  rewards: RewardEntry[];
  /** Visual tier for chest treatment. */
  tier: "basic" | "rare" | "epic";
  sortOrder: number;
}

export type DailyMissionClaimErrorCode =
  | "invalid-mission-id"
  | "inactive-mission"
  | "incomplete"
  | "already-claimed"
  | "invalid-reward-entry"
  | "persistence-failure"
  | "claim-in-progress";

export interface DailyMissionClaimResult {
  success: boolean;
  missionId: string;
  missionTitle: string;
  activityPointsAwarded: number;
  activityPointsAfter: number;
  appliedRewards: RewardEntry[];
  errorCode?: DailyMissionClaimErrorCode;
}

export type DailyActivityClaimErrorCode =
  | "invalid-milestone-id"
  | "insufficient-activity"
  | "already-claimed"
  | "invalid-reward-entry"
  | "persistence-failure"
  | "claim-in-progress";

export interface DailyActivityClaimResult {
  success: boolean;
  milestoneId: string;
  requiredPoints: number;
  activityPoints: number;
  appliedRewards: RewardEntry[];
  errorCode?: DailyActivityClaimErrorCode;
}
