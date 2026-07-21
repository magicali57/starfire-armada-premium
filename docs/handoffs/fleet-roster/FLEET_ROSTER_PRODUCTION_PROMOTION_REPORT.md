# Fleet Roster — Production Promotion, Registry Update, and Implementation Report

## 1. Production promotion — 6 master art files

Promoted from their approved review folders into `public/assets/ui-v2/ships/master_art/` (the same folder the existing 14 already live in):

| File | Source | Verdict |
|---|---|---|
| `04_electric_shock_master.png` | `cleaned_pending_review/` | Automated cleanup, approved |
| `06_shield_generator_master.png` | `manual_repair_pending_review/` | Manual repair, approved |
| `11_gravity_pulse_master.png` | `manual_repair_pending_review/` | Manual repair, approved |
| `14_healing_support_master.png` | `manual_repair_pending_review/` | Manual repair, approved |
| `15_emp_burst_master.png` | `cleaned_pending_review/` | Automated cleanup, approved |
| `18_orbital_cannons_master.png` | `cleaned_pending_review/` | Automated cleanup, approved |

Verified before and after the copy:
- Every promoted file's SHA-256 in production matches its source file's hash exactly (no re-encoding, no corruption).
- Every promoted file confirmed 1254×1254 RGBA.
- All 14 previously-existing production files re-hashed after the copy and confirmed byte-identical to their pre-copy baseline — untouched.
- Production folder now contains exactly 20 files, no extras, no naming collisions.

## 2. Registry update — `assetRegistry.ts`

