import type { PlayerState } from "@/types";
import { getShipById } from "./ships";
import { calculatePowerScore, calculateShipStats, SHIP_MAX_LEVEL } from "@/systems/shipStats";

// Reference-matched prototype data for the 8 ships shown in
// 02_Fleet_Roster.png, plus a generic fallback for the other 12 real ships
// so the full 20-ship roster always renders something complete. This
// mirrors the same disclosed prototype-vs-real pattern already used by
// campaignStageDetail.ts / preBattle.ts: the numbers below are read
// directly from the reference image, not derived from the real player save
// (the real save only owns ship-01-rapid-fire by default), so several of
// these ships are shown as "owned" here purely for reference-fidelity
// display even when the live save has not actually granted them. Equipping
// still goes through the real `selectOwnedShip` store action, which safely
// no-ops for any ship not genuinely in `player.ownedShipIds` — no
// progression is ever mutated by this file.

export type FleetStatusVariant =
  | "upgrade-ready"
  | "weapon-upgrade-ready"
  | "fragment-ready"
  | "fragments"
  | "locked";

export interface FleetRosterCardData {
  shipId: string;
  /** Reference shows a couple of ships under a slightly different display
   *  name than ships.ts's real name (e.g. "Ice Blast" vs "Ice/Frost") —
   *  disclosed punctuation/naming variance, same ship identity either way. */
  displayName?: string;
  owned: boolean;
  equipped: boolean;
  level: number;
  power: number;
  statusVariant: FleetStatusVariant;
  fragmentCurrent: number;
  fragmentMax: number;
  hasAlert?: boolean;
  unlockRequirement?: string;
  isReferenceMatched: boolean;
}

export const FLEET_ROSTER_CARDS: FleetRosterCardData[] = [
  {
    shipId: "ship-01-rapid-fire",
    owned: true,
    equipped: false,
    level: 18,
    power: 16250,
    statusVariant: "upgrade-ready",
    fragmentCurrent: 0,
    fragmentMax: 0,
    hasAlert: true,
    isReferenceMatched: true,
  },
  {
    shipId: "ship-02-laser-beam",
    owned: true,
    equipped: false,
    level: 16,
    power: 14780,
    statusVariant: "fragment-ready",
    fragmentCurrent: 18,
    fragmentMax: 20,
    isReferenceMatched: true,
  },
  {
    shipId: "ship-03-homing-missiles",
    owned: true,
    equipped: true,
    level: 12,
    power: 12480,
    statusVariant: "weapon-upgrade-ready",
    fragmentCurrent: 0,
    fragmentMax: 0,
    isReferenceMatched: true,
  },
  {
    shipId: "ship-04-electric-shock",
    owned: true,
    equipped: false,
    level: 10,
    power: 9320,
    statusVariant: "fragments",
    fragmentCurrent: 8,
    fragmentMax: 15,
    isReferenceMatched: true,
  },
  {
    shipId: "ship-06-shield-generator",
    owned: true,
    equipped: false,
    level: 9,
    power: 8450,
    statusVariant: "fragments",
    fragmentCurrent: 12,
    fragmentMax: 20,
    isReferenceMatched: true,
  },
  {
    shipId: "ship-10-ice-frost",
    displayName: "Ice Blast",
    owned: true,
    equipped: false,
    level: 8,
    power: 7860,
    statusVariant: "fragments",
    fragmentCurrent: 7,
    fragmentMax: 15,
    isReferenceMatched: true,
  },
  {
    shipId: "ship-18-orbital-cannons",
    owned: false,
    equipped: false,
    level: 0,
    power: 0,
    statusVariant: "locked",
    fragmentCurrent: 0,
    fragmentMax: 10,
    unlockRequirement: "Account Level 35 to unlock",
    isReferenceMatched: true,
  },
  {
    shipId: "ship-20-cosmic-void",
    displayName: "Cosmic Void",
    owned: false,
    equipped: false,
    level: 0,
    power: 0,
    statusVariant: "locked",
    fragmentCurrent: 0,
    fragmentMax: 50,
    unlockRequirement: "Complete Campaign Chapter 10 to unlock",
    isReferenceMatched: true,
  },
];

const REFERENCE_CARD_IDS = new Set(FLEET_ROSTER_CARDS.map((c) => c.shipId));

// Fragment-max placeholders for the 12 ships not shown in the reference
// frame, scaled by rarity so higher-rarity ships plausibly cost more
// fragments — a disclosed, non-reference-matched generic value, not a real
// economy number.
const GENERIC_FRAGMENT_MAX: Record<string, number> = {
  common: 15,
  rare: 15,
  epic: 20,
  legendary: 30,
  mythic: 50,
};

/**
 * Resolves the card data for any of the other 12 real ships not pictured in
 * the reference frame, from real ship/player data so the roster is complete
 * below the fold. Returns null if the ship id doesn't exist at all.
 */
