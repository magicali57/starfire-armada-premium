# Ship Detail — Pre-Implementation Plan

Planning only. No source files created or modified while producing this document.

## 1. Reference verification

- **Exact file:** `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_1_Core_Hubs_and_Campaign/09_Ship_Detail_Overview.png` (2,012,059 bytes, 941×1672, portrait). Extracted and opened in full, then re-inspected via 8 targeted crops (header, hero/identity, core stats, weapon card, passive card, calamity card, fragments/skin, footer). No other batch screen was substituted — `11_Ship_Level_Up.png` / `12_Ship_Star_Rank.png` / `13_Ship_Weapon_Upgrade.png` / `14_Ship_Abilities.png` / `15_Ship_Skins.png` (Batch 2) were not opened and are out of scope; this plan only reasons from what `09_Ship_Detail_Overview.png` itself shows.
- Ship pictured: **Homing Missiles** (`ship-03-homing-missiles`), Epic, Attack. This is the same ship Fleet Roster's already-approved featured panel defaults to (`FLEET_FEATURED_DEFAULT` in `fleetRoster.ts`), so the two screens share a subject — useful for continuity, but their numbers don't fully agree (§7).

## 2. Full layout, top to bottom

1. **Top bar** — back chevron; "SHIP DETAIL" title with "OVERVIEW" cyan subtitle underneath (reads as a tab label, not a second line of body text); three resource pills (Energy 120/120, Coins 12.5M, Crystals 89,450, each with a trailing "+"); mail icon with red badge "2"; settings gear icon. No player avatar, name, level, or XP bar anywhere.
2. **Hero panel** — EPIC rarity pill; ship name "HOMING MISSILES"; role row (crosshair icon + "ATTACK"); a small hex/wing emblem badge top-right of the art (faction or equipped marker — no equivalent asset currently exists, see §11); a bordered POWER box (icon + "12,480"); three label/value rows — LEVEL "12 / 40", STAR RANK (5 stars, 2 filled, plus an (i) info glyph), WEAPON LEVEL "3 / 10"; large ship art on the right against a painted planet/starfield/missile-trail backdrop, with a small ">" chevron pinned at the panel's right edge; EQUIP button, bottom-right.
3. **Core Stats** — "CORE STATS" label with underline rule, then a 6-cell row: HP 18,750 / DAMAGE 2,950 / FIRE RATE 1.45 /s / SPEED 280 / DEFENSE 1,680 / CRIT RATE 18%, each cell icon-over-label-over-value with a small green up-arrow.
4. **Intrinsic Weapon card** — "INTRINSIC WEAPON" pill; icon thumbnail; name "HOMING MISSILE MK III"; two-line description; "WEAPON LEVEL 3/10" + Upgrade button.
5. **Passive Ability card** — "PASSIVE ABILITY" pill; icon; name "TARGET LOCK"; description; "LEVEL 2/5" + Upgrade button. No info glyph on this card.
6. **Calamity Ability card** — "CALAMITY ABILITY" pill; icon; name "MISSILE BARRAGE"; description; "LEVEL 1/5" with an (i) info glyph + Upgrade button.
7. **Fragments panel** (left half) — fragment icon, "36 / 80", helper text, "FIND FRAGMENTS" button.
8. **Equipped Skin panel** (right half) — skin thumbnail, "VOID HUNTER", "Epic Skin" (purple), "+5% Damage" (green), "CHANGE SKIN" button.
9. **Bottom action row** — 5 buttons: LEVEL UP (red "!" badge), STAR RANK, WEAPON (red "!" badge), ABILITIES, SKINS.

No search field, no tab strip, no comparison view, no scrollbar chrome visible (frame is a single tall static capture — scrolling behavior is inferred, not shown).

## 3. Shared shell — verified, not assumed: Ship Detail does **not** use `HubHeader`/`HubBottomNav`

Direct evidence, not a guess:

