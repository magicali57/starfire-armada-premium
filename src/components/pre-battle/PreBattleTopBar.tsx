import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { PlayerState } from "@/types";
import "./PreBattleTopBar.css";

interface PreBattleTopBarProps {
  player: PlayerState;
  onBack: () => void;
  onResourceTap: (label: string) => void;
}

/**
 * Pre-Battle's own lightweight top bar — back button + Energy/Credits/
 * Crystals pills only. Deliberately NOT `HubHeader`: the reference
 * (08_Pre_Battle.png) has no profile/avatar/level/XP block and no
 * mail/settings icons, just a back chevron and three resource pills. Built
 * as its own small component/CSS rather than reusing or modifying
 * `HubHeader`'s markup or styles, per instruction. Pre-Battle uses the
 * "full-screen shell" (SCREEN_NAVIGATION_MAP.md §3.2 / B-15) — this bar is
 * this screen's entire header, with no `HubBottomNav` anywhere below it.
 */
export function PreBattleTopBar({ player, onBack, onResourceTap }: PreBattleTopBarProps) {
  const resources = [
    { id: "energy", icon: RESOURCE_ICON.energy, value: `${player.currencies.energy}/120` },
    { id: "credits", icon: RESOURCE_ICON.credits, value: player.currencies.coins.toLocaleString() },
    { id: "crystals", icon: RESOURCE_ICON.crystals, value: player.currencies.crystals.toLocaleString() },
  ] as const;

  return (
    <div className="pre-battle-top-bar">
      <button
        type="button"
        className="pre-battle-top-bar__back press-scale"
        aria-label="Back to Stage Detail"
        onClick={onBack}
      >
        <BattleModeIcon variant="chevron" size={18} style={{ transform: "rotate(180deg)" }} />
      </button>

      <div className="pre-battle-top-bar__resources">
        {resources.map((resource) => (
          <button
            key={resource.id}
            type="button"
            className="pre-battle-top-bar__pill press-scale"
            onClick={() => onResourceTap(resource.id)}
          >
            <img className="pre-battle-top-bar__pill-icon" src={resource.icon} alt="" />
            <span className="pre-battle-top-bar__pill-value">{resource.value}</span>
            <b className="pre-battle-top-bar__pill-plus" aria-hidden="true">
              +
            </b>
          </button>
        ))}
      </div>
    </div>
  );
}
