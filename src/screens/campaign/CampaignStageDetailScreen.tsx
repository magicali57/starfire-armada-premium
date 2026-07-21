import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { IconButton } from "@/components/controls/IconButton";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { StageMissionPanel } from "@/components/stage-detail/StageMissionPanel";
import { StageObjectiveRow } from "@/components/stage-detail/StageObjectiveRow";
import { StageRewardsRow } from "@/components/stage-detail/StageRewardsRow";
import { StageLoadoutPanel } from "@/components/stage-detail/StageLoadoutPanel";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { getStageMapNodeById } from "@/data/campaignChapterMap";
import { getStageDetailContent, type StageRewardItem } from "@/data/campaignStageDetail";
import { SHIP_ROSTER_ART, COMPANION_ART } from "@/data/assetRegistry";
import { navigate, pathFor } from "@/app/routes";
import "./CampaignStageDetailScreen.css";

interface ModalState {
  title: string;
  message: string;
}

// "Void Reaper" / "Rapid Drone" (the reference's loadout names) aren't real
// ship/companion ids — see campaignStageDetail.ts. Closest available art by
// silhouette/color: ship-01-rapid-fire's roster art (white/red/purple
// winged fighter) and the missileDrone companion (dark body, red/orange
// accents). Disclosed substitution, not a real loadout lookup.
const LOADOUT_SHIP_ART = SHIP_ROSTER_ART["ship-01-rapid-fire"] ?? "";
const LOADOUT_COMPANION_ART = COMPANION_ART.missileDrone;

export function CampaignStageDetailScreen() {
  const { player } = usePlayerStore();
  const [modal, setModal] = useState<ModalState | null>(null);
  const openModal = (title: string, message: string) => setModal({ title, message });

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const stageId = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return undefined;
    return new URLSearchParams(hash.slice(queryIndex + 1)).get("id") ?? undefined;
  }, []);

  const stageNode = stageId ? getStageMapNodeById(stageId) : undefined;
  const content = stageNode ? getStageDetailContent(stageNode.id, stageNode.index, 2) : undefined;

  const handleSelectReward = (reward: StageRewardItem) => {
    openModal(`${reward.amount} Reward`, "Reward details aren't wired up yet — coming soon.");
  };

  const handlePrepare = () => {
    if (!stageId) return;
    window.location.hash = `${pathFor("pre-battle-placeholder")}?id=${stageId}`;
  };

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openModal} />}
        footer={<HubBottomNav active="battle" onComingSoon={openModal} />}
      >
        <div className="stage-detail__content">
          <IconButton
            icon={<BattleModeIcon variant="chevron" size={18} style={{ transform: "rotate(180deg)" }} />}
            label="Back to Chapter Map"
            className="stage-detail__back-btn"
            onClick={() => navigate("campaign-chapter-map")}
          />

          <ScreenHeader
            title="Stage Detail"
            subtitle={content ? `Chapter ${content.chapterIndex} · Stage ${content.stageIndex}` : undefined}
          />

          {!content ? (
            <div className="stage-detail__not-found">
              <p>Stage not found.</p>
              <SecondaryButton onClick={() => navigate("campaign-chapter-map")}>
                Back to Chapter Map
              </SecondaryButton>
            </div>
          ) : (
            <>
              {!content.isReferenceMatched ? (
                <p className="stage-detail__prototype-note">
                  Prototype layout — this stage reuses Stage 7's reference-matched design with placeholder
                  copy until real per-stage data exists.
                </p>
              ) : null}

              <StageMissionPanel content={content} />

              <div className="stage-detail__objectives">
                <h3 className="stage-detail__objectives-heading">Objectives</h3>
                {content.objectives.map((objective) => (
                  <StageObjectiveRow key={objective.id} objective={objective} />
                ))}
              </div>

              <StageRewardsRow
                firstClearRewards={content.firstClearRewards}
                repeatRewards={content.repeatRewards}
                onSelectReward={handleSelectReward}
              />

              <StageLoadoutPanel
                ship={content.loadoutShip}
                shipArt={LOADOUT_SHIP_ART}
                companion={content.loadoutCompanion}
                companionArt={LOADOUT_COMPANION_ART}
                totalPower={content.totalPower}
              />

              <div className="stage-detail__actions">
                <SecondaryButton
                  className="stage-detail__view-rewards"
                  onClick={() => openModal("Chapter Rewards", "Full reward details aren't built yet — coming soon.")}
                >
                  <BattleModeIcon variant="gift" size={16} />
                  View Rewards
                </SecondaryButton>

                <PrimaryButton className="stage-detail__prepare" onClick={handlePrepare}>
                  <span className="stage-detail__prepare-label">Prepare</span>
                  <span className="stage-detail__prepare-cost">
                    <BattleModeIcon variant="energy" size={13} />
                    {content.energyCost}
                  </span>
                </PrimaryButton>
              </div>

              <button
                type="button"
                className="stage-detail__change-loadout press-scale"
                onClick={() => {
                  if (!stageId) return;
                  window.location.hash = `${pathFor("loadout")}?return=stage-detail&stage=${stageId}`;
                }}
              >
                <BattleModeIcon variant="refresh" size={13} />
                Change Loadout
              </button>
            </>
          )}
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
