# Loadout Manager — Completion Report

## 1. Summary

The Loadout Manager screen (`#/inventory/loadout`) is fully implemented: real player state (`activeLoadout`, companion/module ownership and progression), real companion/module definitions, a real save/reset transaction, a pure Power/stat-contribution calculation layer, a bespoke footerless shell built only from the shared `HubHeader`, and navigation wiring from Home, Pre-Battle, Campaign Stage Detail, and Fleet Roster. The default loadout's Power and stat-contribution numbers are calibrated to reproduce the approved reference exactly, verified with a standalone script (§18/§19 below), not hard-coded.

An unrelated but serious incident occurred mid-task: a verification command I ran deleted the project's `public/` asset folder (345MB, 253 files). It was fully recovered from a backup ZIP you provided and re-verified byte-for-byte against that backup. Full account in §29. I'm disclosing this prominently because it's the most important thing that happened during this session, even though it's not part of the Loadout Manager feature itself.

## 2. Reference inspected

`docs/references/mobile_screens_selected/10_Loadout_Manager.png`, 941×1672, inspected directly (full image plus 7 cropped regions: top bar, ship section, four equip slots, power panel, stat panel, action buttons, alternative items) in the portion of this session before the compaction boundary. The screen's structure (shared header, back+title row, single neon-framed main panel with ship+companion+3 module slots, Total Power panel, Stat Contribution panel, gold Save / blue Reset, Alternative Items with category selector) is reproduced with real components; no part of the PNG is used as a background or flattened image.

## 3. Files created

Types:
- `src/types/loadout.ts` — `PlayerLoadout`, `LoadoutStatContributions`, `EMPTY_LOADOUT_STAT_CONTRIBUTIONS`, `LoadoutSlotId`, `LoadoutFailureReason`, `SaveLoadoutResult`
- `src/types/companion.ts` — `CompanionRole`, `CompanionProgress`, `CompanionDefinition`
- `src/types/module.ts` — `ModuleSlot`, `ModuleProgress`, `ModuleDefinition`

Data:
- `src/data/companions.ts` — 6 `CompanionDefinition`s
- `src/data/modules.ts` — 12 `ModuleDefinition`s (4 per slot)
- `src/data/loadout.ts` — pure calculation/view-model layer (see §18–§21)

Screen:
- `src/screens/loadout/LoadoutManagerScreen.tsx`
- `src/screens/loadout/LoadoutManagerScreen.css`

Components (`src/components/loadout/`):
`LoadoutTitleBar`, `LoadoutMainPanel`, `LoadoutShipPanel`, `LoadoutCompanionSlot`, `LoadoutModuleSlot` (+ shared `LoadoutSlotCard.css`), `LoadoutPowerSummary`, `LoadoutStatContributions`, `LoadoutActions`, `LoadoutAlternativeItems`, `LoadoutItemCard`, `LoadoutDialog` — 11 components, each with its own `.tsx`/`.css` except the two slot components, which intentionally share one stylesheet (near-identical tile markup).

This report: `docs/handoffs/loadout/LOADOUT_MANAGER_COMPLETION_REPORT.md`

## 4. Files modified

- `src/types/player.ts` — `SAVE_SCHEMA_VERSION` 3→4; `PlayerState` gains `activeLoadout`, `ownedCompanionIds`, `ownedModuleIds`, `companionProgress`, `moduleProgress`
- `src/data/player.ts` — default companion/module ownership + the reference-matched default `activeLoadout`
- `src/data/index.ts` / `src/types/index.ts` — barrel exports for the new modules
- `src/store/playerStore.tsx` — v3→v4 migration, `saveActiveLoadout` transaction
- `src/app/routes.tsx` — `loadout` route id/path/hash-map entry
- `src/app/App.tsx` — switch case for `loadout`
- `src/components/layout/AppShell.tsx` — added `loadout` to the bottom-nav suppression list (comment-only addition, no visual change to the component)
- `src/screens/home/HomeScreen.tsx` — `ActiveLoadoutPanel`'s tap now navigates to `#/inventory/loadout?return=home` instead of opening a coming-soon modal; no visual change
- `src/screens/campaign/PreBattleScreen.tsx` — "Change Loadout" now navigates with `?return=pre-battle&stage=<id>`; no visual change
- `src/screens/campaign/CampaignStageDetailScreen.tsx` — "Change Loadout" now navigates with `?return=stage-detail&stage=<id>`; no visual change
- `src/screens/fleet/FleetRosterScreen.tsx` — `handleEquip` now redirects back to Loadout Manager when opened with `?return=loadout`; no visual change

