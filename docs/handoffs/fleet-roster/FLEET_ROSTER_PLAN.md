# Fleet Roster — Pre-Implementation Plan

Planning only. No source files created or modified.

## 1-4. Reference, viewport, shell, active tab

1. **Exact reference filename:** `02_Fleet_Roster.png`
2. **Exact location:** `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_1_Core_Hubs_and_Campaign/02_Fleet_Roster.png` — confirmed present in the zip (2,215,058 bytes), extracted and opened in full, plus 6 zoomed crops (header, featured-ship panel, filter row, card pair, locked-card pair, footer). No other screen substituted.
3. **Target portrait viewport:** reference image is 941×1672 (portrait, ~9:16). No desktop/web-dashboard layout.
4. **Shell:** confirmed, not assumed — the reference's header is pixel-for-pixel `HubHeader` (profile portrait "Star Hunter" Lv.86 with XP bar, Energy/Coins/Crystals pills, mail badge "2", settings gear — identical structure to every other approved hub screen), and the footer is the standard 5-tab bar with **Fleet highlighted** (ship-icon tab, 3rd of 5, glowing purple border). `SCREEN_NAVIGATION_MAP.md` confirms F-01 Fleet Roster sits under "Fleet screens" with no full-screen-shell override (unlike B-15 Pre-Battle) — it's a standard hub-tab root screen. **Uses `HubScreenShell` + `HubHeader` + `HubBottomNav active="fleet"` unchanged.**
5. **Active bottom tab:** `fleet` — confirmed both visually (glowing ship icon) and via `SCREEN_NAVIGATION_MAP.md` §6.5 ("Fleet | Fleet Roster").

## 6-7. Layout breakdown / section mapping

Top to bottom:

1. **Header** — `HubHeader`, unchanged, no edits.
2. **Title block** — "FLEET" (large display title) + "8 of 20 ships acquired" (cyan subtitle, collection progress).
3. **Featured ship panel** — a large bordered/clipped panel showing whichever ship is currently selected/previewed:
   - Rarity pill (top-left): "EPIC"
   - Ship name: "HOMING MISSILES"
   - Role row: role icon + "ATTACK"
   - Description: "Guided warheads that relentlessly track and destroy priority targets."
   - Ship art (large, right-aligned)
   - 4 small hex ability-tier badges (bottom-left): icon + "Lv. N" ×4 — read as 4 distinct upgrade tracks (weapon mods), not part of this screen's build (see §31 — treated as a disclosed, non-interactive display-only row this round)
   - Right column (stacked, not inline): LEVEL "12 / 30" + progress bar; STAR RANK 5-star row (2 filled, 3 outline); WEAPON LEVEL "3 / 10"; POWER (swords icon) "12,480" (purple)
   - Two buttons: "DETAILS" (secondary/outlined) and "EQUIP" (primary/gold)
4. **Filter/sort row** — 5 pills: "ALL" (active), "ATTACK", "SUPPORT", "CONTROL", "HEAVY" (each with its role icon), plus a "SORT / FILTER ▾" trigger with a funnel icon.
5. **Ship card grid** — 2 columns, cards for all 20 ships (8 visible in this reference frame before scroll: 6 owned + 2 locked).
6. **Footer** — `HubBottomNav active="fleet"`, unchanged.

## 8-9. Title, subtitle, fleet summary

