# Campaign Chapter Map — Completion Report

Scope: Campaign Chapter Map screen and the minimal temporary Stage Detail placeholder, per the approved plan. Real Stage Detail is not built.

## Files created

- `src/data/campaignChapterMap.ts` — reference-matching prototype data: chapter info, 3 intro rewards, 3-chest track, 10 stage nodes.
- `src/components/campaign-map/ChapterMapHeaderBar.tsx` / `.css` — back button, "Chapter 2 / Shattered Nebula" title, info button.
- `src/components/campaign-map/ChapterMapIntroPanel.tsx` / `.css` — flavor text, chapter rewards, art, "View Rewards" button.
- `src/components/campaign-map/ChapterStarChestTrack.tsx` / `.css` — 17/30 stars + 3-chest milestone row.
- `src/components/campaign-map/StageMapPath.tsx` / `.css` — two-column stage path with connectors.
- `src/components/campaign-map/StageNode.tsx` / `.css` — one coded stage node (octagon or boss-crest variant).
- `src/screens/campaign/CampaignChapterMapScreen.tsx` / `.css` — the screen itself.
- `src/screens/campaign/StageDetailPlaceholderScreen.tsx` / `.css` — the temporary stage-tap destination.

## Files modified

- `src/app/routes.tsx` — added `"campaign-chapter-map-legacy"` (`#/campaign/chapter-map/legacy`) and `"stage-detail-placeholder"` (`#/campaign/stage-detail`) to `RouteId`/`ROUTES`/`HASH_TO_ROUTE`. `resolveRoute` now strips a `?...` suffix before its exact-match lookup (backward compatible — no existing hash uses `?`), so the Chapter Map can carry a selected stage id without the router needing real param syntax.
- `src/app/App.tsx` — `"campaign-chapter-map"` now renders `CampaignChapterMapScreen` (was the legacy screen); added `"campaign-chapter-map-legacy"` → `CampaignScreen`, `"stage-detail-placeholder"` → `StageDetailPlaceholderScreen`.
- `src/components/layout/AppShell.tsx` — added `"campaign-chapter-map"` and `"stage-detail-placeholder"` to the shared-`BottomNavigation` suppression list (both render their own `HubBottomNav`). The legacy route is intentionally left out, unchanged.
- `src/components/icons/BattleModeIcon.tsx` — added `search` (magnifying glass) and `info` (circled "i") variants, same coded-SVG convention as the existing 11.

**Not touched:** `HomeScreen`, `BattleHubScreen`, `CampaignOverviewScreen`, `HubHeader`, `HubBottomNav`, `HubScreenShell`, `data/campaign.ts`, `CampaignScreen.tsx`/`.css` (only relocated via routing), gameplay code.

## Components reused as-is

`HubScreenShell`, `HubHeader`, `HubBottomNav`, `SecondaryButton`, `LockedContentModal`, `usePlayerStore`, `navigate`/`pathFor`.

## Components created

`ChapterMapHeaderBar`, `ChapterMapIntroPanel`, `ChapterStarChestTrack`, `StageMapPath`, `StageNode` — all under `src/components/campaign-map/`.

## Assets used

`MODE_ILLUSTRATION.campaign` (intro panel art — the same Chapter 2 scene already approved on Battle Hub and Campaign Overview, not the reference screenshot itself), `RESOURCE_ICON.crystals`/`.credits` (intro reward icons), `REWARD_CHEST.legendary`/`.epic`/`.basic` (chest track), `BattleModeIcon` variants `chevron` (back button, rotated), `check`, `star`, plus the 2 new `search`/`info` variants.

## Coded icons added

`search` (circle + diagonal handle) and `info` (circled "i", coded as a circle outline + dot + stem) — both follow the existing `currentColor`, no-emoji convention.

## Stage-state data

All 10 stages stored exactly as specified: 1–6 completed (3/3 stars), 7 current (3/3 stars, "Current" tag), 8 locked (2/3), 9 locked (1/3), 10 locked boss (1/3) — reference-literal values kept even where they don't follow strict unlock logic, commented in `campaignChapterMap.ts` as temporary data to be replaced by real progression later. Stages 8/9 render with the reference's dim/muted border only — no lock badge was added inside those nodes.

## Chest mapping

10★ → `legendary` (claimed, green check) · 20★ → `epic` (claimable, cyan "Claim") · 30★ → `basic` (locked, gray "Locked") — reference-literal reversed-rarity order, not "corrected."

