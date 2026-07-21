# Campaign Stage Detail — Completion Report

Scope: the real Campaign Stage Detail screen and a minimal temporary Pre-Battle placeholder, per the approved plan and stated defaults. Real Pre-Battle is not built.

## Files created

- `src/data/campaignStageDetail.ts` — Stage 7's reference-matched content (mission info, objectives, rewards, loadout) plus `getStageDetailContent()`, which falls back to the same shape with number/name substituted for every other stage.
- `src/components/stage-detail/StageMissionPanel.tsx` / `.css` — chapter/stage name, description, Energy Cost, 2×2 stat grid, background art.
- `src/components/stage-detail/StageObjectiveRow.tsx` / `.css` — one star-objective row.
- `src/components/stage-detail/StageRewardItem.tsx` / `.css` — one reward icon + amount.
- `src/components/stage-detail/StageRewardsRow.tsx` / `.css` — First Clear / Repeat two-column layout.
- `src/components/stage-detail/StageLoadoutPanel.tsx` / `.css` — ship + companion + Total Power.
- `src/screens/campaign/CampaignStageDetailScreen.tsx` / `.css` — the screen itself.
- `src/screens/campaign/PreBattlePlaceholderScreen.tsx` / `.css` — temporary "Prepare" destination.

## Files modified

- `src/app/routes.tsx` — renamed the placeholder's old route id (`stage-detail-placeholder`) to `stage-detail`, now pointing at the real screen; added `stage-detail-legacy-placeholder` (`#/campaign/stage-detail/legacy-placeholder`) for the relocated old placeholder; added `pre-battle-placeholder` (`#/campaign/pre-battle`).
- `src/app/App.tsx` — `"stage-detail"` now renders `CampaignStageDetailScreen`; added `"stage-detail-legacy-placeholder"` → `StageDetailPlaceholderScreen`, `"pre-battle-placeholder"` → `PreBattlePlaceholderScreen`.
- `src/components/layout/AppShell.tsx` — added the 3 new/renamed routes to the shared-`BottomNavigation` suppression list (all three render their own `HubBottomNav`).
- `src/components/icons/BattleModeIcon.tsx` — added `gift` (View Rewards) and `refresh` (Change Loadout) variants.
- `src/screens/campaign/CampaignChapterMapScreen.tsx` — **one-line change only**: its `pathFor("stage-detail-placeholder")` call updated to `pathFor("stage-detail")`, since that route id was renamed. No structural or visual change — confirmed by file size/mtime (CSS untouched, `.tsx` only touched at this one line plus its adjacent comment).

**Not touched:** `HomeScreen`, `BattleHubScreen`, `CampaignOverviewScreen`, `HubHeader`, `HubBottomNav`, `HubScreenShell`, real campaign/gameplay data, `StageDetailPlaceholderScreen.tsx`/`.css` (only relocated via routing).

## Components reused as-is

`HubScreenShell`, `HubHeader`, `HubBottomNav`, `ScreenHeader`, `IconButton`, `PrimaryButton`, `SecondaryButton`, `StatRow`, `LockedContentModal`, `usePlayerStore`, `navigate`/`pathFor`.

## Components created

`StageMissionPanel`, `StageObjectiveRow`, `StageRewardItem`, `StageRewardsRow`, `StageLoadoutPanel` — all under `src/components/stage-detail/`.

## Assets used

`RESOURCE_ICON.crystals`/`.credits`, `REWARD_CHEST.epic`, `MATERIAL_ICON.universalFragment`/`.reviveToken`, `SHIP_ROSTER_ART["ship-01-rapid-fire"]`, `COMPANION_ART.missileDrone`, `CHAPTER_BACKGROUND_IMAGE["chapter-01"]`, `BattleModeIcon` variants `chevron` (back, rotated), `swords`, `star`, `calendar` (Fastest Clear), `energy`, `check`, plus the 2 new `gift`/`refresh` variants.

## Coded icons added

`gift` (box + ribbon, for View Rewards) and `refresh` (two curved arrows, for Change Loadout) — same coded-SVG, no-emoji convention as the existing 13.

## Disclosed substitutions (per approved defaults)

- **Mission panel background art:** `CHAPTER_BACKGROUND_IMAGE["chapter-01"]`, not `MODE_ILLUSTRATION.campaign`. Opening the latter directly showed it's a small circular badge/emblem, not a wide battle scene — it would look soft blown up across this panel. `chapter_01_void_frontier` is genuine wide-format hero art and the closer structural fit, reused here for a Chapter 2 stage same as the reuse-with-disclosure pattern already used elsewhere in this project.
- **"20" first-clear reward icon:** `MATERIAL_ICON.universalFragment` (purple/gold faceted gem) substituting for the reference's purple/gold rounded-triangle material — closest available by color/palette, not by silhouette.
- **"5" repeat-reward icon:** `MATERIAL_ICON.reviveToken` (blue circular cross badge) substituting for the reference's red/orange cylindrical vial — the weakest match on this screen, used only because no red/cylindrical material exists in the approved set; matched by theme (a consumable/support material for a "repeat reward"), not appearance.
- **Chest tier:** `REWARD_CHEST.epic` for the reference's purple ornate chest — closest of the 4 tiers by color/ornamentation.
- **Loadout ship art:** `SHIP_ROSTER_ART["ship-01-rapid-fire"]` for "Void Reaper" (a prototype name, not a real ship — closest silhouette/color match among the 5 available roster images).
- **Loadout companion art:** `COMPANION_ART.missileDrone` for "Rapid Drone" (also a prototype name — closest palette match among the 6 companions).

