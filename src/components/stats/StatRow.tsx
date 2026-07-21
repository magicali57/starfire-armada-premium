import type { ReactNode } from "react";
import "./StatRow.css";

interface StatRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  previousValue?: string;
  highlight?: boolean;
}

/** One labeled stat line, optionally showing a before -> after preview.
 *  Shared by Ship Upgrade (and anywhere else stats are listed) so stat
 *  formatting/layout never gets duplicated per screen. */
export function StatRow({ icon, label, value, previousValue, highlight }: StatRowProps) {
  const showsPreview = previousValue !== undefined && previousValue !== value;
  return (
    <div className={`stat-row${highlight ? " stat-row--highlight" : ""}`}>
      <span className="stat-row__icon" aria-hidden="true">
        {icon}
      </span>
      <span className="stat-row__label">{label}</span>
      <span className="stat-row__value">
        {showsPreview ? (
          <>
            <span className="stat-row__value-before">{previousValue}</span>
            <span className="stat-row__arrow" aria-hidden="true">
              →
            </span>
            <span className="stat-row__value-after">{value}</span>
          </>
        ) : (
          value
        )}
      </span>
    </div>
  );
}
