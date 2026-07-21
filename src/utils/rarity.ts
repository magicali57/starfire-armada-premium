import type { ShipRarity } from "@/types";

export const RARITY_LABEL: Record<ShipRarity, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
  mythic: "Mythic",
};

export const RARITY_ORDER: ShipRarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export function rarityColorVar(rarity: ShipRarity): string {
  return `var(--color-rarity-${rarity})`;
}