## Stage-state data

Only Stage 7 (Chapter 2, "Nebula Breach") has reference-matched content, per the approved default. `getStageDetailContent()` returns that content verbatim for `stage-7`; every other stage id gets the same layout with its own number substituted, a generic "Stage N" name, and placeholder mission-briefing copy — flagged both in code comments and with an on-screen dashed-border notice ("Prototype layout — this stage reuses Stage 7's reference-matched design...") so it's visibly distinguishable from the one true reference-matched stage. Objective rows show no completion state anywhere (matches the reference exactly — Stage 7 shows all 3 rows identically, no per-row checkmark), though `StageObjectiveRow` accepts an optional `completed` prop for future use.

## Chest/reward mapping

Covered under Disclosed substitutions above — First Clear: 250 crystals · 75K credits · 1 epic chest · 20 universal fragments. Repeat: 30K credits · 100 crystals · 5 revive tokens.

## Route changes

- `#/campaign/stage-detail` → now `CampaignStageDetailScreen` (was the placeholder).
- `#/campaign/stage-detail/legacy-placeholder` (new) → the original `StageDetailPlaceholderScreen`, unlinked, comparison-only.
- `#/campaign/pre-battle` (new) → `PreBattlePlaceholderScreen`, carrying the same `?id=` stage suffix.
- Chapter Map's stage taps (`CampaignChapterMapScreen.tsx`) now land on the real screen with no other behavior change.

## Placeholder behavior

`PreBattlePlaceholderScreen` mirrors the same bare treatment `StageDetailPlaceholderScreen` had one step ago: stage context (read from the `?id=` hash suffix), a clearly-labeled "Pre-Battle Coming Soon" message, and a "Back to Stage Detail" button. No loadout review, Energy confirmation, or gameplay launch — does not route into gameplay anywhere.

## Locked-stage behavior

Unchanged — locked stages (8/9/10) on the Chapter Map still open `LockedContentModal` directly and never reach Stage Detail at all, per the existing `handleSelectStage` logic in `CampaignChapterMapScreen.tsx` (not modified this round beyond the one route-id rename).

## Responsive behavior

Every new outer container (`stage-detail__content`, `stage-mission-panel`, `stage-detail__objectives`, `stage-rewards-row` and its two groups, `stage-loadout-panel`, `pre-battle-placeholder__content`) carries `width:100%; max-width:100%; min-width:0; box-sizing:border-box;`. The two sections most at risk of the Campaign Overview overflow bug class: `StageRewardsRow` stacks to a single column under 420px width (its two reward groups no longer fit side by side at real phone widths — 4+3 fixed-content items need more room than a 360-412px screen affords two columns of), and `StageLoadoutPanel`'s ship/companion/total-power row uses `flex-wrap` so it reflows to multiple rows automatically rather than being forced wider than its container. No `width:100vw` is used anywhere. Reasoned through by hand against the exact mechanism fixed on Campaign Overview (flex/grid item `min-width:auto` floors) rather than measured on a live render — same disclosed sandbox limitation as every prior round (no headless browser available here).

## Remaining visual differences (known, not chased further)

- All 6 disclosed asset substitutions above.
- The mission panel's stat grid, objectives panel, and rewards row are coded panels approximating the reference's exact proportions, not pixel-matched.
- "Best Grade" renders as a plain styled letter (no dedicated grade-badge asset).

## Type-check result

`tsc -b --noEmit`: clean, no errors.

## Build result

`vite build`: succeeds, 151 modules (up from Chapter Map's 136 — the 15 new files here).

## Confirmations

- `HomeScreen.tsx`/`.css`: unchanged (file size/mtime unchanged from before this session).
- `BattleHubScreen.tsx`/`.css`: unchanged.
- `CampaignOverviewScreen.tsx`/`.css`: unchanged.
- `CampaignChapterMapScreen.css`: unchanged; `.tsx` shows only the single disclosed `pathFor` line change.
- `HubHeader`/`HubBottomNav`/`HubScreenShell` (`.tsx` and `.css`, all three): unchanged.
- `StageDetailPlaceholderScreen.tsx`/`.css`: unchanged, only relocated via routing.
- Battle remains the active bottom-nav tab on every screen in this flow (`HubBottomNav active="battle"` throughout).

## What I still can't do here

Same disclosed sandbox limitation as every previous round: no headless browser available, so this is a structural/property-level review against `07_Campaign_Stage_Detail.png`, not a rendered pixel diff. The `npm run dev` + Chrome-extension path remains open for a live check.

---

Stopping here per your instruction. Not starting the real Pre-Battle screen until you've reviewed this.
