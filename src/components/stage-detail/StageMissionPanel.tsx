import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { CHAPTER_BACKGROUND_IMAGE } from "@/data/assetRegistry";
import type { StageDetailContent } from "@/data/campaignStageDetail";
import "./StageMissionPanel.css";

interface StageMissionPanelProps {
  content: StageDetailContent;
}

/**
 * The large mission briefing panel — chapter/stage name, description,
 * energy cost, and a 2x2 stat grid, with background art clipped behind a
 * text scrim. Structurally the same clipped-panel-plus-art convention as
 * `ChapterDetailPanel`/`ChapterMapIntroPanel`, but with its own stat rows
 * (Energy Cost, Recommended/Your Power, Best Grade/Fastest Clear) that
 * neither of those screens has.
 *
 * Background art: `CHAPTER_BACKGROUND_IMAGE["chapter-01"]`, not
 * `MODE_ILLUSTRATION.campaign` — the latter turned out to be a small
 * circular emblem when inspected directly (not a wide battle scene), which
 * would look soft/zoomed blown up across this much larger panel.
 * `chapter_01_void_frontier` is genuine wide-format hero art and the closer
 * structural fit, per the approved plan. Disclosed substitution — its
 * filename says "chapter-01" but it's being reused here for a Chapter 2
 * stage, same reuse-with-disclosure convention as every prior screen.
 */
export function StageMissionPanel({ content }: StageMissionPanelProps) {
  return (
    <div className="stage-mission-panel">
      <img className="stage-mission-panel__art" src={CHAPTER_BACKGROUND_IMAGE["chapter-01"]} alt="" />
      <span className="stage-mission-panel__scrim" aria-hidden="true" />

      <div className="stage-mission-panel__body">
        <span className="stage-mission-panel__chapter-label">{content.chapterLabel}</span>
        <h2 className="stage-mission-panel__name">{content.stageName}</h2>
        <p className="stage-mission-panel__description">{content.description}</p>

        <div className="stage-mission-panel__energy-row">
          <BattleModeIcon variant="energy" size={16} style={{ color: "var(--color-gold-300)" }} />
          <span className="stage-mission-panel__energy-label">Energy Cost</span>
          <b className="stage-mission-panel__energy-value">{content.energyCost}</b>
        </div>

        {/* Purpose-built stat cells, not the shared <StatRow> — StatRow lays
            icon/label/value out horizontally in one line (still correct for
            ChapterDetailPanel's own stat rows, untouched), which is what
            caused this grid's mobile misalignment: 4 cells with different
            icon intrinsic sizes and a variable-length label all competing
            for space in one flex row, at grid-column widths too narrow for
            that to hold together consistently. Each cell here shares one
            fixed icon column + a label-over-value text column instead, so
            all four are structurally identical regardless of content. */}
        <div className="stage-mission-panel__stat-grid">
          <div className="stat-cell">
            <span className="stat-cell__icon">
              <BattleModeIcon variant="swords" size={13} />
            </span>
            <span className="stat-cell__content">
              <span className="stat-cell__label">Recommended Power</span>
              <span className="stat-cell__value">{content.recommendedPower.toLocaleString()}</span>
            </span>
          </div>

          <div className="stat-cell stat-cell--highlight">
            <span className="stat-cell__icon">
              <BattleModeIcon variant="swords" size={13} />
            </span>
            <span className="stat-cell__content">
              <span className="stat-cell__label">Your Power</span>
              <span className="stat-cell__value">{content.yourPower.toLocaleString()}</span>
            </span>
          </div>

          <div className="stat-cell">
            <span className="stat-cell__icon">
              <BattleModeIcon variant="shield" size={13} />
            </span>
            <span className="stat-cell__content">
              <span className="stat-cell__label">Best Grade</span>
              <span className="stat-cell__value stat-cell__value--grade">{content.bestGrade}</span>
            </span>
          </div>

          <div className="stat-cell">
            <span className="stat-cell__icon">
              <BattleModeIcon variant="calendar" size={13} />
            </span>
            <span className="stat-cell__content">
              <span className="stat-cell__label">Fastest Clear</span>
              <span className="stat-cell__value">{content.fastestClear}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
