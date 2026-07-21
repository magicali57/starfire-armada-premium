import type { BattleModeIconVariant } from "@/components/icons/BattleModeIcon";
import { COMPANIONS, getCompanionById } from "@/data/companions";
import {
  buildStatContributionRows,
  calculateCompanionStatContributions,
  calculateLoadoutShipContribution,
  getCompanionProgressOrDefault,
  type LoadoutStatContributionRow,
} from "@/data/loadout";
import { getShipById } from "@/data/ships";
import {
  COMPANION_ROLE_FILTER_KEY,
  type CompanionAcquisitionInfo,
  type CompanionRosterFilter,
} from "@/data/companionRoster";
import {
  COMPANION_MAX_LEVEL,
  COMPANION_MAX_RANK,
  calculateCompanionUpgradeQuote,
  type CompanionUpgradeEffectValue,
} from "@/systems/companionProgression";
import type { CompanionDetailReturnTarget } from "@/app/routes";
import type { CompanionDefinition, CompanionRole, PlayerState, ShipRarity, ShipRole } from "@/types";

// Pure view-model layer for the Companion Detail screen (18_Companion_Detail.png).
// No mutation lives here. Reuses data/loadout.ts's existing Power/stat-
// contribution helpers and data/companionRoster.ts's existing level/rank
// caps — does not duplicate either. See
// docs/handoffs/companion-detail/COMPANION_DETAIL_COMPLETION_REPORT.md for
// the full set of disclosed deviations referenced in this file's comments.

// Re-exported so the screen/components only need one import for the caps
// this screen displays against (matches Companions Roster's own values —
// see COMPANION_MAX_LEVEL/COMPANION_MAX_RANK in companionRoster.ts for the
// citation: reference hero panel's own "8/20"/"4/5" readouts, confirmed
// again on this screen's own hero panel, and blueprint.md §11.3).
export { COMPANION_MAX_LEVEL, COMPANION_MAX_RANK };
export type { CompanionAcquisitionInfo };

// ---------------------------------------------------------------------------
// Role display label (same normalization as companionRoster.ts, reused
// here rather than re-derived — the Detail screen's role row uses the
// same short single-word label Companions Roster and its own hero panel
// already use: "SUPPORT" for the internal "Support" role, etc.)
// ---------------------------------------------------------------------------

const ROLE_DISPLAY_LABEL: Record<CompanionRole, string> = {
  "Attack Support": "Attack",
  "Defense Support": "Defense",
  Support: "Support",
  "Utility Support": "Utility",
};

// ---------------------------------------------------------------------------
// Behavior / ability presentation metadata (PROTOTYPE, DESCRIPTIVE ONLY)
//
// None of this is wired to gameplay, combat, targeting, or cooldown logic
// of any kind — it is flavor text for this screen only, per the task's
// explicit instruction (§17) that this metadata is "descriptive only."
// Only companion-repair-drone's entry is reference-matched (transcribed
// directly from 18_Companion_Detail.png's "Skill & Effects" panel — title,
// summary, targeting, all 4 effect-stat values, and all 3 utility-benefit
// lines are verbatim from the bitmap). The other 5 companions have no
// reference screen yet, so their entries are original prototype content
// written to match each companion's own real role/description from
// data/companions.ts, in the same structural shape — NOT verified against
// any reference image. This is disclosed clearly in the completion report.
// ---------------------------------------------------------------------------

export interface CompanionEffectStat {
  icon: BattleModeIconVariant;
  label: string;
  value: string;
}

export interface CompanionBehaviorInfo {
  title: string;
  activation: string;
  summary: string;
  targeting?: string;
  effectStats: CompanionEffectStat[];
  utilityBenefits: string[];
}