## 5. Route behavior

`RouteId` gained `"loadout"`, mapped to path `#/inventory/loadout` in `ROUTES` and `HASH_TO_ROUTE`. Not a repoint of any existing placeholder — genuinely new, since nothing previously occupied this path. `resolveRoute` strips the `?...` suffix before lookup (existing behavior, unchanged), so `#/inventory/loadout?return=home&...` resolves correctly. No existing route id, path, or component was renamed or reassigned.

## 6. Entry-point wiring

- **Home**: `ActiveLoadoutPanel`'s button now sets `window.location.hash` directly (same pattern as `FleetRosterScreen`'s `handleDetails`) instead of calling the coming-soon handler. The now-unused `onOpen` prop was removed from `ActiveLoadoutPanel`'s signature and its one call site to keep the file free of dead parameters.
- **Pre-Battle**: `Change Loadout` reads the existing `stageId` (already parsed via the screen's own `useMemo`) and navigates only if it's present; no-ops otherwise (matches the existing `backToStageDetail` guard style). No Energy is touched.
- **Campaign Stage Detail**: identical pattern using its own existing `stageId`.
- **Fleet Roster**: a new `cameFromLoadout` `useMemo` parses `window.location.hash` once (same convention as `stageId` elsewhere) for `return=loadout`. `handleEquip` calls the existing `selectOwnedShip` unchanged, then — only when `cameFromLoadout` — redirects to `#/inventory/loadout`. Locked ships were already unreachable through `handleEquip` (the featured panel only invokes it for ownable ships); this is untouched. Fleet Roster's normal behavior (no redirect) is preserved whenever it's opened without `return=loadout`.

## 7. Return-target behavior

`getLoadoutReturnTarget(hash)` (`data/loadout.ts`) parses `?return=...&stage=...` into a typed union: `{kind:"pre-battle",stageId}`, `{kind:"stage-detail",stageId}`, `{kind:"home"}`, or `{kind:"fallback"}`. It's computed once on mount via `useMemo(() => ..., [])`, reading `window.location.hash` directly — so it works identically on a client-side navigation, a direct route entry, or a full page reload, not just browser history. `resolveBackDestination` in the screen applies the required priority (pre-battle+stage → stage-detail+stage → home → fallback-to-home) by construction, since only one `return` value is ever present at a time. Unknown/malformed `return` values, or a missing `stage` when required, fall through to `home`.

## 8. Shell / header / footer behavior

`LoadoutManagerScreen` renders `<HubHeader/>` directly (unmodified, same `player`/`xpPct`/`onOpen` props every other hub screen passes it) followed by a `<main className="loadout-screen__scroll">`. It does **not** use `HubScreenShell` — that component's grid recipe always reserves a 5th footer row and can't be used footerless without editing it, which was explicitly forbidden. Instead `LoadoutManagerScreen.css` defines its own 2-row grid (`8.1% 91.9%`), reusing the literal `8.1%` header-row percentage from the shared `--hub-shell-rows` token so the header lands in the same box height as every other hub screen without needing the shared component itself. No `HubBottomNav` and no generic `BottomNavigation` are rendered; `AppShell.tsx`'s suppression list gained `route !== "loadout"` alongside the existing entries for Ship Detail/Ship Level Up/Pre-Battle/etc. Confirmed by direct inspection of the JSX tree: exactly one `<HubHeader/>`, zero footer components.

## 9. Player-state additions

```ts
activeLoadout: PlayerLoadout;              // companionId/coreModuleId/platingModuleId/systemModuleId, each string|null
ownedCompanionIds: string[];
ownedModuleIds: string[];
companionProgress: Record<string, CompanionProgress>;  // { level, rank?, xp? }
moduleProgress: Record<string, ModuleProgress>;
```
`selectedShipId` remains the sole source of truth for the equipped ship — `PlayerLoadout` was never given a ship or weapon field. Companion/module progression is a separate `Record`, deliberately not derived from or coupled to `shipProgress`.

## 10. Save schema v3→v4 migration

`SAVE_SCHEMA_VERSION = 4`. `MIGRATABLE_SCHEMA_VERSIONS = [2, 3, 4]`. `mergeWithDefaults` spreads `DEFAULT_PLAYER_STATE` under the parsed save, then explicitly re-merges every nested object/record (`currencies`, `materials`, `shipProgress`, and the three new v4 records) so a save missing only the v4 fields keeps every v2/v3 field untouched. `loadPlayerState` re-persists immediately at v4 whenever the loaded version differs, so a save only ever needs to migrate once. An unrecognized/missing/future schema version falls back to `DEFAULT_PLAYER_STATE` rather than attempting a merge.

**Verified** with a standalone Node script (`getLoadoutValidation`/migration logic transcribed verbatim from the real, already-typechecked source — see §25) run against synthetic data — 30/30 assertions passed, covering: a realistic v3 save migrating to v4 with Ship Alloy/Credits/Crystals/Energy/selected-ship/ship-progression/campaign-progression all preserved exactly; a v4 save with a customized (non-default) loadout round-tripping unchanged; a v4-tagged save missing the new fields getting them backfilled without disturbing existing fields; corrupt JSON falling back safely; a fresh install getting valid v4 defaults; and an unrecognized future schema version (99) falling back rather than being merged.

## 11. Companion definitions

`src/data/companions.ts` — 6 entries (`companion-assault-drone`, `-beam-drone`, `-missile-drone`, `-repair-drone`, `-shield-drone`, `-utility-drone`), one per existing `COMPANION_ART` key, reusing `ShipRarity` rather than a second rarity system. `repairDrone`'s `basePower`/`health`/`energyRegen` are precisely back-solved (see §18) so the reference-matched default loadout reproduces the reference's exact numbers; the other 5 are reasonable, disclosed estimates using the same formula. Helpers: `getCompanionById`, `getCompanionArtKey`.

## 12. Module definitions

`src/data/modules.ts` — 12 entries, split 4/4/4 across `core`/`plating`/`system`. Three module→slot assignments are reference-confirmed (Overdrive Matrix=core, Reactive Armor=plating, Calamity Capacitor=system, all visible in the bitmap); the other 9 are assigned by name/theme, disclosed in the file's header comment as an independent decision (not required to match, and intentionally does not match, `PreBattleScreen.tsx`'s own unrelated `MODULE_ART_BY_SLOT` art-only substitution). The same 3 modules' `basePower`/`statContributions` are back-solved for reference fidelity; the other 9 are estimates. Helpers: `getModuleById`, `getModulesBySlot`, `getModuleArtKey`.

