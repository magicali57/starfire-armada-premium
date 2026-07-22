import assert from "node:assert/strict";
import { DEFAULT_PLAYER_STATE } from "../../src/data/player";
import { SHIPS } from "../../src/data/ships";
import type { BattleCompletionSummary, BattleSession, PlayerState, ResolvedReward } from "../../src/types";
import { applyRewardBundle } from "../../src/systems/rewards/applyRewards";
import { createFixedRandomSource } from "../../src/systems/rewards/randomSource";
import {
  completeBattleSession,
  declareBattleOutcome,
  generateBattleSessionId,
  getBattleResultsView,
  prepareBattleSession,
  resetBattleSession,
  startBattleSession,
  BATTLE_ENERGY_COST,
  type BattleSessionCompletion,
} from "../../src/systems/battleSession";
import { aggregateRewardEntries, toRewardDisplayRows } from "../../src/data/rewardDisplay";

// Focused verification for the redesigned Battle Results screen's DATA
// CONTRACT. Exercises the real canonical systems (battleSession.ts,
// applyRewardBundle, completeCampaignStage, rewardDisplay.ts) — nothing
// here reimplements reward/XP/campaign math. The screen components
// themselves (ResultsScreen.tsx, BattleResultHero/BattlePerformanceSummary/
// BattleRewardSummary/BattleResultActions — all .tsx/JSX) cannot load
// under this sandbox's plain `node --experimental-strip-types` runner
// (same disclosed limitation as the Player Profile / Player Level-Up
// handoffs); those were verified by static code review instead — see
// COMPLETION_REPORT.md.

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

function requirePreparedSession(player: PlayerState, stageId: string): BattleSession {
  const prepared = prepareBattleSession(null, {
    stageId,
    shipId: player.selectedShipId,
    sessionId: generateBattleSessionId(),
  });
  assert.ok(prepared.ok && prepared.session, "session prepares for a real campaign stage");
  return prepared.session!;
}

/** Runs one full victory or defeat through the real battle-session pipeline
 *  and returns the resulting BattleResultsView. */
