import type { LoadoutStatContributionRow } from "@/data/loadout";
import "./LoadoutStatContributions.css";

interface LoadoutStatContributionsProps {
  rows: LoadoutStatContributionRow[];
}

/**
 * "Loadout Stat Contribution" panel — all six bonus categories (Attack,
 * Health, Critical Rate, Critical Damage, Armor, Energy Regen), reproducing
 * 10_Loadout_Manager.png. Formatting (flat integer vs. percentage) is
 * decided upstream in data/loadout.ts's formatStatContribution — see that
 * file's header comment for the disclosed deviation from a generic
 * "all six as percentage" rule (the reference itself only formats three of
 * the six that way). Updates immediately as the draft loadout changes;
 * this component itself has no state.
 */
export function LoadoutStatContributions({ rows }: LoadoutStatContributionsProps) {
  return (
    <div className="loadout-stat-contributions glass-panel">
      <h3 className="loadout-stat-contributions__heading">
        Loadout Stat Contribution
        <i />
      </h3>
      <div className="loadout-stat-contributions__grid">
        {rows.map((row) => (
          <div className="loadout-stat-contributions__row" key={row.key}>
            <img src={row.icon} alt="" />
            <span className="loadout-stat-contributions__label">{row.label}</span>
            <span className="loadout-stat-contributions__value">{row.formattedValue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
