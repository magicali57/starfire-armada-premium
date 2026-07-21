import { RESOURCE_ICON, STAT_ICON, getShipMasterArt } from "@/data/assetRegistry";
import { getCompanionById, COMPANIONS } from "@/data/companions";
import { getModuleById, getModulesBySlot } from "@/data/modules";
import { SHIPS, getShipById } from "@/data/ships";
import { calculatePowerScore, calculateShipStats, createDefaultShipProgress } from "@/systems/shipStats";
import type {
  CompanionDefinition,
  CompanionProgress,
  LoadoutFailureReason,
  LoadoutStatContributions,
  ModuleDefinition,
  ModuleProgress,
  ModuleSlot,
  PlayerLoadout,
  PlayerState,
  ShipDefinition,
  ShipProgress,
  ShipRarity,
} from "@/types";
import { EMPTY_LOADOUT_STAT_CONTRIBUTIONS } from "@/types";

// Pure calculation / view-model layer for the Loadout Manager
// (10_Loadout_Manager.png). No mutation lives here — the store
// (playerStore.tsx's saveActiveLoadout) owns the one write path, and this
// file is the single source of truth every screen/component reads through
// rather than recomputing power/stat numbers inline. See
// docs/handoffs/loadout/LOADOUT_MANAGER_COMPLETION_REPORT.md for how the
// provisional formulas below were calibrated.

// ---------------------------------------------------------------------------
// Provisional companion/module Power + stat scaling
// ---------------------------------------------------------------------------

// Reuses the same 5-tier rarity scale as ships (RARITY_COST_MULTIPLIER in
// systems/shipStats.ts) but with its own values — companion/module Power
// scaling is a different, independently-tunable curve, not a duplicate of
// the ship upgrade economy. Both this table and LEVEL_POWER_STEP are
// provisional/prototype tuning, same status as shipStats.ts's own
// BASE_UPGRADE_COST — adjust freely once a real companion/module design
// pass exists.
const RARITY_POWER_MULTIPLIER: Record<ShipRarity, number> = {
  common: 1,
  rare: 1.2,
  epic: 1.5,
  legendary: 2,
  mythic: 2.5,
};

const LEVEL_POWER_STEP = 0.01;

/** Scales a definition's level-1 base value (Power or any single stat
 *  contribution field) by the item's level and rarity. Reused identically
 *  for Power and every LoadoutStatContributions field so companions.ts/
 *  modules.ts only need to declare one set of "at level 1" numbers — see
 *  those files' headers for how the default loadout's four items were
 *  calibrated against 10_Loadout_Manager.png using this exact formula. */
function scaleByLevelAndRarity(base: number, level: number, rarity: ShipRarity): number {
  return base * (1 + Math.max(0, level) * LEVEL_POWER_STEP) * RARITY_POWER_MULTIPLIER[rarity];
}

export function getCompanionProgressOrDefault(
  companionId: string,
  player: Pick<PlayerState, "companionProgress">,
): CompanionProgress {
  return player.companionProgress[companionId] ?? { level: 1 };
}

export function getModuleProgressOrDefault(
  moduleId: string,
  player: Pick<PlayerState, "moduleProgress">,
): ModuleProgress {
  return player.moduleProgress[moduleId] ?? { level: 1 };
}

export function calculateCompanionPower(companion: CompanionDefinition, progress: CompanionProgress): number {
  return Math.round(scaleByLevelAndRarity(companion.basePower, progress.level, companion.rarity));
}

export function calculateModulePower(moduleDef: ModuleDefinition, progress: ModuleProgress): number {
  return calculateModulePowerAtLevel(moduleDef, progress.level);
}

export function calculateModulePowerAtLevel(moduleDef: ModuleDefinition, level: number): number {
  return Math.round(scaleByLevelAndRarity(moduleDef.basePower, level, moduleDef.rarity));
}

function scaleStatContributions(
  base: LoadoutStatContributions,
  level: number,
  rarity: ShipRarity,
): LoadoutStatContributions {
  return {
    attack: scaleByLevelAndRarity(base.attack, level, rarity),
    health: scaleByLevelAndRarity(base.health, level, rarity),
    criticalRate: scaleByLevelAndRarity(base.criticalRate, level, rarity),
    criticalDamage: scaleByLevelAndRarity(base.criticalDamage, level, rarity),
    armor: scaleByLevelAndRarity(base.armor, level, rarity),
    energyRegen: scaleByLevelAndRarity(base.energyRegen, level, rarity),
  };
}

