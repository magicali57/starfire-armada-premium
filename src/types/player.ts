export type CurrencyId = "coins" | "crystals" | "energy";

export type CurrencyBalances = Record<CurrencyId, number>;

// Materials are a separate inventory from top-bar currencies (CurrencyId
// above) — they back crafting/upgrade costs (Ship Alloy and Companion Data)
// rather than
// the shared HubHeader resource pills. "shipAlloy" is the only material
// with a real gameplay use so far (Ship Level Up's per-level cost, see
// systems/shipStats.ts's calculateShipAlloyCost). Its starting balance
// (data/player.ts) is temporary prototype economy data until missions,
// rewards, Salvage Run, Inventory, and Shop supply real materials — see
// docs/handoffs/ship-upgrade/SHIP_LEVEL_UP_COMPLETION_REPORT.md.
// "universalShards" is the canonical universal-fragment material from the
// economy catalog (docs/economy/STARFIRE_ARMADA_COMPLETE_ECONOMY_DOCUMENT.md,
// id `universalShards`) — it fills ship-fragment shortages during Star Rank
// up, never more than the exact shortage. There is deliberately only this
// one universal-fragment id.
// "abilityCores" is the canonical ship-ability upgrade material from the
// economy catalog (id `abilityCores`, "Ability Cores") — used together with
// Credits by Ship Abilities upgrades. Deliberately the only ability-upgrade
// material id.
export type MaterialId =
  | "shipAlloy"
  | "companionData"
  | "moduleParts"
  | "weaponParts"
  | "universalShards"
  | "abilityCores";

export type MaterialBalances = Record<MaterialId, number>;

// Bumped from 1 (schema history predates this file) to 3 when Ship Level Up
// added `materials`, then to 4 when Loadout Manager added `activeLoadout`
// and companion/module ownership+progression below, then to 5 when
// Companion Upgrade added Companion Data and normalized companion levels,
// and to 6 when Module Upgrade added Module Parts, and to 8 when Ship Star
// Rank added Universal Shards (materials.universalShards) and per-ship
// fragment balances (shipFragments), and to 9 when Ship Abilities added
// Ability Cores (materials.abilityCores) and per-ship ability levels
// (shipAbilityLevels).
// Each version's saves
// are migrated forward in store/playerStore.tsx's loadPlayerState — not
// discarded — by merging in defaults for whatever fields that version
// introduced; only saves that are missing/unparseable/from an unrecognized
// future version fall back to DEFAULT_PLAYER_STATE.
export const SAVE_SCHEMA_VERSION = 9;

export interface PlayerState {
  playerId: string;
  displayName: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  currencies: CurrencyBalances;
  /** Crafting/upgrade material balances — separate from `currencies`. See MaterialId. */
  materials: MaterialBalances;

  /** Ships the player owns and can select/upgrade. Only Rapid-Fire by default. */
  ownedShipIds: string[];
  selectedShipId: string;
  /** Per-ship level/xp/stars/weapon-level, keyed by ship id. Only present for owned ships.
   *  `stars` here is the ONE authoritative Star Rank value — never duplicated
   *  in another state system. */
  shipProgress: Record<string, import("./ship").ShipProgress>;
  /** Ship-specific fragment balances, keyed by ship id (the project's
   *  per-<shipId> record convention — one fragment pool per ship, used by
   *  Star Rank). Missing key = 0 owned. Schema v8+. */
  shipFragments: Record<string, number>;
  /** Per-ship ability levels (signature/passive/calamity), keyed by ship id.
   *  The ONLY persistent ability-progression store — static ability
   *  definitions live in systems/shipAbilities.ts, never duplicated here.
   *  Missing key = all abilities at Level 1. Schema v9+. */
  shipAbilityLevels: Record<string, import("@/systems/shipAbilities").ShipAbilityLevels>;

  /** Companion + module loadout (Loadout Manager, schema v4+). The equipped
   *  ship itself is NOT duplicated here — it stays authoritative through
   *  `selectedShipId` above. See types/loadout.ts's PlayerLoadout. */
  activeLoadout: import("./loadout").PlayerLoadout;
  /** Companions/modules the player owns — prototype ownership model until a
   *  real Companion/Module Roster and reward sources exist (see
   *  docs/handoffs/loadout/LOADOUT_MANAGER_COMPLETION_REPORT.md). */
  ownedCompanionIds: string[];
  ownedModuleIds: string[];
  /** Keyed by companion/module id. Intentionally NOT coupled to ship
   *  progression (shipProgress above) — a separate progression axis. */
  companionProgress: Record<string, import("./companion").CompanionProgress>;
  moduleProgress: Record<string, import("./module").ModuleProgress>;
  ownedWeaponIds: string[];
  equippedWeaponId: string;
  weaponProgress: Record<string, import("./weapon").WeaponProgress>;

  currentChapterId: string;
  currentStageId: string;
  highestClearedStageId: string | null;

  lastUpdatedAt: number;
  saveSchemaVersion: number;
}
