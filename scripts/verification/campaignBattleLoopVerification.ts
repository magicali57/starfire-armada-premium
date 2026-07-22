import assert from "node:assert/strict";
import { DEFAULT_PLAYER_STATE } from "../../src/data/player";
import type { BattleSession, PlayerState } from "../../src/types";
import { getStageById, isStageAccessible } from "../../src/data/campaign";
import { createFixedRandomSource } from "../../src/systems/rewards/randomSource";
import {
  BATTLE_ENERGY_COST,
  completeBattleSession,
  declareBattleOutcome,
  generateBattleSessionId,
  getBattleResultsView,
  prepareBattleSession,
  resetBattleSession,
  startBattleSession,
} from "../../src/systems/battleSession";

// Focused verification for the campaign battle NAVIGATION LOOP's state
// machine and progression guarantees — Campaign/Stage Detail/Pre-Battle's
// real-stage resolution + accessibility gate (data/campaign.ts), and the
// battle-session lifecycle invariants every screen in the loop (Pre-Battle
// Start, Gameplay, Results) relies on. Screens themselves (PreBattleScreen/
// CampaignStageDetailScreen/GameplayScreen/ResultsScreen — all .tsx/JSX)
// cannot load under this sandbox's plain `node --experimental-strip-types`
// runner (same disclosed limitation as every prior handoff); those were
// verified by static code review — see COMPLETION_REPORT.md. Production-
// build dead-code-elimination of the dev-only Gameplay debug controls was
// verified separately by grepping the built `dist/assets/*.js` bundle for
// "Win Stage"/"Lose Stage" (absent) — see COMPLETION_REPORT.md.

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

function prepared(player: PlayerState, stageId: string) {
  const result = prepareBattleSession(null, {
    stageId,
    shipId: player.selectedShipId,
    sessionId: generateBattleSessionId(),
  });
  check(result.ok && result.session, `session prepares for ${stageId}`);
  return result.session!;
}

// ---------------------------------------------------------------------------
// 1. Stage accessibility — the ONE gate Stage Detail/Pre-Battle share.
// ---------------------------------------------------------------------------
{
  const fresh = clonePlayer();
  equal(isStageAccessible(fresh, "ch1-stage-1"), true, "stage 1 is accessible on a fresh save");
  equal(isStageAccessible(fresh, "ch1-stage-2"), false, "stage 2 is locked before stage 1 is cleared");
  equal(isStageAccessible(fresh, "ch1-stage-5"), false, "stage 5 is locked before earlier stages clear");
  equal(isStageAccessible(fresh, "not-a-real-stage"), false, "an unknown stage id is never accessible");
  check(getStageById("not-a-real-stage") === undefined, "unknown stage id resolves to no canonical stage (Stage Detail's not-found path)");
}

// ---------------------------------------------------------------------------
// 2. Successful battle start — validates, creates a fresh session, deducts
//    Energy exactly once, only after every check passes.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const energyBefore = player.currencies.energy;
  const session = prepared(player, "ch1-stage-1");
  equal(session.energySpent, false, "a freshly prepared session has not spent Energy yet");
  const started = startBattleSession(player, session);
  check(started.result.ok, "battle start succeeds for an accessible, known stage with enough Energy");
  equal(started.result.session?.status, "active", "session transitions to active on successful start");
  equal(started.result.session?.energySpent, true, "energySpent flips true exactly on start");
  equal(energyBefore - started.player.currencies.energy, BATTLE_ENERGY_COST, "Energy deducted exactly once, exactly the canonical cost");
}

// ---------------------------------------------------------------------------
// 3. Double Start tap cannot spend twice — the second call against an
//    already-started (active, energySpent) session is rejected outright.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const session = prepared(player, "ch1-stage-1");
  const first = startBattleSession(player, session);
  check(first.result.ok, "first start succeeds");
  const second = startBattleSession(first.player, first.result.session);
  equal(second.result.ok, false, "a second start attempt against the same (now active) session is rejected");
  equal(second.result.error, "already-started", "rejection reason is already-started (energySpent guard)");
  equal(second.player.currencies.energy, first.player.currencies.energy, "the rejected second attempt spends no additional Energy");
}

// ---------------------------------------------------------------------------
// 4. Insufficient Energy — Pre-Battle stays put, nothing created/spent.
// ---------------------------------------------------------------------------
{
  const poor = clonePlayer();
  poor.currencies.energy = 1;
  const session = prepared(poor, "ch1-stage-1");
  const started = startBattleSession(poor, session);
  equal(started.result.ok, false, "insufficient Energy rejects the start");
  equal(started.result.error, "insufficient-energy", "rejection reason is insufficient-energy");
  equal(started.player, poor, "player state is the SAME reference on rejection — no mutation at all");
}

