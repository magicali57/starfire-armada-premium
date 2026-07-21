# Companions Fleet Navigation — Correction Report

## 1. Summary

Corrected the visible navigation hierarchy so Companions is classified under Fleet instead of a dead-end reachable only via Loadout Manager. Added a shared, reusable Fleet-level category switch (`FleetCategoryTabs`: "Ships" / "Companions") to both Fleet Roster and Companions Roster; changed both Companions Roster's and Companion Detail's active bottom-nav tab from `"inventory"` to `"fleet"`; extended Companions Roster's return-target system so its default/fallback Back destination is Fleet (`#/ships`) instead of Home; and updated Companion Detail's Back-to-Roster chain so it explicitly carries `?return=fleet`, keeping Fleet as the ultimate Back destination through the full Roster→Detail→Back→Roster→Back chain. No screen was rebuilt or visually redesigned beyond adding this one shared control; no route paths were renamed; Home was not touched.

## 2. Files created

- `src/components/fleet/FleetCategoryTabs.tsx` — shared two-button Fleet category switch (`active: "ships" | "companions"`, `onSelectShips`, `onSelectCompanions`).
- `src/components/fleet/FleetCategoryTabs.css` — compact segmented-selector styling using the project's existing cyan Fleet/secondary accent (`--color-secondary-*`) for the active state.
- This report: `docs/handoffs/companions/COMPANIONS_FLEET_NAVIGATION_FIX_REPORT.md`.

## 3. Files modified