export function calculateCompanionStatContributions(
  companion: CompanionDefinition,
  progress: CompanionProgress,
): LoadoutStatContributions {
  return scaleStatContributions(companion.statContributions, progress.level, companion.rarity);
}

export function calculateModuleStatContributions(
  moduleDef: ModuleDefinition,
  progress: ModuleProgress,
): LoadoutStatContributions {
  return calculateModuleStatContributionsAtLevel(moduleDef, progress.level);
}

export function calculateModuleStatContributionsAtLevel(
  moduleDef: ModuleDefinition,
  level: number,
): LoadoutStatContributions {
  return scaleStatContributions(moduleDef.statContributions, level, moduleDef.rarity);
}

function sumStatContributions(rows: LoadoutStatContributions[]): LoadoutStatContributions {
  return rows.reduce<LoadoutStatContributions>(
    (sum, row) => ({
      attack: sum.attack + row.attack,
      health: sum.health + row.health,
      criticalRate: sum.criticalRate + row.criticalRate,
      criticalDamage: sum.criticalDamage + row.criticalDamage,
      armor: sum.armor + row.armor,
      energyRegen: sum.energyRegen + row.energyRegen,
    }),
    { ...EMPTY_LOADOUT_STAT_CONTRIBUTIONS },
  );
}

// ---------------------------------------------------------------------------
// Ship contribution (real progression — the intrinsic-weapon rule: weapons
// are never a separate movable slot, so the ship's own Power score already
// stands in for "ship + intrinsic weapon + real level," exactly as Ship
// Detail/Ship Level Up already display it. Not a new formula.)
// ---------------------------------------------------------------------------

export function calculateLoadoutShipContribution(
  ship: ShipDefinition,
  shipLevel: number,
): number {
  return calculatePowerScore(calculateShipStats(ship, shipLevel));
}

// ---------------------------------------------------------------------------
// Total Power
// ---------------------------------------------------------------------------

export interface LoadoutPowerBreakdown {
  shipContribution: number;
  companionContribution: number;
  coreModuleContribution: number;
  platingModuleContribution: number;
  systemModuleContribution: number;
  totalPower: number;
}

/** Computes every component contribution plus the summed Total Power for a
 *  given (possibly draft) loadout + selected ship. Empty slots (null id, or
 *  an id that no longer resolves to a real owned definition) contribute
 *  zero rather than throwing — see the safe-missing-id handling in
 *  resolveCompanionSlot/resolveModuleSlot below, which this function reuses
 *  indirectly via the *_or_default progress helpers. Never hard-codes the
 *  reference's own Total Power (12,480) — every figure here is derived. */
export function calculateLoadoutTotalPower(
  ship: ShipDefinition | undefined,
  shipLevel: number,
  loadout: PlayerLoadout,
  player: Pick<PlayerState, "companionProgress" | "moduleProgress">,
): LoadoutPowerBreakdown {
  const shipContribution = ship ? calculateLoadoutShipContribution(ship, shipLevel) : 0;

  const companion = loadout.companionId ? getCompanionById(loadout.companionId) : undefined;
  const companionContribution = companion
    ? calculateCompanionPower(companion, getCompanionProgressOrDefault(companion.id, player))
    : 0;

  const core = loadout.coreModuleId ? getModuleById(loadout.coreModuleId) : undefined;
  const coreModuleContribution =
    core && core.slot === "core" ? calculateModulePower(core, getModuleProgressOrDefault(core.id, player)) : 0;

  const plating = loadout.platingModuleId ? getModuleById(loadout.platingModuleId) : undefined;
  const platingModuleContribution =
    plating && plating.slot === "plating"
      ? calculateModulePower(plating, getModuleProgressOrDefault(plating.id, player))
      : 0;

  const system = loadout.systemModuleId ? getModuleById(loadout.systemModuleId) : undefined;
  const systemModuleContribution =
    system && system.slot === "system"
      ? calculateModulePower(system, getModuleProgressOrDefault(system.id, player))
      : 0;

  return {
    shipContribution,
    companionContribution,
    coreModuleContribution,
    platingModuleContribution,
    systemModuleContribution,
    totalPower:
      shipContribution +
      companionContribution +
      coreModuleContribution +
      platingModuleContribution +
      systemModuleContribution,
  };
}

