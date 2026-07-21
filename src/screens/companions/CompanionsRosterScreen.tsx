import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { FleetCollectionHeader } from "@/components/fleet/FleetCollectionHeader";
import { CompanionHeroPanel } from "@/components/companions/CompanionHeroPanel";
import { CompanionRoleFilters } from "@/components/companions/CompanionRoleFilters";
import { CompanionSortControl } from "@/components/companions/CompanionSortControl";
import { CompanionRosterGrid } from "@/components/companions/CompanionRosterGrid";
import { CompanionRosterDialog } from "@/components/companions/CompanionRosterDialog";
import { COMPANION_ART } from "@/data/assetRegistry";
import {
  buildCompanionRosterItems,
  filterCompanionRosterItems,
  getCompanionRosterCounts,
  sortCompanionRosterItems,
  type CompanionRosterFilter,
  type CompanionRosterItem,
  type CompanionRosterSort,
} from "@/data/companionRoster";
import { navigate, pathFor, pathForCompanionDetail, pathForCompanionUpgrade } from "@/app/routes";
import "./CompanionsRosterScreen.css";

function resolveCompanionArt(artKey: string): string | undefined {
  return COMPANION_ART[artKey as keyof typeof COMPANION_ART];
}

interface ComingSoonState {
  title: string;
  message: string;
}

type DialogState =
  | { kind: "detail"; item: CompanionRosterItem }
  | { kind: "locked"; item: CompanionRosterItem }
  | { kind: "upgrade"; item: CompanionRosterItem }
  | { kind: "equipSuccess"; item: CompanionRosterItem }
  | { kind: "invalid"; message: string }
  | null;

/**
 * Companions Roster (17_Companions_Roster.png) — real route at
 * #/inventory/companions. Uses the standard <HubScreenShell>/<HubHeader>/
 * <HubBottomNav> hub pattern (unlike Loadout Manager's bespoke footerless
 * shell) since the reference clearly shows the normal 5-tab footer. See the
 * completion report for the full disclosure of the hero-panel addition,
 * the role-label/filter normalization, the Level-60-vs-Level-20 and
 * Supply-Drone-star-row reference inconsistencies, and the
 * rank-progress-instead-of-fragments presentation choice.
 *
 * Fleet navigation correction (see
 * COMPANIONS_FLEET_NAVIGATION_FIX_REPORT.md): Companions is visually
 * classified under Fleet, not Inventory — the bottom nav's active tab is
 * "fleet" (not "inventory"). The internal route path
 * (`#/inventory/companions`) is unchanged; only the visible classification
 * and Back/return-target defaults moved to Fleet.
 *
 * Alignment correction (see FLEET_COMPANIONS_ALIGNMENT_FIX_REPORT.md): the
 * title region now uses the shared <FleetCollectionHeader> (title +
 * subtitle + count + the Ships/Companions selector) instead of the old
 * <CompanionsRosterTitle> (still present in the codebase but no longer
 * rendered here — see the report for why it wasn't deleted). The large
 * Back-arrow button was removed from the normal Fleet flow: the SHIPS tab
 * inside the shared selector is now the one control that returns to Fleet
 * Roster, so a second control performing the same action was redundant.
 * `getCompanionRosterReturnTarget` itself (data/companionRoster.ts) is
 * untouched and still exported/functional — only this screen's own use of
 * it (to drive the removed Back button) was dropped.
 */
