import { MATERIAL_ICON, RESOURCE_ICON } from "@/data/assetRegistry";
import type { ModuleUpgradeViewModel } from "@/data/moduleUpgrade";

interface Props {
  module: ModuleUpgradeViewModel;
  processing: boolean;
  onUpgrade: () => void;
  onShortageInfo: () => void;
  onSourceInfo: () => void;
}

export function ModuleUpgradeCostPanel({ module, processing, onUpgrade, onShortageInfo, onSourceInfo }: Props) {
  const { quote, resources } = module;
  const disabled = processing || !module.owned || quote.atMaxLevel || !resources.canAfford;
  return (
    <>
      <section className="module-upgrade-cost">
        <h2>Upgrade Cost</h2>
        {quote.atMaxLevel ? <p className="module-upgrade-cost__max">No resources required — maximum level achieved.</p> : (
          <div className="module-upgrade-cost__resources">
            <button type="button" className={resources.shortage === "credits" || resources.shortage === "both" ? "is-short" : ""} onClick={resources.shortage === "credits" || resources.shortage === "both" ? onShortageInfo : undefined}>
              <img src={RESOURCE_ICON.credits} alt="" /><span><small>Credits</small><strong>{resources.creditsCost?.toLocaleString()}</strong><em>Owned {resources.creditsBalance.toLocaleString()}</em></span>
            </button>
            <b>+</b>
            <button type="button" className={resources.shortage === "module-parts" || resources.shortage === "both" ? "is-short" : ""} onClick={onSourceInfo}>
              <img src={MATERIAL_ICON.moduleParts} alt="" /><span><small>Module Parts</small><strong>{resources.modulePartsCost?.toLocaleString()}</strong><em>Owned {resources.modulePartsBalance.toLocaleString()}</em></span>
            </button>
          </div>
        )}
        {!quote.atMaxLevel && resources.shortage !== "none" ? <button type="button" className="module-upgrade-cost__why" onClick={onShortageInfo}>Why is Upgrade unavailable?</button> : null}
        <button type="button" className="module-upgrade-cost__upgrade press-scale" disabled={disabled} onClick={onUpgrade} aria-label={`Upgrade ${module.name} one level`}>
          <strong>{processing ? "Upgrading…" : quote.atMaxLevel ? "Maximum Level" : "Upgrade"}</strong>
          <small>{quote.atMaxLevel ? "Level 80 reached" : `Level ${quote.currentLevel} → ${quote.nextLevel}`}</small>
        </button>
      </section>
      <section className="module-upgrade-source">
        <div><h2>Module Parts</h2><p>Used to enhance Core, Plating, and System technology.</p></div>
        <img src={MATERIAL_ICON.moduleParts} alt="Module Parts material" />
        <button type="button" onClick={onSourceInfo}>Material Sources</button>
      </section>
    </>
  );
}
