import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { CompanionBehaviorInfo } from "@/data/companionDetail";
import type { LoadoutStatContributionRow } from "@/data/loadout";
import "./CompanionEffectList.css";

interface CompanionEffectListProps {
  behavior: CompanionBehaviorInfo;
  statRows: LoadoutStatContributionRow[];
}

/**
 * The 2x2 effect-stat grid + "Utility Benefits" bullet list from
 * 18_Companion_Detail.png's "Skill & Effects" panel (prototype/descriptive
 * flavor data — see CompanionBehaviorPanel's doc comment), plus a real,
 * separately-labeled "Loadout Contribution" block underneath using the
 * companion's actual `statContributions` (reused verbatim from
 * data/loadout.ts's calculateCompanionStatContributions/
 * buildStatContributionRows — the same helpers/formatting Loadout Manager
 * already uses for this exact companion). The reference's own "Skill &
 * Effects" grid does not show these six generic fields (Attack/Health/
 * Crit Rate/Crit Damage/Armor/Energy Regen) — this block is an intentional
 * addition beyond the bitmap, added because the task explicitly requires
 * surfacing real `companion.statContributions` data (§18), disclosed in
 * the completion report. Only non-zero rows render, matching Loadout
 * Manager's own item-info dialog behavior.
 */
export function CompanionEffectList({ behavior, statRows }: CompanionEffectListProps) {
  return (
    <div className="companion-effect-list glass-panel">
      {behavior.effectStats.length > 0 ? (
        <div className="companion-effect-list__grid">
          {behavior.effectStats.map((stat, i) => (
            <div className="companion-effect-list__stat" key={i}>
              <BattleModeIcon variant={stat.icon} size={16} />
              <span>
                <small>{stat.label}</small>
                <strong>{stat.value}</strong>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {behavior.utilityBenefits.length > 0 ? (
        <div className="companion-effect-list__benefits">
          <h3 className="companion-effect-list__benefits-heading">Utility Benefits</h3>
          <ul>
            {behavior.utilityBenefits.map((line, i) => (
              <li key={i}>
                <BattleModeIcon variant="check" size={12} />
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {statRows.length > 0 ? (
        <div className="companion-effect-list__contributions">
          <h3 className="companion-effect-list__benefits-heading">Loadout Contribution</h3>
          <div className="companion-effect-list__contribution-grid">
            {statRows.map((row) => (
              <div className="companion-effect-list__contribution-row" key={row.key}>
                <img src={row.icon} alt="" />
                <span>{row.label}</span>
                <strong>{row.formattedValue}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
