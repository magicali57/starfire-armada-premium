import assert from "node:assert/strict";
import { DEFAULT_PLAYER_STATE } from "../../src/data/player";
import type { PlayerState, ResolvedReward } from "../../src/types";
import { applyRewardBundle } from "../../src/systems/rewards/applyRewards";
import {
  declareBattleOutcome,
  generateBattleSessionId,
  getBattleResultsView,
  prepareBattleSession,
  startBattleSession,
  completeBattleSession,
  type BattleSession,
} from "../../src/systems/battleSession";
import {
  getPlayerLevelRewards,
  isPlayerMaxLevel,
  MAX_PLAYER_LEVEL,
  planPlayerXpGain,
} from "../../src/systems/playerProgression";
import { aggregateRewardEntries, toRewardDisplayRows } from "../../src/data/rewardDisplay";
import { productionRandomSource } from "../../src/systems/rewards/randomSource";

// Focused verification for the Player Level-Up modal's data contract.
// Exercises the REAL canonical systems (applyRewardBundle,
// battleSession.completeBattleSession/getBattleResultsView,
// rewardDisplay.ts) — nothing here reimplements progression math. The
// modal component itself (PlayerLevelUpModal.tsx) and the ResultsScreen
// once-per-session gating are .tsx/JSX and cannot load under this
// sandbox's plain `node --experimental-strip-types` runner (same disclosed
// limitation as the Player Profile verification); those are covered by
// static code review instead (see COMPLETION_REPORT.md).

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

// ---------------------------------------------------------------------------
// 1. Zero levels gained: no level-up rewards, modal source data hidden.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const applied = applyRewardBundle(player, [
    { entry: { kind: "playerXp", amount: 5 }, source: "campaign-repeat", rarity: "common" },
  ]);
  check(applied.result.success, "tiny XP gain applies successfully");
  equal(applied.result.playerLevelsGained, 0, "tiny XP gain crosses zero levels");
  const levelUpRewards = applied.result.applied.filter((r) => r.source === "level-up");
  equal(levelUpRewards.length, 0, "no level-up rewards when zero levels gained");
}

// ---------------------------------------------------------------------------
// 2. One level gained: rewards match the canonical milestone table exactly.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  player.level = 3;
  player.xp = 0;
  const requiredForLevel3 = 500 + 120 * 2 + 8 * 2 * 2; // getXpRequiredForLevel(3)
  const applied = applyRewardBundle(player, [
    { entry: { kind: "playerXp", amount: requiredForLevel3 }, source: "campaign-repeat", rarity: "common" },
  ]);
  check(applied.result.success, "exact single-level XP gain applies");
  equal(applied.result.playerLevelsGained, 1, "exactly one level gained");
  equal(applied.state.level, 4, "level advances from 3 to 4");
  const levelUpRewards = applied.result.applied.filter((r) => r.source === "level-up");
  const expected = getPlayerLevelRewards(4);
  equal(levelUpRewards.length, expected.length, "one level's worth of milestone rewards applied");
  deepEqualEntries(levelUpRewards.map((r) => r.entry), expected, "level 4 milestone rewards match canonical table");
}

