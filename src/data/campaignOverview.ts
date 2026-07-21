// Reference-matching prototype UI data for the Campaign Overview screen
// (05_Campaign_Overview.png). This is deliberately separate from the real
// `data/campaign.ts` (today's single "Fractured Frontier" chapter, used by
// actual stage/gameplay logic) — the same "prototype data, connect to real
// progression later" pattern already used by `data/battleHub.ts`. Values
// below are copied verbatim from the approved reference, not estimated.

export type ChapterOverviewStatus = "cleared" | "current" | "locked";

export interface ChapterOverviewCard {
  id: string;
  chapterIndex: number;
  name: string;
  status: ChapterOverviewStatus;
  stars: number;
  starsMax: number;
  /** Only the current/active chapter shows a "Stage X of 10" line on its
   *  carousel card, per the reference. */
  stageLabel?: string;
}

export const CAMPAIGN_OVERVIEW_CHAPTERS: ChapterOverviewCard[] = [
  { id: "chapter-01", chapterIndex: 1, name: "Veil Sector", status: "cleared", stars: 30, starsMax: 30 },
  {
    id: "chapter-02",
    chapterIndex: 2,
    name: "Shattered Nebula",
    status: "current",
    stars: 17,
    starsMax: 30,
    stageLabel: "Stage 7 of 10",
  },
  { id: "chapter-03", chapterIndex: 3, name: "Iron Reach", status: "locked", stars: 0, starsMax: 30 },
  { id: "chapter-04", chapterIndex: 4, name: "Void Frontier", status: "locked", stars: 0, starsMax: 30 },
  { id: "chapter-05", chapterIndex: 5, name: "Dread Regime", status: "locked", stars: 0, starsMax: 30 },
];

export interface ChapterOverviewDetail {
  chapterLabel: string;
  name: string;
  description: string;
  chapterStars: { current: number; max: number };
  recommendedPower: number;
  currentStage: { current: number; max: number };
}

// The reference's selected/detail panel always reflects Chapter 2
// (Shattered Nebula) on load — matches the carousel's "current" card above.
export const CAMPAIGN_OVERVIEW_SELECTED_DETAIL: ChapterOverviewDetail = {
  chapterLabel: "CHAPTER 2",
  name: "SHATTERED NEBULA",
  description:
    "The nebula hides ancient powers and scattered fleets. Push through the chaos and sever the enemy’s supply routes.",
  chapterStars: { current: 17, max: 30 },
  recommendedPower: 11900,
  currentStage: { current: 7, max: 10 },
};

// Chapter 1 is also selectable (cleared chapters remain tappable per
// instruction) but the reference only ever shows Chapter 2 selected, so it
// doesn't specify Chapter 1's own detail copy. This is a reasonable
// placeholder (fully-cleared stage count, generic description) rather than
// a reference-matched value — flagged here and in the completion report.
export const CAMPAIGN_OVERVIEW_CHAPTER_DETAILS: Record<string, ChapterOverviewDetail> = {
  "chapter-01": {
    chapterLabel: "CHAPTER 1",
    name: "VEIL SECTOR",
    description: "The Armada's first stand at the edge of known space — fully cleared, all stars collected.",
    chapterStars: { current: 30, max: 30 },
    recommendedPower: 8200,
    currentStage: { current: 10, max: 10 },
  },
  "chapter-02": CAMPAIGN_OVERVIEW_SELECTED_DETAIL,
};

// Account-wide milestone track — distinct from the 17/30 per-chapter stars
// above. The reference shows 17/150 here; this total is not derived from
// the per-chapter 10/20/30 chest rules in GAME_DESIGN_SYSTEMS_BLUEPRINT.md
// §13.3 (a separate, per-chapter system) — it's its own Overview-screen
// account-progression figure, kept as its own reference-matching value
// rather than computed, since the source material doesn't define how the
// two systems reconcile.
export const CAMPAIGN_OVERVIEW_TOTAL_STARS = { current: 17, max: 150 };

// Four states, matching the reference precisely rather than a generic
// claimed/current/locked pattern: "claimed" (10★, already passed and
// collected — checkmark badge), "upcoming" (20★/40★, not yet reached, plain
// star-preview badge, no special emphasis), "highlighted" (30★ — the
// reference draws this one visibly larger/gold, the "current target" chest
// per the approved plan, independent of whether it's the nearest
// milestone), and "locked" (50★ — the only chest the reference marks with
// an explicit padlock badge, not just "not yet reached").
export type ChapterStarRewardState = "claimed" | "upcoming" | "highlighted" | "locked";

export interface ChapterStarRewardMilestone {
  stars: number;
  chestTier: "basic" | "rare" | "epic" | "legendary";
  state: ChapterStarRewardState;
}

// Chest-tier mapping from the approved plan: only 4 chest tiers exist in
// the asset registry for 5 milestone slots, so "rare" repeats once.
export const CAMPAIGN_OVERVIEW_STAR_REWARDS: ChapterStarRewardMilestone[] = [
  { stars: 10, chestTier: "basic", state: "claimed" },
  { stars: 20, chestTier: "rare", state: "upcoming" },
  { stars: 30, chestTier: "rare", state: "highlighted" },
  { stars: 40, chestTier: "epic", state: "upcoming" },
  { stars: 50, chestTier: "legendary", state: "locked" },
];

export interface ComingSoonChapter {
  chapterIndex: number;
  label: string;
}

// Reference shows Chapters 6, 7, 8, a pagination-dots gap, then Chapter 15
// — implying Chapters 9-14 exist but are paged/hidden, not individually
// rendered. Matches "15 planned chapter positions" / "Chapters 1-5 at
// public launch" from SCREEN_NAVIGATION_MAP.md (B-02) and
// GAME_DESIGN_SYSTEMS_BLUEPRINT.md §13.1.
export const CAMPAIGN_OVERVIEW_COMING_SOON: ComingSoonChapter[] = [
  { chapterIndex: 6, label: "Unknown Sector" },
  { chapterIndex: 7, label: "Unknown Sector" },
  { chapterIndex: 8, label: "Unknown Sector" },
  { chapterIndex: 15, label: "Unknown Sector" },
];

export const CAMPAIGN_OVERVIEW_COMING_SOON_PAGINATION_DOTS = 3;
