import type { PlayerState, ShipDefinition } from "@/types";
import { RARITY_COST_MULTIPLIER } from "./shipStats";
import { getShipStarRank } from "./shipStarRank";

// Ship Abilities system — pure, deterministic helpers. A ship's three
// abilities (SIGNATURE ATTACK / PASSIVE ABILITY / CALAMITY ABILITY) are
// built into the ship and are completely separate from Arsenal weapons —
// nothing here reads or touches equipped-weapon state. Static definitions
// are derived once from the canonical ShipDefinition (never hand-authored
// per screen, never hard-coded in JSX); the ONLY persistent state is the
// per-ship ability level record in PlayerState.shipAbilityLevels.

export type ShipAbilityCategory = "signature" | "passive" | "calamity";

export const SHIP_ABILITY_CATEGORIES: readonly ShipAbilityCategory[] = [
  "signature",
  "passive",
  "calamity",
];

export const SHIP_ABILITY_MAX_LEVEL = 5;
export const SHIP_ABILITY_MIN_LEVEL = 1;

export function getShipAbilityMaxLevel(): number {
  return SHIP_ABILITY_MAX_LEVEL;
}

/** How each ability's effect number is formatted/interpreted. */
export type ShipAbilityEffectFormat = "percent" | "flat" | "seconds" | "count" | "multiplier";

export interface ShipAbilityDefinition {
  id: string;
  name: string;
  category: ShipAbilityCategory;
  description: string;
  maxLevel: number;
  /** Star rank required before this ability is usable/upgradeable.
   *  Canonical values come from ABILITY_UNLOCK_STAR_RANK below — the Star
   *  Rank milestone table references the same constants. */
  unlockStarRank: number;
  iconKey: "target" | "search" | "skull";
  baseEffect: number;
  effectPerLevel: number;
  effectFormat: ShipAbilityEffectFormat;
  /** Human label for the scaling effect, e.g. "Signature damage". */
  effectLabel: string;
  costProfile: "standard";
}

// ---------------------------------------------------------------------------
// Star Rank unlock gates — the single canonical unlock table (referenced by
// the Star Rank milestone text: 1★ unlocks the Passive Ability, 2★ improves
// the Signature Attack and is where the Calamity Ability comes online).
// Signature is available as soon as the ship is owned.
// ---------------------------------------------------------------------------

export const ABILITY_UNLOCK_STAR_RANK: Record<ShipAbilityCategory, number> = {
  signature: 0,
  passive: 1,
  calamity: 2,
};

// ---------------------------------------------------------------------------
// Effect progression — per-category deterministic scaling. Not every stat
// improves every level; each category scales its one headline effect, and
// the preview + transaction both read the same numbers from here.
// ---------------------------------------------------------------------------

const CATEGORY_EFFECT: Record<
  ShipAbilityCategory,
  { baseEffect: number; effectPerLevel: number; effectFormat: ShipAbilityEffectFormat; effectLabel: string }
> = {
  // Signature Attack: damage multiplier grows per level.
  signature: { baseEffect: 100, effectPerLevel: 15, effectFormat: "percent", effectLabel: "Signature damage" },
  // Passive Ability: passive effect strength grows per level.
  passive: { baseEffect: 10, effectPerLevel: 5, effectFormat: "percent", effectLabel: "Passive effect strength" },
  // Calamity Ability: total burst damage grows per level.
  calamity: { baseEffect: 400, effectPerLevel: 80, effectFormat: "percent", effectLabel: "Calamity total damage" },
};

/**
 * Builds the three typed ability definitions for a ship from its canonical
 * definition. Signature name/description follow the same resolution the
 * Ship Detail signature card uses (real weaponLevels entry when authored,
 * otherwise the disclosed generic + the ship's own shortDescription);
 * passive/calamity use the ship's real hand-authored names/descriptions.
 */
