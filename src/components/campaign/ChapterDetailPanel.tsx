import { StatRow } from "@/components/stats/StatRow";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ChapterOverviewDetail } from "@/data/campaignOverview";
import "./ChapterDetailPanel.css";

interface ChapterDetailPanelProps {
  detail: ChapterOverviewDetail;
  art: string;
  onOpenChapter: () => void;
}

/**
 * The large selected-chapter panel below the carousel — structurally the
 * same convention as Battle Hub's `CampaignFeatureCard` (magenta notched
 * border, right-aligned illustration with a left-to-right scrim for text
 * readability), extended with a description paragraph and a single
 * full-width "OPEN CHAPTER" CTA instead of two side-by-side buttons.
 */
export function ChapterDetailPanel({ detail, art, onOpenChapter }: ChapterDetailPanelProps) {
  return (
    <div className="chapter-detail-panel">
      <img className="chapter-detail-panel__art" src={art} alt="" />
      <span className="chapter-detail-panel__scrim" aria-hidden="true" />

      <div className="chapter-detail-panel__body">
        <span className="chapter-detail-panel__chapter-label">{detail.chapterLabel}</span>
        <h2 className="chapter-detail-panel__name">{detail.name}</h2>
        <p className="chapter-detail-panel__description">{detail.description}</p>

        <div className="chapter-detail-panel__stats">
          <StatRow
            icon={<BattleModeIcon variant="star" size={14} />}
            label="Chapter Stars"
            value={`${detail.chapterStars.current}/${detail.chapterStars.max}`}
          />
          <StatRow
            icon={<BattleModeIcon variant="swords" size={14} />}
            label="Recommended Power"
            value={detail.recommendedPower.toLocaleString()}
          />
          <StatRow
            icon={<BattleModeIcon variant="target" size={14} />}
            label="Current Stage"
            value={`${detail.currentStage.current}/${detail.currentStage.max}`}
          />
        </div>

        <PrimaryButton fullWidth className="chapter-detail-panel__cta" onClick={onOpenChapter}>
          Open Chapter
        </PrimaryButton>
      </div>
    </div>
  );
}
