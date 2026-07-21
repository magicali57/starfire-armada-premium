import type {
  DropTableEntry,
  DropTableGroup,
  RandomSource,
  ResolvedReward,
  RewardBundle,
  RewardDifficulty,
  RewardEntry,
  RewardRollContext,
  RewardSource,
  StageRewardDefinition,
} from "@/types";

// Pure reward resolution: static StageRewardDefinition + RewardRollContext
// → exact RewardBundle (exact ids, exact quantities, provenance). No state
// mutation, no Math.random (all randomness flows through the injected
// RandomSource), no UI concerns — a future Results/Reward Reveal screen
// simply renders the returned bundle.

/** Difficulty scaling: material quantities scale up on harder difficulties;
 *  Credits/XP scale mildly. Deterministic and deliberately simple. */
const DIFFICULTY_QUANTITY_MULTIPLIER: Record<RewardDifficulty, number> = {
  normal: 1,
  hard: 1.5,
  nightmare: 2,
};

const DIFFICULTY_CURRENCY_MULTIPLIER: Record<RewardDifficulty, number> = {
  normal: 1,
  hard: 1.25,
  nightmare: 1.5,
};

function scaleEntry(
  entry: RewardEntry,
  definition: StageRewardDefinition,
  difficulty: RewardDifficulty,
): RewardEntry {
  const currencyScale = definition.chapterMultiplier * DIFFICULTY_CURRENCY_MULTIPLIER[difficulty];
  const materialScale = DIFFICULTY_QUANTITY_MULTIPLIER[difficulty];
  switch (entry.kind) {
    case "currency":
      // Premium crystals are one-time amounts — never difficulty-farmable.
      if (entry.currencyId === "crystals") return entry;
      return { ...entry, amount: Math.round(entry.amount * currencyScale) };
    case "playerXp":
      return { ...entry, amount: Math.round(entry.amount * currencyScale) };
    case "material":
    case "shipFragment":
      return { ...entry, amount: Math.round(entry.amount * materialScale) };
    default:
      // Chests, consumables, collectibles never quantity-scale.
      return entry;
  }
}

function resolveEntries(
  entries: RewardEntry[],
  definition: StageRewardDefinition,
  difficulty: RewardDifficulty,
  source: RewardSource,
): ResolvedReward[] {
  return entries.map((entry) => ({
    entry: scaleEntry(entry, definition, difficulty),
    source,
    rarity: entry.kind === "currency" && entry.currencyId === "crystals" ? "rare" : "common",
  }));
}

export function resolveGuaranteedRewards(
  definition: StageRewardDefinition,
  context: RewardRollContext,
): ResolvedReward[] {
  const source: RewardSource = context.firstClear ? "campaign-first-clear" : "campaign-repeat";
  return resolveEntries(definition.guaranteed, definition, context.difficulty, source);
}

export function resolveFirstClearRewards(
  definition: StageRewardDefinition,
  context: RewardRollContext,
): ResolvedReward[] {
  if (!context.firstClear) return [];
  return resolveEntries(definition.firstClear, definition, context.difficulty, "campaign-first-clear");
}

export function resolveRepeatClearRewards(
  definition: StageRewardDefinition,
  context: RewardRollContext,
): ResolvedReward[] {
  if (context.firstClear) return [];
  return resolveEntries(definition.repeatClear, definition, context.difficulty, "campaign-repeat");
}

function rollAmount(min: number, max: number, random: RandomSource): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return lo + Math.floor(random.next() * (hi - lo + 1));
}

function materializeDropEntry(
  picked: DropTableEntry,
  random: RandomSource,
  quantityScale: number,
): RewardEntry | null {
  const e = picked.entry;
  switch (e.kind) {
    case "nothing":
      return null;
    case "collectible":
      return { kind: "collectible", collectibleType: e.collectibleType, collectibleId: e.collectibleId };
    case "chest":
      return { kind: "chest", chestId: e.chestId, amount: rollAmount(e.minAmount, e.maxAmount, random) };
    case "consumable":
      return {
        kind: "consumable",
        consumableId: e.consumableId,
        amount: rollAmount(e.minAmount, e.maxAmount, random),
      };
    case "currency":
      return {
        kind: "currency",
        currencyId: e.currencyId,
        amount: Math.max(1, Math.round(rollAmount(e.minAmount, e.maxAmount, random) * quantityScale)),
      };
    case "material":
      return {
        kind: "material",
        materialId: e.materialId,
        amount: Math.max(1, Math.round(rollAmount(e.minAmount, e.maxAmount, random) * quantityScale)),
      };
    case "shipFragment":
      return {
        kind: "shipFragment",
        shipId: e.shipId,
        amount: Math.max(1, Math.round(rollAmount(e.minAmount, e.maxAmount, random) * quantityScale)),
      };
  }
}

/**
 * Rolls one weighted drop group. Each of `group.rolls` draws picks one
 * entry by weight; "nothing" entries make a miss possible. Exclusive
 * groups stop after their first non-"nothing" hit.
 */
export function rollDropTable(
  groups: DropTableGroup[],
  random: RandomSource,
  quantityScale = 1,
  source: RewardSource = "campaign-drop",
): ResolvedReward[] {
  const results: ResolvedReward[] = [];
  for (const group of groups) {
    let hit = false;
    for (let roll = 0; roll < group.rolls; roll += 1) {
      if (group.exclusive && hit) break;
      const totalWeight = group.entries.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
      if (totalWeight <= 0) continue;
      let ticket = random.next() * totalWeight;
      let picked: DropTableEntry | null = null;
      for (const entry of group.entries) {
        ticket -= Math.max(0, entry.weight);
        if (ticket < 0) {
          picked = entry;
          break;
        }
      }
      if (!picked) picked = group.entries[group.entries.length - 1] ?? null;
      if (!picked) continue;
      const materialized = materializeDropEntry(picked, random, quantityScale);
      if (materialized) {
        hit = true;
        results.push({ entry: materialized, source, rarity: picked.rarity });
      }
    }
  }
  return results;
}

/**
 * Full stage resolution: guaranteed + (first-clear XOR repeat-clear) +
 * optional weighted drops, in one bundle. First-clear status must come from
 * the campaign completion state (see completeCampaignStage) — this function
 * trusts the flag it is given and stays pure.
 */
export function resolveStageRewards(
  definition: StageRewardDefinition,
  context: RewardRollContext,
): RewardBundle {
  const rewards: ResolvedReward[] = [
    ...resolveGuaranteedRewards(definition, context),
    ...resolveFirstClearRewards(definition, context),
    ...resolveRepeatClearRewards(definition, context),
    ...rollDropTable(
      definition.dropTable,
      context.random,
      DIFFICULTY_QUANTITY_MULTIPLIER[context.difficulty],
      "campaign-drop",
    ),
  ];
  return {
    stageId: definition.stageId,
    source: context.firstClear ? "campaign-first-clear" : "campaign-repeat",
    firstClear: context.firstClear,
    rewards,
  };
}
