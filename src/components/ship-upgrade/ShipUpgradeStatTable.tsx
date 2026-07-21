import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ShipUpgradeStatRow } from "@/data/shipUpgrade";
import "./ShipUpgradeStatTable.css";

interface ShipUpgradeStatTableProps {
  rows: ShipUpgradeStatRow[];
  currentLevel: number;
  nextLevel: number | null;
  atMaxLevel: boolean;
}

/**
 * Six-row STAT / CURRENT / NEXT / INCREASE comparison table, reproducing
 * 11_Ship_Level_Up.png. Values come pre-formatted from
 * data/shipUpgrade.ts's buildStatComparisonRows — this component only lays
 * them out. At max level, `rows[].next`/`.increase` are null (per
 * buildStatComparisonRows' contract) and the NEXT/INCREASE columns render a
 * single "MAX" treatment instead of a fabricated Level 21 value.
 */
export function ShipUpgradeStatTable({ rows, currentLevel, nextLevel, atMaxLevel }: ShipUpgradeStatTableProps) {
  return (
    <div className="ship-upgrade-stat-table glass-panel">
      <div className="ship-upgrade-stat-table__header">
        <span className="ship-upgrade-stat-table__header-cell ship-upgrade-stat-table__header-cell--stat" />
        <span className="ship-upgrade-stat-table__header-cell ship-upgrade-stat-table__header-cell--current">
          Current (Lv. {currentLevel})
        </span>
        <span className="ship-upgrade-stat-table__header-cell ship-upgrade-stat-table__header-cell--dir" />
        {atMaxLevel ? (
          <span className="ship-upgrade-stat-table__header-cell ship-upgrade-stat-table__header-cell--max">
            Max Level
          </span>
        ) : (
          <>
            <span className="ship-upgrade-stat-table__header-cell ship-upgrade-stat-table__header-cell--next">
              Next (Lv. {nextLevel})
            </span>
            <span className="ship-upgrade-stat-table__header-cell ship-upgrade-stat-table__header-cell--increase">
              Increase
            </span>
          </>
        )}
      </div>

      {rows.map((row) => (
        <div className="ship-upgrade-stat-table__row" key={row.key}>
          <span className="ship-upgrade-stat-table__stat">
            <img className="ship-upgrade-stat-table__icon" src={row.icon} alt="" />
            <span className="ship-upgrade-stat-table__label">{row.label}</span>
          </span>
          <span className="ship-upgrade-stat-table__current">{row.current}</span>
          <BattleModeIcon variant="chevron" size={14} className="ship-upgrade-stat-table__row-dir" />
          {row.next === null || row.increase === null ? (
            <span className="ship-upgrade-stat-table__max" aria-label={`${row.label} at maximum level`}>
              MAX
            </span>
          ) : (
            <>
              <span className="ship-upgrade-stat-table__next">{row.next}</span>
              <span className="ship-upgrade-stat-table__increase">
                {row.increase}
                <BattleModeIcon variant="chevron" size={11} className="ship-upgrade-stat-table__increase-arrow" />
              </span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
