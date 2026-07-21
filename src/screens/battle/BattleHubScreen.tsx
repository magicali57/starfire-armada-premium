import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { CampaignFeatureCard } from "@/components/cards/CampaignFeatureCard";
import { ModeCard } from "@/components/cards/ModeCard";
import { LockedModeCard } from "@/components/cards/LockedModeCard";
import { CardCornerBadge } from "@/components/feedback/CardCornerBadge";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import {
  BATTLE_HUB_ACTIVE_EVENT,
  BATTLE_HUB_BOSS_RAID,
  BATTLE_HUB_CAMPAIGN_PREVIEW,
  BATTLE_HUB_DAILY_OPERATIONS,
  BATTLE_HUB_TRAINING,
} from "@/data/battleHub";
import { MODE_ILLUSTRATION, RESOURCE_ICON, REWARD_CHEST, UTILITY_ICON } from "@/data/assetRegistry";
import { navigate } from "@/app/routes";
import "./BattleHubScreen.css";

interface ComingSoonState {
  title: string;
  message: string;
}

export function BattleHubScreen() {
  const { player } = usePlayerStore();
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);
  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  // Campaign's Chapter Map / Continue both route to the existing Campaign
  // stage-list screen for now — Campaign Overview, Chapter Map, and
  // Pre-Battle haven't been split into their own screens yet (they're next
  // in the nav map's priority order). See BATTLE_HUB_PLAN.md §16-18.
  const goToCampaign = () => navigate("campaign");

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
        footer={<HubBottomNav active="battle" onComingSoon={openComingSoon} />}
      >
        <div className="battle-hub__content">
          <ScreenHeader title="BATTLE" subtitle="Choose your next operation" />

          <div className="battle-hub__cards">
            <CampaignFeatureCard
              data={BATTLE_HUB_CAMPAIGN_PREVIEW}
              onChapterMap={goToCampaign}
              onContinue={goToCampaign}
            />

            <div className="battle-hub__grid">
              <ModeCard
                tone="cyan"
                icon={<BattleModeIcon variant="calendar" size={20} />}
                title="Daily Operations"
                art={MODE_ILLUSTRATION.dailyOperations}
                statusText={`${BATTLE_HUB_DAILY_OPERATIONS.entriesAvailable} entries available`}
                onSelect={() => openComingSoon("Daily Operations", "Daily Operations is coming soon.")}
              />
              <ModeCard
                tone="purple"
                icon={<BattleModeIcon variant="skull" size={20} />}
                title="Boss Raid"
                art={MODE_ILLUSTRATION.bossRaid}
                statusText={`${BATTLE_HUB_BOSS_RAID.ticketsUsed}/${BATTLE_HUB_BOSS_RAID.ticketsCap} tickets`}
                cornerBadge={
                  BATTLE_HUB_BOSS_RAID.claimAvailable ? (
                    <CardCornerBadge
                      icon={<img src={RESOURCE_ICON.crystals} alt="" width={14} height={14} />}
                      label="Claim Reward"
                      tone="purple"
                    />
                  ) : undefined
                }
                onSelect={() => openComingSoon("Boss Raid", "Boss Raid is coming soon.")}
              />
              <ModeCard
                tone="blue"
                icon={<BattleModeIcon variant="target" size={20} />}
                title="Training"
                art={MODE_ILLUSTRATION.training}
                statusText={BATTLE_HUB_TRAINING.costLabel}
                onSelect={() => openComingSoon("Training", "Training is coming soon.")}
              />
              <ModeCard
                tone="success"
                icon={<img src={UTILITY_ICON.timer} alt="" width={20} height={20} />}
                eyebrow="Active Event"
                title={BATTLE_HUB_ACTIVE_EVENT.name}
                art={MODE_ILLUSTRATION.events}
                statusText={BATTLE_HUB_ACTIVE_EVENT.remainingLabel}
                statusAccent
                cornerBadge={
                  BATTLE_HUB_ACTIVE_EVENT.rewardAvailable ? (
                    <CardCornerBadge
                      icon={<img src={REWARD_CHEST.basic} alt="" width={16} height={16} />}
                      tone="success"
                    />
                  ) : undefined
                }
                onSelect={() => openComingSoon("Active Event", "Active Event details are coming soon.")}
              />
            </div>

            <LockedModeCard
              title="Endless Survival"
              art={MODE_ILLUSTRATION.training}
              onSelect={() => openComingSoon("Endless Survival", "Endless Survival is a post-launch mode — coming soon.")}
            />
          </div>
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
