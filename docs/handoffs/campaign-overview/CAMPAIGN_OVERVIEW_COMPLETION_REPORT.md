# Campaign Overview — Completion Report

Scope: Campaign Overview screen only, per the approved plan. Chapter Map redesign and every later screen are untouched.

## Files created

- `src/data/campaignOverview.ts` — reference-matching prototype data: 5 chapter cards, the selected-chapter detail block, total-stars figure, 5 reward milestones, coming-soon chapters. Explicitly commented as prototype data to connect to real progression later.
- `src/screens/campaign/CampaignOverviewScreen.tsx` / `.css` — the screen itself.
- `src/components/campaign/ChapterCard.tsx` / `.css` — one carousel card, three distinct footer layouts (cleared/current/locked).
- `src/components/campaign/ChapterCarousel.tsx` / `.css` — horizontal scroll wrapper, hidden scrollbar, scrolls Chapter 2 into view on mount.
- `src/components/campaign/ChapterProgressRail.tsx` / `.css` — the connector rail beneath the carousel.
- `src/components/campaign/ChapterDetailPanel.tsx` / `.css` — the large selected-chapter feature panel.
- `src/components/campaign/ChapterStarRewardsTrack.tsx` / `.css` — the 5-chest milestone strip.
- `src/components/campaign/TotalStarsPanel.tsx` / `.css` — the account-wide stars side panel.
- `src/components/campaign/ComingSoonChapterStrip.tsx` / `.css` — the locked future-chapter chip row.

## Files modified

- `src/app/routes.tsx` — `"campaign"` now points at `CampaignOverviewScreen`; added `"campaign-chapter-map"` (`#/campaign/chapter-map`) for the relocated legacy screen.
- `src/app/App.tsx` — renders `CampaignOverviewScreen` for `"campaign"`, the existing `CampaignScreen` for `"campaign-chapter-map"`.
- `src/components/layout/AppShell.tsx` — added `"campaign"` to the shared-`BottomNavigation` suppression list (same reason as Battle Hub: it renders its own `HubBottomNav`). `"campaign-chapter-map"` was deliberately left out of that list, since the legacy screen still uses the old shared header/nav as it always has.
- `src/components/icons/BattleModeIcon.tsx` — added a `check` variant (coded SVG checkmark) for the cleared-chapter badge and progress-rail node.

**`src/screens/campaign/CampaignScreen.tsx`/`.css` themselves were not touched** — only moved via routing, exactly as instructed. `src/data/campaign.ts` (the real single-chapter stage data) is also untouched.

## Components reused as-is

`HubScreenShell`, `HubHeader`, `HubBottomNav` (all three untouched — not modified in any way), `ScreenHeader`, `PrimaryButton`, `SecondaryButton`, `StatRow`, `BattleModeIcon` (existing variants: `star`, `swords`, `target`, `mapPin`, `lock`, `chevron`), `LockedContentModal`, `usePlayerStore`, `navigate`.

## Components created

`ChapterCard`, `ChapterCarousel`, `ChapterProgressRail`, `ChapterDetailPanel`, `ChapterStarRewardsTrack`, `TotalStarsPanel`, `ComingSoonChapterStrip` — all under `src/components/campaign/`, as specified.

## Assets used

`CHAPTER_BACKGROUND_IMAGE["chapter-01"]`, `MODE_ILLUSTRATION.campaign`, `REWARD_CHEST.basic/rare/epic/legendary`, `BattleModeIcon` coded variants (`star`, `swords`, `target`, `mapPin`, `lock`, `chevron`, `check`). No hard-coded scattered paths — everything through `assetRegistry.ts` or the icon component.

## Chapter-art substitutions (disclosed, as required)

Only two chapter-scale illustrations exist in the project, for five needed chapter cards plus the detail-panel illustration:

- **Chapter 1 (Veil Sector, cleared):** `chapter_01_void_frontier.png`, unfiltered.
- **Chapter 2 (Shattered Nebula, current):** `MODE_ILLUSTRATION.campaign`, unfiltered — a genuine match, already approved for this exact scene on Battle Hub.
- **Chapter 3 (Iron Reach, locked):** `chapter_01_void_frontier.png` again, with `hue-rotate(45deg) saturate(1.4) brightness(0.85)` (shifted warm/amber).
- **Chapter 4 (Void Frontier, locked):** `MODE_ILLUSTRATION.campaign` again, with `hue-rotate(-45deg) saturate(1.3) brightness(0.85)` (shifted toward blue-violet).
- **Chapter 5 (Dread Regime, locked):** `chapter_01_void_frontier.png` again, with `hue-rotate(300deg) saturate(1.7) brightness(0.75)` (shifted red).

