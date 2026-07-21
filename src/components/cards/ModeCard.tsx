import type { ReactNode } from "react";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import "./ModeCard.css";

export type ModeCardTone = "cyan" | "purple" | "blue" | "success";

interface ModeCardProps {
  tone: ModeCardTone;
  icon: ReactNode;
  /** Small label shown above `title` (Active Event's "ACTIVE EVENT" above
   *  its event name) — omit for the plain single-line cards. */
  eyebrow?: string;
  title: ReactNode;
  art: string;
  statusText: string;
  /** Set true to color the footer status text with the card's tone (used by
   *  Active Event's green countdown) instead of the default neutral gray. */
  statusAccent?: boolean;
  cornerBadge?: ReactNode;
  onSelect: () => void;
}

/**
 * Standard mode card used by Daily Operations, Boss Raid, Training, and
 * Active Event: background illustration, icon + title header, optional
 * corner badge, footer status text + chevron, tone-based border/glow. The
 * whole card is one tap target (not just the chevron), per instruction.
 */
export function ModeCard({
  tone,
  icon,
  eyebrow,
  title,
  art,
  statusText,
  statusAccent,
  cornerBadge,
  onSelect,
}: ModeCardProps) {
  return (
    <button type="button" className={`mode-card mode-card--${tone} press-scale`} onClick={onSelect}>
      <img className="mode-card__art" src={art} alt="" />
      <span className="mode-card__scrim" aria-hidden="true" />
      {cornerBadge}
      <span className="mode-card__icon">{icon}</span>
      {eyebrow ? <span className="mode-card__eyebrow">{eyebrow}</span> : null}
      <span className="mode-card__title">{title}</span>
      <span className="mode-card__footer">
        <span className={`mode-card__status${statusAccent ? " mode-card__status--accent" : ""}`}>
          {statusText}
        </span>
        <BattleModeIcon variant="chevron" size={14} />
      </span>
    </button>
  );
}
