import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { CompanionRankMilestone } from "@/systems/companionProgression";

export function CompanionRankMilestones({ milestones, onInfo }: { milestones: CompanionRankMilestone[]; onInfo: () => void }) {
  return (
    <section className="companion-rank-milestones">
      <div className="companion-rank-milestones__heading"><h2>Rank Milestones</h2><button type="button" onClick={onInfo} aria-label="About companion ranks"><BattleModeIcon variant="info" size={18} /></button></div>
      <div className="companion-rank-milestones__list">
        {milestones.map((milestone) => (
          <article key={milestone.rank} className={`${milestone.unlocked ? "is-unlocked" : ""}${milestone.current ? " is-current" : ""}`}>
            <span><BattleModeIcon variant={milestone.unlocked ? "star" : "lock"} size={18} /> Rank {milestone.rank}</span>
            <strong>{milestone.title}</strong>
            <small>Level {milestone.requiredLevel} milestone</small>
          </article>
        ))}
      </div>
    </section>
  );
}
