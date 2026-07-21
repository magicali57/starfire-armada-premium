import { useMemo } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { getStageMapNodeById } from "@/data/campaignChapterMap";
import { navigate } from "@/app/routes";
import "./StageDetailPlaceholderScreen.css";

/**
 * Minimal temporary destination for tapping a playable stage node on the
 * Chapter Map — exists only so those taps aren't dead links while the real
 * Stage Detail screen isn't built yet. Deliberately bare: stage number/
 * name, a "coming soon" message, and a way back. No gameplay, rewards,
 * loadout, objectives, or Pre-Battle behavior — that's the real Stage
 * Detail screen's job, not this placeholder's.
 */
export function StageDetailPlaceholderScreen() {
  const { player } = usePlayerStore();
  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  // The hash router only exact-matches routes, so the selected stage id
  // rides along as a "?id=" suffix on the hash (set by
  // CampaignChapterMapScreen) rather than a parsed path segment — read
  // directly here since this is display-only, not routing logic.
  const stageId = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return undefined;
    const params = new URLSearchParams(hash.slice(queryIndex + 1));
    return params.get("id") ?? undefined;
  }, []);

  const stage = stageId ? getStageMapNodeById(stageId) : undefined;

  return (
    <HubScreenShell
      header={
        <HubHeader
          player={player}
          xpPct={xpPct}
          onOpen={() => {
            /* no-op: header taps aren't wired on this placeholder */
          }}
        />
      }
      footer={
        <HubBottomNav
          active="battle"
          onComingSoon={() => {
            /* no-op: nav Coming-Soon taps aren't wired on this placeholder */
          }}
        />
      }
    >
      <div className="stage-detail-placeholder__content">
        <div className="stage-detail-placeholder__card">
          <span className="stage-detail-placeholder__eyebrow">
            {stage ? `Stage ${stage.index}` : "Stage Detail"}
          </span>
          <h1 className="stage-detail-placeholder__title">Stage Detail Coming Soon</h1>
          <p className="stage-detail-placeholder__message">
            The full Stage Detail screen — enemy preview, Energy cost, recommended Power, and objectives —
            isn't built yet. This is a placeholder so stage nodes aren't dead links.
          </p>
          <SecondaryButton fullWidth onClick={() => navigate("campaign-chapter-map")}>
            Back to Chapter Map
          </SecondaryButton>
        </div>
      </div>
    </HubScreenShell>
  );
}
