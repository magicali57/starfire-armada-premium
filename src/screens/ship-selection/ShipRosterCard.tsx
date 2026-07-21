import { ShipArt } from "@/components/cards/ShipArt";
import type { ShipDefinition } from "@/types";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import { RARITY_EMBLEM } from "@/data/assetRegistry";
import { calculatePowerScore, calculateShipStats } from "@/systems/shipStats";
import "./ShipRosterCard.css";

interface ShipRosterCardProps {
  ship: ShipDefinition;
  level: number;
  owned: boolean;
  selected: boolean;
  onSelect: () => void;
}

export function ShipRosterCard({ ship, level, owned, selected, onSelect }: ShipRosterCardProps) {
  const stats = calculateShipStats(ship, level);
  const power = calculatePowerScore(stats);
  const locked = !owned;

  return (
    <button
      type="button"
      className={`ship-roster-card press-scale${selected ? " ship-roster-card--selected" : ""}${
        locked ? " ship-roster-card--locked" : ""
      }`}
      style={{ ["--ship-theme-color" as string]: ship.themeColor }}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${ship.name}, ${RARITY_LABEL[ship.rarity]} ${ship.role}${
        locked ? ", locked" : selected ? ", selected" : ""
      }`}
    >
      {ship.tag ? (
        <span className={`ship-roster-card__tag ship-roster-card__tag--${ship.tag}`}>
          {ship.tag === "new" ? "New" : "Featured"}
        </span>
      ) : null}

      <div className="ship-roster-card__art">
        <ShipArt ship={ship} size="md" variant="roster" />
        {locked ? (
          <>
            <div className="ship-roster-card__lock-overlay" aria-hidden="true" />
            <span className="ship-roster-card__lock-badge" aria-hidden="true">
              🔒
            </span>
          </>
        ) : null}
      </div>

      <span className="ship-roster-card__name">{ship.name}</span>
      <span className="ship-roster-card__rarity-row">
        <img src={RARITY_EMBLEM[ship.rarity]} alt="" className="ship-roster-card__rarity-emblem" />
        <span
          className="ship-roster-card__rarity"
          style={{ color: rarityColorVar(ship.rarity) }}
        >
          {RARITY_LABEL[ship.rarity]}
        </span>
      </span>
      <span className="ship-roster-card__role">{ship.role}</span>
      <div className="ship-roster-card__figures">
        <span>Lv. {level}</span>
        <span>{power.toLocaleString()} PWR</span>
      </div>

      {selected ? (
        <span className="ship-roster-card__selected-badge" aria-hidden="true">
          <span aria-hidden="true">✓ </span>Selected
        </span>
      ) : null}
    </button>
  );
}
