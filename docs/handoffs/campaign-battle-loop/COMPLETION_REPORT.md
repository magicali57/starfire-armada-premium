# Campaign Battle Navigation Loop — Completion Report

Stabilizes the existing loop: Campaign → Stage Detail → Pre-Battle → Gameplay
→ Victory/Defeat → Results → Continue / Replay / Retry / Campaign. No real
gameplay engine was built; no reward/XP/economy/save values changed.

## What was actually broken

Two real, pre-existing gaps, found by inspection:

1. **Stage-id mismatch.** `CampaignStageDetailScreen`/`PreBattleScreen` only
   understood the prototype reference-map's disconnected ids
   (`campaignChapterMap.ts`, `"stage-1".."stage-10"`). The real campaign
   data (`data/campaign.ts`, `"ch1-stage-1".."ch1-stage-5"`) — the ids the
   battle-session/reward pipeline and `ResultsScreen`'s own `Continue`
   action already use — had no path through Stage Detail/Pre-Battle at all.
2. **Pre-Battle's Start never called the canonical session-start action** —
   it navigated to an unwired "Battle Launch" placeholder, so Energy was
   never validated/deducted and no session was ever created from that
   screen. `GameplayScreen` had no session guard at all (it read the
   player's mutable "current stage/ship" instead of the session, and a
   prior small fix made its debug buttons *self-start* a session — the
   opposite of what a stabilized loop needs).

## Changes

- **`src/data/campaign.ts`** — added `getStagesInChapter` and the one
  canonical `isStageAccessible(player, stageId)` gate (linear per-chapter
  progression via `highestClearedStageId`), reused everywhere instead of
  re-deriving it.
- **`CampaignStageDetailScreen.tsx` / `PreBattleScreen.tsx`** — resolve a
  real canonical stage (`getStageById`) first; fall back to the existing
  prototype map node, unchanged, for prototype-only ids. Real stages get
  `isStageAccessible` gating and the real `getBattleEnergyCost`. Both
  screens' content/route destinations are otherwise untouched (same
  presentational generators, same route ids).
- **`PreBattleScreen.tsx`** — Start now: validates the stage is real →
  validates accessibility → validates Energy (client-side quick check) →
  calls `startBattle({ stageId })` (the canonical
  `prepareBattleSession`→`startBattleSession` transition, which
  re-validates and deducts Energy exactly once) → navigates to Gameplay
  only on success. In-app `LockedContentModal` feedback for locked/unknown
  stage/insufficient-Energy/busy; no browser alerts; a local `isStarting`
  guard blocks double taps on top of the store's own guard. No Energy is
  ever spent in the component.
- **`GameplayScreen.tsx`** — now requires `battleSession?.status ===
  "active"`; a missing/invalid session redirects to Campaign (clearing any
  stale completed/results session via `resetBattle`, never creating one).
  Ship/stage identity is read from the session (`shipId`/`stageId`), not
  the player's mutable "current" pointers. Debug Win/Lose buttons are
  gated by `import.meta.env.DEV` and still only call the real
  `declareBattleVictory`/`declareBattleDefeat` → `completeBattle` →
  `enterBattleResults` pipeline — no manual reward grants, no bypassed
  completion rules. Removed the previous self-starting behavior (that was
  the opposite of "Gameplay never creates a session").
- **`CampaignScreen.tsx`** (the real-stage-id "legacy" list,
  `#/campaign/chapter-map/legacy`) — its Play/Continue buttons now route
  through Stage Detail (`?id=` convention) instead of jumping straight to
  Gameplay, so this screen also goes through Pre-Battle's validated start
  instead of bypassing it entirely.
- **`ResultsScreen.tsx`** — added an `overlayActive` guard (Level-Up or
  Reward Reveal open) to every action handler and to `BattleResultActions`'
  `busy` prop, so Continue/Replay/Retry/Campaign can never run while an
  overlay is on screen. Session cleanup (`resetBattle` on Continue/Campaign,
  fresh session via `retryBattle` on Replay/Retry) was already centralized
  from the prior task — unchanged.
- **`src/vite-env.d.ts`** (new) — the standard Vite ambient-types
  reference; needed for `import.meta.env.DEV` to type-check. No prior
  dev/prod flag existed in this project.

## Non-changes (explicitly out of scope)

Reward values, XP curve, economy, save schema/migrations, Player Profile,
Player Level-Up modal, Reward Reveal rules, Shop, Daily Rewards, Chest
Opening, and the real wave/enemy/boss/collision engine were not touched.
`data/campaignChapterMap.ts`/`campaignStageDetail.ts`/`preBattle.ts`'s
prototype reference content is unchanged; prototype-only stage ids keep
their prior (non-functional Start) behavior exactly as before.

## Focused verification

- `npx tsc -b --noEmit` — passes.
- `npm run build` — passes (Vite production build succeeds).
- **Production dead-code elimination**: grepped the built
  `dist/assets/*.js` for `"Win Stage"`/`"Lose Stage"` — absent, confirming
  the `import.meta.env.DEV`-gated debug controls are stripped from
  production, not merely hidden by CSS/runtime check.
- `scripts/verification/campaignBattleLoopVerification.ts` (new, run via
  the existing `ts-alias-hooks.mjs` Node loader) — **77 assertions,
  passing** — exercises the real `battleSession.ts`/`data/campaign.ts`
  pure functions for: stage accessibility (locked/unlocked/unknown),
  successful start + exact Energy deduction, double-start rejection,
  insufficient Energy, the exact "Gameplay requires active session"
  predicate, first-outcome-wins (both directions), exactly-once completion
  (duplicate victory returns the existing completion, applies nothing
  again), defeat grants nothing, victory/defeat → valid Results view vs.
  active/no-session → null view, Continue's real next-stage id +
  post-clear accessibility, Replay/Retry fresh session + Energy spend,
  first-clear-cannot-be-reclaimed + repeat-clear progression stability,
  reload-mid-battle grants nothing, reload-after-completion cannot
  duplicate rewards, and Campaign-return session cleanup.
- Static review (screens are `.tsx`/JSX, cannot load under the sandbox's
  plain Node runner — same disclosed limitation as every prior handoff):
  Stage Detail/Pre-Battle not-found and locked states; Pre-Battle's
  Start/loading/insufficient-Energy button states; Gameplay's
  session-guard redirect and DEV-only rendering; Results' overlay-blocks-
  actions guard; mobile layout at 412×915 / 390×844 / 360×800 — no new
  markup or CSS was introduced by this task (only button
  text/handlers/guards changed), so the previously-verified mobile-safe
  layouts for these screens are unaffected.

## Unresolved / disclosed limitations

- No difficulty selector or explicit loadout-validation gate exists in
  Pre-Battle yet — Start always uses `"normal"` difficulty and the
  player's already-owned `selectedShipId`. Both are future work if/when
  they become real player-facing choices.
- The prototype Chapter Map (`"stage-N"` ids) remains entirely disconnected
  from the real campaign data — browsing it still shows non-functional
  Start behavior for those ids, unchanged from before this task. The
  primary route from Home/Battle Hub still passes through this prototype
  carousel/map before ever reaching a real stage; reaching a real stage
  today happens via the "legacy" Campaign list, Continue, or Replay/Retry.
  Reconciling the prototype Chapter Map's content with real stage data was
  out of scope (a content/UI decision, not a navigation-loop stability
  bug) and was not attempted.
- Pause/resume battle-session actions exist in the store
  (`pauseBattle`/`resumeBattle`) but no Gameplay UI calls them yet —
  unchanged, disclosed, not part of this task's scope.
