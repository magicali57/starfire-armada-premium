import { StageRewardItem } from "@/components/stage-detail/StageRewardItem";
import type { StageRewardItem as StageRewardItemData } from "@/data/campaignStageDetail";
import "./StageRewardsRow.css";

interface StageRewardsRowProps {
  firstClearRewards: StageRewardItemData[];
  repeatRewards: StageRewardItemData[];
  onSelectReward: (reward: StageRewardItemData, group: "first-clear" | "repeat") => void;
}

/** The "First Clear Rewards" / "Repeat Rewards" two-column layout, divided
 *  by a vertical rule — stacks to a single column on narrow phones rather
 *  than compressing both columns into an unreadable width. */
export function StageRewardsRow({ firstClearRewards, repeatRewards, onSelectReward }: StageRewardsRowProps) {
  return (
    <div className="stage-rewards-row">
      <div className="stage-rewards-row__group">
        <h3 className="stage-rewards-row__heading">First Clear Rewards</h3>
        <div className="stage-rewards-row__items">
          {firstClearRewards.map((reward) => (
            <StageRewardItem key={reward.id} reward={reward} onSelect={() => onSelectReward(reward, "first-clear")} />
          ))}
        </div>
      </div>

      <span className="stage-rewards-row__divider" aria-hidden="true" />

      <div className="stage-rewards-row__group">
        <h3 className="stage-rewards-row__heading">Repeat Rewards</h3>
        <div className="stage-rewards-row__items">
          {repeatRewards.map((reward) => (
            <StageRewardItem key={reward.id} reward={reward} onSelect={() => onSelectReward(reward, "repeat")} />
          ))}
        </div>
      </div>
    </div>
  );
}
