# Fleet / Companions Roster Alignment — Correction Report

## 1. Summary

Fixed the vertical/horizontal alignment mismatch between Fleet Roster and Companions Roster's title/category-selector regions, and removed the redundant Back-arrow button from Companions Roster's normal Fleet-flow layout. Both screens now render one shared component, `FleetCollectionHeader`, for the entire title-and-selector region — so the `FleetCategoryTabs` selector lands at an identical vertical and horizontal position on both screens by construction, not by matching separately-tuned margins. Fleet's excess top whitespace (previously from the generic `ScreenHeader` component's own extra top padding) is gone; both titles are centered; the Companions Back-arrow is removed from the normal flow (the shared selector's `SHIPS` tab now performs that same function). No screen was redesigned beyond this shared title/selector region; no route, store, or data logic was touched.

## 2. Root cause of the alignment mismatch

Three independent, additive causes:
1. **Different top-padding sources.** Fleet Roster used the generic `<ScreenHeader>` component, whose own CSS adds `padding: var(--space-5) var(--space-4) var(--space-3)` (20px top) *on top of* `.fleet-roster__content`'s own 16px top padding — 36px total before the `FLEET` heading. Companions Roster's `<CompanionsRosterTitle>` added no padding of its own beyond `.companions-roster__content`'s 16px — so Companions started 20px higher than Fleet purely from this one extra padding layer.
2. **Different text-block heights with no shared floor.** Fleet's title block is 2 lines (title + count); Companions' is 3 (title + subtitle + count). Neither screen constrained this region to a shared height, so the selector below it landed at a different absolute offset on each screen purely because the text above it was a different number of lines tall.
3. **An extra 36×36px Back-button column on Companions only**, via `<CompanionsRosterTitle>`'s `display: flex; align-items: flex-start` row (Back button + copy column side by side), which both consumed horizontal width the Fleet title never reserved and added no equivalent height difference by itself, but structurally diverged the two screens' title markup from each other in a way that made consistent alignment impossible to guarantee without a shared component.

None of these were single-line bugs — they required a structural fix (one shared component both screens render identically), not per-screen margin tweaks.

## 3. Files created

- `src/components/fleet/FleetCollectionHeader.tsx` — shared collection-header layout: centered title, optional centered subtitle, centered acquired-count text, and the existing `FleetCategoryTabs` selector, in that order.
- `src/components/fleet/FleetCollectionHeader.css` — the shared layout's styling, including the fixed-height text region described in §5.

## 4. Files modified

- `src/screens/fleet/FleetRosterScreen.tsx` — replaced `<ScreenHeader title="FLEET" subtitle="8 of 20 ships acquired" />` + the separately-placed `<FleetCategoryTabs>` with one `<FleetCollectionHeader title="FLEET" countText={...} activeCategory="ships" .../>` call. Added a new `ownedShipCount` `useMemo` that counts real per-ship `owned: true` card data (via the same `getFleetRosterEntry` the grid itself already uses) across the full, unfiltered ship list, replacing the previously hard-coded `"8 of 20 ships acquired"` string with a data-driven `` `${ownedShipCount} of ${SHIPS.length} ships acquired` ``. No other change — featured panel, role filters, and ship grid are untouched.
- `src/screens/companions/CompanionsRosterScreen.tsx` — replaced `<CompanionsRosterTitle onBack={...} counts={counts} />` + the separately-placed `<FleetCategoryTabs>` with one `<FleetCollectionHeader title="Companions" subtitle="Support units and drones" countText={...} activeCategory="companions" .../>` call. Removed the now-unused `returnTarget` (`useMemo`) and `resolveBackDestination` function, and the `getCompanionRosterReturnTarget` import, since their only consumer (the removed Back button) no longer exists. Hero panel, role filters, sort control, grid, cards, and the Equip transaction are unchanged.

`src/data/companionRoster.ts` and `src/components/fleet/FleetCategoryTabs.tsx`/`.css` were **not modified** — inspected and found not to need any change (see §5, §9).

## 5. Shared header-layout solution

`FleetCollectionHeader` is rendered identically by both screens — same component, same CSS, only the `title`/`subtitle`/`countText`/`activeCategory`/callback props differ. Its structure:

```
<div class="fleet-collection-header">      (centered flex column)
  <div class="fleet-collection-header__text">   (centered flex column, fixed min-height)
    <h1>{title}</h1>
    <p>{subtitle}</p>   (optional)
    <p>{countText}</p>
  </div>
  <FleetCategoryTabs .../>
</div>
```

Both screens' content wrappers (`.fleet-roster__content`, `.companions-roster__content`) already had identical `padding: var(--space-4)` (16px) on all sides and identical `width/max-width/min-width/box-sizing` rules — confirmed unchanged and untouched by this fix. Because both screens now place the exact same `FleetCollectionHeader` as the first child of those identically-padded wrappers, the selector's top offset from the top of the scrollable content area is now structurally guaranteed to be identical: `16px (content padding) + fixed text-region height + 12px (var(--space-3) gap) `. No `transform: translateY`, no `position: relative; top:`, and no per-screen margin compensation was used anywhere.

## 6. Fleet title centering

`FleetCollectionHeader`'s text region is `display: flex; flex-direction: column; align-items: center; text-align: center` — both the title and the count line are centered, matching Companions exactly (same component, same CSS, no per-screen override). `FLEET`'s font, color (`neon-text-primary`), and letter-spacing/text-transform/weight are preserved from the previous `ScreenHeader`-driven treatment (`--font-family-display-heavy`, uppercase, bold) — the only change is horizontal alignment and font-size token (`--font-size-2xl`, matching `ScreenHeader`'s own title size exactly, so no size regression).

## 7. Fleet top-space reduction

Removing `<ScreenHeader>` in favor of `<FleetCollectionHeader>` eliminates `ScreenHeader`'s own extra 20px top padding entirely — `FleetCollectionHeader` adds no top padding or margin of its own beyond what `.fleet-roster__content`'s existing 16px (unchanged) already provides. `ScreenHeader.tsx`/`.css` themselves were **not modified** (they're still used unmodified by Battle Hub, Campaign Overview, Campaign Stage Detail, and Results — all frozen, out of scope) — Fleet Roster was simply switched to stop using that particular shared component, in favor of the new one.

## 8. Companion Back-arrow removal

`<CompanionsRosterTitle>` (with its 36×36px Back-button column) is no longer rendered by `CompanionsRosterScreen.tsx`. `FleetCollectionHeader`'s text region has no button/icon column — it is a plain centered text block, so removing the Back arrow required no placeholder column, no reserved width, and no off-center compensation; the title simply uses the component's full centered width like Fleet's does. The `SHIPS` tab inside the shared `FleetCategoryTabs` selector is the one remaining control that returns to Fleet Roster in the normal flow (`?return=fleet` / bare-entry / unknown-return cases). `CompanionsRosterTitle.tsx`/`.css` were **left in place, unmodified, but no longer rendered anywhere** — consistent with this project's established precedent of disclosing now-unreachable code rather than deleting a working component file outright (same pattern already used for `CompanionRosterDialog`'s orphaned `"detail"`/`"locked"` dialog kinds from an earlier phase). `getCompanionRosterReturnTarget` (the return-target *parsing function* itself, in `data/companionRoster.ts`) is untouched and still fully functional/exported — only `CompanionsRosterScreen.tsx`'s own use of it (to drive the now-removed Back button) was dropped, per the task's explicit "preserve the existing return-target parsing internally" instruction.

## 9. Selector alignment

`FleetCategoryTabs.tsx`/`.css` were inspected and found to need **no changes** — the component already used `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box` with no external margin, so once both screens place it inside the same `FleetCollectionHeader` at the same position with the same horizontal content padding, its width, height, button proportions, border radius, and internal padding are already byte-identical between screens (same CSS file, same class names, no per-screen override existed before or after this fix). No `SHIPS`/`COMPANIONS` navigation targets changed: Fleet → Companions still navigates to `#/inventory/companions?return=fleet`; Companions → Ships still navigates to `#/ships` (`navigate("ship-selection")`); the currently-active category's own button remains a no-op (`() => {}`) on both screens, so pressing it never triggers a redundant route reload or resets any filter/sort/selection state.

## 10. Return-flow regression results

- `?return=loadout` and `?return=home` parsing in `getCompanionRosterReturnTarget` (`data/companionRoster.ts`) — untouched, still exported, still correctly implemented (verified by inspection; the function body was not edited in this task).
- Companion Detail's `?return=loadout` flow (Loadout Manager → Companion Info → Companion Detail → Back → Loadout Manager, including the Loadout draft-session mechanism) — untouched; `CompanionDetailScreen.tsx`, `companionDetail.ts`, and `loadoutDraftSession.ts` were not opened for editing in this task (confirmed via the mtime-based file-change diff in §11 below, which lists none of them).
- Companion Detail's Roster-return chain (`?return=companions` → `#/inventory/companions?return=fleet` → `SHIPS` tab → `#/ships`) — untouched; this logic lives entirely in `CompanionDetailScreen.tsx`, which this task did not modify.
- The Equip transaction (`saveActiveLoadout({...player.activeLoadout, companionId})`, preserving Core/Plating/System modules, selected ship, currencies, materials, level, and rank) — untouched; `handleEquip` in `CompanionsRosterScreen.tsx` was not modified.

## 11. Mobile viewport results

No headless browser is available in this sandbox (same disclosed, previously-established limitation — `playwright` is not an installed project dependency and its browser binaries cannot be downloaded without network access). Verification here is a **static CSS/structure audit with an explicit content-height calculation**, not a rendered-screenshot audit:

**Structural guarantee.** Both screens' content wrappers share identical `padding: var(--space-4)` (16px) on all sides (unchanged, confirmed by inspection of both `.css` files). Both screens render the literal same `FleetCollectionHeader` component with the literal same CSS classes as the first child of that wrapper. Therefore the selector's top offset is `16px + text-region-height + 12px` on both screens, where `text-region-height` is controlled by one shared `min-height` rule (§5) — this is a structural equality, not a coincidental match of two independently-tuned values.

**Text-region height calculation** (documented in `FleetCollectionHeader.css`'s own comment), with explicit `line-height` set on every text line specifically so this is calculable rather than dependent on inherited/default browser font metrics:
- ≥361px viewports (412×915, 390×844 both fall here): title `28px × 1.2 = 33.6px` + gap `3px` + subtitle `13px × 1.3 = 16.9px` + gap `3px` + count `11px × 1.3 = 14.3px` ≈ **70.8px** for the 3-line Companions case; Fleet's 2-line case ≈ **50.9px**. `min-height: 76px` covers the taller case with a small buffer, so both screens' text region renders at exactly 76px (the floor), not at their own differing content heights.
- ≤360px viewport (360×800): title font-size drops to `22px`, giving `22px × 1.2 = 26.4px` + gap `3px` + subtitle `16.9px` + gap `3px` + count `14.3px` ≈ **63.6px** (Companions) vs. Fleet's ≈ **43.7px**. `min-height: 68px` at this breakpoint covers the taller case with a similar buffer.
- Because `min-height` (not `height`) is used with `justify-content: center` inside a `flex-direction: column` box, any content shorter than the floor is centered within it — this is what keeps Fleet's shorter block vertically centered in the same box height as Companions' taller block, rather than leaving a lopsided gap.

**Horizontal checks:** no `100vw` anywhere in the new/modified CSS (grepped); `FleetCollectionHeader`, its text region, and `FleetCategoryTabs` all carry `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box`; neither screen's content wrapper was changed, so horizontal page padding, max content width, and left/right edges remain exactly as they were (already identical between the two screens before this fix). Title/subtitle/count text all use `overflow-wrap: break-word` and none of the three real strings ("FLEET" / "Companions" / "Support units and drones" / the two count sentences) is long enough to wrap even at the narrowest 360px viewport (all under 26 characters at their respective font sizes within the ~328px available content width) — confirmed by character-count estimation, no ellipsis is used or needed anywhere in this component.

**Not overlapping / not fixed:** `FleetCollectionHeader` and `FleetCategoryTabs` both participate in normal in-flow document layout (no `position: fixed`/`sticky`/`absolute`), so they scroll naturally with the rest of the screen and cannot cover the header/footer or the featured panel that follows them. `HubScreenShell`/`HubHeader`/`HubBottomNav` were not touched, so header and footer heights and positions are unaffected on both screens.

This is disclosed as a static, calculated audit, not a claim of rendered visual verification — no screenshot files were generated or are referenced in §14 below.

## 12. Type-check result

`npx tsc --noEmit -p .` — clean, zero errors.

## 13. Build result

`npx vite build --outDir /tmp/starfire-fleet-companion-alignment --emptyOutDir` — succeeded (283 modules transformed, built in ~29s, zero errors/warnings), run twice (once before and once after a CSS refinement to the text-region `min-height`/line-heights) with identical clean results both times. Build was directed to a temp outDir outside the project; `public/`/`dist/` were never touched.

## 14. Screenshot paths

None. No headless browser is available in this sandbox (see §11) — no screenshot files exist for this phase and none are claimed.

## 15. Remaining limitations

- No rendered screenshot verification — disclosed in §11, not fabricated. The text-region height calculation is a static estimate using each token's real defined font-size and an explicitly-set line-height; if real browser font-metric rounding differs from this estimate by more than the small buffer built into the `min-height` values (6px at the base tier, 4px at the ≤360px tier), the two screens' selector position could still differ by a few pixels — the task's own tolerance ("differ by no more than a few pixels") allows for this.
- `CompanionsRosterTitle.tsx`/`.css` remain in the codebase, fully unmodified, but are no longer rendered by any screen — left in place rather than deleted, consistent with this project's established convention for now-orphaned components (see §8).
- The real default save only owns 1 ship (`ownedShipIds: [DEFAULT_SHIP_ID]`), while the Fleet grid's own reference-fixture data (`FLEET_ROSTER_CARDS`, disclosed in the original Fleet Roster completion report as reference-fidelity display data, not real save data) marks 8 ships as `owned: true` regardless of the real save. The new count deliberately reuses the exact same per-card ownership data the grid itself renders (`getFleetRosterEntry(...).owned`) rather than the raw `player.ownedShipIds.length` — so under the current default save it still reads **"8 of 20 ships acquired"**, matching what the grid visually shows, instead of a technically-more-"real" but visually-inconsistent `"1 of 20"` that would contradict the 8 unlocked-looking cards on screen. This choice and its reasoning are documented in `FleetRosterScreen.tsx`'s own new comment.

## 16. Confirmation of unchanged scope

No save-schema change: `SAVE_SCHEMA_VERSION` confirmed still `4` (`src/types/player.ts`). No change to companion or ship progression, ownership data, Power formulas, the Equip transaction, route paths, `HubHeader.tsx`, `HubScreenShell.tsx`, `HubBottomNav.tsx` (implementation or CSS), Companion Detail, Loadout Manager, Home, Battle Hub, Campaign screens, Pre-Battle, Ship Detail, Ship Level Up, companion/ship artwork, or any file under `public/`. No Companion Upgrade work was started. Confirmed via an mtime-based file-change diff, which lists exactly these 4 files touched by this task:

```
src/components/fleet/FleetCollectionHeader.tsx    (new)
src/components/fleet/FleetCollectionHeader.css    (new)
src/screens/fleet/FleetRosterScreen.tsx
src/screens/companions/CompanionsRosterScreen.tsx
```

`src/data/companionRoster.ts`, `src/components/fleet/FleetCategoryTabs.tsx`/`.css`, `src/screens/companion-detail/CompanionDetailScreen.tsx`, and `src/data/companionDetail.ts` were inspected but confirmed untouched by this task (their file-modification timestamps predate this task's start, verified directly). No other file in the repository was modified.
