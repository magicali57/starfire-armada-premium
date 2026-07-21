import type { PlayerState, RewardEntry } from "@/types";

// Canonical Player Progression system — THE single source of truth for the
// account XP curve, level range, level-up rewards, feature-unlock
// milestones, and Energy-cap milestones. Every screen, store transaction,
// reward application, and future Player Profile UI reads through these
// helpers; no other file defines XP math. Player XP is ACCOUNT progression
// only — it never upgrades ships, Star Rank, abilities, companions,
// modules, or Arsenal weapons (those keep their own currencies/materials).
//
// Persistence model: PlayerState keeps `level` + `xp` (progress WITHIN the
// current level) + `xpToNextLevel`. `xpToNextLevel` is a cached derived
// value that MUST always equal getXpRequiredForLevel(level) — the save
// migration re-syncs it through normalizePlayerProgression so there is one
// authoritative curve even for legacy saves.

export const MAX_PLAYER_LEVEL = 50;

export function isPlayerMaxLevel(level: number): boolean {
  return level >= MAX_PLAYER_LEVEL;
}

// ---------------------------------------------------------------------------
// XP curve — small quadratic formula (fast early, moderately slowing, no
// sudden jumps). Anchors: L1→2 = 500 · L5→6 = 1,108 · L10→11 = 2,228 ·
// L20→21 = 5,668 · L30→31 = 10,708 · L40→41 = 17,348 · L49→50 = 24,692.
// Raising MAX_PLAYER_LEVEL later just extends the same formula — no rewrite.
// ---------------------------------------------------------------------------

/** XP needed to go from `level` to `level + 1`. Null at/above max level. */
export function getXpRequiredForLevel(level: number): number | null {
  if (level >= MAX_PLAYER_LEVEL) return null;
  const step = Math.max(1, level) - 1;
  return 500 + 120 * step + 8 * step * step;
}

/** Same as getXpRequiredForLevel but returns 0 at max level — convenient
 *  for UI progress math. */
export function getXpRequiredForNextLevel(level: number): number {
  return getXpRequiredForLevel(level) ?? 0;
}

/** Total XP required to REACH `level` from a fresh Level 1 account. */
export function getCumulativeXpForLevel(level: number): number {
  const clamped = Math.max(1, Math.min(level, MAX_PLAYER_LEVEL));
  let total = 0;
  for (let l = 1; l < clamped; l += 1) total += getXpRequiredForLevel(l) ?? 0;
  return total;
}

/** Derives level + within-level progress from a TOTAL cumulative XP amount
 *  (used by migration/verification; live state stores within-level xp). */
export function getPlayerLevelFromXp(totalXp: number): { level: number; xpWithinLevel: number } {
  let level = 1;
  let remaining = Math.max(0, Math.floor(totalXp));
  while (level < MAX_PLAYER_LEVEL) {
    const required = getXpRequiredForLevel(level) ?? 0;
    if (remaining < required) break;
    remaining -= required;
    level += 1;
  }
  // MAX LEVEL behavior (documented choice): within-level XP freezes at 0 at
  // max level — excess XP is discarded, never banked.
  return { level, xpWithinLevel: level >= MAX_PLAYER_LEVEL ? 0 : remaining };
}

export function getXpProgressWithinLevel(state: Pick<PlayerState, "level" | "xp">): {
  xpWithinLevel: number;
  xpRequiredWithinLevel: number;
  progressPercent: number;
} {
  const required = getXpRequiredForNextLevel(state.level);
  if (required <= 0) return { xpWithinLevel: 0, xpRequiredWithinLevel: 0, progressPercent: 100 };
  const xp = Math.max(0, Math.min(state.xp, required));
  return {
    xpWithinLevel: xp,
    xpRequiredWithinLevel: required,
    progressPercent: Math.min(100, Math.round((xp / required) * 100)),
  };
}

// ---------------------------------------------------------------------------
// Level-up rewards — data-driven, milestone-based, canonical economy ids
// only. Regular levels: Credits + one common material. Every 5 levels: a
// larger Credits + material bundle. Every 10 levels: small Crystals + a
// chest (Basic → Rare → Epic as milestones climb). Granted exactly once,
// at the moment the level is crossed (level itself is persisted, so a
// reload can never re-cross a level and re-grant).
// ---------------------------------------------------------------------------

export function getPlayerLevelRewards(level: number): RewardEntry[] {
  if (level <= 1 || level > MAX_PLAYER_LEVEL) return [];
  const rewards: RewardEntry[] = [
    { kind: "currency", currencyId: "coins", amount: 1000 + level * 100 },
    { kind: "material", materialId: "shipAlloy", amount: 10 + Math.floor(level / 2) },
  ];
  if (level % 5 === 0) {
    rewards.push(
      { kind: "currency", currencyId: "coins", amount: 2000 + level * 200 },
      { kind: "material", materialId: "weaponParts", amount: 10 + level },
      { kind: "material", materialId: "moduleParts", amount: 10 + level },
      { kind: "material", materialId: "abilityCores", amount: 3 + Math.floor(level / 5) },
      // Launch-economy audit correction: Energy previously had a sink (10
      // per battle) but zero sources anywhere — regeneration remains a
      // deferred future system, so milestone levels grant an explicit
      // Energy award (economy rule: Energy only when explicitly awarded).
      { kind: "currency", currencyId: "energy", amount: 20 },
    );
  }
  if (level % 10 === 0) {
    rewards.push(
      { kind: "currency", currencyId: "crystals", amount: 20 + level },
      {
        kind: "chest",
        chestId: level >= 50 ? "chestEpic" : level >= 30 ? "chestRare" : "chestBasic",
        amount: 1,
      },
    );
  }
  return rewards;
}

