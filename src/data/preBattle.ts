// Reference-matching prototype UI data for the Pre-Battle screen
// (08_Pre_Battle.png). Same temporary/disclosed convention as
// campaignStageDetail.ts / campaignChapterMap.ts — kept separate from real
// `data/campaign.ts` gameplay data, clearly not real progression state.
//
// Mission identity (stage name/description/energy cost/power/objectives) is
// reused verbatim from Stage Detail's own STAGE_7_DETAIL rather than
// duplicated here, via `getPreBattleContent` below. Only the fields
// Pre-Battle needs that Stage Detail doesn't already model are added:
// modules, stage modifiers, and a condensed reward preview.
//
// The loadout ship/companion shown here are intentionally NOT the same as
// Stage Detail's own loadout labels ("Void Reaper" / "Rapid Drone" —
// themselves a disclosed prototype substitution). The Pre-Battle reference
// image literally labels the ship "HOMING MISSILES", which is an exact
// match to the real asset id `ship-03-homing-missiles` in
// SHIP_ROSTER_ART — a closer, disclosed correction, resolved in
// PreBattleScreen.tsx alongside the rest of this screen's art (art paths
// are intentionally kept out of this data file, matching the convention
// campaignStageDetail.ts already established).

import { getStageDetailContent, type StageObjective } from "./campaignStageDetail";
import type { BattleModeIconVariant } from "@/components/icons/BattleModeIcon";

export interface PreBattleLoadoutMember {
  name: string;
  level: number;
  rarityLabel: string;
}

export interface PreBattleModuleSlot {
  slotLabel: "Core" | "Plating" | "System";
  name: string;
  level: number;
  rarityLabel: string;
}

export interface PreBattleModifier {
  id: string;
  icon: BattleModeIconVariant;
  label: string;
  value: string;
}

export interface PreBattleContent {
  stageId: string;
  stageIndex: number;
  chapterIndex: number;
  chapterLabel: string;
  stageName: string;
  description: string;
  energyCost: number;
  recommendedPower: number;
  yourPower: number;
  objectives: StageObjective[];
  isReferenceMatched: boolean;

  loadoutShip: PreBattleLoadoutMember;
  loadoutCompanion: PreBattleLoadoutMember;
  modules: {
    core: PreBattleModuleSlot;
    plating: PreBattleModuleSlot;
    system: PreBattleModuleSlot;
  };

  stageModifiers: PreBattleModifier[];

  /** Condensed reward preview — Credits and Crystals reuse Stage Detail's
   *  own first-clear reward amounts (75K / 250) per instruction to reuse
   *  Stage Detail's reward data. XP has no equivalent field anywhere in
   *  campaignStageDetail.ts — 12,000 is a new prototype value, disclosed
   *  here and in the completion report, matching what the reference image
   *  itself shows ("12K"). */
  rewardPreviewCredits: string;
  rewardPreviewCrystals: string;
  rewardPreviewXp: string;
  bonusRewardLabel: string;
}

const STAGE_7_MODULES: PreBattleContent["modules"] = {
  core: { slotLabel: "Core", name: "Nebula Core", level: 86, rarityLabel: "SSS" },
  plating: { slotLabel: "Plating", name: "Titanium Plating", level: 86, rarityLabel: "SSS" },
  system: { slotLabel: "System", name: "Targeting AI", level: 86, rarityLabel: "SSS" },
};

const STAGE_7_MODIFIERS: PreBattleModifier[] = [
  { id: "mod-shields", icon: "shield", label: "Enemy Shields", value: "+30%" },
  { id: "mod-energy-drain", icon: "energy", label: "Energy Drain", value: "+20%" },
  { id: "mod-void-storm", icon: "skull", label: "Void Storm", value: "Periodic damage zones" },
];

/**
 * Returns Pre-Battle content for a given stage. Stage 7 gets the full
 * reference-matched build (mission fields borrowed from Stage Detail's own
 * STAGE_7_DETAIL, plus this screen's own modules/modifiers/reward-preview
 * fields). Every other stage id reuses Stage Detail's own generic-stage
 * fallback for the mission fields, and the same Stage 7 modules/modifiers
 * shape with `isReferenceMatched: false` — an explicit prototype
 * approximation, not per-stage reference-matched data, same disclosed
 * pattern `getStageDetailContent` already uses.
 */
export function getPreBattleContent(stageId: string, stageIndex: number, chapterIndex: number): PreBattleContent {
  const stageDetail = getStageDetailContent(stageId, stageIndex, chapterIndex);

  return {
    stageId: stageDetail.stageId,
    stageIndex: stageDetail.stageIndex,
    chapterIndex: stageDetail.chapterIndex,
    chapterLabel: stageDetail.chapterLabel,
    stageName: stageDetail.stageName,
    description: stageDetail.description,
    energyCost: stageDetail.energyCost,
    recommendedPower: stageDetail.recommendedPower,
    yourPower: stageDetail.yourPower,
    objectives: stageDetail.objectives,
    isReferenceMatched: stageDetail.isReferenceMatched,

    loadoutShip: { name: "Homing Missiles", level: 86, rarityLabel: "SSS" },
    loadoutCompanion: { name: "Repair Drone", level: 60, rarityLabel: "SSS" },
    modules: STAGE_7_MODULES,

    stageModifiers: STAGE_7_MODIFIERS,

    rewardPreviewCredits: "75K",
    rewardPreviewCrystals: "250",
    rewardPreviewXp: "12K",
    bonusRewardLabel: "Chance to get Epic Module",
  };
}
