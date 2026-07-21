import { STAT_ICON } from "@/data/assetRegistry";
import {
  SHIP_MAX_LEVEL,
  calculatePowerScore,
  calculateShipLevelUpgradeQuote,
  calculateShipStats,
  calculateShipXpRequirement,
  isMaxLevel,
  type ShipLevelUpgradeQuote,
} from "@/systems/shipStats";
import type { PlayerState, ShipDefinition, ShipProgress, ShipStatBlock } from "@/types";

// Display-oriented view-model helpers for Ship Level Up (11_Ship_Level_Up.png).
// Pure formatting/derivation only — the authoritative stat/power/cost math
// lives in systems/shipStats.ts and the store owns all mutation. Screens and
// components should read through here rather than formatting numbers or
// re-deriving eligibility/shortage state inline.

// ---------------------------------------------------------------------------
// Stat comparison table
// ---------------------------------------------------------------------------

type StatKey = keyof ShipStatBlock;

const STAT_ROW_DEFS: { key: StatKey; label: string; iconKey: keyof typeof STAT_ICON }[] = [
  { key: "hp", label: "HP", iconKey: "hp" },
  { key: "damage", label: "Damage", iconKey: "damage" },
  { key: "fireRate", label: "Fire Rate", iconKey: "fireRate" },
  { key: "speed", label: "Speed", iconKey: "speed" },
  { key: "defense", label: "Defense", iconKey: "defense" },
  { key: "critRate", label: "Crit Rate", iconKey: "critChance" },
];

/** Trims a trailing ".0" so a whole-number decimal stat (e.g. crit rate
 *  landing on an exact 18.0) reads as "18" like the approved reference,
 *  while a genuine fractional value (18.5) keeps its one decimal place. */
function trimDecimal(value: number, maxDecimals: number): string {
  const fixed = value.toFixed(maxDecimals);
  return fixed.replace(/\.0+$/, "");
}

/** Formats a single stat value with its stat-specific precision/suffix.
 *  Whole-number stats (hp/damage/speed/defense) use localized integer
 *  formatting; fireRate keeps 2 decimals + "/s"; critRate trims to whole
 *  numbers where possible + "%". */
export function formatStatValue(key: StatKey, value: number): string {
  switch (key) {
    case "fireRate":
      return `${value.toFixed(2)}/s`;
    case "critRate":
      return `${trimDecimal(value, 1)}%`;
    default:
      return Math.round(value).toLocaleString();
  }
}

/** Formats a stat's increase (next - current) with a "+" prefix and the
 *  same stat-specific precision/suffix as formatStatValue. */
export function formatStatIncrease(key: StatKey, currentValue: number, nextValue: number): string {
  const delta = nextValue - currentValue;
  switch (key) {
    case "fireRate":
      return `+${delta.toFixed(2)}/s`;
    case "critRate":
      return `+${trimDecimal(delta, 1)}%`;
    default:
      return `+${Math.round(delta).toLocaleString()}`;
  }
}

export interface ShipUpgradeStatRow {
  key: StatKey;
  label: string;
  icon: string;
  current: string;
  /** null when the ship is already at max level — render a MAX treatment
   *  instead of a misleading Level 21 value. */
  next: string | null;
  increase: string | null;
}

/** Builds the six-row CURRENT / NEXT / INCREASE comparison table.
 *  `nextStats` should be null exactly when the ship is at max level — the
 *  caller (not this function) decides that by checking isMaxLevel, since
 *  this function has no access to the ship's max-level rules. */
export function buildStatComparisonRows(
  currentStats: ShipStatBlock,
  nextStats: ShipStatBlock | null,
): ShipUpgradeStatRow[] {
  return STAT_ROW_DEFS.map((def) => ({
    key: def.key,
    label: def.label,
    icon: STAT_ICON[def.iconKey],
    current: formatStatValue(def.key, currentStats[def.key]),
    next: nextStats ? formatStatValue(def.key, nextStats[def.key]) : null,
    increase: nextStats ? formatStatIncrease(def.key, currentStats[def.key], nextStats[def.key]) : null,
  }));
}

// ---------------------------------------------------------------------------
// Ship XP presentation (read-only display, not an upgrade gate — see
// calculateShipXpRequirement's own doc comment in shipStats.ts)
// ---------------------------------------------------------------------------

export interface ShipUpgradeXpDisplay {
  current: number;
  requirement: number;
  pct: number;
  atMaxLevel: boolean;
}

