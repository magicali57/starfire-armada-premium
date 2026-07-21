import { useMemo } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { getStageMapNodeById } from "@/data/campaignChapterMap";
import { navigate, pathFor } from "@/app/routes";
import "./PreBattlePlaceholderScreen.css";

/**
 * Minimal temporary destination for the Stage Detail screen's "Prepare"
 * button — exists only so that tap isn't a dead end while the real
 * Pre-Battle screen isn't built yet. Same bare treatment as
 * `StageDetailPlaceholderScreen` was for stage taps one step ago: stage
 * context, a clearly-labeled "coming soon" message, and a way back. No
 * loadout, no gameplay launch.
 */
export function PreBattlePlaceholderScreen() {
  const { player } = usePlayerStore();
  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const stageId = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return undefined;
    return new URLSearchParams(hash.slice(queryIndex + 1)).get("id") ?? undefined;
  }, []);

  const stage = stageId ? getStageMapNodeById(stageId) : undefined;

  const backToStageDetail = () => {
    if (!stageId) {
      navigate("campaign-chapter-map");
      return;
    }
    window.location.hash = `${pathFor("stage-detail")}?id=${stageId}`;
  };

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
      <div className="pre-battle-placeholder__content">
        <div className="pre-battle-placeholder__card">
          <span className="pre-battle-placeholder__eyebrow">
            {stage ? `Stage ${stage.index}` : "Pre-Battle"}
          </span>
          <h1 className="pre-battle-placeholder__title">Pre-Battle Coming Soon</h1>
          <p className="pre-battle-placeholder__message">
            Loadout review, Energy confirmation, and launch into gameplay aren't built yet. This is a
            temporary placeholder so the Prepare button isn't a dead end.
          </p>
          <SecondaryButton fullWidth onClick={backToStageDetail}>
            Back to Stage Detail
          </SecondaryButton>
        </div>
      </div>
    </HubScreenShell>
  );
}
