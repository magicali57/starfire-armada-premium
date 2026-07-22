import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { FleetFeaturedPanel } from "@/components/fleet/FleetFeaturedPanel";
import { FleetRoleFilterBar, type FleetRoleFilter } from "@/components/fleet/FleetRoleFilterBar";
import { FleetShipCard } from "@/components/fleet/FleetShipCard";
import { FleetCollectionHeader } from "@/components/fleet/FleetCollectionHeader";
import { SHIPS, getShipById } from "@/data";
import {
  FLEET_FEATURED_DEFAULT,
  getFleetFeaturedStats,
  getFleetRosterEntry,
  getFleetRosterOrder,
  type FleetRosterCardData,
} from "@/data/fleetRoster";
import type { ShipDefinition } from "@/types";
import { pathFor } from "@/app/routes";
import "./FleetRosterScreen.css";

interface ComingSoonState {
  title: string;
  message: string;
}

interface FleetCardEntry {
  ship: ShipDefinition;
  data: FleetRosterCardData;
}

/**
 * Fleet Roster — replaces the old Ship Selection screen as the Fleet tab's
 * root. Reproduces 02_Fleet_Roster.png: title/subtitle, featured panel,
 * role filter row, and a 20-ship card grid (8 reference-matched cards in
 * the reference's exact order, then the remaining 12 real ships below the
 * fold). All ship art resolves through `getShipMasterArt()` directly — no
 * `ShipArt` component, no partial `SHIP_ROSTER_ART`/`SHIP_HERO_ART` maps —
 * since all 20 ships now have real, approved master art.
 *
 * Alignment correction (see FLEET_COMPANIONS_ALIGNMENT_FIX_REPORT.md): the
 * title region now uses the shared <FleetCollectionHeader> (title + count
 * + the Ships/Companions selector) instead of the generic <ScreenHeader> —
 * ScreenHeader's own extra top padding was the source of this screen's
 * previously excessive top whitespace, and it's still used unmodified by
 * other frozen screens (Battle Hub, Campaign, Results), so it was swapped
 * out here rather than edited. The acquired-count text is now computed
 * from real per-ship card ownership data instead of being hard-coded.
 */
export function FleetRosterScreen() {
  const { player, selectOwnedShip } = usePlayerStore();
  const [roleFilter, setRoleFilter] = useState<FleetRoleFilter>("All");
  const [previewedShipId, setPreviewedShipId] = useState(
    () => player.selectedShipId || FLEET_FEATURED_DEFAULT.shipId,
  );
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);
  const [lockedInfo, setLockedInfo] = useState<{ name: string; requirement: string } | null>(null);

  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const orderedShipIds = useMemo(() => getFleetRosterOrder(SHIPS.map((s) => s.id)), []);

  // Real, data-driven acquired count for the header text — counts every
  // ship whose resolved card data reports `owned: true`.
  const ownedShipCount = useMemo(
    () => orderedShipIds.filter((shipId) => getFleetRosterEntry(shipId, player)?.owned).length,
    [orderedShipIds, player],
  );

  const cards = useMemo(() => {
    const resolved: FleetCardEntry[] = [];
    for (const shipId of orderedShipIds) {
      const ship = getShipById(shipId);
      const data = getFleetRosterEntry(shipId, player);
      if (ship && data) resolved.push({ ship, data });
    }
    return resolved.filter((entry) => roleFilter === "All" || entry.ship.role === roleFilter);
  }, [orderedShipIds, player, roleFilter]);

  const featuredShip: ShipDefinition =
    getShipById(previewedShipId) ?? getShipById(player.selectedShipId) ?? getShipById(FLEET_FEATURED_DEFAULT.shipId) ?? SHIPS[0];
  const featuredStats = getFleetFeaturedStats(featuredShip.id, player);
  const featuredEntry = getFleetRosterEntry(featuredShip.id, player);
  const featuredOwned = featuredEntry?.owned ?? player.ownedShipIds.includes(featuredShip.id);
  const featuredEquipped = player.selectedShipId === featuredShip.id;

  const handleCardSelect = (shipId: string, locked: boolean, name: string, requirement?: string) => {
    if (locked) {
      setLockedInfo({ name, requirement: requirement ?? "Locked." });
      return;
    }
    setPreviewedShipId(shipId);
  };

  const handleDetails = () => {
    window.location.hash = `${pathFor("ship-detail-placeholder")}?id=${featuredShip.id}`;
  };

  const handleSelectCompanions = () => {
    window.location.hash = `${pathFor("companions")}?return=fleet`;
  };

  const handleSelectModules = () => {
    window.location.hash = pathFor("modules");
  };

  // `return=loadout` or `return=pre-battle&stage=<id>` — Equip returns the
  // player to the caller without spending Energy.
  const returnTarget = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return null;
    const params = new URLSearchParams(hash.slice(queryIndex + 1));
    const ret = params.get("return");
    if (ret === "loadout") return { kind: "loadout" as const };
    if (ret === "pre-battle") {
      const stage = params.get("stage");
      if (stage) return { kind: "pre-battle" as const, stageId: stage };
    }
    return null;
  }, []);

  const handleEquip = () => {
    if (!featuredOwned) return;
    if (!featuredEquipped) {
      selectOwnedShip(featuredShip.id);
    }
    if (returnTarget?.kind === "loadout") {
      window.location.hash = pathFor("loadout");
      return;
    }
    if (returnTarget?.kind === "pre-battle") {
      window.location.hash = `${pathFor("pre-battle-placeholder")}?id=${encodeURIComponent(returnTarget.stageId)}`;
    }
  };

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
        footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}
      >
        <div className="fleet-roster__content">
          <FleetCollectionHeader
            title="FLEET"
            countText={`${ownedShipCount} of ${SHIPS.length} ships acquired`}
            activeCategory="ships"
            onSelectShips={() => {}}
            onSelectCompanions={handleSelectCompanions}
            onSelectModules={handleSelectModules}
          />

          <FleetFeaturedPanel
            ship={featuredShip}
            stats={featuredStats}
            equipped={featuredEquipped}
            canEquip={featuredOwned}
            equipLabel={
              returnTarget?.kind === "pre-battle" && featuredEquipped
                ? "Continue"
                : featuredEquipped
                  ? "Equipped"
                  : "Equip"
            }
            onDetails={handleDetails}
            onEquip={handleEquip}
          />

          <FleetRoleFilterBar
            active={roleFilter}
            onSelect={setRoleFilter}
            onOpenSortFilter={() =>
              openComingSoon("Sort / Filter", "Sort and rarity filter options are coming soon.")
            }
          />

          <div className="fleet-roster__grid">
            {cards.map(({ ship, data }) => (
              <FleetShipCard
                key={ship.id}
                ship={ship}
                data={data}
                selected={ship.id === previewedShipId}
                onSelect={() =>
                  handleCardSelect(
                    ship.id,
                    data.statusVariant === "locked" || !data.owned,
                    data.displayName ?? ship.name,
                    data.unlockRequirement,
                  )
                }
              />
            ))}
          </div>
        </div>
      </HubScreenShell>

      <LockedContentModal
        open={lockedInfo !== null}
        title={lockedInfo?.name ?? ""}
        unlockRequirement={lockedInfo?.requirement ?? ""}
        onClose={() => setLockedInfo(null)}
      />

      <LockedContentModal
        open={comingSoon !== null}
        title={comingSoon?.title ?? ""}
        unlockRequirement={comingSoon?.message ?? "Coming soon."}
        onClose={() => setComingSoon(null)}
      />
    </>
  );
}
