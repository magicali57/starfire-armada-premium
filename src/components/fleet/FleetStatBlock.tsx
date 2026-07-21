import type { ReactNode } from "react";
import "./FleetStatBlock.css";

interface FleetStatBlockProps {
  label: string;
  children: ReactNode;
  progressPct?: number;
}

/**
 * One stacked label-over-value stat inside the featured panel (Level, Star
 * Rank, Weapon Level, Power). Deliberately not `StatRow` — `StatRow` is a
 * single-line icon|label|value flex row, while the reference shows a
 * stacked block, the same category of mismatch that caused Stage Detail's
 * mobile stat-grid bug (see FLEET_ROSTER_PLAN.md §26-28).
 */
export function FleetStatBlock({ label, children, progressPct }: FleetStatBlockProps) {
  return (
    <div className="fleet-stat-block">
      <span className="fleet-stat-block__label">{label}</span>
      <div className="fleet-stat-block__value">{children}</div>
      {progressPct !== undefined ? (
        <div className="fleet-stat-block__track">
          <div className="fleet-stat-block__fill" style={{ width: `${progressPct}%` }} />
        </div>
      ) : null}
    </div>
  );
}
