import type { SVGProps } from "react";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ShipDetailCoreStats } from "@/data/shipDetail";
import "./ShipDetailStatGrid.css";

interface ShipDetailStatGridProps {
  stats: ShipDetailCoreStats;
}

// Small local coded-SVG icon set, scoped to this file only — not added to
// the shared BattleModeIcon.tsx, since this task's file-scope is limited to
// the new Ship Detail files plus routes.tsx/App.tsx/AppShell.tsx.
// BattleModeIcon has no heart/ammo/speed-lines equivalent, so these four are
// small hand-built vector stand-ins in the same "currentColor" style
// BattleModeIcon already uses — no emoji/Unicode, no new raster artwork.
// Defense and Crit Rate reuse BattleModeIcon's existing "shield" and "star"
// variants directly, since those are already close functional matches.
function StatIcon({ variant, size = 20 }: { variant: "heart" | "burst" | "ammo" | "speed"; size?: number }) {
  const common: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true,
  };

  switch (variant) {
    case "heart":
      return (
        <svg {...common}>
          <path
            d="M12 20.2 4.9 13.3C2.6 11 2.9 7.2 5.6 5.4c2-1.3 4.6-.9 6.1.9l.3.4.3-.4c1.5-1.8 4.1-2.2 6.1-.9 2.7 1.8 3 5.6.7 7.9L12 20.2Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "burst":
      return (
        <svg {...common}>
          <path
            d="M12 2.6 13.8 8.6 19.4 6 16.6 11.4 22.4 12 16.6 12.6 19.4 18 13.8 15.4 12 21.4 10.2 15.4 4.6 18 7.4 12.6 1.6 12 7.4 11.4 4.6 6 10.2 8.6 12 2.6Z"
            fill="currentColor"
          />
        </svg>
      );
    case "ammo":
      return (
        <svg {...common}>
          <rect x="4" y="6" width="3" height="12" rx="1.2" fill="currentColor" />
          <rect x="9" y="4" width="3" height="14" rx="1.2" fill="currentColor" opacity="0.85" />
          <rect x="14" y="6" width="3" height="12" rx="1.2" fill="currentColor" opacity="0.7" />
          <rect x="19" y="8" width="2.2" height="10" rx="1.1" fill="currentColor" opacity="0.55" />
        </svg>
      );
    case "speed":
      return (
        <svg {...common}>
          <path
            d="M5 6 10 12 5 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M11.5 6 16.5 12 11.5 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.75"
          />
          <path
            d="M18 6 22 12 18 18"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>
      );
    default:
      return null;
  }
}

interface StatCell {
  key: string;
  label: string;
  value: string;
  icon: "heart" | "burst" | "ammo" | "speed" | "shield" | "star";
}

/**
 * Reproduces the Core Stats 6-cell row from 09_Ship_Detail_Overview.png:
 * HP / Damage / Fire Rate / Speed / Defense / Crit Rate, each icon-over-
 * label-over-value with a green "improved" indicator. Values come straight
 * from calculateShipStats via shipDetail.ts — real for every ship.
 *
 * The earlier Campaign Stage Detail screen had a mobile alignment bug in a
 * similarly dense stat grid (icon/label/value columns drifting at narrow
 * widths — see docs/handoffs/campaign-stage-detail's stat-grid fix report).
 * To not repeat it: every cell has a fixed icon slot, `min-width: 0`, and
 * the grid wraps to 2 rows of 3 columns below ~380px instead of squeezing
 * 6 columns into one row like the reference's much wider capture can.
 */
export function ShipDetailStatGrid({ stats }: ShipDetailStatGridProps) {
  const cells: StatCell[] = [
    { key: "hp", label: "HP", value: stats.hp.toLocaleString(), icon: "heart" },
    { key: "damage", label: "Damage", value: stats.damage.toLocaleString(), icon: "burst" },
    { key: "fireRate", label: "Fire Rate", value: `${stats.fireRate.toFixed(2)} /s`, icon: "ammo" },
    { key: "speed", label: "Speed", value: `${stats.speed}`, icon: "speed" },
    { key: "defense", label: "Defense", value: stats.defense.toLocaleString(), icon: "shield" },
    { key: "critRate", label: "Crit Rate", value: `${stats.critRate}%`, icon: "star" },
  ];

  return (
    <div className="ship-detail-stat-grid">
      <div className="ship-detail-stat-grid__heading">
        <span>Core Stats</span>
        <i aria-hidden="true" />
      </div>
      <div className="ship-detail-stat-grid__cells">
        {cells.map((cell) => (
          <div className="ship-detail-stat-grid__cell" key={cell.key}>
            <span className="ship-detail-stat-grid__icon">
              {cell.icon === "shield" || cell.icon === "star" ? (
                <BattleModeIcon variant={cell.icon} size={20} />
              ) : (
                <StatIcon variant={cell.icon} size={20} />
              )}
            </span>
            <span className="ship-detail-stat-grid__label">{cell.label}</span>
            <span className="ship-detail-stat-grid__value">
              {cell.value}
              <BattleModeIcon
                variant="chevron"
                size={11}
                className="ship-detail-stat-grid__up"
                style={{ transform: "rotate(-90deg)" }}
              />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