This is the single biggest fidelity gap on this screen — the reference shows five genuinely distinct illustrations, and this substitution fakes visual distinction via CSS color grading rather than real distinct art. Locked cards are not darkened to black; art stays visible per instruction.

## Reward-chest mapping

10★ basic (claimed) · 20★ rare (upcoming) · 30★ rare (highlighted/visually enlarged — matches the reference's own emphasis on this specific milestone, not the nearest-unclaimed one) · 40★ epic (upcoming) · 50★ legendary (locked, the only chest with an explicit padlock badge). `rare` repeats once since only 4 chest tiers exist in the registry for 5 slots.

## Chapter 1 detail-panel content (disclosed assumption)

The reference only ever shows Chapter 2 selected, so it has no specified copy for Chapter 1's detail panel. Since both Chapter 1 and Chapter 2 are selectable per instruction, Chapter 1 got reasonable placeholder detail content (fully-cleared stage count 10/10, a generic description, an estimated recommended power) rather than reference-matched values — flagged here since it wasn't visually verifiable against the source image.

## Routes and navigation behavior

- `#/campaign` → `CampaignOverviewScreen` (was the legacy stage list).
- `#/campaign/chapter-map` → the unmodified legacy `CampaignScreen` (temporary Chapter Map stand-in).
- Battle Hub's Campaign card ("Chapter Map" and "Continue" buttons) already called `navigate("campaign")` — zero changes needed there; it now opens Campaign Overview automatically, which is the correct flow (Battle Hub → Campaign Overview → Chapter Map).
- Campaign Overview's own "CHAPTER MAP" button and the detail panel's "OPEN CHAPTER" button both call `navigate("campaign-chapter-map")`.
- Chapter 1 and Chapter 2 cards select locally (update the detail panel below, no navigation). Chapters 3–5 and all Coming Soon chips open `LockedContentModal`. Reward-chest taps and the "Star Rewards" button also open `LockedContentModal` (no rewards-detail screen exists yet).
- Bottom nav: `HubBottomNav active="battle"` — Battle stays highlighted, matching the reference and the navigation map's documented behavior for the whole campaign flow.

## Responsive behavior

Same convention as Battle Hub: content scrolls inside `HubScreenShell`'s hidden-scrollbar middle row; the chapter carousel additionally scrolls horizontally (its own hidden scrollbar, `overflow-x: auto`), independent of the page's vertical scroll. Card widths have an explicit minimum (132px, 148px for the current card) with a small reduction under 359px width rather than compressing indefinitely. Coming-soon chips and the reward track also scroll/wrap gracefully at 360px width.

## Remaining visual differences (known, not chased further)

- The chapter-art substitution above (biggest gap).
- Chapter 1's detail-panel copy is a placeholder, not reference-matched.
- The reward track's exact chest artwork scale/spacing is an approximation of the reference's proportions, not a pixel measurement.

## Verification

- `tsc -b --noEmit`: clean.
- `vite build`: succeeds (121 modules, up from Battle Hub's 104 — the 17 new campaign files).
- `HomeScreen.tsx`/`.css`: unchanged (confirmed via file size/mtime — same as before this task).
- `BattleHubScreen.tsx`/`.css`: unchanged (confirmed via file size/mtime).
- `HubHeader`/`HubBottomNav`/`HubScreenShell` (`.tsx` and `.css`, all three): unchanged (confirmed via file size/mtime — none were re-touched this session).
- Legacy `CampaignScreen.tsx`/`.css`: unchanged (mtime from original creation, untouched this whole project).
- `data/campaign.ts`: unchanged.
- Traced the route chain for both `#/campaign` and `#/campaign/chapter-map` through `routes.tsx` → `App.tsx` → `AppShell.tsx`'s nav-suppression logic — no double bottom nav on Campaign Overview, legacy screen keeps its original shared nav.

## What I still can't do here

Same disclosed sandbox limitation as the last three rounds: no headless browser available (no root, network allowlist blocks Chromium download), so this is a manual structural/property review against `05_Campaign_Overview.png`, not a rendered pixel diff. If you want a live check, the `npm run dev` + Chrome-extension path is still open.

---

Stopping here per instruction. Not starting Campaign Chapter Map until this is approved.
