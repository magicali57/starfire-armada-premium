import type { ChestId, DropTableGroup } from "@/types";

// Typed reward tables for the three canonical reward containers
// (chestBasic / chestRare / chestEpic). Chests are awarded UNOPENED into
// PlayerState.chests; nothing auto-opens them — a future Chest Open /
// Reward Reveal flow will roll these tables through the same
// rollDropTable helper the stage drops use. Provisional balance values,
// like the rest of the prototype economy.

export const CHEST_REWARD_TABLES: Record<ChestId, DropTableGroup[]> = {
  chestBasic: [
    {
      id: "chestBasic-main",
      rolls: 2,
      entries: [
        { weight: 40, rarity: "common", entry: { kind: "currency", currencyId: "coins", minAmount: 300, maxAmount: 700 } },
        { weight: 25, rarity: "common", entry: { kind: "material", materialId: "shipAlloy", minAmount: 10, maxAmount: 25 } },
        { weight: 15, rarity: "common", entry: { kind: "material", materialId: "moduleParts", minAmount: 4, maxAmount: 10 } },
        { weight: 15, rarity: "common", entry: { kind: "material", materialId: "weaponParts", minAmount: 4, maxAmount: 10 } },
        { weight: 5, rarity: "rare", entry: { kind: "material", materialId: "universalShards", minAmount: 2, maxAmount: 5 } },
      ],
    },
  ],
  chestRare: [
    {
      id: "chestRare-main",
      rolls: 3,
      entries: [
        { weight: 30, rarity: "rare", entry: { kind: "currency", currencyId: "coins", minAmount: 800, maxAmount: 1600 } },
        { weight: 20, rarity: "rare", entry: { kind: "material", materialId: "shipAlloy", minAmount: 25, maxAmount: 50 } },
        { weight: 15, rarity: "rare", entry: { kind: "material", materialId: "companionData", minAmount: 8, maxAmount: 18 } },
        { weight: 15, rarity: "rare", entry: { kind: "material", materialId: "abilityCores", minAmount: 3, maxAmount: 7 } },
        { weight: 12, rarity: "rare", entry: { kind: "material", materialId: "universalShards", minAmount: 4, maxAmount: 9 } },
        { weight: 8, rarity: "epic", entry: { kind: "material", materialId: "companionShards", minAmount: 4, maxAmount: 8 } },
      ],
    },
  ],
  chestEpic: [
    {
      id: "chestEpic-main",
      rolls: 3,
      entries: [
        { weight: 25, rarity: "epic", entry: { kind: "currency", currencyId: "coins", minAmount: 2000, maxAmount: 4000 } },
        { weight: 20, rarity: "epic", entry: { kind: "material", materialId: "universalShards", minAmount: 8, maxAmount: 16 } },
        { weight: 20, rarity: "epic", entry: { kind: "material", materialId: "abilityCores", minAmount: 6, maxAmount: 12 } },
        { weight: 15, rarity: "epic", entry: { kind: "material", materialId: "companionShards", minAmount: 8, maxAmount: 15 } },
        { weight: 12, rarity: "epic", entry: { kind: "consumable", consumableId: "consumableDamageAmplifier", minAmount: 1, maxAmount: 2 } },
        { weight: 8, rarity: "legendary", entry: { kind: "currency", currencyId: "crystals", minAmount: 20, maxAmount: 50 } },
      ],
    },
  ],
};
