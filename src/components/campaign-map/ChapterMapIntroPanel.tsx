import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON, REWARD_CHEST, MODE_ILLUSTRATION } from "@/data/assetRegistry";
import type { ChapterMapReward } from "@/data/campaignChapterMap";
import "./ChapterMapIntroPanel.css";

const REWARD_ICON: Record<ChapterMapReward["id"], string> = {
  crystals: RESOURCE_ICON.crystals,
  credits: RESOURCE_ICON.credits,
  chests: REWARD_CHEST.basic,
};

interface ChapterMapIntroPanelProps {
  description: string;
  rewards: ChapterMapReward[];
  onViewRewards: () => void;
}

/**
 * The chapter flavor-text + rewards + art panel directly beneath the
 * header row. Art (`MODE_ILLUSTRATION.campaign` — the same nebula/ship-
 * formation scene already approved for this exact chapter on Battle Hub and
 * Campaign Overview, not the reference screenshot itself) sits behind a
 * left-to-right scrim so the flavor text and rewards stay readable, same
 * technique as `ChapterDetailPanel`. Clipped to its own box (`overflow:
 * hidden`) so the art can never bleed past the panel's edges.
 */
export function ChapterMapIntroPanel({ description, rewards, onViewRewards }: ChapterMapIntroPanelProps) {
  return (
    <div className="chapter-map-intro-panel">
      <img className="chapter-map-intro-panel__art" src={MODE_ILLUSTRATION.campaign} alt="" />
      <span className="chapter-map-intro-panel__scrim" aria-hidden="true" />

      <div className="chapter-map-intro-panel__body">
        <p className="chapter-map-intro-panel__description">{description}</p>

        <span className="chapter-map-intro-panel__rewards-label">— Chapter Rewards —</span>
        <div className="chapter-map-intro-panel__rewards-row">
          {rewards.map((reward) => (
            <span className="chapter-map-intro-panel__reward" key={reward.id}>
              <img src={REWARD_ICON[reward.id]} alt="" />
              <b>{reward.amount}</b>
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className="chapter-map-intro-panel__view-rewards press-scale"
        onClick={onViewRewards}
      >
        <BattleModeIcon variant="search" size={14} />
        View Rewards
      </button>
    </div>
  );
}
