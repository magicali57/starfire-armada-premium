import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { ROLE_ICON, UTILITY_ICON } from "@/data/assetRegistry";
import type { ShipRole } from "@/types";
import "./FleetRoleFilterBar.css";

export type FleetRoleFilter = ShipRole | "All";

interface FleetRoleFilterBarProps {
  active: FleetRoleFilter;
  onSelect: (role: FleetRoleFilter) => void;
  onOpenSortFilter: () => void;
}

const FILTERS: { id: FleetRoleFilter; iconKey?: keyof typeof ROLE_ICON }[] = [
  { id: "All" },
  { id: "Attack", iconKey: "attack" },
  { id: "Support", iconKey: "support" },
  { id: "Control", iconKey: "control" },
  { id: "Heavy", iconKey: "heavy" },
];

/**
 * The 5 role-filter pills + "Sort / Filter" trigger. No search input is
 * built here — the reference frame (02_Fleet_Roster.png) shows no search
 * icon or field anywhere, so one is deliberately not invented (see
 * FLEET_ROSTER_PLAN.md §19-23). The Sort/Filter trigger's own dropdown
 * contents aren't visible in the static reference either, so it opens the
 * disclosed "coming soon" modal via `onOpenSortFilter` rather than a
 * fabricated dropdown UI.
 */
export function FleetRoleFilterBar({ active, onSelect, onOpenSortFilter }: FleetRoleFilterBarProps) {
  return (
    <div className="fleet-role-filter-bar">
      {FILTERS.map((filter) => (
        <button
          key={filter.id}
          type="button"
          className={`fleet-role-filter-bar__pill press-scale${
            filter.id === active ? " fleet-role-filter-bar__pill--active" : ""
          }`}
          onClick={() => onSelect(filter.id)}
          aria-pressed={filter.id === active}
        >
          {filter.iconKey ? <img src={ROLE_ICON[filter.iconKey]} alt="" /> : null}
          {filter.id}
        </button>
      ))}
      <button
        type="button"
        className="fleet-role-filter-bar__sort press-scale"
        onClick={onOpenSortFilter}
      >
        <img src={UTILITY_ICON.filter} alt="" />
        Sort / Filter
        <BattleModeIcon variant="chevron" size={12} style={{ transform: "rotate(90deg)" }} />
      </button>
    </div>
  );
}
