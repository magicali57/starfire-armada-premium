import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ChapterMapHeaderBar } from "@/components/campaign-map/ChapterMapHeaderBar";
import { ChapterMapIntroPanel } from "@/components/campaign-map/ChapterMapIntroPanel";
import { ChapterStarChestTrack } from "@/components/campaign-map/ChapterStarChestTrack";
import { StageMapPath } from "@/components/campaign-map/StageMapPath";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import {
  CHAPTER_MAP_INFO,
  CHAPTER_MAP_INTRO_REWARDS,
  CHAPTER_MAP_CHEST_TRACK,
  CAMPAIGN_CHAPTER_MAP_LEFT_STAGES,
  CAMPAIGN_CHAPTER_MAP_RIGHT_STAGES,
  type StageMapNode,
  type ChestMilestone,
} from "@/data/campaignChapterMap";
import { navigate, pathFor } from "@/app/routes";
import "./CampaignChapterMapScreen.css";

interface InfoModalState {
  title: string;
  message: string;
}

export function CampaignChapterMapScreen() {
  const { player } = usePlayerStore();
  const [modal, setModal] = useState<InfoModalState | null>(null);
  const openModal = (title: string, message: string) => setModal({ title, message });

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const handleSelectStage = (stage: StageMapNode) => {
    if (stage.state === "locked") {
      const copy = stage.isBoss
        ? `Clear Stage ${stage.index - 1} to challenge the Stage ${stage.index} boss.`
        : `Clear Stage ${stage.index - 1} to unlock Stage ${stage.index}.`;
      openModal(`Stage ${stage.index}${stage.isBoss ? " · Boss" : ""}`, copy);
      return;
    }
    // Stages 1-7 (completed/current) — the real Campaign Stage Detail
    // screen. The hash router only exact-matches routes (no param parsing),
    // so the selected stage id rides along as a "?id=" suffix that
    // `resolveRoute` strips before its dictionary lookup — see routes.tsx.
    window.location.hash = `${pathFor("stage-detail")}?id=${stage.id}`;
  };

  const handleSelectChest = (milestone: ChestMilestone) => {
    if (milestone.state === "claimed") {
      openModal(`${milestone.stars}-Star Chest`, "You've already claimed this reward.");
      return;
    }
    if (milestone.state === "claimable") {
      openModal(`${milestone.stars}-Star Chest`, "Reward claiming isn't wired up yet — coming soon.");
      return;
    }
    openModal(`${milestone.stars}-Star Chest`, `Reach ${milestone.stars} chapter stars to unlock this reward.`);
  };

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openModal} />}
        footer={<HubBottomNav active="battle" onComingSoon={openModal} />}
      >
        <div className="chapter-map__content">
          <ChapterMapHeaderBar
            chapterIndex={CHAPTER_MAP_INFO.chapterIndex}
            chapterName={CHAPTER_MAP_INFO.name}
            onBack={() => navigate("campaign")}
            onInfo={() =>
              openModal(`Chapter ${CHAPTER_MAP_INFO.chapterIndex}`, CHAPTER_MAP_INFO.description)
            }
          />

          <ChapterMapIntroPanel
            description={CHAPTER_MAP_INFO.description}
            rewards={CHAPTER_MAP_INTRO_REWARDS}
            onViewRewards={() =>
              openModal("Chapter Rewards", "Full chapter reward details aren't built yet — coming soon.")
            }
          />

          <ChapterStarChestTrack
            current={CHAPTER_MAP_INFO.chapterStars.current}
            max={CHAPTER_MAP_INFO.chapterStars.max}
            milestones={CHAPTER_MAP_CHEST_TRACK}
            onSelectMilestone={handleSelectChest}
          />

          <StageMapPath
            leftStages={CAMPAIGN_CHAPTER_MAP_LEFT_STAGES}
            rightStages={CAMPAIGN_CHAPTER_MAP_RIGHT_STAGES}
            onSelectStage={handleSelectStage}
          />
        </div>
      </HubScreenShell>

      <LockedContentModal
        open={modal !== null}
        title={modal?.title ?? ""}
        unlockRequirement={modal?.message ?? "Coming soon."}
        onClose={() => setModal(null)}
      />
    </>
  );
}
