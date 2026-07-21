import type { ReactNode } from "react";
import "./CardCornerBadge.css";

interface CardCornerBadgeProps {
  icon: ReactNode;
  label?: string;
  tone?: "gold" | "success" | "purple";
}

/**
 * Small icon (+ optional label) pill anchored to a card's top-right corner
 * — reused by Boss Raid's "CLAIM REWARD" badge (icon + label, purple tone
 * matching the reference's hexagon outline and the card's own purple
 * accent) and Active Event's reward indicator (icon only, success tone).
 */
export function CardCornerBadge({ icon, label, tone = "gold" }: CardCornerBadgeProps) {
  return (
    <span className={`card-corner-badge card-corner-badge--${tone}${label ? "" : " card-corner-badge--icon-only"}`}>
      <span className="card-corner-badge__icon" aria-hidden="true">
        {icon}
      </span>
      {label ? <span className="card-corner-badge__label">{label}</span> : null}
    </span>
  );
}
