import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON, SLOT_ICON, UTILITY_ICON } from "@/data/assetRegistry";
import type { LoadoutSlotViewModel } from "@/data/loadout";
import "./LoadoutSlotCard.css";

interface LoadoutCompanionSlotProps {
  companion: LoadoutSlotViewModel;
  active: boolean;
  onSelect: () => void;
  onInfo: () => void;
}

/** Companion equip tile — art/name/rarity omitted deliberately from the
 *  compact view (shown in the Item Information dialog instead) to match the
 *  reference's own compact slot cards; tapping sets the active alternative
 *  category to "companions" (LoadoutManagerScreen owns that state). */
export function LoadoutCompanionSlot({ companion, active, onSelect, onInfo }: LoadoutCompanionSlotProps) {
  const classes = [
    "loadout-slot-card",
    "press-scale",
    active ? "loadout-slot-card--active" : "",
    companion.empty ? "loadout-slot-card--empty" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type="button" className={classes} onClick={onSelect} aria-pressed={active}>
      <span className="loadout-slot-card__slot-label">
        <img src={SLOT_ICON.companion} alt="" />
        Companion
      </span>

      <span className="loadout-slot-card__art-wrap">
        {companion.empty ? (
          <img className="loadout-slot-card__empty-icon" src={UTILITY_ICON.emptySlot} alt="" />
        ) : (
          <img className="loadout-slot-card__art" src={companion.artSrc} alt="" />
        )}
        {!companion.empty ? (
          <button
            type="button"
            className="loadout-slot-card__info"
            aria-label={`${companion.name} details`}
            onClick={(event) => {
              event.stopPropagation();
              onInfo();
            }}
          >
            <BattleModeIcon variant="info" size={11} />
          </button>
        ) : null}
      </span>

      <span className="loadout-slot-card__name">{companion.empty ? "Empty Slot" : companion.name}</span>

      {!companion.empty ? (
        <span className="loadout-slot-card__meta">
          <span>Lv. {companion.level}</span>
          <span className="loadout-slot-card__power">
            <img src={RESOURCE_ICON.power} alt="" />
            {companion.power.toLocaleString()}
          </span>
        </span>
      ) : null}
    </button>
  );
}
