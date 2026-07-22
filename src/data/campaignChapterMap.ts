// Reference-matching prototype UI data for the Campaign Chapter Map screen
// (06_Campaign_Chapter_Map.png). Deliberately separate from the real
// `data/campaign.ts` (today's single "Fractured Frontier" chapter, used by
// actual stage/gameplay logic) — same "prototype data, connect to real
// progression later" convention already used by `battleHub.ts` and
// `campaignOverview.ts`. Values below are copied verbatim from the approved
// reference, including the reference's own inconsistencies (see the stage
// data below), not corrected or estimated.
//
// Chapter 1 map nodes are an explicit bridge onto canonical `ch1-stage-N`
// ids via `getChapter1MapStages` — Stage 1 on that map opens `ch1-stage-1`.

import type { PlayerState } from "@/types";
import { getStageById, getStagesInChapter, isStageAccessible } from "@/data/campaign";

export interface ChapterMapInfo {
  chapterIndex: number;
  name: string;
  description: string;
  chapterStars: { current: number; max: number };
}

/** Prototype Chapter 2 map (reference-matched). Kept as the default visual
 *  fixture for `chapter-02` only — never used as a silent fallback when the
 *  player selected Chapter 1. */
export const CHAPTER_MAP_INFO: ChapterMapInfo = {
  chapterIndex: 2,
  name: "SHATTERED NEBULA",
  description:
    "A nebula torn apart by an ancient cataclysm. Only the bold will chart a path forward.",
  chapterStars: { current: 17, max: 30 },
};

/** Canonical overview chapter ids that can open a chapter map. */
export const CHAPTER_MAP_SUPPORTED_IDS = ["chapter-01", "chapter-02"] as const;
export type ChapterMapSupportedId = (typeof CHAPTER_MAP_SUPPORTED_IDS)[number];

export const CHAPTER_01_MAP_INFO: ChapterMapInfo = {
  chapterIndex: 1,
  name: "VEIL SECTOR",
  description:
    "The Armada's first stand at the edge of known space — fully cleared, all stars collected.",
  chapterStars: { current: 30, max: 30 },
};

export function isChapterMapSupportedId(id: string): id is ChapterMapSupportedId {
  return (CHAPTER_MAP_SUPPORTED_IDS as readonly string[]).includes(id);
}

/**
 * Resolve `?chapter=` from the chapter-map hash. Invalid / missing ids fall
 * back to Chapter 1 (the only chapter with canonical playable stages), not
 * a hard-coded Chapter 2 route.
 */
export function resolveChapterMapIdFromHash(hash = typeof window !== "undefined" ? window.location.hash : ""): ChapterMapSupportedId {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "chapter-01";
  const raw = new URLSearchParams(hash.slice(queryIndex + 1)).get("chapter");
  if (raw && isChapterMapSupportedId(raw)) return raw;
  return "chapter-01";
}

export function getChapterMapInfo(chapterId: string): ChapterMapInfo {
  if (chapterId === "chapter-01") return CHAPTER_01_MAP_INFO;
  return CHAPTER_MAP_INFO;
}

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

/**
 * Chapter 1 Stage 1…5 map nodes use canonical campaign ids (`ch1-stage-N`).
 * Only existing `CAMPAIGN_STAGES` entries are mapped — no invented stages.
 * Lock/current/completed derive from `highestClearedStageId` via
 * `isStageAccessible` / cleared index (presentation only; no progression writes).
 */
export function getChapter1MapStages(player: PlayerState): StageMapNode[] {
  const stages = getStagesInChapter("chapter-01");
  const highestClearedIndex = player.highestClearedStageId
    ? stages.findIndex((s) => s.id === player.highestClearedStageId)
    : -1;

  return stages.map((stage, index) => {
    let state: StageMapNodeState = "locked";
    if (index <= highestClearedIndex) state = "completed";
    else if (index === highestClearedIndex + 1) state = "current";
    else if (isStageAccessible(player, stage.id)) state = "current";

    const column: StageMapColumn = index < 3 ? "left" : "right";
    return {
      id: stage.id,
      index: stage.index,
      state,
      starsEarned: state === "completed" ? 3 : 0,
      starsMax: 3,
      isBoss: stage.kind === "boss",
      column,
    };
  });
}

export function getChapterMapStages(chapterId: string, player: PlayerState): StageMapNode[] {
  if (chapterId === "chapter-01") return getChapter1MapStages(player);
  return CAMPAIGN_CHAPTER_MAP_STAGES;
}

export function getChapterMapLeftStages(chapterId: string, player: PlayerState): StageMapNode[] {
  return getChapterMapStages(chapterId, player).filter((stage) => stage.column === "left");
}

export function getChapterMapRightStages(chapterId: string, player: PlayerState): StageMapNode[] {
  return getChapterMapStages(chapterId, player).filter((stage) => stage.column === "right");
}

export const getStageMapNodeById = (id: string): StageMapNode | undefined => {
  const prototype = CAMPAIGN_CHAPTER_MAP_STAGES.find((stage) => stage.id === id);
  if (prototype) return prototype;
  // Canonical Chapter 1 ids are not in the prototype list — synthesize a
  // lookup node so Stage Detail / Pre-Battle prototype fallbacks still work
  // when needed (real getStageById takes priority for battle).
  const real = getStageById(id);
  if (!real || real.chapterId !== "chapter-01") return undefined;
  return {
    id: real.id,
    index: real.index,
    state: "current",
    starsEarned: 0,
    starsMax: 3,
    isBoss: real.kind === "boss",
    column: real.index <= 3 ? "left" : "right",
  };
};
