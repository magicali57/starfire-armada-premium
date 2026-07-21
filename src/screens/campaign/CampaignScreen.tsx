import { IconButton } from "@/components/controls/IconButton";
import { NeonPanel } from "@/components/cards/NeonPanel";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { ProgressBar } from "@/components/controls/ProgressBar";
import { CAMPAIGN_CHAPTERS, CAMPAIGN_STAGES } from "@/data";
import { CHAPTER_BACKGROUND_IMAGE } from "@/data/assetRegistry";
import { usePlayerStore } from "@/store/playerStore";
import { navigate } from "@/app/routes";
import type { StageKind } from "@/types";
import "./CampaignScreen.css";

const STAGE_KIND_META: Record<StageKind, { label: string; icon: string; accent: string }> = {
  standard: { label: "Standard", icon: "◆", accent: "var(--color-secondary-500)" },
  "mixed-pattern": { label: "Mixed Pattern", icon: "✦", accent: "var(--color-primary-500)" },
  elite: { label: "Elite", icon: "⚔", accent: "var(--color-rarity-epic)" },
  survival: { label: "Survival", icon: "⛨", accent: "var(--color-danger-500)" },
  boss: { label: "Boss", icon: "☠", accent: "var(--color-gold-500)" },
};

export function CampaignScreen() {
  const { player, setCurrentStage } = usePlayerStore();
  const chapter = CAMPAIGN_CHAPTERS[0];
  const stages = CAMPAIGN_STAGES.filter((s) => s.chapterId === chapter.id);

  const highestClearedIndex = player.highestClearedStageId
    ? stages.findIndex((s) => s.id === player.highestClearedStageId)
    : -1;
  const clearedCount = highestClearedIndex + 1;
  const totalRewardCoins = stages.reduce((sum, s) => sum + s.rewardCoins, 0);
  const totalRewardCrystals = stages.reduce((sum, s) => sum + s.rewardCrystals, 0);
  const backgroundImage = CHAPTER_BACKGROUND_IMAGE[chapter.id];

  return (
    <div className="campaign-screen">
      <div className="campaign-screen__hero">
        {backgroundImage ? (
          <img src={backgroundImage} alt="" className="campaign-screen__hero-image" />
        ) : null}
        <div className="campaign-screen__hero-overlay" aria-hidden="true" />
        <div className="campaign-screen__hero-top">
          <IconButton
            icon={<span aria-hidden="true">←</span>}
            label="Back to Home"
            onClick={() => navigate("home")}
          />
        </div>
        <div className="campaign-screen__hero-content">
          <span className="campaign-screen__hero-eyebrow">Chapter {chapter.index}</span>
          <h1 className="campaign-screen__hero-title">{chapter.name}</h1>
          <p className="campaign-screen__hero-description">{chapter.description}</p>
          <div className="campaign-screen__hero-progress">
            <ProgressBar
              value={Math.max(clearedCount, 0)}
              max={stages.length}
              tone="gold"
              label={`Chapter Progress · ${Math.max(clearedCount, 0)} / ${stages.length} stages cleared`}
            />
          </div>
          <div className="campaign-screen__hero-rewards">
            <span>
              <span aria-hidden="true">◈ </span>
              {totalRewardCoins.toLocaleString()} total coins
            </span>
            <span>
              <span aria-hidden="true">◆ </span>
              {totalRewardCrystals.toLocaleString()} total crystals
            </span>
          </div>
        </div>
      </div>

      <div className="campaign-screen__list">
        {stages.map((stage, index) => {
          const isCurrent = stage.id === player.currentStageId;
          const isCleared = index <= highestClearedIndex;
          const meta = STAGE_KIND_META[stage.kind];
          const isBoss = stage.kind === "boss";

          return (
            <NeonPanel
              key={stage.id}
              tone={isBoss ? "gold" : isCurrent ? "secondary" : "neutral"}
              className={`campaign-screen__stage${isBoss ? " campaign-screen__stage--boss" : ""}${
                isCurrent ? " campaign-screen__stage--current" : ""
              }`}
            >
              <div
                className="campaign-screen__stage-icon"
                style={{ ["--stage-accent" as string]: meta.accent }}
                aria-hidden="true"
              >
                {meta.icon}
              </div>
              <div className="campaign-screen__stage-body">
                <div className="campaign-screen__stage-heading">
                  <span
                    className="campaign-screen__stage-kind"
                    style={{ color: meta.accent }}
                  >
                    {meta.label}
                  </span>
                  {isCurrent ? (
                    <span className="campaign-screen__stage-current-badge">Current</span>
                  ) : isCleared ? (
                    <span className="campaign-screen__stage-cleared-badge" aria-hidden="true">
                      ✓ Cleared
                    </span>
                  ) : null}
                </div>
                <h3 className="campaign-screen__stage-name">
                  {stage.index}. {stage.name}
                </h3>
                <span className="campaign-screen__stage-reward">
                  <span aria-hidden="true">◈ </span>
                  {stage.rewardCoins.toLocaleString()}
                  <span className="campaign-screen__stage-reward-sep">·</span>
                  <span aria-hidden="true">◆ </span>
                  {stage.rewardCrystals}
                </span>
              </div>
              <PrimaryButton
                className="campaign-screen__stage-button"
                onClick={() => {
                  setCurrentStage(chapter.id, stage.id);
                  navigate("gameplay");
                }}
                aria-label={`${isCurrent ? "Continue" : "Play"} stage ${stage.index}: ${stage.name}`}
              >
                {isCurrent ? "Continue" : "Play"}
              </PrimaryButton>
            </NeonPanel>
          );
        })}
      </div>
    </div>
  );
}