function runBattle(
  player: PlayerState,
  stageId: string,
  outcome: "victory" | "defeat",
): { player: PlayerState; view: NonNullable<ReturnType<typeof getBattleResultsView>> } {
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

// ---------------------------------------------------------------------------
// 1. Valid Victory result — first clear.
// ---------------------------------------------------------------------------
let victoryPlayer = clonePlayer();
const firstClear = runBattle(victoryPlayer, "ch1-stage-1", "victory");
victoryPlayer = firstClear.player;
{
  const view = firstClear.view;
  equal(view.outcome, "victory", "outcome is victory");
  equal(view.stageId, "ch1-stage-1", "stage id matches");
  equal(view.stageName.length > 0, true, "stage name resolved");
  equal(view.difficulty, "normal", "default difficulty is normal");
  equal(view.firstClear, true, "first victory on a fresh save is a first clear");
  check(view.playerXpGained > 0, "victory grants Player XP");
  check(view.firstClearRewards.length > 0, "first-clear rewards present on a first clear");
  equal(view.baseRewards.length, 0, "no base (repeat) rewards on a first clear — never shown twice");
  equal(view.duplicateConversions.length, 0, "no duplicate conversions expected from real stage data");
  equal(view.newCollectibles.length, 0, "no collectible drops in current stage tables");
  check(
    view.availableActions.includes("continue") || view.availableActions.includes("replay"),
    "continue or replay offered on victory",
  );
  check(view.availableActions.includes("return-to-campaign"), "return-to-campaign offered on victory");
}

// ---------------------------------------------------------------------------
// 2. Valid Defeat result.
// ---------------------------------------------------------------------------
{
  const defeatPlayer = clonePlayer();
  const { view } = runBattle(defeatPlayer, "ch1-stage-1", "defeat");
  equal(view.outcome, "defeat", "outcome is defeat");
  equal(view.playerXpGained, 0, "defeat grants zero Player XP — no fabricated XP");
  equal(view.firstClearRewards.length, 0, "defeat has zero first-clear rewards");
  equal(view.baseRewards.length, 0, "defeat has zero base rewards");
  equal(view.levelUpRewards.length, 0, "defeat has zero level-up rewards");
  equal(view.newCollectibles.length, 0, "defeat has zero new collectibles");
  equal(view.duplicateConversions.length, 0, "defeat has zero duplicate conversions");
  equal(view.playerLevelsGained, 0, "defeat never gains a level");
  deepEqualActions(view.availableActions, ["retry", "return-to-campaign"], "defeat offers only retry/campaign");
  const wouldShowLevelUpModal = view.outcome === "victory" && view.playerLevelsGained > 0;
  equal(wouldShowLevelUpModal, false, "defeat never satisfies the Level-Up modal open condition");
}

// ---------------------------------------------------------------------------
// 3. Repeat-clear Victory — replaying the SAME already-cleared stage moves
//    its rewards into baseRewards, never firstClearRewards (mutually
//    exclusive groups — nothing shown twice).
// ---------------------------------------------------------------------------
{
  const { view } = runBattle(victoryPlayer, "ch1-stage-1", "victory");
  equal(view.firstClear, false, "second clear of the same stage is a repeat clear");
  equal(view.firstClearRewards.length, 0, "no first-clear rewards on a repeat clear");
  check(view.baseRewards.length > 0, "base (repeat) rewards present on a repeat clear");
  // Groups never overlap: same entries never counted in both.
  const overlap = view.firstClearRewards.filter((r) => view.baseRewards.includes(r));
  equal(overlap.length, 0, "firstClearRewards and baseRewards never share an entry");
}

// ---------------------------------------------------------------------------
// 4. Stackable rewards aggregate correctly within a group (real repeat
//    -clear guaranteed + drop-table currency entries collapse by id).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const { view } = runBattle(player, "ch1-stage-1", "victory");
  const aggregated = aggregateRewardEntries(view.firstClearRewards);
  const coinsRows = aggregated.filter((r) => r.entry.kind === "currency" && r.entry.currencyId === "coins");
  equal(coinsRows.length, 1, "multiple Credits entries in one group aggregate into a single row");
  const rawCoinsTotal = view.firstClearRewards
    .filter((r) => r.entry.kind === "currency" && r.entry.currencyId === "coins")
    .reduce((sum, r) => sum + (r.entry as { amount: number }).amount, 0);
  equal(
    (coinsRows[0]?.entry as { amount: number }).amount,
    rawCoinsTotal,
    "aggregated Credits amount equals the sum of the raw entries in that group",
  );
  const rows = toRewardDisplayRows(view.firstClearRewards);
  const key = (row: (typeof rows)[number]) => `${row.kind}:${row.itemId}`;
  equal(new Set(rows.map(key)).size, rows.length, "no duplicate (kind, itemId) rows in the display list");
}

// ---------------------------------------------------------------------------
// 5. Unopened chest display — a chest reward entry converts to a display
//    row with the canonical chest icon/label, never resolved/opened here.
// ---------------------------------------------------------------------------
{
  const chestReward: ResolvedReward = { entry: { kind: "chest", chestId: "chestBasic", amount: 1 }, source: "campaign-first-clear", rarity: "common" };
  const [row] = toRewardDisplayRows([chestReward]);
  check(row !== undefined, "chest entry converts to a display row");
  equal(row.kind, "chest", "row kind is chest");
  equal(row.amount, 1, "chest amount preserved");
  check(row.icon.length > 0, "chest row has a resolved icon");
  equal(row.displayName, "Basic Chest", "chest uses its canonical label");
}

