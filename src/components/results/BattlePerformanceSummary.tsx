import type { CSSProperties, ReactNode } from "react";
import { BattleModeIcon, type BattleModeIconVariant } from "@/components/icons/BattleModeIcon";
import { NeonPanel } from "@/components/cards/NeonPanel";
import type { BattlePerformance } from "@/systems/battleSession";
import "./BattlePerformanceSummary.css";

interface StatRow {
  key: string;
  icon: BattleModeIconVariant;
  label: string;
  value: ReactNode;
}

function formatCompletionTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

interface BattlePerformanceSummaryProps {
  performance: BattlePerformance | null;
}

/**
 * Renders ONLY the BattlePerformance fields the canonical result genuinely
 * supplies — every row is individually omitted when its field is
 * undefined. Never invents a zero or placeholder statistic (the current
 * placeholder gameplay canvas supplies none of these yet, so this
 * component correctly renders nothing until a real engine starts passing
 * performance data through declareBattleVictory/declareBattleDefeat).
 */
export function BattlePerformanceSummary({ performance }: BattlePerformanceSummaryProps) {
  if (!performance) return null;

  const rows: StatRow[] = [];
  if (typeof performance.score === "number") {
    rows.push({ key: "score", icon: "target", label: "Score", value: performance.score.toLocaleString() });
  }
  if (typeof performance.enemiesDestroyed === "number") {
    rows.push({ key: "enemies", icon: "swords", label: "Enemies Destroyed", value: performance.enemiesDestroyed });
  }
  if (typeof performance.bossesDestroyed === "number") {
    rows.push({ key: "bosses", icon: "skull", label: "Bosses Destroyed", value: performance.bossesDestroyed });
  }
  if (typeof performance.completionTimeMs === "number") {
    rows.push({ key: "time", icon: "clock", label: "Completion Time", value: formatCompletionTime(performance.completionTimeMs) });
  }
  if (typeof performance.remainingHpPercent === "number") {
    rows.push({ key: "hp-percent", icon: "heart", label: "Remaining HP", value: `${Math.round(performance.remainingHpPercent)}%` });
  } else if (typeof performance.remainingHp === "number") {
    rows.push({ key: "hp", icon: "heart", label: "Remaining HP", value: performance.remainingHp.toLocaleString() });
  }
  if (typeof performance.damageTaken === "number") {
    rows.push({ key: "damage", icon: "shield", label: "Damage Taken", value: performance.damageTaken.toLocaleString() });
  }
  if (performance.noDamage === true) {
    rows.push({ key: "no-damage", icon: "check", label: "No Damage Taken", value: "Flawless" });
  }
  if (typeof performance.starsEarned === "number") {
    rows.push({ key: "stars", icon: "star", label: "Stars Earned", value: `${performance.starsEarned}` });
  }

  if (rows.length === 0) return null;

  return (
    <NeonPanel tone="neutral" className="battle-performance-summary">
      <h3>Performance</h3>
      <ul className="battle-performance-summary__grid">
        {rows.map((row, index) => (
          <li
            key={row.key}
            className="battle-performance-summary__stat"
            style={{ "--reveal-index": index } as CSSProperties}
          >
            <BattleModeIcon variant={row.icon} size={18} />
            <span className="battle-performance-summary__value">{row.value}</span>
            <span className="battle-performance-summary__label">{row.label}</span>
          </li>
        ))}
      </ul>
    </NeonPanel>
  );
}
