import type { CurrencyId, MaterialId } from "./player";

// Canonical battle reward + drop type system. Every reward any future
// Victory / Results / Reward Reveal / Missions / Events / Shop-balancing
// flow shows or grants flows through these types — never loose string maps
// or per-screen hard-coded values. Ids reference the canonical economy
// catalog (docs/economy/STARFIRE_ARMADA_COMPLETE_ECONOMY_DOCUMENT.md).

export type RewardRarity = "common" | "rare" | "epic" | "legendary";

export type RewardSource =
  | "campaign-first-clear"
  | "campaign-repeat"
  | "campaign-drop"
  | "chest"
  /** Player level-up milestone rewards (systems/playerProgression.ts). */
  | "level-up"
  /** Canonical Shop purchases (systems/rewards/purchaseShopOffer.ts). */
  | "shop"
  /** Daily Mission claim rewards (systems/dailyMissions/claimDailyMission.ts). */
  | "daily-mission"
  /** Daily Activity milestone claims (systems/dailyMissions/claimDailyActivityMilestone.ts). */
  | "daily-activity"
  // Defined for future systems; nothing awards from these yet.
  | "mission"
  | "event";

/** Reward containers (economy ids chestBasic/chestRare/chestEpic). Chests
 *  are awarded INTO inventory — never auto-opened; a future Chest Open /
 *  Reward Reveal flow resolves their contents via CHEST_REWARD_TABLES. */
export type ChestId = "chestBasic" | "chestRare" | "chestEpic";

/**
 * Persistent, owned pre-battle consumables — the ONLY battle items the
 * economy document defines as owned inventory. Battle-drop power-ups
 * (powerupShield, powerupDamageBoost, …) are temporary within a battle
 * session and are deliberately NOT storable or awardable here.
 */
export type ConsumableId =
  | "consumableShieldCharge"
  | "consumableRepairKit"
  | "consumableDamageAmplifier";

export type CollectibleType = "ship" | "companion" | "module" | "weapon";

/**
 * One typed reward. Discriminated by `kind`:
 * - currency: coins (Credits) / crystals (premium) / energy — energy only
 *   when explicitly awarded; crystals only in first-clear/one-time bundles.
 * - playerXp: routed through the ONE existing player level/xp fields.
 * - material: canonical MaterialId balances (shipAlloy = this project's
 *   Ship Parts equivalent, companionData, moduleParts, weaponParts,
 *   universalShards = universal ship fragments, abilityCores,
 *   companionShards = companion fragments). Companion RANK UP materials are
 *   deliberately not a separate id — Companion Rank Up is postponed.
 * - shipFragment: ship-specific fragment pool (PlayerState.shipFragments).
 * - consumable: persistent pre-battle consumables (ConsumableId).
 * - chest: reward containers, stored unopened in inventory.
 * - collectible: a ship/companion/module/weapon added to the permanent
 *   collection once; duplicates convert via DUPLICATE_CONVERSION rules.
 */
export type RewardEntry =
  | { kind: "currency"; currencyId: CurrencyId; amount: number }
  | { kind: "playerXp"; amount: number }
  | { kind: "material"; materialId: MaterialId; amount: number }
  | { kind: "shipFragment"; shipId: string; amount: number }
  | { kind: "consumable"; consumableId: ConsumableId; amount: number }
  | { kind: "chest"; chestId: ChestId; amount: number }
  | { kind: "collectible"; collectibleType: CollectibleType; collectibleId: string };

/** A reward entry resolved for display/application, with provenance. */
export interface ResolvedReward {
  entry: RewardEntry;
  source: RewardSource;
  rarity: RewardRarity;
}

/** Everything one battle/claim resolved to — the exact payload a future
 *  Results or Reward Reveal screen renders, and applyRewardBundle applies. */
export interface RewardBundle {
  stageId: string | null;
  source: RewardSource;
  firstClear: boolean;
  rewards: ResolvedReward[];
}

// ---------------------------------------------------------------------------
// Drop tables
// ---------------------------------------------------------------------------

/** Weighted drop entry. Quantity rolls uniformly in [minAmount, maxAmount].
 *  `entry` is a template — collectible entries carry no amount. */
export interface DropTableEntry {
  weight: number;
  rarity: RewardRarity;
  entry:
    | { kind: "currency"; currencyId: CurrencyId; minAmount: number; maxAmount: number }
    | { kind: "material"; materialId: MaterialId; minAmount: number; maxAmount: number }
    | { kind: "shipFragment"; shipId: string; minAmount: number; maxAmount: number }
    | { kind: "consumable"; consumableId: ConsumableId; minAmount: number; maxAmount: number }
    | { kind: "chest"; chestId: ChestId; minAmount: number; maxAmount: number }
    | { kind: "collectible"; collectibleType: CollectibleType; collectibleId: string }
    /** Weighted "no drop" slot so a group can miss. */
    | { kind: "nothing" };
}

/** One weighted roll group. `rolls` independent draws; `exclusive` groups
 *  draw at most one non-"nothing" result. */
export interface DropTableGroup {
  id: string;
  rolls: number;
  exclusive?: boolean;
  entries: DropTableEntry[];
}

// ---------------------------------------------------------------------------
// Stage reward definitions (static — never stores resolved random results)
// ---------------------------------------------------------------------------

export type RewardDifficulty = "normal" | "hard" | "nightmare";

export interface StageRewardDefinition {
  stageId: string;
  chapterIndex: number;
  stageIndex: number;
  bossStage: boolean;
  /** Granted on every victory (scaled by chapter/difficulty). */
  guaranteed: RewardEntry[];
  /** Granted exactly once, on the stage's first clear only. */
  firstClear: RewardEntry[];
  /** Granted on repeat victories (smaller, sustainable). */
  repeatClear: RewardEntry[];
  /** Optional weighted drops rolled on every victory. */
  dropTable: DropTableGroup[];
  chapterMultiplier: number;
}

/** All context a reward roll needs. `random` is injectable so verification
 *  is deterministic — nothing in the reward system calls Math.random
 *  directly. Performance fields are defined for future bonuses; current
 *  gameplay does not supply them yet, so they are unused inputs. */
export interface RewardRollContext {
  difficulty: RewardDifficulty;
  firstClear: boolean;
  random: RandomSource;
  performance?: {
    noDamage?: boolean;
    remainingHpPercent?: number;
    completionTime?: number;
    enemiesDestroyed?: number;
    score?: number;
    starsEarned?: number;
  };
}

export interface RandomSource {
  /** Uniform float in [0, 1). */
  next(): number;
}

// ---------------------------------------------------------------------------
// Application results
// ---------------------------------------------------------------------------

export interface DuplicateConversion {
  collectibleType: CollectibleType;
  collectibleId: string;
  /** What the duplicate converted into. */
  converted: RewardEntry;
}

export type RewardApplicationFailure =
  | "invalid-reward-id"
  | "invalid-amount"
  | "empty-bundle";

export interface RewardApplicationResult {
  success: boolean;
  failureReason?: RewardApplicationFailure;
  /** Rewards actually applied (duplicates replaced by their conversions). */
  applied: ResolvedReward[];
  duplicateConversions: DuplicateConversion[];
  playerLevelsGained: number;
}

export interface BattleCompletionSummary {
  stageId: string;
  victory: boolean;
  firstClear: boolean;
  bundle: RewardBundle | null;
  application: RewardApplicationResult | null;
  stageMarkedCleared: boolean;
}