export function getShipXpDisplay(progress: ShipProgress): ShipUpgradeXpDisplay {
  const atMaxLevel = isMaxLevel(progress.level);
  if (atMaxLevel) {
    return { current: 0, requirement: 0, pct: 100, atMaxLevel: true };
  }
  const requirement = calculateShipXpRequirement(progress.level);
  const current = Math.max(0, Math.min(progress.xp, requirement));
  const pct = requirement > 0 ? Math.round((current / requirement) * 100) : 0;
  return { current, requirement, pct, atMaxLevel: false };
}

// ---------------------------------------------------------------------------
// Power Increase card
// ---------------------------------------------------------------------------

export interface ShipUpgradePowerDisplay {
  currentPower: number;
  nextPower: number | null;
  increase: number | null;
  atMaxLevel: boolean;
}

/** Derives the Power Increase card's numbers from a one-level quote
 *  (`calculateShipLevelUpgradeQuote(ship, currentLevel, 1)`), which is
 *  itself the single source of truth for current/next stats and power. */
export function getPowerDisplay(oneLevelQuote: ShipLevelUpgradeQuote): ShipUpgradePowerDisplay {
  if (oneLevelQuote.isEmpty) {
    return {
      currentPower: oneLevelQuote.currentPower,
      nextPower: null,
      increase: null,
      atMaxLevel: true,
    };
  }
  return {
    currentPower: oneLevelQuote.currentPower,
    nextPower: oneLevelQuote.resultingPower,
    increase: oneLevelQuote.resultingPower - oneLevelQuote.currentPower,
    atMaxLevel: false,
  };
}

// ---------------------------------------------------------------------------
// Resource shortage / eligibility (shared by the main Upgrade button and the
// Upgrade x5 confirmation flow — both work from a ShipLevelUpgradeQuote)
// ---------------------------------------------------------------------------

export interface ShipUpgradeResourceState {
  insufficientCoins: boolean;
  insufficientShipAlloy: boolean;
  bothInsufficient: boolean;
  canAfford: boolean;
}

export function getResourceState(quote: ShipLevelUpgradeQuote, player: PlayerState): ShipUpgradeResourceState {
  const insufficientCoins = player.currencies.coins < quote.totalCoins;
  const insufficientShipAlloy = player.materials.shipAlloy < quote.totalShipAlloy;
  return {
    insufficientCoins,
    insufficientShipAlloy,
    bothInsufficient: insufficientCoins && insufficientShipAlloy,
    canAfford: !insufficientCoins && !insufficientShipAlloy && !quote.isEmpty,
  };
}

// ---------------------------------------------------------------------------
// Max Preview (read-only; never mutates progression — see
// ShipUpgradeScreen's Max Preview handler, which only ever reads through
// this helper and calculateShipLevelUpgradeQuote/calculateShipStats)
// ---------------------------------------------------------------------------

export interface ShipUpgradeMaxPreviewData {
  currentLevel: number;
  maxLevel: number;
  currentPower: number;
  maxPower: number;
  powerIncrease: number;
  statRows: ShipUpgradeStatRow[];
}

export function getMaxPreviewData(ship: ShipDefinition, currentLevel: number): ShipUpgradeMaxPreviewData {
  const currentStats = calculateShipStats(ship, currentLevel);
  const maxStats = calculateShipStats(ship, SHIP_MAX_LEVEL);
  const currentPower = calculatePowerScore(currentStats);
  const maxPower = calculatePowerScore(maxStats);
  return {
    currentLevel: Math.min(currentLevel, SHIP_MAX_LEVEL),
    maxLevel: SHIP_MAX_LEVEL,
    currentPower,
    maxPower,
    powerIncrease: maxPower - currentPower,
    statRows: buildStatComparisonRows(currentStats, maxStats),
  };
}

// ---------------------------------------------------------------------------
// Upgrade x5 preview (confirmation modal content)
// ---------------------------------------------------------------------------

export const UPGRADE_X5_LEVELS = 5;

export interface ShipUpgradeX5PreviewData {
  quote: ShipLevelUpgradeQuote;
  resources: ShipUpgradeResourceState;
}

export function getUpgradeX5PreviewData(
  ship: ShipDefinition,
  currentLevel: number,
  player: PlayerState,
): ShipUpgradeX5PreviewData {
  const quote = calculateShipLevelUpgradeQuote(ship, currentLevel, UPGRADE_X5_LEVELS);
  return { quote, resources: getResourceState(quote, player) };
}