export function CompanionsRosterScreen() {
  const { player, saveActiveLoadout } = usePlayerStore();

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const items = useMemo(
    () => buildCompanionRosterItems(player, resolveCompanionArt),
    [player],
  );
  const counts = useMemo(() => getCompanionRosterCounts(player), [player]);

  const [filter, setFilter] = useState<CompanionRosterFilter>("all");
  const [sort, setSort] = useState<CompanionRosterSort>("roster");
  const [focusedId, setFocusedId] = useState<string | null>(
    () => player.activeLoadout.companionId ?? items.find((i) => i.owned)?.id ?? items[0]?.id ?? null,
  );
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  const visibleItems = useMemo(
    () => sortCompanionRosterItems(filterCompanionRosterItems(items, filter), sort),
    [items, filter, sort],
  );

  const focusedItem = items.find((item) => item.id === focusedId) ?? items[0] ?? null;

  // Fleet-level category switch — Companions Roster IS the Companions
  // branch, so "Companions" is always active here and re-selecting it is a
  // no-op (no redundant route reload). "Ships" navigates to the existing
  // Fleet Roster route.
  const handleSelectShips = () => navigate("ship-selection");

  const handleSelect = (item: CompanionRosterItem) => {
    if (!item.owned) return;
    setFocusedId(item.id);
  };

  const handleInfo = (item: CompanionRosterItem) => {
    // Navigates to the real Companion Detail screen for both owned and
    // locked companions (task's explicit instruction: locked cards may
    // also open Detail to view art/role/behavior/acquisition/locked state
    // rather than staying on the old temporary "Companion Detail Coming
    // Soon" modal — CompanionRosterDialog's "detail"/"locked" kinds are no
    // longer invoked from here as of this change, though the component
    // itself is left unmodified). Filter/sort/scroll state is not
    // preserved across this navigation — a simple return to the Roster's
    // default state on Back is an explicitly accepted trade-off (no
    // save-schema field exists for roster filter/sort state).
    window.location.hash = pathForCompanionDetail(item.id, "companions");
  };

  const handleUpgradeInfo = (item: CompanionRosterItem) => {
    if (!item.owned || !item.upgradeReady) return;
    window.location.hash = pathForCompanionUpgrade(item.id, "companions");
  };

  const handleEquip = () => {
    if (!focusedItem || !focusedItem.owned || focusedItem.equipped) return;
    // Reuses the exact atomic transaction Loadout Manager itself uses —
    // copies the real, currently-saved activeLoadout and replaces only
    // companionId, never touching core/plating/system modules,
    // currencies, materials, levels, ranks, or ownership. See the
    // completion report's "Loadout draft safety" section for the
    // disclosed interaction with Loadout Manager's own in-memory draft
    // cache (a real but pre-existing, task-sanctioned edge case, not
    // something this screen can safely reach into and fix).
    const result = saveActiveLoadout({ ...player.activeLoadout, companionId: focusedItem.id });
    if (result.success) {
      setDialog({ kind: "equipSuccess", item: focusedItem });
    } else {
      setDialog({ kind: "invalid", message: "This companion could not be equipped." });
    }
  };

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
        footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}
      >
        <div className="companions-roster__content">
          <FleetCollectionHeader
            title="Companions"
            subtitle="Support units and drones"
            countText={`${counts.owned} of ${counts.total} companions acquired`}
            activeCategory="companions"
            onSelectShips={handleSelectShips}
            onSelectCompanions={() => {}}
            onSelectModules={() => { window.location.hash = pathFor("modules"); }}
          />

          {focusedItem ? (
            <CompanionHeroPanel
              companion={focusedItem}
              onDetails={() => handleInfo(focusedItem)}
              onEquip={handleEquip}
            />
          ) : null}

          <div className="companions-roster__controls">
            <CompanionRoleFilters active={filter} onSelect={setFilter} />
            <CompanionSortControl value={sort} onChange={setSort} />
          </div>

          <CompanionRosterGrid
            items={visibleItems}
            focusedId={focusedId}
            onSelect={handleSelect}
            onInfo={handleInfo}
            onUpgradeInfo={handleUpgradeInfo}
            onResetFilters={() => setFilter("all")}
          />
        </div>
      </HubScreenShell>

      <ModalLayer
        open={dialog !== null}
        title={
          dialog?.kind === "invalid"
            ? "Companion"
            : dialog?.kind === "equipSuccess"
              ? "Equipped"
              : dialog?.kind === "upgrade"
                ? "Upgrade"
                : dialog && "item" in dialog
                  ? dialog.item.name
                  : ""
        }
        onClose={() => setDialog(null)}
      >
        {dialog ? <CompanionRosterDialog {...dialog} onClose={() => setDialog(null)} /> : null}
      </ModalLayer>

      <LockedContentModal
        open={comingSoon !== null}
        title={comingSoon?.title ?? ""}
        unlockRequirement={comingSoon?.message ?? "Coming soon."}
        onClose={() => setComingSoon(null)}
      />
    </>
  );
}
