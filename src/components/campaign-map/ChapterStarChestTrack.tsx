import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { REWARD_CHEST } from "@/data/assetRegistry";
import type { ChestMilestone } from "@/data/campaignChapterMap";
import "./ChapterStarChestTrack.css";

interface ChapterStarChestTrackProps {
  current: number;
  max: number;
  milestones: ChestMilestone[];
  onSelectMilestone: (milestone: ChestMilestone) => void;
}

const STATE_LABEL: Record<ChestMilestone["state"], string> = {
  claimed: "Claimed",
  claimable: "Claim",
  locked: "Locked",
};

/**
 * Chapter-scoped 3-chest milestone row (10/20/30 stars) beneath the intro
 * panel. A sibling of Campaign Overview's `ChapterStarRewardsTrack`, not a
 * shared instance — different data shape (3 chests, not 5) and different
 * per-state labels ("Claim"/"Locked" text instead of a plain star count).
 */
export function ChapterStarChestTrack({ current, max, milestones, onSelectMilestone }: ChapterStarChestTrackProps) {
  return (
    <div className="chest-track">
      <div className="chest-track__summary">
        <BattleModeIcon variant="star" size={20} />
        <div className="chest-track__summary-copy">
          <span className="chest-track__summary-label">Chapter Stars</span>
          <span className="chest-track__summary-value">
            <b>{current}</b>
            <span>/{max}</span>
          </span>
        </div>
      </div>

      <div className="chest-track__row">
        {milestones.map((milestone) => (
          <div className="chest-track__item" key={milestone.stars}>
            <button
              type="button"
              className={`chest-track__chest press-scale chest-track__chest--${milestone.state}`}
              onClick={() => onSelectMilestone(milestone)}
              aria-label={`${milestone.stars} star chest reward, ${STATE_LABEL[milestone.state]}`}
            >
              <img src={REWARD_CHEST[milestone.chestTier]} alt="" />
            </button>
            <span className="chest-track__stars">
              {milestone.state === "claimed" ? <BattleModeIcon variant="check" size={12} /> : null}
              {milestone.stars}
              <BattleModeIcon variant="star" size={10} />
            </span>
            <span className={`chest-track__state chest-track__state--${milestone.state}`}>
              {STATE_LABEL[milestone.state]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
