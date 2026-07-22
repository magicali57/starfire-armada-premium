import type { ChestOpeningResult } from "@/systems/rewards/openChest";
import { toRewardDisplayRows, type RewardDisplayRow } from "@/data/rewardDisplay";
import type { ResolvedReward, RewardEntry } from "@/types";

// Chest Opening's own reveal-row builder — deliberately separate from
// data/rewardReveal.ts (the battle Reward Reveal overlay's queue builder)
// per the task's instruction to avoid nesting that overlay inside Chest
// Opening. Reuses the same underlying presentation helper
// (rewardDisplay.ts's toRewardDisplayRows) instead of a second reward
// catalog. Purely presentational — reads an already-successful
// ChestOpeningResult, never re-applies or re-resolves anything.

export interface ChestRevealRow {
  row: RewardDisplayRow;
  /** A genuinely new collectible (never a duplicate). */
  isNew: boolean;
  /** This row includes at least one duplicate-collectible conversion. */
  isDuplicateConversion: boolean;
}

/** Same stack-grouping key rewardDisplay.ts's toRewardDisplayRows uses
 *  internally — duplicated here (not exported there) purely to match
 *  aggregated rows back to their contributing entries for the NEW/
 *  duplicate flags below; never used to compute or alter any amount. */
function stackKey(entry: RewardEntry): string {
  switch (entry.kind) {
    case "currency":
      return `currency:${entry.currencyId}`;
    case "material":
      return `material:${entry.materialId}`;
    case "chest":
      return `chest:${entry.chestId}`;
    case "consumable":
      return `consumable:${entry.consumableId}`;
    case "shipFragment":
      return `shipFragment:${entry.shipId}`;
    case "playerXp":
      return "playerXp";
    case "collectible":
      return `collectible:${entry.collectibleId}`;
  }
}

/**
 * Builds display rows for an already-successful ChestOpeningResult.
 * Zips `resolvedRewards` (the pre-conversion table roll, carrying
 * rarity/provenance) with `appliedRewards` (the exact entries
 * applyRewardBundle actually committed, post-duplicate-conversion) —
 * openChestTransaction guarantees these two arrays are the same length
 * and in the same order (chests never grant Player XP, so
 * applyRewardBundle never appends extra level-up entries here). A row is
 * flagged as a duplicate conversion if ANY of its contributing entries
 * came from converting a duplicate collectible — in the rare case where a
 * chest rolls both a direct material grant and an unrelated duplicate
 * conversion that stack into the same aggregated row, the row is still
 * truthfully labeled (some of that amount did come from a conversion),
 * just not split out separately.
 */
export function getChestRevealRows(result: ChestOpeningResult): ChestRevealRow[] {
  if (!result.success) return [];

  const zipped: ResolvedReward[] = result.appliedRewards.map((entry, index) => ({
    entry,
    source: "chest",
    rarity: result.resolvedRewards[index]?.rarity ?? "common",
  }));

  const newKeys = new Set(result.newCollectibles.map(stackKey));
  const duplicateKeys = new Set<string>();
  result.appliedRewards.forEach((entry, index) => {
    const original = result.resolvedRewards[index]?.entry;
    if (original?.kind === "collectible" && entry.kind !== "collectible") {
      duplicateKeys.add(stackKey(entry));
    }
  });

  const rows = toRewardDisplayRows(zipped);
  return rows.map((row) => {
    const key =
      row.kind === "collectible"
        ? `collectible:${row.itemId}`
        : row.kind === "currency"
          ? `currency:${row.itemId}`
          : row.kind === "material"
            ? `material:${row.itemId}`
            : row.kind === "chest"
              ? `chest:${row.itemId}`
              : row.kind === "consumable"
                ? `consumable:${row.itemId}`
                : row.kind === "shipFragment"
                  ? `shipFragment:${row.itemId}`
                  : "playerXp";
    return {
      row,
      isNew: newKeys.has(key),
      isDuplicateConversion: duplicateKeys.has(key),
    };
  });
}
