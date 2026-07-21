import { RESOURCE_ICON, SLOT_ICON } from "@/data/assetRegistry";
import type { ModuleDetailViewModel } from "@/data/moduleDetail";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";

export function ModuleDetailHero({ module }: { module: ModuleDetailViewModel }) {
  return (
    <section className={`module-detail-hero${module.owned ? "" : " module-detail-hero--locked"}`}>
      <div className="module-detail-hero__visual">
        <div className="module-detail-hero__badges">
          <span style={{ color: rarityColorVar(module.rarity), borderColor: rarityColorVar(module.rarity) }}>
            {RARITY_LABEL[module.rarity].toUpperCase()}
          </span>
          <strong>
            <img src={SLOT_ICON[module.slot]} alt="" />
            {module.slotLabel.toUpperCase()}
          </strong>
        </div>
        <div className="module-detail-hero__art">
          {module.artwork ? <img src={module.artwork} alt={`${module.name} module artwork`} /> : null}
          {!module.owned ? <span>LOCKED</span> : null}
        </div>
      </div>

      <div className="module-detail-hero__content">
        <h2>{module.name}</h2>
        <p>{module.description}</p>
        <div className="module-detail-hero__metrics">
          <span><small>Level</small><strong>{module.level.toLocaleString()}</strong></span>
          <span><small>Power</small><strong><img src={RESOURCE_ICON.power} alt="" />{module.power.toLocaleString()}</strong></span>
        </div>
        <div className="module-detail-hero__effects">
          <h3>Module Effect</h3>
          {module.statRows.map((row) => (
            <p key={row.key}><img src={row.icon} alt="" /><strong>{row.formattedValue}</strong> {row.label}</p>
          ))}
        </div>
        {module.equipped ? <em className="module-detail-hero__equipped">Equipped</em> : null}
      </div>
    </section>
  );
}
