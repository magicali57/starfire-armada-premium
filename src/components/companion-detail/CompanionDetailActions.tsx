import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import "./CompanionDetailActions.css";

interface CompanionDetailActionsProps {
  onUpgrade: () => void;
  onRankUp: () => void;
  disabled: boolean;
}

/**
 * Secondary action row — UPGRADE / RANK UP (18_Companion_Detail.png, right
 * below the Progression preview panels). Both are non-transactional in
 * this phase: they only ever open an informational "coming soon" modal
 * (see CompanionDetailDialog's "upgrade"/"rankUp" kinds) — no level/rank
 * change, no currency or material spend. Disabled entirely for locked
 * companions (nothing to upgrade until owned).
 */
export function CompanionDetailActions({ onUpgrade, onRankUp, disabled }: CompanionDetailActionsProps) {
  return (
    <div className="companion-detail-actions">
      <SecondaryButton onClick={onUpgrade} disabled={disabled}>
        Upgrade
      </SecondaryButton>
      <PrimaryButton onClick={onRankUp} disabled={disabled} className="companion-detail-actions__rank-up">
        Rank Up
      </PrimaryButton>
    </div>
  );
}
