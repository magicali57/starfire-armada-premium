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
  selectedChapterId?: string;
  onCardSelect: (chapter: ChapterOverviewCard) => void;
}

/**
 * Horizontally scrollable strip of chapter cards. Scroll is native touch/
 * drag (`overflow-x: auto`) with its scrollbar hidden, not a JS carousel
 * library — vertical page scroll is unaffected since this only captures the
 * horizontal axis. On mount, scrolls so the selected (or current) chapter's
 * card is centered/prominent. The small left/right chevrons are both a
 * visual scroll affordance and a real scroll-by-one-card control.
 */
export function ChapterCarousel({ items, selectedChapterId, onCardSelect }: ChapterCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const selected = selectedChapterId
      ? track.querySelector<HTMLElement>(`[data-chapter-id="${selectedChapterId}"]`)
      : null;
    const current = selected ?? track.querySelector<HTMLElement>(".chapter-card--current");
    current?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [selectedChapterId]);

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
            selected={chapter.id === selectedChapterId}
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