## 13. Prototype ownership decisions

Every current companion and module definition is owned by default (`ownedCompanionIds`/`ownedModuleIds` = full `COMPANIONS`/`MODULES` id lists) — disclosed in `data/player.ts` as a prototype model, since no Companion Roster/Module Inventory/reward system exists yet to grant them individually. `companionProgress`/`moduleProgress` default to only the 4 default-loadout items having real progress entries (Repair Drone Lv.60; Overdrive Matrix/Reactive Armor/Calamity Capacitor Lv.80) — every other owned item has no progress entry, and `getCompanionProgressOrDefault`/`getModuleProgressOrDefault` fall back to `{level: 1}` for those, so nothing crashes when an alternative item without an explicit progress record is displayed or selected.

## 14. Active loadout behavior

`activeLoadout` is read/written only through `player.activeLoadout` (source of truth) and the screen's `draftLoadout` (working copy). No separate "current loadout" state exists anywhere else.

## 15. Draft behavior

`draftLoadout` initializes from `player.activeLoadout` (or an in-memory cache — see below) on mount. Selecting a companion/module alternative updates only `draftLoadout`; nothing is persisted until Save. `isDirty = !areLoadoutsEqual(draftLoadout, player.activeLoadout)`. The selected ship is read fresh from `player.selectedShipId` on every render, so returning from Fleet Roster after an equip picks up the new ship automatically without touching `draftLoadout` at all.

