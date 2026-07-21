import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { CompanionAcquisitionInfo } from "@/data/companionDetail";
import "./CompanionAcquisitionPanel.css";

interface CompanionAcquisitionPanelProps {
  owned: boolean;
  acquisition: CompanionAcquisitionInfo;
  onGoToInventory: () => void;
}

/**
 * "SOURCE" panel (18_Companion_Detail.png: "Obtained from: Companion
 * Crate" + crate icon). Reuses the acquisition metadata shape Companions
 * Roster already established (CompanionAcquisitionInfo). For owned
 * companions this stays visible as collection context (never shown as
 * locked); for unowned companions it shows the locked treatment plus the
 * same source label. The reference's small "GO TO INVENTORY" link is
 * reproduced as a button that opens the existing "Inventory is coming
 * soon" modal (Inventory Hub doesn't exist yet — same convention
 * HubBottomNav's own Inventory tab already uses elsewhere).
 */
export function CompanionAcquisitionPanel({ owned, acquisition, onGoToInventory }: CompanionAcquisitionPanelProps) {
  return (
    <div className="companion-acquisition-panel glass-panel">
      <h2 className="companion-acquisition-panel__heading">
        Source <i />
      </h2>
      <div className="companion-acquisition-panel__row">
        {!owned ? (
          <span className="companion-acquisition-panel__lock" aria-hidden="true">
            <BattleModeIcon variant="lock" size={20} />
          </span>
        ) : null}
        <div className="companion-acquisition-panel__copy">
          <span className="companion-acquisition-panel__source">{acquisition.sourceLabel}</span>
          <p className="companion-acquisition-panel__description">{acquisition.unlockDescription}</p>
        </div>
      </div>
      <button type="button" className="companion-acquisition-panel__link press-scale" onClick={onGoToInventory}>
        Go to Inventory
      </button>
    </div>
  );
}
