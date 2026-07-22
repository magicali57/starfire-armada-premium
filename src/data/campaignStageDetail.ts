// Reference-matching prototype UI data for the Campaign Stage Detail screen
// (07_Campaign_Stage_Detail.png). Deliberately separate from the real
// `data/campaign.ts` (today's single-chapter/5-stage gameplay data) — same
// "prototype data, connect to real progression later" convention already
// used by `campaignChapterMap.ts` and `campaignOverview.ts`.
//
// Only Stage 7 (Chapter 2, "Nebula Breach") has reference-matched content —
// it's the only stage the reference image ever shows. `getStageDetailContent`
// below returns that exact content for stage-7, and falls back to the same
// shape with the number/name swapped for every other stage id — a disclosed
// prototype approximation, not distinct reference-matched copy per stage.

export interface StageDetailStat {
  label: string;
  value: string;
}

export interface StageObjective {
  id: string;
  description: string;
  /** The reference shows all 3 objective rows identically (no per-row
   *  completion indicator distinct from the star icon itself), so Stage 7's
   *  own data never sets this. Kept as an optional field so a future stage
   *  state (e.g. a fully-cleared stage) can use it without a data-shape
   *  change. */
  completed?: boolean;
}

export type StageRewardIcon =
  | { kind: "resource"; id: "crystals" | "credits" }
  | { kind: "chest"; tier: "basic" | "rare" | "epic" | "legendary" }
  | { kind: "material"; id: "universalFragment" | "reviveToken" };

export interface StageRewardItem {
  id: string;
  amount: string;
  icon: StageRewardIcon;
}

export interface StageLoadoutMember {
  name: string;
  level: number;
  /** Ship: star count (1-5). Companion: rarity label (e.g. "SSS") — only
   *  one of the two is set depending on which slot this is. */
  stars?: number;
  rarityLabel?: string;
}

export interface StageDetailContent {
  stageId: string;
  stageIndex: number;
  chapterIndex: number;
  chapterLabel: string;
  /** Per-stage name, distinct from the chapter name — e.g. "Nebula Breach"
   *  for Stage 7. Not present anywhere in campaignChapterMap.ts, which only
   *  stores "Stage N" labels. */
  stageName: string;
  description: string;
  energyCost: number;
  recommendedPower: number;
  yourPower: number;
  bestGrade: string;
  fastestClear: string;
  objectives: StageObjective[];
  firstClearRewards: StageRewardItem[];
  repeatRewards: StageRewardItem[];
  loadoutShip: StageLoadoutMember;
  loadoutCompanion: StageLoadoutMember;
  totalPower: number;
  /** True only for the one stage (7) with real reference-matched content —
   *  every other id gets this same shape with number/name substituted, and
   *  the screen shows a small disclosure note when this is false. */
  isReferenceMatched: boolean;
}

// The one reference-matched stage.
export const STAGE_7_DETAIL: StageDetailContent = {
  stageId: "stage-7",
  stageIndex: 7,
  chapterIndex: 2,
  chapterLabel: "Chapter 2",
  stageName: "Nebula Breach",
  description: "Enemy forces have breached the outer defenses. Push through the nebula and secure the sector.",
  energyCost: 10,
  recommendedPower: 11900,
  yourPower: 12480,
  bestGrade: "A",
  fastestClear: "02:14",
  objectives: [
    { id: "obj-clear", description: "Clear the stage" },
    { id: "obj-hp", description: "Clear with at least 50% HP" },
    { id: "obj-no-revive", description: "Clear without revive" },
  ],
  // First Clear Rewards, left-to-right exactly as shown: 250 crystals, 75K
  // credits, 1 chest, 20 of a purple/gold faceted material.
  firstClearRewards: [
    { id: "fc-crystals", amount: "250", icon: { kind: "resource", id: "crystals" } },
    { id: "fc-credits", amount: "75K", icon: { kind: "resource", id: "credits" } },
    // The reference's chest is purple/ornate — closest of the 4 approved
    // tiers by color/ornamentation is "epic". Disclosed substitution.
    { id: "fc-chest", amount: "1", icon: { kind: "chest", tier: "epic" } },
    // The reference's 20-reward icon is a purple/gold rounded-triangle
    // material with a glowing center. No triangular material exists in the
    // approved set — "universalFragment" (a purple/gold faceted gem) is the
    // closest palette match, though its silhouette is a diamond, not a
    // triangle. Disclosed substitution.
    { id: "fc-material", amount: "20", icon: { kind: "material", id: "universalFragment" } },
  ],
  // Repeat Rewards: 30K credits, 100 crystals, 5 of a red/orange cylindrical
  // material.
  repeatRewards: [
    { id: "rp-credits", amount: "30K", icon: { kind: "resource", id: "credits" } },
    { id: "rp-crystals", amount: "100", icon: { kind: "resource", id: "crystals" } },
    // The reference's 5-reward icon is a red/orange cylindrical
    // vial/capsule. No matching shape or color exists in the approved
    // material set — "reviveToken" (a blue circular cross badge) is used as
    // the closest available substitute on theme (a consumable/support
    // material fits "repeat reward") rather than appearance. This is the
    // weakest visual match on this screen — flagged per instruction.
    { id: "rp-material", amount: "5", icon: { kind: "material", id: "reviveToken" } },
  ],
  // "Void Reaper" / "Rapid Drone" are reference-matched prototype names —
  // neither exists in the real 20-ship roster or the 6 real companion
  // names (see data/ship.ts, assetRegistry.ts COMPANION_ART). The screen
  // resolves the closest available art for both (see
  // CampaignStageDetailScreen.tsx's LOADOUT_ART constants), disclosed in
  // the completion report.
  loadoutShip: { name: "Void Reaper", level: 86, stars: 5 },
  loadoutCompanion: { name: "Rapid Drone", level: 60, rarityLabel: "SSS" },
  totalPower: 12480,
  isReferenceMatched: true,
};

/**
 * Returns Stage 7's reference-matched content verbatim for stage-7, or the
 * same shape with the stage number/generic name substituted for every other
 * id — explicitly prototype behavior per instruction, not per-stage
 * reference-matched copy. `stageIndex`/`chapterIndex` are still read from
 * the real `campaignChapterMap.ts` node when available, so at least the
 * number/chapter context stays accurate even where the flavor text doesn't.
 */
export function getStageDetailContent(stageId: string, stageIndex: number, chapterIndex: number): StageDetailContent {
  if (stageId === "stage-7") return STAGE_7_DETAIL;

  return {
    ...STAGE_7_DETAIL,
    stageId,
    stageIndex,
    chapterIndex,
    chapterLabel: `Chapter ${chapterIndex}`,
    stageName: `Stage ${stageIndex}`,
    description:
      "Stage-specific mission briefing isn't written yet — this reuses Stage 7's reference layout with placeholder copy.",
    isReferenceMatched: false,
  };
}