const COMPANION_BEHAVIOR_INFO: Record<string, CompanionBehaviorInfo> = {
  "companion-repair-drone": {
    title: "Repair Beam",
    activation: "Active Ability",
    summary: "Fires a concentrated repair beam that restores health to the allied ship with the lowest HP.",
    targeting: "Lowest HP Ally",
    effectStats: [
      { icon: "clock", label: "Cooldown", value: "18s" },
      { icon: "heart", label: "Heal Per Second", value: "2,450" },
      { icon: "clock", label: "Duration", value: "6s" },
      { icon: "target", label: "Targeting", value: "Lowest HP Ally" },
    ],
    utilityBenefits: [
      "Sustains your ship in tough battles",
      "Great for survivability in long missions",
      "Synergizes with tank and support builds",
    ],
  },
  // The following 5 entries are original prototype content (not reference-
  // matched — the approved reference only shows Repair Drone) written to
  // stay consistent with each companion's real role/description.
  "companion-assault-drone": {
    title: "Suppressing Fire",
    activation: "Active Ability",
    summary: "Adds a sustained burst of offensive fire alongside the ship's own weapons.",
    targeting: "Current Ship Target",
    effectStats: [
      { icon: "clock", label: "Cooldown", value: "12s" },
      { icon: "swords", label: "Damage Per Hit", value: "310" },
      { icon: "clock", label: "Duration", value: "5s" },
      { icon: "target", label: "Targeting", value: "Current Ship Target" },
    ],
    utilityBenefits: [
      "Boosts sustained damage output",
      "Effective against single high-HP targets",
      "Synergizes with attack-focused builds",
    ],
  },
  "companion-beam-drone": {
    title: "Focused Beam",
    activation: "Active Ability",
    summary: "Channels a continuous beam that amplifies the ship's critical strike damage.",
    targeting: "Current Ship Target",
    effectStats: [
      { icon: "clock", label: "Cooldown", value: "16s" },
      { icon: "swords", label: "Crit Damage Bonus", value: "+25%" },
      { icon: "clock", label: "Duration", value: "4s" },
      { icon: "target", label: "Targeting", value: "Current Ship Target" },
    ],
    utilityBenefits: [
      "Spikes burst damage on crit-heavy builds",
      "Rewards precise, focused targeting",
      "Synergizes with critical-rate modules",
    ],
  },
  "companion-missile-drone": {
    title: "Homing Volley",
    activation: "Active Ability",
    summary: "Launches a volley of homing micro-missiles alongside the ship's own weapons.",
    targeting: "Nearest Enemy",
    effectStats: [
      { icon: "clock", label: "Cooldown", value: "14s" },
      { icon: "swords", label: "Volley Damage", value: "480" },
      { icon: "clock", label: "Duration", value: "Instant" },
      { icon: "target", label: "Targeting", value: "Nearest Enemy" },
    ],
    utilityBenefits: [
      "Reliable burst against grouped enemies",
      "No line-of-sight required",
      "Synergizes with crowd-control builds",
    ],
  },
  "companion-shield-drone": {
    title: "Deflector Field",
    activation: "Active Ability",
    summary: "Projects a supplementary deflector field that reinforces the ship's armor.",
    targeting: "Self (Ship)",
    effectStats: [
      { icon: "clock", label: "Cooldown", value: "20s" },
      { icon: "shield", label: "Shield Absorbed", value: "1,200" },
      { icon: "clock", label: "Duration", value: "8s" },
      { icon: "target", label: "Targeting", value: "Self (Ship)" },
    ],
    utilityBenefits: [
      "Reduces incoming burst damage",
      "Great for survivability in long missions",
      "Synergizes with tank and defense builds",
    ],
  },
  "companion-utility-drone": {
    title: "System Optimizer",
    activation: "Passive Ability",
    summary: "Continuously optimizes onboard systems for faster energy recovery and targeting.",
    targeting: "Self (Ship)",
    effectStats: [
      { icon: "clock", label: "Cooldown", value: "Passive" },
      { icon: "heart", label: "Energy Restored", value: "+2.0%/s" },
      { icon: "clock", label: "Duration", value: "Always Active" },
      { icon: "target", label: "Targeting", value: "Self (Ship)" },
    ],
    utilityBenefits: [
      "Speeds up ability uptime",
      "Improves overall energy efficiency",
      "Synergizes with ability-focused builds",
    ],
  },
};

