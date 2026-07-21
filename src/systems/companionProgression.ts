import { calculateCompanionPower } from "@/data/loadout";
import type { CompanionDefinition, CompanionProgress, ShipRarity } from "@/types";

export const COMPANION_MIN_LEVEL = 1;
export const COMPANION_MAX_LEVEL = 20;
export const COMPANION_MAX_RANK = 5;

export type CompanionUpgradeEffectUnit = "flat" | "percent" | "seconds" | "per-second";

export interface CompanionUpgradeEffectDefinition {
  key: string;
  label: string;
  unit: CompanionUpgradeEffectUnit;
  baseValue: number;
  perLevel: number;
  precision?: number;
}

export interface CompanionUpgradeProfile {
  companionId: string;
  primaryEffectName: string;
  effects: CompanionUpgradeEffectDefinition[];
}

export interface CompanionUpgradeEffectValue {
  key: string;
  label: string;
  unit: CompanionUpgradeEffectUnit;
  value: number;
  precision: number;
}

export interface CompanionRankMilestone {
  rank: number;
  requiredLevel?: number;
  title: string;
  description: string;
  unlocked: boolean;
  current: boolean;
}

export interface CompanionUpgradeQuote {
  companionId: string;
  currentLevel: number;
  nextLevel: number | null;
  currentPower: number;
  nextPower: number | null;
  powerIncrease: number;
  creditsCost: number | null;
  companionDataCost: number | null;
  currentEffects: CompanionUpgradeEffectValue[];
  nextEffects: CompanionUpgradeEffectValue[];
  atMaxLevel: boolean;
}

const CREDIT_RARITY_MULTIPLIER: Record<ShipRarity, number> = {
  common: 1,
  rare: 1.2,
  epic: 1.5,
  legendary: 2,
  mythic: 2.5,
};

const DATA_RARITY_MULTIPLIER: Record<ShipRarity, number> = {
  common: 1,
  rare: 1.5,
  epic: 2,
  legendary: 2.5,
  mythic: 3,
};

/** Prototype UI/progression tuning. These values are intentionally shared
 * by all screens but are not connected to combat gameplay yet. Repair
 * Drone reproduces the approved Level 8→9 Heal Per Second example exactly
 * (2,450→2,700). The other five profiles are role-appropriate provisional
 * values based on their current definitions, not final combat balance. */
export const COMPANION_UPGRADE_PROFILES: Record<string, CompanionUpgradeProfile> = {
  "companion-assault-drone": {
    companionId: "companion-assault-drone",
    primaryEffectName: "Suppressing Fire",
    effects: [
      { key: "damage-per-hit", label: "Damage Per Hit", unit: "flat", baseValue: 220, perLevel: 35 },
      { key: "duration", label: "Duration", unit: "seconds", baseValue: 5, perLevel: 0 },
      { key: "cooldown", label: "Cooldown", unit: "seconds", baseValue: 12, perLevel: 0 },
    ],
  },
  "companion-beam-drone": {
    companionId: "companion-beam-drone",
    primaryEffectName: "Focused Beam",
    effects: [
      { key: "beam-damage", label: "Beam Damage", unit: "per-second", baseValue: 380, perLevel: 55 },
      { key: "critical-bonus", label: "Critical Damage", unit: "percent", baseValue: 10, perLevel: 1.5, precision: 1 },
      { key: "duration", label: "Duration", unit: "seconds", baseValue: 4, perLevel: 0 },
    ],
  },
  "companion-missile-drone": {
    companionId: "companion-missile-drone",
    primaryEffectName: "Homing Volley",
    effects: [
      { key: "volley-damage", label: "Volley Damage", unit: "flat", baseValue: 400, perLevel: 60 },
      { key: "lock-bonus", label: "Target Lock Bonus", unit: "percent", baseValue: 4, perLevel: 0.75, precision: 1 },
      { key: "cooldown", label: "Cooldown", unit: "seconds", baseValue: 14, perLevel: 0 },
    ],
  },
  "companion-repair-drone": {
    companionId: "companion-repair-drone",
    primaryEffectName: "Repair Beam",
    effects: [
      { key: "heal-per-second", label: "Heal Per Second", unit: "per-second", baseValue: 700, perLevel: 250 },
      { key: "duration", label: "Duration", unit: "seconds", baseValue: 6, perLevel: 0 },
      { key: "cooldown", label: "Cooldown", unit: "seconds", baseValue: 18, perLevel: 0 },
    ],
  },
  "companion-shield-drone": {
    companionId: "companion-shield-drone",
    primaryEffectName: "Deflector Field",
    effects: [
      { key: "shield-strength", label: "Shield Strength", unit: "flat", baseValue: 650, perLevel: 85 },
      { key: "duration", label: "Duration", unit: "seconds", baseValue: 8, perLevel: 0 },
      { key: "cooldown", label: "Cooldown", unit: "seconds", baseValue: 20, perLevel: 0 },
    ],
  },
  "companion-utility-drone": {
    companionId: "companion-utility-drone",
    primaryEffectName: "System Optimizer",
    effects: [
      { key: "energy-recovery", label: "Energy Recovery", unit: "per-second", baseValue: 1.2, perLevel: 0.1, precision: 1 },
      { key: "cooldown-reduction", label: "Cooldown Reduction", unit: "percent", baseValue: 2, perLevel: 0.5, precision: 1 },
      { key: "targeting-bonus", label: "Targeting Bonus", unit: "percent", baseValue: 3, perLevel: 0.6, precision: 1 },
    ],
  },
};