- Title: **"Fleet"** (rendered uppercase via CSS, matching other screens' title treatment).
- Subtitle: **"8 of 20 ships acquired"**.
- No separate "power summary" line beyond the featured panel's own POWER stat — the reference has no additional fleet-wide power total anywhere.

## 10-11. Card count and order

8 cards visible in the reference frame (before scroll), in this exact order:

1. Rapid-Fire (row 1, left)
2. Laser Beam (row 1, right)
3. Homing Missiles (row 2, left)
4. Electric Shock (row 2, right)
5. Shield Generator (row 3, left)
6. Ice Blast (row 3, right)
7. Orbital Cannons (row 4, left)
8. Cosmic Void (row 4, right)

This is **not** alphabetical, not strictly rarity-sorted, and not the real roster's numeric id order (real order is Rapid-Fire, Laser Beam, Homing Missiles, Electric Shock, **Plasma Spread**, Shield Generator... — Plasma Spread is skipped in the reference's visible frame). Read as: owned ships first in a curated order, then the next two locked ships by proximity-to-unlock, with the remaining 12 ships (including Plasma Spread) below the fold. The plan's prototype data (§16) will model exactly these 8 in this exact order; the remaining 12 ships use `getShipById`-driven generic fallback rows so scrolling past card 8 still shows a complete, functional 20-ship list rather than the list simply stopping.

## 12-18. Exact per-card values

| # | Name | Rarity | Role | Level | Power | Status |
|---|---|---|---|---|---|---|
| 1 | Rapid-Fire | Epic | Attack | 18 | 16,250 | Upgrade Ready (green, alert dot) |
| 2 | Laser Beam | Epic | Attack | 16 | 14,780 | Fragment Ready · 18/20 |
| 3 | Homing Missiles | Epic | Attack | 12 | 12,480 | **Equipped** (ribbon) + Weapon Upgrade Ready (gold) |
| 4 | Electric Shock | Rare | Control | 10 | 9,320 | Fragments · 8/15 |
| 5 | Shield Generator | Rare | Support | 9 | 8,450 | Fragments · 12/20 |
| 6 | Ice Blast | Rare | Control | 8 | 7,860 | Fragments · 7/15 |
| 7 | Orbital Cannons | Common | Heavy | — | — | **Locked** — "Account Level 35 to unlock" · 0/10 fragments |
| 8 | Cosmic Void | Legendary | Control | — | — | **Locked** — "Complete Campaign Chapter 10 to unlock" · 0/50 fragments |

Featured panel (Homing Missiles, currently selected): Level 12/30, Star Rank 2 of 5 filled, Weapon Level 3/10, Power 12,480 (matches card 3 exactly, confirming the featured panel mirrors whichever ship is selected).

No "star/evolution" stars are shown on the small cards themselves — only in the featured panel. Small cards show a level progress bar (blue, thin, under the level/power line) instead.

## 19-23. Filters, sort, search, badges, buttons

- **Role filter pills:** All (active by default), Attack, Support, Control, Heavy — each with its role icon (`ROLE_ICON.attack/support/control/heavy`, real assets, exact match).
- **Sort/Filter trigger:** a single "SORT / FILTER ▾" pill with a funnel icon and dropdown chevron. Its expanded contents (sort modes, rarity filter) are **not visible** in this static reference frame — `SCREEN_NAVIGATION_MAP.md`'s F-01 text mentions "Rarity filter" and "Sort: roster, Power, rarity, level, name" as concepts, but since the exact visual/interaction design of the opened dropdown isn't in the reference image, this task will not invent it (per "do not invent controls absent from the reference"). Planned as a single button that opens an informational "Sort & Filter coming soon" modal for now — disclosed gap, not a fabricated dropdown UI.
- **Search:** the doc's F-01 text lists "Search," but **no search input is visible anywhere in the reference image** (no search icon, no search field). Per instruction to use only the reference image as the visual target and not invent absent controls, **no search control will be built this round** — disclosed gap between the doc's prose spec and the actual reference screenshot.
- **Badges:** rarity pill (top-left every card + featured panel), "EQUIPPED" ribbon (top-right, green, Homing Missiles only), status bar variants (Upgrade Ready / Weapon Upgrade Ready / Fragment Ready / Fragments / Locked+requirement).
- **Buttons:** featured panel's "DETAILS" and "EQUIP"; filter pills; sort/filter trigger. Every card itself is also a full tap target (no separate button inside a card beyond the card surface).

## 24-25. Navigation behavior

