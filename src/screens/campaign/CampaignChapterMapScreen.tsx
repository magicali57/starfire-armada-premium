import { useMemo, useState } from "react";
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
  CHAPTER_MAP_CHEST_TRACK,
  CHAPTER_MAP_INTRO_REWARDS,
  getChapterMapInfo,
  getChapterMapLeftStages,
  getChapterMapRightStages,
  resolveChapterMapIdFromHash,
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

  // Resolve from `?chapter=` — never hard-code Chapter 2. Invalid ids fall
  // back inside `resolveChapterMapIdFromHash` to Chapter 1.
  const chapterId = useMemo(() => resolveChapterMapIdFromHash(window.location.hash), []);
  const mapInfo = getChapterMapInfo(chapterId);
  const leftStages = useMemo(() => getChapterMapLeftStages(chapterId, player), [chapterId, player]);
  const rightStages = useMemo(() => getChapterMapRightStages(chapterId, player), [chapterId, player]);

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
    // Stage ids are canonical for Chapter 1 (`ch1-stage-N`) and prototype
    // `stage-N` for Chapter 2. Stage Detail / Pre-Battle resolve via
    // getStageById first.
    window.location.hash = `${pathFor("stage-detail")}?id=${encodeURIComponent(stage.id)}`;
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
            chapterIndex={mapInfo.chapterIndex}
            chapterName={mapInfo.name}
            onBack={() => navigate("campaign")}
            onInfo={() => openModal(`Chapter ${mapInfo.chapterIndex}`, mapInfo.description)}
          />

          <ChapterMapIntroPanel
            description={mapInfo.description}
            rewards={CHAPTER_MAP_INTRO_REWARDS}
            onViewRewards={() =>
              openModal("Chapter Rewards", "Full chapter reward details aren't built yet — coming soon.")
            }
          />

          <ChapterStarChestTrack
            current={mapInfo.chapterStars.current}
            max={mapInfo.chapterStars.max}
            milestones={CHAPTER_MAP_CHEST_TRACK}
            onSelectMilestone={handleSelectChest}
          />

          <StageMapPath
            leftStages={leftStages}
            rightStages={rightStages}
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