export function getShipAbilityDefinitions(
  ship: ShipDefinition,
): Record<ShipAbilityCategory, ShipAbilityDefinition> {
  const authoredSignature = ship.weaponLevels.length > 0 ? ship.weaponLevels[0] : null;
  const make = (
    category: ShipAbilityCategory,
    name: string,
    description: string,
  ): ShipAbilityDefinition => ({
    id: `${ship.id}:${category}`,
    name,
    category,
    description,
    maxLevel: SHIP_ABILITY_MAX_LEVEL,
    unlockStarRank: ABILITY_UNLOCK_STAR_RANK[category],
    iconKey: category === "signature" ? "target" : category === "passive" ? "search" : "skull",
    ...CATEGORY_EFFECT[category],
    costProfile: "standard",
  });

  return {
    signature: make(
      "signature",
      authoredSignature?.name ?? "Signature Attack",
      authoredSignature?.description ?? ship.shortDescription,
    ),
    passive: make("passive", ship.passiveName, ship.passiveDescription),
    calamity: make("calamity", ship.calamityName, ship.calamityDescription),
  };
}

// ---------------------------------------------------------------------------
// Persistent levels
// ---------------------------------------------------------------------------

export interface ShipAbilityLevels {
  signature: number;
  passive: number;
  calamity: number;
}

export const DEFAULT_SHIP_ABILITY_LEVELS: ShipAbilityLevels = {
  signature: 1,
  passive: 1,
  calamity: 1,
};

function clampLevel(level: number): number {
  return Math.max(SHIP_ABILITY_MIN_LEVEL, Math.min(Math.trunc(level), SHIP_ABILITY_MAX_LEVEL));
}

/** Current persistent level for one ability (defaults to Level 1). */
export function getShipAbilityLevel(
  state: PlayerState,
  shipId: string,
  category: ShipAbilityCategory,
): number {
  const record = state.shipAbilityLevels[shipId];
  return clampLevel(record?.[category] ?? SHIP_ABILITY_MIN_LEVEL);
}

/** Effect value at a given level (same math for preview AND transaction). */
export function getShipAbilityEffectAtLevel(
  definition: ShipAbilityDefinition,
  level: number,
): number {
  return definition.baseEffect + definition.effectPerLevel * (clampLevel(level) - 1);
}

export function formatShipAbilityEffect(definition: ShipAbilityDefinition, value: number): string {
  switch (definition.effectFormat) {
    case "percent":
      return `${value}%`;
    case "seconds":
      return `${value}s`;
    case "multiplier":
      return `x${value}`;
    case "count":
    case "flat":
    default:
      return `${value}`;
  }
}

// ---------------------------------------------------------------------------
// Costs — small data-driven table indexed by CURRENT level (1-4). Credits
// take the same modest RARITY_COST_MULTIPLIER the rest of ship progression
// already uses; Ability Cores (canonical economy id `abilityCores`) are flat.
// ---------------------------------------------------------------------------

export interface ShipAbilityCost {
  credits: number;
  abilityCores: number;
}

const BASE_ABILITY_COSTS: readonly ShipAbilityCost[] = [
  { credits: 5000, abilityCores: 5 }, // 1 → 2
  { credits: 12000, abilityCores: 10 }, // 2 → 3
  { credits: 25000, abilityCores: 18 }, // 3 → 4
  { credits: 50000, abilityCores: 30 }, // 4 → 5
];

/** Cost to go from `currentLevel` to `currentLevel + 1`, or null at max. */
export function getShipAbilityUpgradeCost(
  ship: ShipDefinition,
  currentLevel: number,
): ShipAbilityCost | null {
  if (currentLevel < SHIP_ABILITY_MIN_LEVEL || currentLevel >= SHIP_ABILITY_MAX_LEVEL) return null;
  const base = BASE_ABILITY_COSTS[currentLevel - 1];
  if (!base) return null;
  return {
    credits: Math.round(base.credits * RARITY_COST_MULTIPLIER[ship.rarity]),
    abilityCores: base.abilityCores,
  };
}

