import "./ProgressBar.css";

interface ProgressBarProps {
  value: number;
  max: number;
  tone?: "primary" | "secondary" | "gold" | "success" | "danger";
  label?: string;
}

export function ProgressBar({ value, max, tone = "secondary", label }: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="progress-bar">
      {label ? <span className="progress-bar__label">{label}</span> : null}
      <div
        className="progress-bar__track"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`progress-bar__fill progress-bar__fill--${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