A genuine architectural wrinkle: navigating to Fleet Roster is a real route change, which unmounts `LoadoutManagerScreen` and would normally destroy `draftLoadout` (plain `useState`). To honor "preserve/reconcile draft, don't silently discard unrelated unsaved changes" across that specific round trip, `draftLoadout` writes are mirrored into a module-scoped `let inMemoryDraftCache` variable (not `localStorage`/`sessionStorage` — no browser storage, per project convention) that survives the unmount and re-seeds the next mount's initial state. It's cleared on a successful Save, an explicit Reset, or a confirmed Discard, and is never consulted after an actual page reload (a reload always starts from the real saved `player.activeLoadout`, same as everywhere else in the app). This is disclosed here as a deliberate, scoped exception to "no browser storage," not an oversight — it holds no persistent data, only a transient in-memory value for the current tab session.

## 16. Save transaction behavior

`saveActiveLoadout(loadout)` in `playerStore.tsx`: validates synchronously against the current `player` via `getLoadoutValidation` (`data/loadout.ts` — the same function the screen uses to decide whether the Save button is enabled, so there is exactly one place defining the rules), returns one of the 10 specified failure reasons on the first violation found, then — on success — re-validates against the freshest state inside the `update()` callback (defensive, same pattern as `upgradeShipLevels`), commits all four fields in a single `{...prev, activeLoadout: {...loadout}}`, and persists once via `update`'s existing single `persistPlayerState` call. Never mutates `currencies`/`materials`. A `loadoutSaveInFlight` ref guard returns `{success:false, reason:"busy"}` for a concurrent call.

## 17. Reset behavior

`handleReset` calls `setDraftLoadout({...player.activeLoadout})` and clears the in-memory cache — restores from the real saved loadout, never a hard-coded default, never touches `selectedShipId`, spends nothing, and does not call the store (no persistence, no progression change). Button-state table implemented exactly as specified: no changes → both disabled (`canSave={isDirty && valid}`, `canReset={isDirty}`); valid changes → both enabled; invalid draft → Save disabled (via `validation.valid`), Reset enabled; saving → both disabled (`saving` flag).

## 18. Total Power calculation

`calculateLoadoutTotalPower(ship, shipLevel, loadout, player)` sums `shipContribution + companionContribution + coreModuleContribution + platingModuleContribution + systemModuleContribution`, each independently zero for a missing ship/empty slot/unresolvable id. `calculateLoadoutShipContribution` is literally `calculatePowerScore(calculateShipStats(ship, level))` — the same functions Ship Detail/Ship Level Up already use, not a new formula. Companion/module Power is `Math.round(scaleByLevelAndRarity(basePower, level, rarity))`, where `scaleByLevelAndRarity(base, level, rarity) = base * (1 + level*0.01) * RARITY_POWER_MULTIPLIER[rarity]` — a real, general formula (not the reference number hard-coded), back-solved only in `basePower` so it happens to reproduce the reference exactly for the 4 default-loadout items at their reference levels/rarity.

**Verified numerically** (standalone script, `verify_loadout_power.mjs`, 16/16 assertions): Companion Power 1980, Core 2640, Plating 2360, System 1880 — all match the reference exactly.

## 19. Stat contribution calculation

`LoadoutStatContributions` (attack/health/criticalRate/criticalDamage/armor/energyRegen) is summed from companion + 3 modules only (empty/null → zero each); the ship's own six `ShipStatBlock` stats are untouched and not merged in. **Display-formatting deviation, disclosed**: the task's own suggested rule was "all six as percentages," but direct inspection of the reference bitmap shows Attack/Health/Armor as flat additive integers (`+3,450`, `+16,400`, `+2,150`) and only Critical Rate/Critical Damage/Energy Regen as percentages (`+18.0%`, `+42.0%`, `+12.0%`). `formatStatContribution` in `data/loadout.ts` follows the actual bitmap, not the paraphrased suggestion, per "inspect the bitmap directly" — this is the one place this implementation intentionally diverges from the prompt's own wording in favor of the image.

**Verified**: all six combined totals reproduce the reference exactly (Attack +3450, Health +16400, Critical Rate +18.0%, Critical Damage +42.0%, Armor +2150, Energy Regen +12.0%) — same script as §18.

## 20. Intrinsic weapon handling

