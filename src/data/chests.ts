import type { ChestId, PlayerState, RewardRarity } from "@/types";
import { CHEST_REWARD_TABLES } from "@/data/chestRewards";
import { CHEST_LABEL } from "@/data/playerProfile";
import { REWARD_CHEST } from "@/data/assetRegistry";

// Chest Vault presentation helper — the ONE place that describes the three
// canonical chest containers for the Chest Opening screen. Never resolves
// chest contents (that is openChestTransaction's job, in
// systems/rewards/openChest.ts) — this module only describes what a chest
// IS (label, rarity treatment, artwork, truthful content categories), not
// what a specific opening rolled.

export const CHEST_IDS: readonly ChestId[] = ["chestBasic", "chestRare", "chestEpic"];

/** Canonical chest → RewardRarity, reused for the shared rarity-motion
 *  vocabulary (styles/motion.css's `.motion-glow-*`) and rarity border
 *  colors. Basic Chest maps to "common" — the plainest, unpulsed tier —
 *  since the shared RewardRarity type has no separate "basic" value; this
 *  does not change or reinterpret any reward's own rarity. */
export const CHEST_RARITY: Record<ChestId, RewardRarity> = {
  chestBasic: "common",
  chestRare: "rare",
  chestEpic: "epic",
};

const CHEST_ART_TIER: Record<ChestId, "basic" | "rare" | "epic"> = {
  chestBasic: "basic",
  chestRare: "rare",
  chestEpic: "epic",
};

/** Existing approved chest artwork (assetRegistry.ts's REWARD_CHEST) —
 *  never generates new art. There is no dedicated "opening" art asset, so
 *  the same static chest image is reused for the vault card and the
 *  cinematic sequence, per the task's fallback instruction. */
export function getChestArt(chestId: ChestId): string {
  return REWARD_CHEST[CHEST_ART_TIER[chestId]];
}

/**
 * Truthful, weight-free content categories derived directly from
 * CHEST_REWARD_TABLES (never a hand-maintained second list, never an
 * expected-value calculation, never exposes weights). Used only for the
 * Chest Vault card's short "contents preview".
 */
export function getChestContentsSummary(chestId: ChestId): string[] {
  const categories = new Set<string>();
  for (const group of CHEST_REWARD_TABLES[chestId]) {
    for (const dropEntry of group.entries) {
      const entry = dropEntry.entry;
      switch (entry.kind) {
        case "currency":
          categories.add(entry.currencyId === "crystals" ? "Rare Currency Chance" : "Credits");
          break;
        case "material":
          categories.add("Progression Materials");
          break;
        case "consumable":
          categories.add("Consumables");
          break;
        case "shipFragment":
          categories.add("Ship Fragments");
          break;
        case "collectible":
          categories.add("Possible Collectible");
          break;
        case "chest":
          categories.add("Bonus Chest");
          break;
        case "nothing":
          break;
      }
    }
  }
  return Array.from(categories);
}

export interface ChestVaultCard {
  chestId: ChestId;
  displayName: string;
  rarity: RewardRarity;
  art: string;
  ownedCount: number;
  contentsSummary: string[];
}

/** The Chest Vault screen's whole view model — owned counts read live from
 *  PlayerState (never fabricated when a count is 0). */
export function getChestVaultViewModel(player: PlayerState): ChestVaultCard[] {
  return CHEST_IDS.map((chestId) => ({
    chestId,
    displayName: CHEST_LABEL[chestId],
    rarity: CHEST_RARITY[chestId],
    art: getChestArt(chestId),
    ownedCount: player.chests[chestId] ?? 0,
    contentsSummary: getChestContentsSummary(chestId),
  }));
}
