import { RESOURCE_ICON, REWARD_CHEST, MATERIAL_ICON } from "@/data/assetRegistry";
import type { StageRewardItem as StageRewardItemData } from "@/data/campaignStageDetail";
import "./StageRewardItem.css";

interface StageRewardItemProps {
  reward: StageRewardItemData;
  onSelect: () => void;
}

function resolveRewardIcon(icon: StageRewardItemData["icon"]): string {
  switch (icon.kind) {
    case "resource":
      return RESOURCE_ICON[icon.id];
    case "chest":
      return REWARD_CHEST[icon.tier];
    case "material":
      return MATERIAL_ICON[icon.id];
  }
}

/** One reward icon + amount, shared by the First Clear and Repeat reward
 *  columns. A real button (not a static image) — taps open an
 *  informational modal, same convention as every other reward tap in this
 *  project. */
export function StageRewardItem({ reward, onSelect }: StageRewardItemProps) {
  return (
    <button type="button" className="stage-reward-item press-scale" onClick={onSelect}>
      <img src={resolveRewardIcon(reward.icon)} alt="" />
      <span>{reward.amount}</span>
    </button>
  );
}
