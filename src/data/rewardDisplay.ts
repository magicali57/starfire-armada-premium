import type { ChestId, CurrencyId, ResolvedReward, RewardEntry, RewardRarity } from "@/types";
import {
  COMPANION_ART,
  MATERIAL_ICON,
  MODULE_ART,
  REWARD_CHEST,
  RESOURCE_ICON,
  UTILITY_ICON,
  getShipMasterArt,
  getWeaponMasterArt,
} from "@/data/assetRegistry";
import { getShipById } from "@/data/ships";
import { getCompanionById } from "@/data/companions";
import { getModuleById } from "@/data/modules";
import { getWeaponById } from "@/data/weapons";
import { CHEST_LABEL, CONSUMABLE_LABEL, CURRENCY_LABEL, MATERIAL_LABEL } from "@/data/playerProfile";

// Canonical reward-row presentation helper — the ONE place any progression
// reward result (Player Level-Up today; Daily Rewards/missions/chest
// reveals in future work) converts into display rows. Reuses the existing
// label maps (playerProfile.ts) and icon registry (assetRegistry.ts) —
// never hard-codes a resource label or icon path inline in a screen/modal.
// Chests are shown unopened here — this module never resolves chest
// contents.

export interface RewardDisplayRow {
  /** Stable React key. */
  key: string;
  kind: RewardEntry["kind"];
  /** Canonical economy id (currencyId/materialId/chestId/… ). */
  itemId: string;
  displayName: string;
  /** Null for one-off collectible grants, which carry no quantity. */
  amount: number | null;
  icon: string;
  rarity: RewardRarity;
}

const CURRENCY_ICON: Record<CurrencyId, string> = {
  coins: RESOURCE_ICON.credits,
  crystals: RESOURCE_ICON.crystals,
  energy: RESOURCE_ICON.energy,
};

const CHEST_TIER: Record<ChestId, "basic" | "rare" | "epic" | "legendary"> = {
  chestBasic: "basic",
  chestRare: "rare",
  chestEpic: "epic",
};

/** Genuine collectible artwork — same per-type art registries the
 *  Fleet/Companions/Modules/Arsenal screens already use, keyed off each
 *  definition's own canonical `artKey` (companion/module) or dedicated
 *  resolver (ship/weapon). Falls back to the empty-slot placeholder for an
 *  unknown id rather than throwing. */
function resolveCollectibleIcon(entry: Extract<RewardEntry, { kind: "collectible" }>): string {
  switch (entry.collectibleType) {
    case "ship":
      return getShipMasterArt(entry.collectibleId) || UTILITY_ICON.emptySlot;
    case "companion": {
      const artKey = getCompanionById(entry.collectibleId)?.artKey;
      return (artKey && COMPANION_ART[artKey as keyof typeof COMPANION_ART]) || UTILITY_ICON.emptySlot;
    }
    case "module": {
      const artKey = getModuleById(entry.collectibleId)?.artKey;
      return (artKey && MODULE_ART[artKey as keyof typeof MODULE_ART]) || UTILITY_ICON.emptySlot;
    }
    case "weapon":
      return getWeaponMasterArt(entry.collectibleId) || UTILITY_ICON.emptySlot;
  }
}

function resolveIcon(entry: RewardEntry): string {
  switch (entry.kind) {
    case "currency":
      return CURRENCY_ICON[entry.currencyId];
    case "material":
      return (MATERIAL_ICON as Partial<Record<typeof entry.materialId, string>>)[entry.materialId] ?? UTILITY_ICON.emptySlot;
    case "chest":
      return REWARD_CHEST[CHEST_TIER[entry.chestId]] ?? UTILITY_ICON.emptySlot;
    case "shipFragment":
      return MATERIAL_ICON.shipFragment;
    case "collectible":
      return resolveCollectibleIcon(entry);
    case "consumable":
    case "playerXp":
      return UTILITY_ICON.emptySlot;
  }
}

function collectibleName(entry: Extract<RewardEntry, { kind: "collectible" }>): string {
  switch (entry.collectibleType) {
    case "ship":
      return getShipById(entry.collectibleId)?.name ?? entry.collectibleId;
    case "companion":
      return getCompanionById(entry.collectibleId)?.name ?? entry.collectibleId;
    case "module":
      return getModuleById(entry.collectibleId)?.name ?? entry.collectibleId;
    case "weapon":
      return getWeaponById(entry.collectibleId)?.name ?? entry.collectibleId;
  }
}

function describeEntry(entry: RewardEntry): { itemId: string; displayName: string; amount: number | null } {
  switch (entry.kind) {
    case "currency":
      return { itemId: entry.currencyId, displayName: CURRENCY_LABEL[entry.currencyId], amount: entry.amount };
    case "material":
      return { itemId: entry.materialId, displayName: MATERIAL_LABEL[entry.materialId], amount: entry.amount };
    case "chest":
      return { itemId: entry.chestId, displayName: CHEST_LABEL[entry.chestId], amount: entry.amount };
    case "consumable":
      return { itemId: entry.consumableId, displayName: CONSUMABLE_LABEL[entry.consumableId], amount: entry.amount };
    case "shipFragment":
      return {
        itemId: entry.shipId,
        displayName: `${getShipById(entry.shipId)?.name ?? "Ship"} Fragments`,
        amount: entry.amount,
      };
    case "playerXp":
      return { itemId: "playerXp", displayName: "Player XP", amount: entry.amount };
    case "collectible":
      return { itemId: entry.collectibleId, displayName: collectibleName(entry), amount: null };
  }
}

/** Stable grouping key for stackable entries; null (and collectibles) are
 *  never merged — each grant stays its own row. */
function stackKey(entry: RewardEntry): string | null {
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
      return null;
  }
}

/** Merges stackable reward entries that share the same canonical id (e.g.
 *  Credits granted by two crossed levels become one row), while keeping
 *  every collectible grant as its own distinct entry. */
export function aggregateRewardEntries(rewards: readonly ResolvedReward[]): ResolvedReward[] {
  const stacked = new Map<string, ResolvedReward>();
  const unstacked: ResolvedReward[] = [];
  for (const reward of rewards) {
    const key = stackKey(reward.entry);
    if (key === null) {
      unstacked.push(reward);
      continue;
    }
    const existing = stacked.get(key);
    if (!existing || !("amount" in existing.entry) || !("amount" in reward.entry)) {
      stacked.set(key, reward);
      continue;
    }
    stacked.set(key, {
      ...existing,
      entry: { ...existing.entry, amount: existing.entry.amount + reward.entry.amount } as RewardEntry,
    });
  }
  return [...stacked.values(), ...unstacked];
}

/** The one presentation helper: raw canonical rewards → display rows
 *  (aggregated, icon-resolved, label-resolved). */
export function toRewardDisplayRows(rewards: readonly ResolvedReward[]): RewardDisplayRow[] {
  return aggregateRewardEntries(rewards).map((reward, index) => {
    const { itemId, displayName, amount } = describeEntry(reward.entry);
    return {
      key: `${reward.entry.kind}-${itemId}-${index}`,
      kind: reward.entry.kind,
      itemId,
      displayName,
      amount,
      icon: resolveIcon(reward.entry),
      rarity: reward.rarity,
    };
  });
}
