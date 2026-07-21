import type { PlayerState } from "@/types";
import { getShipById } from "./ships";
import {
  calculatePowerScore,
  createDefaultShipProgress,
  SHIP_MAX_LEVEL,
} from "@/systems/shipStats";
import {
  SHIP_MAX_STAR_RANK,
  calculateShipStatsWithRank,
  getShipFragmentsOwned,
} from "@/systems/shipStarRank";
import { SHIP_ABILITY_MAX_LEVEL, getShipAbilityLevel } from "@/systems/shipAbilities";

// Reference-matched data for 09_Ship_Detail_Overview.png, plus a real-data
// fallback for the other 19 ships. Same disclosed prototype-vs-real
// convention already used by campaignStageDetail.ts / preBattle.ts /
// fleetRoster.ts: the one ship the reference actually shows gets its exact
// pictured values; everything else is computed from real ship/player data,
// with any field the real model doesn't define falling back to a clearly
// generic (not reference-authored) value.
//
// KNOWN INCONSISTENCY (disclosed per instruction, not silently reconciled):
// Fleet Roster's already-approved featured panel shows Homing Missiles at
// Level 12/30 (see fleetRoster.ts's FLEET_FEATURED_DEFAULT). This screen's
// own reference shows the same ship at Level 12/40. Each screen follows its
// own authoritative reference independently — this file intentionally does
// NOT match fleetRoster.ts's levelMax. Reconciling the two into one real
// progression model (SHIP_MAX_LEVEL is 20 in the actual gameplay system,
// lower than both) is future work, not something to silently paper over
// here.

export interface ShipDetailCoreStats {
  hp: number;
  damage: number;
  fireRate: number;
  speed: number;
  defense: number;
  critRate: number;
}

/**
 * Compact presentation data for a ship's Signature Attack — the ship's own
 * built-in attack identity, a separate concept from any equipped Arsenal
 * weapon (Arsenal is the only external-weapon system). Presentation only;
 * no upgrade levels/logic here by design.
 */
export interface ShipDetailSignatureAttack {
  name: string;
  description: string;
  /** False when the copy is the disclosed generic fallback rather than a
   *  real hand-authored entry. */
  isRealCopy: boolean;
}

export interface ShipDetailAbility {
  name: string;
  description: string;
  levelCurrent: number;
  levelMax: number;
  isRealCopy: boolean;
}

export interface ShipDetailFragments {
  current: number;
  max: number;
}

export interface ShipDetailSkin {
  equipped: boolean;
  name?: string;
  rarityLabel?: string;
  bonusLabel?: string;
}

export interface ShipDetailContent {
  shipId: string;
  power: number;
  levelCurrent: number;
  levelMax: number;
  starRankCurrent: number;
  starRankMax: number;
  coreStats: ShipDetailCoreStats;
  signatureAttack: ShipDetailSignatureAttack;
  passive: ShipDetailAbility;
  calamity: ShipDetailAbility;
  fragments: ShipDetailFragments;
  skin: ShipDetailSkin;
  /** True only for ship-03-homing-missiles — every other ship is a real-data
   *  derivation, not a second hand-authored reference match. */
  isReferenceMatched: boolean;
}

const REFERENCE_SHIP_ID = "ship-03-homing-missiles";

// Hardcoded, reference-exact — read directly off 09_Ship_Detail_Overview.png,
// not derived from calculateShipStats/calculatePowerScore (which won't
// reproduce these exact numbers, same as Fleet Roster's own reference cards).
const REFERENCE_CONTENT: ShipDetailContent = {
  shipId: REFERENCE_SHIP_ID,
  power: 12480,
  levelCurrent: 12,
  levelMax: 40,
  starRankCurrent: 2,
  starRankMax: 5,
  coreStats: {
    hp: 18750,
    damage: 2950,
    fireRate: 1.45,
    speed: 280,
    defense: 1680,
    critRate: 18,
  },
  signatureAttack: {
    name: "Homing Missile MK III",
    description: "Fires a swarm of smart missiles that home in on up to 3 nearest enemies.",
    isRealCopy: true,
  },
  passive: {
    name: "Target Lock",
    description: "Increases missile tracking speed by 15% and critical damage by 20%.",
    levelCurrent: 2,
    levelMax: 5,
    isRealCopy: true,
  },
  calamity: {
    name: "Missile Barrage",
    description: "Launches a massive salvo of homing missiles, dealing 680% damage.",
    levelCurrent: 1,
    levelMax: 5,
    isRealCopy: true,
  },
  fragments: {
    current: 36,
    max: 80,
  },
  skin: {
    equipped: true,
    name: "Void Hunter",
    rarityLabel: "Epic Skin",
    bonusLabel: "+5% Damage",
  },
  isReferenceMatched: true,
};

