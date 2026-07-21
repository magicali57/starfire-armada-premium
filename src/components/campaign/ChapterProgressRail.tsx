import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ChapterOverviewCard } from "@/data/campaignOverview";
import "./ChapterProgressRail.css";

interface ChapterProgressRailProps {
  chapters: ChapterOverviewCard[];
}

/**
 * The thin connector rail beneath the chapter carousel — a fixed, evenly
 * spaced row of status nodes (independent of the carousel's own scroll
 * position, since it's a progress-at-a-glance summary rather than a
 * per-card annotation). Coded SVG only: check for cleared, a glowing dot
 * for the current chapter, lock icons for the rest.
 */
export function ChapterProgressRail({ chapters }: ChapterProgressRailProps) {
  return (
    <div className="chapter-progress-rail" aria-hidden="true">
      {chapters.map((chapter, index) => (
        <div className="chapter-progress-rail__segment" key={chapter.id}>
          {index > 0 ? (
            <span
              className={`chapter-progress-rail__line${
                chapters[index - 1].status !== "locked" ? " chapter-progress-rail__line--lit" : ""
              }`}
            />
          ) : null}
          <span className={`chapter-progress-rail__node chapter-progress-rail__node--${chapter.status}`}>
            {chapter.status === "cleared" ? <BattleModeIcon variant="check" size={12} /> : null}
            {chapter.status === "locked" ? <BattleModeIcon variant="lock" size={11} /> : null}
          </span>
        </div>
      ))}
    </div>
  );
}
