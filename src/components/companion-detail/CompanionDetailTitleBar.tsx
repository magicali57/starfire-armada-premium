import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import "./CompanionDetailTitleBar.css";

interface CompanionDetailTitleBarProps {
  onBack: () => void;
  companionName: string;
}

/**
 * Title region (18_Companion_Detail.png): Back chevron, "COMPANION DETAIL"
 * heading, and the companion's name as a cyan subtitle. The reference shows
 * the Back chevron merged into the same visual row as the shared header's
 * profile pill — reproduced here as a separate row directly below
 * <HubHeader/> instead (same precedented compromise Companions Roster and
 * Loadout Manager both already use), since HubHeader is a frozen, approved
 * shared component with no back-button prop and must not be modified.
 */
export function CompanionDetailTitleBar({ onBack, companionName }: CompanionDetailTitleBarProps) {
  return (
    <div className="companion-detail-title">
      <button
        type="button"
        className="companion-detail-title__back press-scale"
        onClick={onBack}
        aria-label="Back"
      >
        <BattleModeIcon variant="chevron" size={18} style={{ transform: "rotate(180deg)" }} />
      </button>
      <div className="companion-detail-title__copy">
        <h1 className="companion-detail-title__heading neon-text-primary">Companion Detail</h1>
        <p className="companion-detail-title__subtitle">{companionName}</p>
      </div>
    </div>
  );
}
