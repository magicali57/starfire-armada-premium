# Battle Results Screen — Completion Report

## What was built

**Data contract** (`src/systems/battleSession.ts`) — `BattleResultsView` extended with four grouped, mutually-exclusive fields derived purely by filtering the completion's already-applied entries (`application.applied`) and existing `duplicateConversions` — no new reward/XP/progression math:

- `firstClearRewards` — applied entries with `source: "campaign-first-clear"` (collectibles and duplicate-converted entries excluded).
- `baseRewards` — applied entries with `source: "campaign-repeat" | "campaign-drop"` (same exclusions).
- `newCollectibles` — applied entries with `kind: "collectible"` (always genuinely new — `applyRewardBundle` already swaps a duplicate's `entry` to its converted material/fragment before pushing to `applied`).
- `duplicateConversions` — unchanged, still `application.duplicateConversions`.

A duplicate-converted entry is identified by **reference equality** with `duplicateConversions[i].converted` (the exact object `applyRewards.ts` already reuses in both places), so it is excluded from the generic groups and shown only once, in the Duplicate Conversions section.

**Reward icon resolution** (`src/data/rewardDisplay.ts`) — collectible entries now resolve real artwork (ship/companion/module/weapon registries, via each definition's own `artKey`) instead of a placeholder icon, since Results needs to show genuine "NEW" collectible art.

**Shared Results components** (`src/components/results/`) — visual redesign aligned to Batch 5 references:

- `BattleResultHero` — large gold VICTORY / red DEFEAT title with CSS wing accents, stage identity, ship art showcase, difficulty + First Clear badges; stars only when `performance.starsEarned` exists (never fabricates S grade / New Best).
- `BattlePerformanceSummary` — Mission/Battle Summary framed panels; only defined `BattlePerformance` fields; victory cyan vs defeat red stat cards.
- `BattleRewardSummary` — framed Rewards panel with rarity-aware reward **cards**, First Clear badges, XP progression bar; omits Level-Up reward list duplication (modal owns that).
- `BattleResultActions` — gold Next Stage/Continue primary; Replay + Campaign secondary; defeat Retry (Energy) primary + Change Loadout + Campaign.

**`ResultsScreen.tsx`** — orchestrates the above with chapter backdrop mood (`CHAPTER_BACKGROUND_IMAGE` / `HOME_SCENE.background` + CSS overlays). Continue → Stage Detail without Energy; Replay/Retry → `retryBattle`; Campaign → `resetBattle` + campaign. Modal order Level-Up → Reward Reveal → Results unchanged.

**`GameplayScreen.tsx`** — transitional `victory|defeat|completing|completed|results` statuses no longer trigger the stale-session redirect/`resetBattle` (so Results can mount after Win/Lose).

**`AppShell.css`** — mobile frame bounded to `100dvh` so Results content scrolls above the bottom nav.

## Visual references used

- `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_5_Gameplay_and_Results/47_Victory_Results.png`
- `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_5_Gameplay_and_Results/48_Defeat_Results.png`

## Visual comparison

### Before
Sparse dark panels, smaller title treatment, list-like rewards, weak action hierarchy, flat backgrounds, no wing accents.

### Changes made
Gold/red hero titles + CSS wings; nebula backdrop mood from existing chapter/home art; framed Mission/Rewards sections; rarity card grid; gold Next Stage / red Retry; denser mobile spacing; restrained motion (title glow/pulse, card stagger, XP fill).

### Intentional deviations (canonical / unsupported)
- No fabricated S grade, “New Best”, boss name, or fake objectives.
- Performance summary omitted when `session.performance` is empty (placeholder engine).
- Defeat shows “No completion rewards” — never the reference’s fake defeat loot.
- Next Stage only when `availableActions` includes `continue` (first-clear unlock path).
- Level-Up detailed rewards stay in `PlayerLevelUpModal`, not duplicated on Results cards.

### Screenshots
- `docs/handoffs/battle-results/screenshots/victory-412x915.png`
- `docs/handoffs/battle-results/screenshots/victory-360x800.png`
- `docs/handoffs/battle-results/screenshots/defeat-412x915.png`
- `docs/handoffs/battle-results/screenshots/defeat-360x800.png`

## What was not changed

Reward resolution/application, Player XP/level math, campaign progression, Energy-spend logic, save schema/migrations, `battleSession` state machine, Level-Up modal content, Reward Reveal eligibility.

## Verification

- `npx tsc -b --noEmit` — passes.
- `npm run build` — succeeds; production bundle has **0** matches for “Win Stage” / “Lose Stage”.
- `scripts/verification/battleResultsVerification.ts` — **83 assertions** passed.
- Live capture via DEV Win/Lose at 412×915 and 360×800 (see screenshot paths above).
