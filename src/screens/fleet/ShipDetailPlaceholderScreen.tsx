import { useMemo } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { getShipById } from "@/data";
import { navigate } from "@/app/routes";
import "./ShipDetailPlaceholderScreen.css";

/**
 * Minimal temporary destination for Fleet Roster's "Details" button — same
 * bare, disclosed-placeholder treatment as `StageDetailPlaceholderScreen`.
 * Ship id rides along as a "?id=" suffix, same convention as every other
 * placeholder in this project. No stat breakdown, no upgrade tree — that's
 * the real Ship Detail screen's job, not this placeholder's.
 */
export function ShipDetailPlaceholderScreen() {
  const { player } = usePlayerStore();
  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const shipId = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return undefined;
    return new URLSearchParams(hash.slice(queryIndex + 1)).get("id") ?? undefined;
  }, []);

  const ship = shipId ? getShipById(shipId) : undefined;

  return (
    <HubScreenShell
      header={
        <HubHeader
          player={player}
          xpPct={xpPct}
          onOpen={() => {
            /* no-op: header taps aren't wired on this placeholder */
          }}
        />
      }
      footer={
        <HubBottomNav
          active="fleet"
          onComingSoon={() => {
            /* no-op: nav Coming-Soon taps aren't wired on this placeholder */
          }}
        />
      }
    >
      <div className="ship-detail-placeholder__content">
        <div className="ship-detail-placeholder__card">
          <span className="ship-detail-placeholder__eyebrow">{ship ? ship.name : "Ship Detail"}</span>
          <h1 className="ship-detail-placeholder__title">Ship Detail Coming Soon</h1>
          <p className="ship-detail-placeholder__message">
            The full Ship Detail screen — passive/calamity breakdown, weapon-level preview, and skin
            selection — isn't built yet. This is a placeholder so the Details button isn't a dead end.
          </p>
          <SecondaryButton fullWidth onClick={() => navigate("ship-selection")}>
            Back to Fleet
          </SecondaryButton>
        </div>
      </div>
    </HubScreenShell>
  );
}