- `src/screens/fleet/FleetRosterScreen.tsx` — imports and renders `<FleetCategoryTabs active="ships" .../>` between the `ScreenHeader` and `FleetFeaturedPanel`; added `handleSelectCompanions` (navigates to `#/inventory/companions?return=fleet`); `onSelectShips` is a no-op (already active). No other change — title/subtitle text, featured panel, filters, and grid are untouched.
- `src/screens/companions/CompanionsRosterScreen.tsx` — imports and renders `<FleetCategoryTabs active="companions" .../>` between `CompanionsRosterTitle` and the hero panel; `HubBottomNav`'s `active` prop changed from `"inventory"` to `"fleet"`; `resolveBackDestination` rewritten for the new string-union return-target type (`"fleet" | "loadout" | "home"`, previously an object `{kind:...}`), with the fallback case now navigating to `navigate("ship-selection")` (Fleet Roster) instead of `navigate("home")`; added `handleSelectShips` (navigates to `"ship-selection"`); updated the file's top doc comment to describe the Fleet classification. Hero panel, filters, sort control, grid, cards, Equip transaction, and all modals are unchanged.
- `src/screens/companion-detail/CompanionDetailScreen.tsx` — both `HubBottomNav active="inventory"` occurrences (found-companion and missing-companion states) changed to `active="fleet"`; `resolveBackDestination`'s `"companions"` branch and `handleBackFromMissing` now build `` `${pathFor("companions")}?return=fleet` `` explicitly instead of calling `navigate("companions")` (which would have produced a bare `#/inventory/companions`); added `pathFor` to the existing `@/app/routes` import; updated the file's top doc comment. Every other piece of this screen — dynamic route parsing, companion identity/Power/behavior/progression/pairing/acquisition panels, Equip transaction, Loadout draft-session behavior (`?return=loadout` path), Upgrade/Rank Up informational modals, locked state, and the invalid-companion-id state's content — is byte-identical to before this change.
- `src/data/companionRoster.ts` — `CompanionRosterReturnTarget` changed from `{ kind: "loadout" } | { kind: "home" } | { kind: "fallback" }` to the string union `"fleet" | "loadout" | "home"` (matching `CompanionDetailReturnTarget`'s existing pattern); `getCompanionRosterReturnTarget`'s catch-all case (previously `{ kind: "fallback" }`, which callers resolved to Home) now returns `"fleet"` directly. `?return=loadout` and `?return=home` parsing is unchanged. This type had exactly one consumer (`CompanionsRosterScreen.tsx`), confirmed by a full-repo grep before changing it, so this was a safe, contained change.
- `src/data/companionDetail.ts` — doc-comment-only update above `getCompanionDetailReturnTarget` clarifying the new Fleet-origin Back chain; the function itself, its return type (`CompanionDetailReturnTarget = "companions" | "loadout" | "home"`), and every other export in this file are unchanged.

No changes were made to `src/app/routes.tsx` (route ids/paths/`resolveRoute`/`pathForCompanionDetail`/`getCompanionIdFromHash` were all reused as-is — verified by the regression script in §11) or to `src/components/layout/AppShell.tsx` (its existing `showBottomNav` exclusion list already suppressed the legacy footer for both `"companions"` and `"companion-detail"` — verified by direct inspection, no gap found, so no edit was needed).

## 4. Fleet category component

`src/components/fleet/FleetCategoryTabs.tsx` — one shared implementation (not duplicated per screen), rendered identically by both Fleet Roster and Companions Roster with only the `active` prop and the two callbacks differing. Two real `<button>` elements labeled "Ships" and "Companions" (`aria-label="View Ships"` / `"View Companions"`), `aria-pressed` carries the programmatic active state, a `role="group" aria-label="Fleet category"` wrapper groups them. Visual treatment: a shared dark translucent pill container (`--color-bg-panel`, hairline border) holding two equal-width segments (`grid-template-columns: repeat(2, minmax(0, 1fr))`); the active segment gets a brighter cyan border, a light cyan fill, and a soft glow using the project's existing `--color-secondary-500`/`--color-secondary-300` tokens (the same accent already used for Fleet's bottom-nav tab and Companion Detail's title bar); the inactive segment stays fully readable (muted text color, no border) rather than looking disabled. `:focus-visible` gets a visible cyan outline; transitions are wrapped in a `prefers-reduced-motion: reduce` query that removes them. `HubHeader`/`HubScreenShell`/`HubBottomNav` were not modified to build this — it is a fully independent, screen-level component.

## 5. Fleet Roster placement

Inserted directly below `<ScreenHeader title="FLEET" subtitle="8 of 20 ships acquired" />` and directly above `<FleetFeaturedPanel>` — matching the requested order exactly:

```
HubHeader
FLEET / 8 of 20 ships acquired
[ SHIPS ] [ COMPANIONS ]
Featured ship panel
Filters
Ship grid
HubBottomNav
```

`active="ships"` (always true on this screen). Selecting "Ships" is a no-op (already on this route). Selecting "Companions" sets `window.location.hash` to `` `${pathFor("companions")}?return=fleet` `` — i.e. `#/inventory/companions?return=fleet`, using the existing `pathFor` route helper (no new route). The control is not inside the featured panel, not inside a ship card, not beside Equip/Details, and not in `HubHeader`/`HubBottomNav`. Existing title/subtitle text was not changed.

## 6. Companions Roster placement

Inserted directly below `<CompanionsRosterTitle>` (which renders "COMPANIONS" / "Support units and drones" / the owned-count line) and directly above the hero panel — matching the requested order:

```
HubHeader
COMPANIONS / Support units and drones / N of M acquired
[ SHIPS ] [ COMPANIONS ]
Featured companion panel
Role filters and sorting
Companion grid
HubBottomNav
```

`active="companions"` (always true on this screen). Selecting "Companions" is a no-op (already on this route, no redundant hash write/reload). Selecting "Ships" calls `navigate("ship-selection")`, landing on `#/ships`. The hero panel, role filters, sort control, companion cards, equipped markers, upgrade-ready state, locked state, and all existing modals were not touched beyond this one insertion — confirmed by the mtime-based diff in §11, which shows no CSS file for this screen was modified.

## 7. Active-tab behavior

- Fleet Roster: `HubBottomNav active="fleet"` — unchanged (it already used `"fleet"` before this task).
- Companions Roster: `HubBottomNav active="fleet"` — changed from `"inventory"`.
- Companion Detail: `HubBottomNav active="fleet"` — changed from `"inventory"` in both the normal and the missing-companion render branches.

`HubBottomNav.tsx` itself was not modified — `"fleet"` was already a valid member of its existing `HubNavTabId` union and its `handleTap`'s `"fleet"` case already calls `navigate("ship-selection")`, so no changes were needed there. Verified: with `active="fleet"`, the Fleet tab renders with `hub-bottom-nav__item--active`/`aria-current="page"` and the Inventory tab does not; only one `<HubBottomNav>` renders per screen (each of the three screens renders exactly one, as `HubScreenShell`'s `footer` prop, and `AppShell`'s legacy `BottomNavigation` remains suppressed for all three routes — see §10).

## 8. Companions Roster return-target changes

`CompanionRosterReturnTarget` is now `"fleet" | "loadout" | "home"` (was an object union with a `"fallback"` kind). `getCompanionRosterReturnTarget` priority: `?return=loadout` → `"loadout"`; `?return=home` → `"home"`; anything else (missing, unknown, malformed) → `"fleet"`. This means:
- `#/inventory/companions` (no query at all) → Back → `#/ships`.
- `#/inventory/companions?return=fleet` → Back → `#/ships`.
- `#/inventory/companions?return=bogus` (or any other unrecognized value) → Back → `#/ships`.
- `#/inventory/companions?return=loadout` → Back → `#/inventory/loadout` (unchanged).
- `#/inventory/companions?return=home` → Back → Home (unchanged).

All five cases are verified by direct execution of the real code — see §11.

## 9. Companion Detail return-chain changes

Used **Option B** from the task's own suggested approaches (smallest safe change, no new query parameter, no persistent state): `CompanionDetailScreen`'s `resolveBackDestination` and `handleBackFromMissing` both build the Roster URL as `` `${pathFor("companions")}?return=fleet` `` explicitly whenever the resolved return target is `"companions"` (the default/unknown/missing case), rather than calling `navigate("companions")` (which would have produced a bare `#/inventory/companions`). Concretely:
- Roster → Detail (`?return=companions`) → Back → `#/inventory/companions?return=fleet` → Roster's own Back → `#/ships`.
- Direct Companion Detail entry (no return param) → Back → `#/inventory/companions?return=fleet` → `#/ships`.
- Invalid companion id → Back → `#/inventory/companions?return=fleet` → `#/ships`.
- `?return=loadout` → Back → `#/inventory/loadout` — **unchanged**.
- `?return=home` → Back → Home — **unchanged**.

The dynamic route parser (`getCompanionIdFromHash`/`resolveRoute` in `app/routes.tsx`) was not modified — a future `/upgrade` sub-route is still safely rejected (verified in §11, `route_extra_segment` still resolves to `"home"`, never `"companion-detail"`). `companionDetail.ts`'s `getCompanionDetailReturnTarget` function itself is unchanged (only its doc comment was updated for accuracy) — the actual URL-building change lives entirely in the screen, per the task's "smallest safe change" guidance.

## 10. Fleet-active bottom-navigation changes

`AppShell.tsx` was inspected and found to already suppress the legacy generic `BottomNavigation` for both `"companions"` and `"companion-detail"` (added during the earlier Companion Detail phase) — no gap was found, so `AppShell.tsx` was **not modified**. Existing suppression for Fleet Roster, Ship Detail, Ship Level Up, Loadout, and every other focused screen is untouched. Confirmed: exactly one `<HubBottomNav>` renders per screen in all three affected screens (Fleet Roster, Companions Roster, Companion Detail) — no double footer.

## 11. Loadout flow regression

`LoadoutManagerScreen.tsx` was not modified in this task. Its companion-slot Info button still navigates via `pathForCompanionDetail(draftLoadout.companionId, "loadout")` (unchanged, confirmed by inspection), and `CompanionDetailScreen`'s `?return=loadout` handling — both the Back button (`resolveBackDestination`'s `"loadout"` branch: `navigate("loadout")`, untouched) and the Equip button's loadout-draft-session branch (`updateLoadoutDraftCompanion`, `getLoadoutDraftSession`, `clearLoadoutDraftSession` from `loadoutDraftSession.ts`) — are byte-identical to before this task. Verified directly by executing the real, bundled code (not hand-transcribed):

