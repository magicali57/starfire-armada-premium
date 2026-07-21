import { MATERIAL_ICON, RESOURCE_ICON } from "@/data/assetRegistry";
import type { CompanionUpgradeViewModel } from "@/data/companionUpgrade";

interface Props {
  companion: CompanionUpgradeViewModel;
  processing: boolean;
  onUpgrade: () => void;
  onRankInfo: () => void;
  onShortageInfo: () => void;
  onSourceInfo: () => void;
}

export function CompanionUpgradeCostPanel({ companion, processing, onUpgrade, onRankInfo, onShortageInfo, onSourceInfo }: Props) {
  const { quote, resources } = companion;
  const disabled = processing || !companion.owned || quote.atMaxLevel || !resources.canAfford;
  return (
    <>
      <section className="companion-upgrade-cost">
        <h2>Upgrade Cost</h2>
        {quote.atMaxLevel ? <p className="companion-upgrade-cost__max">No resources required — this companion is at maximum level.</p> : (
          <div className="companion-upgrade-cost__resources">
            <button type="button" className={resources.shortage === "credits" || resources.shortage === "both" ? "is-short" : ""} onClick={resources.shortage === "credits" || resources.shortage === "both" ? onShortageInfo : undefined}>
              <img src={RESOURCE_ICON.credits} alt="" /><span><small>Credits</small><strong>{resources.creditsCost?.toLocaleString()}</strong><em>Owned {resources.creditsBalance.toLocaleString()}</em></span>
            </button>
            <b>+</b>
            <button type="button" className={resources.shortage === "companion-data" || resources.shortage === "both" ? "is-short" : ""} onClick={onSourceInfo}>
              <img src={MATERIAL_ICON.companionData} alt="" /><span><small>Companion Data</small><strong>{resources.companionDataCost?.toLocaleString()}</strong><em>Owned {resources.companionDataBalance.toLocaleString()}</em></span>
            </button>
          </div>
        )}
        {!quote.atMaxLevel && resources.shortage !== "none" ? <button type="button" className="companion-upgrade-cost__why" onClick={onShortageInfo}>Why is Upgrade unavailable?</button> : null}
        <div className="companion-upgrade-cost__actions">
          <button type="button" className="companion-upgrade-cost__upgrade press-scale" disabled={disabled} onClick={onUpgrade} aria-label={`Upgrade ${companion.name} one level`}>
            <strong>{processing ? "Upgrading…" : quote.atMaxLevel ? "Maximum Level" : "Upgrade"}</strong><small>{quote.atMaxLevel ? "Level 20 reached" : "Increase Level"}</small>
          </button>
          <button type="button" className="companion-upgrade-cost__rank press-scale" disabled={!companion.owned} onClick={onRankInfo}><strong>Rank Up</strong><small>Preview milestones</small></button>
        </div>
      </section>

      <section className="companion-upgrade-source">
        <div><h2>Source</h2><p>Obtained from:</p><strong>{companion.acquisition.sourceLabel}</strong></div>
        <img src={MATERIAL_ICON.companionData} alt="Companion Data material" />
        <button type="button" onClick={onSourceInfo}>Companion Data Sources</button>
      </section>
    </>
  );
}
