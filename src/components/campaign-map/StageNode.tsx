import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { StageMapNode } from "@/data/campaignChapterMap";
import "./StageNode.css";

interface StageNodeProps {
  node: StageMapNode;
  onSelect: () => void;
}

/**
 * One coded stage button in the two-column path. Two distinct visual
 * treatments, not one shared shape with swapped colors: standard stages
 * (1-9) use an octagonal badge (bright cyan glow when completed/current,
 * dim metallic when locked), while the boss stage (10) uses a completely
 * different crimson crest shape — matching the reference, which never
 * draws the boss node as a bigger version of the same octagon.
 *
 * Locked stages 8/9 deliberately show no lock badge inside the node itself
 * (only the dimmed border/glow) — the reference doesn't draw one there,
 * per the approved decision. All three states remain real tappable
 * buttons; locked ones open `LockedContentModal` via `onSelect`.
 */
export function StageNode({ node, onSelect }: StageNodeProps) {
  const { index, state, starsEarned, starsMax, isBoss } = node;
  const stars = Array.from({ length: starsMax }, (_, i) => i < starsEarned);

  const starsRow = (
    <span className="stage-node__stars" aria-hidden="true">
      {stars.map((filled, i) => (
        <BattleModeIcon
          key={i}
          variant="star"
          size={isBoss ? 13 : 11}
          style={{ color: filled ? "var(--color-gold-300)" : "rgba(182, 179, 214, 0.4)" }}
        />
      ))}
    </span>
  );

  if (isBoss) {
    return (
      <div className="stage-node stage-node--boss">
        <button
          type="button"
          className="stage-node__boss-badge press-scale"
          onClick={onSelect}
          aria-label={`Stage ${index}, boss stage, locked`}
        >
          <span className="stage-node__boss-number">{index}</span>
        </button>
        {starsRow}
      </div>
    );
  }

  return (
    <div className={`stage-node stage-node--${state}`}>
      <button
        type="button"
        className="stage-node__badge press-scale"
        onClick={onSelect}
        aria-current={state === "current" ? "true" : undefined}
        aria-label={`Stage ${index}${state === "current" ? ", current" : state === "locked" ? ", locked" : ", completed"}`}
      >
        <span className="stage-node__number">{index}</span>
      </button>
      {starsRow}
      {state === "current" ? <span className="stage-node__current-tag">Current</span> : null}
    </div>
  );
}
