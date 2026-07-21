# Pre-Battle — Completion Report

Scope: the real Pre-Battle screen and a minimal temporary Battle Launch placeholder for its Start button, per the approved plan and the mandatory Energy correction. Real gameplay integration is not built.

## Files created

- `src/data/preBattle.ts` — Pre-Battle-specific prototype data (modules, stage modifiers, reward-preview fields, loadout overrides) plus `getPreBattleContent()`, which derives mission-identity fields from Stage Detail's own `getStageDetailContent()` rather than duplicating them.
- `src/components/pre-battle/PreBattleTopBar.tsx` / `.css` — back button + Energy/Credits/Crystals pills, this screen's entire header.
- `src/components/pre-battle/PreBattleMissionPanel.tsx` / `.css` — stage identity + Entry Cost/Recommended Power/Your Power 3-stat row.
- `src/components/pre-battle/PreBattleShipCard.tsx` / `.css` — ship loadout card (also used by `PreBattleCompanionCard`, same CSS file).
- `src/components/pre-battle/PreBattleCompanionCard.tsx` — companion loadout card.
- `src/components/pre-battle/PreBattleModuleRow.tsx` / `.css` — one Core/Plating/System module row.
- `src/components/pre-battle/PreBattleInfoPanels.tsx` / `.css` — Objectives / Stage Modifiers / Reward Preview 3-panel row.
- `src/screens/campaign/PreBattleScreen.tsx` / `.css` — the real screen.
- `src/screens/campaign/GameplayLaunchPlaceholderScreen.tsx` / `.css` — temporary "Start" destination.

## Files modified

- `src/app/routes.tsx` — added `pre-battle-legacy-placeholder` (`#/campaign/pre-battle/legacy-placeholder`) and `battle-launch` (`#/campaign/battle-launch`). The `pre-battle-placeholder` route id's **path is unchanged** (`#/campaign/pre-battle`) — only its target component changes (see App.tsx), so Stage Detail's `handlePrepare` needed zero edits.
- `src/app/App.tsx` — `"pre-battle-placeholder"` now renders `PreBattleScreen` (was `PreBattlePlaceholderScreen`); added `"pre-battle-legacy-placeholder"` → `PreBattlePlaceholderScreen`, `"battle-launch"` → `GameplayLaunchPlaceholderScreen`.
- `src/components/layout/AppShell.tsx` — added `pre-battle-legacy-placeholder` and `battle-launch` to the shared `showBottomNav` exclusion list, alongside the existing `pre-battle-placeholder` entry (already excluded). **Correction from the plan:** the plan said the legacy placeholder would keep the old shared nav; on inspection, `PreBattlePlaceholderScreen.tsx` already renders its own `<HubScreenShell>`/`<HubHeader>`/`<HubBottomNav>` internally (unmodified), so it needs the same double-render exclusion `stage-detail-legacy-placeholder` already gets, not the opposite. Fixed at implementation time rather than following the plan's incorrect assumption.

**Not touched:** Home, Battle Hub, Campaign Overview, Campaign Chapter Map, Campaign Stage Detail (confirmed below — zero edits, its `Prepare` button already targeted the now-repointed route id), `HubHeader`, `HubBottomNav`, `HubScreenShell`, `GameplayScreen`, `data/campaign.ts`, `playerStore.tsx`/player progression model, `PreBattlePlaceholderScreen.tsx`/`.css` (only relocated via routing).

## Shell implementation

Confirmed via `SCREEN_NAVIGATION_MAP.md` §3.2 + the B-15 entry ("Shell: Full-screen") that Pre-Battle hides the persistent bottom navigation — matching the reference image, which shows no bottom nav and a top bar with only a back button + 3 resource pills (no profile/level/XP/mail/settings). `PreBattleScreen.tsx` does not use `HubScreenShell`, `HubHeader`, or `HubBottomNav` — it's a standalone flex-column layout (`PreBattleScreen.css`) with `PreBattleTopBar` as a fixed header and a scrollable content region below, no footer row. `GameplayLaunchPlaceholderScreen` uses the same full-screen convention (centered card, no shell reuse).

## Components created

`PreBattleTopBar`, `PreBattleMissionPanel`, `PreBattleShipCard`, `PreBattleCompanionCard`, `PreBattleModuleRow`, `PreBattleInfoPanels` — all under `src/components/pre-battle/`.

## Components reused as-is

`StageObjectiveRow` (inside `PreBattleInfoPanels`, unmodified), `LockedContentModal`, `BattleModeIcon` (no new variants needed — used `energy`, `swords`, `shield`, `skull`, `chevron`, `lock`, `refresh`), `usePlayerStore`, `navigate`/`pathFor`.

