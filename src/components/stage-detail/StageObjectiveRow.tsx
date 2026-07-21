import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { StageObjective } from "@/data/campaignStageDetail";
import "./StageObjectiveRow.css";

interface StageObjectiveRowProps {
  objective: StageObjective;
}

/**
 * One star-objective row. The reference shows all 3 rows identically (gold
 * star + description, no separate completion indicator) — `completed` is
 * supported here for a future stage state, but Stage 7's own data never
 * sets it, so this renders the reference's plain presentation by default.
 */
export function StageObjectiveRow({ objective }: StageObjectiveRowProps) {
  return (
    <div className={`stage-objective-row${objective.completed ? " stage-objective-row--completed" : ""}`}>
      <span className="stage-objective-row__star" aria-hidden="true">
        <BattleModeIcon variant="star" size={20} style={{ color: "var(--color-gold-300)" }} />
        {objective.completed ? (
          <span className="stage-objective-row__check">
            <BattleModeIcon variant="check" size={10} />
          </span>
        ) : null}
      </span>
      <span className="stage-objective-row__description">{objective.description}</span>
    </div>
  );
}
