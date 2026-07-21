import { MATERIAL_ICON, RESOURCE_ICON } from "@/data/assetRegistry";
import "./ShipUpgradeCostCard.css";

interface ShipUpgradeCostCardProps {
  atMaxLevel: boolean;
  creditsCost: number;
  creditsBalance: number;
  shipAlloyCost: number;
  shipAlloyBalance: number;
  insufficientCoins: boolean;
  insufficientShipAlloy: boolean;
}

/**
 * "UPGRADE COST" card, reproducing 11_Ship_Level_Up.png: Credits row and
 * Ship Alloy row, each showing the one-level cost over the player's current
 * balance, with insufficient resources highlighted independently (not by
 * color alone — see the `__row--insufficient` treatment's icon/border/text
 * changes together) plus the reference's own guidance line. The user-facing
 * label is "Credits"; the underlying balance is still `player.currencies.coins`
 * (RESOURCE_ICON.credits / CurrencyId "coins" — no rename of the internal key).
 */
export function ShipUpgradeCostCard({
  atMaxLevel,
  creditsCost,
  creditsBalance,
  shipAlloyCost,
  shipAlloyBalance,
  insufficientCoins,
  insufficientShipAlloy,
}: ShipUpgradeCostCardProps) {
  return (
    <div className="ship-upgrade-cost-card glass-panel">
      <h3 className="ship-upgrade-cost-card__heading">
        Upgrade Cost
        <i />
      </h3>

      {atMaxLevel ? (
        <p className="ship-upgrade-cost-card__max">No further upgrades available.</p>
      ) : (
        <>
          <div
            className={`ship-upgrade-cost-card__row${
              insufficientCoins ? " ship-upgrade-cost-card__row--insufficient" : ""
            }`}
          >
            <img className="ship-upgrade-cost-card__icon" src={RESOURCE_ICON.credits} alt="" />
            <span className="ship-upgrade-cost-card__label">Credits</span>
            <span className="ship-upgrade-cost-card__amounts">
              <strong>{creditsCost.toLocaleString()}</strong>
              <span> / {creditsBalance.toLocaleString()}</span>
            </span>
            {insufficientCoins ? (
              <span className="ship-upgrade-cost-card__flag" role="status">
                Not enough
              </span>
            ) : null}
          </div>

          <div
            className={`ship-upgrade-cost-card__row${
              insufficientShipAlloy ? " ship-upgrade-cost-card__row--insufficient" : ""
            }`}
          >
            <img className="ship-upgrade-cost-card__icon" src={MATERIAL_ICON.shipAlloy} alt="" />
            <span className="ship-upgrade-cost-card__label">Ship Alloy</span>
            <span className="ship-upgrade-cost-card__amounts">
              <strong>{shipAlloyCost.toLocaleString()}</strong>
              <span> / {shipAlloyBalance.toLocaleString()}</span>
            </span>
            {insufficientShipAlloy ? (
              <span className="ship-upgrade-cost-card__flag" role="status">
                Not enough
              </span>
            ) : null}
          </div>

          <p className="ship-upgrade-cost-card__hint">Insufficient resources will be highlighted.</p>
        </>
      )}
    </div>
  );
}