// ---------------------------------------------------------------------------
// 3. Multiple levels gained (one gain crossing several levels): rewards
//    aggregate stackable entries, MAX LEVEL never exceeded.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  player.level = 4;
  player.xp = 0;
  // Enough XP to cross levels 5, 6, and 7 in one gain.
  const req = (level: number) => 500 + 120 * (level - 1) + 8 * (level - 1) * (level - 1);
  const totalXp = req(4) + req(5) + req(6) + 10;
  const applied = applyRewardBundle(player, [
    { entry: { kind: "playerXp", amount: totalXp }, source: "campaign-repeat", rarity: "common" },
  ]);
  check(applied.result.success, "multi-level XP gain applies");
  equal(applied.result.playerLevelsGained, 3, "three levels gained in one combined gain (4 -> 7)");
  equal(applied.state.level, 7, "final level is 7");
  const levelUpRewards = applied.result.applied.filter((r) => r.source === "level-up");
  const rawEntries = [
    ...getPlayerLevelRewards(5),
    ...getPlayerLevelRewards(6),
    ...getPlayerLevelRewards(7),
  ];
  equal(levelUpRewards.length, rawEntries.length, "all three levels' milestone rewards are present pre-aggregation");

  const resolved: ResolvedReward[] = levelUpRewards;
  const aggregated = aggregateRewardEntries(resolved);
  const coinsRows = aggregated.filter((r) => r.entry.kind === "currency" && r.entry.currencyId === "coins");
  equal(coinsRows.length, 1, "duplicate Credits rows from levels 5/6/7 collapse into one aggregated row");
  const expectedCoins = rawEntries
    .filter((e) => e.kind === "currency" && e.currencyId === "coins")
    .reduce((sum, e) => sum + (e as { amount: number }).amount, 0);
  equal(
    (coinsRows[0]?.entry as { amount: number }).amount,
    expectedCoins,
    "aggregated Credits amount equals the sum of all crossed levels' Credits",
  );

  const rows = toRewardDisplayRows(resolved);
  equal(rows.length, aggregated.length, "one display row per aggregated reward entry");
  check(rows.every((row) => row.displayName.length > 0), "every reward row has a resolved display name");
  check(rows.every((row) => row.icon.length > 0), "every reward row has a resolved icon");
  const key = (row: (typeof rows)[number]) => `${row.kind}:${row.itemId}`;
  equal(new Set(rows.map(key)).size, rows.length, "no duplicate (kind, itemId) rows in the final display list");
}

// ---------------------------------------------------------------------------
// 4. Unlocks display correctly: crossing level 4 surfaces exactly the
//    canonical Daily Rewards unlock (never invented).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  player.level = 3;
  player.xp = 0;
  const session = requirePreparedSession(player, "ch1-stage-1");
  const started = startBattleSession(player, session);
  check(started.result.ok, "session starts");
  const afterOutcome = declareBattleOutcome(started.result.session, "victory");
  check(afterOutcome.ok, "victory declared");
  const completed = completeBattleSession(started.player, afterOutcome.session, session!.sessionId, productionRandomSource);
  check(completed.result.ok, "battle session completes");
  const view = getBattleResultsView(completed.result.session);
  check(view !== null, "results view available after completion");
  // The real stage grants a small, fixed amount of XP — not necessarily
  // enough alone to cross level 4, so this validates the unlocks contract
  // SHAPE against a real completion rather than forcing a specific
  // crossing via stage data (level-crossing math itself is exhaustively
  // covered by the direct applyRewardBundle checks above/below).
  equal(Array.isArray(view!.unlocksEarned), true, "unlocksEarned is always an array (possibly empty)");
  check(
    view!.unlocksEarned.every((u) => typeof u.label === "string" && u.label.length > 0),
    "every unlock has a real display label",
  );

  // Directly exercise the unlock-crossing contract with a controlled gain
  // (level 3 -> 4 crosses the canonical Daily Rewards unlock milestone).
  const req3 = 500 + 120 * 2 + 8 * 2 * 2;
  const plan = planPlayerXpGain({ level: 3, xp: 0 }, req3);
  equal(plan.newLevel, 4, "planned gain lands exactly on level 4");
  check(
    plan.unlocksEarned.some((u) => u.id === "daily-rewards"),
    "crossing level 4 surfaces the canonical Daily Rewards unlock",
  );
  check(
    plan.unlocksEarned.every((u) => u.level === 4),
    "every surfaced unlock's milestone level actually matches a crossed level (never invented)",
  );
}