`PlayerLoadout` has no `weaponId` field, no weapon slot, no weapon ownership list. The ship panel displays the selected ship's real `weaponLevels` entry matching its actual `ShipProgress.weaponLevel` (not derived from ship level), labeled with the reference's own "Weapon Power" terminology — but that Power figure is the same combined `calculateLoadoutShipContribution` number used in the Total Power sum, exactly matching how Ship Detail/Ship Level Up already treat a ship's Power as one combined figure (weapon level isn't a separate stat input to `calculateShipStats`, so there's no second formula to invent). Alternative ship cards (the reference's "Railgun"/"Swarm Missiles"-style entries) select/preview their owning ship via Fleet Roster, never a standalone weapon.

## 21. Fleet return/equip flow

Loadout's "Change Ship" and every alt-item ship card set `window.location.hash = "#/ships?return=loadout"` — never touch `selectedShipId` directly. Fleet Roster's existing `handleEquip` (unchanged apart from the new conditional redirect described in §6) commits the equip through the pre-existing `selectOwnedShip` action, then redirects back to `#/inventory/loadout` only when it detects the `return=loadout` marker. Locked ships were already unreachable through this path (Fleet Roster's own `FleetFeaturedPanel` gates Equip to ownable ships); untouched.

## 22. Mobile responsiveness results (static analysis — see §26 for the tooling disclosure)

- No `100vw` usage anywhere in the new CSS (grepped, zero hits).
- Every new panel/container follows the `width:100%; max-width:100%; min-width:0; box-sizing:border-box` convention; fixed pixel widths are only small icons (10–32px) or the intentionally fixed alt-item card width (96px, inside the one deliberate horizontal scroller).
- `.loadout-main-panel__slots` is a 4-column grid that collapses to 2 columns at `max-width: 360px`.
- `.loadout-ship-panel` drops its art column from 96px to 80px at `max-width: 360px`.
- `.loadout-stat-contributions__grid` drops from 2 columns to 1 at `max-width: 390px`.
- `.loadout-actions` (Save/Reset) stacks vertically only below `max-width: 340px`; otherwise shares one row, and both buttons always render (never conditionally hidden).
- The only horizontal scroller anywhere on the screen is `.loadout-alt-items__scroller` (`overflow-x:auto`, scoped to that one element); the document/screen root never scrolls horizontally.
- **Found and fixed during this verification pass**: `.loadout-item-card__name`, `.loadout-slot-card__name`, `.loadout-stat-contributions__label`, and `.loadout-dialog__stat-label` were all originally truncated with `text-overflow: ellipsis`, which directly violates the "do not hide essential names/labels with ellipsis" requirement. All four now wrap (`white-space: normal; overflow-wrap: break-word`) instead, with `min-height`/`line-height` reserved so a long name like "Emergency Repair Plating" grows the tile by a line rather than being cut off.
- Bottom content padding includes `calc(var(--space-6) + env(safe-area-inset-bottom))` so Save/Reset are never hidden behind an Android gesture-nav bar.

## 23. Type-check result

`npx tsc -b --noEmit` — clean, zero diagnostics. Run after every meaningful edit throughout this phase, most recently after the ellipsis fixes in §22 (CSS-only, but re-run for completeness).

## 24. Build result

`npm run build` (`tsc -b && vite build`) could not be run to completion writing to the project's own `dist/` — every attempt either hung the sandbox's command wrapper or hit its 45-second limit while copying `public/`'s 345MB across the OneDrive-synced FUSE mount (this is a sandbox I/O characteristic, not a code defect — see §29, the same mount was the site of the deletion incident). To get a real, complete build result without touching the project's own `dist/` folder, I ran `npx vite build --outDir /tmp/dist-verify` (an output-location override only — no project file was moved, renamed, or deleted for this check). That completed in **29.89s** with zero errors: `241/241 modules transformed`, JS bundle `333.47 kB` / CSS bundle `163.84 kB` emitted, and all 253 `public/` files (256 total output files, 345MB) copied into the output correctly. I'm disclosing the exact mechanism rather than just claiming "build passed" so it's clear what was and wasn't verified.

## 25. Tests / verification scripts run

No test framework is configured in this project (confirmed via `package.json` — only `dev`/`build`/`preview`/`typecheck`/`lint` scripts exist). Verification was done with two standalone Node scripts, written this phase and run with plain `node` (not `ts-node`/`tsx` — `npx tsx` tried to fetch an uninstalled package from the registry and hung on this sandbox's restricted network, the same class of issue as the previously-disclosed `playwright install` failure):

- `verify_loadout_migration.mjs` — 30/30 assertions (migration + `getLoadoutValidation`, §10/§16)
- `verify_loadout_power.mjs` — 16/16 assertions (Power/stat calibration, §18/§19)

Both scripts transcribe the real, already-typechecked source logic verbatim rather than re-deriving it, so a mismatch would indicate a bug in the script, not in the app — this is disclosed as the same honest caveat used for this pattern in the Ship Level Up phase.

## 26. Screenshot paths

**None were captured.** `playwright install chromium` is unavailable in this sandbox (network allowlist blocks the download — the same limitation disclosed in the Ship Level Up completion report, still present). I did not fabricate screenshots or claim visual verification that didn't happen. In its place I performed the static CSS/structural audit in §22, which found and fixed four real ellipsis violations — meaningfully more useful than an unread screenshot, but it is not the same as looking at a rendered page, and I want that distinction to be explicit rather than implied away.

## 27. Remaining limitations

- No rendered screenshots (§26).
- `vite build` could only be verified writing to a location outside the project folder (§24); the project's own `dist/` was never regenerated this phase (its stale, unrelated partial contents from an earlier phase are untouched).
- Companion/module `basePower`/`statContributions` for the 14 non-default items are estimates, not calibrated against any reference value (disclosed in the file headers of `companions.ts`/`modules.ts`).
- Module slot assignment for 9 of 12 modules is an independent, disclosed judgment call, not reference-confirmed.
- The Filter popover (rarity/owned-only/sort) is intentionally lightweight, not a real Inventory Hub, per the explicit "keep this lightweight" instruction.
- `canEditLoadout`/gameplay-lock gating was not implemented (per explicit instruction not to invent a fake active-battle state); the code has no gate to remove later, just none added.

## 28. Confirmation — approved screens untouched

Verified via a wall-clock `mtime` audit (not the zip-archive-mtime method, which is unreliable — see the Ship Level Up report for why): every frozen file (`HubHeader.tsx/.css`, `HubScreenShell.tsx/.css`, `HubBottomNav.tsx/.css`, `HomeScreen.css`, `FleetRosterScreen.css`, `ShipDetailScreen.tsx`, and by extension every other approved screen's `.css`) has a modification time from before this session's work began. Of the four screens with navigation-only edits (Home, Pre-Battle, Campaign Stage Detail, Fleet Roster), only their `.tsx` files show today's timestamp — their `.css` files are untouched, confirming no visual change accompanied the navigation wiring.

## 29. The public/ folder incident — full account

Mid-task, while trying to speed up a build-verification step, I ran a single shell command intended to temporarily rename `public/` out of the way, build without it, then rename it back. The rename failed immediately ("Permission denied" — the folder sits on an OneDrive-synced mount that doesn't support that rename), so the build step correctly never ran. But the command's cleanup section was joined with `;` instead of `&&`, so it ran unconditionally and assumed the rename had succeeded. It ran `rm -rf public` against the real, still-intact folder, deleting 345MB / 253 files, then failed to restore it (the backup it expected was never created).

I stopped all further destructive action immediately, disclosed the mistake to you in full before doing anything else, and — once you provided `starfire-armada.zip` (1.29GB, dated the same day, moved into the project folder) — verified it contained a `public/` subtree with exactly 253 files before touching anything. I extracted just that subtree to a scratch location, spot-checked several images, then copied it into place (interrupted twice by the same slow-mount issue described in §24; resumed each time and finished with a full byte-for-byte `diff -rq` against the extracted backup — zero differences). Final state: 253/253 files, 345MB, every `.png` confirmed as a valid, non-corrupt image, `tsc` and a real `vite build` (§24) both clean against the restored assets.

One caveat I can't fully close: the ZIP is timestamped a few hours before the deletion. If any file inside `public/` was added or changed in that window, it would not be reflected in this restore. Every path `assetRegistry.ts` references resolves correctly against the restored folder, which is the strongest check available to me, but I can't rule out an edit in that narrow window with certainty.
