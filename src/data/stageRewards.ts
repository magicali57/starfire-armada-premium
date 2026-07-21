import type { DropTableGroup, RewardEntry, StageRewardDefinition } from "@/types";
import { CAMPAIGN_STAGES, getChapterById, getStageById } from "./campaign";
import {
  getStageBaseXp,
  getStageFirstClearBonusXp,
  getStageRepeatXp,
} from "@/systems/playerProgression";

// Data-driven campaign stage reward definitions — the STATIC side of the
// reward system. Built deterministically from the canonical campaign data
// (stage kind/index and its existing rewardCoins/rewardCrystals anchors),
// never hand-rolled inside a screen and never storing resolved random
// results. Resolution happens in systems/rewards/resolveRewards.ts.
//
// Structure per stage:
// - guaranteed: every victory (Credits + Player XP, chapter-scaled).
// - firstClear: one-time bundle on top (bigger Credits, small premium
//   Crystals — the ONLY repeatable-free source of crystals here — plus
//   upgrade materials and, on boss stages, a chest).
// - repeatClear: smaller sustainable payout (Credits/XP fraction plus a
//   common material trickle).
// - dropTable: weighted optional drops (fragments, materials, rare chest/
//   consumable chances; boss stages roll a stronger table).

/** Chapter scaling: +25% Credits/XP per chapter past the first. */
export function getChapterRewardMultiplier(chapterIndex: number): number {
  return 1 + 0.25 * Math.max(0, chapterIndex - 1);
}

const FIRST_CLEAR_MATERIALS: Record<number, RewardEntry[]> = {
  // Keyed by stage index within the chapter — deterministic variety so the
  // five Chapter 1 stages seed different progression tracks.
  1: [{ kind: "material", materialId: "shipAlloy", amount: 40 }],
  2: [{ kind: "material", materialId: "weaponParts", amount: 20 }],
  3: [{ kind: "material", materialId: "companionData", amount: 25 }],
  4: [{ kind: "material", materialId: "moduleParts", amount: 20 }],
  5: [{ kind: "material", materialId: "abilityCores", amount: 8 }],
};

function buildStandardDropTable(bossStage: boolean): DropTableGroup[] {
  const groups: DropTableGroup[] = [
    {
      id: "materials",
      rolls: 1,
      entries: [
        { weight: 30, rarity: "common", entry: { kind: "material", materialId: "shipAlloy", minAmount: 4, maxAmount: 10 } },
        { weight: 20, rarity: "common", entry: { kind: "material", materialId: "weaponParts", minAmount: 2, maxAmount: 6 } },
        { weight: 20, rarity: "common", entry: { kind: "material", materialId: "moduleParts", minAmount: 2, maxAmount: 6 } },
        // Launch-economy audit correction: Companion Data previously had no
        // repeatable source (first-clear + unopenable chests only), leaving
        // Companion Upgrade droughts. Small repeat trickle added here.
        { weight: 10, rarity: "common", entry: { kind: "material", materialId: "companionData", minAmount: 2, maxAmount: 5 } },
        { weight: 20, rarity: "common", entry: { kind: "nothing" } },
      ],
    },
    {
      id: "fragments",
      rolls: 1,
      exclusive: true,
      entries: [
        { weight: bossStage ? 18 : 8, rarity: "rare", entry: { kind: "material", materialId: "universalShards", minAmount: 1, maxAmount: bossStage ? 4 : 2 } },
        { weight: bossStage ? 12 : 5, rarity: "rare", entry: { kind: "material", materialId: "companionShards", minAmount: 1, maxAmount: 3 } },
        { weight: bossStage ? 70 : 87, rarity: "common", entry: { kind: "nothing" } },
      ],
    },
    {
      id: "extras",
      rolls: 1,
      exclusive: true,
      entries: [
        { weight: bossStage ? 10 : 3, rarity: "rare", entry: { kind: "chest", chestId: "chestBasic", minAmount: 1, maxAmount: 1 } },
        { weight: bossStage ? 4 : 0, rarity: "epic", entry: { kind: "chest", chestId: "chestRare", minAmount: 1, maxAmount: 1 } },
        { weight: 5, rarity: "common", entry: { kind: "consumable", consumableId: "consumableRepairKit", minAmount: 1, maxAmount: 1 } },
        { weight: 3, rarity: "common", entry: { kind: "consumable", consumableId: "consumableShieldCharge", minAmount: 1, maxAmount: 1 } },
        { weight: bossStage ? 78 : 89, rarity: "common", entry: { kind: "nothing" } },
      ],
    },
  ];
  return groups;
}

