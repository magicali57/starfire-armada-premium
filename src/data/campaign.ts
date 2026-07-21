import type { CampaignChapter, CampaignStage } from "@/types";

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