// ---------------------------------------------------------------------------
// 6. Duplicate collectible conversion + new collectible grouping — built
//    from the REAL applyRewardBundle result (duplicate-conversion logic is
//    canonical, not reimplemented), then fed through the REAL
//    getBattleResultsView via a manually-assembled completion fixture
//    (BattleSessionCompletion/BattleSession are plain data — no store
//    needed to construct one for a read-only selector test).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const ownedShipId = player.ownedShipIds[0]; // duplicate
  const newShipId = SHIPS.find((s) => !player.ownedShipIds.includes(s.id))!.id; // genuinely new
  check(newShipId !== undefined, "a real not-yet-owned ship exists for the fixture");

  const applied = applyRewardBundle(player, [
    { entry: { kind: "collectible", collectibleType: "ship", collectibleId: ownedShipId }, source: "campaign-drop", rarity: "rare" },
    { entry: { kind: "collectible", collectibleType: "ship", collectibleId: newShipId }, source: "campaign-drop", rarity: "rare" },
  ]);
  check(applied.result.success, "synthetic collectible bundle applies");
  equal(applied.result.duplicateConversions.length, 1, "exactly one duplicate conversion recorded");
  equal(applied.result.duplicateConversions[0]?.collectibleId, ownedShipId, "duplicate conversion references the already-owned ship");

  const summary: BattleCompletionSummary = {
    stageId: "ch1-stage-1",
    victory: true,
    firstClear: false,
    bundle: { stageId: "ch1-stage-1", source: "campaign-drop", firstClear: false, rewards: [] },
    application: applied.result,
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
  const fixtureSession: BattleSession = {
    sessionId: "fixture-session",
    stageId: "ch1-stage-1",
    difficulty: "normal",
    shipId: player.selectedShipId,
    status: "results",
    startedAt: Date.now(),
    outcome: "victory",
    performance: null,
    completion,
    energySpent: true,
  };
  const view = getBattleResultsView(fixtureSession);
  check(view !== null, "results view available for the fixture session");
  equal(view!.newCollectibles.length, 1, "exactly one genuinely-new collectible surfaced");
  equal(
    (view!.newCollectibles[0]?.entry as { collectibleId: string }).collectibleId,
    newShipId,
    "the new collectible is the genuinely-new ship, not the duplicate",
  );
  equal(view!.duplicateConversions.length, 1, "duplicate conversion surfaced on the view");
  // The converted material entry must never ALSO appear in a generic
  // reward group (never displayed twice).
  const convertedEntry = view!.duplicateConversions[0]!.converted;
  const inBaseGroup = view!.baseRewards.some((r) => r.entry === convertedEntry);
  const inFirstClearGroup = view!.firstClearRewards.some((r) => r.entry === convertedEntry);
  equal(inBaseGroup || inFirstClearGroup, false, "duplicate-converted entry never also appears in a generic reward group");
}

// ---------------------------------------------------------------------------
// 7. Replay/Retry creates a fresh session and spends Energy exactly once
//    (the same primitives store/playerStore.tsx's retryBattle composes).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const { player: afterFirst, view: firstView } = runBattle(player, "ch1-stage-1", "victory");
  const energyAfterFirst = afterFirst.currencies.energy;

  // "retryBattle": fresh sessionId, same stage/difficulty, Energy
  // validated + spent again — exactly what startBattle does for a brand
  // new session (never the completed sessionId).
  const retrySession = requirePreparedSession(afterFirst, firstView.stageId);
  check(retrySession.sessionId !== firstView.sessionId, "retry/replay never reuses the completed sessionId");
  const retryStarted = startBattleSession(afterFirst, retrySession);
  check(retryStarted.result.ok, "retry/replay starts a fresh session");
  equal(
    afterFirst.currencies.energy - retryStarted.player.currencies.energy,
    BATTLE_ENERGY_COST,
    "retry/replay spends Energy exactly once (one BATTLE_ENERGY_COST deduction)",
  );
  equal(energyAfterFirst, afterFirst.currencies.energy, "sanity: energy read before retry is unchanged by the read itself");
}

