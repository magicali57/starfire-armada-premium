import { StageNode } from "@/components/campaign-map/StageNode";
import type { StageMapNode } from "@/data/campaignChapterMap";
import "./StageMapPath.css";

interface StageMapPathProps {
  leftStages: StageMapNode[];
  rightStages: StageMapNode[];
  onSelectStage: (stage: StageMapNode) => void;
}

/**
 * The two-column stage path — left column stages 1-5, right column 6-10
 * (10 being the boss), matching the reference's parallel-track layout
 * rather than one long vertical list. A single rounded L-shaped connector
 * bridges the bottom of the left column to the top of the right column;
 * plain vertical lines connect stages within each column. All connector
 * geometry is coded CSS (border segments), not an image or SVG path — this
 * is a decorative route, not a pixel-exact trace of the reference's exact
 * line routing (see CAMPAIGN_CHAPTER_MAP_PLAN.md §13).
 */
export function StageMapPath({ leftStages, rightStages, onSelectStage }: StageMapPathProps) {
  return (
    <div className="stage-map-path">
      <div className="stage-map-path__column">
        {leftStages.map((stage, i) => (
          <div className="stage-map-path__row" key={stage.id}>
            <span className="stage-map-path__node-slot">
              {i > 0 ? <span className="stage-map-path__connector" aria-hidden="true" /> : null}
              <StageNode node={stage} onSelect={() => onSelectStage(stage)} />
            </span>
            <span className="stage-map-path__row-label">Stage {stage.index}</span>
          </div>
        ))}
      </div>

      <span className="stage-map-path__bridge" aria-hidden="true" />

      <div className="stage-map-path__column">
        {rightStages.map((stage, i) => (
          <div className="stage-map-path__row" key={stage.id}>
            <span className="stage-map-path__node-slot">
              {i > 0 ? <span className="stage-map-path__connector" aria-hidden="true" /> : null}
              <StageNode node={stage} onSelect={() => onSelectStage(stage)} />
            </span>
            {stage.isBoss ? (
              <span className="stage-map-path__row-label stage-map-path__row-label--boss">
                <b>Boss</b>
                Stage {stage.index}
              </span>
            ) : (
              <span className="stage-map-path__row-label">Stage {stage.index}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
