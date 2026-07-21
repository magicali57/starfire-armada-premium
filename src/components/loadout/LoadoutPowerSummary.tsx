import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import "./LoadoutPowerSummary.css";

interface LoadoutPowerSummaryProps {
  totalPower: number;
  /** Saved (last-committed) Total Power — used only to show a delta badge
   *  when the draft differs from what's actually saved; omit to hide it. */
  savedPower?: number;
}

/**
 * "Total Power" panel — current draft total, reproducing
 * 10_Loadout_Manager.png's own summary card. `totalPower` always comes from
 * calculateLoadoutTotalPower (data/loadout.ts); this component never
 * computes or hard-codes a number itself. The optional saved-vs-draft delta
 * is shown as a signed badge with a "+"/"-" prefix (not color alone — see
 * the text prefix) so it's readable without relying on color perception.
 */
export function LoadoutPowerSummary({ totalPower, savedPower }: LoadoutPowerSummaryProps) {
  const delta = savedPower !== undefined ? totalPower - savedPower : null;

  return (
    <div className="loadout-power-summary glass-panel">
      <h3 className="loadout-power-summary__heading">
        Total Power
        <i />
      </h3>
      <div className="loadout-power-summary__body">
        <BattleModeIcon variant="swords" size={28} className="loadout-power-summary__icon" />
        <span className="loadout-power-summary__value">{totalPower.toLocaleString()}</span>
        {delta !== null && delta !== 0 ? (
          <span
            className={`loadout-power-summary__delta ${
              delta > 0 ? "loadout-power-summary__delta--up" : "loadout-power-summary__delta--down"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {delta.toLocaleString()} unsaved
          </span>
        ) : null}
      </div>
    </div>
  );
}
