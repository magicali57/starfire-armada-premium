// Reference-matching prototype data for the Battle Hub screen.
//
// These values intentionally mirror the approved reference image
// (01_Battle_Hub.png) exactly — Chapter 2 / "Shattered Nebula" / Stage 7 of
// 10, 17/30 chapter stars, etc. — rather than the real CAMPAIGN_CHAPTERS
// data (which currently only has Chapter 1 defined), so this first Battle
// Hub build can be screenshot-compared directly against the reference.
//
// This is prototype/mock data only. It can later connect to real campaign,
// event, and player state (chapter/stage progress, live Energy/Power,
// active Boss Raid tickets, a real Event system, etc.) — when that happens,
// only this file should need to change; BattleHubScreen.tsx should keep
// reading from these exports rather than hard-coding values itself.

export interface BattleHubCampaignPreview {
  tag: string;
  chapterLabel: string;
  chapterName: string;
  stageLabel: string;
  chapterStars: { current: number; max: number };
  recommendedPower: number;
  yourPower: number;
  energyCost: number;
}

export const BATTLE_HUB_CAMPAIGN_PREVIEW: BattleHubCampaignPreview = {
  tag: "CAMPAIGN",
  chapterLabel: "CHAPTER 2",
  chapterName: "SHATTERED NEBULA",
  stageLabel: "Stage 7 of 10",
  chapterStars: { current: 17, max: 30 },
  recommendedPower: 11900,
  yourPower: 12480,
  energyCost: 10,
};

export interface BattleHubDailyOperations {
  entriesAvailable: number;
}

export const BATTLE_HUB_DAILY_OPERATIONS: BattleHubDailyOperations = {
  entriesAvailable: 2,
};

export interface BattleHubBossRaid {
  ticketsUsed: number;
  ticketsCap: number;
  claimAvailable: boolean;
}

export const BATTLE_HUB_BOSS_RAID: BattleHubBossRaid = {
  ticketsUsed: 3,
  ticketsCap: 6,
  claimAvailable: true,
};

export interface BattleHubTraining {
  costLabel: string;
}

export const BATTLE_HUB_TRAINING: BattleHubTraining = {
  costLabel: "Free · No rewards",
};

export interface BattleHubActiveEvent {
  name: string;
  remainingLabel: string;
  rewardAvailable: boolean;
}

export const BATTLE_HUB_ACTIVE_EVENT: BattleHubActiveEvent = {
  name: "VOID INCURSION",
  remainingLabel: "5d 08h remaining",
  rewardAvailable: true,
};
