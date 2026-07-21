# Ship Detail — Completion Report

## Files created
- `src/data/shipDetail.ts`
- `src/components/ship-detail/ShipDetailTopBar.tsx` + `.css`
- `src/components/ship-detail/ShipDetailHeroPanel.tsx` + `.css`
- `src/components/ship-detail/ShipDetailStatGrid.tsx` + `.css`
- `src/components/ship-detail/ShipDetailAbilityCard.tsx` + `.css`
- `src/components/ship-detail/ShipDetailFragmentsSkinRow.tsx` + `.css`
- `src/components/ship-detail/ShipDetailActionRow.tsx` + `.css`
- `src/screens/ship-detail/ShipDetailScreen.tsx` + `.css`

## Files modified
- `src/app/routes.tsx` — added `ship-detail-legacy-placeholder` (`#/ships/detail/placeholder`); `ship-detail-placeholder`'s path/id unchanged, only its rendered component changed.
- `src/app/App.tsx` — `ship-detail-placeholder` now renders `ShipDetailScreen`; added a case for `ship-detail-legacy-placeholder` → `ShipDetailPlaceholderScreen`.
- `src/components/layout/AppShell.tsx` — added `ship-detail-legacy-placeholder` to the `showBottomNav` exclusion list (it still renders its own `HubBottomNav`, unmodified) and rewrote the governing comment to explain why `ship-detail-placeholder` stays excluded (full-screen shell with its own bottom action row, not a `HubBottomNav`).

Not touched: `HubHeader`, `HubBottomNav`, `HubScreenShell`, `FleetRosterScreen` and its components, `ShipUpgradeScreen`, `ships.ts`, `playerStore.tsx`, `fleetRoster.ts`, `BattleModeIcon.tsx`, gameplay code, and every other previously-approved screen. Confirmed by an mtime diff of `src/` and `public/assets/` — only the files listed above changed.

## Shell implementation
Verified directly (not assumed) that Ship Detail does not use `HubHeader`/`HubBottomNav`: the reference has no player avatar/level/XP block and no 5-tab nav — just a back button + title and a 5-button category row. This matches `SPACE_SHOOTER_MASTER_HANDOFF.md` §3.4 (bottom nav hidden on item/ship detail screens) and the existing code precedent (`ShipUpgradeScreen.tsx` and `PreBattleScreen.tsx` both already use this "full-screen shell" pattern). `ShipDetailScreen` follows the same shape: `ShipDetailTopBar` (own component, back + title/subtitle + resource pills + mail + settings) → scrollable content → `ShipDetailActionRow` (the reference's own 5-button row). No shared shell files were opened for edits.

## Route changes
`#/ships/detail?id=<shipId>` (route id `ship-detail-placeholder`) now renders the real `ShipDetailScreen`. Fleet Roster's Details button required zero changes — it already targeted this route id. The old `ShipDetailPlaceholderScreen` was relocated (not deleted) to `#/ships/detail/placeholder` (new route id `ship-detail-legacy-placeholder`), unlinked, comparison-only, same pattern as the three earlier legacy relocations. Back always returns to `#/ships` (Fleet Roster).

## Data strategy
`src/data/shipDetail.ts` exports `getShipDetailContent(shipId, player)`. For `ship-03-homing-missiles` (the pictured ship) it returns a hardcoded record read directly off the reference. For all other 19 ships it derives everything from real data: `calculateShipStats`/`calculatePowerScore` for stats and power, `player.shipProgress[shipId]` for level/weapon level/stars, `ship.passiveName`/`passiveDescription` (real, hand-authored for all 20 ships), `ship.calamityName`/`calamityDescription` (real for ship 1, ships.ts's own pre-existing auto-generated placeholder for ships 2–20, passed through unchanged), and `ship.weaponLevels[currentLevel]` where a real entry exists. `ships.ts` defines `weaponLevels: []` for every ship except ship 1, so for the other 18 owned/ownable ships the weapon card falls back to a disclosed generic label ("Primary Weapon") paired with the ship's own real `shortDescription` — not invented copy, and not silently presented as reference-authored.

## Homing Missiles reference values (hardcoded, disclosed)
EPIC, Attack, "Homing Missiles", Power 12,480, Level 12/40, Star Rank 2/5, Weapon Level 3/10. Core Stats: HP 18,750, Damage 2,950, Fire Rate 1.45/s, Speed 280, Defense 1,680, Crit Rate 18%. Weapon "Homing Missile MK III" (Lv 3/10). Passive "Target Lock" (Lv 2/5). Calamity "Missile Barrage" (Lv 1/5). Fragments 36/80. Skin "Void Hunter" / Epic Skin / +5% Damage.

## Other-ship fallback behavior
Real computed Core Stats and Power for every ship. Real passive name/description for every ship. Real weapon copy where `weaponLevels` defines it (ship 1 only), generic "Primary Weapon" + real `shortDescription` otherwise. Real (or ships.ts's own disclosed placeholder) calamity copy. Fragments use a rarity-scaled generic table (own constant in `shipDetail.ts`, not imported from Fleet Roster's private one). Skin shows "No Skin Equipped" rather than inventing 19 more skin names.

## Master-art usage
`getShipMasterArt(shipId)` only, for hero art and the skin-panel thumbnail, for every ship — no gameplay sprites, no `ShipArt`, no partial roster maps, no Unicode glyphs, no hardcoded paths. Grepped to confirm no other art-resolution path is used anywhere in the new files.

## Next-ship behavior
The hero panel's right-edge chevron is fully functional, per your decision. It cycles through `getFleetRosterOrder(SHIPS.map(s => s.id))` (Fleet Roster's own established ordering, reused directly, not reimplemented), updates `currentShipId` as local component state, wraps from the last ship back to the first, keeps `window.location.hash`'s `?id=` in sync, and stays on `ShipDetailScreen` throughout (no remount, no full route change — the route id doesn't change when only the query string does, so a plain hash-reparsing approach would have gone stale; state is updated directly instead). Locked ships can be cycled to and remain locked (Equip disabled, unlock requirement shown, Level Up unavailable). The control is a real `<button aria-label="View next ship">`, not decorative.

