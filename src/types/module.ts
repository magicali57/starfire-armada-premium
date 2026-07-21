import type { LoadoutStatContributions } from "./loadout";
import type { ShipRarity } from "./ship";

export type ModuleSlot = "core" | "plating" | "system";

export interface ModuleProgress {
  level: number;
  rank?: number;
  xp?: number;
}

export interface ModuleDefinition {
  id: string;
  name: string;
  slot: ModuleSlot;
  rarity: ShipRarity;
  description: string;
  /** Key into `MODULE_ART` (data/assetRegistry.ts) — never a hard-coded path. */
  artKey: string;
  /** Provisional base Power at level 1 — see calculateModulePower in data/loadout.ts. */
  basePower: number;
  /** Provisional base stat contributions at level 1, scaled the same way as basePower. */
  statContributions: LoadoutStatContributions;
}
