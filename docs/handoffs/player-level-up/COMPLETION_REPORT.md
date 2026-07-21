# Player Level-Up Modal — Completion Report

## Status

Implemented and integrated into the existing battle Results flow. No new save-schema version; the modal is informational-only and grants nothing.

## What was built

- `src/data/rewardDisplay.ts` — canonical reward-row presentation helper (new). Converts `ResolvedReward[]` into display rows (canonical item id, display name, quantity, icon, rarity) and aggregates stackable entries (Credits/materials/chests/etc. sharing an id) while keeping collectible grants distinct. Reuses `assetRegistry.ts` icons and `playerProfile.ts` label maps — no hard-coded labels.
- `src/components/level-up/PlayerLevelUpModal.tsx` + `.css` (new) — reusable, presentation-only modal (`isOpen`, `previousLevel`, `newLevel`, `levelsGained`, `rewards`, `unlocks`, `reachedMaxLevel`, `onClose`). Built on the existing `ModalLayer`/`PrimaryButton`. Shows: LEVEL UP heading, `LEVEL {prev} → LEVEL {new}`, `{n} LEVELS GAINED` when >1, aggregated milestone rewards, newly unlocked features, `MAX LEVEL REACHED`, and one CONTINUE action. Empty reward/unlock sections are omitted, never padded. Restrained fade/scale entrance, level-number emphasis, and staggered reward-row reveal — all plain CSS keyframes, respecting the project's existing global `prefers-reduced-motion` rule (no new media query needed).
- `src/systems/battleSession.ts` — `BattleResultsView` gained one additive field, `levelUpRewards: ResolvedReward[]`, populated in `getBattleResultsView` by filtering the completion's already-applied rewards (`application.applied`) to `source === "level-up"`. Nothing is recomputed or re-applied; this is a read-only view of a transaction that already ran.
- `src/screens/results/ResultsScreen.tsx` — opens `PlayerLevelUpModal` when `view.outcome === "victory" && view.playerLevelsGained > 0`. Gated by local component state (`levelUpConsumedSessionId`), an in-memory marker only — never written to `PlayerState` or the save file, no schema bump. Closing the modal just records the current `sessionId` as consumed and reveals the normal Results screen underneath; Continue/Replay/Return-to-Campaign are untouched (same handlers as before).
- `src/data/playerProfile.ts` — exported its existing `CURRENCY_LABEL`/`MATERIAL_LABEL`/`CHEST_LABEL`/`CONSUMABLE_LABEL` maps (previously module-private) so `rewardDisplay.ts` reuses them instead of duplicating label text.

## Not changed

XP curve, stage reward definitions, `applyRewardBundle`/`applyPlayerXp`, `completeCampaignStage`, Player Profile, Shop/Daily Rewards/Chest Opening (still unbuilt), or any gameplay/battle logic. The full Results screen redesign was explicitly out of scope and was not touched beyond adding the modal.

## Trigger source

Real progression transaction only: `getBattleResultsView(battleSession).playerLevelsGained`, itself sourced from `BattleSessionCompletion` produced by `completeBattleSession` → `applyCompleteCampaignStage` → `applyRewardBundle`. The Profile screen's own level display is untouched and never triggers this modal.

## Verification

- `npx tsc -b --noEmit` — clean.
- `npm run build` — succeeds (one pre-existing chunk-size advisory warning, unrelated).
- `scripts/verification/playerLevelUpVerification.ts` (run via the existing `ts-alias-hooks.mjs` Node loader) — 47 assertions, all passing. Covers: zero/one/multiple levels gained, milestone-reward aggregation (duplicate Credits rows across 3 crossed levels collapse into one, amounts sum correctly), unlock-crossing contract (real Daily Rewards milestone), MAX LEVEL clamping/no-XP-overflow, defeat never satisfying the open condition, victory-with-zero-levels omitting rewards, and Continue/Replay/Return actions remaining available.
- **Disclosed limitation** (same as the Player Profile handoff): `PlayerLevelUpModal.tsx` and the `ResultsScreen.tsx` once-per-session gating are `.tsx`/JSX and cannot load under this sandbox's plain `node --experimental-strip-types` runner. Those two pieces (modal rendering itself, and the `levelUpConsumedSessionId` state gate) were verified by static code review rather than an automated script; everything they depend on (`getBattleResultsView`, `rewardDisplay.ts`, `applyRewardBundle`) is covered above.
- Static mobile CSS review at 412×915, 390×844, 360×800: modal panel reuses `ModalLayer`'s existing `max-height: 80dvh; overflow-y: auto`; the reward/unlock list additionally caps at `60dvh` with its own scroll; the CONTINUE button is `position: sticky; bottom: 0` against the panel's scroll container so it stays reachable regardless of reward-list length; level numbers use `clamp()` sizing (smaller step below 360px) to avoid overflow; reward rows use `min-width: 0` + `overflow-wrap: anywhere` for safe wrapping of long names; no fixed desktop-width elements were introduced.
