import { FleetCategoryTabs, type FleetCategory } from "@/components/fleet/FleetCategoryTabs";
import "./FleetCollectionHeader.css";

interface FleetCollectionHeaderProps {
  title: string;
  subtitle?: string;
  countText: string;
  activeCategory: FleetCategory;
  onSelectShips: () => void;
  onSelectCompanions: () => void;
  onSelectModules: () => void;
  onSelectArsenal?: () => void;
}

/**
 * Shared collection-header layout for both Fleet Roster and Companions
 * Roster — a centered title/subtitle/acquired-count text block followed by
 * the shared <FleetCategoryTabs> selector. Reused verbatim (not duplicated
 * per screen) so the selector always lands at the exact same vertical
 * position on both screens regardless of how many lines of text sit above
 * it (Fleet has 2 lines — title + count; Companions has 3 — title +
 * subtitle + count).
 *
 * The text block uses a shared `min-height` (see .css) sized for the
 * taller 3-line Companions case; content is vertically centered within it
 * via flexbox, so Fleet's shorter 2-line block sits centered in the same
 * box instead of leaving the selector sitting lower on Fleet than on
 * Companions. This replaces Fleet's previous use of the shared
 * `ScreenHeader` component (whose extra top padding was the source of
 * Fleet's excess top whitespace) and Companions' previous
 * `CompanionsRosterTitle` (whose Back-arrow button is intentionally not
 * reproduced here — see COMPANIONS_FLEET_NAVIGATION_FIX report's Back-arrow
 * discussion and FLEET_COMPANIONS_ALIGNMENT_FIX_REPORT.md for the removal
 * rationale). Neither `ScreenHeader.tsx` nor `CompanionsRosterTitle.tsx`
 * was modified — this is a new, independent, shared component.
 */
export function FleetCollectionHeader({
  title,
  subtitle,
  countText,
  activeCategory,
  onSelectShips,
  onSelectCompanions,
  onSelectModules,
  onSelectArsenal = () => { window.location.hash = "#/arsenal"; },
}: FleetCollectionHeaderProps) {
  return (
    <div className="fleet-collection-header">
      <div className="fleet-collection-header__text">
        <h1 className="fleet-collection-header__title neon-text-primary">{title}</h1>
        {subtitle ? <p className="fleet-collection-header__subtitle">{subtitle}</p> : null}
        <p className="fleet-collection-header__count">{countText}</p>
      </div>

      <FleetCategoryTabs
        active={activeCategory}
        onSelectShips={onSelectShips}
        onSelectCompanions={onSelectCompanions}
        onSelectModules={onSelectModules}
        onSelectArsenal={onSelectArsenal}
      />
    </div>
  );
}
