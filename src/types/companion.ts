import type { LoadoutStatContributions } from "./loadout";
import type { ShipRarity } from "./ship";

// Companions reuse `ShipRarity` (common/rare/epic/legendary/mythic) rather
// than a second, incompatible rarity system — the same 5-tier scale already
// governs ships, and the Loadout reference itself shows companions/modules
// using the identical rarity vocabulary and color language ("Epic" in
// purple) as ships/rarity emblems elsewhere in the app.
export type CompanionRole = "Attack Support" | "Defense Support" | "Support" | "Utility Support";

export interface CompanionProgress {
  level: number;
  rank?: number;
  xp?: number;
}

export interface CompanionDefinition {
  id: string;
  name: string;
  rarity: ShipRarity;
  role: CompanionRole;
  description: string;
  /** Key into `COMPANION_ART` (data/assetRegistry.ts) — never a hard-coded path. */
  artKey: string;
  /** Provisional base Power at level 1 — see calculateCompanionPower in data/loadout.ts
   *  for how level/rarity scale this into a displayed Power value. */
  basePower: number;
  /** Provisional base stat contributions at level 1, scaled the same way as basePower. */
  statContributions: LoadoutStatContributions;
}