// ---------------------------------------------------------------------------
// Loadout Stat Contribution panel (companion + 3 modules only — does not
// include or alter the ship's own six core stats)
// ---------------------------------------------------------------------------

export function calculateLoadoutStatContributions(
  loadout: PlayerLoadout,
  player: Pick<PlayerState, "companionProgress" | "moduleProgress">,
): LoadoutStatContributions {
  const rows: LoadoutStatContributions[] = [];

  const companion = loadout.companionId ? getCompanionById(loadout.companionId) : undefined;
  if (companion) {
    rows.push(calculateCompanionStatContributions(companion, getCompanionProgressOrDefault(companion.id, player)));
  }
  const core = loadout.coreModuleId ? getModuleById(loadout.coreModuleId) : undefined;
  if (core && core.slot === "core") {
    rows.push(calculateModuleStatContributions(core, getModuleProgressOrDefault(core.id, player)));
  }
  const plating = loadout.platingModuleId ? getModuleById(loadout.platingModuleId) : undefined;
  if (plating && plating.slot === "plating") {
    rows.push(calculateModuleStatContributions(plating, getModuleProgressOrDefault(plating.id, player)));
  }
  const system = loadout.systemModuleId ? getModuleById(loadout.systemModuleId) : undefined;
  if (system && system.slot === "system") {
    rows.push(calculateModuleStatContributions(system, getModuleProgressOrDefault(system.id, player)));
  }

  return sumStatContributions(rows);
}

// Display formatting note (disclosed deviation from a generic "all six as
// percentages" convention): the approved reference itself shows Attack,
// Health, and Armor as flat additive numbers ("+3,450", "+16,400",
// "+2,150") and only Critical Rate / Critical Damage / Energy Regen as
// percentages ("+18.0%", "+42.0%", "+12.0%") — confirmed by direct
// inspection of the reference bitmap's Loadout Stat Contribution panel.
// This formatter follows the actual reference rather than a generic rule.
const PERCENTAGE_STAT_KEYS: (keyof LoadoutStatContributions)[] = [
  "criticalRate",
  "criticalDamage",
  "energyRegen",
];

export function formatStatContribution(key: keyof LoadoutStatContributions, value: number): string {
  if (PERCENTAGE_STAT_KEYS.includes(key)) {
    const rounded = Math.round(value * 10) / 10;
    return `${rounded >= 0 ? "+" : ""}${rounded.toFixed(1)}%`;
  }
  const rounded = Math.round(value);
  return `${rounded >= 0 ? "+" : ""}${rounded.toLocaleString()}`;
}

export interface LoadoutStatContributionRow {
  key: keyof LoadoutStatContributions;
  label: string;
  icon: string;
  formattedValue: string;
}

// Icon reuse note: no dedicated "Attack"/"Energy Regen" stat icon exists
// separately from the Damage stat icon and the Energy currency icon — the
// closest registered semantic matches are used rather than inventing new
// artwork or falling back to a Unicode glyph. Critical Rate and Critical
// Damage intentionally share the same crit icon, matching the reference's
// own reused snowflake/burst glyph for both rows.
const STAT_CONTRIBUTION_ICON: Record<keyof LoadoutStatContributions, string> = {
  attack: STAT_ICON.damage,
  health: STAT_ICON.hp,
  criticalRate: STAT_ICON.critChance,
  criticalDamage: STAT_ICON.critChance,
  armor: STAT_ICON.defense,
  energyRegen: RESOURCE_ICON.energy,
};

const STAT_CONTRIBUTION_LABEL: Record<keyof LoadoutStatContributions, string> = {
  attack: "Attack",
  health: "Health",
  criticalRate: "Critical Rate",
  criticalDamage: "Critical Damage",
  armor: "Armor",
  energyRegen: "Energy Regen",
};

export function buildStatContributionRows(
  contributions: LoadoutStatContributions,
): LoadoutStatContributionRow[] {
  return (Object.keys(contributions) as (keyof LoadoutStatContributions)[]).map((key) => ({
    key,
    label: STAT_CONTRIBUTION_LABEL[key],
    icon: STAT_CONTRIBUTION_ICON[key],
    formattedValue: formatStatContribution(key, contributions[key]),
  }));
}

