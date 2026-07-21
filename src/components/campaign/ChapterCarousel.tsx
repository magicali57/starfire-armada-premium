import { useEffect, useRef } from "react";
import { ChapterCard } from "@/components/campaign/ChapterCard";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ChapterOverviewCard } from "@/data/campaignOverview";
import "./ChapterCarousel.css";

export interface ChapterCarouselItem {
  chapter: ChapterOverviewCard;
  art: string;
  artFilter?: string;
}

interface ChapterCarouselProps {
  items: ChapterCarouselItem[];
  onCardSelect: (chapter: ChapterOverviewCard) => void;
}

/**
 * Horizontally scrollable strip of chapter cards. Scroll is native touch/
 * drag (`overflow-x: auto`) with its scrollbar hidden, not a JS carousel
 * library — vertical page scroll is unaffected since this only captures the
 * horizontal axis. On mount, scrolls so the current chapter's card is
 * centered/prominent, matching the reference's initial framing. The small
 * left/right chevrons are both a visual scroll affordance (present in the
 * reference at the card edges) and a real scroll-by-one-card control for
 * non-touch input.
 */
export function ChapterCarousel({ items, onCardSelect }: ChapterCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const current = track.querySelector<HTMLElement>(".chapter-card--current");
    current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []);

  const scrollBy = (direction: -1 | 1) => {
    trackRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  };

  return (
    <div className="chapter-carousel">
      <button
        type="button"
        className="chapter-carousel__edge chapter-carousel__edge--left"
        aria-label="Scroll chapters left"
        onClick={() => scrollBy(-1)}
      >
        <BattleModeIcon variant="chevron" size={16} style={{ transform: "rotate(180deg)" }} />
      </button>

      <div className="chapter-carousel__track" ref={trackRef}>
        {items.map(({ chapter, art, artFilter }) => (
          <ChapterCard
            key={chapter.id}
            chapter={chapter}
            art={art}
            artFilter={artFilter}
            onSelect={() => onCardSelect(chapter)}
          />
        ))}
      </div>

      <button
        type="button"
        className="chapter-carousel__edge chapter-carousel__edge--right"
        aria-label="Scroll chapters right"
        onClick={() => scrollBy(1)}
      >
        <BattleModeIcon variant="chevron" size={16} />
      </button>
    </div>
  );
}
