import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON, SLOT_ICON, UTILITY_ICON } from "@/data/assetRegistry";
import type { LoadoutSlotViewModel } from "@/data/loadout";
import type { ModuleSlot } from "@/types";
import "./LoadoutSlotCard.css";

interface LoadoutModuleSlotProps {
  slot: ModuleSlot;
  moduleItem: LoadoutSlotViewModel;
  active: boolean;
  onSelect: () => void;
  onInfo: () => void;
}

const SLOT_LABEL: Record<ModuleSlot, string> = {
  core: "Core",
  plating: "Plating",
  system: "System",
};

/** One module equip tile — reused for all three module slots (Core/
 *  Plating/System); `slot` decides the label/icon only, the tile markup
 *  itself is identical across slots (matching LoadoutCompanionSlot's
 *  compact layout, sharing LoadoutSlotCard.css). Never allows a module from
 *  an incompatible slot to render here — that filtering happens upstream,
 *  in getActiveLoadoutViewModel / getAlternativeItems (data/loadout.ts). */
export function LoadoutModuleSlot({ slot, moduleItem, active, onSelect, onInfo }: LoadoutModuleSlotProps) {
  const classes = [
    "loadout-slot-card",
    "press-scale",
    active ? "loadout-slot-card--active" : "",
    moduleItem.empty ? "loadout-slot-card--empty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} onClick={onSelect} aria-pressed={active}>
      <span className="loadout-slot-card__slot-label">
        <img src={SLOT_ICON[slot]} alt="" />
        {SLOT_LABEL[slot]}
      </span>

      <span className="loadout-slot-card__art-wrap">
        {moduleItem.empty ? (
          <img className="loadout-slot-card__empty-icon" src={UTILITY_ICON.emptySlot} alt="" />
        ) : (
          <img className="loadout-slot-card__art" src={moduleItem.artSrc} alt="" />
        )}
        {!moduleItem.empty ? (
          <button
            type="button"
            className="loadout-slot-card__info"
            aria-label={`${moduleItem.name} details`}
            onClick={(event) => {
              event.stopPropagation();
              onInfo();
            }}
          >
            <BattleModeIcon variant="info" size={11} />
          </button>
        ) : null}
      </span>

      <span className="loadout-slot-card__name">{moduleItem.empty ? "Empty Slot" : moduleItem.name}</span>

      {!moduleItem.empty ? (
        <span className="loadout-slot-card__meta">
          <span>Lv. {moduleItem.level}</span>
          <span className="loadout-slot-card__power">
            <img src={RESOURCE_ICON.power} alt="" />
            {moduleItem.power.toLocaleString()}
          </span>
        </span>
      ) : null}
    </button>
  );
}
