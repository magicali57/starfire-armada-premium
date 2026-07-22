import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { BattleOutcome } from "@/systems/battleSession";
import type { BattleResultsView } from "@/systems/battleSession";
import "./BattleResultActions.css";

interface BattleResultActionsProps {
  outcome: BattleOutcome;
  availableActions: BattleResultsView["availableActions"];
  busy: boolean;
  /** Shown under Continue when a next stage exists — real stage name only. */
  nextStageLabel?: string | null;
  /** Canonical Energy cost for Replay/Retry — display only. */
  energyCost?: number;
  onContinue: () => void;
  onReplay: () => void;
  onRetry: () => void;
  onCampaign: () => void;
  /** Optional defeat guidance nav — only rendered when provided. */
  onChangeLoadout?: () => void;
}

/**
 * Victory: dominant Continue/Next Stage + Replay + Campaign.
 * Defeat: primary Retry (+ Energy) + optional Change Loadout + Campaign.
 */
export function BattleResultActions({
  outcome,
  availableActions,
  busy,
  nextStageLabel,
  energyCost,
  onContinue,
  onReplay,
  onRetry,
  onCampaign,
  onChangeLoadout,
}: BattleResultActionsProps) {
  const victory = outcome === "victory";

  return (
    <div className={`battle-result-actions battle-result-actions--${victory ? "victory" : "defeat"}`}>
      {availableActions.includes("continue") ? (
        <PrimaryButton
          fullWidth
          className="battle-result-actions__primary battle-result-actions__primary--gold"
          onClick={onContinue}
          disabled={busy}
        >
          <span className="battle-result-actions__primary-label">
            {nextStageLabel ? "Next Stage" : "Continue"}
          </span>
          {nextStageLabel ? <small>{nextStageLabel}</small> : null}
        </PrimaryButton>
      ) : null}

      {availableActions.includes("retry") ? (
        <PrimaryButton
          fullWidth
          className="battle-result-actions__primary battle-result-actions__primary--danger"
          onClick={onRetry}
          disabled={busy}
        >
          <span className="battle-result-actions__primary-label">
            <BattleModeIcon variant="refresh" size={14} />
            Retry
          </span>
          {typeof energyCost === "number" ? <small>Energy {energyCost}</small> : null}
        </PrimaryButton>
      ) : null}

      <div className="battle-result-actions__secondary-row">
        {availableActions.includes("replay") ? (
          <SecondaryButton fullWidth onClick={onReplay} disabled={busy}>
            <BattleModeIcon variant="refresh" size={14} />
            Replay
          </SecondaryButton>
        ) : null}

        {!victory && onChangeLoadout ? (
          <SecondaryButton fullWidth onClick={onChangeLoadout} disabled={busy}>
            <BattleModeIcon variant="swords" size={14} />
            Change Loadout
          </SecondaryButton>
        ) : null}

        {availableActions.includes("return-to-campaign") ? (
          <SecondaryButton fullWidth onClick={onCampaign} disabled={busy}>
            Campaign
          </SecondaryButton>
        ) : null}
      </div>
    </div>
  );
}