// Rarity-scaled generic fragment cap for the 19 non-reference ships — same
// spirit as fleetRoster.ts's private GENERIC_FRAGMENT_MAX, kept as its own
// local constant here rather than importing that file's private table.
const GENERIC_FRAGMENT_MAX: Record<string, number> = {
  common: 15,
  rare: 15,
  epic: 20,
  legendary: 30,
  mythic: 50,
};


/**
 * Real-data content for any ship other than the reference-matched one.
 * - Core stats / power: calculateShipStats + calculatePowerScore (real).
 * - Level / star rank / weapon level: player.shipProgress, defaulting the
 *   same way the store does (createDefaultShipProgress) when the player has
 *   never touched this ship.
 * - Weapon: ship.weaponLevels is hand-authored only for ship-01 (5 levels);
 *   every other ship's weaponLevels array is empty (see ships.ts). Where a
 *   real entry exists for the current weapon level, it's used verbatim.
 *   Where it doesn't, the weapon name/description fall back to a generic,
 *   disclosed label ("Primary Weapon") and the ship's own real
 *   `shortDescription` (already written per-ship, e.g. "Fires seeking
 *   missiles that curve toward enemies.") rather than inventing new copy.
 * - Passive: ship.passiveName/passiveDescription — real and hand-authored
 *   for all 20 ships.
 * - Calamity: ship.calamityName/calamityDescription — real for ship-01,
 *   auto-generated placeholder for ships 2-20 (ships.ts already discloses
 *   this itself; passed through unchanged, not re-disclosed as if new).
 * - Fragments: generic rarity-scaled table above.
 * - Skin: no real per-ship skin system exists — generic "No Skin Equipped".
 */
function getRealShipDetailContent(shipId: string, player: PlayerState): ShipDetailContent | null {
  const ship = getShipById(shipId);
  if (!ship) return null;

  const progress = player.shipProgress[shipId] ?? createDefaultShipProgress(shipId);
  // Star Rank-aware stats (systems/shipStarRank.ts) so Power and core stats
  // stay in sync with the Star Rank screen immediately after a rank up.
  // Identical to the old calculateShipStats output at rank 0.
  const stats = calculateShipStatsWithRank(ship, progress.level, progress.stars);
  const power = calculatePowerScore(stats);

  // Signature Attack presentation: the ship's real hand-authored
  // weaponLevels entry is used verbatim when one exists for the current
  // progress (ship-01 only today). Otherwise a disclosed generic name plus
  // the ship's own real shortDescription — never invented copy, and never
  // the equipped Arsenal weapon (a separate system entirely).
  const realWeaponLevel = ship.weaponLevels.find((w) => w.level === progress.weaponLevel);
  const signatureAttack: ShipDetailSignatureAttack = realWeaponLevel
    ? {
        name: realWeaponLevel.name,
        description: realWeaponLevel.description,
        isRealCopy: true,
      }
    : {
        name: "Signature Attack",
        description: ship.shortDescription,
        isRealCopy: false,
      };

  const fragmentMax = GENERIC_FRAGMENT_MAX[ship.rarity] ?? 15;

  return {
    shipId,
    power,
    levelCurrent: progress.level,
    levelMax: SHIP_MAX_LEVEL,
    starRankCurrent: progress.stars,
    starRankMax: SHIP_MAX_STAR_RANK,
    coreStats: stats,
    signatureAttack,
    // Real persistent ability levels (Ship Abilities system, schema v9) —
    // keeps Ship Detail's ability summaries in sync with the Abilities
    // screen immediately after an upgrade.
    passive: {
      name: ship.passiveName,
      description: ship.passiveDescription,
      levelCurrent: getShipAbilityLevel(player, shipId, "passive"),
      levelMax: SHIP_ABILITY_MAX_LEVEL,
      isRealCopy: true,
    },
    calamity: {
      name: ship.calamityName,
      description: ship.calamityDescription,
      levelCurrent: getShipAbilityLevel(player, shipId, "calamity"),
      levelMax: SHIP_ABILITY_MAX_LEVEL,
      isRealCopy: !ship.provisionalBalance,
    },
    // Real persistent fragment balance (Star Rank system, schema v8) —
    // replaces the old owned?max:0 placeholder display.
    fragments: {
      current: getShipFragmentsOwned(player, shipId),
      max: fragmentMax,
    },
    skin: { equipped: false },
    isReferenceMatched: false,
  };
}

/** Resolves full Ship Detail content for any real ship id, or null if the id
 *  doesn't exist in the roster at all. */
export function getShipDetailContent(shipId: string, player: PlayerState): ShipDetailContent | null {
  if (shipId === REFERENCE_SHIP_ID) return REFERENCE_CONTENT;
  return getRealShipDetailContent(shipId, player);
}