## Data used

`getPreBattleContent()` derives stage name, description, chapter/stage label, Entry Cost, Recommended/Your Power, and objectives from Stage Detail's `getStageDetailContent()` verbatim (per instruction to reuse Stage Detail values). Objectives are Stage Detail's own 3 items unchanged: "Clear the stage," "Clear with at least 50% HP," "Clear without revive" — reused exactly as authored in `campaignStageDetail.ts`, not re-typed from the raw reference image's "Complete the mission" phrasing.

New Pre-Battle-specific fields, clearly marked prototype/temporary in `preBattle.ts`:
- Modules: Core "Nebula Core," Plating "Titanium Plating," System "Targeting AI," all Lv. 86 / SSS.
- Stage Modifiers: Enemy Shields +30%, Energy Drain +20%, Void Storm (periodic damage zones).
- Reward Preview: Credits 75K and Crystals 250 reused from Stage Detail's own first-clear reward amounts; XP 12K is a **new** value with no equivalent anywhere in `campaignStageDetail.ts` (Stage Detail has no XP-reward field at all) — chosen to match what the reference image itself shows, disclosed here rather than invented silently.
- Loadout: ship "Homing Missiles" (Lv. 86, SSS) and companion "Repair Drone" (Lv. 60, SSS) — intentionally **not** reused from Stage Detail's own loadout labels ("Void Reaper"/"Rapid Drone"), since the Pre-Battle reference names its ship/companion differently and those names happen to be exact matches to real asset ids (see below).

## Assets used

- `RESOURCE_ICON.energy` / `.credits` / `.crystals` — exact match for the top bar, no substitution.
- `SHIP_ROSTER_ART["ship-03-homing-missiles"]` — exact name match to the reference's "HOMING MISSILES" ship caption. A closer match than Stage Detail's own ship-art substitution (`ship-01-rapid-fire` for "Void Reaper"); Stage Detail itself was not touched to retrofit this.
- `COMPANION_ART.repairDrone` — exact name match to "REPAIR DRONE."
- `SSS_EMBLEM_RESERVED` — previously-unused reserved SSS emblem asset, used for every SSS rarity badge on this screen (ship, companion, 3 modules) — a genuine asset match, not a substitution.
- `CHAPTER_BACKGROUND_IMAGE["chapter-01"]` — mission panel background, same disclosed substitution already approved for Stage Detail (`MODE_ILLUSTRATION.campaign` remains a small emblem, not wide art). Used only as a clipped background layer, never as the full raw reference image.
- `REWARD_CHEST.epic` — reused for the "Chance to get Epic Module" bonus row, same tier already used for Stage Detail's own first-clear chest reward.

## Disclosed substitutions

- **Module icons:** `MODULE_ART.energyShieldMatrix` (Core / "Nebula Core"), `MODULE_ART.nanoHullPlating` (Plating / "Titanium Plating"), `MODULE_ART.targetingArray` (System / "Targeting AI") — no exact-name module assets exist for any of the three; matched by function/theme, disclosed per slot in code comments.
- **XP reward icon:** no XP-specific asset exists anywhere in `assetRegistry.ts`. Built a small coded hexagon badge with "XP" text (CSS clip-path, no image, no emoji) rather than reusing a mismatched resource icon.
- **XP reward amount (12K):** new prototype value, no Stage Detail equivalent — see Data section above.

## Route changes

