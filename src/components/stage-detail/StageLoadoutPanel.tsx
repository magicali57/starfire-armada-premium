import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { StageLoadoutMember } from "@/data/campaignStageDetail";
import "./StageLoadoutPanel.css";

interface StageLoadoutPanelProps {
  ship: StageLoadoutMember;
  shipArt: string;
  companion: StageLoadoutMember;
  companionArt: string;
  totalPower: number;
}

/**
 * "Current Loadout" summary — ship portrait + name/level/stars, companion
 * portrait + name/level/rarity, Total Power. `shipArt`/`companionArt` are
 * resolved by the screen (not this component) since the reference's "Void
 * Reaper"/"Rapid Drone" aren't real ship/companion names — see
 * CampaignStageDetailScreen.tsx for the disclosed substitution.
 */
export function StageLoadoutPanel({ ship, shipArt, companion, companionArt, totalPower }: StageLoadoutPanelProps) {
  return (
    <div className="stage-loadout-panel">
      <h3 className="stage-loadout-panel__heading">Current Loadout</h3>

      <div className="stage-loadout-panel__row">
        <div className="stage-loadout-panel__member stage-loadout-panel__member--ship">
          <img className="stage-loadout-panel__art" src={shipArt} alt="" />
          <div className="stage-loadout-panel__copy">
            <span className="stage-loadout-panel__name">{ship.name}</span>
            <span className="stage-loadout-panel__level">Lv. {ship.level}</span>
            {ship.stars ? (
              <span className="stage-loadout-panel__stars" aria-hidden="true">
                {Array.from({ length: ship.stars }, (_, i) => (
                  <BattleModeIcon key={i} variant="star" size={11} style={{ color: "var(--color-primary-300)" }} />
                ))}
              </span>
            ) : null}
          </div>
        </div>

        <div className="stage-loadout-panel__member stage-loadout-panel__member--companion">
          <img className="stage-loadout-panel__art stage-loadout-panel__art--companion" src={companionArt} alt="" />
          <div className="stage-loadout-panel__copy">
            <span className="stage-loadout-panel__name">{companion.name}</span>
            <span className="stage-loadout-panel__level">Lv. {companion.level}</span>
            {companion.rarityLabel ? (
              <span className="stage-loadout-panel__rarity">{companion.rarityLabel}</span>
            ) : null}
          </div>
        </div>

        <div className="stage-loadout-panel__total">
          <span className="stage-loadout-panel__total-label">Total Power</span>
          <span className="stage-loadout-panel__total-value">
            <BattleModeIcon variant="swords" size={14} />
            {totalPower.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
