import type { PlayerState } from "@/types";
import { SAVE_SCHEMA_VERSION } from "@/types";
import { SHIP_MAX_LEVEL, createDefaultShipProgress } from "@/systems/shipStats";
import { SHIP_MAX_STAR_RANK } from "@/systems/shipStarRank";
import {
  SHIP_ABILITY_MAX_LEVEL,
  SHIP_ABILITY_MIN_LEVEL,
} from "@/systems/shipAbilities";
import { MODULE_MAX_LEVEL, MODULE_MIN_LEVEL } from "@/systems/moduleProgression";
import { getShipById } from "./ships";
import { COMPANIONS, getCompanionById } from "./companions";
import { MODULES, getModuleById } from "./modules";
import {
  DEFAULT_EQUIPPED_WEAPON_ID,
  DEFAULT_OWNED_WEAPON_IDS,
  DEFAULT_WEAPON_LEVELS,
  getWeaponById,
} from "./weapons";
import {
  COMPANION_MAX_LEVEL,
  COMPANION_MIN_LEVEL,
} from "@/systems/companionProgression";
import { normalizePlayerProgression } from "@/systems/playerProgression";
import { DEFAULT_AVATAR_ID, PROFILE_AVATAR_IDS } from "./playerProfile";

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
  // Fresh installs and legacy saves migrated forward both default to the
  // first built-in avatar (schema v11) — see PROFILE_AVATARS in
  // data/playerProfile.ts.
  avatarId: DEFAULT_AVATAR_ID,
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

const MIGRATABLE_SCHEMA_VERSIONS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

export type SaveRecoveryReason = "unreadable-json" | "invalid-shape" | "unsupported-version";

export interface PlayerSaveLoadResult {
  state: PlayerState;
  shouldPersist: boolean;
  source: "fresh" | "current" | "migrated" | "fallback";
  /** Typed reason when source === "fallback" (whole save unrecoverable). */
  recoveryReason?: SaveRecoveryReason;
  /** Human-readable list of field repairs normalization performed (empty on
   *  a clean load). Diagnostic only — never affects behavior. */
  repairs: string[];
}

// ---------------------------------------------------------------------------
// Canonical save normalization — validates/repairs individual fields so one
// malformed value never resets the whole save. Clearly invalid values are
// clamped or replaced with safe defaults (never invented into other IDs);
// every repair is reported. Runs inside migratePlayerState on EVERY load,
// so normalization is deterministic and idempotent by construction (a
// normalized save re-normalizes to itself).
// ---------------------------------------------------------------------------

function sanitizeBalance(value: unknown, fallback: number, repairs: string[], label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    repairs.push(`${label}: invalid → ${fallback}`);
    return fallback;
  }
  const truncated = Math.trunc(value);
  if (truncated < 0) {
    repairs.push(`${label}: negative → 0`);
    return 0;
  }
  return truncated;
}

function clampLevel(
  value: unknown,
  min: number,
  max: number,
  repairs: string[],
  label: string,
): number {
  const raw = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : min;
  const clamped = Math.min(max, Math.max(min, raw));
  if (clamped !== value) repairs.push(`${label}: ${String(value)} → ${clamped}`);
  return clamped;
}

function dedupeKnown(
  ids: unknown,
  exists: (id: string) => boolean,
  fallback: string[],
  repairs: string[],
  label: string,
): string[] {
  if (!Array.isArray(ids)) {
    repairs.push(`${label}: invalid → defaults`);
    return [...fallback];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (typeof id !== "string" || !exists(id)) {
      repairs.push(`${label}: dropped unknown entry ${String(id)}`);
      continue;
    }
    if (seen.has(id)) {
      repairs.push(`${label}: dropped duplicate ${id}`);
      continue;
    }
    seen.add(id);
    result.push(id);
  }
  if (result.length === 0) {
    repairs.push(`${label}: empty → defaults`);
    return [...fallback];
  }
  return result;
}

/** Field-level validation/repair of an already-merged state. Preserves all
 *  valid progression; repairs only what is genuinely invalid. */