function buildStageRewardDefinition(stageId: string): StageRewardDefinition | null {
  const stage = getStageById(stageId);
  if (!stage) return null;
  const chapter = getChapterById(stage.chapterId);
  const chapterIndex = chapter?.index ?? 1;
  const bossStage = stage.kind === "boss";
  const chapterMultiplier = getChapterRewardMultiplier(chapterIndex);

  // Player XP comes ONLY from the canonical stage-XP helpers in
  // systems/playerProgression.ts (balanced against the account XP curve) —
  // never hand-tuned per stage here. Chapter + difficulty scaling is
  // applied downstream by resolveRewards' existing multipliers.
  const xpInputs = { stageIndex: stage.index, bossStage };
  const baseXp = getStageBaseXp(xpInputs);

  return {
    stageId: stage.id,
    chapterIndex,
    stageIndex: stage.index,
    bossStage,
    guaranteed: [
      // Full stage Credits anchor on every victory (the value Pre-Battle
      // and Stage Detail already advertise), chapter-scaled at resolve time.
      { kind: "currency", currencyId: "coins", amount: stage.rewardCoins },
      { kind: "playerXp", amount: baseXp },
    ],
    firstClear: [
      { kind: "currency", currencyId: "coins", amount: stage.rewardCoins * 2 },
      // Small one-time premium payout — the stage's advertised crystals are
      // first-clear-only by design (never repeat-farmable).
      { kind: "currency", currencyId: "crystals", amount: stage.rewardCrystals },
      { kind: "playerXp", amount: getStageFirstClearBonusXp(xpInputs) },
      ...(FIRST_CLEAR_MATERIALS[stage.index] ?? []),
      ...(bossStage
        ? [{ kind: "chest", chestId: "chestRare", amount: 1 } satisfies RewardEntry]
        : []),
    ],
    repeatClear: [
      { kind: "currency", currencyId: "coins", amount: Math.round(stage.rewardCoins * 0.35) },
      { kind: "playerXp", amount: getStageRepeatXp(xpInputs) },
      { kind: "material", materialId: "shipAlloy", amount: bossStage ? 8 : 4 },
    ],
    dropTable: buildStandardDropTable(bossStage),
    chapterMultiplier,
  };
}

const STAGE_REWARD_DEFINITIONS = new Map<string, StageRewardDefinition>(
  CAMPAIGN_STAGES.flatMap((stage) => {
    const definition = buildStageRewardDefinition(stage.id);
    return definition ? [[stage.id, definition] as const] : [];
  }),
);

export function getStageRewardDefinition(stageId: string): StageRewardDefinition | null {
  return STAGE_REWARD_DEFINITIONS.get(stageId) ?? null;
}

/**
 * Launch-economy audit correction: ship-SPECIFIC fragments previously had
 * no repeatable source at all (starter balance + duplicate-ship conversion
 * only), making Star Rank an eventual dead end that Universal Shards would
 * fully replace. Every victory now grants a small deterministic fragment
 * award for the PILOTED ship (the selected ship completeCampaignStage sees)
 * — boss stages pay more, first clears pay a bonus, and repeats on normal
 * stages pay nothing (so bosses stay the fragment farm and Star Rank never
 * becomes a routine one-battle upgrade). Deterministic by design: not part
 * of the random drop table.
 */
export function getStageShipFragmentReward(bossStage: boolean, firstClear: boolean): number {
  if (firstClear) return bossStage ? 10 : 5;
  return bossStage ? 2 : 0;
}
