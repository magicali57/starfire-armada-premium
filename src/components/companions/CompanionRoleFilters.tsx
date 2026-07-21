import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { COMPANION_ROLE_FILTER_LABEL, type CompanionRosterFilter } from "@/data/companionRoster";
import { COMPANION_FILTER_ICON } from "./companionRoleStyle";
import "./CompanionRoleFilters.css";

interface CompanionRoleFiltersProps {
  active: CompanionRosterFilter;
  onSelect: (filter: CompanionRosterFilter) => void;
}

const FILTERS: CompanionRosterFilter[] = ["all", "attack", "defense", "repair", "utility"];

/**
 * The 5 role-filter pills (17_Companions_Roster.png's filter row: All /
 * Attack / Defense / Repair / Utility). Same horizontally-scrollable pill
 * pattern as Fleet Roster's FleetRoleFilterBar (contained scroller, never
 * causes document-level horizontal scroll — see CompanionRoleFilters.css),
 * but a separate component/stylesheet since that one is typed to
 * ShipRole, not CompanionRosterFilter.
 */
export function CompanionRoleFilters({ active, onSelect }: CompanionRoleFiltersProps) {
  return (
    <div className="companion-role-filters" role="group" aria-label="Filter companions by role">
      {FILTERS.map((filter) => (
        <button
          key={filter}
          type="button"
          className={`companion-role-filters__pill press-scale${
            filter === active ? " companion-role-filters__pill--active" : ""
          }`}
          onClick={() => onSelect(filter)}
          aria-pressed={filter === active}
        >
          {filter !== "all" ? (
            <BattleModeIcon variant={COMPANION_FILTER_ICON[filter]} size={14} />
          ) : null}
          {COMPANION_ROLE_FILTER_LABEL[filter]}
        </button>
      ))}
    </div>
  );
}
