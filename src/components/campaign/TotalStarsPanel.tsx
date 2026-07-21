import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import "./TotalStarsPanel.css";

interface TotalStarsPanelProps {
  current: number;
  max: number;
  onOpenStarRewards: () => void;
}

/**
 * Small side panel next to the star-rewards track — account-wide total,
 * distinct from any single chapter's own star count (see
 * campaignOverview.ts for why these two numbers are intentionally
 * different). The button opens `LockedContentModal` since no dedicated
 * rewards-detail screen exists yet.
 */
export function TotalStarsPanel({ current, max, onOpenStarRewards }: TotalStarsPanelProps) {
  return (
    <div className="total-stars-panel">
      <h3 className="total-stars-panel__heading">Total Chapter Stars</h3>
      <div className="total-stars-panel__value">
        <BattleModeIcon variant="star" size={22} />
        <span className="total-stars-panel__current">{current}</span>
      </div>
      <span className="total-stars-panel__max">/{max}</span>
      <SecondaryButton fullWidth className="total-stars-panel__button" onClick={onOpenStarRewards}>
        Star Rewards
      </SecondaryButton>
    </div>
  );
}
