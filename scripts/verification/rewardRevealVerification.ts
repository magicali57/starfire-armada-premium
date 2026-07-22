import assert from "node:assert/strict";
import { DEFAULT_PLAYER_STATE } from "../../src/data/player";
import { SHIPS } from "../../src/data/ships";
import { COMPANIONS } from "../../src/data/companions";
import { MODULES } from "../../src/data/modules";
import { WEAPONS } from "../../src/data/weapons";
import type { BattleCompletionSummary, BattleSession, PlayerState, ResolvedReward } from "../../src/types";
import { applyRewardBundle } from "../../src/systems/rewards/applyRewards";
import { createFixedRandomSource } from "../../src/systems/rewards/randomSource";
import {
  completeBattleSession,
  declareBattleOutcome,
  generateBattleSessionId,
  getBattleResultsView,
  prepareBattleSession,
  startBattleSession,
  type BattleSessionCompletion,
} from "../../src/systems/battleSession";
import { getRewardRevealQueue, type RewardRevealItem } from "../../src/data/rewardReveal";

// Focused verification for the Reward Reveal overlay's DATA CONTRACT.
// Exercises the real canonical systems (battleSession.ts, applyRewardBundle,
// getRewardRevealQueue, rewardDisplay.ts) — nothing here reimplements
// reward/duplicate/collectible logic. RewardRevealOverlay.tsx / the
// ResultsScreen integration are .tsx/JSX and cannot load under this
// sandbox's plain `node --experimental-strip-types` runner (same disclosed
// limitation as every prior handoff's UI-component verification); those
// were verified by static code review instead — see COMPLETION_REPORT.md.

let assertions = 0;
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}
const clonePlayer = (): PlayerState => structuredClone(DEFAULT_PLAYER_STATE);

function requirePreparedSession(player: PlayerState, stageId: string) {
  const prepared = prepareBattleSession(null, {
    stageId,
    shipId: player.selectedShipId,
    sessionId: generateBattleSessionId(),
  });
  assert.ok(prepared.ok && prepared.session, "session prepares for a real campaign stage");
  return prepared.session!;
}

function runBattle(player: PlayerState, stageId: string, outcome: "victory" | "defeat") {
  const session = requirePreparedSession(player, stageId);
  const started = startBattleSession(player, session);
  check(started.result.ok, `session starts for ${stageId}`);
  const declared = declareBattleOutcome(started.result.session, outcome);
  check(declared.ok, `${outcome} declared for ${stageId}`);
  const completed = completeBattleSession(
    started.player,
    declared.session,
    session.sessionId,
    createFixedRandomSource([0.9, 0.9, 0.9, 0.9, 0.9]),
  );
  check(completed.result.ok, `${stageId} completion succeeds`);
  const view = getBattleResultsView(completed.result.session);
  check(view !== null, "results view available after completion");
  return { player: completed.player, view: view! };
}

/** Builds a fully-formed, manually-assembled completed BattleSession
 *  fixture around a REAL applyRewardBundle result — the same technique the
 *  Battle Results handoff used to test duplicate-conversion grouping.
 *  getRewardRevealQueue/getBattleResultsView are the real functions under
 *  test; only the session/completion "envelope" around them is a fixture. */
function fixtureSession(applicationResult: ReturnType<typeof applyRewardBundle>["result"]): BattleSession {
  const summary: BattleCompletionSummary = {
    stageId: "ch1-stage-1",
    victory: true,
    firstClear: false,
    bundle: { stageId: "ch1-stage-1", source: "campaign-drop", firstClear: false, rewards: [] },
    application: applicationResult,
    stageMarkedCleared: false,
  };
  const completion: BattleSessionCompletion = {
    sessionId: "fixture-session",
    stageId: "ch1-stage-1",
    difficulty: "normal",
    outcome: "victory",
    summary,
    previousHighestClearedStageId: null,
    newHighestClearedStageId: "ch1-stage-1",
    previousPlayerXp: 0,
    newPlayerXp: 0,
    previousPlayerLevel: 1,
    newPlayerLevel: 1,
    playerLevelsGained: 0,
    unlocksEarned: [],
    nextStageId: null,
  };
  return {
    sessionId: "fixture-session",
    stageId: "ch1-stage-1",
    difficulty: "normal",
    shipId: DEFAULT_PLAYER_STATE.selectedShipId,
    status: "results",
    startedAt: Date.now(),
    outcome: "victory",
    performance: null,
    completion,
    energySpent: true,
  };
}

// ---------------------------------------------------------------------------
// 1. No eligible rewards -> empty queue (typical repeat-clear grants only
//    Credits/XP/common material — nothing special enough to reveal).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const first = runBattle(player, "ch1-stage-1", "victory");
  const repeat = runBattle(first.player, "ch1-stage-1", "victory");
  const queue = getRewardRevealQueue(repeat.view);
  equal(queue.length, 0, "an ordinary repeat-clear (Credits/XP/common material only) has no eligible reveal items");
}

