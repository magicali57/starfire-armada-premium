# Ship Level Up — Completion Report

Reference: `docs/references/mobile_screens_selected/11_Ship_Level_Up.png` (941×1672, confirmed by direct inspection — extracted fresh from `STARFIRE_ARMADA_UI_HANDOFF.zip`'s `Batch_2_Fleet_Companions_and_Modules/11_Ship_Level_Up.png`, not assumed from memory). Pictures `ship-03-homing-missiles` ("Star Hunter"/"Homing Missiles"), Epic, Level 12/20, Power 12,480, XP 1,840/2,800, Credits cost 18,000, Ship Alloy cost 45/1,240 balance, Power Increase +320.

## 1. Summary

Ship Level Up is fully implemented as a real screen using the shared hub shell (`HubScreenShell`/`HubHeader`/`HubBottomNav`, Fleet tab active) at the existing `#/ships/upgrade` route. It replaces the previous full-screen-shell placeholder entirely: hero panel (rarity/name/role/power/master art/rarity emblem/current-next level/XP bar), a six-row stat comparison table, Power Increase and Upgrade Cost cards, and three real actions (Upgrade, Upgrade x5 with a confirmation modal, Max Preview as a read-only modal). Credits + a new Ship Alloy material are spent atomically through a rewritten store transaction, with the save schema advanced from v2 to v3 and existing saves migrated forward rather than discarded.

Star Rank, Weapon Upgrade, Abilities, Skins, Companions, Modules, Inventory, Shop, and real gameplay integration were not touched — all remain coming-soon/out of scope, exactly as instructed.

## 2. Files created

- `src/data/shipUpgrade.ts` — view-model layer: stat-row formatting (`formatStatValue`/`formatStatIncrease`/`buildStatComparisonRows`), Ship XP display (`getShipXpDisplay`), Power Increase display (`getPowerDisplay`), resource-shortage state (`getResourceState`), Max Preview data (`getMaxPreviewData`), Upgrade x5 preview data (`getUpgradeX5PreviewData`).
- `src/components/ship-upgrade/ShipUpgradeTitleBar.tsx` / `.css` — back button + centered title/subtitle, using a same-width invisible spacer column so centering doesn't depend on the back button's own width.
- `src/components/ship-upgrade/ShipUpgradeHeroPanel.tsx` / `.css` — purple hero panel: rarity pill, name, role + icon, Power box, master art, rarity emblem, Current/Next level row with a direction chevron, and a custom XP track with centered label text.
- `src/components/ship-upgrade/ShipUpgradeStatTable.tsx` / `.css` — six-row STAT / CURRENT / NEXT / INCREASE table using `STAT_ICON`, with a dedicated MAX-level header/row treatment.
- `src/components/ship-upgrade/ShipUpgradePowerCard.tsx` / `.css` — Power Increase card (swords icon, delta, From→To row, MAX LEVEL state).
- `src/components/ship-upgrade/ShipUpgradeCostCard.tsx` / `.css` — Upgrade Cost card (Credits + Ship Alloy rows, independent insufficient-resource highlighting, the reference's own guidance line).
- `src/components/ship-upgrade/ShipUpgradeActions.tsx` / `.css` — primary Upgrade button (with live cost chips) + Upgrade x5 / Max Preview secondary row.
- `src/components/ship-upgrade/ShipUpgradeDialog.tsx` / `.css` — modal body content for the Upgrade x5 confirmation and the Max Preview, rendered inside the shared `ModalLayer`.
- `docs/references/mobile_screens_selected/11_Ship_Level_Up.png` (+ a `crops/` subfolder of zoomed regions used for inspection) — extracted into the repo's own reference set so it's available for any future session, matching how earlier screens' references were kept.
- `docs/handoffs/ship-upgrade/SHIP_LEVEL_UP_COMPLETION_REPORT.md` — this report.

## 3. Files modified

- `src/screens/ship-upgrade/ShipUpgradeScreen.tsx` / `.css` — fully rewritten (previous version used the old `ShipArt`/`NeonPanel`/`StatRow` components and a Coin-only cost model; replaced entirely).
- `src/components/layout/AppShell.tsx` — added `"ship-upgrade"` to the `showBottomNav` exclusion list so the generic `BottomNavigation` no longer double-renders under the screen's own `HubBottomNav`.
- `src/types/player.ts` — added `MaterialId`/`MaterialBalances`, added `materials: MaterialBalances` to `PlayerState`, bumped `SAVE_SCHEMA_VERSION` from 2 to 3.
- `src/data/player.ts` — added `materials: { shipAlloy: 1240 }` to `DEFAULT_PLAYER_STATE` (matches the reference's own balance).
- `src/store/playerStore.tsx` — added the v2→v3 migration path in `loadPlayerState`, added `addMaterial`, replaced the one-level `upgradeShipLevel` with an atomic `upgradeShipLevels(shipId, requestedLevels)` transaction (kept as a compatibility wrapper), and extended `UpgradeShipResult`'s failure reasons.
- `src/systems/shipStats.ts` — added `calculateShipXpRequirement`, `calculateShipAlloyCost`, and `calculateShipLevelUpgradeQuote` (+ the exported `ShipLevelUpgradeQuote` type). Existing exports (`calculateShipStats`, `calculatePowerScore`, `calculateUpgradeCost`, `isMaxLevel`, `SHIP_MAX_LEVEL`) are unchanged.

No other files were touched. Confirmed by an mtime check against every file in the repo: every frozen/shared file (`HubScreenShell.tsx`, `HubHeader.tsx`, `HubBottomNav.tsx`, `FleetRosterScreen.tsx`, `ShipDetailScreen.tsx`, `routes.tsx`, `App.tsx`, `assetRegistry.ts`, `ships.ts`, and all other approved screens) has a modification time from before this task started (some from 2026-07-14, most from earlier today before 19:16); every file listed above as created/modified has a modification time inside this task's actual working window (21:09–21:24 today). No route path or route id changed.

## 4. Route behavior

`#/ships/upgrade` (route id `ship-upgrade`) is unchanged — same path, same id, same `App.tsx` wiring (`case "ship-upgrade": return <ShipUpgradeScreen />;`, itself untouched). No new route was created.

## 5. Selected ship flow

Unchanged end-to-end: Ship Detail's existing "Level Up" button already calls `selectOwnedShip(ship.id)` then `navigate("ship-upgrade")` (confirmed by reading `ShipDetailScreen.tsx` — this button was never touched). Ship Upgrade reads `player.selectedShipId`, resolves it with `getShipById`, and resolves art with `getShipMasterArt(ship.id)`. No second selection mechanism or query parameter was added.

Handled states:
- **Valid owned selected ship** — full screen renders.
- **Missing selected ship** (`getShipById` returns `undefined`) — empty-state message + "Back to Fleet" button (`navigate("ship-selection")`).
- **Unknown ship id** — same as missing (an unresolvable id is indistinguishable from missing at this layer).
- **Selected ship not owned** — separate empty-state message naming the ship, with Back going to that ship's own Ship Detail page (the id is still valid, only ownership is missing).
- **Maximum-level ship** — full screen renders normally with `atMaxLevel` treatment throughout (see §9/§10 below) rather than an error state.

## 6. Shell / header / footer behavior

Uses `<HubScreenShell header={<HubHeader .../>} footer={<HubBottomNav active="fleet" .../>}>` exactly like Fleet Roster — neither shared component was modified. The old generic `BottomNavigation` is suppressed via the `AppShell.tsx` exclusion-list addition, so there is exactly one footer. `HubHeader`'s `onOpen` and `HubBottomNav`'s `onComingSoon` both route to the same `openComingSoon` handler, which opens the existing `LockedContentModal` — identical pattern to Fleet Roster's Profile/resources/Inbox/Settings/Inventory/Shop coming-soon handling. Home/Battle/Fleet tabs keep their existing `HubBottomNav` route behavior (Fleet tap navigates to `ship-selection`, i.e. Fleet Roster).

Back button (own `ShipUpgradeTitleBar`, not part of `HubHeader`) returns to `${pathFor("ship-detail-placeholder")}?id=<shipId>` when the ship is known, or `navigate("ship-selection")` only when it can't be resolved.

## 7. Credits and Ship Alloy economy behavior

- **Credits**: unchanged cost curve — `calculateUpgradeCost` (rarity-multiplier × `120 × level^1.55`) was not modified. Displayed label is "Credits"; the underlying state key remains `player.currencies.coins` (`CurrencyId` was not renamed).
- **Ship Alloy**: new material, `materials.shipAlloy`, separate from `currencies`. New pure helper `calculateShipAlloyCost(ship, currentLevel) = Math.round((6 + currentLevel * 2) * rarityMultiplier)`, reusing the existing `RARITY_COST_MULTIPLIER` table. Verified numerically against the reference's own worked example: Epic, Level 12 → 13 = 45 Ship Alloy (confirmed via a standalone Node re-implementation of the formula, output `45`, matching the reference exactly).
- **Multi-level quotes**: `calculateShipLevelUpgradeQuote(ship, currentLevel, requestedLevels)` sums each individual level's real Coin and Ship Alloy cost (verified: a 5-level Epic quote from Level 12 totals 255 Ship Alloy, exactly equal to `calculateShipAlloyCost` summed for levels 12–16 individually — not `calculateShipAlloyCost(12) × 5`, which would have given 225). Clamped to `SHIP_MAX_LEVEL` (verified: requesting 5 levels from Level 18 stops at Level 20 with only 2 levels quoted; requesting from Level 20 returns a 0-level, 0-cost, `isEmpty: true` quote).
- **Transaction**: `upgradeShipLevels(shipId, requestedLevels)` in the store validates ownership → max-level → computes the quote → checks Credits and Ship Alloy independently (returning `insufficient-coins`, `insufficient-ship-alloy`, or `insufficient-resources` for both) → deducts both resources and raises the level in one state update → persists once. A `busy`/in-flight ref guard (same mechanism the previous one-level implementation used, extended with its own `"busy"` failure reason instead of misreporting `insufficient-coins`) prevents double-spending from rapid repeated taps. `upgradeShipLevel(shipId)` remains as a one-level wrapper for compatibility.
- Verified: no reason ever reports `insufficient-coins` for an in-flight transaction (it reports `"busy"` instead, per the explicit requirement).

## 8. Save migration behavior

`SAVE_SCHEMA_VERSION` advanced from 2 to 3. `loadPlayerState` now recognizes both 2 and 3 as migratable; a v2 save is merged over `DEFAULT_PLAYER_STATE` field-by-field (preserving currencies, owned ships, selected ship, ship progression, campaign progression, and every other existing field), gets a default `materials.shipAlloy` backfilled, is immediately re-persisted at version 3, and returned. Any save with a missing/unrecognized `saveSchemaVersion` (including a hypothetical future v4+ this build doesn't know how to read) or malformed JSON falls back to `DEFAULT_PLAYER_STATE`, unchanged from the previous behavior's safety net.

Verified via a standalone Node re-implementation of the exact merge algorithm (not a live browser localStorage cycle — no headless browser is available in this sandbox, see §11):
- A synthetic realistic v2 save (Level 7 player, 3 owned ships, real per-ship progress, mid-campaign progress) migrates with currencies/ownedShipIds/selectedShipId/shipProgress/currentChapterId/currentStageId/highestClearedStageId all preserved exactly, `materials.shipAlloy` backfilled to 1,240, and `saveSchemaVersion` advanced to 3 — all assertions passed.
- A synthetic v3 save with a non-default Ship Alloy balance (87) round-trips with that real balance preserved, not overwritten by the default — passed.
- Malformed JSON, a missing version field, an old unrecognized v1, and a hypothetical future v99 all fall back to `DEFAULT_PLAYER_STATE` — passed.
- A fresh install (no saved raw string) returns `DEFAULT_PLAYER_STATE` with `materials.shipAlloy = 1240` and `saveSchemaVersion = 3` — passed.

## 9. Upgrade x5 behavior

Pressing "Upgrade x5" does not fire any transaction immediately — it opens a `ModalLayer`-hosted confirmation (`ShipUpgradeDialog kind="confirmX5"`) built from `getUpgradeX5PreviewData(ship, currentLevel, player)`, itself just `calculateShipLevelUpgradeQuote(ship, currentLevel, 5)` plus `getResourceState`. The dialog shows current→resulting level, current→resulting power, total Credits, total Ship Alloy, and highlights either resource if insufficient (with an explicit warning line for insufficient-Credits / insufficient-Ship-Alloy / both). Confirm calls `upgradeShipLevels(shipId, 5)` exactly once — a single atomic transaction, not five separate calls. If the full 5-level quote can't be afforded, Confirm is disabled (`resources.canAfford` gates it) and no partial purchase occurs. The button itself is disabled at max level and while busy.

## 10. Max Preview behavior

Read-only: `getMaxPreviewData(ship, currentLevel)` only calls `calculateShipStats`/`calculatePowerScore` at the current level and at `SHIP_MAX_LEVEL` (20) and formats the result — it never calls `upgradeShipLevels`, never touches `player.selectedShipId`, and the modal's only interactive control is a Close button. Opening/closing it triggers no store update of any kind.

## 11. Mobile responsiveness results

**Disclosed limitation, stated plainly per your instruction not to claim verification without it:** this sandbox has no headless browser available. `npx playwright install chromium` was attempted and failed with `Connection blocked by network allowlist` (the sandbox's outbound network is allowlisted and the Playwright/Chrome-for-Testing CDN is not on it) — the same limitation this project's earlier mobile-fix rounds disclosed. No screenshot files exist for this screen; none are claimed below, and §12 ("Screenshots") is empty for that reason rather than populated with unverified claims.

What was actually done in place of a rendered screenshot, consistent with this project's established fallback method for the same limitation:
- Every layout was built from the same mobile-safety primitives already validated on-device in the Ship Detail mobile-fix rounds (`width:100%; max-width:100%; min-width:0; box-sizing:border-box` on every major container and grid/flex child; CSS Grid fixed-icon/flexible-value columns for numeric rows rather than absolute-positioned icons; no `100vw` inside padded containers).
- The six-row stat table's column widths were computed by hand at 360px (the tightest required viewport), the same way the Ship Detail top-bar restructure computed its pill widths: content padding (32px) + panel padding (24px at ≥360px, tightened to 16px below it) + 4 inter-column gaps leaves ~274–288px of flexible track width across the grid's 4.05 `fr` units; every realistic stat value at any level 1–20 (checked against `calculateShipStats`' actual rounding behavior, not guessed) fits inside its allotted track at the chosen font sizes with margin to spare. A dedicated `@media (max-width: 360px)` tier further tightens padding/gaps/font size as an extra safety margin, and `overflow: hidden` was added to the CURRENT/NEXT value cells so even an unanticipated extreme value clips cleanly inside its own column instead of bleeding into a neighbor.
- The hero panel reuses Ship Detail's own proven mobile fallback for the exact same reference set: side-by-side info/art columns above 360px, stacking to a single column at ≤360px (`@media (max-width: 360px)`), with the master art sized by `object-fit: contain` inside a fixed-aspect-ratio box so it can never overlap the level row or XP bar beneath it.
- The Power Increase / Upgrade Cost cards use `flex-wrap` at the row level (`.ship-upgrade-screen__cards-row`) and stack vertically below 400px (`@media (max-width: 400px)`), each card independently safe down to its own `min-width: 0` content.
- The bottom action row's two secondary buttons (`Upgrade x5` / `Max Preview`) are equal `flex: 1 1 0` items with `overflow: hidden; text-overflow: ellipsis` as a safety net, plus a `@media (max-width: 340px)` font-size reduction.
- No `100vw`, no absolutely-positioned artwork over controls, and only one bottom navigation bar (confirmed by code inspection of `AppShell.tsx`'s exclusion list, not by a rendered screenshot).

This is a real, disclosed gap relative to the requirement to "capture screenshots... compare directly against the reference" — I was not able to do that step. If you have a way to grant this environment browser/network access (or want me to hand off a script), I can complete an actual pixel-level comparison; until then, treat the above as careful static-layout verification, not visual confirmation.

## 12. Screenshots

None captured — see §11 for why, and what was done instead.

## 13. Type-check result

`npx tsc -b --noEmit` — clean, no errors (run twice: once after implementation, once after the final CSS hardening pass in §11).

## 14. Build result

`npx vite build --outDir /tmp/su_build_out --emptyOutDir` — succeeded both times: `212 modules transformed`, output `index.html` (0.85 kB), CSS bundle (146.8 kB / 21.28 kB gzip), JS bundle (301.07 kB / 81.14 kB gzip). No build warnings or errors.

## 15. Tests run

No automated test suite exists in this project (`package.json` has no `test` script). In its place:
- A standalone Node script re-implementing the exact save-migration algorithm (§8) — 4 scenarios, all assertions passed.
- A standalone Node script re-implementing the exact cost/quote formulas (§7) — verified against the reference's own numeric example (45 Ship Alloy) and the "sum, don't multiply" / "clamp at 20" requirements — all assertions passed.
- `tsc -b --noEmit` and `vite build` as described above.
- A full-repository mtime audit confirming only the files listed in §3 were touched (see that section for the exact method and result).

## 16. Remaining limitations / temporary prototype decisions

- **No real screenshots** — see §11. This is the most significant open item relative to your instructions.
- **Ship XP is display-only.** `calculateShipXpRequirement(level) = 1000 + level * 150` is a provisional, reference-calibrated formula (reproduces the reference's 2,800 requirement at Level 12 exactly) with no gameplay source yet feeding `shipProgress.xp` — it's clamped and shown, but Level Up still costs only Credits + Ship Alloy, matching the explicit instruction not to make Ship XP an upgrade gate in this task.
- **Ship Alloy's starting balance (1,240) and its whole economy are prototype-only** — no missions, rewards, Salvage Run, Inventory, or Shop supply it yet. Documented in both `types/player.ts` and `data/player.ts`.
- **`calculateShipAlloyCost`'s formula is explicitly temporary economy tuning**, same status as the pre-existing `calculateUpgradeCost` curve — both are disclosed in code comments as adjustable once the full progression economy is unified.
- **The known Level 12/30 vs 12/40 Fleet-Roster/Ship-Detail inconsistency** (documented in the Ship Detail completion report) is untouched and doesn't affect this screen, since Ship Upgrade always reads the real `player.shipProgress[shipId].level`, not either screen's disclosed reference-fixture value.

## 17. Confirmation: unrelated approved screens / frozen components

Not modified (confirmed both by not editing them and by the mtime audit in §3): `HubScreenShell.tsx`/`.css`, `HubHeader.tsx`/`.css`, `HubBottomNav.tsx`/`.css`, Home, Battle Hub, Campaign Overview, Campaign Chapter Map, Campaign Stage Detail, Pre-Battle, Fleet Roster, Ship Detail (screen + all its own components), `routes.tsx` (no route added/changed), `App.tsx`, `assetRegistry.ts`, `ships.ts`, gameplay code, and Star Rank/Weapon Upgrade/Abilities/Skins/Companions/Modules/Inventory/Shop (none of which exist as real screens yet — none were started).

`npx tsc -b --noEmit` and `npx vite build` were re-run after all edits and both stayed clean, which is the strongest signal available (short of the missing screenshots) that nothing outside the intended file set was broken.
