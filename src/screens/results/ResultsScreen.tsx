import { useEffect, useState } from "react";
import { BattleResultHero } from "@/components/results/BattleResultHero";
import { BattlePerformanceSummary } from "@/components/results/BattlePerformanceSummary";
import { BattleRewardSummary } from "@/components/results/BattleRewardSummary";
import { BattleResultActions } from "@/components/results/BattleResultActions";
import { InlineAlert } from "@/components/feedback/InlineAlert";
import { PlayerLevelUpModal } from "@/components/level-up/PlayerLevelUpModal";
import { RewardRevealOverlay } from "@/components/reward-reveal/RewardRevealOverlay";
import { usePlayerStore } from "@/store/playerStore";
import { getBattleEnergyCost, getBattleResultsView } from "@/systems/battleSession";
import { getXpProgressWithinLevel, isPlayerMaxLevel } from "@/systems/playerProgression";
import { getRewardRevealQueue } from "@/data/rewardReveal";
import { getChapterById, getStageById } from "@/data/campaign";
import { CHAPTER_BACKGROUND_IMAGE, getShipMasterArt, HOME_SCENE, HOME_TOPBAR_FINAL } from "@/data/assetRegistry";
import { navigate, pathFor } from "@/app/routes";
import "./ResultsScreen.css";

function formatStageIdentity(stageId: string): string | null {
  const stage = getStageById(stageId);
  if (!stage) return null;
  const chapter = getChapterById(stage.chapterId);
  const chapterLabel = chapter ? `Chapter ${chapter.index}` : "Chapter";
  return `${chapterLabel} • Stage ${stage.index}`;
}

function resultsBackdropForStage(stageId: string): string {
  const stage = getStageById(stageId);
  if (stage?.chapterId && CHAPTER_BACKGROUND_IMAGE[stage.chapterId]) {
    return CHAPTER_BACKGROUND_IMAGE[stage.chapterId];
  }
  return HOME_SCENE.background;
}

/**
 * Canonical-contract-only Results screen. Visual composition follows
 * 47_Victory_Results.png / 48_Defeat_Results.png. Reads ONLY
 * getBattleResultsView(battleSession) — never grants rewards or XP.
 */
export function ResultsScreen() {
  const { player, battleSession, resetBattle, retryBattle } = usePlayerStore();
  const view = getBattleResultsView(battleSession);

  useEffect(() => {
    if (!view) navigate("campaign");
  }, [view]);

  const [levelUpConsumedSessionId, setLevelUpConsumedSessionId] = useState<string | null>(null);
  const [rewardRevealConsumedSessionId, setRewardRevealConsumedSessionId] = useState<string | null>(null);
  const [rewardRevealIndex, setRewardRevealIndex] = useState(0);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [energyAlert, setEnergyAlert] = useState<string | null>(null);

  useEffect(() => {
    setRewardRevealIndex(0);
  }, [view?.sessionId]);

  if (!view) return null;

  const rewardRevealQueue = view.outcome === "victory" ? getRewardRevealQueue(view) : [];
  const hasLevelUpToShow = view.outcome === "victory" && view.playerLevelsGained > 0;
  const showLevelUpModal = hasLevelUpToShow && levelUpConsumedSessionId !== view.sessionId;
  const showRewardReveal =
    !showLevelUpModal && rewardRevealQueue.length > 0 && rewardRevealConsumedSessionId !== view.sessionId;
  const overlayActive = showLevelUpModal || showRewardReveal;

  const stageIdentity = formatStageIdentity(view.stageId);
  const shipArtSrc = battleSession?.shipId ? getShipMasterArt(battleSession.shipId) : undefined;
  const nextStage = view.nextStageId ? getStageById(view.nextStageId) : undefined;
  const nextStageLabel = nextStage
    ? formatStageIdentity(nextStage.id) ?? nextStage.name
    : null;
  const energyCost = getBattleEnergyCost(view.stageId);
  const xpProgress = getXpProgressWithinLevel(player);
  const victory = view.outcome === "victory";

  const handleCampaign = () => {
    if (overlayActive) return;
    resetBattle();
    navigate("campaign");
  };

  const handleContinue = () => {
    if (overlayActive || !view.nextStageId) return;
    resetBattle();
    window.location.hash = `${pathFor("stage-detail")}?id=${view.nextStageId}`;
  };

  const handleChangeLoadout = () => {
    if (overlayActive) return;
    resetBattle();
    navigate("loadout");
  };

  const handleReplayOrRetry = () => {
    if (overlayActive || isStartingSession) return;
    setIsStartingSession(true);
    setEnergyAlert(null);
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
    setEnergyAlert("Couldn't start a new battle. Please try again.");
  };

  const backdropSrc = resultsBackdropForStage(view.stageId);

  return (
    <div
      className={`results-screen results-screen--${victory ? "victory" : "defeat"}`}
      style={{ ["--results-backdrop" as string]: `url(${backdropSrc})` }}
    >
      <BattleResultHero
        outcome={view.outcome}
        stageName={view.stageName}
        stageIdentity={stageIdentity}
        difficulty={view.difficulty}
        firstClear={view.firstClear}
        shipArtSrc={shipArtSrc}
        starsEarned={view.performance?.starsEarned}
      />

      <BattlePerformanceSummary performance={view.performance} outcome={view.outcome} />

      {victory ? (
        <BattleRewardSummary
          playerXpGained={view.playerXpGained}
          firstClearRewards={view.firstClearRewards}
          baseRewards={view.baseRewards}
          newCollectibles={view.newCollectibles}
          duplicateConversions={view.duplicateConversions}
          previousPlayerLevel={view.previousPlayerLevel}
          newPlayerLevel={view.newPlayerLevel}
          playerLevelsGained={view.playerLevelsGained}
          xpProgressPercent={xpProgress.progressPercent}
          xpWithinLevel={xpProgress.xpWithinLevel}
          xpToNextLevel={xpProgress.xpRequiredWithinLevel}
          displayName={player.displayName}
          avatarSrc={HOME_TOPBAR_FINAL.avatar}
        />
      ) : (
        <div className="results-screen__defeat-panel">
          <p className="results-screen__defeat-message">No completion rewards.</p>
          <p className="results-screen__defeat-guidance">
            Upgrade your ship, review abilities, or change loadout before retrying.
          </p>
        </div>
      )}

      {energyAlert ? (
        <InlineAlert tone="danger" message={energyAlert} onDismiss={() => setEnergyAlert(null)} />
      ) : null}

      <BattleResultActions
        outcome={view.outcome}
        availableActions={view.availableActions}
        busy={isStartingSession || overlayActive}
        nextStageLabel={nextStageLabel}
        energyCost={energyCost}
        onContinue={handleContinue}
        onReplay={handleReplayOrRetry}
        onRetry={handleReplayOrRetry}
        onCampaign={handleCampaign}
        onChangeLoadout={victory ? undefined : handleChangeLoadout}
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
        stageName={view.stageName}
        stageIdentity={stageIdentity}
        firstClear={view.firstClear}
        onNext={() => setRewardRevealIndex((index) => index + 1)}
        onClose={() => setRewardRevealConsumedSessionId(view.sessionId)}
      />
    </div>
  );
}
