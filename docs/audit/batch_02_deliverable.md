# Starfire Armada V2 — Batch 2 Deliverable

Ship-management flow only: Home → Ship Selection → Ship Upgrade → back to Home. No gameplay engine, no combat, no ships 2–20 as playable ships. Batch 1's architecture (Vite + React + TS, hash routing, `PlayerStoreProvider`, design tokens, shared components) is preserved and extended, not replaced.

## 0. Pre-work verification

Before any edits: read `docs/audit/starfire_armada_v2_code_audit.md`, `docs/audit/starfire_v2_reference_manifest.csv`, and the `ships_01_to_20.png` / `home_dashboard_and_hangar_upgrade.png` / `ship_selection_and_arsenal.png` references. Re-ran the Batch 1 baseline (`npm install`, `npm run typecheck`, `npm run build`) in a clean staging copy — all passed before any Batch 2 code was touched.

**Git checkpoint:** not applicable. There's still no git repository reachable from my sandbox (only `games/starfire-armada` is mounted, not the `arcadeverse-site` root, and you asked me not to initialize a nested repo here). Following the same approach as Batch 1, `batch-1-complete.zip` was already sitting in the project as the Batch 1 checkpoint, confirmed present and untouched before starting.

## 1. Architecture summary

Batch 1's shell, router, and store are extended in place — nothing was rewritten from scratch.

- **Ship data model** (`src/types/ship.ts`, `src/data/ships.ts`): `ShipDefinition` now carries `slug`, `shortDescription`, `role`, `element`, `themeColor`/`accentColor`, `baseStats`/`statGrowth`, `unlockType`/`unlockRequirement`, `defaultUnlocked`, `artwork`, `availability`, and a `provisionalBalance` flag. All 20 ships from the authoritative roster are defined; only Rapid-Fire (`provisionalBalance: false`) has hand-tuned production stats and real weapon-level data — ships 2–20 pull from a shared per-rarity provisional stat template, clearly flagged as provisional.
- **Pure calculation layer** (`src/systems/shipStats.ts`): `calculateShipStats(ship, level)`, `calculatePowerScore(stats)`, `calculateUpgradeCost(ship, level)` (returns `null` at max level), `isMaxLevel`, `createDefaultShipProgress`. Every screen that shows a stat, a power number, or a cost calls through these — nothing is computed twice.
- **Store** (`src/store/playerStore.tsx`): extended with `ownedShipIds`, `shipProgress` (per-ship level/xp/stars/weaponLevel), `coins`/`crystals`/`energy`, `lastUpdatedAt`, `saveSchemaVersion`. New actions: `selectOwnedShip`, `attemptSelectLockedShip` (side-effect-free — returns unlock info for the UI to show in a modal, never mutates state), `upgradeShipLevel` (validates ownership → max level → cost → balance, in that order, before touching state), `resetSave`. Saves from the old Batch 1 schema are detected via `saveSchemaVersion` and discarded rather than risking a broken merge.
- **Shared components added**: `ShipArt` (fallback art slot — themed glow + glyph, swaps to a real sprite automatically if one is ever added to ship data), `LockedContentModal` (built on the existing `ModalLayer`, now with Escape-key support), `InlineAlert` (success/error banners), `StatRow` (single reusable stat line with optional before→after preview).
- **Home, Ship Selection, and Ship Upgrade** were rebuilt as real, data-driven screens (details in sections 2–4 below). `Campaign`, `Gameplay`, and `Results` screens are untouched from Batch 1 except for the `credits` → `coins` rename (see below).

### A note on one real bug caught and fixed during this batch

My first draft of `upgradeShipLevel` computed the result (success/failure/new level) *inside* the `setState` updater callback and tried to read it immediately after calling `setState` — that doesn't work, because React's state updater functions don't run synchronously relative to the call site. I caught this by writing an executable behavioral test (see section 6) rather than just reading the code, and fixed it: validation and the returned result are now computed up front against the current committed `player` state, and the updater is just a safety-net re-check. Worth knowing about since it's the kind of bug that looks fine on a code read and only shows up when you actually run it.

## 2. Home Dashboard

