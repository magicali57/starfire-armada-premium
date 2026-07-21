import type { PlayerState, ShipDefinition, ShipProgress, ShipStatBlock } from "@/types";
import {
  RARITY_COST_MULTIPLIER,
  calculatePowerScore,
  calculateShipStats,
  createDefaultShipProgress,
} from "./shipStats";

// Ship Star Rank system — pure, deterministic helpers only. The persistent
// rank itself lives in ONE place: PlayerState.shipProgress[shipId].stars
// (the field Fleet Roster / Ship Detail already read). Ship-specific
// fragments live in PlayerState.shipFragments (keyed by ship id — the
// project-wide "one record keyed by <shipId>" convention); the universal
// fill material is the canonical `universalShards` entry in
// PlayerState.materials (id from the economy catalog in
// docs/economy/STARFIRE_ARMADA_COMPLETE_ECONOMY_DOCUMENT.md).
// Star Rank is ship progression — completely separate from Arsenal weapons.

export const SHIP_MAX_STAR_RANK = 5;

export function getShipMaxStarRank(): number {
  return SHIP_MAX_STAR_RANK;
}

/** Current star rank for a ship (0 when the player has never touched it). */
export function getShipStarRank(state: PlayerState, shipId: string): number {
  const progress: ShipProgress = state.shipProgress[shipId] ?? createDefaultShipProgress(shipId);
  return Math.max(0, Math.min(progress.stars, SHIP_MAX_STAR_RANK));
}

/** Owned ship-specific fragments for one ship. Never negative. */
export function getShipFragmentsOwned(state: PlayerState, shipId: string): number {
  return Math.max(0, state.shipFragments[shipId] ?? 0);
}

// ---------------------------------------------------------------------------
// Costs — small data-driven table indexed by the CURRENT rank (0-4). The
// Credits column takes the same modest RARITY_COST_MULTIPLIER every other
// ship cost in this project already uses; fragment counts are flat so the
// "36 / 80" style display stays simple and predictable.
// ---------------------------------------------------------------------------

export interface ShipRankCost {
  fragments: number;
  credits: number;
}

const BASE_RANK_COSTS: readonly ShipRankCost[] = [
  { fragments: 20, credits: 5000 }, // 0★ → 1★
  { fragments: 40, credits: 15000 }, // 1★ → 2★
  { fragments: 80, credits: 40000 }, // 2★ → 3★
  { fragments: 140, credits: 80000 }, // 3★ → 4★
  { fragments: 220, credits: 150000 }, // 4★ → 5★
];

/** Cost to go from `currentRank` to `currentRank + 1`, or null at/above max. */
export function getShipRankRequirements(
  ship: ShipDefinition,
  currentRank: number,
): ShipRankCost | null {
  if (currentRank < 0 || currentRank >= SHIP_MAX_STAR_RANK) return null;
  const base = BASE_RANK_COSTS[currentRank];
  if (!base) return null;
  return {
    fragments: base.fragments,
    credits: Math.round(base.credits * RARITY_COST_MULTIPLIER[ship.rarity]),
  };
}

// ---------------------------------------------------------------------------
// Bonuses — per-rank increments, summed into a cumulative bonus. Percentages
// apply to HP / Damage / Defense; Crit Rate is a flat additive percentage
// point value (same unit calculateShipStats already uses).
// ---------------------------------------------------------------------------

export interface ShipRankBonus {
  hpPct: number;
  damagePct: number;
  defensePct: number;
  critRate: number;
}

const ZERO_BONUS: ShipRankBonus = { hpPct: 0, damagePct: 0, defensePct: 0, critRate: 0 };

/** Stat gain granted BY each rank (index 0 = gained when reaching 1★). */
const RANK_BONUS_STEPS: readonly ShipRankBonus[] = [
  { hpPct: 5, damagePct: 5, defensePct: 0, critRate: 0 }, // 1★
  { hpPct: 5, damagePct: 5, defensePct: 5, critRate: 0 }, // 2★
  { hpPct: 10, damagePct: 10, defensePct: 0, critRate: 2 }, // 3★
  { hpPct: 10, damagePct: 10, defensePct: 10, critRate: 0 }, // 4★
  { hpPct: 15, damagePct: 15, defensePct: 10, critRate: 3 }, // 5★
];

/** Cumulative bonus at a given rank (rank 0 = no bonus). */
export function getShipRankBonuses(rank: number): ShipRankBonus {
  const clamped = Math.max(0, Math.min(rank, SHIP_MAX_STAR_RANK));
  return RANK_BONUS_STEPS.slice(0, clamped).reduce<ShipRankBonus>(
    (acc, step) => ({
      hpPct: acc.hpPct + step.hpPct,
      damagePct: acc.damagePct + step.damagePct,
      defensePct: acc.defensePct + step.defensePct,
      critRate: acc.critRate + step.critRate,
    }),
    { ...ZERO_BONUS },
  );
}

/** Applies a cumulative rank bonus to a level-derived stat block. */
export function applyStarRankBonuses(stats: ShipStatBlock, rank: number): ShipStatBlock {
  const bonus = getShipRankBonuses(rank);
  return {
    ...stats,
    hp: Math.round(stats.hp * (1 + bonus.hpPct / 100)),
    damage: Math.round(stats.damage * (1 + bonus.damagePct / 100)),
    defense: Math.round(stats.defense * (1 + bonus.defensePct / 100)),
    critRate: Math.round((stats.critRate + bonus.critRate) * 10) / 10,
  };
}

/** Level-derived stats with the star rank bonus layered on top — the
 *  rank-aware companion to calculateShipStats (which stays untouched so the
 *  Ship Level Up quote path is unaffected at rank 0 and level math never
 *  changes). */
