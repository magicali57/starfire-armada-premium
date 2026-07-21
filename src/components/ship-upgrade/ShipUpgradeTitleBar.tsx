import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import "./ShipUpgradeTitleBar.css";

interface ShipUpgradeTitleBarProps {
  onBack: () => void;
}

/**
 * Title region directly below HubHeader: back button on the left, "SHIP
 * LEVEL UP" / "Upgrade your ship core stats" centered, reproducing
 * 11_Ship_Level_Up.png. A same-width invisible spacer mirrors the back
 * button on the right so the CSS grid's center column is the true visual
 * center of the row regardless of the back button's own width — not just
 * centered within the remaining space next to it.
 */
export function ShipUpgradeTitleBar({ onBack }: ShipUpgradeTitleBarProps) {
  return (
    <div className="ship-upgrade-title-bar">
      <button
        type="button"
        className="ship-upgrade-title-bar__back press-scale"
        aria-label="Back to Ship Detail"
        onClick={onBack}
      >
        <BattleModeIcon variant="chevron" size={16} style={{ transform: "rotate(180deg)" }} />
      </button>
      <div className="ship-upgrade-title-bar__text">
        <h1 className="ship-upgrade-title-bar__title">Ship Level Up</h1>
        <p className="ship-upgrade-title-bar__subtitle">Upgrade your ship core stats</p>
      </div>
      <span className="ship-upgrade-title-bar__spacer" aria-hidden="true" />
    </div>
  );
}
