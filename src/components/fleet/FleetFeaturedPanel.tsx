import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { getShipMasterArt, ROLE_ICON } from "@/data/assetRegistry";
import type { FleetFeaturedPrototype } from "@/data/fleetRoster";
import type { ShipDefinition } from "@/types";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import { FleetStatBlock } from "./FleetStatBlock";
import "./FleetFeaturedPanel.css";

interface FleetFeaturedPanelProps {
  ship: ShipDefinition;
  stats: FleetFeaturedPrototype;
  onDetails: () => void;
  onEquip: () => void;
}

const ROLE_ICON_KEY: Record<ShipDefinition["role"], keyof typeof ROLE_ICON> = {
  Attack: "attack",
  Support: "support",
  Control: "control",
  Heavy: "heavy",
};

export function FleetFeaturedPanel({ ship, stats, onDetails, onEquip }: FleetFeaturedPanelProps) {
  const art = getShipMasterArt(ship.id);
  const roleIconKey = ROLE_ICON_KEY[ship.role];
  const levelPct = Math.round((stats.levelCurrent / stats.levelMax) * 100);

  return (
    <div className="fleet-featured-panel glass-panel">
      <div className="fleet-featured-panel__top">
        <div className="fleet-featured-panel__info">
          <span
            className="fleet-featured-panel__rarity-pill"
            style={{ color: rarityColorVar(ship.rarity), borderColor: rarityColorVar(ship.rarity) }}
          >
            {RARITY_LABEL[ship.rarity].toUpperCase()}
          </span>
          <h2 className="fleet-featured-panel__name">{ship.name}</h2>
          <span className="fleet-featured-panel__role-row">
            <img src={ROLE_ICON[roleIconKey]} alt="" />
            {ship.role.toUpperCase()}
          </span>
          <p className="fleet-featured-panel__description">{ship.shortDescription}</p>
        </div>

        <div className="fleet-featured-panel__art">{art ? <img src={art} alt="" /> : null}</div>
      </div>

      <div className="fleet-featured-panel__ability-row">
        {stats.abilityTiers.map((tier, i) => (
          <div className="fleet-featured-panel__ability-badge" key={i}>
            <span className="fleet-featured-panel__ability-hex">
              <BattleModeIcon variant={tier.iconVariant} size={18} />
            </span>
            <span className="fleet-featured-panel__ability-level">Lv. {tier.level}</span>
          </div>
        ))}
      </div>

      <div className="fleet-featured-panel__stats-col">
        <FleetStatBlock label="Level" progressPct={levelPct}>
          {stats.levelCurrent} <small>/ {stats.levelMax}</small>
        </FleetStatBlock>

        <div className="fleet-stat-block">
          <span className="fleet-stat-block__label">Star Rank</span>
          <div className="fleet-featured-panel__stars">
            {Array.from({ length: stats.starRankMax }).map((_, i) => (
              <BattleModeIcon
                key={i}
                variant="star"
                size={16}
                className={
                  i < stats.starRankCurrent
                    ? "fleet-featured-panel__star fleet-featured-panel__star--filled"
                    : "fleet-featured-panel__star"
                }
              />
            ))}
          </div>
        </div>

        <FleetStatBlock label="Weapon Level">
          {stats.weaponLevelCurrent} <small>/ {stats.weaponLevelMax}</small>
        </FleetStatBlock>

        <FleetStatBlock label="Power">
          <span className="fleet-featured-panel__power">
            <BattleModeIcon variant="swords" size={16} />
            {stats.power.toLocaleString()}
          </span>
        </FleetStatBlock>
      </div>

      <div className="fleet-featured-panel__actions">
        <SecondaryButton onClick={onDetails}>Details</SecondaryButton>
        <PrimaryButton onClick={onEquip}>Equip</PrimaryButton>
      </div>
    </div>
  );
}