- **Tap an owned card** → becomes the featured panel's previewed ship (updates name/art/stats/description in place, same screen, no navigation) — mirrors the existing `ShipSelectionScreen`'s "select updates detail panel" pattern, not a route change.
- **Tap a locked card** → `LockedContentModal` showing the card's exact unlock requirement text ("Account Level 35 to unlock" / "Complete Campaign Chapter 10 to unlock" / etc. for the other 12 off-screen ships, sourced from each `ShipDefinition.unlockRequirement`).
- **Tap "DETAILS"** → route to a minimal Ship Detail placeholder carrying the selected ship id (see §33/36 — Ship Detail itself is not built this task).
- **Tap "EQUIP"** → calls the existing `selectOwnedShip(shipId)` store action (already used by `ShipSelectionScreen` today, real and safe — just sets `selectedShipId`, no currency/progression mutation) for the currently-previewed owned ship. If the previewed ship is locked, "EQUIP" is not reachable (locked ships don't populate the featured panel — tapping them opens the modal instead, per above).
- **Tap a role filter pill** → filters the visible grid to that role, client-side only, default "All" active on load, matching the reference.
- **Tap "SORT / FILTER"** → opens the disclosed "coming soon" informational modal (§19-23).
- **Tap the 4 ability-tier hex badges in the featured panel** → out of scope for interactivity this round (§31) — rendered as static display elements, not tappable, since their target destination (a specific ability/weapon-mod screen) doesn't exist yet and isn't part of this task.
- **Bottom navigation** → unchanged `HubBottomNav` behavior; Home/Battle navigate normally, Inventory/Shop open the existing Coming Soon modal, Fleet is already active (no-op).

## 26-28. Component reuse plan

**Reused as-is:** `HubScreenShell`, `HubHeader`, `HubBottomNav`, `LockedContentModal`, `PrimaryButton`, `SecondaryButton`, `IconButton`, `BattleModeIcon` (chevron rotated for the up-arrow on status bars, lock, star, swords, refresh not needed here), `usePlayerStore`, `navigate`/`pathFor`, `calculateShipStats`/`calculatePowerScore`/`createDefaultShipProgress` from `shipStats.ts`, `getShipById`, `RARITY_EMBLEM`/`RARITY_LABEL`/`rarityColorVar` from `utils/rarity.ts`, `ROLE_ICON`, `MATERIAL_ICON.shipFragment`.

**Not reused, deliberately:** `ShipRosterCard`/`ShipRosterCard.css` and `ShipSelectionScreen`'s own filter/detail markup — these are a plain generic grid with an emoji lock badge (🔒) and inline `StatRow` emoji icons ("♥"/"⚔"), not reference-matched to `02_Fleet_Roster.png`'s status-bar/ribbon/hex-badge presentation. Per instruction ("do not create a generic card grid," "do not preserve any older Fleet or Ship Selection design merely because code already exists"), Fleet Roster gets its own purpose-built card and featured-panel components. `StatRow` is also not reused for the featured panel's stacked Level/Star Rank/Weapon Level/Power column — `StatRow` is a single-line icon|label|value flex row, and the reference shows label-over-value stacked blocks; reusing `StatRow` here would repeat the exact category of layout mismatch that caused Stage Detail's mobile stat-grid bug. A new, purpose-scoped stat block is planned instead (§29).

**Small extension needed:** none to existing shared components. `player.shipProgress`/`ownedShipIds`/`selectedShipId` and `selectOwnedShip` are used read-only/as-is, no store changes.

## 29. New reusable components proposed

- `FleetFeaturedPanel` — the large top panel (rarity, name, role, description, art, 4 ability-tier badges, stacked stat column, Details/Equip buttons).
- `FleetStatBlock` — one stacked label-over-value stat (Level+bar, Star Rank, Weapon Level, Power), used 4× inside `FleetFeaturedPanel`.
- `FleetRoleFilterBar` — the 5 role pills + Sort/Filter trigger.
- `FleetShipCard` — one roster card (rarity pill, art, name, role, level+power line, progress bar, status bar / equipped ribbon / locked treatment).
- `FleetStatusBar` — the colored bottom strip on a card (Upgrade Ready / Weapon Upgrade Ready / Fragment Ready / Fragments / Locked-requirement), parameterized by variant.

All under `src/components/fleet/`.

## 30-31. Ship art availability and fallback

Of the 8 reference-shown ships, real `SHIP_ROSTER_ART` exists for only 4: `ship-01-rapid-fire`, `ship-02-laser-beam`, `ship-03-homing-missiles`, `ship-04-electric-shock`. **No master art exists for:** `ship-06-shield-generator`, `ship-10-ice-frost` (reference calls it "Ice Blast" — same role/rarity/theme, treated as the same ship with a disclosed display-name variant), `ship-18-orbital-cannons`, `ship-20-cosmic-void` (reference: "Cosmic Void" vs data's "Cosmic/Void" — same disclosed punctuation variance).

**Fallback strategy:** use the existing `ShipArt` component unchanged — it already has a 3-tier fallback (roster art → hero art → themed single-glyph icon on the ship's gradient color). For the 4 ships above, this resolves to the themed-glyph fallback (e.g. "◈" Shield Generator, "❄" Ice/Frost, "☉" Orbital Cannons, "❂" Cosmic/Void) since neither roster nor hero art exists for them. Card scale/hierarchy is preserved (the glyph sits inside the same art slot at the same size as a real sprite would); visual fidelity to the reference's actual ship illustrations is not achieved for these 4. No new artwork will be generated this task — disclosed as a known gap in the completion report, consistent with every previous screen's asset-substitution disclosures.

## 32-36. Routes

- **Current route that should render this screen:** `ship-selection` (path `#/ships`, unchanged). This is the only viable choice without touching the frozen shell: `HubBottomNav`'s Fleet tab is hardcoded to `navigate("ship-selection")`, and `HomeScreen.tsx`'s own Fleet shortcut also calls `navigate("ship-selection")` — both explicitly off-limits to edit. `SCREEN_NAVIGATION_MAP.md` itself confirms this is the correct move: "This [F-01 Fleet Roster] replaces/expands the current Ship Selection route and becomes the Fleet tab root." Repointing `ship-selection`'s target component (same "keep id, change target" pattern already used for Pre-Battle) means **zero edits** are needed to `HubBottomNav`, `HomeScreen`, or `ShipUpgradeScreen` (whose own "Back"/"Cancel" buttons call `navigate("ship-selection")` and will correctly land on the new Fleet Roster root instead of the old screen).
- **Ship Detail route:** new, minimal placeholder — `ship-detail-placeholder` → `#/ships/detail` (new), carrying the selected ship id via the existing `?id=` convention. Not the real Ship Detail screen (out of scope, per instruction).
- **Ship Selection (legacy):** the current `ShipSelectionScreen` relocates to an internal/debug-only route, `ship-selection-legacy` → `#/ships/legacy-roster` (new), unlinked, comparison-only — same relocation convention as every previous screen swap (`stage-detail-legacy-placeholder`, `pre-battle-legacy-placeholder`).
- **Ship Upgrade:** route/path unchanged (`ship-upgrade`, `#/ships/upgrade`) — not part of this task, not touched.
- **Temporary behavior for unbuilt screens:** "DETAILS" → the new Ship Detail placeholder (preferred, per §36 recommendation below); "SORT / FILTER" dropdown contents and the 4 ability-tier badges → informational `LockedContentModal`/no-op, disclosed.

**Preferred vs. fallback for Ship Detail, per instruction to state which is safer:** routing to a minimal Ship Detail placeholder (carrying `?id=`) is **safer and preferred** over a `LockedContentModal` — it matches the exact pattern already proven twice this project (Stage Detail's Prepare → Pre-Battle placeholder, Pre-Battle's Start → Battle Launch placeholder), keeps the router's `?id=` convention consistent end-to-end, and gives a real, disclosed landing spot rather than a dead-end popup for what will become a genuinely separate screen. A `LockedContentModal` is used instead only for controls that don't have a dedicated future screen at all in this task's scope (Sort/Filter dropdown contents, ability-tier badges).

## 37-40. Scroll, safe-area, responsive, touch targets

- **Scroll:** the ship-card grid + featured panel + filter row all live inside `HubScreenShell`'s existing scrollable middle row (`hub-screen-shell__scroll`), same convention as Battle Hub/Campaign Overview/Chapter Map/Stage Detail — no new scroll container invented, hidden scrollbar preserved.
- **Safe-area:** inherited entirely from `HubScreenShell` (`padding-top: env(safe-area-inset-top)`) — no screen-specific safe-area CSS needed since this is a standard hub screen, not a full-screen shell.
- **Responsive:** 2-column card grid preserved at all widths down to 360px — reasoned as safe because each existing analogous 2-column layout in this project (Pre-Battle's ship/companion cards) already holds at 320px with `min-width:0`; ship cards here have less packed content per card (name, role, one level+power line, one progress bar, one status bar) than Pre-Battle's loadout cards, so 2 columns is not a stretch. No stacking breakpoint needed for the card grid itself. The 5-pill filter row is the one region likely to need a small-width adjustment (5 pills + 1 dropdown trigger is a lot for 360px) — plan: horizontal scroll (`overflow-x:auto`, hidden scrollbar) for the filter row specifically at narrow widths, rather than wrapping pills to a second line (wrapping would push the card grid down inconsistently and risks the reference's single-row filter composition). This is the one deliberate, disclosed adaptation from the reference's apparent single-row-fits-all layout (the 941px-wide reference frame has more headroom than a real 360-412px phone).
- **Touch targets:** every card is a full `<button>`-equivalent tap target (whole card, not just an icon); filter pills sized to at least 36px tall; DETAILS/EQUIP buttons use the existing `PrimaryButton`/`SecondaryButton` components, which already meet the project's established touch-target sizing.

## 41-44. Files to create, modify, route changes, registry exports

**Files to create:**
- `src/data/fleetRoster.ts` — reference-matching prototype data for the 8 shown ships (rarity/level/power/fragment/status-bar values as read from the reference), keyed by real ship ids, plus a `getFleetRosterEntry(shipId)` fallback for the other 12 real ships (generic status derived from real `ShipDefinition`/`shipProgress`, `isReferenceMatched:false`, same disclosed-fallback pattern as `campaignStageDetail.ts`).
- `src/components/fleet/FleetFeaturedPanel.tsx` / `.css`
- `src/components/fleet/FleetStatBlock.tsx` / `.css`
- `src/components/fleet/FleetRoleFilterBar.tsx` / `.css`
- `src/components/fleet/FleetShipCard.tsx` / `.css`
- `src/components/fleet/FleetStatusBar.tsx` / `.css`
- `src/screens/fleet/FleetRosterScreen.tsx` / `.css`
- `src/screens/fleet/ShipDetailPlaceholderScreen.tsx` / `.css`

**Files to modify:**
- `src/app/routes.tsx` — add `ship-detail-placeholder` (`#/ships/detail`) and `ship-selection-legacy` (`#/ships/legacy-roster`); `ship-selection` route id's **path stays `#/ships`**, only its target component changes (App.tsx).
- `src/app/App.tsx` — `"ship-selection"` now renders `FleetRosterScreen` (was `ShipSelectionScreen`); add `"ship-selection-legacy"` → `ShipSelectionScreen`, `"ship-detail-placeholder"` → `ShipDetailPlaceholderScreen`.
- `src/components/layout/AppShell.tsx` — add `ship-selection` (now pointing at the real Fleet Roster, which uses `HubScreenShell`/`HubBottomNav` and must suppress the old shared `BottomNavigation` the same way Battle Hub/Campaign screens already do) and `ship-detail-placeholder` to the `showBottomNav` exclusion list. `ship-selection-legacy` is intentionally **not** added — same reasoning as Stage Detail/Pre-Battle's own relocated legacy screens: if the old `ShipSelectionScreen.tsx` renders its own shell, it stays excluded too; if it renders bare content only (needs confirming — see completion-report verification step, since this file wasn't fully re-read in this planning pass beyond what's quoted in §26-28), it may need the shared nav instead. This will be confirmed by direct inspection before implementation, not assumed.

**Not touched:** Home, Battle Hub, Campaign Overview, Campaign Chapter Map, Campaign Stage Detail, Pre-Battle, `HubHeader`, `HubBottomNav`, `HubScreenShell`, `ShipUpgradeScreen.tsx` (its `navigate("ship-selection")` calls need no edits — they'll simply resolve to the new screen), `ships.ts`, `playerStore.tsx`/player progression model.

**Registry exports used:** `SHIP_ROSTER_ART`, `SHIP_HERO_ART` (via `ShipArt`), `RARITY_EMBLEM`, `ROLE_ICON`, `MATERIAL_ICON.shipFragment`, `RESOURCE_ICON` (not needed here — header already supplies resources), plus `BattleModeIcon` variants `chevron` (rotated for up-arrows), `lock`, `star`, `swords`.

## 45. Shared header/footer preservation

`HubHeader`/`HubBottomNav`/`HubScreenShell` are imported and rendered exactly as every other approved hub screen does — no prop changes, no CSS overrides, no wrapper modifications. Since Fleet Roster becomes reachable via the exact same `HubBottomNav active="fleet"` call signature already used elsewhere, and `HubScreenShell`'s grid-row recipe is shared verbatim, Home → Battle → Fleet will produce the same zero-movement header/footer guarantee already verified for every prior screen transition.

## 46-48. Build checks, regression checks, screenshot-comparison process

- `tsc -b --noEmit` and `vite build --outDir /tmp/... --emptyOutDir` (OneDrive lock workaround, same as every previous round).
- File mtime/size diff against every approved screen and the shared shell files, isolated to this task's actual start time (same method used for Pre-Battle's regression check) — confirms nothing outside the files-to-modify list changed.
- No headless browser is available in this sandbox (disclosed every round) — mobile-safety verification is done by direct CSS/property-level reasoning at 412×915, 390×844, 360×800, not a live render; the `npm run dev` + Chrome-extension path remains open for a real check.

## 49. Visual acceptance checklist

- Portrait orientation, no desktop layout.
- `HubHeader`/`HubBottomNav` pixel-identical to every other hub screen, Fleet tab active.
- Title "Fleet" + subtitle "8 of 20 ships acquired."
- Featured panel matches the reference's Homing Missiles preview exactly (rarity, name, role, description, stat column, buttons).
- 8 cards in the exact reference order, correct names/rarity/role/level/power/status-bar text for each.
- Equipped ribbon on Homing Missiles only; correct locked treatment on Orbital Cannons/Cosmic Void.
- Role filter pills + Sort/Filter trigger present and functional (client-side filtering); no invented search bar.
- Ship art at correct scale/crop for the 4 ships with real master art; disclosed glyph fallback for the other 4, same card scale preserved.
- No generic/legacy card gallery reused wholesale.
- No full reference image used as a background anywhere.
- No horizontal overflow at 412×915/390×844/360×800; filter row scrolls horizontally at narrow widths instead of wrapping or overflowing.
- No essential text truncated with ellipsis (ship names, status-bar text, unlock requirements).
- Every card and control is a real coded button, no emoji/Unicode icons.
- Vertical scrolling works inside `HubScreenShell`'s existing scroll region.
- Safe-area compliance inherited from `HubScreenShell`.
- Home, Battle Hub, Campaign Overview, Campaign Chapter Map, Campaign Stage Detail, Pre-Battle, and the shared shell remain unchanged.

---

Stopping here. Not beginning Ship Detail, Ship Upgrade, or gameplay integration. Waiting for approval before creating or modifying any source files.
