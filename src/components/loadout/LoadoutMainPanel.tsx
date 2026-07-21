import { LoadoutShipPanel } from "./LoadoutShipPanel";
import { LoadoutCompanionSlot } from "./LoadoutCompanionSlot";
import { LoadoutModuleSlot } from "./LoadoutModuleSlot";
import type { ActiveLoadoutViewModel, LoadoutActiveSlot } from "@/data/loadout";
import "./LoadoutMainPanel.css";

interface LoadoutMainPanelProps {
  viewModel: ActiveLoadoutViewModel;
  activeSlot: LoadoutActiveSlot;
  onSelectSlot: (slot: LoadoutActiveSlot) => void;
  onChangeShip: () => void;
  onInfo: (slot: LoadoutActiveSlot) => void;
}

/**
 * Main neon-framed panel — selected ship + companion + 3 module slots, all
 * in one bordered container, matching 10_Loadout_Manager.png's single main
 * panel structure. Purely presentational; all Power/level/rarity numbers
 * come from `viewModel` (getActiveLoadoutViewModel, data/loadout.ts) — no
 * calculation happens here.
 */
export function LoadoutMainPanel({
  viewModel,
  activeSlot,
  onSelectSlot,
  onChangeShip,
  onInfo,
}: LoadoutMainPanelProps) {
  return (
    <div className="loadout-main-panel glass-panel">
      {viewModel.ship ? (
        <LoadoutShipPanel
          ship={viewModel.ship}
          onChangeShip={onChangeShip}
          onInfo={() => onInfo("ship")}
        />
      ) : (
        <div className="loadout-main-panel__no-ship">No ship selected.</div>
      )}

      <div className="loadout-main-panel__slots">
        <LoadoutCompanionSlot
          companion={viewModel.companion}
          active={activeSlot === "companion"}
          onSelect={() => onSelectSlot("companion")}
          onInfo={() => onInfo("companion")}
        />
        <LoadoutModuleSlot
          slot="core"
          moduleItem={viewModel.core}
          active={activeSlot === "core"}
          onSelect={() => onSelectSlot("core")}
          onInfo={() => onInfo("core")}
        />
        <LoadoutModuleSlot
          slot="plating"
          moduleItem={viewModel.plating}
          active={activeSlot === "plating"}
          onSelect={() => onSelectSlot("plating")}
          onInfo={() => onInfo("plating")}
        />
        <LoadoutModuleSlot
          slot="system"
          moduleItem={viewModel.system}
          active={activeSlot === "system"}
          onSelect={() => onSelectSlot("system")}
          onInfo={() => onInfo("system")}
        />
      </div>
    </div>
  );
}
