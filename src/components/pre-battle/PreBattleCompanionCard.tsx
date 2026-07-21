import { SSS_EMBLEM_RESERVED } from "@/data/assetRegistry";
import type { PreBattleLoadoutMember } from "@/data/preBattle";
import "./PreBattleShipCard.css";

interface PreBattleCompanionCardProps {
  companion: PreBattleLoadoutMember;
  art: string;
}

/**
 * "YOUR LOADOUT" companion card — same visual structure as
 * `PreBattleShipCard`, sharing its CSS file (`.pre-battle-loadout-card`).
 * Art resolved by the screen: `COMPANION_ART.repairDrone`, an exact name
 * match to this reference's "REPAIR DRONE" companion caption.
 */
export function PreBattleCompanionCard({ companion, art }: PreBattleCompanionCardProps) {
  return (
    <div className="pre-battle-loadout-card">
      <span className="pre-battle-loadout-card__label">Companion</span>
      <img className="pre-battle-loadout-card__art pre-battle-loadout-card__art--companion" src={art} alt="" />
      <span className="pre-battle-loadout-card__name">{companion.name}</span>
      <span className="pre-battle-loadout-card__meta">
        <span className="pre-battle-loadout-card__level">Lv. {companion.level}</span>
        <span className="pre-battle-loadout-card__rarity">
          <img src={SSS_EMBLEM_RESERVED} alt="" />
          {companion.rarityLabel}
        </span>
      </span>
    </div>
  );
}