function getCompanionBehaviorInfo(companionId: string): CompanionBehaviorInfo {
  return (
    COMPANION_BEHAVIOR_INFO[companionId] ?? {
      title: "Unknown Behavior",
      activation: "Ability",
      summary: "No behavior data is available for this companion yet.",
      effectStats: [],
      utilityBenefits: [],
    }
  );
}

// ---------------------------------------------------------------------------
// Progression preview (presentation only)
// ---------------------------------------------------------------------------

export interface CompanionLevelPreview {
  currentLevel: number;
  maxLevel: number;
  nextLevel: number;
  currentPower: number;
  /** Undefined when atCap — there is nothing meaningful to preview past the
   *  presentation cap (see the "atCap" doc below). */
  nextPower: number | undefined;
  /** True once the real stored level has reached/exceeded maxLevel. Real
   *  companion progress (e.g. Repair Drone's calibrated Level 60 default,
   *  preserved from the Loadout Manager phase) can legitimately exceed
   *  this screen's 20-level presentation cap — see the completion report's
   *  "Level handling" section. When true, the preview shows a "Max Level"
   *  state instead of a fabricated Level 61 comparison. */
  atCap: boolean;
}

export interface CompanionRankPreview {
  currentRank: number;
  maxRank: number;
  nextRank: number;
  atMaxRank: boolean;
}

/** Provisional, disclosed, non-transactional prototype formula — same
 *  status as companions.ts's own basePower/statContributions until a real
 *  Companion Upgrade economy design pass exists (see task §25). Never
 *  spent by this screen; the Upgrade button always opens an informational
 *  modal, never a transaction. Deliberately NOT derived from the
 *  reference's own "12,000 Credits + 20 Companion Data" figures, since
 *  those are static reference flavor for one companion at one level/rank
 *  and reproducing them verbatim for every companion/level/rank
 *  combination would misrepresent them as real, derived numbers. */
export interface CompanionUpgradeCostPreview {
  credits: number | null;
  companionData: number | null;
}

function formatBehaviorEffect(effect: CompanionUpgradeEffectValue): string {
  const value = effect.value.toLocaleString(undefined, {
    minimumFractionDigits: effect.precision,
    maximumFractionDigits: effect.precision,
  });
  if (effect.unit === "seconds") return `${value}s`;
  if (effect.unit === "percent") return `${value}%`;
  return value;
}

// ---------------------------------------------------------------------------
// Acquisition information (reuses the CompanionAcquisitionInfo shape
// companionRoster.ts already defined and exports — not a duplicate type)
// ---------------------------------------------------------------------------

// Reuses the CompanionAcquisitionInfo type companionRoster.ts already
// exports (imported above) — not redeclared here.

// All 6 companions share the same placeholder source — disclosed prototype
// content (the one real reference confirmation, Repair Drone's "Obtained
// from: Companion Crate", is reused for every companion rather than
// inventing 5 more distinct, unverifiable sources).
const COMPANION_SOURCE_LABEL = "Companion Crate";

export function getCompanionAcquisitionInfo(owned: boolean): CompanionAcquisitionInfo {
  if (owned) {
    return {
      sourceLabel: COMPANION_SOURCE_LABEL,
      unlockDescription: `Obtained from: ${COMPANION_SOURCE_LABEL}`,
    };
  }
  return {
    sourceLabel: COMPANION_SOURCE_LABEL,
    unlockDescription: `Locked. Source: ${COMPANION_SOURCE_LABEL}. Acquisition is not yet available in this build.`,
  };
}

