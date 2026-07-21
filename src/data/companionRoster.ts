import { COMPANIONS, getCompanionById } from "@/data/companions";
import {
  calculateCompanionPower,
  getCompanionProgressOrDefault,
} from "@/data/loadout";
import { RARITY_ORDER } from "@/utils/rarity";
import {
  COMPANION_MAX_LEVEL,
  COMPANION_MAX_RANK,
  calculateCompanionUpgradeQuote,
} from "@/systems/companionProgression";
import type { CompanionRole, PlayerState, ShipRarity } from "@/types";

// Pure view-model layer for the Companions Roster screen
// (17_Companions_Roster.png). No mutation lives here — this file only reads
// from COMPANIONS (data/companions.ts, unchanged) and PlayerState, and
// reuses data/loadout.ts's existing calculateCompanionPower /
// getCompanionProgressOrDefault rather than duplicating the Power formula.
// See docs/handoffs/companions/COMPANIONS_ROSTER_COMPLETION_REPORT.md for
// the full set of disclosed deviations this file's comments reference.

// ---------------------------------------------------------------------------
// Role display/filter normalization
// ---------------------------------------------------------------------------

// The real CompanionRole type (types/companion.ts) uses
// "Attack Support" | "Defense Support" | "Support" | "Utility Support" —
// Loadout Manager already depends on those exact string values, so they are
// NOT changed here. The reference screen's 5 filter pills (All/Attack/
// Defense/Repair/Utility) and its per-card role labels ("ATTACK"/"DEFENSE"/
// "SUPPORT"/"UTILITY") both use shorter, different vocabulary than the type
// — notably "Support" is filed under the "REPAIR" tab, not a "SUPPORT" tab.
// Both mappings are normalized only at this display/filter layer.
export type CompanionRosterFilter = "all" | "attack" | "defense" | "repair" | "utility";

export const COMPANION_ROLE_FILTER_KEY: Record<CompanionRole, Exclude<CompanionRosterFilter, "all">> = {
  "Attack Support": "attack",
  "Defense Support": "defense",
  Support: "repair",
  "Utility Support": "utility",
};

// The label actually printed on each companion's own card/hero role row —
// distinct from the filter tab label above (see file header note).
export const COMPANION_ROLE_DISPLAY_LABEL: Record<CompanionRole, string> = {
  "Attack Support": "Attack",
  "Defense Support": "Defense",
  Support: "Support",
  "Utility Support": "Utility",
};

export const COMPANION_ROLE_FILTER_LABEL: Record<CompanionRosterFilter, string> = {
  all: "All",
  attack: "Attack",
  defense: "Defense",
  repair: "Repair",
  utility: "Utility",
};

// ---------------------------------------------------------------------------
// Progression caps (presentation only — no real level-cap/rank-up system
// exists yet). 20 and 5 are not invented: 20 matches both the reference
// hero panel's own "LEVEL 8 / 20" readout and blueprint.md §11.3's stated
// "Level 1-20"; 5 matches the reference's "RANK ★★★★☆ 4/5" and blueprint's
// "Rank 0-5". Companion.ts's existing prototype data (Repair Drone at
// Level 60, no rank field) predates these caps and is NOT rewritten here —
// see buildCompanionRosterItems's clamping note below.
// ---------------------------------------------------------------------------

export { COMPANION_MAX_LEVEL, COMPANION_MAX_RANK };

export interface CompanionAcquisitionInfo {
  sourceLabel: string;
  unlockDescription: string;
  /** Real, derived values only — never a fabricated currency balance. See
   *  buildCompanionRosterItems's "rank progress" note for what these mean. */
  current?: number;
  required?: number;
}

export interface CompanionRosterItem {
  id: string;
  name: string;
  role: CompanionRole;
  roleDisplayLabel: string;
  roleFilterKey: Exclude<CompanionRosterFilter, "all">;
  rarity: ShipRarity;
  description: string;
  artwork: string | undefined;
  owned: boolean;
  equipped: boolean;
  /** Real stored level from player.companionProgress (via the existing
   *  getCompanionProgressOrDefault fallback) — never clamped/rewritten. May
   *  legitimately exceed maxLevel for prototype fixtures (see Repair Drone
   *  note above); the UI must not crash or visually break if so. */
  level: number;
  maxLevel: number;
  /** Real stored rank (progress.rank ?? 0) — never invented. */
  rank: number;
  maxRank: number;
  /** Same calculateCompanionPower formula Loadout Manager uses — must stay
   *  numerically identical for the equipped companion (see the completion
   *  report's regression check). */
  power: number;
  /** Real affordability/readiness rule shared with Detail, Upgrade and Store. */
  upgradeReady: boolean;
  acquisition?: CompanionAcquisitionInfo;
  /** Original COMPANIONS[] definition order — the "roster" sort's order and
   *  the stable tie-break for every other sort mode. */
  rosterIndex: number;
}

