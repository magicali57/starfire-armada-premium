import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { StageObjectiveRow } from "@/components/stage-detail/StageObjectiveRow";
import { RESOURCE_ICON, REWARD_CHEST } from "@/data/assetRegistry";
import type { PreBattleContent } from "@/data/preBattle";
import "./PreBattleInfoPanels.css";

interface PreBattleInfoPanelsProps {
  content: PreBattleContent;
  onSelectModifier: (modifierId: string) => void;
  onSelectReward: (rewardId: string) => void;
}

/**
 * The reference's three side-by-side panels: OBJECTIVES, STAGE MODIFIERS,
 * REWARD PREVIEW. Stacks to a single column under 480px (see
 * PreBattleInfoPanels.css) rather than forcing three native-width columns
 * into a ~360-412px viewport — same class of fix already proven on
 * `StageRewardsRow`'s two-column stack.
 *
 * Objectives reuse Stage Detail's own `StageObjectiveRow` component
 * unmodified. Stage Modifiers is new — no equivalent data exists anywhere
 * in campaignStageDetail.ts. Reward Preview shows Credits/Crystals (reusing
 * Stage Detail's own first-clear reward amounts) plus a new XP figure and a
 * bonus "Chance to get Epic Module" row (reusing `REWARD_CHEST.epic`,
 * already the approved epic-chest substitution used for Stage Detail's own
 * first-clear chest reward) — all disclosed in the completion report.
 */
export function PreBattleInfoPanels({ content, onSelectModifier, onSelectReward }: PreBattleInfoPanelsProps) {
  return (
    <div className="pre-battle-info-panels">
      <div className="pre-battle-info-panel">
        <h3 className="pre-battle-info-panel__heading">Objectives</h3>
        <div className="pre-battle-info-panel__objectives">
          {content.objectives.map((objective) => (
            <StageObjectiveRow key={objective.id} objective={objective} />
          ))}
        </div>
      </div>

      <div className="pre-battle-info-panel">
        <h3 className="pre-battle-info-panel__heading">Stage Modifiers</h3>
        <div className="pre-battle-info-panel__list">
          {content.stageModifiers.map((modifier) => (
            <button
              key={modifier.id}
              type="button"
              className="pre-battle-modifier-row press-scale"
              onClick={() => onSelectModifier(modifier.id)}
            >
              <span className="pre-battle-modifier-row__icon">
                <BattleModeIcon variant={modifier.icon} size={14} />
              </span>
              <span className="pre-battle-modifier-row__content">
                <span className="pre-battle-modifier-row__label">{modifier.label}</span>
                <span className="pre-battle-modifier-row__value">{modifier.value}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="pre-battle-info-panel">
        <h3 className="pre-battle-info-panel__heading">Reward Preview</h3>
        <div className="pre-battle-info-panel__rewards">
          <button type="button" className="pre-battle-reward-tile press-scale" onClick={() => onSelectReward("credits")}>
            <img src={RESOURCE_ICON.credits} alt="" />
            <span>{content.rewardPreviewCredits}</span>
          </button>
          <button type="button" className="pre-battle-reward-tile press-scale" onClick={() => onSelectReward("crystals")}>
            <img src={RESOURCE_ICON.crystals} alt="" />
            <span>{content.rewardPreviewCrystals}</span>
          </button>
          <button type="button" className="pre-battle-reward-tile press-scale" onClick={() => onSelectReward("xp")}>
            <span className="pre-battle-reward-tile__xp-badge" aria-hidden="true">
              XP
            </span>
            <span>{content.rewardPreviewXp}</span>
          </button>
        </div>
        <button
          type="button"
          className="pre-battle-bonus-row press-scale"
          onClick={() => onSelectReward("bonus-module")}
        >
          <img src={REWARD_CHEST.epic} alt="" />
          <span>{content.bonusRewardLabel}</span>
        </button>
      </div>
    </div>
  );
}
