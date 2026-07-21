import {
  buildStatContributionRows,
  calculateModulePowerAtLevel,
  calculateModuleStatContributionsAtLevel,
  formatStatContribution,
} from "@/data/loadout";
import type { LoadoutStatContributions, ModuleDefinition, ModuleProgress, ShipRarity } from "@/types";

export const MODULE_MIN_LEVEL = 1;
export const MODULE_MAX_LEVEL = 80;

export interface ModuleUpgradeEffectRow {
  key: keyof LoadoutStatContributions;
  label: string;
  icon: string;
  currentValue: number;
  nextValue: number | null;
  currentFormatted: string;
  nextFormatted: string | null;
  increaseFormatted: string | null;
}

export interface ModuleUpgradeQuote {
  moduleId: string;
  currentLevel: number;
  nextLevel: number | null;
  currentPower: number;
  nextPower: number | null;
  powerIncrease: number;
  creditsCost: number | null;
  modulePartsCost: number | null;
  effects: ModuleUpgradeEffectRow[];
  atMaxLevel: boolean;
}

const RARITY_MULTIPLIER: Record<ShipRarity, number> = {
  common: 1,
  rare: 1.2,
  epic: 1.5,
  legendary: 2,
  mythic: 2.5,
};

export function normalizeModuleLevel(level: number): number {
  if (!Number.isFinite(level)) return MODULE_MIN_LEVEL;
  return Math.min(MODULE_MAX_LEVEL, Math.max(MODULE_MIN_LEVEL, Math.trunc(level)));
}

function roundToNearest500(value: number): number {
  return Math.round(value / 500) * 500;
}

export function calculateModuleUpgradeCreditsCost(
  moduleDef: ModuleDefinition,
  currentLevel: number,
): number | null {
  const level = normalizeModuleLevel(currentLevel);
  if (level >= MODULE_MAX_LEVEL) return null;
  return roundToNearest500((1000 + level * 1380) * RARITY_MULTIPLIER[moduleDef.rarity]);
}

export function calculateModulePartsCost(
  moduleDef: ModuleDefinition,
  currentLevel: number,
): number | null {
  const level = normalizeModuleLevel(currentLevel);
  if (level >= MODULE_MAX_LEVEL) return null;
  return Math.round((6 + level * 1.8) * RARITY_MULTIPLIER[moduleDef.rarity]);
}

export function calculateModuleUpgradeQuote(
  moduleDef: ModuleDefinition,
  progress: ModuleProgress,
): ModuleUpgradeQuote {
  const currentLevel = normalizeModuleLevel(progress.level);
  const atMaxLevel = currentLevel >= MODULE_MAX_LEVEL;
  const nextLevel = atMaxLevel ? null : currentLevel + 1;
  const currentPower = calculateModulePowerAtLevel(moduleDef, currentLevel);
  const nextPower = nextLevel === null ? null : calculateModulePowerAtLevel(moduleDef, nextLevel);
  const currentStats = calculateModuleStatContributionsAtLevel(moduleDef, currentLevel);
  const nextStats = nextLevel === null ? null : calculateModuleStatContributionsAtLevel(moduleDef, nextLevel);
  const effects = buildStatContributionRows(currentStats)
    .filter((row) => currentStats[row.key] !== 0)
    .map((row) => {
      const nextValue = nextStats?.[row.key] ?? null;
      return {
        key: row.key,
        label: row.label,
        icon: row.icon,
        currentValue: currentStats[row.key],
        nextValue,
        currentFormatted: row.formattedValue,
        nextFormatted: nextValue === null ? null : formatStatContribution(row.key, nextValue),
        increaseFormatted:
          nextValue === null ? null : formatStatContribution(row.key, nextValue - currentStats[row.key]),
      };
    });

  return {
    moduleId: moduleDef.id,
    currentLevel,
    nextLevel,
    currentPower,
    nextPower,
    powerIncrease: nextPower === null ? 0 : nextPower - currentPower,
    creditsCost: calculateModuleUpgradeCreditsCost(moduleDef, currentLevel),
    modulePartsCost: calculateModulePartsCost(moduleDef, currentLevel),
    effects,
    atMaxLevel,
  };
}
