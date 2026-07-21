import type { ShipDefinition, ShipProgress, ShipRarity, ShipStatBlock } from "@/types";

// Shared, pure calculation functions. Every screen that shows ship stats,
// power score, or upgrade cost must call through here rather than
// recomputing its own version — see docs/audit code-quality rules.

export const SHIP_MAX_LEVEL = 20;

export const RARITY_COST_MULTIPLIER: Record<ShipRarity, number> = {
  common: 1,
  rare: 1.2,
  epic: 1.5,
  legendary: 2,
  mythic: 2.5,
};

const BASE_UPGRADE_COST = 120;

export function createDefaultShipProgress(shipId: string): ShipProgress {
  return {
    shipId,
    level: 1,
    xp: 0,
    stars: 0,
    weaponLevel: 1,
    equippedSkinId: null,
  };
}

/** Stats at a given level: base + growth * (level - 1), rounded to whole numbers
 *  except critRate which keeps one decimal place (it's a percentage). */
export function calculateShipStats(ship: ShipDefinition, level: number): ShipStatBlock {
  const clampedLevel = Math.max(1, Math.min(level, SHIP_MAX_LEVEL));
  const steps = clampedLevel - 1;
  const { baseStats, statGrowth } = ship;

  return {
    hp: Math.round(baseStats.hp + statGrowth.hp * steps),
    damage: Math.round(baseStats.damage + statGrowth.damage * steps),
    fireRate: Math.round((baseStats.fireRate + statGrowth.fireRate * steps) * 100) / 100,
    speed: Math.round(baseStats.speed + statGrowth.speed * steps),
    defense: Math.round(baseStats.defense + statGrowth.defense * steps),
    critRate: Math.round((baseStats.critRate + statGrowth.critRate * steps) * 10) / 10,
  };
}

/** A single comparable "power" number from a stat block. Weights are tuned
 *  so no single stat dominates the score at typical Batch 2 levels. */
export function calculatePowerScore(stats: ShipStatBlock): number {
  const score =
    stats.hp * 0.4 +
    stats.damage * 12 +
    stats.fireRate * 180 +
    stats.speed * 6 +
    stats.defense * 10 +
    stats.critRate * 8;
  return Math.round(score);
}

/** Coin cost to go from currentLevel to currentLevel + 1. Returns null if
 *  already at (or above) the max level — callers should treat that as the
 *  max-level state rather than an upgradeable cost. */
export function calculateUpgradeCost(ship: ShipDefinition, currentLevel: number): number | null {
  if (currentLevel >= SHIP_MAX_LEVEL) return null;
  const multiplier = RARITY_COST_MULTIPLIER[ship.rarity];
  const cost = BASE_UPGRADE_COST * Math.pow(currentLevel, 1.55) * multiplier;
  return Math.round(cost);
}

export function isMaxLevel(level: number): boolean {
  return level >= SHIP_MAX_LEVEL;
}

/**
 * XP required to complete a given level. Ship Detail's own reference
 * (09_Ship_Detail_Overview.png) and Ship Level Up's reference
 * (11_Ship_Level_Up.png) both show Level 12 at 1,840 / 2,800 XP — this
 * formula is calibrated to reproduce that 2,800 requirement exactly
 * (1000 + 12 * 150 = 2800). Provisional/temporary: Ship XP is display-only
 * for now (see calculateShipLevelUpgradeQuote below) — it is not yet wired
 * to any XP-gated upgrade gameplay, so this curve can be freely retuned
 * later without touching a real progression gate.
 */
export function calculateShipXpRequirement(level: number): number {
  return 1000 + Math.max(1, level) * 150;
}

/**
 * Ship Alloy cost to go from currentLevel to currentLevel + 1. Mirrors
 * calculateUpgradeCost's shape (same RARITY_COST_MULTIPLIER table, null at
 * max level) but with its own provisional, reference-calibrated formula —
 * validated against the approved reference's Epic-rarity Level 12 -> 13
 * example (Math.round((6 + 12 * 2) * 1.5) = 45 Ship Alloy). Temporary
 * economy tuning, like calculateUpgradeCost's own curve: adjust freely once
 * the full progression economy (missions, rewards, Shop) is unified.
 */
export function calculateShipAlloyCost(ship: ShipDefinition, currentLevel: number): number | null {
  if (currentLevel >= SHIP_MAX_LEVEL) return null;
  const multiplier = RARITY_COST_MULTIPLIER[ship.rarity];
  return Math.round((6 + currentLevel * 2) * multiplier);
}

export interface ShipLevelUpgradeQuote {
  shipId: string;
  startLevel: number;
  targetLevel: number;
  levels: number;
  totalCoins: number;
  totalShipAlloy: number;
  currentStats: ShipStatBlock;
  resultingStats: ShipStatBlock;
  currentPower: number;
  resultingPower: number;
  atMaxLevel: boolean;
  /** True when startLevel was already at/above max, or requestedLevels <= 0
   *  clamped it to zero real upgrades — callers should treat this the same
   *  as "nothing to purchase" (a 0-level quote), not as an error. */
  isEmpty: boolean;
}

/**
 * Pure, stateless quote for upgrading `ship` from `currentLevel` by up to
 * `requestedLevels` levels, clamped so the target never exceeds
 * SHIP_MAX_LEVEL (never quotes Level 21+). Sums the real per-level Coin and
 * Ship Alloy cost for every individual level transition in the range —
 * never approximates a multi-level total by multiplying a single level's
 * cost by the level count, since calculateUpgradeCost/calculateShipAlloyCost
 * both scale with the ship's *current* level at each step.
 *
 * Single source of truth for the one-level Upgrade button, the Upgrade x5
 * confirmation, Max Preview, and the store's upgradeShipLevels transaction
 * — every quote a screen or the store needs to show or validate should come
 * from this function, not be recomputed inline.
 */
export function calculateShipLevelUpgradeQuote(
  ship: ShipDefinition,
  currentLevel: number,
  requestedLevels: number,
): ShipLevelUpgradeQuote {
  const startLevel = Math.max(1, Math.min(currentLevel, SHIP_MAX_LEVEL));
  const targetLevel = Math.max(startLevel, Math.min(startLevel + Math.max(0, requestedLevels), SHIP_MAX_LEVEL));
  const levels = targetLevel - startLevel;

  let totalCoins = 0;
  let totalShipAlloy = 0;
  for (let level = startLevel; level < targetLevel; level += 1) {
    totalCoins += calculateUpgradeCost(ship, level) ?? 0;
    totalShipAlloy += calculateShipAlloyCost(ship, level) ?? 0;
  }

  const currentStats = calculateShipStats(ship, startLevel);
  const resultingStats = calculateShipStats(ship, targetLevel);

  return {
    shipId: ship.id,
    startLevel,
    targetLevel,
    levels,
    totalCoins,
    totalShipAlloy,
    currentStats,
    resultingStats,
    currentPower: calculatePowerScore(currentStats),
    resultingPower: calculatePowerScore(resultingStats),
    atMaxLevel: isMaxLevel(startLevel),
    isEmpty: levels <= 0,
  };
}