// ---------------------------------------------------------------------------
// 2. Defeat never produces a queue.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const { view } = runBattle(player, "ch1-stage-1", "defeat");
  equal(getRewardRevealQueue(view).length, 0, "defeat never produces a reveal queue");
}

// ---------------------------------------------------------------------------
// 3-6. New ship / companion / module / weapon reveal — built from a REAL
//      applyRewardBundle collectible grant (the exact same function real
//      stage rewards would use, if a stage ever drops a collectible).
// ---------------------------------------------------------------------------
function testNewCollectibleReveal(
  kind: "ship" | "companion" | "module" | "weapon",
  newId: string,
) {
  const player = clonePlayer();
  if (kind === "ship") player.ownedShipIds = player.ownedShipIds.filter((id) => id !== newId);
  if (kind === "companion") player.ownedCompanionIds = player.ownedCompanionIds.filter((id) => id !== newId);
  if (kind === "module") player.ownedModuleIds = player.ownedModuleIds.filter((id) => id !== newId);
  if (kind === "weapon") player.ownedWeaponIds = player.ownedWeaponIds.filter((id) => id !== newId);

  const applied = applyRewardBundle(player, [
    { entry: { kind: "collectible", collectibleType: kind, collectibleId: newId }, source: "campaign-drop", rarity: "rare" },
  ]);
  check(applied.result.success, `${kind} collectible bundle applies`);
  const view = getBattleResultsView(fixtureSession(applied.result));
  check(view !== null, `results view available for the new-${kind} fixture`);
  const queue = getRewardRevealQueue(view!);
  equal(queue.length, 1, `exactly one reveal item for the new ${kind}`);
  const item = queue[0]!;
  equal(item.kind, "collectible", `${kind} reveal item kind is collectible`);
  equal(item.isNew, true, `${kind} reveal item is marked new`);
  equal(item.rewardId, newId, `${kind} reveal item references the correct id`);
  check(item.displayName.length > 0, `${kind} reveal item has a resolved display name`);
  check(!!item.imageSrc && item.imageSrc.length > 0, `${kind} reveal item has resolved artwork`);
}

testNewCollectibleReveal("ship", SHIPS.find((s) => s.id !== DEFAULT_PLAYER_STATE.selectedShipId)!.id);
testNewCollectibleReveal("companion", COMPANIONS[0]!.id);
testNewCollectibleReveal("module", MODULES[0]!.id);
testNewCollectibleReveal("weapon", WEAPONS.find((w) => !DEFAULT_PLAYER_STATE.ownedWeaponIds.includes(w.id))!.id);

// ---------------------------------------------------------------------------
// 7-9. Rare Chest revealed, Epic Chest revealed, Basic Chest omitted.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const applied = applyRewardBundle(player, [
    { entry: { kind: "chest", chestId: "chestRare", amount: 1 }, source: "campaign-first-clear", rarity: "common" },
    { entry: { kind: "chest", chestId: "chestEpic", amount: 1 }, source: "campaign-first-clear", rarity: "common" },
    { entry: { kind: "chest", chestId: "chestBasic", amount: 1 }, source: "campaign-first-clear", rarity: "common" },
  ]);
  check(applied.result.success, "chest bundle applies");
  const view = getBattleResultsView(fixtureSession(applied.result));
  const queue = getRewardRevealQueue(view!);
  const chestItems = queue.filter((item) => item.kind === "chest");
  equal(chestItems.length, 2, "exactly Rare + Epic chests are revealed — Basic Chest omitted");
  check(chestItems.some((item) => item.rewardId === "chestRare"), "Rare Chest present in the reveal queue");
  check(chestItems.some((item) => item.rewardId === "chestEpic"), "Epic Chest present in the reveal queue");
  check(!chestItems.some((item) => item.rewardId === "chestBasic"), "Basic Chest never present in the reveal queue");
  check(chestItems.every((item) => item.subtitle === "Unopened Chest"), "chest reveal items are labeled unopened, never resolved");
}

