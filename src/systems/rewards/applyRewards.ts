import type {
  CollectibleType,
  DuplicateConversion,
  PlayerState,
  ResolvedReward,
  RewardApplicationResult,
  RewardEntry,
} from "@/types";
import { getShipById } from "@/data/ships";
import { getCompanionById } from "@/data/companions";
import { getModuleById } from "@/data/modules";
import { getWeaponById } from "@/data/weapons";
import { createDefaultShipProgress } from "@/systems/shipStats";

// Atomic reward application — the ONE function that turns a resolved
// RewardBundle into player state. Validate-everything-first, then build a
// single new state object; on any validation failure the original state is
// returned untouched and nothing is awarded (no partial bundles, ever).
// Persistence happens through the store's usual single update/persist path
// (see the completeCampaignStage store action) — no second save key.

// ---------------------------------------------------------------------------
// Duplicate collectible conversion — the documented launch rule. Duplicates
// are never silently discarded and never re-added: each converts to its
// progression currency at a modest rarity-based value.
// ---------------------------------------------------------------------------

const DUPLICATE_SHIP_FRAGMENTS: Record<string, number> = {
  common: 10,
  uncommon: 12,
  rare: 15,
  epic: 20,
  legendary: 30,
  mythic: 50,
};

const DUPLICATE_COMPANION_SHARDS: Record<string, number> = {
  common: 8,
  rare: 12,
  epic: 18,
  legendary: 28,
};

const DUPLICATE_MODULE_PARTS: Record<string, number> = {
  common: 10,
  rare: 16,
  epic: 24,
  legendary: 36,
};

const DUPLICATE_WEAPON_PARTS: Record<string, number> = {
  common: 10,
  uncommon: 12,
  rare: 16,
  epic: 24,
  legendary: 36,
};

/** Resolves a duplicate collectible to its conversion entry, or null when
 *  the collectible id itself is unknown (validation failure upstream). */
function convertDuplicate(type: CollectibleType, collectibleId: string): RewardEntry | null {
  switch (type) {
    case "ship": {
      const ship = getShipById(collectibleId);
      if (!ship) return null;
      return {
        kind: "shipFragment",
        shipId: collectibleId,
        amount: DUPLICATE_SHIP_FRAGMENTS[ship.rarity] ?? 10,
      };
    }
    case "companion": {
      const companion = getCompanionById(collectibleId);
      if (!companion) return null;
      return {
        kind: "material",
        materialId: "companionShards",
        amount: DUPLICATE_COMPANION_SHARDS[companion.rarity] ?? 8,
      };
    }
    case "module": {
      const moduleDef = getModuleById(collectibleId);
      if (!moduleDef) return null;
      return {
        kind: "material",
        materialId: "moduleParts",
        amount: DUPLICATE_MODULE_PARTS[moduleDef.rarity] ?? 10,
      };
    }
    case "weapon": {
      const weapon = getWeaponById(collectibleId);
      if (!weapon) return null;
      return {
        kind: "material",
        materialId: "weaponParts",
        amount: DUPLICATE_WEAPON_PARTS[weapon.rarity] ?? 10,
      };
    }
  }
}

function collectibleExists(type: CollectibleType, id: string): boolean {
  switch (type) {
    case "ship":
      return getShipById(id) !== undefined;
    case "companion":
      return getCompanionById(id) !== undefined;
    case "module":
      return getModuleById(id) !== undefined;
    case "weapon":
      return getWeaponById(id) !== undefined;
  }
}

function isOwnedCollectible(state: PlayerState, type: CollectibleType, id: string): boolean {
  switch (type) {
    case "ship":
      return state.ownedShipIds.includes(id);
    case "companion":
      return state.ownedCompanionIds.includes(id);
    case "module":
      return state.ownedModuleIds.includes(id);
    case "weapon":
      return state.ownedWeaponIds.includes(id);
  }
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

/** Validates one entry against the canonical catalogs and state shape.
 *  Returns an error string, or null when valid. */
function validateEntry(state: PlayerState, entry: RewardEntry): string | null {
  switch (entry.kind) {
    case "currency":
      if (!(entry.currencyId in state.currencies)) return `unknown currency ${entry.currencyId}`;
      return isPositiveInteger(entry.amount) ? null : "invalid amount";
    case "playerXp":
      return isPositiveInteger(entry.amount) ? null : "invalid amount";
    case "material":
      if (!(entry.materialId in state.materials)) return `unknown material ${entry.materialId}`;
      return isPositiveInteger(entry.amount) ? null : "invalid amount";
    case "shipFragment":
      if (!getShipById(entry.shipId)) return `unknown ship ${entry.shipId}`;
      return isPositiveInteger(entry.amount) ? null : "invalid amount";
    case "consumable":
      if (!(entry.consumableId in state.consumables)) return `unknown consumable ${entry.consumableId}`;
      return isPositiveInteger(entry.amount) ? null : "invalid amount";
    case "chest":
      if (!(entry.chestId in state.chests)) return `unknown chest ${entry.chestId}`;
      return isPositiveInteger(entry.amount) ? null : "invalid amount";
    case "collectible":
      return collectibleExists(entry.collectibleType, entry.collectibleId)
        ? null
        : `unknown collectible ${entry.collectibleId}`;
  }
}

// ---------------------------------------------------------------------------
// Player XP / level
// ---------------------------------------------------------------------------

/** Provisional XP requirement curve for the NEXT level. There is no other
 *  level-up implementation in the project yet (player.level/xp/
 *  xpToNextLevel were display-only), so this becomes the one canonical
 *  place; retune freely once missions/real XP sources land. Matches the
 *  fresh-install anchor (Level 1 → 500 XP). */
export function calculatePlayerXpRequirement(level: number): number {
  return 500 + Math.max(0, level - 1) * 250;
}

function applyPlayerXp(
  state: PlayerState,
  amount: number,
): { state: PlayerState; levelsGained: number } {
  let { level, xp, xpToNextLevel } = state;
  xp += amount;
  let levelsGained = 0;
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level += 1;
    levelsGained += 1;
    xpToNextLevel = calculatePlayerXpRequirement(level);
  }
  return { state: { ...state, level, xp, xpToNextLevel }, levelsGained };
}