// ---------------------------------------------------------------------------
// Preview + validation — single source of truth for the screen's cards,
// the Upgrade buttons' enabled state, and the store transaction.
// ---------------------------------------------------------------------------

export type AbilityUpgradeBlockReason =
  | "not-owned"
  | "locked-star-rank"
  | "max-level"
  | "insufficient-credits"
  | "insufficient-ability-cores"
  | "insufficient-resources";

export interface ShipAbilityPreview {
  shipId: string;
  category: ShipAbilityCategory;
  definition: ShipAbilityDefinition;
  level: number;
  maxLevel: number;
  atMaxLevel: boolean;
  /** Locked until this star rank (null when unlocked). */
  lockedUntilStarRank: number | null;
  unlocked: boolean;
  currentEffect: number;
  currentEffectText: string;
  nextEffect: number | null;
  nextEffectText: string | null;
  cost: ShipAbilityCost | null;
  creditsOwned: number;
  abilityCoresOwned: number;
  shortCredits: boolean;
  shortAbilityCores: boolean;
  canUpgrade: boolean;
  blockReason: AbilityUpgradeBlockReason | null;
}

export function getShipAbilityPreview(
  ship: ShipDefinition,
  state: PlayerState,
  category: ShipAbilityCategory,
): ShipAbilityPreview {
  const definition = getShipAbilityDefinitions(ship)[category];
  const owned = state.ownedShipIds.includes(ship.id);
  const starRank = getShipStarRank(state, ship.id);
  const unlocked = owned && starRank >= definition.unlockStarRank;
  const level = getShipAbilityLevel(state, ship.id, category);
  const atMaxLevel = level >= definition.maxLevel;
  const cost = unlocked && !atMaxLevel ? getShipAbilityUpgradeCost(ship, level) : null;

  const currentEffect = getShipAbilityEffectAtLevel(definition, level);
  const nextEffect = atMaxLevel ? null : getShipAbilityEffectAtLevel(definition, level + 1);

  const shortCredits = cost !== null && state.currencies.coins < cost.credits;
  const shortAbilityCores = cost !== null && state.materials.abilityCores < cost.abilityCores;

  let blockReason: AbilityUpgradeBlockReason | null = null;
  if (!owned) blockReason = "not-owned";
  else if (!unlocked) blockReason = "locked-star-rank";
  else if (atMaxLevel || cost === null) blockReason = "max-level";
  else if (shortCredits && shortAbilityCores) blockReason = "insufficient-resources";
  else if (shortCredits) blockReason = "insufficient-credits";
  else if (shortAbilityCores) blockReason = "insufficient-ability-cores";

  return {
    shipId: ship.id,
    category,
    definition,
    level,
    maxLevel: definition.maxLevel,
    atMaxLevel,
    lockedUntilStarRank: unlocked ? null : definition.unlockStarRank,
    unlocked,
    currentEffect,
    currentEffectText: formatShipAbilityEffect(definition, currentEffect),
    nextEffect,
    nextEffectText: nextEffect === null ? null : formatShipAbilityEffect(definition, nextEffect),
    cost,
    creditsOwned: state.currencies.coins,
    abilityCoresOwned: state.materials.abilityCores,
    shortCredits,
    shortAbilityCores,
    canUpgrade: blockReason === null,
    blockReason,
  };
}

/** True when this specific ability upgrade is currently payable. */
export function canUpgradeShipAbility(
  ship: ShipDefinition,
  state: PlayerState,
  category: ShipAbilityCategory,
): boolean {
  return getShipAbilityPreview(ship, state, category).canUpgrade;
}

/** Truthful ABILITIES tab badge: any of the three upgrades payable now. */
export function canUpgradeAnyShipAbility(ship: ShipDefinition, state: PlayerState): boolean {
  return SHIP_ABILITY_CATEGORIES.some((category) => canUpgradeShipAbility(ship, state, category));
}
