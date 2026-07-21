import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { getShipMasterArt, ROLE_ICON } from "@/data/assetRegistry";
import type { FleetRosterCardData } from "@/data/fleetRoster";
import { levelProgressPct } from "@/data/fleetRoster";
import type { ShipDefinition } from "@/types";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import { FleetStatusBar } from "./FleetStatusBar";
import "./FleetShipCard.css";

interface FleetShipCardProps {
  ship: ShipDefinition;
  data: FleetRosterCardData;
  selected: boolean;
  onSelect: () => void;
}

const ROLE_ICON_KEY: Record<ShipDefinition["role"], keyof typeof ROLE_ICON> = {
  Attack: "attack",
  Support: "support",
  Control: "control",
  Heavy: "heavy",
};

/**
 * One roster card. Ship art is resolved directly via `getShipMasterArt()`
 * (all 20 ships now have real master art — no `ShipArt` component, no
 * `SHIP_ROSTER_ART`/`SHIP_HERO_ART` fallback maps) per the current
 * instruction to use the master-art resolver directly everywhere in Fleet
 * Roster.
 */
export function FleetShipCard({ ship, data, selected, onSelect }: FleetShipCardProps) {
  const locked = data.statusVariant === "locked";
  const art = getShipMasterArt(ship.id);
  const name = data.displayName ?? ship.name;
  const roleIconKey = ROLE_ICON_KEY[ship.role];

  return (
    <button
      type="button"
      className={`fleet-ship-card press-scale${selected ? " fleet-ship-card--selected" : ""}${
        locked ? " fleet-ship-card--locked" : ""
      }`}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${name}, ${RARITY_LABEL[ship.rarity]}${locked ? ", locked" : ""}`}
    >
      <span
        className="fleet-ship-card__rarity-pill"
        style={{ color: rarityColorVar(ship.rarity), borderColor: rarityColorVar(ship.rarity) }}
      >
        {RARITY_LABEL[ship.rarity].toUpperCase()}
      </span>

      {data.equipped ? <span className="fleet-ship-card__equipped-ribbon">Equipped</span> : null}
      {data.hasAlert ? <span className="fleet-ship-card__alert-dot" aria-hidden="true" /> : null}

      <div className="fleet-ship-card__art">
        {art ? <img src={art} alt="" className={locked ? "fleet-ship-card__art-img--locked" : undefined} /> : null}
      </div>

      <span className="fleet-ship-card__name">{name}</span>

      {locked ? (
        <div className="fleet-ship-card__locked-pill">
          <BattleModeIcon variant="lock" size={14} />
          <span>{data.unlockRequirement}</span>
        </div>
      ) : (
        <>
          <span className="fleet-ship-card__role-row">
            <img src={ROLE_ICON[roleIconKey]} alt="" />
            {ship.role}
          </span>
          <div className="fleet-ship-card__figures">
            <span>Lv. {data.level}</span>
            <span className="fleet-ship-card__power">
              <BattleModeIcon variant="energy" size={12} />
              {data.power.toLocaleString()}
            </span>
          </div>
          <div className="fleet-ship-card__progress-track">
            <div
              className="fleet-ship-card__progress-fill"
              style={{ width: `${levelProgressPct(data.level)}%` }}
            />
          </div>
        </>
      )}

      <FleetStatusBar
        variant={data.statusVariant}
        fragmentCurrent={data.fragmentCurrent}
        fragmentMax={data.fragmentMax}
      />
    </button>
  );
}
