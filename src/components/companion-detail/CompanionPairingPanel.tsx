import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON, ROLE_ICON } from "@/data/assetRegistry";
import type { CompanionDetailViewModel } from "@/data/companionDetail";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import type { ShipDefinition } from "@/types";
import "./CompanionPairingPanel.css";

interface CompanionPairingPanelProps {
  companion: CompanionDetailViewModel;
}

const ROLE_ICON_KEY: Record<ShipDefinition["role"], keyof typeof ROLE_ICON> = {
  Attack: "attack",
  Support: "support",
  Control: "control",
  Heavy: "heavy",
};

/**
 * Ship pairing panel. See data/companionDetail.ts's getCompanionPairing
 * doc comment for why this shows the real currently-selected ship
 * (player.selectedShipId) rather than the reference's literal "BEST
 * PAIRINGS" static 3-ship recommendation list — that section would
 * require fabricating a ship x companion synergy matrix with no real data
 * source, which conflicts with this task's own repeated "do not
 * fabricate" instruction and its separate, explicit §19 requirement to
 * use real player data. Shows "EQUIPPED WITH" when this companion is the
 * one currently equipped, "NOT CURRENTLY EQUIPPED" (previewing the
 * current ship as the Equip target) otherwise, per §19.
 */
export function CompanionPairingPanel({ companion }: CompanionPairingPanelProps) {
  const ship = companion.pairedShip;

  return (
    <div className="companion-pairing-panel glass-panel">
      <h2 className="companion-pairing-panel__heading">
        Ship Pairing <i />
      </h2>

      {ship ? (
        <div className="companion-pairing-panel__row">
          <div className="companion-pairing-panel__art">
            {ship.artwork ? <img src={ship.artwork} alt={ship.name} /> : null}
          </div>
          <div className="companion-pairing-panel__info">
            <span
              className="companion-pairing-panel__rarity"
              style={{ color: rarityColorVar(ship.rarity), borderColor: rarityColorVar(ship.rarity) }}
            >
              {RARITY_LABEL[ship.rarity].toUpperCase()}
            </span>
            <strong className="companion-pairing-panel__name">{ship.name}</strong>
            <span className="companion-pairing-panel__role">
              <img src={ROLE_ICON[ROLE_ICON_KEY[ship.role]]} alt="" />
              {ship.role}
            </span>
            <span className="companion-pairing-panel__power">
              <img src={RESOURCE_ICON.power} alt="" />
              {ship.power.toLocaleString()}
            </span>
          </div>
          <span
            className={`companion-pairing-panel__status${
              companion.equipped ? " companion-pairing-panel__status--active" : ""
            }`}
          >
            {companion.equipped ? (
              <>
                <BattleModeIcon variant="check" size={12} /> Equipped With
              </>
            ) : (
              "Not Currently Equipped"
            )}
          </span>
        </div>
      ) : (
        <p className="companion-pairing-panel__empty">No ship is currently selected.</p>
      )}
    </div>
  );
}
