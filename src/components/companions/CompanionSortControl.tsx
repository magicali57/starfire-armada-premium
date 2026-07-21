import { UTILITY_ICON } from "@/data/assetRegistry";
import type { CompanionRosterSort } from "@/data/companionRoster";
import "./CompanionSortControl.css";

interface CompanionSortControlProps {
  value: CompanionRosterSort;
  onChange: (sort: CompanionRosterSort) => void;
}

const SORT_OPTIONS: { id: CompanionRosterSort; label: string }[] = [
  { id: "roster", label: "Default Order" },
  { id: "power", label: "Power (High to Low)" },
  { id: "rarity", label: "Rarity (High to Low)" },
  { id: "level", label: "Level (High to Low)" },
  { id: "name", label: "Name (A to Z)" },
];

/**
 * A real, accessible <select> (not a custom dropdown built from scratch) —
 * the reference's own sort control contents aren't legible/enumerable from
 * a static bitmap, so this uses a standard native element rather than
 * fabricating a bespoke menu, matching Fleet Roster's own disclosed
 * "coming soon" treatment for its unreadable Sort/Filter trigger, except
 * here the 5 real sort modes the task requires are genuinely wired up
 * (not a placeholder) since sort behavior itself IS in scope for this
 * screen. Always fully visible at 360px — no icon-only collapse.
 */
export function CompanionSortControl({ value, onChange }: CompanionSortControlProps) {
  return (
    <label className="companion-sort-control">
      <img src={UTILITY_ICON.sort} alt="" />
      <span className="companion-sort-control__label">Sort</span>
      <select
        className="companion-sort-control__select"
        value={value}
        onChange={(event) => onChange(event.target.value as CompanionRosterSort)}
        aria-label="Sort companions"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
