import type { CampaignChapter, CampaignStage, PlayerState } from "@/types";

export const CAMPAIGN_STAGES: CampaignStage[] = [
  {
    id: "ch1-stage-1",
    chapterId: "chapter-01",
    index: 1,
    name: "Formation Breach",
    kind: "standard",
    recommendedPower: 100,
    rewardCoins: 200,
    rewardCrystals: 5,
    cleared: false,
  },
  {
    id: "ch1-stage-2",
    chapterId: "chapter-01",
    index: 2,
    name: "Crossfire Belt",
    kind: "mixed-pattern",
    recommendedPower: 140,
    rewardCoins: 240,
    rewardCrystals: 5,
    cleared: false,
  },
  {
    id: "ch1-stage-3",
    chapterId: "chapter-01",
    index: 3,
    name: "Elite Vanguard",
    kind: "elite",
    recommendedPower: 180,
    rewardCoins: 280,
    rewardCrystals: 8,
    cleared: false,
  },
  {
    id: "ch1-stage-4",
    chapterId: "chapter-01",
    index: 4,
    name: "Attrition Zone",
    kind: "survival",
    recommendedPower: 220,
    rewardCoins: 320,
    rewardCrystals: 8,
    cleared: false,
  },
  {
    id: "ch1-stage-5",
    chapterId: "chapter-01",
    index: 5,
    name: "Iron Leviathan",
    kind: "boss",
    recommendedPower: 260,
    rewardCoins: 500,
    rewardCrystals: 20,
    cleared: false,
  },
];

export const CAMPAIGN_CHAPTERS: CampaignChapter[] = [
  {
    id: "chapter-01",
    index: 1,
    name: "Chapter 1 — Fractured Frontier",
    description: "The Armada's first stand against the outer-belt raiders.",
    stageIds: CAMPAIGN_STAGES.map((stage) => stage.id),
  },
];

export const getChapterById = (chapterId: string): CampaignChapter | undefined =>
  CAMPAIGN_CHAPTERS.find((chapter) => chapter.id === chapterId);

export const getStageById = (stageId: string): CampaignStage | undefined =>
  CAMPAIGN_STAGES.find((stage) => stage.id === stageId);

/** Every stage in the same chapter, in canonical (linear) order. */
export const getStagesInChapter = (chapterId: string): CampaignStage[] =>
  CAMPAIGN_STAGES.filter((stage) => stage.chapterId === chapterId);

/**
 * The ONE canonical stage-accessibility rule (linear per-chapter
 * progression via `highestClearedStageId`) — reused by Stage
 * Detail/Pre-Battle validation and by any stage-list screen, instead of
 * each re-deriving its own "highestClearedIndex" calculation. A stage is
 * accessible when it has already been cleared (repeat-clear/Replay is
 * always allowed) OR it is exactly the next stage after the chapter's
 * highest-cleared stage (including the very first stage of a chapter with
 * nothing cleared yet). Unknown stage ids are never accessible.
 */
export function isStageAccessible(player: PlayerState, stageId: string): boolean {
  const stage = getStageById(stageId);
  if (!stage) return false;
  const chapterStages = getStagesInChapter(stage.chapterId);
  const stageIndex = chapterStages.findIndex((s) => s.id === stageId);
  const highestClearedIndex = player.highestClearedStageId
    ? chapterStages.findIndex((s) => s.id === player.highestClearedStageId)
    : -1;
  return stageIndex <= highestClearedIndex + 1;
}
