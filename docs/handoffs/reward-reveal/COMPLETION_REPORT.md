# Reward Reveal Overlay — Completion Report

## What was built

**`src/data/rewardReveal.ts`** — `getRewardRevealQueue(view: BattleResultsView): RewardRevealItem[]`, the one canonical presentation helper. Built purely from `BattleResultsView`'s already-applied entries (`newCollectibles`, `firstClearRewards`, `baseRewards`, `levelUpRewards`) — never grants/resolves/opens/converts anything. Reveal eligibility, in queue order:

1. `newCollectibles` (always genuinely new — duplicates are already excluded upstream by `getBattleResultsView`).
2. Chest entries with `chestId` in `{chestRare, chestEpic}` (Basic Chest never eligible).
3. Any remaining non-chest entry whose `ResolvedReward.rarity` is `"epic"` or `"legendary"`.

Credits/XP/Energy/common materials/ordinary fragments/duplicate conversions are never eligible under this rule (their rarity is never epic/legendary, and duplicates never appear in the generic groups). Every item is built via `toRewardDisplayRows` (the existing `rewardDisplay.ts` helper) — no second reward catalog, no hard-coded stage/reward ids. Collectible items additionally surface the item's own canonical rarity (ship/companion/module/weapon `rarity` field) for the glow treatment.

**`src/components/reward-reveal/RewardRevealOverlay.tsx` + `.css`** — reusable, presentation-only overlay (`isOpen`, `items`, `currentIndex`, `onNext`, `onClose`). Single item → "Continue"; multi-item → `n / total` counter, "Next" until the last item, "Done" on the last. Wording never implies granting. Rarity-tinted glow border, NEW badge for collectibles, missing-artwork `onError` fallback to `UTILITY_ICON.emptySlot`.

**`ResultsScreen.tsx`** — added `rewardRevealConsumedSessionId` + `rewardRevealIndex` state (in-memory only, reset per `sessionId`, mirroring the existing Level-Up marker pattern). Visibility: `showLevelUpModal = hasLevelUpToShow && levelUpConsumedSessionId !== sessionId`; `showRewardReveal = !showLevelUpModal && queue.length > 0 && rewardRevealConsumedSessionId !== sessionId`. This guarantees Level-Up always appears first when both exist, Reward Reveal opens automatically once Level-Up closes (or directly when there's no Level-Up), each overlay opens at most once per session, and an ordinary rerender never reopens either. Reward Reveal's own `onClose` (Done, Escape, backdrop, ✕) always fully dismisses it — never blocks navigation. `BattleRewardSummary` is unchanged, so revealed rewards still appear normally on Results afterward.

## What was not changed

Reward resolution/application, stage rewards, XP, campaign completion, Energy spend, save schema/migrations, `battleSession.ts`'s state machine, Chest Opening/Shop/Daily Rewards, and gameplay-engine wiring.

## Verification

- `npx tsc -b --noEmit` — passes.
- `npm run build` — succeeds.
- `scripts/verification/rewardRevealVerification.ts` — **88 assertions passed**: empty queue on an ordinary repeat clear, defeat never queues, new ship/companion/module/weapon reveal (built from real `applyRewardBundle` collectible grants), Rare + Epic chest reveal with Basic Chest omitted, Credits/XP/common-material omission, duplicate-conversion omission, collectible→chest→rare-item queue ordering (from a deliberately reversed input array), Next/Done label logic, Level-Up-before-Reward-Reveal ordering (including "no Level-Up opens Reward Reveal directly" and "fresh session re-eligible"), once-per-session + rerender-safe markers, missing-artwork fallback, and Continue/Replay/Campaign unaffected.
- Disclosed limitation (same as every prior handoff): `RewardRevealOverlay.tsx` and the `ResultsScreen.tsx` JSX wiring cannot load under this sandbox's Node runner — verified by static code review instead.
- Static mobile CSS review at 412×915 / 390×844 / 360×800: `box-sizing: border-box`, `overflow-wrap: anywhere` on names, artwork sized via `min(180px, 60vw)` (down to `min(140px, 55vw)` at ≤360px) so it always stays inside the viewport, internal `max-height: 70dvh; overflow-y: auto` scroll, and the action button is the last element in normal flow inside the scrollable panel (always reachable, no footer overlap since `ModalLayer` already centers/contains its own panel).

## Unresolved / disclosed

Real campaign stage data currently never drops a collectible or an Epic/Legendary-rarity item directly (only chestRare/chestBasic drops exist), so those two reveal paths are exercised via constructed `applyRewardBundle` fixtures (real function, fixture input) rather than live gameplay — correct behavior, just not yet reachable through real stage data. Also fixed one small pre-existing, disclosed issue from an earlier demo request: `GameplayScreen`'s debug buttons previously never started a session (dead button); now self-start one via the canonical `startBattle` action before declaring victory/defeat (see separate commit `07bdc74`, not part of this feature).
