import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { ChapterCarousel, type ChapterCarouselItem } from "@/components/campaign/ChapterCarousel";
import { ChapterProgressRail } from "@/components/campaign/ChapterProgressRail";
import { ChapterDetailPanel } from "@/components/campaign/ChapterDetailPanel";
import { ChapterStarRewardsTrack } from "@/components/campaign/ChapterStarRewardsTrack";
import { TotalStarsPanel } from "@/components/campaign/TotalStarsPanel";
import { ComingSoonChapterStrip } from "@/components/campaign/ComingSoonChapterStrip";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import {
  CAMPAIGN_OVERVIEW_CHAPTERS,
  CAMPAIGN_OVERVIEW_CHAPTER_DETAILS,
  CAMPAIGN_OVERVIEW_TOTAL_STARS,
  CAMPAIGN_OVERVIEW_STAR_REWARDS,
  CAMPAIGN_OVERVIEW_COMING_SOON,
  CAMPAIGN_OVERVIEW_COMING_SOON_PAGINATION_DOTS,
  type ChapterOverviewCard,
} from "@/data/campaignOverview";
import { CHAPTER_BACKGROUND_IMAGE, MODE_ILLUSTRATION } from "@/data/assetRegistry";
import { pathFor } from "@/app/routes";
import "./CampaignOverviewScreen.css";

interface ComingSoonState {
  title: string;
  message: string;
}

// Only 2 chapter-scale illustrations exist in the project (see
// CAMPAIGN_OVERVIEW_PLAN.md's chapter-art substitution note): Chapter 1's
// own background and the "Shattered Nebula" scene already used on Battle
// Hub for Chapter 2. Chapters 3-5 reuse those same two images with
// different hue/saturation/brightness treatments so each locked card still
// reads as visually distinct, per instruction — never fully blacked out.
const CHAPTER_ART: Record<string, { art: string; filter?: string }> = {
  "chapter-01": { art: CHAPTER_BACKGROUND_IMAGE["chapter-01"] },
  "chapter-02": { art: MODE_ILLUSTRATION.campaign },
  "chapter-03": { art: CHAPTER_BACKGROUND_IMAGE["chapter-01"], filter: "hue-rotate(45deg) saturate(1.4) brightness(0.85)" },
  "chapter-04": { art: MODE_ILLUSTRATION.campaign, filter: "hue-rotate(-45deg) saturate(1.3) brightness(0.85)" },
  "chapter-05": { art: CHAPTER_BACKGROUND_IMAGE["chapter-01"], filter: "hue-rotate(300deg) saturate(1.7) brightness(0.75)" },
};

export function CampaignOverviewScreen() {
  const { player } = usePlayerStore();
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);
  // Selection is local UI state keyed by stable chapter id — never an array index.
  const [selectedChapterId, setSelectedChapterId] = useState("chapter-01");
  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const goToChapterMap = (chapterId: string) => {
    const chapter = CAMPAIGN_OVERVIEW_CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter || chapter.status === "locked") {
      openComingSoon(
        chapter ? `Chapter ${chapter.chapterIndex}` : "Chapter Unavailable",
        chapter
          ? `Chapter ${chapter.chapterIndex} unlocks after clearing the previous chapter.`
          : "That chapter isn't available.",
      );
      return;
    }
    // Route is built from the resolved chapter id, not a hard-coded Chapter 2 path.
    window.location.hash = `${pathFor("campaign-chapter-map")}?chapter=${encodeURIComponent(chapter.id)}`;
  };

  const carouselItems: ChapterCarouselItem[] = useMemo(
    () =>
      CAMPAIGN_OVERVIEW_CHAPTERS.map((chapter) => ({
        chapter,
        art: CHAPTER_ART[chapter.id]?.art ?? MODE_ILLUSTRATION.campaign,
        artFilter: CHAPTER_ART[chapter.id]?.filter,
      })),
    []
  );

  const handleCardSelect = (chapter: ChapterOverviewCard) => {
    if (chapter.status === "locked") {
      openComingSoon(`Chapter ${chapter.chapterIndex}`, `Chapter ${chapter.chapterIndex} unlocks after clearing the previous chapter.`);
      return;
    }
    setSelectedChapterId(chapter.id);
  };

  const selectedDetail =
    CAMPAIGN_OVERVIEW_CHAPTER_DETAILS[selectedChapterId] ?? CAMPAIGN_OVERVIEW_CHAPTER_DETAILS["chapter-01"];
  const selectedArt = CHAPTER_ART[selectedChapterId]?.art ?? MODE_ILLUSTRATION.campaign;

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
        footer={<HubBottomNav active="battle" onComingSoon={openComingSoon} />}
      >
        <div className="campaign-overview__content">
          <ScreenHeader
            title="CAMPAIGN"
            subtitle="Explore the war sectors"
            trailing={
              <SecondaryButton
                onClick={() => goToChapterMap(selectedChapterId)}
                className="campaign-overview__chapter-map-btn"
              >
                <BattleModeIcon variant="mapPin" size={15} />
                Chapter Map
              </SecondaryButton>
            }
          />

          <ChapterCarousel
            items={carouselItems}
            selectedChapterId={selectedChapterId}
            onCardSelect={handleCardSelect}
          />
          <ChapterProgressRail chapters={CAMPAIGN_OVERVIEW_CHAPTERS} />

          <ChapterDetailPanel
            detail={selectedDetail}
            art={selectedArt}
            onOpenChapter={() => goToChapterMap(selectedChapterId)}
          />

          <div className="campaign-overview__rewards-row">
            <ChapterStarRewardsTrack
              milestones={CAMPAIGN_OVERVIEW_STAR_REWARDS}
              onSelectMilestone={(milestone) =>
                openComingSoon(
                  `${milestone.stars}-Star Reward`,
                  milestone.state === "claimed"
                    ? "You've already claimed this reward."
                    : "Chapter star reward details are coming soon."
                )
              }
            />
            <TotalStarsPanel
              current={CAMPAIGN_OVERVIEW_TOTAL_STARS.current}
              max={CAMPAIGN_OVERVIEW_TOTAL_STARS.max}
              onOpenStarRewards={() => openComingSoon("Star Rewards", "Chapter Star Rewards detail is coming soon.")}
            />
          </div>

          <ComingSoonChapterStrip
            chapters={CAMPAIGN_OVERVIEW_COMING_SOON}
            paginationDots={CAMPAIGN_OVERVIEW_COMING_SOON_PAGINATION_DOTS}
            onSelectChapter={(chapter) =>
              openComingSoon(`Chapter ${chapter.chapterIndex}`, `Chapter ${chapter.chapterIndex} unlocks in a future update.`)
            }
          />
        </div>
      </HubScreenShell>

      <LockedContentModal
        open={comingSoon !== null}
        title={comingSoon?.title ?? ""}
        unlockRequirement={comingSoon?.message ?? "Coming soon."}
        onClose={() => setComingSoon(null)}
      />
    </>
  );
}