export function calculateShipStatsWithRank(
  ship: ShipDefinition,
  level: number,
  rank: number,
): ShipStatBlock {
  return applyStarRankBonuses(calculateShipStats(ship, level), rank);
}

// ---------------------------------------------------------------------------
// Milestones — what each rank unlocks/improves, using the ship's REAL
// ability names (Signature Attack name is presentation-resolved by the
// screen via shipDetail data; passive/calamity names come from the
// definition). Ability *upgrading* itself is the next task — these entries
// only describe availability/improvement, no upgrade logic.
// ---------------------------------------------------------------------------

export interface ShipRankMilestone {
  rank: number;
  /** e.g. "Unlock Passive Ability — Target Lock" */
  abilityText: string;
  /** e.g. "+5% HP, +5% Damage" */
  bonusText: string;
}

function formatBonusStep(step: ShipRankBonus): string {
  const parts: string[] = [];
  if (step.hpPct) parts.push(`+${step.hpPct}% HP`);
  if (step.damagePct) parts.push(`+${step.damagePct}% Damage`);
  if (step.defensePct) parts.push(`+${step.defensePct}% Defense`);
  if (step.critRate) parts.push(`+${step.critRate}% Crit Rate`);
  return parts.join(", ");
}

export function getShipRankMilestones(
  ship: ShipDefinition,
  signatureAttackName: string,
): ShipRankMilestone[] {
  const abilityTexts = [
    `Unlock Passive Ability — ${ship.passiveName}`,
    `Improve Signature Attack — ${signatureAttackName}`,
    `Improve Calamity Ability — ${ship.calamityName}`,
    `Improve Passive Ability — ${ship.passiveName}`,
    "Improve all ship abilities",
  ];
  return RANK_BONUS_STEPS.map((step, index) => ({
    rank: index + 1,
    abilityText: abilityTexts[index] ?? "",
    bonusText: formatBonusStep(step),
  }));
}

// ---------------------------------------------------------------------------
// Rank Up quote + validation — single source of truth for the screen's
// requirement display, the RANK UP button's enabled state, and the store
// transaction. Fragment rule: ship-specific fragments are consumed first;
// universal shards only ever cover the exact shortage, never more.
// ---------------------------------------------------------------------------

export type RankUpBlockReason =
  | "not-owned"
  | "max-rank"
  | "insufficient-fragments"
  | "insufficient-credits"
  | "insufficient-resources";

export interface ShipRankUpQuote {
  shipId: string;
  currentRank: number;
  nextRank: number | null;
  atMaxRank: boolean;
  cost: ShipRankCost | null;
  /** Ship-specific fragments the player owns / would spend. */
  fragmentsOwned: number;
  fragmentsToSpend: number;
  /** Universal shards the player owns / would spend (exact shortage only). */
  universalOwned: number;
  universalToSpend: number;
  /** Remaining fragment shortfall after both pools. 0 when payable. */
  fragmentShortfall: number;
  creditsOwned: number;
  currentStats: ShipStatBlock;
  nextStats: ShipStatBlock | null;
  currentPower: number;
  nextPower: number | null;
  canRankUp: boolean;
  blockReason: RankUpBlockReason | null;
}

export function calculateShipRankUpQuote(
  ship: ShipDefinition,
  state: PlayerState,
): ShipRankUpQuote {
  const progress = state.shipProgress[ship.id] ?? createDefaultShipProgress(ship.id);
  const currentRank = Math.max(0, Math.min(progress.stars, SHIP_MAX_STAR_RANK));
  const owned = state.ownedShipIds.includes(ship.id);
  const atMaxRank = currentRank >= SHIP_MAX_STAR_RANK;
  const cost = getShipRankRequirements(ship, currentRank);

  const fragmentsOwned = getShipFragmentsOwned(state, ship.id);
  const universalOwned = Math.max(0, state.materials.universalShards);
  const required = cost?.fragments ?? 0;
  const fragmentsToSpend = Math.min(fragmentsOwned, required);
  const universalToSpend = Math.min(universalOwned, required - fragmentsToSpend);
  const fragmentShortfall = required - fragmentsToSpend - universalToSpend;

  const currentStats = calculateShipStatsWithRank(ship, progress.level, currentRank);
  const nextStats = atMaxRank
    ? null
    : calculateShipStatsWithRank(ship, progress.level, currentRank + 1);

  const shortFragments = fragmentShortfall > 0;
  const shortCredits = cost !== null && state.currencies.coins < cost.credits;

  let blockReason: RankUpBlockReason | null = null;
  if (!owned) blockReason = "not-owned";
  else if (atMaxRank || cost === null) blockReason = "max-rank";
  else if (shortFragments && shortCredits) blockReason = "insufficient-resources";
  else if (shortFragments) blockReason = "insufficient-fragments";
  else if (shortCredits) blockReason = "insufficient-credits";

  return {
    shipId: ship.id,
    currentRank,
    nextRank: atMaxRank ? null : currentRank + 1,
    atMaxRank,
    cost,
    fragmentsOwned,
    fragmentsToSpend,
    universalOwned,
    universalToSpend,
    fragmentShortfall,
    creditsOwned: state.currencies.coins,
    currentStats,
    nextStats,
    currentPower: calculatePowerScore(currentStats),
    nextPower: nextStats ? calculatePowerScore(nextStats) : null,
    canRankUp: blockReason === null,
    blockReason,
  };
}

/** True when a rank up is currently payable — the truthful badge condition. */
export function canRankUpShip(ship: ShipDefinition, state: PlayerState): boolean {
  return calculateShipRankUpQuote(ship, state).canRankUp;
}