// ---------------------------------------------------------------------------
// 10. Credits / Player XP / common materials never revealed, even when
//     they appear in the same completion as an eligible item.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const newShipId = SHIPS.find((s) => s.id !== DEFAULT_PLAYER_STATE.selectedShipId)!.id;
  player.ownedShipIds = player.ownedShipIds.filter((id) => id !== newShipId);
  const applied = applyRewardBundle(player, [
    { entry: { kind: "currency", currencyId: "coins", amount: 500 }, source: "campaign-first-clear", rarity: "common" },
    { entry: { kind: "playerXp", amount: 200 }, source: "campaign-first-clear", rarity: "common" },
    { entry: { kind: "material", materialId: "shipAlloy", amount: 40 }, source: "campaign-first-clear", rarity: "common" },
    { entry: { kind: "chest", chestId: "chestRare", amount: 1 }, source: "campaign-first-clear", rarity: "epic" },
    { entry: { kind: "collectible", collectibleType: "ship", collectibleId: newShipId }, source: "campaign-drop", rarity: "rare" },
  ]);
  check(applied.result.success, "mixed bundle applies");
  const view = getBattleResultsView(fixtureSession(applied.result));
  const queue = getRewardRevealQueue(view!);
  equal(queue.length, 2, "only the new ship and the Rare Chest are eligible — Credits/XP/common material never revealed");
  check(!queue.some((item) => item.rewardId === "coins"), "Credits never revealed");
  check(!queue.some((item) => item.rewardId === "playerXp"), "Player XP never revealed");
  check(!queue.some((item) => item.rewardId === "shipAlloy"), "common material never revealed");
}

// ---------------------------------------------------------------------------
// 11. Duplicate conversions are never revealed as NEW — they still appear
//     on Results as a conversion, not in the Reward Reveal queue.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const ownedShipId = player.ownedShipIds[0]; // duplicate
  const applied = applyRewardBundle(player, [
    { entry: { kind: "collectible", collectibleType: "ship", collectibleId: ownedShipId }, source: "campaign-drop", rarity: "rare" },
  ]);
  check(applied.result.success, "duplicate-only bundle applies");
  equal(applied.result.duplicateConversions.length, 1, "one duplicate conversion recorded");
  const view = getBattleResultsView(fixtureSession(applied.result));
  const queue = getRewardRevealQueue(view!);
  equal(queue.length, 0, "a duplicate conversion alone never produces a reveal item");
  check(view!.duplicateConversions.length === 1, "the duplicate conversion still surfaces on the Results view itself");
}

// ---------------------------------------------------------------------------
// 12. Multiple-item queue order: collectibles first, then chests, then
//     other rare items — matching the documented reveal priority.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const newShipId = SHIPS.find((s) => s.id !== DEFAULT_PLAYER_STATE.selectedShipId)!.id;
  player.ownedShipIds = player.ownedShipIds.filter((id) => id !== newShipId);
  const applied = applyRewardBundle(player, [
    // Intentionally reversed input order — chest and rare-item entries
    // appear BEFORE the collectible in the source array, so a correct
    // ordering has to be intentional, not accidental array order.
    { entry: { kind: "chest", chestId: "chestEpic", amount: 1 }, source: "campaign-first-clear", rarity: "common" },
    { entry: { kind: "material", materialId: "universalShards", amount: 5 }, source: "campaign-drop", rarity: "legendary" },
    { entry: { kind: "collectible", collectibleType: "ship", collectibleId: newShipId }, source: "campaign-drop", rarity: "rare" },
  ]);
  check(applied.result.success, "ordering-fixture bundle applies");
  const view = getBattleResultsView(fixtureSession(applied.result));
  const queue = getRewardRevealQueue(view!);
  equal(queue.length, 3, "all three eligible items present");
  deepEqualKinds(
    queue.map((item) => item.kind),
    ["collectible", "chest", "rare-item"],
    "reveal order is always collectible -> chest -> rare-item, regardless of the completion's internal array order",
  );
}

// ---------------------------------------------------------------------------
// 13. NEXT / final-close behavior — pure index arithmetic the overlay
//     component uses (isLast/buttonLabel logic reproduced here at the data
//     level only; the component itself is verified by static review).
// ---------------------------------------------------------------------------
{
  const items: RewardRevealItem[] = [
    { key: "a", rewardId: "a", kind: "collectible", displayName: "A", quantity: 1, isNew: true },
    { key: "b", rewardId: "b", kind: "chest", displayName: "B", quantity: 1, isNew: false },
    { key: "c", rewardId: "c", kind: "rare-item", displayName: "C", quantity: 1, isNew: false },
  ];
  const isLast = (index: number) => index >= items.length - 1;
  equal(isLast(0), false, "index 0 of 3 is not the last item");
  equal(isLast(1), false, "index 1 of 3 is not the last item");
  equal(isLast(2), true, "index 2 of 3 (final) is the last item");
  const buttonLabel = (index: number) => (items.length === 1 ? "Continue" : isLast(index) ? "Done" : "Next");
  equal(buttonLabel(0), "Next", "non-final item shows Next");
  equal(buttonLabel(2), "Done", "final item shows Done, never Claim/Grant wording");
  const singleItemLabel = ([items[0]!].length === 1 ? "Continue" : "Next");
  equal(singleItemLabel, "Continue", "a single-item queue shows Continue");
}

