import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { LoadoutShipViewModel } from "@/data/loadout";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import "./LoadoutShipPanel.css";

interface LoadoutShipPanelProps {
  ship: LoadoutShipViewModel;
  onChangeShip: () => void;
  onInfo: () => void;
}

/**
 * Selected-ship section of the main Loadout panel — art, name, rarity,
 * real level, intrinsic weapon name/level, and the combined ship+weapon
 * Power contribution ("Weapon Power" in the reference). "Change Ship" opens
 * Fleet Roster (`#/ships?return=loadout`); the info button opens the real
 * Ship Detail page for this ship rather than a modal, since that screen
 * already exists. No gameplay sprite is used — `getShipMasterArt` only, the
 * same resolver Fleet Roster/Ship Detail/Ship Level Up already use.
 */
export function LoadoutShipPanel({ ship, onChangeShip, onInfo }: LoadoutShipPanelProps) {
  return (
    <div className="loadout-ship-panel">
      <div className="loadout-ship-panel__art-wrap">
        {ship.artSrc ? <img className="loadout-ship-panel__art" src={ship.artSrc} alt="" /> : null}
        <button
          type="button"
          className="loadout-ship-panel__info press-scale"
          aria-label={`${ship.name} details`}
          onClick={(event) => {
            event.stopPropagation();
            onInfo();
          }}
        >
          <BattleModeIcon variant="info" size={14} />
        </button>
      </div>

      <div className="loadout-ship-panel__body">
        <span
          className="loadout-ship-panel__rarity"
          style={{ color: rarityColorVar(ship.rarity), borderColor: rarityColorVar(ship.rarity) }}
        >
          {RARITY_LABEL[ship.rarity].toUpperCase()}
        </span>
        <span className="loadout-ship-panel__name">{ship.name}</span>
        <span className="loadout-ship-panel__level">
          Lv. {ship.level} / {ship.maxLevel}
        </span>

        <span className="loadout-ship-panel__weapon">
          {ship.weaponName} <i>Lv. {ship.weaponLevel}</i>
        </span>

        <span className="loadout-ship-panel__power">
          <img src={RESOURCE_ICON.power} alt="" />
          <b>{ship.weaponPower.toLocaleString()}</b>
          <small>Weapon Power</small>
        </span>

        <button type="button" className="loadout-ship-panel__change press-scale" onClick={onChangeShip}>
          Change Ship
        </button>
      </div>
    </div>
  );
}
