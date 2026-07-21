import { useEffect } from "react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { NeonPanel } from "@/components/cards/NeonPanel";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { usePlayerStore } from "@/store/playerStore";
import { getBattleResultsView } from "@/systems/battleSession";
import { navigate } from "@/app/routes";
import "./ResultsScreen.css";

/**
 * Minimal Results consumer of the canonical battle-session contract
 * (getBattleResultsView). NOT the polished Results screen — kept
 * deliberately simple pending that task. The old prototype behavior that
 * hand-granted stage coins/crystals here was removed: all rewards are now
 * applied exactly once by the atomic completion transaction BEFORE this
 * screen renders, so nothing here mutates progression. With no completed
 * session to show (direct navigation, reload, stale/mismatched session)
 * it redirects safely to Campaign without touching state.
 */
export function ResultsScreen() {
  const { battleSession, resetBattle } = usePlayerStore();
  const view = getBattleResultsView(battleSession);

  useEffect(() => {
    if (!view) navigate("campaign");
  }, [view]);

  if (!view) return null;

  const finish = (route: "home" | "campaign") => {
    // Clears TEMPORARY session state only — awarded progression persists.
    resetBattle();
    navigate(route);
  };

  const victory = view.outcome === "victory";

  return (
    <div className="results-screen">
      <ScreenHeader
        title={victory ? "Stage Cleared" : "Stage Failed"}
        subtitle={view.stageName}
      />
      <NeonPanel tone="gold" className="results-screen__rewards">
        <h3>{victory ? (view.firstClear ? "First Clear Rewards" : "Rewards") : "No Rewards"}</h3>
        {victory && view.rewards ? (
          view.rewards.rewards.map((reward, i) => {
            const e = reward.entry;
            const label =
              e.kind === "currency"
                ? `${e.amount.toLocaleString()} ${e.currencyId === "coins" ? "Credits" : e.currencyId}`
                : e.kind === "playerXp"
                  ? `${e.amount.toLocaleString()} Player XP`
                  : e.kind === "material"
                    ? `${e.amount.toLocaleString()} ${e.materialId}`
                    : e.kind === "shipFragment"
                      ? `${e.amount.toLocaleString()} ship fragments`
                      : e.kind === "chest"
                        ? `${e.amount}x ${e.chestId}`
                        : e.kind === "consumable"
                          ? `${e.amount}x ${e.consumableId}`
                          : e.collectibleId;
            return <p key={`${reward.source}-${i}`}>{label}</p>;
          })
        ) : (
          <p>{victory ? "—" : "Defeat grants no rewards. Try again!"}</p>
        )}
        {view.playerLevelsGained > 0 ? (
          <p>
            Player Level {view.previousPlayerLevel} → {view.newPlayerLevel}
          </p>
        ) : null}
      </NeonPanel>
      <div className="results-screen__actions">
        <PrimaryButton fullWidth onClick={() => finish("home")}>
          Continue
        </PrimaryButton>
        <SecondaryButton fullWidth onClick={() => finish("campaign")}>
          Back to Campaign
        </SecondaryButton>
      </div>
    </div>
  );
}
