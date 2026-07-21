import type { PlayerState } from "@/types";
import { SAVE_SCHEMA_VERSION } from "@/types";
import { createDefaultShipProgress } from "@/systems/shipStats";
import { COMPANIONS } from "./companions";
import { MODULES } from "./modules";
import { DEFAULT_EQUIPPED_WEAPON_ID, DEFAULT_OWNED_WEAPON_IDS, DEFAULT_WEAPON_LEVELS } from "./weapons";
import {
  COMPANION_MAX_LEVEL,
  COMPANION_MIN_LEVEL,
} from "@/systems/companionProgression";
import { normalizePlayerProgression } from "@/systems/playerProgression";

const DEFAULT_SHIP_ID = "ship-01-rapid-fire";

// Reference-matched default active loadout (10_Loadout_Manager.png):
// Companion = Repair Drone (Epic, Lv.8); Core = Overdrive Matrix, Plating =
// Reactive Armor, System = Calamity Capacitor (all Epic, Lv.80). These ids
// and levels — along with COMPANIONS/MODULES' calibrated basePower/
// statContributions for exactly these four items — are what makes a fresh
// install's Loadout screen reproduce the reference's Power/stat numbers.
const DEFAULT_COMPANION_ID = "companion-repair-drone";
const DEFAULT_CORE_MODULE_ID = "module-overdrive-matrix";
const DEFAULT_PLATING_MODULE_ID = "module-reactive-armor";
const DEFAULT_SYSTEM_MODULE_ID = "module-calamity-capacitor";

export const DEFAULT_PLAYER_STATE: PlayerState = {
  playerId: "local-player",
  displayName: "Commander",
  level: 1,
  xp: 0,
  xpToNextLevel: 500,
  currencies: {
    coins: 5000,
    crystals: 300,
    energy: 100,
  },
  // Temporary prototype economy balance, matches the approved
  // 11_Ship_Level_Up.png reference's Ship Alloy balance exactly (1,240) so
  // the new install experience lines up with the reference. Real supply
  // (missions, rewards, Salvage Run, Inventory, Shop) is not built yet —
  // see MaterialId in types/player.ts.
  materials: {
    shipAlloy: 1240,
    // Prototype Companion Upgrade testing balance. Real sources (missions,
    // events, crates, Inventory and Shop) are intentionally not implemented
    // yet; the Upgrade screen's Source action explains that limitation.
    companionData: 120,
    // Prototype Module Upgrade balance, matching the approved structural
    // reference. Real earning sources remain outside this focused phase.
    moduleParts: 145,
    weaponParts: 71,
    // Prototype Star Rank testing balance for the canonical Universal Shards
    // material (economy catalog id `universalShards`). Real earning sources
    // (chests, events, Shop) are not built yet.
    universalShards: 40,
    // Prototype Ship Abilities testing balance for the canonical Ability
    // Cores material (economy catalog id `abilityCores`). Real earning
    // sources (chests, events, Shop) are not built yet.
    abilityCores: 24,
    // Companion Shards (battle reward foundation, schema v10). Accumulates
    // from rewards/duplicate conversions; no spender exists yet because
    // Companion Rank Up is postponed.
    companionShards: 0,
  },
  // Unopened reward chests + persistent pre-battle consumables (schema
  // v10). Fresh installs start empty; battle rewards fill these.
  chests: {
    chestBasic: 0,
    chestRare: 0,
    chestEpic: 0,
  },
  consumables: {
    consumableShieldCharge: 0,
    consumableRepairKit: 0,
    consumableDamageAmplifier: 0,
  },
  ownedShipIds: [DEFAULT_SHIP_ID],
  selectedShipId: DEFAULT_SHIP_ID,
  shipProgress: {
    [DEFAULT_SHIP_ID]: createDefaultShipProgress(DEFAULT_SHIP_ID),
  },
  // Prototype per-ship fragment balance (Star Rank). Real fragment sources
  // (Campaign rewards, chests, events, Shop) are intentionally not built yet
  // — the Star Rank screen's Find Fragments dialog discloses this.
  shipFragments: {
    [DEFAULT_SHIP_ID]: 36,
  },
  // Per-ship ability levels (Ship Abilities, schema v9). Missing ships
  // default to Level 1 everywhere via getShipAbilityLevel — this record
  // only needs entries once a player actually upgrades something, so a
  // fresh install starts empty.
  shipAbilityLevels: {},
  // PROTOTYPE OWNERSHIP NOTICE: every current companion/module definition is
  // owned by default because no Companion Roster, Module Inventory, or
  // reward/acquisition system exists yet to grant them individually — see
  // docs/handoffs/loadout/LOADOUT_MANAGER_COMPLETION_REPORT.md. This will be
  // replaced by real acquisition once those systems are built; ownership
  // must not be assumed to mean "unlocked through gameplay."
  activeLoadout: {
    companionId: DEFAULT_COMPANION_ID,
    coreModuleId: DEFAULT_CORE_MODULE_ID,
    platingModuleId: DEFAULT_PLATING_MODULE_ID,
    systemModuleId: DEFAULT_SYSTEM_MODULE_ID,
  },
  ownedCompanionIds: COMPANIONS.map((c) => c.id),
  ownedModuleIds: MODULES.map((m) => m.id),
  companionProgress: {
    [DEFAULT_COMPANION_ID]: { level: 8 },
  },
  moduleProgress: {
    [DEFAULT_CORE_MODULE_ID]: { level: 80 },
    [DEFAULT_PLATING_MODULE_ID]: { level: 80 },
    [DEFAULT_SYSTEM_MODULE_ID]: { level: 80 },
  },
  ownedWeaponIds: DEFAULT_OWNED_WEAPON_IDS,
  equippedWeaponId: DEFAULT_EQUIPPED_WEAPON_ID,
  weaponProgress: Object.fromEntries(Object.entries(DEFAULT_WEAPON_LEVELS).map(([id,level])=>[id,{level}])),
  currentChapterId: "chapter-01",
  currentStageId: "ch1-stage-1",
  highestClearedStageId: null,
  lastUpdatedAt: 0,
  saveSchemaVersion: SAVE_SCHEMA_VERSION,
};

