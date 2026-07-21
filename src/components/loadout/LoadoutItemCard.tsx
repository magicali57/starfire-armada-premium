import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { LoadoutAlternativeItem } from "@/data/loadout";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import "./LoadoutItemCard.css";

interface LoadoutItemCardProps {
  item: LoadoutAlternativeItem;
  onSelect: () => void;
  onInfo: () => void;
}

/**
 * One card in the horizontally-scrolling Alternative Items row — art,
 * name, rarity, level, Power, a selected/locked state, and its own info
 * button (which must not also trigger selection — `stopPropagation`).
 * Locked ships route their tap through the same handler as an unlocked
 * selection; LoadoutManagerScreen decides what "select" means per-kind
 * (open Fleet Roster for ships, update the draft for companions/modules).
 */
export function LoadoutItemCard({ item, onSelect, onInfo }: LoadoutItemCardProps) {
  const classes = [
    "loadout-item-card",
    "press-scale",
    item.selected ? "loadout-item-card--selected" : "",
    item.locked ? "loadout-item-card--locked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      onClick={onSelect}
      aria-pressed={item.selected}
      aria-label={`${item.name}, ${RARITY_LABEL[item.rarity]}${item.locked ? ", locked" : ""}`}
    >
      {item.selected ? <span className="loadout-item-card__selected-badge">Equipped</span> : null}

      <span
        className="loadout-item-card__rarity"
        style={{ color: rarityColorVar(item.rarity), borderColor: rarityColorVar(item.rarity) }}
      >
        {RARITY_LABEL[item.rarity].toUpperCase()}
      </span>

      <span className="loadout-item-card__art-wrap">
        {item.artSrc ? (
          <img
            className={`loadout-item-card__art${item.locked ? " loadout-item-card__art--locked" : ""}`}
            src={item.artSrc}
            alt=""
          />
        ) : null}
        {item.locked ? (
          <span className="loadout-item-card__lock">
            <BattleModeIcon variant="lock" size={16} />
          </span>
        ) : (
          <button
            type="button"
            className="loadout-item-card__info"
            aria-label={`${item.name} details`}
            onClick={(event) => {
              event.stopPropagation();
              onInfo();
            }}
          >
            <BattleModeIcon variant="info" size={12} />
          </button>
        )}
      </span>

      <span className="loadout-item-card__name">{item.name}</span>

      {!item.locked ? (
        <span className="loadout-item-card__meta">
          <span>Lv. {item.level}</span>
          <span className="loadout-item-card__power">
            <img src={RESOURCE_ICON.power} alt="" />
            {item.power.toLocaleString()}
          </span>
        </span>
      ) : null}
    </button>
  );
}
