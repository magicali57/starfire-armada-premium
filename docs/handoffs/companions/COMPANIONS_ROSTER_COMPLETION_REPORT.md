# Companions Roster — Completion Report

Route: `#/inventory/companions` (`RouteId: "companions"`)
Reference: `17_Companions_Roster.png` (941×1672), copied to `docs/references/mobile_screens_selected/17_Companions_Roster.png`; 10 labeled crops at `docs/references/crops_companions/`.

## 1. Summary

The Companions Roster screen is implemented as a real route, reusing the standard `HubScreenShell`/`HubHeader`/`HubBottomNav active="inventory"` hub shell (not Loadout Manager's bespoke footerless shell), a new hero/featured panel showing the currently-focused companion with Details/Equip actions, role filters (All/Attack/Defense/Repair/Utility), a sort control (5 real modes), and a data-driven grid of all 6 real companions from `data/companions.ts`. No new companion data, ownership model, Power formula, or artwork was created — every number and asset comes from the existing, unmodified `COMPANIONS` array and `data/loadout.ts`'s existing calculation helpers.

## 2. Reference inspection findings

Direct bitmap inspection (10 crops, re-verified in this session against the original PNG on disk, not assumed from memory) confirmed:

- **Header**: standard hub top bar (existing `HubHeader`, untouched).
- **Title region**: Back chevron, "COMPANIONS" heading, subtitle "Support units and drones", count line "N of M companions acquired" (reference showed "4 of 6" — its own illustrative acquisition state, not a value to hard-code).
- **Hero panel** (not in the task's own suggested component list, but clearly present in the bitmap between the title and filter row): rarity pill, companion art, name, role row (icon + single-word role), "LEVEL 8/20" with a fill bar, "RANK ★★★★☆ 4/5" star row, "POWER 1,980" with crossed-swords icon, and two buttons: **DETAILS** and **EQUIP**. This is the direct source of the task's own "Equip behavior" section — the reference does clearly show a roster-level Equip control, so one was implemented.
- **Filter row**: ALL / ATTACK (swords) / DEFENSE (shield) / REPAIR (green circle+cross) / UTILITY (purple crossed tools). Note the label mismatch: the same green circle+cross icon appears on Repair Drone's own role row as "SUPPORT", but its filter tab is labeled "REPAIR" — confirmed by direct pixel inspection, not assumed.
- **Cards** (6, in 3 rows of 2): rarity pill, equipped ribbon (Repair Drone only), art, name, role row, Lv./Power figures, 5-star rank row, and a footer that is **either** a green "UPGRADE READY ↑" banner (Repair Drone, Assault Drone — both shown at rank 4/5) **or** an "X/Y FRAGMENTS" progress bar with a diamond icon (Shield, EMP, Supply, Tactical Drone) — never both. Tactical Drone is shown locked (padlock silhouette, "Complete Campaign Chapter 12 to unlock", 0/50 Fragments).
- **Footer**: standard 5-tab nav, Inventory highlighted — confirmed this is the standard `HubBottomNav` pattern, not Loadout's footerless shell.

**Important, expected mismatch, disclosed rather than silently resolved**: the reference's 6 illustrative companion names (Repair Drone, Assault Drone, Shield Drone, **EMP Drone**, **Supply Drone**, **Tactical Drone**) do not match this codebase's real 6 companions (Assault, Beam, Missile, Repair, Shield, **Utility** Drone). Per the task's explicit data-reuse mandate, the real `COMPANIONS` array was used as-is — the reference supplied layout/structure/states, not literal content, exactly like every other screen built in this project (Fleet Roster, Ship Detail, etc. all reproduce reference *layout* with real ship data, never the reference's own placeholder names).

## 3. Asset preflight/postflight (companion art safety)

All 6 `COMPANION_ART` paths were recorded before any edit and re-verified after the build:

| File | Size (bytes) | Preflight | Postflight (build output) |
|---|---|---|---|
| assault_drone.png | 1,797,985 | PNG 1254×1254 | hash match |
| beam_drone.png | 1,774,539 | PNG 1254×1254 | hash match |
| missile_drone.png | 1,881,952 | PNG 1254×1254 | hash match |
| repair_drone.png | 2,028,823 | PNG 1254×1254 | hash match |
| shield_drone.png | 1,859,594 | PNG 1254×1254 | hash match |
| utility_drone.png | 1,695,114 | PNG 1254×1254 | hash match |

`sha256sum` of all 6 source files vs. the corresponding files inside the scratch `vite build` output were identical for every file. `public/` was independently re-confirmed at 253 files / 345MB (unchanged from the recovered baseline) before and after this phase — no rename/move/delete of `public/`, no build ever targeted the real `public/`/`dist/`, all builds went to `/tmp/starfire-companions-build`. No `rm -rf` was run against any project directory this phase.

## 4. Data reuse (no duplication)

- `data/companions.ts`, `types/companion.ts`, `data/loadout.ts`'s `calculateCompanionPower`/`getCompanionProgressOrDefault` — all reused unmodified.
- `player.activeLoadout.companionId` is the sole equipped-companion source; `player.ownedCompanionIds` is the sole ownership source; `player.companionProgress` is the sole level/rank source. No second companion definition file, ownership list, artwork registry, or Power formula was created.
- New file: `src/data/companionRoster.ts` — pure view-model functions only (`buildCompanionRosterItems`, `filterCompanionRosterItems`, `sortCompanionRosterItems`, `getCompanionRosterCounts`, `getCompanionRosterReturnTarget`, `getCompanionRosterItem`). No calculation happens inside any component's JSX.

## 5. Disclosed design decisions and deviations

1. **Hero panel added beyond the suggested component list.** Required by direct bitmap inspection (§2). Structurally mirrors Fleet Roster's already-approved `FleetFeaturedPanel` (focused item + Details/Equip), not a new pattern.
2. **Role label/filter normalization**, exactly as the task instructed: the real `CompanionRole` type (`"Attack Support" | "Defense Support" | "Support" | "Utility Support"`) is untouched. A new `companionRoleStyle.ts` + `companionRoster.ts` maps it to (a) a short per-card display label (`COMPANION_ROLE_DISPLAY_LABEL`: Attack/Defense/**Support**/Utility) and (b) a separate filter category (`COMPANION_ROLE_FILTER_KEY`: attack/defense/**repair**/utility). Repair Drone's card still says "SUPPORT" (matching its real role and the reference's own card label) while living under the "Repair" filter tab (matching the reference's own filter tab label) — the exact inconsistency the reference itself shows, reproduced faithfully rather than "fixed."
3. **Rank-progress bar instead of a fabricated "Fragments" count.** The reference's card footer shows "X/Y FRAGMENTS" backed by a currency (Companion Data) that has no real balance or economy in this codebase (`MaterialId` doesn't include it yet). Rather than invent numbers, owned/non-upgrade-ready cards show real `rank`/`maxRank` (e.g. "0/5 RANK") using the same visual treatment and the `MATERIAL_ICON.companionData` icon (the closest real, registered, thematically-correct asset). This is honest, derived data, not a fabricated balance.
4. **`upgradeReady` rule (presentation only)**: `owned && rank === maxRank - 1` (rank 4 of 5) — the one thing the reference's two "UPGRADE READY" examples (Repair Drone, Assault Drone) have in common. No real upgrade cost/cap system exists; tapping the banner opens a "Companion Upgrade is coming soon" modal only.
5. **Level cap (20) / Rank cap (5)**: taken directly from the reference hero panel's own "8/20" and "4/5" readouts, and independently confirmed by `blueprint.md` §11.3 ("Level 1–20", "Rank 0–5"). These are presentation caps for progress-bar math only — no level-up/rank-up transaction was built.
6. **Documented, not resolved: Level 60 vs. Level 20 inconsistency.** `data/player.ts`'s `DEFAULT_PLAYER_STATE` sets Repair Drone's `companionProgress` to `{ level: 60 }` (calibrated so Loadout Manager reproduces `10_Loadout_Manager.png`'s exact Power figures) — this exceeds the Companions Roster's own 20-level cap. Per the task's explicit instruction, this screen displays the real stored value (60) as-is; the progress bar clamps visually via `Math.min(100, ...)` so it doesn't overflow, but the printed "60 / 20" text is left honest and unclamped. This is a pre-existing data inconsistency between two reference images, not something this task was scoped to fix.
7. **Documented, not reproduced: Supply Drone's missing star row.** In the reference, Supply Drone (Rare) omits the rank-star row entirely while Shield Drone (also Rare) shows one — inspected closely via a tight crop and confirmed to be a real reference inconsistency, not a legibility artifact. This implementation renders the rank row consistently for every owned companion (simpler and more predictable than conditionally hiding it), which is a deliberate, disclosed deviation from that one inconsistent reference card.
8. **Equip flow**: confirmed present in the reference (§2), so implemented exactly as the task's own example prescribes — `saveActiveLoadout({ ...player.activeLoadout, companionId })`, reusing the existing atomic store transaction unmodified. Never mutates currencies, materials, levels, ranks, or ownership. No confirmation step (matches Fleet Roster's own immediate-equip precedent); a success modal reports the result. Does not force-navigate back to Loadout even when opened with `?return=loadout` — the reference gives no evidence of an auto-redirect, so the player stays on Companions Roster and dismisses the modal manually.
9. **Card interaction split**: tapping a card body selects/previews it in the hero panel (owned cards only, mirrors Fleet Roster's existing select-to-preview pattern, which is what makes the hero panel's Equip button meaningful for non-equipped companions); a separate small info button (same circular-badge convention as `LoadoutItemCard`/`LoadoutSlotCard`) opens the informational Companion Detail modal; locked cards route their whole body to the acquisition-info modal instead (nothing to preview).

