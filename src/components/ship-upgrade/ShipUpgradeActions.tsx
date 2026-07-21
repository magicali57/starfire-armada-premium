import { MATERIAL_ICON, RESOURCE_ICON } from "@/data/assetRegistry";
import "./ShipUpgradeActions.css";

interface ShipUpgradeActionsProps {
  atMaxLevel: boolean;
  busy: boolean;
  oneLevelCreditsCost: number;
  oneLevelShipAlloyCost: number;
  canAffordOne: boolean;
  onUpgrade: () => void;
  onUpgradeX5: () => void;
  onMaxPreview: () => void;
}

/**
 * Bottom action row, reproducing 11_Ship_Level_Up.png: a full-width gold
 * UPGRADE button showing the live one-level Credits/Ship Alloy cost, plus
 * two equal secondary buttons (UPGRADE x5, MAX PREVIEW) below it. UPGRADE
 * x5 opens a confirmation modal (handled by the screen) rather than firing
 * five individual upgrades; MAX PREVIEW opens a read-only modal and is
 * never disabled by affordability, since it mutates nothing.
 */
export function ShipUpgradeActions({
  atMaxLevel,
  busy,
  oneLevelCreditsCost,
  oneLevelShipAlloyCost,
  canAffordOne,
  onUpgrade,
  onUpgradeX5,
  onMaxPreview,
}: ShipUpgradeActionsProps) {
  const upgradeDisabled = atMaxLevel || busy || !canAffordOne;
  const upgradeX5Disabled = atMaxLevel || busy;

  return (
    <div className="ship-upgrade-actions">
      <button
        type="button"
        className="ship-upgrade-actions__primary press-scale"
        onClick={onUpgrade}
        disabled={upgradeDisabled}
        aria-label={
          atMaxLevel
            ? "Ship is already at maximum level"
            : canAffordOne
              ? `Upgrade one level for ${oneLevelCreditsCost.toLocaleString()} Credits and ${oneLevelShipAlloyCost.toLocaleString()} Ship Alloy`
              : "Not enough resources to upgrade"
        }
      >
        <span className="ship-upgrade-actions__primary-label">
          {atMaxLevel ? "Max Level" : "Upgrade"}
        </span>
        {atMaxLevel ? null : (
          <span className="ship-upgrade-actions__primary-costs">
            <span className="ship-upgrade-actions__primary-cost">
              <img src={RESOURCE_ICON.credits} alt="" />
              {oneLevelCreditsCost.toLocaleString()}
            </span>
            <span className="ship-upgrade-actions__primary-cost">
              <img src={MATERIAL_ICON.shipAlloy} alt="" />
              {oneLevelShipAlloyCost.toLocaleString()}
            </span>
          </span>
        )}
      </button>

      <div className="ship-upgrade-actions__secondary-row">
        <button
          type="button"
          className="ship-upgrade-actions__secondary ship-upgrade-actions__secondary--x5 press-scale"
          onClick={onUpgradeX5}
          disabled={upgradeX5Disabled}
          aria-label="Preview and confirm upgrading five levels at once"
        >
          Upgrade x5
        </button>
        <button
          type="button"
          className="ship-upgrade-actions__secondary ship-upgrade-actions__secondary--preview press-scale"
          onClick={onMaxPreview}
          disabled={busy}
          aria-label="Preview stats at maximum level"
        >
          Max Preview
        </button>
      </div>
    </div>
  );
}
