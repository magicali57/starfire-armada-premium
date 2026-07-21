import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { NeonPanel } from "@/components/cards/NeonPanel";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { getStageById } from "@/data";
import { usePlayerStore } from "@/store/playerStore";
import { navigate } from "@/app/routes";
import "./ResultsScreen.css";

export function ResultsScreen() {
  const { player, markStageCleared, addCurrency } = usePlayerStore();
  const stage = getStageById(player.currentStageId);

  const handleClaim = () => {
    if (!stage) return;
    markStageCleared(stage.id);
    addCurrency("coins", stage.rewardCoins);
    addCurrency("crystals", stage.rewardCrystals);
    navigate("home");
  };

  return (
    <div className="results-screen">
      <ScreenHeader title="Stage Cleared" subtitle={stage?.name} />
      <NeonPanel tone="gold" className="results-screen__rewards">
        <h3>Rewards</h3>
        <p>{stage?.rewardCoins.toLocaleString() ?? 0} coins</p>
        <p>{stage?.rewardCrystals ?? 0} crystals</p>
      </NeonPanel>
      <div className="results-screen__actions">
        <PrimaryButton fullWidth onClick={handleClaim}>
          Claim &amp; Continue
        </PrimaryButton>
        <SecondaryButton fullWidth onClick={() => navigate("campaign")}>
          Back to Campaign
        </SecondaryButton>
      </div>
    </div>
  );
}
