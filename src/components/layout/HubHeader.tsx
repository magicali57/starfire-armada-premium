import { HOME_TOPBAR_FINAL } from "@/data/assetRegistry";
import type { PlayerState } from "@/types";
import "./HubHeader.css";

interface HubHeaderProps {
  player: PlayerState;
  xpPct: number;
  onOpen?: (title: string, message: string) => void;
}

/**
 * Reusable top header for every non-Home hub screen (Battle Hub first).
 *
 * This visually reproduces the completed Home screen's own top bar exactly
 * — same assets (`HOME_TOPBAR_FINAL`), same structure, same sizing — so
 * every hub after Home shares one consistent header. It is modeled on
 * `HomeScreen.tsx`'s private `HomeTopBar` but is a separate implementation:
 * Home itself is frozen and was not touched or refactored to produce this,
 * since extracting Home's own code risked a visual regression there. This
 * component and Home's inline bar should always be kept in visual sync by
 * hand if either ever changes.
 */
export function HubHeader({ player, xpPct, onOpen = () => {} }: HubHeaderProps) {
  const mailBadgeCount = 2;
  const resources = [
    { id: "energy", icon: HOME_TOPBAR_FINAL.energy, value: `${player.currencies.energy}/120` },
    { id: "coins", icon: HOME_TOPBAR_FINAL.coin, value: player.currencies.coins.toLocaleString() },
    { id: "crystals", icon: HOME_TOPBAR_FINAL.gem, value: player.currencies.crystals.toLocaleString() },
  ] as const;

  return (
    // Must be rendered as the `header` of a <HubScreenShell> — that makes
    // this region grid row 1 of Home's own grid recipe (--hub-shell-rows,
    // tokens.css), which is what gives it Home's exact block height. The
    // inner <header> keeps its original intrinsic height/margin-top
    // unchanged and simply sits at the top of that row (align-self: start,
    // see HubHeader.css) — reproducing Home's own `.home-final__topbar`
    // behavior without altering the header bar's own sizing.
    <div className="hub-header-region">
      <header className="hub-header">
        <button
          className="hub-header__profile press-scale"
          type="button"
          onClick={() => onOpen("Profile", "Player profile is coming soon.")}
        >
          <img className="hub-header__profile-panel-frame" src={HOME_TOPBAR_FINAL.profileFrame} alt="" />
          <span className="hub-header__avatar-wrap">
            <img className="hub-header__avatar" src={HOME_TOPBAR_FINAL.avatar} alt="Player avatar" />
          </span>
          <span className="hub-header__profile-copy">
            <strong>{player.displayName}</strong>
            <span className="hub-header__level">Lv. {player.level}</span>
            <span className="hub-header__xp">
              <i style={{ width: `${xpPct}%` }} />
            </span>
            <small>
              {player.xp.toLocaleString()} / {player.xpToNextLevel.toLocaleString()}
            </small>
          </span>
        </button>

        <div className="hub-header__resource-list" aria-label="Player resources">
          {resources.map((resource) => (
            <button
              key={resource.id}
              className="hub-header__resource press-scale"
              type="button"
              onClick={() => onOpen(resource.id, "Resource details are coming soon.")}
            >
              <img className="hub-header__resource-frame" src={HOME_TOPBAR_FINAL.resourceFrame} alt="" />
              <img className="hub-header__resource-icon" src={resource.icon} alt="" />
              <span>{resource.value}</span>
              <b className="hub-header__resource-plus" aria-hidden="true">
                +
              </b>
            </button>
          ))}
          <button
            className="hub-header__top-action press-scale"
            type="button"
            aria-label="Inbox"
            onClick={() => onOpen("Inbox", "Inbox is coming soon.")}
          >
            <img src={HOME_TOPBAR_FINAL.utilityFrame} alt="" />
            <img src={HOME_TOPBAR_FINAL.mail} alt="" />
            {mailBadgeCount > 0 ? <b>{mailBadgeCount}</b> : null}
          </button>
          <button
            className="hub-header__top-action press-scale"
            type="button"
            aria-label="Settings"
            onClick={() => onOpen("Settings", "Settings are coming soon.")}
          >
            <img src={HOME_TOPBAR_FINAL.utilityFrame} alt="" />
            <img src={HOME_TOPBAR_FINAL.settings} alt="" />
          </button>
        </div>
      </header>
    </div>
  );
}
