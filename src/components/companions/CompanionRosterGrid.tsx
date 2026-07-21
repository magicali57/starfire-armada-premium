import { SecondaryButton } from "@/components/controls/SecondaryButton";
import type { CompanionRosterItem } from "@/data/companionRoster";
import { CompanionRosterCard } from "./CompanionRosterCard";
import "./CompanionRosterGrid.css";

interface CompanionRosterGridProps {
  items: CompanionRosterItem[];
  focusedId: string | null;
  onSelect: (item: CompanionRosterItem) => void;
  onInfo: (item: CompanionRosterItem) => void;
  onUpgradeInfo: (item: CompanionRosterItem) => void;
  onResetFilters: () => void;
}

/**
 * Data-driven roster grid (17_Companions_Roster.png's card rows) — maps
 * `items` directly rather than 6 hand-written JSX instances, so it stays
 * correct if COMPANIONS ever grows/shrinks. Renders a deliberate empty
 * state with a "Reset Filters" action when a filter leaves nothing to
 * show (never a bare, broken-looking empty grid).
 */
export function CompanionRosterGrid({
  items,
  focusedId,
  onSelect,
  onInfo,
  onUpgradeInfo,
  onResetFilters,
}: CompanionRosterGridProps) {
  if (items.length === 0) {
    return (
      <div className="companion-roster-grid__empty">
        <p>No companions match this filter.</p>
        <SecondaryButton onClick={onResetFilters}>Reset Filters</SecondaryButton>
      </div>
    );
  }

  return (
    <div className="companion-roster-grid">
      {items.map((item) => (
        <CompanionRosterCard
          key={item.id}
          item={item}
          focused={item.id === focusedId}
          onSelect={() => onSelect(item)}
          onInfo={() => onInfo(item)}
          onUpgradeInfo={() => onUpgradeInfo(item)}
        />
      ))}
    </div>
  );
}