// ---------------------------------------------------------------------------
// Application
// ---------------------------------------------------------------------------

export function applyRewardBundle(
  state: PlayerState,
  rewards: ResolvedReward[],
): { state: PlayerState; result: RewardApplicationResult } {
  const failed = (reason: RewardApplicationResult["failureReason"]): { state: PlayerState; result: RewardApplicationResult } => ({
    state,
    result: { success: false, failureReason: reason, applied: [], duplicateConversions: [], playerLevelsGained: 0 },
  });

  if (rewards.length === 0) return failed("empty-bundle");

  // 1. Validate EVERYTHING before touching anything.
  for (const reward of rewards) {
    const error = validateEntry(state, reward.entry);
    if (error) {
      return failed(error.includes("amount") ? "invalid-amount" : "invalid-reward-id");
    }
  }

  // 2. Apply into one new state object.
  let next: PlayerState = {
    ...state,
    currencies: { ...state.currencies },
    materials: { ...state.materials },
    shipFragments: { ...state.shipFragments },
    chests: { ...state.chests },
    consumables: { ...state.consumables },
    ownedShipIds: [...state.ownedShipIds],
    ownedCompanionIds: [...state.ownedCompanionIds],
    ownedModuleIds: [...state.ownedModuleIds],
    ownedWeaponIds: [...state.ownedWeaponIds],
    shipProgress: { ...state.shipProgress },
  };
  const applied: ResolvedReward[] = [];
  const duplicateConversions: DuplicateConversion[] = [];
  let totalXp = 0;

  const applyEntry = (entry: RewardEntry) => {
    switch (entry.kind) {
      case "currency":
        next.currencies[entry.currencyId] += entry.amount;
        break;
      case "playerXp":
        totalXp += entry.amount;
        break;
      case "material":
        next.materials[entry.materialId] += entry.amount;
        break;
      case "shipFragment":
        next.shipFragments[entry.shipId] = (next.shipFragments[entry.shipId] ?? 0) + entry.amount;
        break;
      case "consumable":
        next.consumables[entry.consumableId] += entry.amount;
        break;
      case "chest":
        next.chests[entry.chestId] += entry.amount;
        break;
      case "collectible":
        // Handled by caller (needs duplicate logic).
        break;
    }
  };

  for (const reward of rewards) {
    const entry = reward.entry;
    if (entry.kind === "collectible") {
      if (isOwnedCollectible(next, entry.collectibleType, entry.collectibleId)) {
        // Duplicate → documented conversion (never silently discarded,
        // never added twice).
        const converted = convertDuplicate(entry.collectibleType, entry.collectibleId);
        if (!converted) return failed("invalid-reward-id");
        applyEntry(converted);
        duplicateConversions.push({
          collectibleType: entry.collectibleType,
          collectibleId: entry.collectibleId,
          converted,
        });
        applied.push({ ...reward, entry: converted });
        continue;
      }
      switch (entry.collectibleType) {
        case "ship":
          next.ownedShipIds.push(entry.collectibleId);
          if (!next.shipProgress[entry.collectibleId]) {
            next.shipProgress[entry.collectibleId] = createDefaultShipProgress(entry.collectibleId);
          }
          break;
        case "companion":
          next.ownedCompanionIds.push(entry.collectibleId);
          break;
        case "module":
          next.ownedModuleIds.push(entry.collectibleId);
          break;
        case "weapon":
          next.ownedWeaponIds.push(entry.collectibleId);
          break;
      }
      applied.push(reward);
      continue;
    }
    applyEntry(entry);
    applied.push(reward);
  }

  // 3. Player XP through the one canonical level curve.
  let levelsGained = 0;
  if (totalXp > 0) {
    const xpResult = applyPlayerXp(next, totalXp);
    next = xpResult.state;
    levelsGained = xpResult.levelsGained;
  }

  return {
    state: next,
    result: { success: true, applied, duplicateConversions, playerLevelsGained: levelsGained },
  };
}
