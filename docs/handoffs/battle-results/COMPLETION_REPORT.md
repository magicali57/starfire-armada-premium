# Battle Results Screen — Completion Report

## What was built

**Data contract** (`src/systems/battleSession.ts`) — `BattleResultsView` extended with four grouped, mutually-exclusive fields derived purely by filtering the completion's already-applied entries (`application.applied`) and existing `duplicateConversions` — no new reward/XP/progression math:

- `firstClearRewards` — applied entries with `source: "campaign-first-clear"` (collectibles and duplicate-converted entries excluded).
- `baseRewards` — applied entries with `source: "campaign-repeat" | "campaign-drop"` (same exclusions).
- `newCollectibles` — applied entries with `kind: "collectible"` (always genuinely new — `applyRewardBundle` already swaps a duplicate's `entry` to its converted material/fragment before pushing to `applied`).
- `duplicateConversions` — unchanged, still `application.duplicateConversions`.

A duplicate-converted entry is identified by **reference equality** with `duplicateConversions[i].converted` (the exact object `applyRewards.ts` already reuses in both places), so it is excluded from the generic groups and shown only once, in the Duplicate Conversions section.

**Reward icon resolution** (`src/data/rewardDisplay.ts`) — collectible entries now resolve real artwork (ship/companion/module/weapon registries, via each definition's own `artKey`) instead of a placeholder icon, since Results needs to show genuine "NEW" collectible art.

**New components** (`src/components/results/`):
- `BattleResultHero` — VICTORY (cyan/gold, restrained glow) / DEFEAT (red/purple, restrained pulse) hero with stage name, difficulty, first-clear badge, stars (only when `performance.starsEarned` exists).
- `BattlePerformanceSummary` — renders only the `BattlePerformance` fields that are actually defined; omits every unsupported field, never fabricates a zero.
- `BattleRewardSummary` — Player XP/Level-transition headline, then First-Clear / Battle / Player-Level reward groups (each aggregated via the existing `rewardDisplay.ts` helper), New collectibles (`CardCornerBadge` "New" tag + real art), Duplicate Conversions.
- `BattleResultActions` — renders only the buttons `availableActions` actually offers (Continue/Replay/Campaign on victory, Retry/Campaign on defeat), disabled while a new session is starting.

**`ResultsScreen.tsx`** — rewritten to orchestrate the above. Continue clears temp state and navigates to Stage Detail (`?id=<nextStageId>`, same convention Pre-Battle/Stage Detail already use) — no Energy spent. Replay/Retry both call the existing `retryBattle` store action (fresh sessionId, same stage/difficulty, Energy validated + spent exactly once, then navigates to `gameplay`); a local `isStartingSession` guard plus the store's own in-flight guard prevent double-taps; `insufficient-energy` shows an `InlineAlert` (no browser dialogs) and creates/spends nothing. Campaign clears temp state and returns, preserving all permanent progress. `PlayerLevelUpModal` integration preserved unchanged (same once-per-session `sessionId` marker pattern). Missing/invalid session still redirects to Campaign via the existing effect.

## What was not changed

Reward resolution/application, Player XP/level math, campaign progression, Energy-spend logic, save schema/migrations, `battleSession.ts`'s state machine, `PlayerLevelUpModal`'s own content/behavior, and gameplay-engine wiring (Pre-Battle's Start button still intentionally does not call `startBattle` — real launch integration is disclosed future work, unchanged by this task).

## Verification

- `npx tsc -b --noEmit` — passes.
- `npm run build` — succeeds.
- `scripts/verification/battleResultsVerification.ts` (run via the existing `ts-alias-hooks.mjs` Node loader) — **83 assertions passed**, covering: valid Victory/Defeat, first-clear vs. repeat-clear grouping (mutually exclusive, never duplicated), reward aggregation within a group, unopened-chest display, duplicate-collectible-conversion + new-collectible grouping (built from a real `applyRewardBundle` result fed through the real `getBattleResultsView`), Replay/Retry fresh-session + single-Energy-spend, insufficient-Energy rejection (no mutation), Campaign return / missing-session / non-completed-session → null view, and read-twice idempotency (no mutation on rerender).
- Disclosed limitation (same as prior handoffs): the four new components and `ResultsScreen.tsx` are `.tsx`/JSX and cannot load under this sandbox's plain `node --experimental-strip-types` runner — verified by static code review instead.
- Static mobile CSS review at 412×915 / 390×844 / 360×800: all new component CSS uses `box-sizing: border-box`, `min-width: 0` + `overflow-wrap: anywhere` on text/name cells, responsive grids (performance stats 2→1 columns, collectible grid 3→2 columns at ≤360px), and `flex-wrap` on hero badges — no fixed pixel widths beyond icon sizes. Results keeps the shared bottom nav (unchanged), which already reserves `padding-bottom` for it, so content is never hidden behind the footer. `PlayerLevelUpModal` unchanged and still fits.

## Unresolved / disclosed

- No real campaign stage currently rolls a `collectible` drop, so duplicate-conversion/new-collectible display is exercised only via the fixture in step 6 of the verification script (and static review) — genuinely correct, just not yet reachable through real gameplay data.
- `BattlePerformance` is never populated by the current placeholder gameplay canvas, so `BattlePerformanceSummary` currently renders nothing in the live app (correct behavior — no unsupported stat is fabricated) until a real engine starts passing performance data.