## Route changes

- `#/campaign/chapter-map` → `CampaignChapterMapScreen` (was legacy `CampaignScreen`).
- `#/campaign/chapter-map/legacy` (new) → legacy `CampaignScreen`, unlinked from any UI, comparison-only.
- `#/campaign/stage-detail` (new) → `StageDetailPlaceholderScreen`; the tapped stage id rides as `?id=<stageId>` on the hash.
- Back button → `navigate("campaign")`. Battle Hub's and Campaign Overview's own navigation calls were not touched — both already pointed at `"campaign"`/`"campaign-chapter-map"` correctly.

## Placeholder behavior

`StageDetailPlaceholderScreen` shows only: the stage number (read from the `?id=` hash suffix), "Stage Detail Coming Soon," a short message, and a "Back to Chapter Map" button — wrapped in the same shared `HubScreenShell`/`HubHeader`/`HubBottomNav` (Battle tab active) for visual consistency with the rest of the flow. No gameplay, rewards, loadout, objectives, or Pre-Battle content.

## Locked-stage behavior

Stages 8/9 tap → `LockedContentModal` with "Clear Stage N to unlock Stage N+1." Stage 10 tap → `LockedContentModal` with boss-specific copy ("Clear Stage 9 to challenge the Stage 10 boss."). Chest taps: claimed → "already claimed" message; claimable → "claiming isn't wired up yet"; locked → "reach N stars" message. All reuse the same `LockedContentModal` shell, consistent with Campaign Overview's own precedent.

## Responsive behavior

Every new outer container (`chapter-map__content`, `chapter-map-header-bar`, `chapter-map-intro-panel`, `chest-track`, `stage-map-path`, both stage columns, `stage-detail-placeholder__content`) carries `width:100%; max-width:100%; min-width:0; box-sizing:border-box;`, and the two flex-based components at real risk of the Campaign Overview bug class (`stage-map-path`'s columns, `chest-track`'s row) explicitly set `min-width:0` on every flex child. No `width:100vw` is used anywhere. The stage columns use `flex:1 1 0; min-width:0` with a fixed-width (18px) decorative bridge between them, so neither column can be forced wider than its fair share by its content — node badges are fixed-size (52px/68px) and row labels use `overflow:hidden; text-overflow:ellipsis` rather than forcing width. A `max-width:359px` breakpoint shrinks node/connector/font sizes further for narrow phones. I traced this by hand against the exact bug mechanism fixed on Campaign Overview (flex item `min-width:auto` floors) rather than by measuring a live render — same disclosed sandbox limitation as every prior round (no headless browser available here). If you run this locally, worth a real check at 412×915 / 390×844 / 360×800 and your own device width to confirm.

## Remaining visual differences (known, not chased further)

- Stage-node and boss-crest shapes are coded CSS clip-paths approximating the reference's illustrated badges, not pixel-matched artwork (same substitution precedent as `ChapterCard`).
- The connector geometry (rounded bridge between column 1 and column 2) is a simplified single vertical bar with rounded end-caps, not a pixel trace of the reference's exact routed line.
- Chest tier colors are matched by visual comparison against the actual `REWARD_CHEST` art, not a pixel color-pick.

## Type-check result

`tsc -b --noEmit`: clean, no errors.

## Build result

`vite build`: succeeds, 136 modules (up from Campaign Overview's 121 — the 15 new files here).

## Confirmations

- `HomeScreen.tsx`/`.css`: unchanged (file size/mtime unchanged from before this session).
- `BattleHubScreen.tsx`/`.css`: unchanged.
- `CampaignOverviewScreen.tsx`/`.css`: unchanged.
- `HubHeader`/`HubBottomNav`/`HubScreenShell` (`.tsx` and `.css`, all three): unchanged.
- Legacy `CampaignScreen.tsx`/`.css` and `data/campaign.ts`: unchanged, only relocated via routing.

## What I still can't do here

Same disclosed sandbox limitation as every previous round: no headless browser available (no root access, Chromium download blocked by the network allowlist), so this is a structural/property-level review against `06_Campaign_Chapter_Map.png`, not a rendered pixel diff. The `npm run dev` + Chrome-extension path remains open for a live check.

---

Stopping here per your instruction. Not starting the real Campaign Stage Detail screen.