- The reference header has no avatar/name/level/XP block (`HubHeader`'s entire left side) — it has a back button and a screen title instead.
- The reference footer is a 5-button *upgrade-category* row (Level Up / Star Rank / Weapon / Abilities / Skins), not the 5-tab Home/Battle/Fleet/Chest/Profile row `HubBottomNav` renders.
- `SPACE_SHOOTER_MASTER_HANDOFF.md` §3.4 states bottom nav is shown on hub/roster screens and **hidden on item/ship detail screens**, and that when hidden "the page must provide a clear Back control."
- Direct code precedent already exists for exactly this: `ShipUpgradeScreen.tsx` (pre-existing, untouched) renders no shared shell at all — just its own header with a back `IconButton`, no footer. `PreBattleScreen.tsx` (already approved) uses what `AppShell.tsx`'s own comments call the "full-screen shell" (`SCREEN_NAVIGATION_MAP.md` §3.2/B-15): its own lightweight `PreBattleTopBar` (back chevron + resource pills, deliberately *not* `HubHeader`) and no `HubBottomNav` anywhere.

Ship Detail will follow that same, already-established full-screen-shell pattern — a new small top bar component, no bottom nav — rather than `HubScreenShell`/`HubHeader`/`HubBottomNav`. `HubHeader.tsx`, `HubBottomNav.tsx`, and `HubScreenShell.tsx` will not be opened for edits.

## 4. New top bar: `ShipDetailTopBar`

New file `src/components/ship-detail/ShipDetailTopBar.tsx` (+ `.css`), modeled on `PreBattleTopBar`'s pattern (own component, own styles — not a modification of `PreBattleTopBar` itself, which stays untouched):

- Back chevron (`BattleModeIcon variant="chevron"`, rotated 180°, same as every other back control in the project) → navigates to Fleet Roster.
- Title "Ship Detail" + subtitle "Overview" via a small inline heading (not `ScreenHeader`, since `ScreenHeader` doesn't support the compact inline title-next-to-back-button layout the reference shows).
- Three resource pills (Energy/Coins/Crystals), same `RESOURCE_ICON` assets and pill markup `PreBattleTopBar` already uses.
- Mail button with badge, settings button — these two exist in the reference but not in `PreBattleTopBar`; they'll reuse `HOME_TOPBAR_FINAL.mail` / `.settings` / `.utilityFrame`, the same assets `HubHeader` already uses for its own mail/settings buttons, so no new artwork is introduced.

## 5. Back navigation & state preservation

Back always goes to `ship-selection` (Fleet Roster) — Ship Detail's only entry point. `SPACE_SHOOTER_MASTER_HANDOFF.md` §3.6 asks that returning from a detail screen preserve the parent's tab/filter/scroll/selection; Fleet Roster's role filter and scroll position are local `useState`/DOM scroll in `FleetRosterScreen`, which already resets on remount today (true before this change too, e.g. after visiting the current placeholder). Preserving it would mean lifting that state above the screen or persisting it outside the component — out of scope for this plan; disclosing it now rather than silently promising it.

## 6. Route & placeholder relocation

- Reuses the existing route id/path: `ship-detail-placeholder` → `#/ships/detail`, same `?id=<shipId>` convention already wired from Fleet Roster's Details button.
- `ShipDetailPlaceholderScreen` is relocated (not deleted) to a new internal comparison route, same pattern as the other three legacy relocations: new route id `ship-detail-legacy-placeholder` → `#/ships/detail/placeholder`. Not linked from any button.
- `App.tsx`: `ship-detail-placeholder` case repointed to the new real screen; new case added for `ship-detail-legacy-placeholder` → `ShipDetailPlaceholderScreen`.
- `AppShell.tsx`: `ship-detail-placeholder` is already in the `showBottomNav` exclusion list from the Fleet Roster phase — it now needs to stay excluded for the opposite reason (full-screen shell renders no nav at all, vs. the old placeholder rendering its own `HubBottomNav`), so the boolean condition is unchanged but its governing comment needs updating to reflect why. `ship-detail-legacy-placeholder` must be **added** to the exclusion list, since the relocated placeholder still renders `HubBottomNav` internally and would otherwise double up with the shared one.

## 7. Ship data strategy (inspected directly, not assumed)

Checked `types/ship.ts` and `data/ships.ts` before deciding this: `ShipDefinition` already carries real per-ship `passiveName`/`passiveDescription` (hand-authored for all 20 ships) and `weaponLevels` (1–5, hand-tuned for ship 1, formula-derived for ships 2–20), plus `calamityName`/`calamityDescription` — hand-tuned only for ship 1; for ships 2–20 these are auto-generated (`"${name} Calamity"` / "Calamity attack pending design — placeholder…"), a divergence `ships.ts` already discloses itself, not something this plan introduces.

Comparing that real data against the reference for the pictured ship:

| Field | Real `ships.ts` (`ship-03-homing-missiles`) | Reference |
|---|---|---|
| Passive | "Tracking Array" — "Missiles retarget automatically when their target is destroyed." | "Target Lock" — "Increases missile tracking speed by 15% and critical damage by 20%." |
| Calamity | auto-generated placeholder | "Missile Barrage" — "Launches a massive salvo of homing missiles, dealing 680% damage." |
| Weapon level cap | 5 | 10 |
| Level cap | `SHIP_MAX_LEVEL` = 20 | 40 |

Given that, the plan follows the same disclosed prototype-vs-real convention already used by `campaignStageDetail.ts`/`preBattle.ts`/`fleetRoster.ts`, via a new **`src/data/shipDetail.ts`**:

- **`getShipDetailContent(shipId, player): ShipDetailContent`** — for `ship-03-homing-missiles`, returns a hardcoded reference-exact record (Power 12,480; Level 12/40; Star Rank 2/5; Weapon Level 3/10; Core Stats exactly as listed in §2.3; weapon "Homing Missile MK III"; passive "Target Lock"; calamity "Missile Barrage"; Fragments 36/80; Skin "Void Hunter" / Epic / "+5% Damage"), each field commented with why it overrides the real one. For every other ship, it derives everything from real data: `calculateShipStats`/`calculatePowerScore` for stats and power, `player.shipProgress[shipId]` for level/weaponLevel/stars (defaulting via `createDefaultShipProgress` the same way the store already does), `SHIP_MAX_LEVEL` (20) and `ship.weaponLevels.length` (5) as the real caps, `ship.passiveName`/`passiveDescription` and `ship.weaponLevels[current-1]` as real weapon/passive copy, `ship.calamityName`/`calamityDescription` passed through as-is (inheriting `ships.ts`'s own existing placeholder disclosure for ships 2–20, not a new one). Fragments for non-reference ships reuse a small rarity-scaled table in the same spirit as `fleetRoster.ts`'s private `GENERIC_FRAGMENT_MAX` (a new, disclosed, equally-generic constant local to this file — not importing Fleet Roster's private one). Skin defaults to a plain "No Skin Equipped" state rather than inventing 19 more skin names.
- **Master art:** `getShipMasterArt(shipId)` only, for every ship, no exceptions — same rule as Fleet Roster.

## 8. Hero presentation

New `ShipDetailHeroPanel` component (not a reuse of Fleet Roster's `FleetFeaturedPanel`/`FleetStatBlock` — their layout is a horizontal stat-block row plus a 4-badge ability strip and a description line, none of which Ship Detail's reference shows; Ship Detail's hero is a vertical icon-label-value stack with no description and no ability-tier row). It will reuse the same *building blocks* those components proved out: `getShipMasterArt`, `RARITY_LABEL`/`rarityColorVar` from `utils/rarity.ts`, `BattleModeIcon variant="target"` for the Attack role glyph (already the icon Fleet Roster uses for the same role), `BattleModeIcon variant="star"` for star rank, `BattleModeIcon variant="info"` for the (i) glyphs, `BattleModeIcon variant="swords"` for the Power icon.

Elements included, all reference-present: rarity pill, name, role row, Power box, Level row (with a thin progress fill, same idea as `FleetStatBlock`'s `progressPct`), Star Rank row, Weapon Level row, master art (object-fit: contain inside a fixed-aspect frame so it can't overflow), Equip button. The reference's painted planet/starfield/missile-trail backdrop is not reproducible from `getShipMasterArt` (which returns an isolated ship cutout) and no new artwork will be generated — the panel instead uses a dark radial-glow CSS background (same technique `FleetFeaturedPanel`/`FleetShipCard` already use behind their master art), disclosed as a substitution for the illustrated scene, not a pixel match to it. The top-right hex emblem badge has no existing matching asset; it will be omitted rather than invented, disclosed. The right-edge ">" chevron is rendered but non-functional this round (no ship-cycling behavior is in the 57-point ask, and wiring it to Fleet Roster's ordering is a small enough addition that it's better proposed than silently built) — flagged in §16 as an open question rather than assumed.

## 9. Core Stats grid

A 6-cell grid (icon, label, value, up-arrow) rendered from `calculateShipStats` output — real for every ship, including the reference one (its exact reference numbers are the hardcoded override from §7, not a coincidence of the growth formula). This is the same category of section that caused the earlier Stage Detail mobile misalignment bug (history tasks #17–20: icon/label/value columns drifting out of alignment at narrow widths). To not repeat it: fixed icon column width, `min-width: 0` on every cell, and `grid-template-columns: repeat(3, 1fr)` wrapping to 2 rows of 3 below a width breakpoint rather than 6 columns squeezed into one row, which the reference's 941px-wide capture can afford but a 360–412px real viewport cannot.

## 10. Ability cards (Intrinsic Weapon / Passive / Calamity)

One reusable component, `ShipDetailAbilityCard`, parameterized by a `variant: "weapon" | "passive" | "calamity"` (controls the pill label/color and whether the info glyph shows — only Calamity has one) plus icon/name/description/level/max/onUpgrade props. Icons: no dedicated per-ability icon assets exist in `assetRegistry.ts` (`MATERIAL_ICON`/`SLOT_ICON`/`UTILITY_ICON` don't cover this), so each card uses a coded `BattleModeIcon` stand-in disclosed the same way Fleet Roster's ability-tier badges already are — `target` for the weapon (matches its homing/seeking theme), a themed variant for passive/calamity chosen for visual distinction, not for new artwork. No emoji/Unicode anywhere.

## 11. Fragments & Equipped Skin panels

Left panel reuses `MATERIAL_ICON.shipFragment` (already registered) with the ship's fragment current/max from `shipDetail.ts`; "Find Fragments" opens an informational modal (no fragment-source screen exists yet). Right panel shows `getShipMasterArt(shipId)` as the skin thumbnail (no separate skin-art assets exist) with the skin name/rarity/bonus from `shipDetail.ts`, or the generic "No Skin Equipped" state for non-reference ships; "Change Skin" opens an informational modal (no Skin screen exists yet, and building one is explicitly out of scope).

## 12. Equip / Upgrade / locked behavior

- **Equip** (hero panel button): calls `selectOwnedShip(shipId)` — the same safe, already-approved action Fleet Roster uses, which no-ops for a ship not genuinely owned. If the viewed ship is already `player.selectedShipId`, the button shows a disabled "Equipped" state instead (a real, expected piece of interactivity the static reference frame can't depict either way, since a single frame can only show one state — disclosed as inferred rather than reference-shown).
- **Ability card Upgrade buttons** (Weapon/Passive/Calamity): open an informational "coming soon" modal. Building real per-ability upgrade flows is explicitly out of scope this round ("do not begin Ability Detail").
- **Bottom row — Level Up**: calls `selectOwnedShip(shipId)` (safe no-op guard as above) then navigates to the existing `ship-upgrade` route, matching the user's explicit "route to the existing Ship Upgrade screen… do not redesign it" instruction. This is the one bottom-row button with a real existing destination (`ShipUpgradeScreen` shows level/stat progression, the closest existing match to "Level Up"). Note: `ShipUpgradeScreen` reads its ship from `player.selectedShipId`, not a query param — hence calling `selectOwnedShip` first is required for it to show the right ship, not optional.
- **Bottom row — Star Rank / Weapon / Abilities / Skins**: no matching real screens exist (`F-04`–`F-07` in the nav map are unbuilt). Each opens an informational "coming soon" modal, consistent with how every other not-yet-built destination in this project has been handled (Fleet Roster's Sort/Filter, Stage Detail's View Rewards, Pre-Battle's Change Loadout, etc.).
- **Locked ship**: Equip button is disabled and replaced with the unlock requirement text (from `ship.unlockRequirement`, already real data); tapping it (or any ability Upgrade button) opens `LockedContentModal` with that requirement, mirroring Fleet Roster's `attemptSelectLockedShip`-driven card-tap behavior. Core Stats still show real level-1 base stats rather than blank cells.

## 13. Ship-state matrix

| State | Behavior |
|---|---|
| Valid, owned, not equipped | Full hero + stats + abilities; Equip active; Level Up → real Ship Upgrade route |
| Valid, owned, equipped | Same, Equip shows disabled "Equipped" |
| Valid, locked | Stats at level 1; Equip → unlock requirement + `LockedContentModal`; ability Upgrade buttons same |
| Unknown ship id | "Ship not found" state + Back button — same shape as `CampaignStageDetailScreen`'s existing `!content` branch |
| Missing `id` param | Same "not found" state (not a silent fallback to `selectedShipId`) — consistent with how Stage Detail and Pre-Battle both already treat a missing id |

## 14. Mobile safety

Applies the same checklist already enforced on every prior screen: `width/max-width: 100%`, `min-width: 0` on every flex/grid child, `box-sizing: border-box` everywhere, no `100vw` inside padded containers, no document-level horizontal scroll, hero art clipped to its frame (no glow bleed), Core Stats grid wraps to 2×3 below the narrow breakpoint (§9), fragment/skin panels stack to 1 column below ~380px if the two-column layout gets too tight for their button labels, all ability-card text wraps rather than truncates. Reasoned through at 412×915 / 390×844 / 360×800 by direct CSS/property inspection — no headless browser available in this sandbox (disclosed every round).

## 15. Files to create / modify

**New:**
- `src/data/shipDetail.ts`
- `src/components/ship-detail/ShipDetailTopBar.tsx` + `.css`
- `src/components/ship-detail/ShipDetailHeroPanel.tsx` + `.css`
- `src/components/ship-detail/ShipDetailStatGrid.tsx` + `.css`
- `src/components/ship-detail/ShipDetailAbilityCard.tsx` + `.css`
- `src/components/ship-detail/ShipDetailFragmentsSkinRow.tsx` + `.css`
- `src/components/ship-detail/ShipDetailActionRow.tsx` + `.css` (the bottom 5-button row)
- `src/screens/ship-detail/ShipDetailScreen.tsx` + `.css` (assembles the above)

**Modified:**
- `src/app/routes.tsx` — add `ship-detail-legacy-placeholder` (`#/ships/detail/placeholder`); `ship-detail-placeholder`'s path/id stay the same, only its rendered component changes.
- `src/app/App.tsx` — `ship-detail-placeholder` → `ShipDetailScreen`; add `ship-detail-legacy-placeholder` → `ShipDetailPlaceholderScreen`.
- `src/components/layout/AppShell.tsx` — add `ship-detail-legacy-placeholder` to the `showBottomNav` exclusion list; update the governing comment for `ship-detail-placeholder`.

**Not touched:** `HubHeader`, `HubBottomNav`, `HubScreenShell`, `FleetRosterScreen` and its components, `ShipUpgradeScreen`, `ships.ts`, `playerStore.tsx`, `fleetRoster.ts`, and every other previously-approved screen.

## 16. Open questions for approval

1. **Hero "next ship" chevron** — build as a real, low-risk control (cycle through `getFleetRosterOrder`, updating the `?id=` param in place) or leave decorative/non-functional this round? Plan defaults to non-functional unless told otherwise.
2. **Bottom-row "Weapon" button** — route to the real `ship-upgrade` screen (same as Level Up) since it's arguably the closest existing match, or treat it as "coming soon" like Star Rank/Abilities/Skins since `ShipUpgradeScreen` doesn't actually have a weapon-specific sub-view? Plan defaults to "coming soon" to avoid presenting `ShipUpgradeScreen`'s level-only content under a "Weapon" label.
3. **Cross-reference level-cap conflict** — Fleet Roster's approved featured panel shows Homing Missiles at Level 12/**30**; this reference shows the same ship at 12/**40**. Both are followed exactly on their own screens per this project's "match each screen's own reference" convention, but the two numbers will visibly disagree if a user compares them side by side. Flagging before building rather than after.

## 17. Verification plan

`tsc -b --noEmit` and a `vite build` to a temp dir (the usual OneDrive-lock workaround), an mtime diff across `src/` and `public/assets/` to confirm only the files listed in §15 changed, and a completion report covering: what matches the reference, every disclosed substitution (§7, §8, §10, §11), the three open questions and how they were resolved, and the mobile-safety checklist results at the three test widths.
