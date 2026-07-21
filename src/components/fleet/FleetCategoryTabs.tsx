import "./FleetCategoryTabs.css";
import { useEffect, useRef } from "react";

export type FleetCategory = "ships" | "companions" | "modules" | "arsenal";

interface FleetCategoryTabsProps {
  active: FleetCategory;
  onSelectShips: () => void;
  onSelectCompanions: () => void;
  onSelectModules: () => void;
  onSelectArsenal: () => void;
}

/**
 * Shared Fleet-level category switch — the single, reusable control that
 * classifies both Ships (Fleet Roster) and Companions (Companions Roster)
 * under one "FLEET" navigation branch. Rendered identically on both
 * screens; only the `active` prop and the two callbacks differ per screen.
 * Not a generic browser tab strip and not a new shared hub component —
 * `HubHeader`/`HubScreenShell`/`HubBottomNav` are untouched. Screen-level
 * placement only (never inside a ship/companion card or the featured
 * panel).
 *
 * Two real <button> elements, `aria-pressed` carries the programmatic
 * active state (text labels carry the visual/identity state — never
 * color-only). A compact segmented-selector treatment using the project's
 * existing cyan "Fleet" accent (`--color-secondary-*`, the same accent
 * `HubBottomNav`'s own Fleet tab and `CompanionDetailTitleBar` already use)
 * for the active tab, not a generic web-dashboard tab bar.
 */
export function FleetCategoryTabs({ active, onSelectShips, onSelectCompanions, onSelectModules, onSelectArsenal }: FleetCategoryTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);
  return (
    <div ref={tabsRef} className="fleet-category-tabs" role="group" aria-label="Fleet category">
      <button
        type="button"
        className={`fleet-category-tabs__tab press-scale${
          active === "ships" ? " fleet-category-tabs__tab--active" : ""
        }`}
        onClick={onSelectShips}
        aria-pressed={active === "ships"}
        aria-label="View Ships"
      >
        Ships
      </button>
      <button
        type="button"
        className={`fleet-category-tabs__tab press-scale${
          active === "companions" ? " fleet-category-tabs__tab--active" : ""
        }`}
        onClick={onSelectCompanions}
        aria-pressed={active === "companions"}
        aria-label="View Companions"
      >
        Companions
      </button>
      <button
        type="button"
        className={`fleet-category-tabs__tab press-scale${
          active === "modules" ? " fleet-category-tabs__tab--active" : ""
        }`}
        onClick={onSelectModules}
        aria-pressed={active === "modules"}
        aria-label="View Modules"
      >
        Modules
      </button>
      <button type="button" className={`fleet-category-tabs__tab press-scale${active === "arsenal" ? " fleet-category-tabs__tab--active" : ""}`} onClick={onSelectArsenal} aria-pressed={active === "arsenal"} aria-label="View Arsenal">Arsenal</button>
    </div>
  );
}
