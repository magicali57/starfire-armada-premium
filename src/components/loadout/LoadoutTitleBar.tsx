import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import "./LoadoutTitleBar.css";

interface LoadoutTitleBarProps {
  onBack: () => void;
}

/**
 * Title region directly below HubHeader: back button on the left, "LOADOUT"
 * / "Configure your ship, weapons, and modules" centered, reproducing
 * 10_Loadout_Manager.png. Same balancing-spacer structure as
 * ShipUpgradeTitleBar (not reused directly — that component's copy is
 * hard-coded to Ship Level Up's own title/subtitle — but the same layout
 * recipe). Back itself does not decide where to go or whether to warn about
 * unsaved changes — LoadoutManagerScreen owns that logic and passes in the
 * already-resolved handler.
 */
export function LoadoutTitleBar({ onBack }: LoadoutTitleBarProps) {
  return (
    <div className="loadout-title-bar">
      <button
        type="button"
        className="loadout-title-bar__back press-scale"
        aria-label="Back"
        onClick={onBack}
      >
        <BattleModeIcon variant="chevron" size={16} style={{ transform: "rotate(180deg)" }} />
      </button>
      <div className="loadout-title-bar__text">
        <h1 className="loadout-title-bar__title">Loadout</h1>
        <p className="loadout-title-bar__subtitle">Configure your ship, weapons, and modules</p>
      </div>
      <span className="loadout-title-bar__spacer" aria-hidden="true" />
    </div>
  );
}