// ---------------------------------------------------------------------------
// Current ship pairing
//
// Disclosed deviation from the reference's literal "BEST PAIRINGS" section
// (3 static ship cards with fabricated synergy bonuses like "+15% Healing
// Output") — reproducing that literally would require inventing a full
// ship x companion synergy matrix (20 ships x 6 companions) with no real
// data source anywhere in this codebase, directly conflicting with this
// task's own repeated "do not fabricate" instructions and its own,
// separately-specified §19 requirement to show the REAL current ship
// pairing via player.selectedShipId. This implementation follows §19's
// explicit, detailed, real-data requirement over the bitmap's literal
// "Best Pairings" content — see the completion report.
// ---------------------------------------------------------------------------

export interface CompanionPairedShipViewModel {
  shipId: string;
  name: string;
  rarity: ShipRarity;
  role: ShipRole;
  power: number;
  artwork: string | undefined;
}

export function getCompanionPairing(
  companion: CompanionDefinition,
  player: Pick<PlayerState, "selectedShipId" | "shipProgress" | "activeLoadout">,
  shipArtResolver: (shipId: string) => string | undefined,
): CompanionPairedShipViewModel | null {
  void companion; // pairing is about the real selected ship, not the companion itself
  const ship = getShipById(player.selectedShipId);
  if (!ship) return null;
  const level = player.shipProgress[ship.id]?.level ?? 1;
  return {
    shipId: ship.id,
    name: ship.name,
    rarity: ship.rarity,
    role: ship.role,
    power: calculateLoadoutShipContribution(ship, level),
    artwork: shipArtResolver(ship.id),
  };
}

// ---------------------------------------------------------------------------
// Return-target parsing — priority loadout > companions > home > (unknown
// or missing) companions. The Companion Detail screen's own fallback
// (unknown/missing `return` value → the Roster, not Home) is unchanged by
// the Fleet navigation correction. What changed is what "the Roster" means
// once you get there: CompanionDetailScreen's `resolveBackDestination` now
// sends the `"companions"` case to `#/inventory/companions?return=fleet`
// explicitly (rather than a bare `#/inventory/companions`), so the Roster's
// own Back button then correctly returns to Fleet (`#/ships`) rather than
// Home — see COMPANIONS_FLEET_NAVIGATION_FIX_REPORT.md. Companions Roster's
// own return-target fallback (getCompanionRosterReturnTarget in
// companionRoster.ts) also changed independently: its catch-all fallback is
// now "fleet", not "home".
// ---------------------------------------------------------------------------

export function getCompanionDetailReturnTarget(hash: string): CompanionDetailReturnTarget {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "companions";
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const ret = params.get("return");
  if (ret === "loadout") return "loadout";
  if (ret === "home") return "home";
  return "companions";
}

// ---------------------------------------------------------------------------
// Main view model
// ---------------------------------------------------------------------------

export interface CompanionDetailViewModel {
  id: string;
  name: string;
  role: CompanionRole;
  roleLabel: string;
  /** Same normalized filter category Companions Roster uses (attack/
   *  defense/repair/utility) — lets components look up the shared
   *  per-role icon/color from companionRoleStyle.ts without a lossy
   *  string transform of `roleLabel`. */
  roleFilterKey: Exclude<CompanionRosterFilter, "all">;
  rarity: ShipRarity;
  description: string;
  artwork: string | undefined;

  owned: boolean;
  equipped: boolean;

  level: number;
  maxLevel: number;
  rank: number;
  maxRank: number;
  power: number;

  behavior: CompanionBehaviorInfo;
  statRows: LoadoutStatContributionRow[];

  levelPreview: CompanionLevelPreview;
  rankPreview: CompanionRankPreview;
  upgradeCost: CompanionUpgradeCostPreview;

  pairedShip: CompanionPairedShipViewModel | null;
  acquisition: CompanionAcquisitionInfo;

  upgradeReady: boolean;
  rosterIndex: number;
}

