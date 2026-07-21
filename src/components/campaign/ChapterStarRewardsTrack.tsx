import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { REWARD_CHEST } from "@/data/assetRegistry";
import type { ChapterStarRewardMilestone } from "@/data/campaignOverview";
import "./ChapterStarRewardsTrack.css";

interface ChapterStarRewardsTrackProps {
  milestones: ChapterStarRewardMilestone[];
  onSelectMilestone: (milestone: ChapterStarRewardMilestone) => void;
}

/**
 * The five-chest "Chapter Star Rewards" milestone strip. Each chest is a
 * real tappable button (not a static image) — claimed shows a checkmark
 * badge, the 30-star milestone is drawn larger/highlighted per the
 * reference (independent of whether it's the nearest unclaimed one — see
 * campaignOverview.ts), the rest show a plain star-preview badge, and the
 * 50-star milestone alone shows a lock badge, matching the reference
 * exactly rather than a generic claimed/locked-everything-else pattern.
 */
export function ChapterStarRewardsTrack({ milestones, onSelectMilestone }: ChapterStarRewardsTrackProps) {
  return (
    <div className="star-rewards-track">
      <div className="star-rewards-track__header">
        <h3>Chapter Star Rewards</h3>
        <span className="star-rewards-track__info" aria-hidden="true">
          i
        </span>
      </div>

      <div className="star-rewards-track__row">
        {milestones.map((milestone) => (
          <div className="star-rewards-track__item" key={milestone.stars}>
            <button
              type="button"
              className={`star-rewards-track__chest press-scale star-rewards-track__chest--${milestone.state}`}
              onClick={() => onSelectMilestone(milestone)}
              aria-label={`${milestone.stars} star reward`}
            >
              <img src={REWARD_CHEST[milestone.chestTier]} alt="" />
              <span className={`star-rewards-track__badge star-rewards-track__badge--${milestone.state}`}>
                {milestone.state === "claimed" ? <BattleModeIcon variant="check" size={11} /> : null}
                {milestone.state === "locked" ? <BattleModeIcon variant="lock" size={10} /> : null}
                {milestone.state === "upcoming" || milestone.state === "highlighted" ? (
                  <BattleModeIcon variant="star" size={10} />
                ) : null}
              </span>
            </button>
            <span className={`star-rewards-track__dot star-rewards-track__dot--${milestone.state}`} />
            <span className="star-rewards-track__label">
              {milestone.stars}
              <BattleModeIcon variant="star" size={10} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
