import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { BattleResultsView } from "@/systems/battleSession";
import "./BattleResultActions.css";

interface BattleResultActionsProps {
  availableActions: BattleResultsView["availableActions"];
  /** True while a fresh session is being created (Replay/Retry in
   *  flight) — every action is disabled so a double-tap can never create
   *  two sessions or double-spend Energy. */
  busy: boolean;
  onContinue: () => void;
  onReplay: () => void;
  onRetry: () => void;
  onCampaign: () => void;
}

/**
 * Victory: Continue (only when a next stage is unlocked) / Replay /
 * Campaign. Defeat: Retry / Campaign. Every handler is owned by
 * ResultsScreen — this component only renders the buttons the canonical
 * `availableActions` list actually offers and disables all of them while
 * `busy`.
 */
export function BattleResultActions({
  availableActions,
  busy,
  onContinue,
  onReplay,
  onRetry,
  onCampaign,
}: BattleResultActionsProps) {
  return (
    <div className="battle-result-actions">
      {availableActions.includes("continue") ? (
        <PrimaryButton fullWidth onClick={onContinue} disabled={busy}>
          Continue
        </PrimaryButton>
      ) : null}
      {availableActions.includes("replay") ? (
        <SecondaryButton fullWidth onClick={onReplay} disabled={busy}>
          <BattleModeIcon variant="refresh" size={14} />
          Replay
        </SecondaryButton>
      ) : null}
      {availableActions.includes("retry") ? (
        <PrimaryButton fullWidth onClick={onRetry} disabled={busy}>
          <BattleModeIcon variant="refresh" size={14} />
          Retry
        </PrimaryButton>
      ) : null}
      {availableActions.includes("return-to-campaign") ? (
        <SecondaryButton fullWidth onClick={onCampaign} disabled={busy}>
          Campaign
        </SecondaryButton>
      ) : null}
    </div>
  );
}