export function buildCompanionRosterItems(
  player: Pick<
    PlayerState,
    "ownedCompanionIds" | "companionProgress" | "activeLoadout" | "currencies" | "materials"
  >,
  artResolver: (artKey: string) => string | undefined,
): CompanionRosterItem[] {
  return COMPANIONS.map((companion, rosterIndex) => {
    const owned = player.ownedCompanionIds.includes(companion.id);
    const progress = getCompanionProgressOrDefault(companion.id, player);
    const rank = progress.rank ?? 0;
    const quote = calculateCompanionUpgradeQuote(companion, progress);
    const upgradeReady =
      owned &&
      !quote.atMaxLevel &&
      quote.creditsCost !== null &&
      quote.companionDataCost !== null &&
      player.currencies.coins >= quote.creditsCost &&
      player.materials.companionData >= quote.companionDataCost;

    let acquisition: CompanionAcquisitionInfo | undefined;
    if (!owned) {
      acquisition = {
        sourceLabel: "Locked",
        unlockDescription: "Acquisition source not yet available in this build.",
      };
    } else if (!upgradeReady) {
      // Rank progress remains informational. Level upgrade readiness is now
      // calculated independently from the real Credits + Companion Data
      // quote above.
      acquisition = {
        sourceLabel: "Rank Progress",
        unlockDescription: "Progress toward the next companion rank.",
        current: rank,
        required: COMPANION_MAX_RANK,
      };
    }

    return {
      id: companion.id,
      name: companion.name,
      role: companion.role,
      roleDisplayLabel: COMPANION_ROLE_DISPLAY_LABEL[companion.role],
      roleFilterKey: COMPANION_ROLE_FILTER_KEY[companion.role],
      rarity: companion.rarity,
      description: companion.description,
      artwork: artResolver(companion.artKey),
      owned,
      equipped: owned && companion.id === player.activeLoadout.companionId,
      level: progress.level,
      maxLevel: COMPANION_MAX_LEVEL,
      rank,
      maxRank: COMPANION_MAX_RANK,
      power: calculateCompanionPower(companion, progress),
      upgradeReady,
      acquisition,
      rosterIndex,
    } satisfies CompanionRosterItem;
  });
}

export function filterCompanionRosterItems(
  items: CompanionRosterItem[],
  filter: CompanionRosterFilter,
): CompanionRosterItem[] {
  if (filter === "all") return items;
  return items.filter((item) => item.roleFilterKey === filter);
}

export type CompanionRosterSort = "roster" | "power" | "rarity" | "level" | "name";

const RARITY_RANK: Record<ShipRarity, number> = RARITY_ORDER.reduce(
  (acc, rarity, index) => ({ ...acc, [rarity]: index }),
  {} as Record<ShipRarity, number>,
);

/** Every mode is a stable sort (ties always fall back to original roster
 *  order) — the equipped companion is never auto-moved to the front unless
 *  "roster"/"power"/etc. would already place it there; the reference does
 *  not show equipped-pinning behavior. */
export function sortCompanionRosterItems(
  items: CompanionRosterItem[],
  sort: CompanionRosterSort,
): CompanionRosterItem[] {
  const sorted = [...items];
  switch (sort) {
    case "power":
      sorted.sort((a, b) => b.power - a.power || a.rosterIndex - b.rosterIndex);
      break;
    case "rarity":
      sorted.sort(
        (a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || a.rosterIndex - b.rosterIndex,
      );
      break;
    case "level":
      sorted.sort((a, b) => b.level - a.level || a.rosterIndex - b.rosterIndex);
      break;
    case "name":
      sorted.sort((a, b) => a.name.localeCompare(b.name) || a.rosterIndex - b.rosterIndex);
      break;
    case "roster":
    default:
      sorted.sort((a, b) => a.rosterIndex - b.rosterIndex);
      break;
  }
  return sorted;
}

export interface CompanionRosterCounts {
  owned: number;
  total: number;
}

export function getCompanionRosterCounts(
  player: Pick<PlayerState, "ownedCompanionIds">,
): CompanionRosterCounts {
  return {
    owned: COMPANIONS.filter((c) => player.ownedCompanionIds.includes(c.id)).length,
    total: COMPANIONS.length,
  };
}

// ---------------------------------------------------------------------------
// Return-target parsing (Back navigation) — same string-union convention
// getCompanionDetailReturnTarget (data/companionDetail.ts) already uses.
//
// Companions now belong under the Fleet navigation branch (Ships and
// Companions are both combat units used to build the active fleet — see
// docs/handoffs/companions/COMPANIONS_FLEET_NAVIGATION_FIX_REPORT.md), so
// the preferred fallback for a direct/unknown-return Companions Roster
// entry is Fleet (`#/ships`), not Home. `loadout` and `home` return targets
// are preserved unchanged from the original implementation — only the
// fallback case (previously "fallback" → Home) changed to "fleet".
// ---------------------------------------------------------------------------

export type CompanionRosterReturnTarget = "fleet" | "loadout" | "home";

/** Priority: return=loadout > return=home > (missing/unknown/malformed) →
 *  "fleet". Never throws. This is a strictly additive change to the return
 *  vocabulary — `?return=loadout` and `?return=home` behave exactly as
 *  before; only the previous catch-all "fallback" (which callers resolved
 *  to Home) now resolves to "fleet" instead, per the Fleet navigation
 *  correction. */
export function getCompanionRosterReturnTarget(hash: string): CompanionRosterReturnTarget {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "fleet";
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const ret = params.get("return");
  if (ret === "loadout") return "loadout";
  if (ret === "home") return "home";
  return "fleet";
}

export function getCompanionRosterItem(
  id: string,
  player: Pick<
    PlayerState,
    "ownedCompanionIds" | "companionProgress" | "activeLoadout" | "currencies" | "materials"
  >,
  artResolver: (artKey: string) => string | undefined,
): CompanionRosterItem | undefined {
  if (!getCompanionById(id)) return undefined;
  return buildCompanionRosterItems(player, artResolver).find((item) => item.id === id);
}
