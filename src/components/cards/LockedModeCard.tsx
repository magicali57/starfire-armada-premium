import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import "./LockedModeCard.css";

interface LockedModeCardProps {
  title: string;
  art: string;
  onSelect: () => void;
}

/**
 * Full-width grayed-out locked card (Endless Survival). Per instruction,
 * the background art is kept only as a faint, heavily desaturated/darkened
 * texture (not shown at full strength) — see BATTLE_HUB_PLAN.md's Endless
 * Survival substitution note for why there's no dedicated art for this
 * post-launch mode. Shield and lock icons are coded SVG, not emoji.
 */
export function LockedModeCard({ title, art, onSelect }: LockedModeCardProps) {
  return (
    <button type="button" className="locked-mode-card press-scale" onClick={onSelect}>
      <img className="locked-mode-card__art" src={art} alt="" />
      <span className="locked-mode-card__scrim" aria-hidden="true" />
      <span className="locked-mode-card__header">
        <BattleModeIcon variant="shield" size={18} />
        <span className="locked-mode-card__title">{title}</span>
      </span>
      <span className="locked-mode-card__lock" aria-hidden="true">
        <BattleModeIcon variant="lock" size={26} />
      </span>
      <span className="locked-mode-card__footer">COMING SOON</span>
    </button>
  );
}