## Equip behavior
Calls the existing `selectOwnedShip(shipId)` — same safe, already-approved action Fleet Roster uses, which no-ops for a ship not genuinely owned. Shows a disabled "Equipped" state when the viewed ship is already `player.selectedShipId`. Locked ships show the unlock requirement text plus a "Locked" button that opens `LockedContentModal` via `attemptSelectLockedShip`, mirroring Fleet Roster's own locked-card tap behavior.

## Level Up behavior
Only enabled for owned ships. Calls `selectOwnedShip(shipId)` first (required, since `ShipUpgradeScreen` reads its ship from `player.selectedShipId`, not a query param) then `navigate("ship-upgrade")` — the existing, unmodified screen. Locked ships do not navigate.

## Modal behavior
Star Rank, Weapon, Abilities, Skins (bottom row) and all three ability cards' Upgrade buttons open an informational "coming soon" modal via the existing `LockedContentModal` component, per your explicit instruction not to route Weapon to the existing Ship Upgrade screen (since it currently only represents level upgrading). Owned-ship ability Upgrade taps show "coming soon"; locked-ship taps show the unlock requirement instead. Mail, settings, and resource-pill taps in the top bar use the same temporary informational-modal behavior as every other hub screen.

## Substitutions and omissions (disclosed)
- The reference's painted planet/starfield/missile-trail hero backdrop isn't reproducible from `getShipMasterArt` (an isolated ship cutout); a dark radial-glow CSS background is used instead — no new artwork generated.
- The reference's small top-right hex emblem badge has no matching asset anywhere in the registry — omitted rather than invented.
- The Equip button is rendered as its own row below the hero grid rather than absolutely pinned over the art as the reference shows — a deliberate mobile-safety simplification so it can never overlap the art or clip at narrow widths.
- Core Stats icons for HP/Damage/Fire Rate/Speed have no BattleModeIcon equivalent and `BattleModeIcon.tsx` was outside this task's allowed-modify list, so four small coded SVG icons were added locally inside `ShipDetailStatGrid.tsx` only (not shared/exported) — same hand-built, `currentColor`, no-emoji/no-Unicode style `BattleModeIcon.tsx` already uses. Defense and Crit Rate reuse the existing `shield`/`star` variants directly.
- Ability-card icons (weapon/passive/calamity) and the bottom action row's icons all reuse existing `BattleModeIcon` variants as themed stand-ins (`target`/`search`/`skull` for the three ability cards) — no new artwork, disclosed the same way Fleet Roster's ability-tier badges already are.

## Level-cap inconsistency (disclosed, per your instruction)
Fleet Roster's approved featured panel shows Homing Missiles at Level 12/**30**. This screen's own reference shows the same ship at Level 12/**40**. Per your instruction, each screen follows its own authoritative reference independently — Fleet Roster was not touched, and Ship Detail displays 12/40 exactly as `09_Ship_Detail_Overview.png` shows. Documented here as a known prototype-data inconsistency to reconcile once a real unified progression model exists (the real gameplay system's actual cap, `SHIP_MAX_LEVEL`, is 20 — lower than both reference numbers).

## Mobile responsiveness
Reasoned through at 412×915 / 390×844 / 360×800 by direct CSS/property inspection (no headless browser available in this sandbox, disclosed as in every prior round). `width/max-width: 100%` and `min-width: 0` on every flex/grid child, `box-sizing: border-box` throughout, no `100vw` inside padded containers, no document-level horizontal scroll. Core Stats grid is 3-columns-by-2-rows below 420px width, 6-across above it. Fragments/Skin panels stack to a single column below 340px. Ability cards wrap their side (level + Upgrade button) below their body below 340px rather than truncating. Hero art is contained in a fixed aspect-ratio box (`object-fit: contain`) and the hero grid stacks vertically below 360px so the art can never force horizontal overflow. The bottom action row's 5 buttons use `grid-template-columns: repeat(5, minmax(0, 1fr))` with `overflow: hidden`/ellipsis-free short labels so none clip.

## Type-check result
`tsc -b --noEmit`: clean, exit 0, zero output.

## Build result
`vite build` (to a temp dir, the usual OneDrive-lock workaround): clean, 197 modules transformed, zero errors/warnings.

## Regression confirmation
mtime diff across `src/` and `public/assets/` (last 40 minutes) shows exactly the 17 files listed in "Files created"/"Files modified" above and nothing else — every previously-approved screen, the shared shell components, `ships.ts`, `playerStore.tsx`, and gameplay code are untouched.

## Blockers
None. Ship Detail is fully implemented and wired in at `#/ships/detail?id=<shipId>`. Ship Upgrade redesign, Star Rank, Weapon Upgrade, Abilities, and Skins screens remain out of scope, as instructed — all five bottom-row destinations except Level Up currently open an informational modal.