const MIGRATABLE_SCHEMA_VERSIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export interface PlayerSaveLoadResult {
  state: PlayerState;
  shouldPersist: boolean;
  source: "fresh" | "current" | "migrated" | "fallback";
}

function mergePlayerWithDefaults(parsed: Partial<PlayerState>): PlayerState {
  return {
    ...DEFAULT_PLAYER_STATE,
    ...parsed,
    currencies: { ...DEFAULT_PLAYER_STATE.currencies, ...parsed.currencies },
    materials: { ...DEFAULT_PLAYER_STATE.materials, ...parsed.materials },
    shipProgress: { ...DEFAULT_PLAYER_STATE.shipProgress, ...parsed.shipProgress },
    activeLoadout: { ...DEFAULT_PLAYER_STATE.activeLoadout, ...parsed.activeLoadout },
    companionProgress: { ...DEFAULT_PLAYER_STATE.companionProgress, ...parsed.companionProgress },
    moduleProgress: { ...DEFAULT_PLAYER_STATE.moduleProgress, ...parsed.moduleProgress },
    weaponProgress: { ...DEFAULT_PLAYER_STATE.weaponProgress, ...parsed.weaponProgress },
    shipFragments: { ...DEFAULT_PLAYER_STATE.shipFragments, ...parsed.shipFragments },
    shipAbilityLevels: { ...DEFAULT_PLAYER_STATE.shipAbilityLevels, ...parsed.shipAbilityLevels },
    chests: { ...DEFAULT_PLAYER_STATE.chests, ...parsed.chests },
    consumables: { ...DEFAULT_PLAYER_STATE.consumables, ...parsed.consumables },
  };
}

/** Pure v2-v6 save normalization used by the store and verification suite.
 * The v4→v5 step is intentionally narrow: add Companion Data when absent,
 * map the exact legacy Repair Drone Level-60 fixture to Level 8, and clamp
 * every other invalid companion level into the authoritative 1–20 range.
 * The v5→v6 step only adds Module Parts when absent.
 * Rank, XP and every unrelated player field are preserved. */