// ---------------------------------------------------------------------------
// Validation (pure — mirrors playerStore.tsx's saveActiveLoadout checks
// exactly, so the screen can compute "is this draft saveable" without
// invoking a store mutation; the store re-runs the same checks against its
// own freshest state before actually committing)
// ---------------------------------------------------------------------------

export interface LoadoutValidationResult {
  valid: boolean;
  reason?: LoadoutFailureReason;
}

export function getLoadoutValidation(
  loadout: PlayerLoadout,
  player: Pick<PlayerState, "ownedCompanionIds" | "ownedModuleIds">,
): LoadoutValidationResult {
  if (loadout.companionId !== null) {
    const companion = getCompanionById(loadout.companionId);
    if (!companion) return { valid: false, reason: "invalid-companion" };
    if (!player.ownedCompanionIds.includes(loadout.companionId)) {
      return { valid: false, reason: "companion-not-owned" };
    }
  }

  const slotChecks: { id: string | null; slot: ModuleSlot }[] = [
    { id: loadout.coreModuleId, slot: "core" },
    { id: loadout.platingModuleId, slot: "plating" },
    { id: loadout.systemModuleId, slot: "system" },
  ];
  for (const check of slotChecks) {
    if (check.id === null) continue;
    const moduleDef = getModuleById(check.id);
    if (!moduleDef) {
      return {
        valid: false,
        reason:
          check.slot === "core"
            ? "invalid-core-module"
            : check.slot === "plating"
              ? "invalid-plating-module"
              : "invalid-system-module",
      };
    }
    if (moduleDef.slot !== check.slot) {
      return { valid: false, reason: "invalid-slot" };
    }
    if (!player.ownedModuleIds.includes(check.id)) {
      return {
        valid: false,
        reason:
          check.slot === "core"
            ? "core-module-not-owned"
            : check.slot === "plating"
              ? "plating-module-not-owned"
              : "system-module-not-owned",
      };
    }
  }

  return { valid: true };
}

export function areLoadoutsEqual(a: PlayerLoadout, b: PlayerLoadout): boolean {
  return (
    a.companionId === b.companionId &&
    a.coreModuleId === b.coreModuleId &&
    a.platingModuleId === b.platingModuleId &&
    a.systemModuleId === b.systemModuleId
  );
}

// ---------------------------------------------------------------------------
// Active loadout view-model (main panel display)
// ---------------------------------------------------------------------------

export interface LoadoutSlotViewModel {
  itemId: string | null;
  name: string;
  rarity: ShipRarity | null;
  level: number;
  power: number;
  artSrc: string | undefined;
  empty: boolean;
  /** True when a saved id no longer resolves to a real/owned definition
   *  (removed/renamed item) — rendered the same as empty but distinguishable
   *  for diagnostics/tests. */
  missing: boolean;
}

export interface LoadoutShipViewModel {
  shipId: string;
  name: string;
  rarity: ShipRarity;
  level: number;
  maxLevel: number;
  artSrc: string | undefined;
  weaponName: string;
  weaponLevel: number;
  /** Combined ship + intrinsic weapon + real progression Power — see
   *  calculateLoadoutShipContribution. Labeled "Weapon Power" in the UI to
   *  match the reference's own label for this figure. */
  weaponPower: number;
}

function emptySlotViewModel(): LoadoutSlotViewModel {
  return { itemId: null, name: "Empty Slot", rarity: null, level: 0, power: 0, artSrc: undefined, empty: true, missing: false };
}

function companionSlotViewModel(
  companionId: string | null,
  player: Pick<PlayerState, "companionProgress">,
  artResolver: (artKey: string) => string | undefined,
): LoadoutSlotViewModel {
  if (companionId === null) return emptySlotViewModel();
  const companion = getCompanionById(companionId);
  if (!companion) {
    return { itemId: companionId, name: "Unknown Item", rarity: null, level: 0, power: 0, artSrc: undefined, empty: true, missing: true };
  }
  const progress = getCompanionProgressOrDefault(companionId, player);
  return {
    itemId: companion.id,
    name: companion.name,
    rarity: companion.rarity,
    level: progress.level,
    power: calculateCompanionPower(companion, progress),
    artSrc: artResolver(companion.artKey),
    empty: false,
    missing: false,
  };
}

