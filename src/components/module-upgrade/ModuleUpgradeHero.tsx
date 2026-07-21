import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { ModuleUpgradeViewModel } from "@/data/moduleUpgrade";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";

export function ModuleUpgradeHero({ module }: { module: ModuleUpgradeViewModel }) {
  return (
    <section className={`module-upgrade-hero${module.owned ? "" : " module-upgrade-hero--locked"}`}>
      <div className="module-upgrade-hero__copy">
        <span className="module-upgrade-hero__rarity" style={{ color: rarityColorVar(module.rarity), borderColor: rarityColorVar(module.rarity) }}>
          {RARITY_LABEL[module.rarity].toUpperCase()}
        </span>
        <h2>{module.name}</h2>
        <small>Slot Type</small><p className="module-upgrade-hero__slot">{module.slotLabel}</p>
        <small>Power</small><p className="module-upgrade-hero__power"><img src={RESOURCE_ICON.power} alt="" />{module.quote.currentPower.toLocaleString()}</p>
      </div>
      <div className="module-upgrade-hero__art-wrap">
        {module.artwork ? <img src={module.artwork} alt={`${module.name} module artwork`} /> : null}
        {!module.owned ? <span className="module-upgrade-hero__lock"><BattleModeIcon variant="lock" size={34} /> Locked</span> : null}
      </div>
      <div className="module-upgrade-hero__progress">
        <span><small>Level</small><strong>{module.quote.currentLevel} / 80</strong></span>
        <span><small>Technology</small><strong>{module.slotLabel}</strong></span>
        {module.equipped ? <em>Equipped</em> : null}
      </div>
    </section>
  );
}
