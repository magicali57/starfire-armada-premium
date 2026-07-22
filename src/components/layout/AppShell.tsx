import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { useHashRoute } from "@/app/useHashRoute";
import "./AppShell.css";

export function AppShell({ children }: { children: ReactNode }) {
  // The Home Dashboard replaces the generic bottom tab bar with its own
  // 5-shortcut row (see HomeScreen's region G) per the strict rebuild spec.
  // Battle Hub, Campaign Overview, Campaign Chapter Map, the real Stage
  // Detail screen, its relocated legacy placeholder, the real Fleet Roster
  // screen (now rendered at the "ship-selection" route id), and the
  // relocated Ship Detail legacy placeholder all do the same via their own
  // <HubBottomNav /> (reproducing the Home nav exactly, see
  // HubBottomNav.tsx) — so the shared, stale BottomNavigation must be
  // suppressed there too, or it would double-render underneath it. The
  // real Pre-Battle screen, its relocated legacy placeholder (which still
  // renders <HubScreenShell>/<HubBottomNav> itself, unmodified), the
  // Battle Launch placeholder, and the real Ship Detail screen
  // ("ship-detail-placeholder", now ShipDetailScreen — its own reference,
  // 09_Ship_Detail_Overview.png, has no HubHeader/HubBottomNav-style shell
  // at all, confirmed by direct inspection, not assumed — see
  // docs/handoffs/ship-detail/SHIP_DETAIL_PLAN.md §3) use B-15's
  // "full-screen shell" instead (SCREEN_NAVIGATION_MAP.md §3.2) — no
  // bottom navigation at all, shared or otherwise — so they're excluded
  // here too. The real Ship Level Up screen ("ship-upgrade", reproducing
  // 11_Ship_Level_Up.png) renders its own <HubScreenShell>/<HubBottomNav>
  // just like Fleet Roster — its reference shows the same 5-tab bottom
  // navigation, not a screen-owned action row like Ship Detail's — so it's
  // excluded here too, for the same double-footer reason as Fleet Roster.
  // The real Loadout Manager screen ("loadout", reproducing
  // 10_Loadout_Manager.png) uses a bespoke hybrid shell — the shared
  // <HubHeader /> only, deliberately with NO bottom navigation at all (not
  // even a screen-owned one) per its own spec, since a Save/Reset action
  // row already occupies that space — so it's excluded here too, for the
  // same double-footer reason as Ship Detail/Pre-Battle above.
  // The real Companions Roster screen ("companions", reproducing
  // 17_Companions_Roster.png) renders its own <HubScreenShell>/
  // <HubBottomNav active="fleet"> just like Fleet Roster/Ship Level Up.
  // Companion screens are now visually owned by Fleet; their existing
  // internal /inventory/companions paths remain unchanged for compatibility.
  // The screen is excluded here too, for the same double-footer reason as
  // those two screens.
  // The real Companion Detail screen ("companion-detail", reproducing
  // 18_Companion_Detail.png, dynamic route) renders its own
  // <HubScreenShell>/<HubBottomNav active="fleet"> for the same reason
  // as Companions Roster above. It is excluded here too, for the same
  // double-footer reason.
  // Modules Inventory, Module Detail, and Module Upgrade own the standard
  // hub shell with Fleet active, so the generic footer is suppressed.
  // The relocated legacy Campaign screen
  // (#/campaign/chapter-map/legacy) and the relocated legacy Ship
  // Selection screen (#/ships/legacy-roster) both still render bare
  // content with the old shared header/nav as they always have, so
  // they're intentionally left out of this list (confirmed by direct
  // inspection of ShipSelectionScreen.tsx — it renders no shell of its
  // own). Every other screen keeps the shared BottomNavigation exactly as
  // before.
  const route = useHashRoute();
  const showBottomNav =
    route !== "home" &&
    route !== "battle" &&
    route !== "campaign" &&
    route !== "campaign-chapter-map" &&
    route !== "stage-detail" &&
    route !== "stage-detail-legacy-placeholder" &&
    route !== "pre-battle-placeholder" &&
    route !== "pre-battle-legacy-placeholder" &&
    route !== "battle-launch" &&
    route !== "ship-selection" &&
    route !== "ship-detail-placeholder" &&
    route !== "ship-detail-legacy-placeholder" &&
    route !== "ship-upgrade" &&
    route !== "ship-star-rank" &&
    route !== "ship-abilities" &&
    route !== "inventory" &&
    route !== "loadout" &&
    route !== "companions" &&
    route !== "companion-detail" &&
    route !== "companion-upgrade" &&
    route !== "modules" &&
    route !== "module-upgrade" &&
    route !== "module-detail" &&
    route !== "arsenal" &&
    route !== "weapon-detail" &&
    route !== "weapon-upgrade" &&
    // Player Profile ("profile") renders its own <HubScreenShell>/
    // <HubBottomNav>, same double-footer reason as Arsenal/Companions/
    // Modules above.
    route !== "profile" &&
    // Shop Hub (#/shop) owns HubScreenShell + HubBottomNav.
    route !== "shop" &&
    // Chest Vault (#/inventory/chests) owns HubScreenShell + HubBottomNav.
    route !== "chest-opening" &&
    // Daily Missions (#/missions/daily) owns HubScreenShell + HubBottomNav.
    route !== "daily-missions";
  const isHome = route === "home";

  return (
    <div className="app-shell">
      <div className={`app-shell__frame${isHome ? " app-shell__frame--home" : ""}`}>
        <main
          className={`app-shell__content${showBottomNav ? "" : " app-shell__content--no-nav"}${
            isHome ? " app-shell__content--home" : ""
          }`}
        >
          {children}
        </main>
        {showBottomNav ? <BottomNavigation /> : null}
      </div>
    </div>
  );
}
