import { clampPercent } from "./motionMath";
import "./ProgressFill.css";

interface ProgressFillProps {
  /** Normalized 0–100 percentage. Callers own the XP/HP/etc. math (e.g.
   *  `getPlayerProfileSummary`'s `progressPercent`) — this component only
   *  clamps and renders it; it never calculates a requirement itself. */
  percent: number;
  tone?: "primary" | "secondary" | "gold" | "success" | "danger";
  label?: string;
  className?: string;
}

/** Same visual role as `controls/ProgressBar.tsx` (kept as-is, still used
 *  elsewhere) but fills via `transform: scaleX` instead of `width` — a
 *  compositor-only property change, matching this task's performance
 *  guidance — and clamps/guards its numeric input defensively. Under
 *  `prefers-reduced-motion: reduce`, `styles/motion.css`'s global rule
 *  already collapses the transition to ~0, so a value change lands on the
 *  final width immediately with no visible interpolation. */
export function ProgressFill({ percent, tone = "secondary", label, className }: ProgressFillProps) {
  const clamped = clampPercent(percent);

  return (
    <div className={["progress-fill", className].filter(Boolean).join(" ")}>
      {label ? <span className="progress-fill__label">{label}</span> : null}
      <div
        className="progress-fill__track"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-fill__bar progress-fill__bar--${tone}`}
          style={{ transform: `scaleX(${clamped / 100})` }}
        />
      </div>
    </div>
  );
}
