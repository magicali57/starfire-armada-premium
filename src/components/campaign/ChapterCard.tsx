import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ChapterOverviewCard } from "@/data/campaignOverview";
import "./ChapterCard.css";

interface ChapterCardProps {
  chapter: ChapterOverviewCard;
  art: string;
  /** CSS filter string (hue-rotate/saturate/brightness) used to make the
   *  handful of available illustrations read as distinct chapters when the
   *  same source image is reused across cards — see
   *  CAMPAIGN_OVERVIEW_PLAN.md's chapter-art substitution note. */
  artFilter?: string;
  /** UI selection highlight — independent of progression `status`. */
  selected?: boolean;
  onSelect: () => void;
}

/**
 * One carousel card in the Campaign Overview chapter strip. Three distinct
 * footer layouts per the reference (not one shared layout with swapped
 * colors): cleared shows a check badge above the star row, current shows no
 * badge at all (star row + "Stage X of Y" instead), locked shows the star
 * row above a lock badge. Art is never fully blacked out for locked
 * chapters — only the check/lock badge and the missing "CLEARED"/stage
 * line communicate the state, matching the reference exactly.
 */
export function ChapterCard({ chapter, art, artFilter, selected = false, onSelect }: ChapterCardProps) {
  const { status, name, chapterIndex, stars, starsMax, stageLabel } = chapter;

  return (
    <button
      type="button"
      data-chapter-id={chapter.id}
      className={`chapter-card chapter-card--${status}${selected ? " chapter-card--selected" : ""} press-scale`}
      onClick={onSelect}
      aria-current={selected || status === "current" ? "true" : undefined}
    >
      <img className="chapter-card__art" src={art} alt="" style={artFilter ? { filter: artFilter } : undefined} />
      <span className="chapter-card__scrim" aria-hidden="true" />

      <span className="chapter-card__header">
        <span className="chapter-card__eyebrow">Chapter {chapterIndex}</span>
        <span className="chapter-card__name">{name}</span>
        {status === "cleared" ? <span className="chapter-card__cleared-label">Cleared</span> : null}
      </span>

      <span className="chapter-card__footer">
        {status === "cleared" ? (
          <>
            <span className="chapter-card__badge chapter-card__badge--cleared" aria-hidden="true">
              <BattleModeIcon variant="check" size={18} />
            </span>
            <span className="chapter-card__stars">
              <BattleModeIcon variant="star" size={13} />
              <b>{stars}</b>/{starsMax}
            </span>
          </>
        ) : null}

        {status === "current" ? (
          <>
            <span className="chapter-card__stars chapter-card__stars--current">
              <BattleModeIcon variant="star" size={13} />
              <b>{stars}</b>/{starsMax}
            </span>
            {stageLabel ? <span className="chapter-card__stage-label">{stageLabel}</span> : null}
          </>
        ) : null}

        {status === "locked" ? (
          <>
            <span className="chapter-card__stars">
              <BattleModeIcon variant="star" size={13} />
              <b>{stars}</b>/{starsMax}
            </span>
            <span className="chapter-card__badge chapter-card__badge--locked" aria-hidden="true">
              <BattleModeIcon variant="lock" size={16} />
            </span>
          </>
        ) : null}
      </span>
    </button>
  );
}
