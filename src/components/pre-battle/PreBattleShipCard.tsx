import { SSS_EMBLEM_RESERVED } from "@/data/assetRegistry";
import type { PreBattleLoadoutMember } from "@/data/preBattle";
import "./PreBattleShipCard.css";

interface PreBattleShipCardProps {
  ship: PreBattleLoadoutMember;
  art: string;
}

/**
 * "YOUR LOADOUT" ship card. Art is resolved by the screen, not this
 * component — see PreBattleScreen.tsx for the disclosed `ship-03-homing-missiles`
 * substitution (an exact name match to this reference's "HOMING MISSILES"
 * ship caption). Rarity badge uses `SSS_EMBLEM_RESERVED`, the previously
 * unused reserved SSS emblem asset in assetRegistry.ts — a genuine asset
 * match for this screen's "SSS" loadout, not a substitution.
 */
export function PreBattleShipCard({ ship, art }: PreBattleShipCardProps) {
  return (
    <div className="pre-battle-loadout-card">
      <span className="pre-battle-loadout-card__label">Ship</span>
      <img className="pre-battle-loadout-card__art" src={art} alt="" />
      <span className="pre-battle-loadout-card__name">{ship.name}</span>
      <span className="pre-battle-loadout-card__meta">
        <span className="pre-battle-loadout-card__level">Lv. {ship.level}</span>
        <span className="pre-battle-loadout-card__rarity">
          <img src={SSS_EMBLEM_RESERVED} alt="" />
          {ship.rarityLabel}
        </span>
      </span>
    </div>
  );
}