export function migratePlayerState(parsedValue: unknown): PlayerSaveLoadResult {
  if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
    return { state: { ...DEFAULT_PLAYER_STATE }, shouldPersist: false, source: "fallback" };
  }

  const parsed = parsedValue as Partial<PlayerState>;
  const sourceVersion = parsed.saveSchemaVersion;
  if (
    typeof sourceVersion !== "number" ||
    !MIGRATABLE_SCHEMA_VERSIONS.includes(sourceVersion as (typeof MIGRATABLE_SCHEMA_VERSIONS)[number])
  ) {
    return { state: { ...DEFAULT_PLAYER_STATE }, shouldPersist: false, source: "fallback" };
  }

  const merged = mergePlayerWithDefaults(parsed);
  let normalizedProgress = false;
  const companionProgress = Object.fromEntries(
    Object.entries(merged.companionProgress).map(([companionId, progress]) => {
      const rawLevel = Number.isFinite(progress.level) ? Math.trunc(progress.level) : COMPANION_MIN_LEVEL;
      const level =
        sourceVersion === 4 && companionId === "companion-repair-drone" && rawLevel === 60
          ? 8
          : Math.min(COMPANION_MAX_LEVEL, Math.max(COMPANION_MIN_LEVEL, rawLevel));
      if (level !== progress.level) normalizedProgress = true;
      return [companionId, { ...progress, level }];
    }),
  );

  const missingCompanionData =
    !parsed.materials || typeof (parsed.materials as Partial<PlayerState["materials"]>).companionData !== "number";
  const missingModuleParts =
    !parsed.materials || typeof (parsed.materials as Partial<PlayerState["materials"]>).moduleParts !== "number";
  const missingWeaponParts = !parsed.materials || typeof (parsed.materials as Partial<PlayerState["materials"]>).weaponParts !== "number";
  const missingWeaponState = !Array.isArray(parsed.ownedWeaponIds) || typeof parsed.equippedWeaponId !== "string" || !parsed.weaponProgress;
  // v7→v8: Star Rank added Universal Shards + per-ship fragments. Backfilled
  // with defaults only when absent; every existing field (ship levels/stars,
  // Credits, Crystals, Energy, companions, modules, weapons, loadout,
  // equipped ship/weapon) passes through mergePlayerWithDefaults untouched.
  const missingUniversalShards =
    !parsed.materials || typeof (parsed.materials as Partial<PlayerState["materials"]>).universalShards !== "number";
  const missingShipFragments = !parsed.shipFragments || typeof parsed.shipFragments !== "object";
  // v8→v9: Ship Abilities added Ability Cores + per-ship ability levels
  // (existing owned ships simply default to Level 1 for every unlocked
  // ability via getShipAbilityLevel — no per-ship backfill entries needed).
  // Everything else passes through mergePlayerWithDefaults untouched.
  const missingAbilityCores =
    !parsed.materials || typeof (parsed.materials as Partial<PlayerState["materials"]>).abilityCores !== "number";
  const missingAbilityLevels = !parsed.shipAbilityLevels || typeof parsed.shipAbilityLevels !== "object";
  // v9→v10: battle reward foundation added Companion Shards, unopened chest
  // inventory, and pre-battle consumables — all backfilled with zeroed
  // defaults only when absent; every existing field passes through
  // mergePlayerWithDefaults untouched.
  const missingCompanionShards =
    !parsed.materials || typeof (parsed.materials as Partial<PlayerState["materials"]>).companionShards !== "number";
  const missingChests = !parsed.chests || typeof parsed.chests !== "object";
  const missingConsumables = !parsed.consumables || typeof parsed.consumables !== "object";
  // Player progression normalization (no schema bump needed — same fields):
  // re-sync the cached xpToNextLevel to the canonical curve in
  // systems/playerProgression.ts and roll any overflowing within-level XP
  // into derived levels. XP is preserved, level is derived, and historical
  // level-up milestone rewards are deliberately NOT granted retroactively.
  const progression = normalizePlayerProgression(merged);
  const state: PlayerState = {
    ...merged,
    level: progression.level,
    xp: progression.xp,
    xpToNextLevel: progression.xpToNextLevel,
    materials: {
      ...merged.materials,
      companionShards:
        typeof merged.materials.companionShards === "number"
          ? merged.materials.companionShards
          : DEFAULT_PLAYER_STATE.materials.companionShards,
      abilityCores:
        typeof merged.materials.abilityCores === "number"
          ? merged.materials.abilityCores
          : DEFAULT_PLAYER_STATE.materials.abilityCores,
      universalShards:
        typeof merged.materials.universalShards === "number"
          ? merged.materials.universalShards
          : DEFAULT_PLAYER_STATE.materials.universalShards,
      companionData:
        typeof merged.materials.companionData === "number"
          ? merged.materials.companionData
          : DEFAULT_PLAYER_STATE.materials.companionData,
      moduleParts:
        typeof merged.materials.moduleParts === "number"
          ? merged.materials.moduleParts
          : DEFAULT_PLAYER_STATE.materials.moduleParts,
      weaponParts: typeof merged.materials.weaponParts === "number" ? merged.materials.weaponParts : DEFAULT_PLAYER_STATE.materials.weaponParts,
    },
    companionProgress,
    saveSchemaVersion: SAVE_SCHEMA_VERSION,
  };

  const shouldPersist =
    sourceVersion !== SAVE_SCHEMA_VERSION || missingCompanionData || missingModuleParts || missingWeaponParts || missingWeaponState || missingUniversalShards || missingShipFragments || missingAbilityCores || missingAbilityLevels || missingCompanionShards || missingChests || missingConsumables || progression.changed || normalizedProgress;
  return {
    state,
    shouldPersist,
    source: shouldPersist ? "migrated" : "current",
  };
}

export function parsePlayerSave(raw: string | null): PlayerSaveLoadResult {
  if (!raw) return { state: { ...DEFAULT_PLAYER_STATE }, shouldPersist: false, source: "fresh" };
  try {
    return migratePlayerState(JSON.parse(raw) as unknown);
  } catch {
    return { state: { ...DEFAULT_PLAYER_STATE }, shouldPersist: false, source: "fallback" };
  }
}