- `SHIP_MASTER_ART` now has all 20 ship ids populated, each pointing at its production `master_art/` file.
- `DEFERRED_MASTER_ART_SHIP_IDS` is now an empty array (kept, not deleted, so any future reference to it fails loudly rather than silently, and so the id list is still discoverable if a ship's art is ever deferred again). Confirmed no other file in `src/` references it.
- `getShipMasterArt(shipId)` unchanged in logic (`SHIP_MASTER_ART[shipId] ?? SHIP_GAMEPLAY_SPRITE[shipId]`), but the fallback branch is now dead code in normal operation since every real ship id resolves from `SHIP_MASTER_ART` directly — kept only as a defensive guard against a hypothetical future ship being added to the roster before its art exists.
- Gameplay sprites (`SHIP_GAMEPLAY_SPRITE`) untouched and not used anywhere in Fleet Roster.

## 3. 20/20 master-art verification

| # | Ship ID | Registered | File exists | Dimensions |
|---|---|---|---|---|
| 1 | ship-01-rapid-fire | Yes | Yes | 1254×1254 |
| 2 | ship-02-laser-beam | Yes | Yes | 1254×1254 |
| 3 | ship-03-homing-missiles | Yes | Yes | 1254×1254 |
| 4 | ship-04-electric-shock | Yes | Yes | 1254×1254 |
| 5 | ship-05-plasma-spread | Yes | Yes | 1254×1254 |
| 6 | ship-06-shield-generator | Yes | Yes | 1254×1254 |
| 7 | ship-07-stealth-ops | Yes | Yes | 1254×1254 |
| 8 | ship-08-drone-support | Yes | Yes | 1254×1254 |
| 9 | ship-09-flamethrower | Yes | Yes | 1254×1254 |
| 10 | ship-10-ice-frost | Yes | Yes | 1254×1254 |
| 11 | ship-11-gravity-pulse | Yes | Yes | 1254×1254 |
| 12 | ship-12-poison-acid | Yes | Yes | 1254×1254 |
| 13 | ship-13-sniper-railgun | Yes | Yes | 1254×1254 |
| 14 | ship-14-healing-support | Yes | Yes | 1254×1254 |
| 15 | ship-15-emp-burst | Yes | Yes | 1254×1254 |
| 16 | ship-16-boomerang-blades | Yes | Yes | 1254×1254 |
| 17 | ship-17-mine-layer | Yes | Yes | 1254×1254 |
| 18 | ship-18-orbital-cannons | Yes | Yes | 1254×1254 |
| 19 | ship-19-berserker-overdrive | Yes | Yes | 1254×1254 |
| 20 | ship-20-cosmic-void | Yes | Yes | 1254×1254 |

Also confirmed programmatically: `ships.ts`'s 20 ship ids and `SHIP_MASTER_ART`'s 20 keys are an exact 1:1 match (no ship missing a registration, no registered id that isn't a real ship); no duplicate keys; no broken paths; no unintended overwrites (all pre-existing 14 files hash-identical before/after).

## 4. Fleet Roster implementation status: **fully implemented**

Built per `FLEET_ROSTER_PLAN.md`, with one deliberate correction to that plan's original art strategy per your current instruction: every ship art reference now calls `getShipMasterArt()` directly — the plan's original `ShipArt` component / partial `SHIP_ROSTER_ART`/`SHIP_HERO_ART` fallback approach (written when 6 ships still lacked master art) is not used anywhere in the new screen or its components.

**New files:**
- `src/data/fleetRoster.ts` — reference-matched data for the 8 shown ships + a real-data-derived fallback for the other 12.
- `src/components/fleet/{FleetFeaturedPanel,FleetStatBlock,FleetRoleFilterBar,FleetShipCard,FleetStatusBar}.tsx` + `.css`.
- `src/screens/fleet/FleetRosterScreen.tsx` + `.css`.
- `src/screens/fleet/ShipDetailPlaceholderScreen.tsx` + `.css` (destination for "Details," matching the reference exactly since the real Ship Detail screen isn't built yet).

**Modified files:**
- `src/app/routes.tsx` — added `ship-selection-legacy` (`#/ships/legacy-roster`) and `ship-detail-placeholder` (`#/ships/detail`); `ship-selection`'s path stays `#/ships`, only its target component changed.
- `src/app/App.tsx` — `ship-selection` now renders `FleetRosterScreen`; added cases for the two new route ids.
- `src/components/layout/AppShell.tsx` — added `ship-selection` and `ship-detail-placeholder` to the shared-bottom-nav exclusion list (both render `HubScreenShell`/`HubBottomNav` internally). `ship-selection-legacy` deliberately left off that list — direct inspection confirmed the old `ShipSelectionScreen.tsx` renders bare content with no shell of its own, so it correctly keeps the old shared `BottomNavigation`.

**Not touched:** Home, Battle Hub, Campaign Overview, Campaign Chapter Map, Campaign Stage Detail, Pre-Battle, `HubHeader`/`HubBottomNav`/`HubScreenShell`, `ships.ts`, `playerStore.tsx`, `ShipUpgradeScreen.tsx` (its `navigate("ship-selection")` calls needed no edits — they resolve to the new screen automatically). Confirmed by an mtime diff of the whole `src/` and `public/assets/` trees: only the files listed above (plus the 6 promoted PNGs) changed.

**What matches the reference:** title/subtitle, the featured panel (rarity, name, role, description, 4 ability-tier badges, stacked Level/Star Rank/Weapon Level/Power column, Details/Equip buttons), the 5-pill role filter row + Sort/Filter trigger, and all 8 reference-shown cards in the reference's exact order with their exact rarity/level/power/status-bar values, equipped ribbon, and locked treatment. The remaining 12 ships render below the fold using real ship/player data rather than stopping the list.

**Disclosed gaps/substitutions (same standard as every previous screen):**
- No search input built — none is visible anywhere in the reference frame.
- "Sort / Filter" opens an informational "coming soon" modal rather than a fabricated dropdown, since the reference is a static frame and doesn't show the dropdown's contents.
- The featured panel's 4 hex ability-tier badges are static/non-tappable this round and reuse existing `BattleModeIcon` variants (target/swords/energy/chevron) as themed stand-ins — no new artwork was generated for them.
- "8 of 20 ships acquired" and the 8 cards' owned/locked/level/power values are reference-matched display data, not derived from the real save (which currently only owns `ship-01-rapid-fire`) — same disclosed prototype-vs-real pattern already used in `campaignStageDetail.ts`/`preBattle.ts`. Tapping "Equip" still only ever goes through the real `selectOwnedShip` store action, which safely no-ops for a ship not genuinely owned — no progression is mutated by the prototype data.
- Two ships render under a slightly different display name than `ships.ts`'s real name, matching the reference exactly: "Ice Blast" (real id `ship-10-ice-frost`) and "Cosmic Void" (real id `ship-20-cosmic-void`, real name "Cosmic/Void").

**Verification performed:**
- `tsc -b --noEmit`: clean, zero errors.
- `vite build`: clean, zero errors/warnings (built to a temp dir per the usual OneDrive-lock workaround).
- File-level regression check (mtime diff across all of `src/` and `public/assets/`): only the files listed above changed; every previously-approved screen and the shared shell files are untouched.
- No headless browser is available in this sandbox (disclosed every round this project) — mobile-safety (no horizontal overflow at 412×915/390×844/360×800, filter-row horizontal scroll at narrow widths, touch-target sizing) was verified by direct CSS/property-level reasoning, not a live render.

## 5. Blockers

None. Fleet Roster is fully implemented and wired into the live app at the Fleet tab. Ship Detail and Ship Upgrade remain out of scope for this task, as instructed — "Details" lands on the disclosed placeholder, and "Upgrade"/existing Ship Upgrade flow is untouched.
