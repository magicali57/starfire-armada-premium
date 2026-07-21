import { Fragment } from "react";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ComingSoonChapter } from "@/data/campaignOverview";
import "./ComingSoonChapterStrip.css";

interface ComingSoonChapterStripProps {
  chapters: ComingSoonChapter[];
  paginationDots: number;
  onSelectChapter: (chapter: ComingSoonChapter) => void;
}

/**
 * The "Coming Soon" row of locked future-chapter chips. Reference shows
 * Chapters 6, 7, 8, a pagination-dots gap, then Chapter 15 — implying
 * Chapters 9-14 exist but are paged/hidden rather than individually
 * rendered (see campaignOverview.ts) — so this deliberately does not
 * render all of 9-14.
 */
export function ComingSoonChapterStrip({ chapters, paginationDots, onSelectChapter }: ComingSoonChapterStripProps) {
  const gapIndex = chapters.findIndex((chapter, index) => index > 0 && chapter.chapterIndex > chapters[index - 1].chapterIndex + 1);

  return (
    <div className="coming-soon-strip">
      <h3 className="coming-soon-strip__heading">Coming Soon</h3>
      <div className="coming-soon-strip__row">
        {chapters.map((chapter, index) => (
          <Fragment key={chapter.chapterIndex}>
            {index === gapIndex ? (
              <span className="coming-soon-strip__dots" aria-hidden="true">
                {Array.from({ length: paginationDots }, (_, dotIndex) => (
                  <span
                    key={dotIndex}
                    className={`coming-soon-strip__dot${dotIndex === Math.floor(paginationDots / 2) ? " coming-soon-strip__dot--active" : ""}`}
                  />
                ))}
              </span>
            ) : null}
            <button
              type="button"
              className="coming-soon-strip__chip press-scale"
              onClick={() => onSelectChapter(chapter)}
            >
              <span className="coming-soon-strip__chapter">Chapter {chapter.chapterIndex}</span>
              <span className="coming-soon-strip__label">{chapter.label}</span>
              <BattleModeIcon variant="lock" size={16} />
            </button>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