```
loadout_detail_return_target: "loadout"
loadout_detail_route:         "companion-detail"
```

confirming a `?return=loadout` Companion Detail URL still parses to the `"loadout"` return target and still resolves to the `"companion-detail"` route, exactly as before. `loadoutDraftSession.ts` itself was not touched at all (not in the file list, confirmed by the mtime diff below).

**Full regression script results** (esbuild-bundled real TypeScript, executed via Node — not hand-transcribed):

```json
{
  "roster_bare": "fleet",
  "roster_return_fleet": "fleet",
  "roster_return_loadout": "loadout",
  "roster_return_home": "home",
  "roster_return_unknown": "fleet",
  "detail_bare": "companions",
  "detail_return_companions": "companions",
  "detail_return_loadout": "loadout",
  "detail_return_home": "home",
  "route_ships": "ship-selection",
  "route_companions_bare": "companions",
  "route_companions_return_fleet": "companions",
  "route_detail": "companion-detail",
  "route_detail_return_companions": "companion-detail",
  "route_loadout": "loadout",
  "route_home": "home",
  "route_empty_id": "home",
  "route_extra_segment": "home",
  "step1_detail_url": "#/inventory/companions/companion-repair-drone?return=companions",
  "step1_detail_route": "companion-detail",
  "step1_detail_return_target": "companions",
  "step2_roster_url": "#/inventory/companions?return=fleet",
  "step2_roster_route": "companions",
  "step2_roster_return_target": "fleet",
  "step3_is_fleet": true,
  "direct_detail_return_target": "companions",
  "direct_detail_back_url": "#/inventory/companions?return=fleet",
  "direct_detail_back_return_target": "fleet",
  "loadout_detail_return_target": "loadout",
  "loadout_detail_route": "companion-detail",
  "invalid_id_from_hash": null,
  "invalid_id_route": "home"
}
```

`step3_is_fleet: true` is the key end-to-end assertion: the full Roster→Detail→Back→Roster-URL→Back chain resolves to Fleet.