Fully data-driven from `usePlayerStore()` and `getShipById()` — no ship is hardcoded in JSX. Includes: an animated hangar platform (two counter-rotating rings + a pulsing beam under the ship, pure CSS), the selected ship's art/name/rarity/role/level/power, the player profile chip, the energy/coins/crystals bar (in that order, matching the reference), the current chapter card, a large gold Play button, and five shortcuts (Hangar/Ships, Arsenal, Companions, Tech Tree, Missions). Only the Hangar shortcut is active in Batch 2; the other four show a lock icon and open a `LockedContentModal` with a "coming in a future update" message instead of navigating. A notification badge on the Hangar shortcut reflects ships tagged `"new"` that aren't yet owned (currently Berserker Overdrive). All animations respect `prefers-reduced-motion`.

## 3. Ship Selection Dashboard

Renders all 20 ships from `src/data/ships.ts` through one `ShipRosterCard` component — no duplicated per-ship JSX. Each card shows art, name, rarity, role, level, power, and locked/selected state; ships tagged `new`/`featured` get a small corner badge. Only Rapid-Fire is unlocked by default. Includes: roster count ("1 / 20 Unlocked"), role filter tabs (All/Attack/Support/Control/Heavy — matching the reference's category tabs), a sort control (Roster Order / Rarity / Name), a detail panel for the selected ship (stats, description, Upgrade button), and a back button to Home. Clicking an owned ship selects it (store update, persists, updates the detail panel and Home); clicking a locked ship leaves the selection untouched and opens the locked-content modal with that ship's specific unlock requirement instead.

## 4. Ship Upgrade Dashboard

Fully wired to the store — no more placeholder text. Shows the ship presentation, rarity/role/power, a level-progress bar (level / 20), all six required stat rows (HP, Damage, Fire Rate, Speed, Defense, Crit Rate) with a current → next-level preview, the passive ability, the upgrade cost, and an Upgrade button that reads "Not Enough Coins" and disables itself when the player can't afford it, or "Max Level Reached" (disabled) at the level cap. Weapons/Modules/Skins/Awakening appear as visibly disabled "Soon" tabs, per scope. A back button returns to Ship Selection. Upgrading deducts coins, increments level by exactly one, recalculates stats/power through the shared functions, persists immediately, and shows an inline success or failure message. A ref-based in-flight guard (checked synchronously, unlike React state) prevents a double-click from firing two upgrades before the button's disabled state re-renders.

## 5. New data types and store actions

**Types added/changed:** `ShipRole`, `ShipElement`, `ShipAvailability`, `ShipUnlockType`, `ShipStatBlock`, `ShipArtwork` (all new); `ShipDefinition` gained the fields listed in section 1; `PlayerState` gained `ownedShipIds`, `shipProgress`, `lastUpdatedAt`, `saveSchemaVersion`; `CurrencyId` changed from `credits/crystals/energy/materials` to `coins/crystals/energy` (materials was unused; the Batch 2 spec only calls for these three).

**Store actions added:** `selectOwnedShip(shipId)`, `attemptSelectLockedShip(shipId)` → `LockedShipInfo | null`, `upgradeShipLevel(shipId)` → `UpgradeShipResult`. `resetSave()` carried over from Batch 1, now resets the larger schema.

All state remains plain serializable data (strings, numbers, booleans, plain objects/arrays) — no functions, class instances, or DOM references are stored.

## 6. Build, type-check, and acceptance-test results

Verified with a clean `rm -rf node_modules package-lock.json dist && npm install`:

- `npm install` — succeeded, 69 packages.
- `npm run typecheck` — 0 errors, strict mode.
- `npm run build` — 91 modules transformed, `dist/index.html` 0.54 kB, CSS 26.48 kB (5.32 kB gzip), JS 180.75 kB (56.78 kB gzip).

**Acceptance tests:** I wrote a throwaway script (not shipped — removed before packaging) that compiled the real `App.tsx` component tree with esbuild and mounted it in `jsdom` using React's actual renderer, then drove it with real click/keydown events and read back `localStorage` after each action. This is real executed behavior, not a code-review guess. 23 of the spec's acceptance checks were run this way and all passed:

- Home renders the selected ship name and a Play button.
- Ship Selection opens, all 20 cards render from data, exactly 19 are locked and 1 selected (Rapid-Fire) on a clean save.
- Clicking a locked ship opens a modal with a non-empty unlock requirement and does *not* change the selection; Escape closes it.
- Ship Upgrade opens; the Upgrade button is present and enabled; clicking it increases the ship's level by exactly 1, decreases coins, shows a success message, and Home reflects the new level immediately after.
- Simulating a refresh (unmount + remount, re-reading `localStorage`) preserves the upgraded level.
- With coins forced to 0, the button reads "Not Enough Coins" and is disabled; clicking it anyway makes no change to level or coins (no partial transaction).
- Clearing the save restores the default state (Rapid-Fire, level 1).
- Zero `console.error` calls across the entire run.

**Not verified by this script** (jsdom doesn't do real CSS layout): accidental horizontal overflow at each breakpoint. That was checked by code review of the actual CSS instead — every grid/flex layout uses `gap` with `1fr`/`repeat()` tracks rather than fixed pixel widths, and the only intentional horizontal-scroll regions are the currency strip and the filter-tab row (both scoped to their own container, not the page). See section 7 for how to confirm this yourself visually.

## 7. Visual evidence

**Screenshots were not captured.** I tried: installing Playwright's bundled Chromium (blocked — the sandbox's network allowlist rejects `cdn.playwright.dev`), installing a system Chromium via `apt` (blocked — no root/sudo in this sandbox), and searching for any pre-existing browser binary (none found). I did not fabricate or describe screenshots as if I'd seen them — the behavioral verification in section 6 is real (executed React + real DOM events + real localStorage reads), but it has no visual/layout output, so I'm not calling it a substitute for actual screenshots.

To see it yourself, from `games/starfire-armada`:

```
npm install
npm run dev
```

Then open the printed local URL and check:
- `#/home` at a mobile width (~390–430px) and at a wide desktop width (~1536px)
- `#/ships` at mobile width, including clicking a locked ship (e.g. Laser Beam) to see the modal
- `#/ships/upgrade` at mobile width — click Upgrade once normally, then (optional) open dev tools, run `const s = JSON.parse(localStorage.getItem('starfire-armada-v2:save')); s.currencies.coins = 0; localStorage.setItem('starfire-armada-v2:save', JSON.stringify(s));` and reload to see the insufficient-coins state.

`npm run preview` after `npm run build` works the same way against the production bundle if you'd rather check that instead of the dev server.

## 8. Known issues

- Ships 2–20 use provisional per-rarity stat templates, not individually tuned numbers — flagged via `provisionalBalance: true` in the data.
- No production artwork for any ship; all 20 use the `ShipArt` fallback (themed glow + glyph). None of the legacy prototype's generic ship images matched any of the 20 named identities closely enough to justify reuse, so none were wired in.
- "Current experience or level progress" on the Upgrade screen is shown as level-toward-cap (level / 20), since there's no separate ship-XP currency in this batch's economy — only coins gate the level-up.
- The filter-tabs/sort row and the currency strip are intentionally horizontally scrollable within their own row; this was already the pattern from Batch 1's currency bar and is not page-level overflow.
- No automated visual regression or unit-test suite is part of the shipped project — the acceptance-test script from section 6 was a throwaway verification tool, not shipped code.

## 9. Deferred to Batch 3

- The `GameCanvas` engine and everything gameplay-related — untouched per your explicit instruction not to begin it in this batch.
- Real per-ship production art (sprites, hangar renders, roster icons) for all 20 ships.
- Individually-tuned (non-provisional) balance for ships 2–20.
- Arsenal, Companions, Tech Tree, Missions/Events, Shop, and every other locked Home shortcut — currently "coming soon" placeholders only.
- Star promotion, weapon-level upgrades, awakening, modules, and skins on the Ship Upgrade screen — currently visible as disabled tabs only.

## 10. Checkpoint

`batch-2-complete.zip` created at the project root (same exclusions as Batch 1: no `node_modules`, `dist`, `.git`, cache files, or either checkpoint zip). `legacy/current-prototype/` and `docs/` were not modified — verified by checksum before and after.
