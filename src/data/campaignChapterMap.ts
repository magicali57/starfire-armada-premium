// Reference-matching prototype UI data for the Campaign Chapter Map screen
// (06_Campaign_Chapter_Map.png). Deliberately separate from the real
// `data/campaign.ts` (today's single "Fractured Frontier" chapter, used by
// actual stage/gameplay logic) — same "prototype data, connect to real
// progression later" convention already used by `battleHub.ts` and
// `campaignOverview.ts`. Values below are copied verbatim from the approved
// reference, including the reference's own inconsistencies (see the stage
// data below), not corrected or estimated.

export interface ChapterMapInfo {
  chapterIndex: number;
  name: string;
  description: string;
  chapterStars: { current: number; max: number };
}

export const CHAPTER_MAP_INFO: ChapterMapInfo = {
  chapterIndex: 2,
  name: "SHATTERED NEBULA",
  description:
    "A nebula torn apart by an ancient cataclysm. Only the bold will chart a path forward.",
  chapterStars: { current: 17, max: 30 },
};

export type ChapterMapRewardId = "crystals" | "credits" | "chests";

export interface ChapterMapReward {
  id: ChapterMapRewardId;
  /** Display string, not a number — the reference shows "250K" as text, not
   *  a formatted number, so this is stored pre-formatted. */
  amount: string;
}

export const CHAPTER_MAP_INTRO_REWARDS: ChapterMapReward[] = [
  { id: "crystals", amount: "500" },
  { id: "credits", amount: "250K" },
  { id: "chests", amount: "5" },
];

export type ChestMilestoneState = "claimed" | "claimable" | "locked";

export interface ChestMilestone {
  stars: number;
  chestTier: "basic" | "epic" | "legendary";
  state: ChestMilestoneState;
}

// Chest-tier mapping matched by comparing the reference's 3 chest colors
// against the actual REWARD_CHEST art (see CAMPAIGN_CHAPTER_MAP_PLAN.md
// §11): the 10-star chest is the gold/ornate "legendary" tier, the 20-star
// chest is the purple/ornate "epic" tier, and the 30-star chest is the
// plainer blue "basic" tier — a reversed rarity order relative to the star
// thresholds, but that's what the reference shows. "rare" is unused on this
// row. Reference-matched, not logic-corrected.
export const CHAPTER_MAP_CHEST_TRACK: ChestMilestone[] = [
  { stars: 10, chestTier: "legendary", state: "claimed" },
  { stars: 20, chestTier: "epic", state: "claimable" },
  { stars: 30, chestTier: "basic", state: "locked" },
];

export type StageMapNodeState = "completed" | "current" | "locked";
export type StageMapColumn = "left" | "right";

export interface StageMapNode {
  id: string;
  index: number;
  state: StageMapNodeState;
  /** Reference-literal, out of `starsMax` (always 3). Stages 8-10 show
   *  non-zero partial stars despite being locked/unplayed in the reference
   *  image itself — kept exactly as shown per instruction, not zeroed out.
   *  Real per-stage star progress will replace this later. */
  starsEarned: number;
  starsMax: number;
  isBoss: boolean;
  column: StageMapColumn;
}

// Two parallel columns, left (1-5) then right (6-10) — see StageMapPath for
// the connector geometry. Order here is display/path order, not a flat
// gameplay sequence array.
export const CAMPAIGN_CHAPTER_MAP_STAGES: StageMapNode[] = [
  { id: "stage-1", index: 1, state: "completed", starsEarned: 3, starsMax: 3, isBoss: false, column: "left" },
  { id: "stage-2", index: 2, state: "completed", starsEarned: 3, starsMax: 3, isBoss: false, column: "left" },
  { id: "stage-3", index: 3, state: "completed", starsEarned: 3, starsMax: 3, isBoss: false, column: "left" },
  { id: "stage-4", index: 4, state: "completed", starsEarned: 3, starsMax: 3, isBoss: false, column: "left" },
  { id: "stage-5", index: 5, state: "completed", starsEarned: 3, starsMax: 3, isBoss: false, column: "left" },
  { id: "stage-6", index: 6, state: "completed", starsEarned: 3, starsMax: 3, isBoss: false, column: "right" },
  { id: "stage-7", index: 7, state: "current", starsEarned: 3, starsMax: 3, isBoss: false, column: "right" },
  { id: "stage-8", index: 8, state: "locked", starsEarned: 2, starsMax: 3, isBoss: false, column: "right" },
  { id: "stage-9", index: 9, state: "locked", starsEarned: 1, starsMax: 3, isBoss: false, column: "right" },
  { id: "stage-10", index: 10, state: "locked", starsEarned: 1, starsMax: 3, isBoss: true, column: "right" },
];

export const CAMPAIGN_CHAPTER_MAP_LEFT_STAGES = CAMPAIGN_CHAPTER_MAP_STAGES.filter(
  (stage) => stage.column === "left"
);
export const CAMPAIGN_CHAPTER_MAP_RIGHT_STAGES = CAMPAIGN_CHAPTER_MAP_STAGES.filter(
  (stage) => stage.column === "right"
);

export const getStageMapNodeById = (id: string): StageMapNode | undefined =>
  CAMPAIGN_CHAPTER_MAP_STAGES.find((stage) => stage.id === id);