// ---------------------------------------------------------------------------
// Feature unlock milestones — typed registry for account-level features.
// IMPORTANT: every currently implemented, currently reachable feature is
// level 1 so nothing the player can open today becomes locked. Higher
// milestones only tag features that are planned/approved but NOT built yet
// (nothing consumes those gates today — this is canonical metadata for the
// future flows, not a navigation redesign).
// ---------------------------------------------------------------------------

export interface PlayerUnlockDefinition {
  id: string;
  label: string;
  level: number;
  /** True when the feature exists in the current build. */
  implemented: boolean;
}

export const PLAYER_UNLOCKS: readonly PlayerUnlockDefinition[] = [
  { id: "fleet", label: "Fleet", level: 1, implemented: true },
  { id: "campaign", label: "Campaign", level: 1, implemented: true },
  { id: "companions", label: "Companions", level: 1, implemented: true },
  { id: "modules", label: "Modules", level: 1, implemented: true },
  { id: "arsenal", label: "Arsenal", level: 1, implemented: true },
  { id: "inventory", label: "Inventory", level: 1, implemented: true },
  // Planned/approved future features — metadata only, no gate consumes
  // these yet:
  { id: "daily-rewards", label: "Daily Rewards", level: 4, implemented: false },
  { id: "events", label: "Events", level: 8, implemented: false },
  { id: "shop", label: "Shop", level: 10, implemented: false },
  { id: "campaign-hard", label: "Hard Campaign Difficulty", level: 15, implemented: false },
  { id: "campaign-nightmare", label: "Nightmare Campaign Difficulty", level: 30, implemented: false },
];

/** All unlocks available at or below `level`. */
export function getPlayerUnlocks(level: number): PlayerUnlockDefinition[] {
  return PLAYER_UNLOCKS.filter((unlock) => unlock.level <= level);
}

/** Unlocks whose exact level is `level` (used when crossing levels). */
export function getPlayerUnlocksAtLevel(level: number): PlayerUnlockDefinition[] {
  return PLAYER_UNLOCKS.filter((unlock) => unlock.level === level);
}

// ---------------------------------------------------------------------------
// Energy cap milestones — DEFERRED metadata. Energy currently lives in
// currencies.energy (starting value 100) with no cap enforcement anywhere
// in the architecture, so activating cap growth would require broader
// Energy-system changes that are out of scope. The milestone table +
// helper below are the canonical definition future Energy work consumes;
// nothing reads getPlayerEnergyCap for enforcement today (display-safe
// only).
// ---------------------------------------------------------------------------

export const BASE_ENERGY_CAP = 100;

export const ENERGY_CAP_MILESTONES: readonly { level: number; capIncrease: number }[] = [
  { level: 20, capIncrease: 10 },
  { level: 35, capIncrease: 10 },
  { level: 50, capIncrease: 20 },
];

export function getPlayerEnergyCap(level: number): number {
  return (
    BASE_ENERGY_CAP +
    ENERGY_CAP_MILESTONES.filter((m) => m.level <= level).reduce((sum, m) => sum + m.capIncrease, 0)
  );
}

// ---------------------------------------------------------------------------
// XP gain planning — pure math shared by the atomic application in
// systems/rewards/applyRewards.ts (the ONE reward transaction). Handles
// any number of crossed levels in a single gain; never exceeds max level.
// ---------------------------------------------------------------------------

export interface PlayerXpGainPlan {
  previousLevel: number;
  previousXp: number;
  newLevel: number;
  newXp: number;
  newXpToNextLevel: number;
  levelsGained: number;
  /** Every level crossed by this gain, in order (e.g. [5, 6, 7]). */
  levelsCrossed: number[];
  /** Milestone rewards for every crossed level, resolved exactly once. */
  levelRewards: RewardEntry[];
  /** Unlocks whose milestone level was crossed by this gain. */
  unlocksEarned: PlayerUnlockDefinition[];
  reachedMaxLevel: boolean;
}