function moduleSlotViewModel(
  moduleId: string | null,
  slot: ModuleSlot,
  player: Pick<PlayerState, "moduleProgress">,
  artResolver: (artKey: string) => string | undefined,
): LoadoutSlotViewModel {
  if (moduleId === null) return emptySlotViewModel();
  const moduleDef = getModuleById(moduleId);
  if (!moduleDef || moduleDef.slot !== slot) {
    // Missing or (defensively) wrong-slot saved id degrades to a safe
    // missing state rather than crashing or silently misrepresenting the
    // item in the wrong slot.
    return { itemId: moduleId, name: "Unknown Item", rarity: null, level: 0, power: 0, artSrc: undefined, empty: true, missing: true };
  }
  const progress = getModuleProgressOrDefault(moduleId, player);
  return {
    itemId: moduleDef.id,
    name: moduleDef.name,
    rarity: moduleDef.rarity,
    level: progress.level,
    power: calculateModulePower(moduleDef, progress),
    artSrc: artResolver(moduleDef.artKey),
    empty: false,
    missing: false,
  };
}

export interface ActiveLoadoutViewModel {
  ship: LoadoutShipViewModel | null;
  companion: LoadoutSlotViewModel;
  core: LoadoutSlotViewModel;
  plating: LoadoutSlotViewModel;
  system: LoadoutSlotViewModel;
  power: LoadoutPowerBreakdown;
  statContributions: LoadoutStatContributions;
}

export function getActiveLoadoutViewModel(
  selectedShipId: string | undefined,
  shipProgress: ShipProgress | undefined,
  loadout: PlayerLoadout,
  player: Pick<PlayerState, "companionProgress" | "moduleProgress">,
  companionArtResolver: (artKey: string) => string | undefined,
  moduleArtResolver: (artKey: string) => string | undefined,
): ActiveLoadoutViewModel {
  const ship = selectedShipId ? getShipById(selectedShipId) : undefined;
  const power = calculateLoadoutTotalPower(ship, shipProgress?.level ?? 1, loadout, player);

  let shipView: LoadoutShipViewModel | null = null;
  if (ship) {
    // Real intrinsic weapon level comes from the ship's own ShipProgress
    // (weaponLevel), not derived from ship level — weapons are not a
    // separate movable slot, but their *display* name/level is the ship's
    // actual saved progression, sourced from the same ShipProgress record
    // Fleet Roster/Ship Detail/Ship Level Up already read.
    const weaponLevel = shipProgress?.weaponLevel ?? 1;
    const weapon = ship.weaponLevels.find((w) => w.level === weaponLevel) ?? ship.weaponLevels[0];
    shipView = {
      shipId: ship.id,
      name: ship.name,
      rarity: ship.rarity,
      level: shipProgress?.level ?? 1,
      maxLevel: 20,
      artSrc: getShipMasterArt(ship.id),
      weaponName: weapon?.name ?? `${ship.name} Weapon`,
      weaponLevel: weapon?.level ?? 1,
      weaponPower: power.shipContribution,
    };
  }

  return {
    ship: shipView,
    companion: companionSlotViewModel(loadout.companionId, player, companionArtResolver),
    core: moduleSlotViewModel(loadout.coreModuleId, "core", player, moduleArtResolver),
    plating: moduleSlotViewModel(loadout.platingModuleId, "plating", player, moduleArtResolver),
    system: moduleSlotViewModel(loadout.systemModuleId, "system", player, moduleArtResolver),
    power,
    statContributions: calculateLoadoutStatContributions(loadout, player),
  };
}

// ---------------------------------------------------------------------------
// Alternative Items
// ---------------------------------------------------------------------------

export type LoadoutActiveSlot = "ship" | "companion" | "core" | "plating" | "system" | null;
export type LoadoutCategory = "all" | "ships" | "companions" | "core" | "plating" | "system";

export function categoryForSlot(slot: LoadoutActiveSlot): LoadoutCategory {
  switch (slot) {
    case "ship":
      return "ships";
    case "companion":
      return "companions";
    case "core":
      return "core";
    case "plating":
      return "plating";
    case "system":
      return "system";
    default:
      return "all";
  }
}

