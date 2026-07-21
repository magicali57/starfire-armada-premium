export type StageKind =
  | "standard"
  | "mixed-pattern"
  | "elite"
  | "survival"
  | "boss";

export interface CampaignStage {
  id: string;
  chapterId: string;
  index: number;
  name: string;
  kind: StageKind;
  recommendedPower: number;
  rewardCoins: number;
  rewardCrystals: number;
  cleared: boolean;
}

export interface CampaignChapter {
  id: string;
  index: number;
  name: string;
  description: string;
  stageIds: string[];
}
