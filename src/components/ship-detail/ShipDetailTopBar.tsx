import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { HOME_TOPBAR_FINAL, RESOURCE_ICON } from "@/data/assetRegistry";
import type { PlayerState } from "@/types";
import "./ShipDetailTopBar.css";

interface ShipDetailTopBarProps {
  player: PlayerState;
  onBack: () => void;
  onOpen: (title: string, message: string) => void;
}

/**
 * Ship Detail's own lightweight top bar — own component/CSS, not HubHeader
 * (the reference has no avatar/level/XP block). Mail/settings reuse
 * HOME_TOPBAR_FINAL's existing assets, same ones HubHeader already uses for
 * the same two buttons — no new artwork. Part of Ship Detail's full-screen
 * shell (SCREEN_NAVIGATION_MAP.md §3.2) — no HubBottomNav anywhere below it.
 *
 * Two rows, per the approved mobile header layout:
 *   Row 1 — back + Energy/Credits/Crystals pills + Mail + Settings.
 *   Row 2 — "Ship Detail" / "Overview" only, left-aligned to match the
 *           scroll content's own padding so the title reads as connected
 *           to the hero panel beneath it rather than floating inside the
 *           back/resources row.
 * (Earlier revision paired back+title in row 1 and pills alone in row 2 —
 * see docs/handoffs/ship-detail/SHIP_DETAIL_MOBILE_FIX_REPORT.md for that
 * version's fix. This revision regroups back+pills+mail+settings into row 1
 * and demotes the title to its own row per your latest instruction.)
 */
export function ShipDetailTopBar({ player, onBack, onOpen }: ShipDetailTopBarProps) {
  const mailBadgeCount = 2;
  const resources = [
    { id: "energy", icon: RESOURCE_ICON.energy, value: `${player.currencies.energy}/120` },
    { id: "credits", icon: RESOURCE_ICON.credits, value: player.currencies.coins.toLocaleString() },
    { id: "crystals", icon: RESOURCE_ICON.crystals, value: player.currencies.crystals.toLocaleString() },
  ] as const;

  return (
    <div className="ship-detail-top-bar">
      <div className="ship-detail-top-bar__row1">
        <button
          type="button"
          className="ship-detail-top-bar__back press-scale"
          aria-label="Back to Fleet Roster"
          onClick={onBack}
        >
          <BattleModeIcon variant="chevron" size={17} style={{ transform: "rotate(180deg)" }} />
        </button>

        <div className="ship-detail-top-bar__resources" aria-label="Player resources">
          {resources.map((resource) => (
            <button
              key={resource.id}
              type="button"
              className="ship-detail-top-bar__pill press-scale"
              onClick={() => onOpen(resource.id, "Resource details are coming soon.")}
            >
              <img className="ship-detail-top-bar__pill-icon" src={resource.icon} alt="" />
              <span className="ship-detail-top-bar__pill-value">{resource.value}</span>
              <b className="ship-detail-top-bar__pill-plus" aria-hidden="true">
                +
              </b>
            </button>
          ))}
        </div>

        <div className="ship-detail-top-bar__utility-group">
          <button
            type="button"
            className="ship-detail-top-bar__utility press-scale"
            aria-label="Inbox"
            onClick={() => onOpen("Inbox", "Inbox is coming soon.")}
          >
            <img src={HOME_TOPBAR_FINAL.utilityFrame} alt="" />
            <img src={HOME_TOPBAR_FINAL.mail} alt="" />
            {mailBadgeCount > 0 ? <b>{mailBadgeCount}</b> : null}
          </button>
          <button
            type="button"
            className="ship-detail-top-bar__utility press-scale"
            aria-label="Settings"
            onClick={() => onOpen("Settings", "Settings are coming soon.")}
          >
            <img src={HOME_TOPBAR_FINAL.utilityFrame} alt="" />
            <img src={HOME_TOPBAR_FINAL.settings} alt="" />
          </button>
        </div>
      </div>

      <div className="ship-detail-top-bar__title-row">
        <span className="ship-detail-top-bar__title-main">Ship Detail</span>
        <span className="ship-detail-top-bar__title-sub">Overview</span>
      </div>
    </div>
  );
}
