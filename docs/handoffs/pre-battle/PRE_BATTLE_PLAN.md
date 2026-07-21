# Pre-Battle — Pre-Implementation Plan

Planning only. No source files created or modified.

## 1. Authoritative reference

- **File:** `08_Pre_Battle.png`
- **Location in the 53-screen collection:** `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_1_Core_Hubs_and_Campaign/08_Pre_Battle.png`
- Opened and inspected in full (not from memory, not substituted with another screen). Description below is drawn directly from that image.

**Layout, top to bottom:**

1. Back chevron (top-left) + three resource pills (top-right): Energy `120/120` with a `+`, a gold-coin currency `12.5M` with a `+`, a crystal currency `89,450` with a `+`. No profile avatar, no level/XP bar, no mail icon, no settings icon.
2. Title `PREPARE FOR BATTLE` (large, centered) + subtitle `Review your loadout and mission details` (small, centered, cyan).
3. **Mission panel** (clipped-corner bordered panel, art background top-right — a nebula rift with silhouetted ships): `CAMPAIGN` eyebrow tag, `CHAPTER 2 • STAGE 7`, stage name `NEBULA BREACH` (large), one-line description, then a 3-column stat row: Entry Cost (lightning icon, `10`), Recommended Power (crossed-swords icon, `11,900`, purple), Your Power (crossed-swords icon, `12,480`, cyan).
4. **YOUR LOADOUT** section: three side-by-side cards — Ship (`HOMING MISSILES`, Lv. 86, SSS), Companion (`REPAIR DRONE`, Lv. 60, SSS) — then a `MODULES` list of 3 rows (Core: `NEBULA CORE` Lv.86 SSS; Plating: `TITANIUM PLATING` Lv.86 SSS; System: `TARGETING AI` Lv.86 SSS), each with a small square icon.
5. Three side-by-side panels: **OBJECTIVES** (1 gold star + "Complete the mission", 2 outlined stars for the other two objectives — same 3 objectives as Stage Detail), **STAGE MODIFIERS** (3 rows: Enemy Shields +30%, Energy Drain +20%, Void Storm periodic damage — each with a small icon), **REWARD PREVIEW** (3 icons in a row: coin 150K, crystal 250, XP hexagon 12K, then a 4th row below: a module-shaped icon + "Chance to get EPIC MODULE").
6. Large gold hexagonal **START** button spanning the width, with a lightning-bolt `10` beneath the label.
7. **CHANGE LOADOUT** — plain outlined pill button beneath Start.

**No bottom navigation bar is visible anywhere in the reference.**

## 2. Shell determination — not assumed, derived from the docs

`SCREEN_NAVIGATION_MAP.md` §3.2 defines two shells: the **standard dashboard shell** (used by the five hubs and management screens — persistent 5-item bottom nav) and the **full-screen shell**, which explicitly "hides the persistent bottom navigation" and lists its uses: *first-run onboarding, **pre-battle confirmation**, gameplay, pause, victory/defeat/results, reward reveal, purchase processing*.

Entry `B-15 — Pre-Battle` states plainly: **`Shell: Full-screen`**.

This matches the reference image exactly — no bottom nav, and the top bar is not `HubHeader` either: `HubHeader` renders a profile/avatar/level/XP block on the left and mail+settings icons on the right, none of which appear here. The reference's top bar is only a back button and three resource pills.

**Conclusion: Pre-Battle does not reuse `HubScreenShell` + `HubHeader` + `HubBottomNav`.** It needs its own lightweight full-screen layout:

- No `HubBottomNav` — matches every prior screen's route already being added to `AppShell.tsx`'s exclusion list (Pre-Battle's real route must join that list too, replacing the placeholder's current entry).
- A new, small `PreBattleTopBar` (or similar) component: back button + 3 resource pills reading `player.currencies.energy/coins/crystals` via `RESOURCE_ICON.energy/credits/crystals` (exact icon match already in `assetRegistry.ts`, no substitution needed). Not a copy of `HubHeader` — deliberately narrower, per the reference.
- This is a new, scoped layout used only by Pre-Battle. It does not touch `HubScreenShell`/`HubHeader`/`HubBottomNav` themselves.

## 3. Documents and code inspected