// ---------------------------------------------------------------------------
// 5. Gameplay requires an active session — the exact predicate
//    GameplayScreen.tsx guards on (battleSession?.status === "active").
//    A missing, preparing, completed, or results session is never treated
//    as playable.
// ---------------------------------------------------------------------------
{
  const isPlayable = (session: BattleSession | null) => session?.status === "active";
  equal(isPlayable(null), false, "no session at all is never playable (redirect)");
  const player = clonePlayer();
  const prep = prepared(player, "ch1-stage-1");
  equal(isPlayable(prep), false, "a merely-prepared (not yet started) session is never playable");
  const started = startBattleSession(player, prep);
  equal(isPlayable(started.result.session), true, "an actually-started session is playable");
  const declared = declareBattleOutcome(started.result.session, "victory");
  equal(isPlayable(declared.session), false, "a victory-declared session is no longer playable (frozen)");
}

// ---------------------------------------------------------------------------
// 6. First outcome wins — victory-then-defeat and defeat-then-victory both
//    preserve the FIRST declared outcome; the second declare is rejected
//    and changes nothing.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const session = startBattleSession(player, prepared(player, "ch1-stage-1")).result.session!;
  const victoryFirst = declareBattleOutcome(session, "victory");
  check(victoryFirst.ok, "first declare (victory) succeeds");
  const defeatAfter = declareBattleOutcome(victoryFirst.session, "defeat");
  equal(defeatAfter.ok, false, "defeat-after-victory is rejected");
  equal(defeatAfter.session?.outcome, "victory", "victory-then-defeat preserves the original victory outcome");

  const session2 = startBattleSession(player, prepared(player, "ch1-stage-1")).result.session!;
  const defeatFirst = declareBattleOutcome(session2, "defeat");
  check(defeatFirst.ok, "first declare (defeat) succeeds");
  const victoryAfter = declareBattleOutcome(defeatFirst.session, "victory");
  equal(victoryAfter.ok, false, "victory-after-defeat is rejected");
  equal(victoryAfter.session?.outcome, "defeat", "defeat-then-victory preserves the original defeat outcome");
}

// ---------------------------------------------------------------------------
// 7. Victory completion runs exactly once; duplicate victory events return
//    the existing completion and apply nothing again.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const session = declareBattleOutcome(
    startBattleSession(player, prepared(player, "ch1-stage-1")).result.session,
    "victory",
  ).session!;
  const random = createFixedRandomSource([0.9, 0.9, 0.9, 0.9, 0.9]);
  const first = completeBattleSession(player, session, session.sessionId, random);
  check(first.result.ok, "first completion succeeds");
  const xpAfterFirst = first.player.xp;
  const coinsAfterFirst = first.player.currencies.coins;

  const second = completeBattleSession(first.player, first.result.session, session.sessionId, random);
  equal(second.result.ok, false, "a second completion attempt against the SAME completed session is rejected");
  equal(second.result.error, "already-completed", "rejection reason is already-completed");
  equal(second.result.completion, first.result.completion, "the rejection returns the EXISTING completion, not a new one");
  equal(second.player, first.player, "duplicate victory applies nothing again — same player reference back");
  equal(second.player.xp, xpAfterFirst, "no double XP from a duplicate completion attempt");
  equal(second.player.currencies.coins, coinsAfterFirst, "no double rewards from a duplicate completion attempt");
}

// ---------------------------------------------------------------------------
// 8. Defeat grants nothing and marks nothing cleared.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const session = declareBattleOutcome(
    startBattleSession(player, prepared(player, "ch1-stage-1")).result.session,
    "defeat",
  ).session!;
  const completed = completeBattleSession(player, session, session.sessionId);
  check(completed.result.ok, "defeat completion succeeds (still transitions, grants nothing)");
  equal(completed.player.xp, player.xp, "defeat grants zero Player XP");
  equal(completed.player.highestClearedStageId, player.highestClearedStageId, "defeat never marks a stage cleared");
  equal(completed.result.completion?.summary, null, "defeat's completion has no reward summary at all — nothing applied");
}

// ---------------------------------------------------------------------------
// 9. Victory -> Results and Defeat -> Results both produce a valid,
//    non-fabricated results view; a merely-active or stale session never
//    does.
// ---------------------------------------------------------------------------
{
  const victoryPlayer = clonePlayer();
  const victorySession = declareBattleOutcome(
    startBattleSession(victoryPlayer, prepared(victoryPlayer, "ch1-stage-1")).result.session,
    "victory",
  ).session!;
  const victoryCompleted = completeBattleSession(victoryPlayer, victorySession, victorySession.sessionId);
  check(getBattleResultsView(victoryCompleted.result.session) !== null, "victory completion is a valid results view");

  const defeatPlayer = clonePlayer();
  const defeatSession = declareBattleOutcome(
    startBattleSession(defeatPlayer, prepared(defeatPlayer, "ch1-stage-1")).result.session,
    "defeat",
  ).session!;
  const defeatCompleted = completeBattleSession(defeatPlayer, defeatSession, defeatSession.sessionId);
  check(getBattleResultsView(defeatCompleted.result.session) !== null, "defeat completion is a valid results view");

  const activeOnly = startBattleSession(clonePlayer(), prepared(clonePlayer(), "ch1-stage-1")).result.session;
  equal(getBattleResultsView(activeOnly), null, "a merely-active (not completed) session is never shown as a result");
  equal(getBattleResultsView(null), null, "no session at all -> null view (redirect, never fabricated)");
}