export function getCompanionDetailViewModel(
  companionId: string,
  player: PlayerState,
  companionArtResolver: (artKey: string) => string | undefined,
  shipArtResolver: (shipId: string) => string | undefined,
): CompanionDetailViewModel | null {
  const companion = getCompanionById(companionId);
  if (!companion) return null;

  const owned = player.ownedCompanionIds.includes(companionId);
  const progress = getCompanionProgressOrDefault(companionId, player);
  const rank = progress.rank ?? 0;
  const quote = calculateCompanionUpgradeQuote(companion, progress);
  const power = quote.currentPower;
  const contributions = calculateCompanionStatContributions(companion, progress);
  const statRows = buildStatContributionRows(contributions).filter((row) => contributions[row.key] !== 0);
  const upgradeReady =
    owned &&
    !quote.atMaxLevel &&
    quote.creditsCost !== null &&
    quote.companionDataCost !== null &&
    player.currencies.coins >= quote.creditsCost &&
    player.materials.companionData >= quote.companionDataCost;

  const atCap = quote.atMaxLevel;
  const nextLevel = quote.nextLevel ?? COMPANION_MAX_LEVEL;
  const levelPreview: CompanionLevelPreview = {
    currentLevel: quote.currentLevel,
    maxLevel: COMPANION_MAX_LEVEL,
    nextLevel,
    currentPower: quote.currentPower,
    nextPower: quote.nextPower ?? undefined,
    atCap,
  };

  const atMaxRank = rank >= COMPANION_MAX_RANK;
  const rankPreview: CompanionRankPreview = {
    currentRank: rank,
    maxRank: COMPANION_MAX_RANK,
    nextRank: Math.min(rank + 1, COMPANION_MAX_RANK),
    atMaxRank,
  };

  const baseBehavior = getCompanionBehaviorInfo(companion.id);
  const effectByLabel = new Map(quote.currentEffects.map((effect) => [effect.label.toLowerCase(), effect]));
  const behavior: CompanionBehaviorInfo = {
    ...baseBehavior,
    effectStats: baseBehavior.effectStats.map((stat) => {
      const effect = effectByLabel.get(stat.label.toLowerCase());
      return effect ? { ...stat, value: formatBehaviorEffect(effect) } : stat;
    }),
  };

  return {
    id: companion.id,
    name: companion.name,
    role: companion.role,
    roleLabel: ROLE_DISPLAY_LABEL[companion.role],
    roleFilterKey: COMPANION_ROLE_FILTER_KEY[companion.role],
    rarity: companion.rarity,
    description: companion.description,
    artwork: companionArtResolver(companion.artKey),
    owned,
    equipped: owned && companion.id === player.activeLoadout.companionId,
    level: progress.level,
    maxLevel: COMPANION_MAX_LEVEL,
    rank,
    maxRank: COMPANION_MAX_RANK,
    power,
    behavior,
    statRows,
    levelPreview,
    rankPreview,
    upgradeCost: { credits: quote.creditsCost, companionData: quote.companionDataCost },
    pairedShip: getCompanionPairing(companion, player, shipArtResolver),
    acquisition: getCompanionAcquisitionInfo(owned),
    upgradeReady,
    rosterIndex: COMPANIONS.findIndex((c) => c.id === companion.id),
  };
}

// ---------------------------------------------------------------------------
// Prev/next companion cycling (task §26 — no arrows/carousel are visible
// anywhere in 18_Companion_Detail.png's single-companion static bitmap, so
// per the task's own "if arrows are absent from the reference, do not
// invent them" instruction, no UI cycling control is rendered. These pure
// helpers are still provided so the capability exists centrally rather
// than being scattered, in case a future phase adds the control — nothing
// in this phase's UI calls them.)
// ---------------------------------------------------------------------------

export function getNextCompanionId(companionId: string): string | null {
  const index = COMPANIONS.findIndex((c) => c.id === companionId);
  if (index === -1) return null;
  return COMPANIONS[(index + 1) % COMPANIONS.length].id;
}

export function getPreviousCompanionId(companionId: string): string | null {
  const index = COMPANIONS.findIndex((c) => c.id === companionId);
  if (index === -1) return null;
  return COMPANIONS[(index - 1 + COMPANIONS.length) % COMPANIONS.length].id;
}
