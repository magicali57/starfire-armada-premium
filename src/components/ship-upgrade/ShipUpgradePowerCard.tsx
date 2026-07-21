import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ShipUpgradePowerDisplay } from "@/data/shipUpgrade";
import "./ShipUpgradePowerCard.css";

interface ShipUpgradePowerCardProps {
  power: ShipUpgradePowerDisplay;
}

/**
 * "POWER INCREASE" card, reproducing 11_Ship_Level_Up.png. All numbers come
 * from data/shipUpgrade.ts's getPowerDisplay, which itself is derived from
 * calculateShipLevelUpgradeQuote's current/resulting power — never
 * hard-coded here.
 */
export function ShipUpgradePowerCard({ power }: ShipUpgradePowerCardProps) {
  return (
    <div className="ship-upgrade-power-card glass-panel">
      <h3 className="ship-upgrade-power-card__heading">
        Power Increase
        <i />
      </h3>

      <div className="ship-upgrade-power-card__body">
        <BattleModeIcon variant="swords" size={30} className="ship-upgrade-power-card__icon" />
        <div className="ship-upgrade-power-card__value-col">
          {power.atMaxLevel || power.increase === null ? (
            <span className="ship-upgrade-power-card__max">MAX LEVEL</span>
          ) : (
            <>
              <span className="ship-upgrade-power-card__delta">+{power.increase.toLocaleString()}</span>
              <span className="ship-upgrade-power-card__label">Power</span>
            </>
          )}
        </div>
      </div>

      {!power.atMaxLevel && power.nextPower !== null ? (
        <div className="ship-upgrade-power-card__from-to">
          <span>From</span>
          <strong>{power.currentPower.toLocaleString()}</strong>
          <BattleModeIcon variant="chevron" size={12} />
          <strong className="ship-upgrade-power-card__from-to-next">{power.nextPower.toLocaleString()}</strong>
        </div>
      ) : null}
    </div>
  );
}