- `#/campaign/pre-battle` → now `PreBattleScreen` (was the placeholder). Path unchanged, so every existing link to it (Stage Detail's Prepare button) needed no edit.
- `#/campaign/pre-battle/legacy-placeholder` (new) → the original `PreBattlePlaceholderScreen`, unlinked, comparison-only.
- `#/campaign/battle-launch` (new) → `GameplayLaunchPlaceholderScreen`, carrying the same `?id=` stage suffix.
- Stage Detail's `Prepare` button: **zero changes** — confirmed `CampaignStageDetailScreen.tsx`'s `handlePrepare` still reads `pathFor("pre-battle-placeholder")` verbatim, and file mtime confirms it wasn't touched this round.

## Start behavior — Energy correction confirmed

Per your mandatory correction, `PreBattleScreen.tsx`'s `handleStart` (line ~62):

- Reads `player.currencies.energy` **read-only** to compute `hasSufficientEnergy = energy >= content.energyCost`. No write anywhere.
- If insufficient: opens `LockedContentModal` with "Not Enough Energy" and does **not** navigate.
- If sufficient: navigates directly to `#/campaign/battle-launch?id={stageId}`. **`spendCurrency` is never called** — confirmed by grep, the only occurrences of "spendCurrency" in the entire Pre-Battle flow are inside comments explaining why it's intentionally absent.
- A code comment at the exact call site (`ENERGY DEDUCTION BOUNDARY`) states real Energy spend must be wired at the point a real battle session is actually created — inside a future real gameplay-launch flow, after `GameplayScreen`/`data/campaign.ts` are connected to this prototype stage id space — not here and not inside the placeholder.
- Returning from the placeholder shows unchanged Energy by construction: since it was never decremented, there's nothing to restore — the top bar simply re-reads the same `player.currencies.energy` value from the store on the next render.

## Insufficient-Energy behavior

Visually: the Start button switches to a dimmed gray state (`pre-battle__start--insufficient`) instead of its gold gradient, `aria-disabled` is set. Tapping it opens `LockedContentModal` ("Not Enough Energy" / stage's exact Energy cost) rather than navigating anywhere. This is fully reachable in the current build any time `player.currencies.energy < 10` (the default save state has 120/120, so a real insufficient-state test requires either editing local storage or waiting for a future screen that spends Energy — flagged for your own manual check if you want to see it live).

## Change Loadout / module / modifier / reward interactions

All open the shared `LockedContentModal` with a short "coming soon" message, same convention as Stage Detail's own Change Loadout/View Rewards taps. Change Loadout does not route into Ship Selection or Ship Upgrade — neither screen currently supports a return target or a per-stage loadout, and neither was modified.

## Mobile responsive behavior

- Every new container carries `width:100%; max-width:100%; min-width:0; box-sizing:border-box`.
- No `width:100vw` anywhere.
- No `white-space:nowrap`+`ellipsis` on any essential label — mission-panel stat labels, loadout names, module names/slots, modifier labels, and bonus-reward text all use `white-space:normal; overflow-wrap:normal; word-break:normal` and wrap onto up to 2 lines, same pattern that fixed Stage Detail's own stat-grid truncation bug. Only short numeric values (resource pill amounts, Lv./rarity figures) keep `nowrap`+`ellipsis` as a last-resort safety net, matching Stage Detail's existing convention for its own stat values.
- The 3-panel Objectives/Modifiers/Rewards row stacks to a single column under 480px (`PreBattleInfoPanels.css`), same fix class as `StageRewardsRow`'s existing single-column stack under 420px.
- The 2-card Ship/Companion row stays 2 columns at every width — confirmed by hand-reasoning this holds down to 320px without cramping (2 columns, not 3).
- The Modules list is already a single column of full-width rows by design, so no stacking breakpoint was needed there.
- No headless browser is available in this sandbox (same disclosed limitation as every previous round) — verified by direct property-level reasoning against 412×915, 390×844, and 360×800, not a live render. The `npm run dev` + Chrome-extension path remains open for a real check.

## Remaining visual differences (known, not chased further)

- Module icons, XP badge, and the reward-preview credits/crystals amounts are the disclosed substitutions/new values listed above.
- Panels are coded approximations of the reference's proportions, not pixel-matched.
- Insufficient-Energy visual state exists in code but isn't reachable from the current default save without manually editing local storage.

## Type-check result

`tsc -b --noEmit`: clean, no errors.

## Build result

`vite build`: succeeds, 167 modules (up from Stage Detail's 151 — the 16 new files here).

## Regression confirmations

File mtimes checked against this round's actual start time (14:41–14:46:35 local) versus every other file in the project:

- `HomeScreen.tsx`/`.css`, `BattleHubScreen.tsx`/`.css`, `CampaignOverviewScreen.tsx`/`.css`, `CampaignChapterMapScreen.tsx`/`.css`, `CampaignStageDetailScreen.tsx`/`.css`: all unchanged, mtimes from prior rounds.
- `HubHeader.tsx`/`.css`, `HubScreenShell.tsx`/`.css`, `HubBottomNav.tsx`/`.css`: all unchanged.
- `GameplayScreen.tsx`, `data/campaign.ts`, `store/playerStore.tsx`: all unchanged.
- `PreBattlePlaceholderScreen.tsx`/`.css`: unchanged, only relocated via routing.
- Confirmed no `spendCurrency` call anywhere in the new Pre-Battle files (grep — only appears inside explanatory comments).
- Confirmed `CampaignStageDetailScreen.tsx`'s `Prepare` button still targets `pathFor("pre-battle-placeholder")` unedited.

---

Stopping here per your instruction. Not beginning real gameplay integration.
