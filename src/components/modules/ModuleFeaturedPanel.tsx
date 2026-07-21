import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { ModuleInventoryItem } from "@/data/moduleInventory";

interface ModuleFeaturedPanelProps {
  module: ModuleInventoryItem;
  shipName?: string;
  shipLevel?: number;
  shipArt?: string;
  onDetails: () => void;
  onEquip: () => void;
  onUpgrade: () => void;
}

export function ModuleFeaturedPanel({ module, shipName, shipLevel, shipArt, onDetails, onEquip, onUpgrade }: ModuleFeaturedPanelProps) {
  const equipLabel = !module.owned ? "Locked" : module.equipped ? "Equipped" : "Equip";
  return (
    <section className={`module-featured module-featured--${module.rarity}${!module.owned ? " module-featured--locked" : ""}`} aria-label={`Selected module: ${module.name}`}>
      <div className="module-featured__identity">
        <span className="module-featured__rarity">{module.rarity}</span>
        <div className="module-featured__art">
          {module.artwork ? <img src={module.artwork} alt="" /> : <span>Art unavailable</span>}
        </div>
        <span className="module-featured__slot">Slot type <strong>{module.slotLabel}</strong></span>
      </div>

      <div className="module-featured__copy">
        <div className="module-featured__heading">
          <h2>{module.name}</h2>
          {module.equipped ? <em>Equipped</em> : null}
        </div>
        <p className="module-featured__level">Lv. {module.level} / 80 {module.upgradeState === "max-level" ? <b>Max Level</b> : null}</p>
        <p className="module-featured__description">{module.description}</p>
        <div className="module-featured__stats">
          {module.statRows.map((row) => (
            <span key={row.key}><img src={row.icon} alt="" /><strong>{row.formattedValue}</strong> {row.label}</span>
          ))}
        </div>
      </div>

      <div className="module-featured__context">
        <span>Power Contribution</span>
        <strong className="module-featured__power"><img src={RESOURCE_ICON.power} alt="" />{module.power.toLocaleString()}</strong>
        {module.equipped && shipName ? (
          <div className="module-featured__ship">
            <span>Equipped On</span>
            {shipArt ? <img src={shipArt} alt="" /> : null}
            <strong>{shipName}</strong>
            {shipLevel ? <small>Lv. {shipLevel}</small> : null}
          </div>
        ) : (
          <p>{module.owned ? `${module.slotLabel} loadout slot` : "Acquire this module to equip it."}</p>
        )}
      </div>

      <div className="module-featured__actions">
        <SecondaryButton onClick={onDetails}>Details</SecondaryButton>
        <SecondaryButton disabled={!module.owned || module.equipped} onClick={onEquip}>{equipLabel}</SecondaryButton>
        <PrimaryButton onClick={onUpgrade}>Upgrade Module</PrimaryButton>
      </div>
    </section>
  );
}
