import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { CHAPTER_BACKGROUND_IMAGE } from "@/data/assetRegistry";
import type { PreBattleContent } from "@/data/preBattle";
import "./PreBattleMissionPanel.css";

interface PreBattleMissionPanelProps {
  content: PreBattleContent;
}

/**
 * Mission identity panel — CAMPAIGN eyebrow, chapter/stage label, stage
 * name, description, and a 3-column stat row (Entry Cost / Recommended
 * Power / Your Power). A new, purpose-built panel rather than a reuse of
 * Stage Detail's `StageMissionPanel` — that component's 2x2 stat grid
 * (Recommended Power / Your Power / Best Grade / Fastest Clear) doesn't
 * match this reference's 3-column row (Entry Cost / Recommended Power /
 * Your Power, no grade/clear-time fields), and Stage Detail itself is not
 * to be modified. Background art: `CHAPTER_BACKGROUND_IMAGE["chapter-01"]`,
 * the same disclosed substitution already approved for Stage Detail's
 * mission panel (`MODE_ILLUSTRATION.campaign` remains a small emblem, not
 * wide art) — reused here only as a clipped background image, never as the
 * full raw reference image.
 */
export function PreBattleMissionPanel({ content }: PreBattleMissionPanelProps) {
  return (
    <div className="pre-battle-mission-panel">
      <img className="pre-battle-mission-panel__art" src={CHAPTER_BACKGROUND_IMAGE["chapter-01"]} alt="" />
      <span className="pre-battle-mission-panel__scrim" aria-hidden="true" />

      <div className="pre-battle-mission-panel__body">
        <span className="pre-battle-mission-panel__eyebrow">Campaign</span>
        <span className="pre-battle-mission-panel__chapter-label">{content.chapterLabel} • Stage {content.stageIndex}</span>
        <h2 className="pre-battle-mission-panel__name">{content.stageName}</h2>
        <p className="pre-battle-mission-panel__description">{content.description}</p>

        <div className="pre-battle-mission-panel__stat-row">
          <div className="pb-stat-cell">
            <span className="pb-stat-cell__icon">
              <BattleModeIcon variant="energy" size={13} style={{ color: "var(--color-gold-300)" }} />
            </span>
            <span className="pb-stat-cell__content">
              <span className="pb-stat-cell__label">Entry Cost</span>
              <span className="pb-stat-cell__value">{content.energyCost}</span>
            </span>
          </div>

          <div className="pb-stat-cell">
            <span className="pb-stat-cell__icon">
              <BattleModeIcon variant="swords" size={13} style={{ color: "#e9a3ff" }} />
            </span>
            <span className="pb-stat-cell__content">
              <span className="pb-stat-cell__label">Recommended Power</span>
              <span className="pb-stat-cell__value pb-stat-cell__value--purple">
                {content.recommendedPower.toLocaleString()}
              </span>
            </span>
          </div>

          <div className="pb-stat-cell">
            <span className="pb-stat-cell__icon">
              <BattleModeIcon variant="swords" size={13} />
            </span>
            <span className="pb-stat-cell__content">
              <span className="pb-stat-cell__label">Your Power</span>
              <span className="pb-stat-cell__value pb-stat-cell__value--cyan">
                {content.yourPower.toLocaleString()}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
