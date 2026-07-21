import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { ModuleInventoryItem } from "@/data/moduleInventory";

interface ModuleInventoryCardProps {
  item: ModuleInventoryItem;
  selected: boolean;
  onSelect: () => void;
  onDetails: () => void;
}

export function ModuleInventoryCard({ item, selected, onSelect, onDetails }: ModuleInventoryCardProps) {
  return (
    <article
      className={`module-inventory-card module-inventory-card--${item.rarity}${selected ? " module-inventory-card--selected" : ""}${!item.owned ? " module-inventory-card--locked" : ""}`}
    >
      <button type="button" className="module-inventory-card__select" onClick={onSelect} aria-pressed={selected}>
        <span className="module-inventory-card__topline">
          <b>{item.rarity}</b>
          {item.equipped ? <em>Equipped</em> : null}
          {!item.equipped && item.upgradeState === "upgrade-ready" ? <em className="module-inventory-card__upgrade">Upgrade ready</em> : null}
          {!item.owned ? <em className="module-inventory-card__locked-label">Locked</em> : null}
        </span>
        <strong className="module-inventory-card__name">{item.name}</strong>
        <span className="module-inventory-card__art">
          {item.artwork ? <img src={item.artwork} alt="" /> : <span>Art unavailable</span>}
        </span>
        <span className="module-inventory-card__level">
          Lv. {item.level}{item.upgradeState === "max-level" ? " / 80" : ""}
        </span>
        <span className="module-inventory-card__slot">{item.slotLabel}</span>
        <span className="module-inventory-card__power">
          <small>Power</small>
          <strong><img src={RESOURCE_ICON.power} alt="" />{item.power.toLocaleString()}</strong>
        </span>
      </button>
      <button type="button" className="module-inventory-card__details" onClick={onDetails}>
        Details
      </button>
    </article>
  );
}