- `docs/blueprint/STARFIRE_ARMADA_SCREEN_AND_NAVIGATION_MAP.md` → duplicate of the zip's `SCREEN_NAVIGATION_MAP.md`; used the zip copy for exact section numbers (§3.2 shell rules, §11 Battle screens, B-15 entry, §14/§20 loadout flow, §6.5 "Play must open Pre-Battle, not launch gameplay directly").
- `SPACE_SHOOTER_MASTER_HANDOFF.md`, `GAME_DESIGN_SYSTEMS_BLUEPRINT.md` → no Pre-Battle-specific content beyond general shell/system conventions already covered by the nav map; nothing there contradicts or adds to the B-15 spec.
- `ASSET_INTEGRATION_INSTRUCTIONS.md` → general naming/substitution conventions only, consistent with what's already been followed.
- `CampaignStageDetailScreen.tsx`, `PreBattlePlaceholderScreen.tsx` → current flow, current `?id=` stage-passing convention, current button wiring.
- `ShipSelectionScreen.tsx`, `ShipUpgradeScreen.tsx` → confirmed neither accepts a "return to" target; both operate on the player's real `selectedShipId`/roster, not on a passed-in loadout.
- `src/data/campaignStageDetail.ts`, `campaignChapterMap.ts` → existing prototype stage/loadout shape.
- `src/store/playerStore.tsx`, `src/types/player.ts` → real `PlayerState.currencies` (energy/coins/crystals) and `spendCurrency(currencyId, amount): boolean` already exist and are safe to reuse for a real Energy check.
- `src/data/assetRegistry.ts` → confirmed available: `RESOURCE_ICON` (energy/credits/crystals — exact match for the top bar), `SHIP_ROSTER_ART` (5 ships, id `ship-03-homing-missiles` — name matches the reference's ship caption exactly), `COMPANION_ART.repairDrone` (exact name match), `MODULE_ART` (12 modules — no exact name matches for "Nebula Core"/"Titanium Plating"/"Targeting AI", closest by function: `energyShieldMatrix`, `nanoHullPlating` or `reactiveArmor`, `targetingArray`). No `WEAPON_ICON`, `BOOSTER_ICON`, or `CONSUMABLE_ICON` category exists anywhere in the registry.
- `src/screens/gameplay/GameplayScreen.tsx` → reads `player.selectedShipId` / `player.currentStageId` from the store (not route params); currently a canvas placeholder with a debug "End Stage" button.
- `src/data/campaign.ts` (real data) vs `campaignChapterMap.ts` (prototype data) → **id spaces don't overlap.** Real stages are `ch1-stage-1`…`ch1-stage-5` (Chapter 1 only); the prototype Chapter Map's stages are `stage-1`…`stage-10` (presented as Chapter 2). `getStageById("stage-7")` would resolve to `undefined`.
- `src/components/feedback/LockedContentModal.tsx` → existing "coming soon"/locked dialog, already reused by Stage Detail's own Change Loadout/View Rewards taps.
- `src/components/layout/AppShell.tsx` → its own legacy `showBottomNav` exclusion list (separate from `HubBottomNav`) already excludes every hub-shell screen; Pre-Battle's real route needs to be added here too so the old shared `BottomNavigation` doesn't render underneath the full-screen layout.
- `src/components/icons/BattleModeIcon.tsx` → current variants (`calendar, skull, target, shield, mapPin, chevron, lock, star, swords, energy, check, search, info, gift, refresh`) already cover everything this screen needs — no new icon variants required.

## 4. Required content — full checklist

1. Back chevron, top-left, returns to Stage Detail with `?id=` preserved.
2. Energy resource pill — real value from `player.currencies.energy`, real `RESOURCE_ICON.energy`.
3. Coins resource pill — real value from `player.currencies.coins`, real `RESOURCE_ICON.credits`.
4. Crystals resource pill — real value from `player.currencies.crystals`, real `RESOURCE_ICON.crystals`.
5. Title `PREPARE FOR BATTLE`.
6. Subtitle `Review your loadout and mission details`.
7. Mode/category eyebrow (`CAMPAIGN`).
8. Chapter/stage label (`Chapter {n} • Stage {n}`), sourced the same way Stage Detail does (`getStageDetailContent`).
9. Stage name.
10. One-line stage description.
11. Mission panel background art — reusing `CHAPTER_BACKGROUND_IMAGE["chapter-01"]` (same disclosed substitution already approved for Stage Detail's mission panel — `MODE_ILLUSTRATION.campaign` remains the small emblem, not wide art).
12. Entry Cost stat (energy icon + value).
13. Recommended Power stat.
14. Your Power stat (numeric total from the loadout's modules/ship, same `content.recommendedPower`/`content.totalPower` fields already in `campaignStageDetail.ts`).
15. Loadout section heading (`YOUR LOADOUT`).
16. Ship card: art, name, level, rarity label.
17. Companion card: art, name, level, rarity label.
18. Modules list heading (`MODULES`).
19. Core module row: icon, slot label, name, level, rarity.
20. Plating module row: icon, slot label, name, level, rarity.
21. System module row: icon, slot label, name, level, rarity.
22. Objectives panel (reusing the same 3 objectives already in `campaignStageDetail.ts` for Stage 7; generic-fallback stages get the same generic 3-star pattern Stage Detail already uses).
23. Stage Modifiers panel — **new prototype data**, not currently present anywhere in `campaignStageDetail.ts`. Needs 3 entries: Enemy Shields (+30%), Energy Drain (+20%), Void Storm (periodic damage zones), each with an icon + label + short value.
24. Reward Preview panel — reusing the same first-clear reward shape already in `campaignStageDetail.ts` (`firstClearRewards`), condensed to icon+amount only (no "First Clear" label repeated, since this panel is a preview, not the full rewards list Stage Detail already shows).
25. Chance-of-bonus row (`Chance to get EPIC MODULE`) — new field, reusing `REWARD_CHEST.epic` styling/badge convention already established.
26. Start button — gold, full-width, hexagonal-clipped, showing the Energy cost beneath the label.
27. Change Loadout — outlined pill button beneath Start.
28. No footer/bottom nav anywhere on this screen.
29. Locked module/loadout slot treatment — not present in this reference (all 3 module slots + ship + companion are filled), so no locked-slot UI is required for Stage 7's content; the component should still accept an optional locked state for future stages, matching the same forward-compatible pattern `StageObjectiveRow` used for its unused `completed` prop.
30. Insufficient-Energy state — not visually shown in the reference (the player has 120/120 and the stage costs only 10), but required by doc rule B-16; see §6 below for the plan.
31. Safe-area padding top and bottom (no bottom nav means the Start button and Change Loadout need their own bottom safe-area padding, not inherited from `HubScreenShell`'s footer row).
32. Portrait-only layout, no desktop/web-dashboard treatment.
33. All text sourced from typed prototype data, not baked into any image.
34. `?id=` stage-context convention preserved from Stage Detail.
35. Back button behavior identical to Stage Detail's own back-button convention (`IconButton` + rotated `chevron`).
36. Every panel uses the existing clipped-corner/bordered-panel visual language already established (`stage-mission-panel`, `NeonPanel`, etc.), not a new visual system.
37. No generic browser/OS confirmation dialog anywhere in this flow.
38. Ship/Companion/Module names, levels, and rarity badges rendered as real coded text/components, not baked into art.
39. Numeric formatting consistent with the rest of the app (`toLocaleString()` for large numbers, matching Stage Detail).
40. Reward Preview and Stage Modifiers panels tap-through to an informational modal (same "coming soon" `LockedContentModal` pattern already used for View Rewards on Stage Detail), not left dead.
41. Vertical scrolling for the whole content column, since Mission + Loadout + 3-panel row + Start + Change Loadout is taller content than one 844px viewport in most cases.
42. No `MODULE_ART` substitution invents a 4th module slot or a weapon slot — reference has exactly Core/Plating/System, no separate weapon icon slot (the "HOMING MISSILES" text is the ship's caption, not a weapon slot).
43. No boosters/consumables section — not present anywhere in this reference image; will not be invented.
44. Full visual acceptance checklist — see §14.

## 5. Reference-matching prototype data

New file: `src/data/preBattle.ts`, same temporary/disclosed convention as `campaignStageDetail.ts`. Rather than duplicating Stage 7's mission/objective/reward fields a second time, it will **derive from** `getStageDetailContent()` (already has stage name, description, chapter/stage label, energy cost, recommended/your power, objectives, first-clear rewards, loadout ship/companion, total power) and add only what Pre-Battle needs that Stage Detail doesn't already model:

- `modules: { core: ModuleSlot; plating: ModuleSlot; system: ModuleSlot }` — `ModuleSlot = { name: string; level: number; rarityLabel: string; icon: string }`, reference-matched for Stage 7 only (`Nebula Core` / `Titanium Plating` / `Targeting AI`, Lv. 86, SSS).
- `stageModifiers: { id: string; icon: BattleModeIconVariant; label: string; value: string }[]` — the 3 reference rows.
- `bonusRewardLabel: string` — `"Chance to get Epic Module"`.
- A `getPreBattleContent(stageId, stageIndex, chapterIndex)` fallback mirroring `getStageDetailContent()`'s generic-stage pattern for every non-Stage-7 id (same modules/modifiers with `isReferenceMatched: false`, using the exact same on-screen prototype-note treatment Stage Detail already uses).

Clearly commented as temporary/prototype, same as every prior data file this project.

## 6. Loadout presentation

New, reusable, purpose-scoped components under `src/components/pre-battle/`:

- `PreBattleShipCard` — art (`SHIP_ROSTER_ART["ship-03-homing-missiles"]`), name, `Lv. {n}`, rarity badge. **Note:** Stage Detail's loadout used `ship-01-rapid-fire`'s art for its prototype ship name "Void Reaper." Pre-Battle's reference literally labels the ship `HOMING MISSILES`, which is an exact match to the real asset id `ship-03-homing-missiles` — using that art here instead is a closer, disclosed correction, not a continuation of Stage Detail's weaker substitution. Stage Detail itself is approved and will not be touched to "fix" this retroactively.
- `PreBattleCompanionCard` — art (`COMPANION_ART.repairDrone`, exact name match to the reference's `REPAIR DRONE`), name, level, rarity badge.
- `PreBattleModuleRow` — one of the 3 module rows: slot icon (small square, using the `MODULE_ART` substitutions in §3), slot label (`CORE`/`PLATING`/`SYSTEM`), name, level, rarity. Accepts an optional `locked` flag for forward-compatibility (unused by Stage 7, per §4.29).
- All coded, no emoji/Unicode, consistent with the rest of the project.

## 7. Power and eligibility

- Render Recommended Power and Your Power exactly as Stage Detail already does (reusing `content.recommendedPower`/`content.yourPower` from `getStageDetailContent`), no new power-calculation logic.
- Derive a simple `hasSufficientPower = yourPower >= recommendedPower` boolean for a visual-only difference indicator (color, matching Stage Detail's existing highlight convention on "Your Power") — informational only, will not block the Start button, since the reference doesn't show a Power gate and B-15's own required content doesn't list one as blocking.
- Energy eligibility **will** gate the Start button (see §8) — this is the one place the doc explicitly ties to a "resolution" flow (B-16).

## 8. Start Battle behavior — recommendation

**Do not route directly into the real `GameplayScreen`.** Reasoning:

- `GameplayScreen` reads `player.currentStageId`/`player.selectedShipId` from the real player store, not from route params or from what Pre-Battle displays.
- The prototype stage id space (`stage-7`, from `campaignChapterMap.ts`) does not exist in the real `data/campaign.ts` id space (`ch1-stage-1`…`ch1-stage-5`) — `getStageById("stage-7")` resolves to `undefined`, so `GameplayScreen` would silently show "No stage" instead of Nebula Breach.
- The prototype loadout ship (`ship-03-homing-missiles` art, fictional name/level "Homing Missiles Lv. 86") is not necessarily the player's real `selectedShipId` — routing to gameplay would show whichever ship the player actually has selected in Ship Selection, contradicting what Pre-Battle just displayed.
- This mismatch is not something safely reversible or fixable within this task's scope without touching `GameplayScreen`, `data/campaign.ts`, or the player store's stage/ship model — all explicitly off-limits (gameplay code) or out of scope.

**Recommended approach:** a minimal, clearly-labeled **Gameplay Launch placeholder** (`GameplayLaunchPlaceholderScreen`), same disclosed-placeholder convention as `PreBattlePlaceholderScreen` was for Stage Detail one step ago — stage context, a "Battle Coming Soon" message, a way back to Pre-Battle. Route: `#/campaign/battle-launch` (new), carrying the same `?id=` suffix.

**Energy is still spent for real**, per B-15's own rule ("Entry resource is consumed only after the Start action successfully creates the battle session") — `Start` will call the real `spendCurrency("energy", content.energyCost)` from `usePlayerStore` immediately before navigating to the placeholder, since that part *is* safe (existing, tested store method, real currency, reversible via the store's own logic) even though the gameplay hop itself isn't ready. If `spendCurrency` returns `false` (insufficient energy), the button shows the insufficient-Energy state instead (§9) and does not navigate.

This keeps Start's core resource-economy behavior real and correct, while not pretending gameplay is wired up when it structurally isn't yet.

## 9. Insufficient-resource state (B-16)

Not shown in the reference (player has full Energy), but required by the doc. Minimal, disclosed approach: if `player.currencies.energy < content.energyCost`, the Start button renders in a visually disabled state (dimmed, non-interactive) and tapping the row opens `LockedContentModal` with a short "Not enough Energy" message — reusing the existing modal rather than building a new B-16 sheet component, consistent with how Stage Detail already reused `LockedContentModal` for its own "coming soon" taps. A dedicated Energy-refill sheet is out of scope for this pass.

## 10. Change Loadout

Neither `ShipSelectionScreen` nor `ShipUpgradeScreen` currently accepts a "return to" target or operates on a passed-in stage-specific loadout — both edit the player's real, global ship roster/selection, which doesn't correspond to Pre-Battle's fictional per-stage loadout ("Homing Missiles"/"Repair Drone" are prototype labels, not real owned-ship state). Building real return-state preservation is out of scope here (would mean modifying those two screens, which isn't part of this task).

**Minimal temporary approach:** `Change Loadout` opens the same `LockedContentModal` "coming soon" informational dialog Stage Detail already uses for its own Change Loadout link — consistent, no dead tap, no premature wiring into screens whose data model doesn't match yet.

## 11. Mobile width and overflow safety

Directly carrying forward both lessons from Stage Detail's two reported bugs:

- Every new container (`pre-battle__content`, top bar, mission panel, loadout section, ship/companion cards, module rows, the 3-panel row, Start/Change Loadout wrapper) gets `width:100%; max-width:100%; min-width:0; box-sizing:border-box;`.
- No `width:100vw` anywhere.
- **No `white-space:nowrap`+`overflow:hidden`+`text-overflow:ellipsis` on any essential label** — ship/companion/module names, stat labels, and button text wrap onto 2 lines instead, using the same `white-space:normal; overflow:visible; text-overflow:clip; overflow-wrap:normal; word-break:normal;` pattern that fixed Stage Detail's stat-grid labels. Only clearly non-essential, already-short numeric values may still use `nowrap`+`ellipsis` as a last-resort safety net (matching Stage Detail's existing `.stat-cell__value` convention).
- The 3-card loadout row (Ship / Companion / Modules) and the 3-panel row (Objectives / Modifiers / Rewards) are the two highest-risk regions — both reference layouts pack 3 columns into ~360-412px. Plan: stack these to a single column below a `480px` breakpoint (same class of fix as `StageRewardsRow`'s existing single-column stack under 420px), rather than forcing 3 native-width columns that would overflow.
- `min-width:0` on every flex/grid child in these rows (the same property Stage Detail's stat-grid fix relied on) to stop content from flooring column widths above their container.
- Tested by the same property-level reasoning used for every prior round (no headless browser available in this sandbox — disclosed again here) at 412×915, 390×844, 360×800, and the user's real device width once built.
- Acceptance: no horizontal page scroll, no right-side blank gap, no clipped/ellipsized essential text, Start button fully reachable and tappable above any safe-area inset, vertical scroll works for the full content column.

## 12. Navigation summary

| Action | Destination |
|---|---|
| Back (top-left) | Stage Detail, `?id=` preserved |
| Start | `spendCurrency("energy", cost)` → if sufficient, navigate to new `battle-launch` placeholder (`?id=` preserved); if insufficient, `LockedContentModal` "Not enough Energy" |
| Change Loadout | `LockedContentModal` "coming soon" |
| Reward Preview tap | `LockedContentModal` "coming soon" (same pattern as Stage Detail's View Rewards) |
| Stage Modifiers tap | `LockedContentModal` "coming soon" |
| Module row tap | `LockedContentModal` "coming soon" (same treatment, forward-compatible with an eventual real Module Detail screen) |

No route here changes Home, Battle Hub, Campaign Overview, Campaign Chapter Map, or Campaign Stage Detail's own navigation beyond Stage Detail's existing `Prepare` button target (which already points at `pre-battle-placeholder`'s path and will simply resolve to the real screen once it takes over that route id).

## 13. Routing changes

- `pre-battle-placeholder` route id's path (`#/campaign/pre-battle`) will point at the real `PreBattleScreen` component (App.tsx switch case updated).
- `PreBattlePlaceholderScreen.tsx`/`.css` relocate to a new internal/debug-only route, `pre-battle-legacy-placeholder` → `#/campaign/pre-battle/legacy-placeholder`, unlinked, comparison-only — same relocation pattern as `stage-detail-legacy-placeholder`. File itself is not modified, only its route.
- New route: `battle-launch` → `#/campaign/battle-launch` (`GameplayLaunchPlaceholderScreen`), `?id=` suffix.
- `AppShell.tsx`'s `showBottomNav` exclusion list: `pre-battle-placeholder` stays excluded (now pointing at the real screen), add `battle-launch`. `pre-battle-legacy-placeholder` keeps using the old shared nav, same as `stage-detail-legacy-placeholder` today — intentionally not added to the exclusion list.
- `CampaignStageDetailScreen.tsx`: **zero changes needed** — its `handlePrepare` already navigates to `pathFor("pre-battle-placeholder")`, which will simply resolve to the real screen once the route id's target component changes. No edit required to Stage Detail itself.

## 14. Visual acceptance checklist

- Portrait-only, no desktop/web-dashboard layout.
- No `HubHeader`/`HubBottomNav` — a dedicated back+resources top bar, no bottom nav bar at all.
- Stage identity (chapter/stage label, name, description) matches Stage 7's existing reference-matched content.
- Entry Cost / Recommended Power / Your Power stat row present and correctly sourced.
- Ship card: `ship-03-homing-missiles` art, name/level/rarity.
- Companion card: `repairDrone` art, name/level/rarity.
- 3 module rows present, correctly labeled Core/Plating/System.
- Objectives panel matches Stage Detail's existing 3 objectives.
- Stage Modifiers panel: 3 new rows (Enemy Shields/Energy Drain/Void Storm).
- Reward Preview panel: coins/crystals/XP + bonus-module chance row.
- Start button: gold, full-width, hexagonal-clipped, Energy cost shown, real `spendCurrency` gate.
- Change Loadout: outlined pill, opens informational modal.
- No generic browser confirmation dialog anywhere.
- No full raw reference image used as a background anywhere.
- No horizontal overflow at 412×915 / 390×844 / 360×800.
- No essential text truncated with ellipsis.
- All loadout/module controls are real coded components, not baked into art.
- Vertical scrolling works for the full content column; Start button reachable above safe-area inset.
- Home, Battle Hub, Campaign Overview, Campaign Chapter Map, Campaign Stage Detail, `HubHeader`, `HubBottomNav`, `HubScreenShell`, and all gameplay code remain unchanged.

## 15. Disclosed substitutions and gaps (summary)

- Mission panel background art: `CHAPTER_BACKGROUND_IMAGE["chapter-01"]` (same as Stage Detail, same reasoning).
- Module icons: `energyShieldMatrix` / `nanoHullPlating` (or `reactiveArmor`) / `targetingArray` substituting for "Nebula Core" / "Titanium Plating" / "Targeting AI" — closest by function/name, not exact.
- Ship art: `ship-03-homing-missiles` — genuine exact name match to the reference caption, an improvement over Stage Detail's own looser ship-art substitution (Stage Detail is not touched to retrofit this).
- Companion art: `repairDrone` — exact name match.
- No dedicated Energy-refill / insufficient-resource sheet (B-16) — a minimal modal message instead.
- No real gameplay routing — a disclosed temporary placeholder, with the reasoning in §8.
- No real Change-Loadout flow — informational modal, same as Stage Detail's own precedent.
- Stage Modifiers and the bonus-reward-chance row are new prototype data, clearly commented as temporary in `preBattle.ts`.

---

Stopping here. Waiting for approval before creating or modifying any source files.