export interface LoadoutAlternativeItem {
  kind: "ship" | "companion" | "core" | "plating" | "system";
  id: string;
  name: string;
  rarity: ShipRarity;
  level: number;
  power: number;
  artSrc: string | undefined;
  locked: boolean;
  selected: boolean;
}

/** Builds the Alternative Items list for the current category. Ships are
 *  included for "all"/"ships" (own + preview locked ones are omitted here —
 *  Fleet Roster already handles locked-ship display/messaging; this list
 *  only ever shows ships worth tapping into the real Fleet flow). Modules
 *  are always filtered to their compatible slot only — a module can never
 *  appear as an alternative for an incompatible slot. */
export function getAlternativeItems(
  category: LoadoutCategory,
  player: PlayerState,
  loadout: PlayerLoadout,
  shipArtResolver: (shipId: string) => string | undefined,
  companionArtResolver: (artKey: string) => string | undefined,
  moduleArtResolver: (artKey: string) => string | undefined,
): LoadoutAlternativeItem[] {
  const items: LoadoutAlternativeItem[] = [];

  if (category === "all" || category === "ships") {
    for (const ship of SHIPS) {
      const owned = player.ownedShipIds.includes(ship.id);
      const progress = player.shipProgress[ship.id] ?? createDefaultShipProgress(ship.id);
      items.push({
        kind: "ship",
        id: ship.id,
        name: ship.name,
        rarity: ship.rarity,
        level: progress.level,
        power: calculateLoadoutShipContribution(ship, progress.level),
        artSrc: shipArtResolver(ship.id),
        locked: !owned,
        selected: ship.id === player.selectedShipId,
      });
    }
  }

  if (category === "all" || category === "companions") {
    for (const companion of COMPANIONS) {
      if (!player.ownedCompanionIds.includes(companion.id)) continue;
      const progress = getCompanionProgressOrDefault(companion.id, player);
      items.push({
        kind: "companion",
        id: companion.id,
        name: companion.name,
        rarity: companion.rarity,
        level: progress.level,
        power: calculateCompanionPower(companion, progress),
        artSrc: companionArtResolver(companion.artKey),
        locked: false,
        selected: companion.id === loadout.companionId,
      });
    }
  }

  const moduleSlots: { category: LoadoutCategory; slot: ModuleSlot; selectedId: string | null }[] = [
    { category: "core", slot: "core", selectedId: loadout.coreModuleId },
    { category: "plating", slot: "plating", selectedId: loadout.platingModuleId },
    { category: "system", slot: "system", selectedId: loadout.systemModuleId },
  ];
  for (const entry of moduleSlots) {
    if (category !== "all" && category !== entry.category) continue;
    for (const moduleDef of getModulesBySlot(entry.slot)) {
      if (!player.ownedModuleIds.includes(moduleDef.id)) continue;
      const progress = getModuleProgressOrDefault(moduleDef.id, player);
      items.push({
        kind: entry.slot,
        id: moduleDef.id,
        name: moduleDef.name,
        rarity: moduleDef.rarity,
        level: progress.level,
        power: calculateModulePower(moduleDef, progress),
        artSrc: moduleArtResolver(moduleDef.artKey),
        locked: false,
        selected: moduleDef.id === entry.selectedId,
      });
    }
  }

  return items;
}

// ---------------------------------------------------------------------------
// Return-target parsing (Back / post-Save navigation)
// ---------------------------------------------------------------------------

export type LoadoutReturnTarget =
  | { kind: "pre-battle"; stageId: string }
  | { kind: "stage-detail"; stageId: string }
  | { kind: "home" }
  | { kind: "fallback" };

/** Parses the "?return=...&stage=..." query the screen was opened with.
 *  Never throws on a missing/malformed query — an invalid or absent
 *  target safely resolves to `{ kind: "fallback" }`, which callers should
 *  treat as "go Home" (no Inventory Hub exists yet to fall back to). */
export function getLoadoutReturnTarget(hash: string): LoadoutReturnTarget {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return { kind: "fallback" };
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const ret = params.get("return");
  const stage = params.get("stage");

  if (ret === "pre-battle" && stage) return { kind: "pre-battle", stageId: stage };
  if (ret === "stage-detail" && stage) return { kind: "stage-detail", stageId: stage };
  if (ret === "home") return { kind: "home" };
  return { kind: "fallback" };
}