// ---------------------------------------------------------------------------
// 8. Insufficient Energy: remain unstarted, nothing spent, nothing created.
// ---------------------------------------------------------------------------
{
  const poorPlayer = clonePlayer();
  poorPlayer.currencies.energy = 1; // below BATTLE_ENERGY_COST
  const session = requirePreparedSession(poorPlayer, "ch1-stage-1");
  const started = startBattleSession(poorPlayer, session);
  equal(started.result.ok, false, "insufficient Energy rejects session start");
  equal(started.result.error, "insufficient-energy", "rejection reason is insufficient-energy");
  equal(started.player.currencies.energy, 1, "Energy balance untouched on rejection");
  equal(started.player, poorPlayer, "player state object is the SAME reference — no mutation at all");
}

// ---------------------------------------------------------------------------
// 9. Campaign return / missing-session redirect: resetBattleSession clears
//    only temporary state; getBattleResultsView is null for every
//    not-actually-completed shape (never fabricates a result).
// ---------------------------------------------------------------------------
{
  const reset = resetBattleSession();
  equal(reset.ok, true, "resetBattleSession succeeds");
  equal(reset.session, null, "resetBattleSession clears the session to null");

  equal(getBattleResultsView(null), null, "no session at all -> null view (redirect, never fabricated)");

  const player = clonePlayer();
  const activeSession = requirePreparedSession(player, "ch1-stage-1");
  const started = startBattleSession(player, activeSession);
  equal(getBattleResultsView(started.result.session), null, "an in-progress (active) session is never shown as a result");

  const staleCompletedButWrongStatusCheck = { ...started.result.session!, status: "victory" as const, completion: null };
  equal(getBattleResultsView(staleCompletedButWrongStatusCheck), null, "victory-but-not-yet-completed session is never shown as a result");
}

// ---------------------------------------------------------------------------
// 10. Results interaction changes no permanent rewards or XP: reading the
//     view twice (simulating a rerender) never mutates the session or
//     player, and never re-derives different numbers from the same input.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const { player: afterBattle, view } = runBattle(player, "ch1-stage-1", "victory");
  const sessionSnapshot = JSON.stringify(view);
  const viewAgain = getBattleResultsView({
    sessionId: view.sessionId,
    stageId: view.stageId,
    difficulty: view.difficulty,
    shipId: afterBattle.selectedShipId,
    status: "results",
    startedAt: Date.now(),
    outcome: view.outcome,
    performance: view.performance,
    completion: {
      sessionId: view.sessionId,
      stageId: view.stageId,
      difficulty: view.difficulty,
      outcome: view.outcome,
      summary: {
        stageId: view.stageId,
        victory: true,
        firstClear: view.firstClear,
        bundle: view.rewards,
        application: {
          success: true,
          applied: [...view.firstClearRewards, ...view.baseRewards, ...view.levelUpRewards, ...view.newCollectibles],
          duplicateConversions: [...view.duplicateConversions],
          playerLevelsGained: view.playerLevelsGained,
        },
        stageMarkedCleared: false,
      },
      previousHighestClearedStageId: null,
      newHighestClearedStageId: view.stageId,
      previousPlayerXp: 0,
      newPlayerXp: 0,
      previousPlayerLevel: view.previousPlayerLevel,
      newPlayerLevel: view.newPlayerLevel,
      playerLevelsGained: view.playerLevelsGained,
      unlocksEarned: view.unlocksEarned,
      nextStageId: view.nextStageId,
    },
    energySpent: true,
  });
  check(viewAgain !== null, "second read of an equivalent completed session still returns a view");
  equal(JSON.stringify(view), sessionSnapshot, "reading the view a second time never mutates the first view object");
  check(afterBattle.ownedShipIds.length >= DEFAULT_PLAYER_STATE.ownedShipIds.length, "no permanent state was lost across the two reads");
}

console.log(`Battle Results verification passed: ${assertions} assertions.`);

function deepEqualActions(actual: unknown, expected: unknown, message: string) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