export function normalizeCompanionLevel(level: number): number {
  if (!Number.isFinite(level)) return COMPANION_MIN_LEVEL;
  return Math.min(COMPANION_MAX_LEVEL, Math.max(COMPANION_MIN_LEVEL, Math.trunc(level)));
}

export function isCompanionMaxLevel(level: number): boolean {
  return normalizeCompanionLevel(level) >= COMPANION_MAX_LEVEL;
}

export function calculateCompanionPowerAtLevel(companion: CompanionDefinition, level: number): number {
  return calculateCompanionPower(companion, { level: normalizeCompanionLevel(level) });
}

export function calculateCompanionUpgradeCreditsCost(
  companion: CompanionDefinition,
  currentLevel: number,
): number | null {
  const level = normalizeCompanionLevel(currentLevel);
  if (level >= COMPANION_MAX_LEVEL) return null;
  return Math.round(1000 * level * CREDIT_RARITY_MULTIPLIER[companion.rarity]);
}

export function calculateCompanionDataCost(
  companion: CompanionDefinition,
  currentLevel: number,
): number | null {
  const level = normalizeCompanionLevel(currentLevel);
  if (level >= COMPANION_MAX_LEVEL) return null;
  return Math.round((level + 2) * DATA_RARITY_MULTIPLIER[companion.rarity]);
}

export function getCompanionUpgradeProfile(companionId: string): CompanionUpgradeProfile | undefined {
  return COMPANION_UPGRADE_PROFILES[companionId];
}

export function calculateCompanionEffectAtLevel(
  companionId: string,
  level: number,
): CompanionUpgradeEffectValue[] {
  const profile = getCompanionUpgradeProfile(companionId);
  if (!profile) return [];
  const normalizedLevel = normalizeCompanionLevel(level);
  return profile.effects.map((effect) => {
    const precision = effect.precision ?? 0;
    const raw = effect.baseValue + (normalizedLevel - COMPANION_MIN_LEVEL) * effect.perLevel;
    const factor = 10 ** precision;
    return {
      key: effect.key,
      label: effect.label,
      unit: effect.unit,
      value: Math.round(raw * factor) / factor,
      precision,
    };
  });
}

export function calculateCompanionUpgradeQuote(
  companion: CompanionDefinition,
  progress: CompanionProgress,
): CompanionUpgradeQuote {
  const currentLevel = normalizeCompanionLevel(progress.level);
  const atMaxLevel = currentLevel >= COMPANION_MAX_LEVEL;
  const nextLevel = atMaxLevel ? null : currentLevel + 1;
  const currentPower = calculateCompanionPowerAtLevel(companion, currentLevel);
  const nextPower = nextLevel === null ? null : calculateCompanionPowerAtLevel(companion, nextLevel);
  return {
    companionId: companion.id,
    currentLevel,
    nextLevel,
    currentPower,
    nextPower,
    powerIncrease: nextPower === null ? 0 : nextPower - currentPower,
    creditsCost: calculateCompanionUpgradeCreditsCost(companion, currentLevel),
    companionDataCost: calculateCompanionDataCost(companion, currentLevel),
    currentEffects: calculateCompanionEffectAtLevel(companion.id, currentLevel),
    nextEffects: nextLevel === null ? [] : calculateCompanionEffectAtLevel(companion.id, nextLevel),
    atMaxLevel,
  };
}

export function getCompanionRankMilestones(
  companion: CompanionDefinition,
  progress: CompanionProgress,
): CompanionRankMilestone[] {
  const rank = Math.min(COMPANION_MAX_RANK, Math.max(0, Math.trunc(progress.rank ?? 0)));
  const profile = getCompanionUpgradeProfile(companion.id);
  const effect = profile?.effects[0]?.label ?? "Primary Effect";
  const titles = ["Calibrated Systems", "Enhanced Core", "Tactical Protocol", "Elite Support", "Apex Synchronization"];
  const requiredLevels = [1, 4, 8, 12, 16];
  return titles.map((title, index) => {
    const milestoneRank = index + 1;
    return {
      rank: milestoneRank,
      requiredLevel: requiredLevels[index],
      title,
      description: `${effect} rank bonus ${milestoneRank} for ${companion.name}.`,
      unlocked: rank >= milestoneRank,
      current: rank === milestoneRank,
    };
  });
}
