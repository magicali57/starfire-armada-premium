import { useEffect, useState } from "react";
import { BattleResultHero } from "@/components/results/BattleResultHero";
import { BattlePerformanceSummary } from "@/components/results/BattlePerformanceSummary";
import { BattleRewardSummary } from "@/components/results/BattleRewardSummary";
import { BattleResultActions } from "@/components/results/BattleResultActions";
import { InlineAlert } from "@/components/feedback/InlineAlert";
import { PlayerLevelUpModal } from "@/components/level-up/PlayerLevelUpModal";
import { RewardRevealOverlay } from "@/components/reward-reveal/RewardRevealOverlay";
import { usePlayerStore } from "@/store/playerStore";
import { getBattleResultsView } from "@/systems/battleSession";
import { isPlayerMaxLevel } from "@/systems/playerProgression";
import { getRewardRevealQueue } from "@/data/rewardReveal";
import { navigate, pathFor } from "@/app/routes";
import "./ResultsScreen.css";

/**
 * The complete, canonical-contract-only Results screen. Reads ONLY
 * getBattleResultsView(battleSession) — never resolves rewards, grants XP,
 * changes Player Level, deducts Energy, marks campaign progress, or
 * repeats a completion transaction. All of that already happened before
 * this screen ever renders (see battleSession.completeBattleSession /
 * systems/rewards/completeCampaignStage.ts). With no completed session to
 * show (direct navigation, reload, stale/mismatched session) it redirects
 * safely to Campaign without touching state.
 */