## 6. Home entry point — not wired, with reasons

The task asked for a "Home's Companions shortcut → `?return=home`" entry point. Direct inspection of `HomeScreen.tsx` and `assetRegistry.ts` found **no existing clickable Companions control on Home**: `HOME_BOTTOM_SHORTCUT_ICON.companions` is a registered-but-never-rendered icon asset, and the "Companion" row inside `ActiveLoadoutPanel` is plain text inside the loadout panel's single whole-panel `<button>` (which already deep-links to Loadout Manager) — not a separately clickable element. H-01 Home Dashboard is documented in `STARFIRE_ARMADA_SCREEN_AND_NAVIGATION_MAP.md` as "Existing, approved and frozen," and this task's own instructions explicitly forbid visually redesigning Home or adding new Home UI.

Rather than fabricate a new clickable region on a frozen, approved screen (which the task also explicitly disallows) or reach into a nested-button structure, this entry point is **left unwired and disclosed** rather than silently declared "done." Home → Companions Roster is currently reachable indirectly via Home → Active Loadout → Loadout Manager → (new) companion-slot Info button → Companions Roster. A future, explicitly-scoped Home-editing task should add a real Companions shortcut control before this direct entry point can be wired safely.

## 7. Loadout Manager entry point

`LoadoutManagerScreen.tsx`'s `handleSlotInfo` — the companion slot's existing Info button (already a distinct, `stopPropagation`-guarded control separate from the slot's own select action) now navigates to `${pathFor("companions")}?return=loadout"` instead of opening the `itemInfo` dialog, mirroring the ship slot's own pre-existing "Info navigates to a real screen" behavior directly above it in the same function. This reuses an existing control exactly as instructed — no new UI was added to Loadout Manager. `Alternative Items`' own `onInfoItem` still opens the lightweight `openCompanionInfo` modal for companions being browsed mid-comparison — only the main equipped-companion slot's Info tap changed.

**Loadout draft safety** (verified, not assumed):
- Opening Companions Roster is a pure hash-route change. React unmounts `LoadoutManagerScreen`, but its module-level `let inMemoryDraftCache` is untouched — Companions Roster's code never references it.
- Returning to Loadout Manager remounts the screen, whose own `useState(() => inMemoryDraftCache ?? {...player.activeLoadout})` restores the draft exactly as before this task, unchanged.
- **Known, disclosed limitation**: a roster-level Equip commits directly to the real `player.activeLoadout` (copying it and replacing only `companionId`, per the task's own prescribed approach) — it does not know about or touch `inMemoryDraftCache`. If the player has an *unsaved module edit* in Loadout Manager, then equips a different companion from Companions Roster, then returns to Loadout and presses Save without noticing, their stale draft's old `companionId` would silently overwrite the just-made Roster equip. This is an inherent property of having two independent write paths into `activeLoadout.companionId` and is not something this task could fix without modifying Loadout Manager's own internals (out of this task's frozen scope). It is the direct, disclosed consequence of implementing Equip exactly the way the task itself prescribed.

## 8. Verification

- `tsc -b --noEmit`: clean, zero errors (one unused-import error was caught and fixed during this pass).
- `vite build --outDir /tmp/starfire-companions-build --emptyOutDir`: succeeded, 259 modules, 28.62s, zero errors/warnings.
- mtime regression: `find src docs -newermt <25 min ago>` listed exactly the files intended for this phase (10 new `components/companions/*` files + `companionRoleStyle.ts`, `data/companionRoster.ts`, `screens/companions/*`, and 5 intentionally-modified files: `BattleModeIcon.tsx`, `app/routes.tsx`, `app/App.tsx`, `layout/AppShell.tsx`, `screens/loadout/LoadoutManagerScreen.tsx`). No frozen shared component (`HubHeader`, `HubScreenShell`, `HubBottomNav`) or unrelated screen was touched.
- Standalone regression script (`verify_companion_roster.mjs`, hand-transcribed from the real formulas per this sandbox's established `npx tsx`-hangs workaround): **29/29 assertions passed**, including the critical check that the equipped companion's (Repair Drone) roster Power exactly equals Loadout Manager's own calibrated value (**1,980**), Power for all 6 companions at their real default progress, ownership/equipped-flag correctness, all 5 sort modes, all 4 filter categories, and the role-label/filter-key normalization.
- Save-state regression: `SAVE_SCHEMA_VERSION` confirmed still `4`; `src/types/*`, `src/data/player.ts`, and `src/store/playerStore.tsx` confirmed untouched this phase (zero files modified) — no schema bump, no migration changes.
- Companion asset integrity: see §3.

## 9. Mobile / accessibility static audit

No headless browser is available in this sandbox (same disclosed limitation as every previous phase in this project — `playwright` is not an installed dependency and the browser binary download requires network access this sandbox doesn't have; confirmed again this session, not assumed from memory). Verification here is a static CSS/structural audit, not rendered-screenshot verification:

- `grep` for `text-overflow: ellipsis` and `100vw` across every new file: zero matches. Companion/hero/title names all use `overflow-wrap: break-word; white-space: normal` (never truncate), matching the project's established §30/§31 rule.
- Grid uses `1fr 1fr` (2-column) collapsing to a single column at ≤360px, matching Fleet Roster's own already-approved grid breakpoint pattern exactly.
- Filter row is a `overflow-x: auto` contained scroller with hidden scrollbar (`scrollbar-width: none`), never causes document-level horizontal scroll — same pattern as `FleetRoleFilterBar`.
- Sort control is a real, always-fully-visible native `<select>` (not an icon-only collapse).
- The controls row (filters + sort) stacks vertically at ≤360px so the sort control never gets squeezed.
- Every interactive element is a real `<button>` (or `<select>` with `aria-label`); no nested buttons (info button and upgrade banner are structural siblings of the card's main button, not children of it).
- `object-fit: contain` used for all art.
- No color-only signaling: equipped state has both a text ribbon and border/glow; locked state has both a padlock icon and grayscale filter plus explicit text; upgrade-ready has both color and explicit "Upgrade Ready" text.
- Companion/hero art uses `alt=""` with the descriptive name/rarity/locked state carried on the enclosing `<button>`'s `aria-label` instead — this intentionally matches `FleetShipCard`'s own established accessibility pattern in this codebase (avoids a screen reader announcing the name twice), rather than diverging from it.

This is a disclosed limitation, not a claim of visual verification — no screenshot path is referenced anywhere in this report because none was captured.

## 10. Frozen scope confirmed untouched

`HubScreenShell.tsx/css`, `HubHeader.tsx/css`, `HubBottomNav.tsx/css`, `HomeScreen.tsx`, `data/companions.ts`, `types/companion.ts`, `data/loadout.ts`'s existing exports, `store/playerStore.tsx`, `types/player.ts`, ship progression/Ship Level Up/Ship Alloy/Credits economy, existing module definitions, existing companion/module artwork, and all 10 previously-approved screens — none were modified (confirmed via the mtime regression in §8). No Companion Detail/Upgrade route, Module Inventory/Detail/Upgrade, Inventory Hub, or Shop work was started.

## 11. Known gaps / honest limitations

- Home entry point not wired (§6) — disclosed, not silently skipped.
- No rendered screenshot verification (§9) — disclosed, not fabricated.
- The Loadout-draft/roster-Equip interaction edge case (§7) is a real, disclosed limitation inherent to the task's own prescribed Equip implementation, not an oversight.
- `upgradeReady` never triggers under the current default save (all ranks are 0) — the green banner exists and is wired correctly but won't be visible until real rank data exists; this was confirmed via the regression script (assertion 5), not left as a guess.
