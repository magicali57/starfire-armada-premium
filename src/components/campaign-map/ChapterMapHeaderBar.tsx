import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import "./ChapterMapHeaderBar.css";

interface ChapterMapHeaderBarProps {
  chapterIndex: number;
  chapterName: string;
  onBack: () => void;
  onInfo: () => void;
}

/**
 * The back / chapter-title / info row directly beneath the shared
 * `HubHeader`, unique to Chapter Map — Campaign Overview has no equivalent
 * row. Back and info are real coded buttons (chevron rotated 180°, same
 * technique `ChapterCarousel`'s edge buttons already use; and the new
 * `info` variant), not emoji or bare glyphs.
 */
export function ChapterMapHeaderBar({ chapterIndex, chapterName, onBack, onInfo }: ChapterMapHeaderBarProps) {
  return (
    <div className="chapter-map-header-bar">
      <button
        type="button"
        className="chapter-map-header-bar__icon-btn press-scale"
        aria-label="Back to Campaign Overview"
        onClick={onBack}
      >
        <BattleModeIcon variant="chevron" size={18} style={{ transform: "rotate(180deg)" }} />
      </button>

      <div className="chapter-map-header-bar__title">
        <h1 className="chapter-map-header-bar__chapter">Chapter {chapterIndex}</h1>
        <span className="chapter-map-header-bar__name">{chapterName}</span>
      </div>

      <button
        type="button"
        className="chapter-map-header-bar__icon-btn press-scale"
        aria-label="Chapter info"
        onClick={onInfo}
      >
        <BattleModeIcon variant="info" size={18} />
      </button>
    </div>
  );
}