export function getFleetRosterEntry(
  shipId: string,
  player: PlayerState,
): FleetRosterCardData | null {
  const reference = FLEET_ROSTER_CARDS.find((c) => c.shipId === shipId);
  if (reference) return reference;

  const ship = getShipById(shipId);
  if (!ship) return null;

  const owned = player.ownedShipIds.includes(shipId);
  const equipped = player.selectedShipId === shipId;
  const level = player.shipProgress[shipId]?.level ?? 1;
  const stats = calculateShipStats(ship, level);
  const power = calculatePowerScore(stats);
  const fragmentMax = GENERIC_FRAGMENT_MAX[ship.rarity] ?? 15;

  return {
    shipId,
    owned,
    equipped,
    level,
    power,
    statusVariant: owned ? "fragments" : "locked",
    fragmentCurrent: owned ? fragmentMax : 0,
    fragmentMax,
    unlockRequirement: owned ? undefined : ship.unlockRequirement,
    isReferenceMatched: false,
  };
}

/** Level progress bar fill, expressed as a fraction of the real ship level
 *  cap (SHIP_MAX_LEVEL) — decorative on the card, but grounded in a real
 *  system value rather than an invented number. */
export function levelProgressPct(level: number): number {
  return Math.max(0, Math.min(100, Math.round((level / SHIP_MAX_LEVEL) * 100)));
}

export function isReferenceCard(shipId: string): boolean {
  return REFERENCE_CARD_IDS.has(shipId);
}

// The 8 reference-shown ships, in the reference's exact card order, followed
// by the remaining 12 real ships in roster-id order — so scrolling past
// card 8 shows a complete, functional 20-ship list instead of stopping.
export function getFleetRosterOrder(allShipIds: string[]): string[] {
  const referenceOrder = FLEET_ROSTER_CARDS.map((c) => c.shipId);
  const rest = allShipIds.filter((id) => !REFERENCE_CARD_IDS.has(id));
  return [...referenceOrder, ...rest];
}

// The featured panel's 4 hex ability-tier badges are display-only this
// round (see FLEET_ROSTER_PLAN.md §31 — not tappable, no destination screen
// yet). No new artwork was generated for them; each reuses an existing
// coded BattleModeIcon variant as a themed stand-in, disclosed here rather
// than invented as new asset files.
export type FleetAbilityIconVariant = "target" | "swords" | "energy" | "chevron";

export interface FleetFeaturedAbilityTier {
  iconVariant: FleetAbilityIconVariant;
  level: number;
}

export interface FleetFeaturedPrototype {
  shipId: string;
  levelCurrent: number;
  levelMax: number;
  starRankCurrent: number;
  starRankMax: number;
  weaponLevelCurrent: number;
  weaponLevelMax: number;
  power: number;
  abilityTiers: FleetFeaturedAbilityTier[];
}

// Homing Missiles' exact featured-panel stat block from the reference —
// matches card 3 above exactly (level/power), confirming the featured panel
// mirrors whichever ship is currently previewed.
export const FLEET_FEATURED_DEFAULT: FleetFeaturedPrototype = {
  shipId: "ship-03-homing-missiles",
  levelCurrent: 12,
  levelMax: 30,
  starRankCurrent: 2,
  starRankMax: 5,
  weaponLevelCurrent: 3,
  weaponLevelMax: 10,
  power: 12480,
  abilityTiers: [
    { iconVariant: "target", level: 3 },
    { iconVariant: "swords", level: 2 },
    { iconVariant: "energy", level: 2 },
    { iconVariant: "chevron", level: 1 },
  ],
};

/**
 * For any previewed ship other than the reference's default (Homing
 * Missiles), the featured panel falls back to deriving Level/Power from
 * real ship+player data and shows a generic star rank/weapon level of 0 —
 * disclosed, since the reference frame only ever shows one ship's featured
 * panel (Homing Missiles) and doesn't specify what another ship's panel
 * should contain.
 */
export function getFleetFeaturedStats(
  shipId: string,
  player: PlayerState,
): FleetFeaturedPrototype {
  if (shipId === FLEET_FEATURED_DEFAULT.shipId) return FLEET_FEATURED_DEFAULT;

  const ship = getShipById(shipId);
  const level = player.shipProgress[shipId]?.level ?? 1;
  const power = ship ? calculatePowerScore(calculateShipStats(ship, level)) : 0;
  const progress = player.shipProgress[shipId];

  return {
    shipId,
    levelCurrent: level,
    levelMax: SHIP_MAX_LEVEL,
    starRankCurrent: progress?.stars ?? 0,
    starRankMax: 5,
    weaponLevelCurrent: progress?.weaponLevel ?? 1,
    weaponLevelMax: 10,
    power,
    abilityTiers: FLEET_FEATURED_DEFAULT.abilityTiers.map((tier) => ({ ...tier, level: 1 })),
  };
}