// ---------------------------------------------------------------------------
// 14-17. Modal ordering + once-per-session markers — the exact boolean
//        formulas ResultsScreen.tsx derives (reproduced here at the data
//        level to verify the LOGIC; the JSX wiring itself is static-
//        reviewed, see COMPLETION_REPORT.md).
// ---------------------------------------------------------------------------
function deriveOverlayVisibility(
  hasLevelUpToShow: boolean,
  levelUpConsumedSessionId: string | null,
  queueLength: number,
  rewardRevealConsumedSessionId: string | null,
  sessionId: string,
) {
  const showLevelUpModal = hasLevelUpToShow && levelUpConsumedSessionId !== sessionId;
  const showRewardReveal = !showLevelUpModal && queueLength > 0 && rewardRevealConsumedSessionId !== sessionId;
  return { showLevelUpModal, showRewardReveal };
}

{
  // Both exist: Level-Up first, Reward Reveal blocked until Level-Up closes.
  let visibility = deriveOverlayVisibility(true, null, 2, null, "s1");
  equal(visibility.showLevelUpModal, true, "Level-Up shows first when both are eligible");
  equal(visibility.showRewardReveal, false, "Reward Reveal stays hidden while Level-Up is still open");

  // Level-Up closes (marker set) -> Reward Reveal opens.
  visibility = deriveOverlayVisibility(true, "s1", 2, null, "s1");
  equal(visibility.showLevelUpModal, false, "Level-Up no longer shows once consumed for this session");
  equal(visibility.showRewardReveal, true, "closing Level-Up opens Reward Reveal");

  // No Level-Up at all -> Reward Reveal opens directly.
  visibility = deriveOverlayVisibility(false, null, 2, null, "s2");
  equal(visibility.showLevelUpModal, false, "no Level-Up eligible");
  equal(visibility.showRewardReveal, true, "Reward Reveal opens directly when there is no Level-Up to show");

  // Reward Reveal closes -> neither shows again for this session (once
  // per completed session).
  visibility = deriveOverlayVisibility(false, null, 2, "s2", "s2");
  equal(visibility.showRewardReveal, false, "Reward Reveal never reopens once consumed for this session");

  // Ordinary rerender with the SAME session and SAME markers: identical
  // result every time (never flips back open).
  const rerender = deriveOverlayVisibility(false, null, 2, "s2", "s2");
  equal(rerender.showRewardReveal, false, "an ordinary rerender with unchanged markers never reopens Reward Reveal");

  // A genuinely new session (Replay/Retry) gets a fresh sessionId, so the
  // old markers no longer match — both overlays are eligible again for
  // THEIR OWN new session.
  visibility = deriveOverlayVisibility(false, null, 2, "s2", "s3");
  equal(visibility.showRewardReveal, true, "a fresh session (new sessionId) can show its own Reward Reveal again");
}

// ---------------------------------------------------------------------------
// 18. Missing/broken artwork never crashes the queue-building step —
//     resolveIcon/resolveCollectibleIcon (rewardDisplay.ts) already
//     guarantee a non-empty fallback icon for every entry kind.
// ---------------------------------------------------------------------------
{
  const bogusReward: ResolvedReward = {
    entry: { kind: "collectible", collectibleType: "ship", collectibleId: "not-a-real-ship-id" },
    source: "campaign-drop",
    rarity: "rare",
  };
  const view = getBattleResultsView(
    fixtureSession({ success: true, applied: [bogusReward], duplicateConversions: [], playerLevelsGained: 0 }),
  );
  const queue = getRewardRevealQueue(view!);
  equal(queue.length, 1, "an unresolvable collectible id still produces exactly one reveal item, never a crash");
  check(!!queue[0]!.imageSrc && queue[0]!.imageSrc!.length > 0, "unresolvable artwork still resolves to the safe fallback icon");
  equal(queue[0]!.displayName, "not-a-real-ship-id", "unresolvable name falls back to the raw id, never throws");
}

// ---------------------------------------------------------------------------
// 19. Continue/Replay/Campaign actions remain untouched by Reward Reveal —
//     availableActions comes from getBattleResultsView, completely
//     independent of getRewardRevealQueue.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const { view } = runBattle(player, "ch1-stage-1", "victory");
  getRewardRevealQueue(view); // reading the queue must not mutate the view
  check(view.availableActions.includes("return-to-campaign"), "Campaign action still offered after reading the reveal queue");
  check(
    view.availableActions.includes("continue") || view.availableActions.includes("replay"),
    "Continue/Replay still offered after reading the reveal queue",
  );
}

console.log(`Reward Reveal verification passed: ${assertions} assertions.`);

function deepEqualKinds(actual: unknown, expected: unknown, message: string) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
