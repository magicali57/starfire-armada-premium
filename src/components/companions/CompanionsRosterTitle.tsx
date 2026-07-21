import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { CompanionRosterCounts } from "@/data/companionRoster";
import "./CompanionsRosterTitle.css";

interface CompanionsRosterTitleProps {
  onBack: () => void;
  counts: CompanionRosterCounts;
}

/**
 * Title region (17_Companions_Roster.png): Back chevron, "COMPANIONS",
 * subtitle "Support units and drones", and a real owned/total count line
 * ("N of M companions acquired" — never hard-coded, always derived from
 * `counts`, which itself is computed from live COMPANIONS/ownedCompanionIds
 * data). Folds the task's suggested separate "Summary" component into this
 * one file — the count line is one short sentence tightly coupled to the
 * title, and a second component for it would be a meaningless wrapper.
 */
export function CompanionsRosterTitle({ onBack, counts }: CompanionsRosterTitleProps) {
  return (
    <div className="companions-roster-title">
      <button
        type="button"
        className="companions-roster-title__back press-scale"
        onClick={onBack}
        aria-label="Back"
      >
        <BattleModeIcon variant="chevron" size={18} style={{ transform: "rotate(180deg)" }} />
      </button>
      <div className="companions-roster-title__copy">
        <h1 className="companions-roster-title__heading neon-text-primary">Companions</h1>
        <p className="companions-roster-title__subtitle">Support units and drones</p>
        <p className="companions-roster-title__count">
          {counts.owned} of {counts.total} companions acquired
        </p>
      </div>
    </div>
  );
}