export function normalizePlayerSave(input: PlayerState): { state: PlayerState; repairs: string[] } {
  const repairs: string[] = [];
  const s = input;

  // Balances: reject NaN/Infinity, prevent negatives.
  const currencies = Object.fromEntries(
    Object.entries(DEFAULT_PLAYER_STATE.currencies).map(([id, def]) => [
      id,
      sanitizeBalance((s.currencies as Record<string, unknown>)[id], def, repairs, `currencies.${id}`),
    ]),
  ) as PlayerState["currencies"];
  const materials = Object.fromEntries(
    Object.entries(DEFAULT_PLAYER_STATE.materials).map(([id, def]) => [
      id,
      sanitizeBalance((s.materials as Record<string, unknown>)[id], def, repairs, `materials.${id}`),
    ]),
  ) as PlayerState["materials"];
  const chests = Object.fromEntries(
    Object.entries(DEFAULT_PLAYER_STATE.chests).map(([id]) => [
      id,
      sanitizeBalance((s.chests as Record<string, unknown>)[id], 0, repairs, `chests.${id}`),
    ]),
  ) as PlayerState["chests"];
  const consumables = Object.fromEntries(
    Object.entries(DEFAULT_PLAYER_STATE.consumables).map(([id]) => [
      id,
      sanitizeBalance((s.consumables as Record<string, unknown>)[id], 0, repairs, `consumables.${id}`),
    ]),
  ) as PlayerState["consumables"];

  // Owned collections: dedupe + drop unknown ids; never left empty.
  const ownedShipIds = dedupeKnown(s.ownedShipIds, (id) => !!getShipById(id), [DEFAULT_SHIP_ID], repairs, "ownedShipIds");
  const ownedCompanionIds = dedupeKnown(s.ownedCompanionIds, (id) => !!getCompanionById(id), COMPANIONS.map((c) => c.id), repairs, "ownedCompanionIds");
  const ownedModuleIds = dedupeKnown(s.ownedModuleIds, (id) => !!getModuleById(id), MODULES.map((m) => m.id), repairs, "ownedModuleIds");
  const ownedWeaponIds = dedupeKnown(s.ownedWeaponIds, (id) => !!getWeaponById(id), DEFAULT_OWNED_WEAPON_IDS, repairs, "ownedWeaponIds");

  // Equipped IDs must reference owned, existing content; fall back safely.
  // Profile avatar: must be one of the real built-in options (schema v11).
  let avatarId = s.avatarId;
  if (typeof avatarId !== "string" || !PROFILE_AVATAR_IDS.has(avatarId)) {
    repairs.push(`avatarId: ${String(avatarId)} → ${DEFAULT_AVATAR_ID}`);
    avatarId = DEFAULT_AVATAR_ID;
  }

  let selectedShipId = s.selectedShipId;
  if (typeof selectedShipId !== "string" || !ownedShipIds.includes(selectedShipId)) {
    repairs.push(`selectedShipId: ${String(selectedShipId)} → ${ownedShipIds[0]}`);
    selectedShipId = ownedShipIds[0];
  }
  let equippedWeaponId = s.equippedWeaponId;
  if (typeof equippedWeaponId !== "string" || !ownedWeaponIds.includes(equippedWeaponId)) {
    const fallback = ownedWeaponIds.includes(DEFAULT_EQUIPPED_WEAPON_ID)
      ? DEFAULT_EQUIPPED_WEAPON_ID
      : ownedWeaponIds[0];
    repairs.push(`equippedWeaponId: ${String(equippedWeaponId)} → ${fallback}`);
    equippedWeaponId = fallback;
  }
  // Loadout slots may legitimately be null (empty slot) — only non-null
  // values referencing unknown/unowned content are repaired.
  const loadout = { ...s.activeLoadout };
  if (loadout.companionId !== null && !ownedCompanionIds.includes(loadout.companionId)) {
    repairs.push(`activeLoadout.companionId: ${String(loadout.companionId)} → default`);
    loadout.companionId = DEFAULT_COMPANION_ID;
  }
  for (const [slot, fallback] of [
    ["coreModuleId", DEFAULT_CORE_MODULE_ID],
    ["platingModuleId", DEFAULT_PLATING_MODULE_ID],
    ["systemModuleId", DEFAULT_SYSTEM_MODULE_ID],
  ] as const) {
    const value = loadout[slot];
    if (value !== null && !ownedModuleIds.includes(value)) {
      repairs.push(`activeLoadout.${slot}: ${String(value)} → default`);
      loadout[slot] = fallback;
    }
  }

  // Per-ship records: drop unknown ship keys, clamp progression ranges.
  const shipProgress: PlayerState["shipProgress"] = {};
  for (const [shipId, progress] of Object.entries(s.shipProgress ?? {})) {
    if (!getShipById(shipId)) {
      repairs.push(`shipProgress: dropped unknown ship ${shipId}`);
      continue;
    }
    shipProgress[shipId] = {
      ...createDefaultShipProgress(shipId),
      ...progress,
      level: clampLevel(progress?.level, 1, SHIP_MAX_LEVEL, repairs, `shipProgress.${shipId}.level`),
      xp: sanitizeBalance(progress?.xp, 0, repairs, `shipProgress.${shipId}.xp`),
      stars: clampLevel(progress?.stars, 0, SHIP_MAX_STAR_RANK, repairs, `shipProgress.${shipId}.stars`),
      weaponLevel: clampLevel(progress?.weaponLevel, 1, 5, repairs, `shipProgress.${shipId}.weaponLevel`) as 1 | 2 | 3 | 4 | 5,
    };
  }
  const shipFragments: PlayerState["shipFragments"] = {};
  for (const [shipId, amount] of Object.entries(s.shipFragments ?? {})) {
    if (!getShipById(shipId)) {
      repairs.push(`shipFragments: dropped unknown ship ${shipId}`);
      continue;
    }
    shipFragments[shipId] = sanitizeBalance(amount, 0, repairs, `shipFragments.${shipId}`);
  }
  const shipAbilityLevels: PlayerState["shipAbilityLevels"] = {};
  for (const [shipId, levels] of Object.entries(s.shipAbilityLevels ?? {})) {
    if (!getShipById(shipId)) {
      repairs.push(`shipAbilityLevels: dropped unknown ship ${shipId}`);
      continue;
    }
    shipAbilityLevels[shipId] = {
      signature: clampLevel(levels?.signature, SHIP_ABILITY_MIN_LEVEL, SHIP_ABILITY_MAX_LEVEL, repairs, `shipAbilityLevels.${shipId}.signature`),
      passive: clampLevel(levels?.passive, SHIP_ABILITY_MIN_LEVEL, SHIP_ABILITY_MAX_LEVEL, repairs, `shipAbilityLevels.${shipId}.passive`),
      calamity: clampLevel(levels?.calamity, SHIP_ABILITY_MIN_LEVEL, SHIP_ABILITY_MAX_LEVEL, repairs, `shipAbilityLevels.${shipId}.calamity`),
    };
  }
  const weaponProgress: PlayerState["weaponProgress"] = {};
  for (const [weaponId, progress] of Object.entries(s.weaponProgress ?? {})) {
    const weapon = getWeaponById(weaponId);
    if (!weapon) {
      repairs.push(`weaponProgress: dropped unknown weapon ${weaponId}`);
      continue;
    }
    weaponProgress[weaponId] = {
      level: clampLevel(progress?.level, 1, weapon.maxLevel, repairs, `weaponProgress.${weaponId}.level`),
    };
  }
  const moduleProgress: PlayerState["moduleProgress"] = {};
  for (const [moduleId, progress] of Object.entries(s.moduleProgress ?? {})) {
    if (!getModuleById(moduleId)) {
      repairs.push(`moduleProgress: dropped unknown module ${moduleId}`);
      continue;
    }
    moduleProgress[moduleId] = {
      ...progress,
      level: clampLevel(progress?.level, MODULE_MIN_LEVEL, MODULE_MAX_LEVEL, repairs, `moduleProgress.${moduleId}.level`),
    };
  }
  const companionProgress: PlayerState["companionProgress"] = {};
  for (const [companionId, progress] of Object.entries(s.companionProgress ?? {})) {
    if (!getCompanionById(companionId)) {
      repairs.push(`companionProgress: dropped unknown companion ${companionId}`);
      continue;
    }
    companionProgress[companionId] = {
      ...progress,
      level: clampLevel(progress?.level, COMPANION_MIN_LEVEL, COMPANION_MAX_LEVEL, repairs, `companionProgress.${companionId}.level`),
    };
  }

  // Player XP/level: sanitize inputs, then the canonical progression
  // normalization keeps level/xp/xpToNextLevel synchronized to the curve.
  const safeXp = sanitizeBalance(s.xp, 0, repairs, "xp");
  const safeLevel = clampLevel(s.level, 1, 999, repairs, "level");
  const progression = normalizePlayerProgression({ level: safeLevel, xp: safeXp, xpToNextLevel: s.xpToNextLevel });
  if (progression.changed) repairs.push("progression: resynced to canonical XP curve");

  return {
    state: {
      ...s,
      avatarId,
      level: progression.level,
      xp: progression.xp,
      xpToNextLevel: progression.xpToNextLevel,
      currencies,
      materials,
      chests,
      consumables,
      ownedShipIds,
      ownedCompanionIds,
      ownedModuleIds,
      ownedWeaponIds,
      selectedShipId,
      equippedWeaponId,
      activeLoadout: loadout,
      shipProgress,
      shipFragments,
      shipAbilityLevels,
      weaponProgress,
      moduleProgress,
      companionProgress,
      highestClearedStageId:
        typeof s.highestClearedStageId === "string" || s.highestClearedStageId === null
          ? s.highestClearedStageId
          : null,
    },
    repairs,
  };
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
    return {
      state: { ...DEFAULT_PLAYER_STATE },
      shouldPersist: false,
      source: "fallback",
      recoveryReason: "invalid-shape",
      repairs: [],
    };
  }

  const parsed = parsedValue as Partial<PlayerState>;
  const sourceVersion = parsed.saveSchemaVersion;
  if (
    typeof sourceVersion !== "number" ||
    !MIGRATABLE_SCHEMA_VERSIONS.includes(sourceVersion as (typeof MIGRATABLE_SCHEMA_VERSIONS)[number])
  ) {
    return {
      state: { ...DEFAULT_PLAYER_STATE },
      shouldPersist: false,
      source: "fallback",
      recoveryReason: "unsupported-version",
      repairs: [],
    };
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
  // v10→v11: Player Profile added the selected built-in avatar id.
  // `displayName` already existed since schema 1 and needs no backfill.
  const missingAvatarId = typeof parsed.avatarId !== "string" || parsed.avatarId.length === 0;
  const state: PlayerState = {
    ...merged,
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

  // Canonical field-level normalization runs on EVERY load (current saves
  // included) — this is where XP/level resync to the canonical curve, all
  // balances/levels/equipped ids are validated, and single-field corruption
  // is repaired without touching unrelated progress. Deterministic and
  // idempotent: a normalized save re-normalizes with zero repairs.
  const normalized = normalizePlayerSave(state);

  const shouldPersist =
    sourceVersion !== SAVE_SCHEMA_VERSION || missingCompanionData || missingModuleParts || missingWeaponParts || missingWeaponState || missingUniversalShards || missingShipFragments || missingAbilityCores || missingAbilityLevels || missingCompanionShards || missingChests || missingConsumables || missingAvatarId || normalized.repairs.length > 0 || normalizedProgress;
  return {
    state: normalized.state,
    shouldPersist,
    source: shouldPersist ? "migrated" : "current",
    repairs: normalized.repairs,
  };
}

export function parsePlayerSave(raw: string | null): PlayerSaveLoadResult {
  if (!raw) {
    return { state: { ...DEFAULT_PLAYER_STATE }, shouldPersist: false, source: "fresh", repairs: [] };
  }
  try {
    return migratePlayerState(JSON.parse(raw) as unknown);
  } catch {
    return {
      state: { ...DEFAULT_PLAYER_STATE },
      shouldPersist: false,
      source: "fallback",
      recoveryReason: "unreadable-json",
      repairs: [],
    };
  }
}
