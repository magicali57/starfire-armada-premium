import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { MATERIAL_ICON } from "@/data/assetRegistry";
import type { FleetStatusVariant } from "@/data/fleetRoster";
import "./FleetStatusBar.css";

interface FleetStatusBarProps {
  variant: FleetStatusVariant;
  fragmentCurrent: number;
  fragmentMax: number;
}

const LABEL: Record<Exclude<FleetStatusVariant, "locked">, string> = {
  "upgrade-ready": "Upgrade Ready",
  "weapon-upgrade-ready": "Weapon Upgrade Ready",
  "fragment-ready": "Fragment Ready",
  fragments: "Fragments",
};

/**
 * The colored strip along the bottom of a Fleet card (or the plain fragment
 * count for a locked card, which has no colored background in the
 * reference). "Upgrade Ready" / "Weapon Upgrade Ready" show an up-pointing
 * arrow — reused from BattleModeIcon's `chevron` variant rotated -90deg,
 * since no dedicated up-arrow asset exists in the project.
 */
export function FleetStatusBar({ variant, fragmentCurrent, fragmentMax }: FleetStatusBarProps) {
  if (variant === "locked") {
    return (
      <div className="fleet-status-bar fleet-status-bar--locked">
        <img src={MATERIAL_ICON.shipFragment} alt="" className="fleet-status-bar__fragment-icon" />
        <span>
          {fragmentCurrent}/{fragmentMax}
        </span>
      </div>
    );
  }

  const showsArrow = variant === "upgrade-ready" || variant === "weapon-upgrade-ready";
  const showsFragments = variant === "fragment-ready" || variant === "fragments";

  return (
    <div className={`fleet-status-bar fleet-status-bar--${variant}`}>
      {showsArrow ? (
        <BattleModeIcon
          variant="chevron"
          size={13}
          className="fleet-status-bar__arrow"
          style={{ transform: "rotate(-90deg)" }}
        />
      ) : null}
      <span>{LABEL[variant]}</span>
      {showsFragments ? (
        <>
          <img src={MATERIAL_ICON.shipFragment} alt="" className="fleet-status-bar__fragment-icon" />
          <span>
            {fragmentCurrent}/{fragmentMax}
          </span>
        </>
      ) : null}
    </div>
  );
}
