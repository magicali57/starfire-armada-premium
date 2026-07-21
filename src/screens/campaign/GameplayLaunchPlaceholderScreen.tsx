import { useMemo } from "react";
import { getStageMapNodeById } from "@/data/campaignChapterMap";
import { pathFor } from "@/app/routes";
import "./GameplayLaunchPlaceholderScreen.css";

/**
 * Minimal temporary destination for Pre-Battle's Start button — same bare,
 * disclosed-placeholder treatment `PreBattlePlaceholderScreen` gave Stage
 * Detail's Prepare button one step ago. Stage context only, a clearly
 * labeled "Battle Coming Soon" message, and a way back. No gameplay, no
 * rewards, no fake battle result.
 *
 * No Energy deduction happens anywhere in this screen or on the way to it
 * — PreBattleScreen.tsx's handleStart deliberately does not call
 * spendCurrency before navigating here, since this placeholder is not a
 * successfully created battle session (see the ENERGY DEDUCTION BOUNDARY
 * comment there). Real gameplay integration is explicitly out of scope for
 * this task.
 *
 * Uses Pre-Battle's own full-screen shell convention (no HubHeader/
 * HubBottomNav) rather than HubScreenShell — this route is excluded from
 * the shared bottom nav the same way Pre-Battle's real route is (see
 * AppShell.tsx).
 */
export function GameplayLaunchPlaceholderScreen() {
  const stageId = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return undefined;
    return new URLSearchParams(hash.slice(queryIndex + 1)).get("id") ?? undefined;
  }, []);

  const stage = stageId ? getStageMapNodeById(stageId) : undefined;

  const backToPreBattle = () => {
    if (!stageId) {
      window.location.hash = pathFor("campaign-chapter-map");
      return;
    }
    window.location.hash = `${pathFor("pre-battle-placeholder")}?id=${stageId}`;
  };

  return (
    <div className="battle-launch-placeholder">
      <div className="battle-launch-placeholder__card">
        <span className="battle-launch-placeholder__eyebrow">
          {stage ? `Stage ${stage.index}` : "Battle"}
        </span>
        <h1 className="battle-launch-placeholder__title">Battle Coming Soon</h1>
        <p className="battle-launch-placeholder__message">
          Real gameplay launch isn't built yet. No Energy was spent getting here — this is a temporary
          placeholder so the Start button isn't a dead end.
        </p>
        <button type="button" className="btn btn--secondary btn--full press-scale" onClick={backToPreBattle}>
          Back to Pre-Battle
        </button>
      </div>
    </div>
  );
}