export function planPlayerXpGain(
  state: Pick<PlayerState, "level" | "xp">,
  amount: number,
): PlayerXpGainPlan {
  const previousLevel = state.level;
  const previousXp = state.xp;
  let level = state.level;
  let xp = state.xp + Math.max(0, Math.floor(amount));
  const levelsCrossed: number[] = [];

  while (level < MAX_PLAYER_LEVEL) {
    const required = getXpRequiredForLevel(level) ?? 0;
    if (xp < required) break;
    xp -= required;
    level += 1;
    levelsCrossed.push(level);
  }
  const reachedMaxLevel = level >= MAX_PLAYER_LEVEL;
  if (reachedMaxLevel) xp = 0; // documented max-level behavior: excess discarded

  return {
    previousLevel,
    previousXp,
    newLevel: level,
    newXp: xp,
    newXpToNextLevel: getXpRequiredForNextLevel(level),
    levelsGained: level - previousLevel,
    levelsCrossed,
    levelRewards: levelsCrossed.flatMap((crossed) => getPlayerLevelRewards(crossed)),
    unlocksEarned: levelsCrossed.flatMap((crossed) => getPlayerUnlocksAtLevel(crossed)),
    reachedMaxLevel,
  };
}

/**
 * Save-migration normalization: re-syncs the cached xpToNextLevel to the
 * canonical curve and rolls any now-overflowing within-level XP forward
 * into derived levels WITHOUT granting historical level-up rewards
 * (documented migration choice: preserve XP, derive level, never
 * retroactively flood inventory).
 */
export function normalizePlayerProgression(
  state: Pick<PlayerState, "level" | "xp" | "xpToNextLevel">,
): { level: number; xp: number; xpToNextLevel: number; changed: boolean } {
  const safeLevel = Math.max(1, Math.min(Math.trunc(state.level) || 1, MAX_PLAYER_LEVEL));
  const plan = planPlayerXpGain({ level: safeLevel, xp: 0 }, Math.max(0, Math.trunc(state.xp) || 0));
  const normalized = {
    level: plan.newLevel,
    xp: plan.newXp,
    xpToNextLevel: plan.newXpToNextLevel,
  };
  return {
    ...normalized,
    changed:
      normalized.level !== state.level ||
      normalized.xp !== state.xp ||
      normalized.xpToNextLevel !== state.xpToNextLevel,
  };
}

// ---------------------------------------------------------------------------
// Stage XP — the ONE canonical calculation stage reward definitions use.
// Balance targets against the curve above (L1→2 = 500): an early normal
// stage's repeat XP is a useful fraction of a level (~10-25%), an early
// boss first clear lands around one full early level, and chapter/
// difficulty scaling is applied downstream at resolve time by the reward
// resolver's existing multipliers.
// ---------------------------------------------------------------------------

export interface StageXpInputs {
  stageIndex: number;
  bossStage: boolean;
}

export const STAGE_XP_BOSS_MULTIPLIER = 1.75;

/** Base XP granted on EVERY victory of the stage (before chapter/difficulty
 *  scaling in resolveRewards). */
export function getStageBaseXp({ stageIndex, bossStage }: StageXpInputs): number {
  const base = 60 + 20 * Math.max(0, stageIndex - 1);
  return Math.round(base * (bossStage ? STAGE_XP_BOSS_MULTIPLIER : 1));
}

/** Additional one-time XP in the first-clear bundle. */
export function getStageFirstClearBonusXp(inputs: StageXpInputs): number {
  return Math.round(getStageBaseXp(inputs) * 1.5 + 100);
}

/** Smaller sustainable XP added to repeat-clear bundles. */
export function getStageRepeatXp(inputs: StageXpInputs): number {
  return Math.round(getStageBaseXp(inputs) * 0.4);
}

// ---------------------------------------------------------------------------
// Future Player Profile data contract — one selector, no UI here.
// ---------------------------------------------------------------------------

export interface PlayerProgressionSummary {
  currentLevel: number;
  maxLevel: number;
  totalXp: number;
  currentLevelStartXp: number;
  nextLevelXp: number;
  xpWithinCurrentLevel: number;
  xpRequiredWithinCurrentLevel: number;
  progressPercent: number;
  isMaxLevel: boolean;
  nextLevelRewards: RewardEntry[];
  upcomingUnlock: PlayerUnlockDefinition | null;
  currentEnergyCap: number;
}

export function getPlayerProgressionSummary(
  state: Pick<PlayerState, "level" | "xp">,
): PlayerProgressionSummary {
  const progress = getXpProgressWithinLevel(state);
  const currentLevelStartXp = getCumulativeXpForLevel(state.level);
  const maxed = isPlayerMaxLevel(state.level);
  const upcomingUnlock =
    PLAYER_UNLOCKS.filter((unlock) => unlock.level > state.level).sort((a, b) => a.level - b.level)[0] ?? null;
  return {
    currentLevel: state.level,
    maxLevel: MAX_PLAYER_LEVEL,
    totalXp: currentLevelStartXp + progress.xpWithinLevel,
    currentLevelStartXp,
    nextLevelXp: maxed ? currentLevelStartXp : getCumulativeXpForLevel(state.level + 1),
    xpWithinCurrentLevel: progress.xpWithinLevel,
    xpRequiredWithinCurrentLevel: progress.xpRequiredWithinLevel,
    progressPercent: progress.progressPercent,
    isMaxLevel: maxed,
    nextLevelRewards: maxed ? [] : getPlayerLevelRewards(state.level + 1),
    upcomingUnlock,
    currentEnergyCap: getPlayerEnergyCap(state.level),
  };
}