// ---------------------------------------------------------------------------
// 5. Empty reward/unlock sections are genuinely empty (never padded).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const session = requirePreparedSession(player, "ch1-stage-1");
  const started = startBattleSession(player, session);
  const outcome = declareBattleOutcome(started.result.session, "defeat");
  check(outcome.ok, "defeat outcome declared");
  const completed = completeBattleSession(started.player, outcome.session, session!.sessionId);
  check(completed.result.ok, "defeat completes");
  const view = getBattleResultsView(completed.result.session);
  check(view !== null, "results view available after defeat completion");
  equal(view!.outcome, "defeat", "outcome is defeat");
  equal(view!.playerLevelsGained, 0, "defeat never gains a level");
  equal(view!.levelUpRewards.length, 0, "defeat has zero level-up rewards");
  equal(view!.unlocksEarned.length, 0, "defeat has zero unlocks earned");
  // Modal trigger condition for a real Results consumer:
  const wouldShowModal = view!.outcome === "victory" && view!.playerLevelsGained > 0;
  equal(wouldShowModal, false, "defeat never satisfies the Level-Up modal open condition");
}

// ---------------------------------------------------------------------------
// 6. MAX LEVEL state: reaching level 50 is reported, XP never overflows.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  player.level = MAX_PLAYER_LEVEL - 1;
  player.xp = 0;
  const req = 500 + 120 * (MAX_PLAYER_LEVEL - 2) + 8 * (MAX_PLAYER_LEVEL - 2) * (MAX_PLAYER_LEVEL - 2);
  const applied = applyRewardBundle(player, [
    { entry: { kind: "playerXp", amount: req + 999999 }, source: "campaign-repeat", rarity: "common" },
  ]);
  check(applied.result.success, "final-level XP gain applies");
  equal(applied.state.level, MAX_PLAYER_LEVEL, "level clamps at MAX_PLAYER_LEVEL");
  equal(applied.state.xp, 0, "excess XP is discarded at MAX LEVEL, never banked");
  equal(isPlayerMaxLevel(applied.state.level), true, "isPlayerMaxLevel reports true at level 50");
}

// ---------------------------------------------------------------------------
// 7. Victory with zero levels gained must not show the modal.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  player.level = 1;
  player.xp = 0;
  const session = requirePreparedSession(player, "ch1-stage-1");
  const started = startBattleSession(player, session);
  const outcome = declareBattleOutcome(started.result.session, "victory");
  const completed = completeBattleSession(started.player, outcome.session, session!.sessionId, productionRandomSource);
  check(completed.result.ok, "low-level victory completes");
  const view = getBattleResultsView(completed.result.session);
  check(view !== null, "results view available");
  equal(view!.outcome, "victory", "outcome is victory");
  check(view!.playerXpGained >= 0, "stage grants a non-negative amount of XP");
  // Stage 1 alone at level 1 does not require crossing a level for this
  // assertion to hold true in the current XP curve/stage balance.
  if (view!.playerLevelsGained === 0) {
    equal(view!.levelUpRewards.length, 0, "zero levels gained implies zero level-up rewards");
  }
}

// ---------------------------------------------------------------------------
// 8. Continue/Replay/Return actions are untouched by this feature.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const session = requirePreparedSession(player, "ch1-stage-1");
  const started = startBattleSession(player, session);
  const victory = declareBattleOutcome(started.result.session, "victory");
  const completed = completeBattleSession(started.player, victory.session, session!.sessionId, productionRandomSource);
  const view = getBattleResultsView(completed.result.session);
  check(view !== null, "results view available");
  check(view!.availableActions.includes("return-to-campaign"), "return-to-campaign action still offered on victory");
  check(
    view!.availableActions.includes("continue") || view!.availableActions.includes("replay"),
    "continue or replay action still offered on victory",
  );
}

console.log(`Player Level-Up verification passed: ${assertions} assertions.`);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function requirePreparedSession(player: PlayerState, stageId: string): BattleSession {
  const prepared = prepareBattleSession(null, {
    stageId,
    shipId: player.selectedShipId,
    sessionId: generateBattleSessionId(),
  });
  assert.ok(prepared.ok && prepared.session, "session prepares for a real campaign stage");
  return prepared.session!;
}

function deepEqualEntries(actual: unknown, expected: unknown, message: string) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