export function ResultsScreen() {
  const { battleSession, resetBattle, retryBattle } = usePlayerStore();
  const view = getBattleResultsView(battleSession);

  useEffect(() => {
    if (!view) navigate("campaign");
  }, [view]);

  // In-memory presentation marker only (never written to PlayerState/save):
  // tracks which sessionId's Level-Up modal has already been shown/closed
  // this Results visit, so a rerender (or a duplicate completion callback,
  // which the battle-session transaction already ignores) never reopens
  // it. A genuinely new session (Replay/Retry) gets a new sessionId and is
  // free to show its own Level-Up modal again.
  const [levelUpConsumedSessionId, setLevelUpConsumedSessionId] = useState<string | null>(null);
  // Same in-memory, never-persisted, once-per-session pattern as the
  // Level-Up marker above, plus a local queue position — reset whenever a
  // new session's view appears (see the effect below) so a Replay/Retry's
  // fresh queue always starts at its own first item.
  const [rewardRevealConsumedSessionId, setRewardRevealConsumedSessionId] = useState<string | null>(null);
  const [rewardRevealIndex, setRewardRevealIndex] = useState(0);
  // Navigation-safety guard: true while Replay/Retry is creating a fresh
  // session, so a double tap (or tapping while the store's own in-flight
  // guard is active) can never fire a second startBattle/Energy spend.
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [energyAlert, setEnergyAlert] = useState<string | null>(null);

  useEffect(() => {
    setRewardRevealIndex(0);
  }, [view?.sessionId]);

  if (!view) return null;

  const rewardRevealQueue = view.outcome === "victory" ? getRewardRevealQueue(view) : [];
  const hasLevelUpToShow = view.outcome === "victory" && view.playerLevelsGained > 0;
  // Required order: Level-Up first (when it exists), Reward Reveal next
  // (only once Level-Up is absent or already closed), then the normal
  // interactive Results screen. Never both stacked at once.
  const showLevelUpModal = hasLevelUpToShow && levelUpConsumedSessionId !== view.sessionId;
  const showRewardReveal =
    !showLevelUpModal && rewardRevealQueue.length > 0 && rewardRevealConsumedSessionId !== view.sessionId;
  // Neither overlay's own close button reaches these handlers (they only
  // ever call the marker setters above), but every Results action handler
  // still guards on overlay-active too — belt-and-suspenders so an overlay
  // can never be bypassed by, e.g., a stray click landing on the
  // interactive screen underneath before a re-render commits.
  const overlayActive = showLevelUpModal || showRewardReveal;

  const handleCampaign = () => {
    if (overlayActive) return;
    // Clears TEMPORARY session state only — awarded progression persists.
    resetBattle();
    navigate("campaign");
  };

  const handleContinue = () => {
    if (overlayActive || !view.nextStageId) return;
    // Continue never spends Energy or creates a session — it only clears
    // the finished session's temporary state and hands off to the
    // existing Stage Detail flow (same "?id=" convention Pre-Battle/Stage
    // Detail already use) for the next unlocked stage.
    resetBattle();
    window.location.hash = `${pathFor("stage-detail")}?id=${view.nextStageId}`;
  };

  const handleReplayOrRetry = () => {
    if (overlayActive || isStartingSession) return;
    setIsStartingSession(true);
    setEnergyAlert(null);
    // retryBattle (store/playerStore.tsx) creates a fresh sessionId for
    // the SAME stage/difficulty and validates + spends Energy exactly
    // once through the canonical session-start action — never reusing
    // the completed sessionId, never re-running any reward transaction.
    const result = retryBattle();
    if (result.ok) {
      navigate("gameplay");
      return;
    }
    setIsStartingSession(false);
    if (result.error === "insufficient-energy") {
      setEnergyAlert("Not enough Energy to start a new battle. Come back once you've recovered enough.");
      return;
    }
    // "busy" (already starting) or any other transient rejection: stay on
    // Results, nothing was created or spent.
    setEnergyAlert("Couldn't start a new battle. Please try again.");
  };

  const victory = view.outcome === "victory";

  return (
    <div className="results-screen">
      <BattleResultHero
        outcome={view.outcome}
        stageName={view.stageName}
        difficulty={view.difficulty}
        firstClear={view.firstClear}
        starsEarned={view.performance?.starsEarned}
      />

      <BattlePerformanceSummary performance={view.performance} />

      {victory ? (
        <BattleRewardSummary
          playerXpGained={view.playerXpGained}
          firstClearRewards={view.firstClearRewards}
          baseRewards={view.baseRewards}
          levelUpRewards={view.levelUpRewards}
          newCollectibles={view.newCollectibles}
          duplicateConversions={view.duplicateConversions}
          previousPlayerLevel={view.previousPlayerLevel}
          newPlayerLevel={view.newPlayerLevel}
          playerLevelsGained={view.playerLevelsGained}
        />
      ) : (
        <p className="results-screen__defeat-message">Defeat grants no rewards. Regroup and try again.</p>
      )}

      {energyAlert ? (
        <InlineAlert tone="danger" message={energyAlert} onDismiss={() => setEnergyAlert(null)} />
      ) : null}

      <BattleResultActions
        availableActions={view.availableActions}
        busy={isStartingSession || overlayActive}
        onContinue={handleContinue}
        onReplay={handleReplayOrRetry}
        onRetry={handleReplayOrRetry}
        onCampaign={handleCampaign}
      />

      <PlayerLevelUpModal
        isOpen={showLevelUpModal}
        previousLevel={view.previousPlayerLevel}
        newLevel={view.newPlayerLevel}
        levelsGained={view.playerLevelsGained}
        rewards={view.levelUpRewards}
        unlocks={view.unlocksEarned}
        reachedMaxLevel={isPlayerMaxLevel(view.newPlayerLevel)}
        onClose={() => setLevelUpConsumedSessionId(view.sessionId)}
      />

      <RewardRevealOverlay
        isOpen={showRewardReveal}
        items={rewardRevealQueue}
        currentIndex={rewardRevealIndex}
        onNext={() => setRewardRevealIndex((index) => index + 1)}
        onClose={() => setRewardRevealConsumedSessionId(view.sessionId)}
      />
    </div>
  );
}