## 12. Confirmation that Home was untouched

`src/screens/home/HomeScreen.tsx` and `HomeScreen.css` were not opened for editing and do not appear in the mtime-based file-change list below. No Companions shortcut, floating button, side-menu item, new card, or sixth Home control was added. The old five-card shortcut row (Hangar/Arsenal/Companions/Tech Tree/Shop) was not restored — it was already absent from the current approved Home screen and remains absent.

## 13. Mobile verification

No headless browser is available in this sandbox (same disclosed, previously-established limitation — `playwright` is not an installed project dependency and its browser binaries cannot be downloaded without network access this sandbox doesn't have). Verification here is a **static CSS/structure audit**, not a rendered-screenshot audit:
- `FleetCategoryTabs.css` uses `display: grid; grid-template-columns: repeat(2, minmax(0, 1fr))` with `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box` on both the container and each tab button (confirmed present via direct grep, 2 occurrences each).
- No `100vw` and no fixed pixel widths ≥100px anywhere in the new CSS file (grepped).
- A `max-width: 360px` media query reduces tab height/font-size slightly (40px→38px, 13px→12px) to keep both "SHIPS" and "COMPANIONS" fully readable with `white-space: nowrap` (no wrap, no ellipsis) at the narrowest target viewport.
- The component is placed inline in each screen's existing vertical flex-column content wrapper (`.fleet-roster__content` / `.companions-roster__content`), both of which already carry `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box` — confirmed unmodified in this task. The selector is not `position: fixed`/`sticky` and scrolls naturally with the rest of the screen content, per the task's explicit instruction.
- At the container's available content width (328px at a 360px viewport, after the existing 16px×2 screen padding), each of the two segments has roughly 158px of tap-target width — comfortably above typical minimum tap-target guidelines, with no risk of the two labels colliding or wrapping.
- Header/footer positions are unaffected — `HubScreenShell`/`HubHeader`/`HubBottomNav` were not touched, and the new control participates in normal in-flow document layout (no `position: fixed`/`absolute`), so it cannot shift or cover the header/footer or overlap the featured/hero panel below it.

This is disclosed as a static audit, not a claim of rendered visual verification — no screenshot files were generated or are referenced below.

## 14. Type-check result

`npx tsc --noEmit -p .` — clean, zero errors.

## 15. Build result

`npx vite build --outDir /tmp/starfire-fleet-navigation-fix --emptyOutDir` — succeeded (283 modules transformed, built in 24.64s, zero errors/warnings). Build was directed to a temp outDir outside the project; `public/`/`dist/` were never touched.

## 16. Screenshot paths

None. No headless browser is available in this sandbox (see §13) — no screenshot files exist for this phase and none are claimed.

## 17. Remaining limitations

- No rendered screenshot verification — disclosed in §13, not fabricated.
- `CompanionRosterDialog.tsx`'s now-fully-unreachable `"detail"`/`"locked"` kinds (already unused since the prior Companion Detail phase's Roster-to-Detail navigation change) remain in the file, unmodified — out of scope for this navigation-only correction.
- The route paths `#/inventory/companions` and `#/inventory/companions/<id>` remain as internal implementation detail, unchanged, per the task's explicit instruction — a future route cleanup (e.g. renaming to `#/fleet/companions`) was not attempted and was not in scope.

## 18. Confirmation of unchanged scope

No save-schema change: `SAVE_SCHEMA_VERSION` confirmed still `4` (`src/types/player.ts`). No change to companion ownership (`ownedCompanionIds`), companion progress (`companionProgress`), the active loadout shape/validation, Ship Alloy, module loadout data, companion/ship Power formulas, companion or ship artwork, or any gameplay/progression system — none of `data/companions.ts`, `data/loadout.ts`, `data/ships.ts`, `types/player.ts`, `store/playerStore.tsx`, or any file under `public/` was opened for editing. `HubHeader.tsx`, `HubScreenShell.tsx`, and `HubBottomNav.tsx` (implementation and CSS) were not modified. No Companion Upgrade, Companion Rank Up, Module screens, Inventory Hub, or Shop work was started. Confirmed via the mtime-based file-change diff, which lists exactly the following 7 touched files for this entire task:

```
src/components/fleet/FleetCategoryTabs.css        (new)
src/components/fleet/FleetCategoryTabs.tsx         (new)
src/data/companionDetail.ts                        (doc comment only)
src/data/companionRoster.ts                        (return-target type/fallback)
src/screens/companion-detail/CompanionDetailScreen.tsx
src/screens/companions/CompanionsRosterScreen.tsx
src/screens/fleet/FleetRosterScreen.tsx
```

No other file in the repository was modified by this task.