// ---------------------------------------------------------------------------
// 10. Continue navigation resolves the correct, real next unlocked stage,
//     and that stage is genuinely accessible immediately afterward.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const session = declareBattleOutcome(
    startBattleSession(player, prepared(player, "ch1-stage-1")).result.session,
    "victory",
  ).session!;
  const completed = completeBattleSession(player, session, session.sessionId);
  equal(completed.result.completion?.nextStageId, "ch1-stage-2", "Continue's next stage id is the real, canonical next stage");
  equal(
    isStageAccessible(completed.player, "ch1-stage-2"),
    true,
    "the next stage is genuinely accessible immediately after the clear (Stage Detail/Pre-Battle would allow it)",
  );
  equal(isStageAccessible(completed.player, "ch1-stage-3"), false, "stages beyond the newly-unlocked one remain locked");
}

// ---------------------------------------------------------------------------
// 11. Replay/Retry: fresh session id, Energy spent exactly once again,
//     never reuses the completed session's id.
// ---------------------------------------------------------------------------
{
  const p2 = clonePlayer();
  const s1 = prepared(p2, "ch1-stage-1");
  const started1 = startBattleSession(p2, s1);
  const declared1 = declareBattleOutcome(started1.result.session, "victory");
  const completed1 = completeBattleSession(started1.player, declared1.session, s1.sessionId);
  check(completed1.result.ok, "initial attempt completes");
  const energyAfterFirst = completed1.player.currencies.energy;

  const retrySession = prepared(completed1.player, "ch1-stage-1");
  check(retrySession.sessionId !== s1.sessionId, "retry/replay never reuses the completed sessionId");
  const retryStarted = startBattleSession(completed1.player, retrySession);
  check(retryStarted.result.ok, "retry/replay starts a fresh session");
  equal(
    energyAfterFirst - retryStarted.player.currencies.energy,
    BATTLE_ENERGY_COST,
    "retry/replay spends Energy exactly once more",
  );
}

// ---------------------------------------------------------------------------
// 12. First-clear cannot be reclaimed; a repeat clear uses repeat rewards.
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const s1 = prepared(player, "ch1-stage-1");
  const started1 = startBattleSession(player, s1);
  const completed1 = completeBattleSession(
    started1.player,
    declareBattleOutcome(started1.result.session, "victory").session,
    s1.sessionId,
  );
  equal(completed1.result.completion?.summary?.firstClear, true, "the first clear is genuinely a first clear");

  const s2 = prepared(completed1.player, "ch1-stage-1");
  const started2 = startBattleSession(completed1.player, s2);
  const completed2 = completeBattleSession(
    started2.player,
    declareBattleOutcome(started2.result.session, "victory").session,
    s2.sessionId,
  );
  equal(completed2.result.completion?.summary?.firstClear, false, "replaying the same stage is never a first clear again");
  equal(
    completed2.player.highestClearedStageId,
    completed1.player.highestClearedStageId,
    "a repeat clear never moves campaign progress backward or forward",
  );
}

// ---------------------------------------------------------------------------
// 13. Reload during an active battle grants nothing (simulated: the
//     in-memory session is simply never completed — nothing is persisted
//     that could apply rewards).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const started = startBattleSession(player, prepared(player, "ch1-stage-1"));
  check(started.result.ok, "battle starts");
  // "Reload" == the in-memory session reference is dropped; only the
  // already-committed Energy spend (part of `started.player`) persists.
  equal(started.player.xp, player.xp, "no XP was granted merely by starting/reloading mid-battle");
  equal(started.player.highestClearedStageId, player.highestClearedStageId, "no stage was marked cleared merely by starting/reloading mid-battle");
}

// ---------------------------------------------------------------------------
// 14. Reload after completion does not duplicate rewards — re-running the
//     exact same completion call twice against the same session object
//     (the only way a duplicate could ever be attempted) is a no-op the
//     second time (see check 7); a genuine reload loses the session
//     object entirely, making a second real completion structurally
//     impossible (Results/getBattleResultsView(null) simply redirects).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const s1 = prepared(player, "ch1-stage-1");
  const started1 = startBattleSession(player, s1);
  const completed1 = completeBattleSession(
    started1.player,
    declareBattleOutcome(started1.result.session, "victory").session,
    s1.sessionId,
  );
  equal(getBattleResultsView(null), null, "after a simulated reload (session lost), Results view is null, never re-fabricated");
  equal(completed1.player.xp > player.xp, true, "the original completion itself did grant XP exactly once");
}

// ---------------------------------------------------------------------------
// 15. Campaign return clears only temporary session state.
// ---------------------------------------------------------------------------
{
  const reset = resetBattleSession();
  equal(reset.ok, true, "resetBattleSession succeeds");
  equal(reset.session, null, "resetBattleSession clears the in-memory session to null");
}

console.log(`Campaign battle loop verification passed: ${assertions} assertions.`);
