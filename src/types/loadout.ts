// Loadout Manager types (11_Ship_Level_Up.png's sibling reference,
// 10_Loadout_Manager.png). The equipped ship itself is NOT part of this
// model — it stays authoritative through `PlayerState.selectedShipId`
// (see player.ts) so there is exactly one source of truth for "which ship
// is equipped," shared by Fleet Roster, Ship Detail, Ship Level Up, and
// this screen. `PlayerLoadout` only covers the three module slots plus the
// companion slot.

export interface PlayerLoadout {
  companionId: string | null;
  coreModuleId: string | null;
  platingModuleId: string | null;
  systemModuleId: string | null;
}

// Bonus stat contributions shown on the Loadout screen's "Loadout Stat
// Contribution" panel. These are additive bonuses from companion/module
// items only — separate from, and not merged into, a ship's own six core
// stats (ShipStatBlock in types/ship.ts). Not wired into real gameplay
// damage/health calculations in this phase (see LOADOUT_MANAGER_COMPLETION_REPORT.md).
export interface LoadoutStatContributions {
  attack: number;
  health: number;
  criticalRate: number;
  criticalDamage: number;
  armor: number;
  energyRegen: number;
}

export const EMPTY_LOADOUT_STAT_CONTRIBUTIONS: LoadoutStatContributions = {
  attack: 0,
  health: 0,
  criticalRate: 0,
  criticalDamage: 0,
  armor: 0,
  energyRegen: 0,
};

export type LoadoutSlotId = "ship" | "companion" | "core" | "plating" | "system";

export type LoadoutFailureReason =
  | "invalid-companion"
  | "companion-not-owned"
  | "invalid-core-module"
  | "core-module-not-owned"
  | "invalid-plating-module"
  | "plating-module-not-owned"
  | "invalid-system-module"
  | "system-module-not-owned"
  | "invalid-slot"
  | "busy";

export interface SaveLoadoutResult {
  success: boolean;
  reason?: LoadoutFailureReason;
  loadout?: PlayerLoadout;
}
