import { useMemo, useState } from "react";
import { pathFor, pathForModuleDetail, pathForModuleUpgrade } from "@/app/routes";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { FleetCollectionHeader } from "@/components/fleet/FleetCollectionHeader";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { ModuleFeaturedPanel } from "@/components/modules/ModuleFeaturedPanel";
import { ModuleInventoryControls } from "@/components/modules/ModuleInventoryControls";
import { ModuleInventoryGrid } from "@/components/modules/ModuleInventoryGrid";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { getShipMasterArt } from "@/data/assetRegistry";
import { areLoadoutsEqual } from "@/data/loadout";
import { getLoadoutDraftSession, updateLoadoutDraftModule } from "@/data/loadoutDraftSession";
import {
  buildModuleInventoryItems,
  filterModuleInventoryItems,
  getFeaturedModule,
  getModuleInventoryCounts,
  sortModuleInventoryItems,
  type ModuleInventoryFilter,
  type ModuleInventoryItem,
  type ModuleInventorySort,
} from "@/data/moduleInventory";
import { replaceLoadoutModule } from "@/data/moduleDetail";
import { getShipById } from "@/data/ships";
import { usePlayerStore } from "@/store/playerStore";
import "./ModulesInventoryScreen.css";

type DialogState = "draft-conflict" | "equipped" | "equip-error" | null;

export function ModulesInventoryScreen() {
  const { player, saveActiveLoadout } = usePlayerStore();
  const items = useMemo(() => buildModuleInventoryItems(player), [player]);
  const counts = useMemo(() => getModuleInventoryCounts(items), [items]);
  const [filter, setFilter] = useState<ModuleInventoryFilter>("all");
  const [sort, setSort] = useState<ModuleInventorySort>("default");
  const [selectedId, setSelectedId] = useState<string | null>(() => getFeaturedModule(items)?.id ?? null);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [comingSoon, setComingSoon] = useState<{ title: string; message: string } | null>(null);

  const visibleItems = useMemo(
    () => sortModuleInventoryItems(filterModuleInventoryItems(items, filter), sort),
    [items, filter, sort],
  );
  const featured = getFeaturedModule(items, selectedId);
  const selectedShip = getShipById(player.selectedShipId);
  const selectedShipLevel = player.shipProgress[player.selectedShipId]?.level ?? 1;
  const xpPct = player.xpToNextLevel > 0
    ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100))
    : 0;

  const openDetails = (item: ModuleInventoryItem) => {
    window.location.hash = pathForModuleDetail(item.id, "modules");
  };

  const equipIntoDraft = () => {
    if (!featured?.owned) return;
    updateLoadoutDraftModule(featured.id, featured.slot, player.activeLoadout);
    window.location.hash = pathFor("loadout");
  };

  const equipDirectly = () => {
    if (!featured?.owned || featured.equipped) return;
    const next = replaceLoadoutModule(player.activeLoadout, featured.id, featured.slot);
    const result = saveActiveLoadout(next);
    setDialog(result.success ? "equipped" : "equip-error");
  };

  const handleEquip = () => {
    if (!featured?.owned || featured.equipped) return;
    const draft = getLoadoutDraftSession();
    if (draft && !areLoadoutsEqual(draft, player.activeLoadout)) {
      setDialog("draft-conflict");
      return;
    }
    equipDirectly();
  };

  const handleSelectModules = () => undefined;

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={(title, message) => setComingSoon({ title, message })} />}
        footer={<HubBottomNav active="fleet" onComingSoon={(title, message) => setComingSoon({ title, message })} />}
      >
        <main className="modules-inventory">
          <FleetCollectionHeader
            title="MODULES"
            subtitle="Core, Plating, and System upgrades"
            countText={`${counts.owned} of ${counts.total} modules owned`}
            activeCategory="modules"
            onSelectShips={() => { window.location.hash = pathFor("ship-selection"); }}
            onSelectCompanions={() => { window.location.hash = pathFor("companions"); }}
            onSelectModules={handleSelectModules}
          />

          <ModuleInventoryControls filter={filter} sort={sort} onFilter={setFilter} onSort={setSort} />

          <ModuleInventoryGrid
            items={visibleItems}
            selectedId={featured?.id ?? null}
            onSelect={(item) => setSelectedId(item.id)}
            onDetails={openDetails}
            onResetFilters={() => setFilter("all")}
          />

          {featured ? (
            <ModuleFeaturedPanel
              module={featured}
              shipName={selectedShip?.name}
              shipLevel={selectedShipLevel}
              shipArt={selectedShip ? getShipMasterArt(selectedShip.id) : undefined}
              onDetails={() => openDetails(featured)}
              onEquip={handleEquip}
              onUpgrade={() => { window.location.hash = pathForModuleUpgrade(featured.id, "modules"); }}
            />
          ) : null}
        </main>
      </HubScreenShell>

      <ModalLayer
        open={dialog !== null}
        title={
          dialog === "draft-conflict"
              ? "UNSAVED LOADOUT DRAFT"
              : dialog === "equipped"
                ? "MODULE EQUIPPED"
                : "EQUIP UNAVAILABLE"
        }
        onClose={() => setDialog(null)}
      >
        <div className="module-inventory-dialog">
          {dialog === "draft-conflict" ? (
            <>
              <p>An unsaved Loadout draft is already open. Add this module to that draft and return to Loadout Manager?</p>
              <div>
                <SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton>
                <PrimaryButton onClick={equipIntoDraft}>Use in Draft</PrimaryButton>
              </div>
            </>
          ) : null}
          {dialog === "equipped" && featured ? <p>{featured.name} is now equipped in the {featured.slotLabel} slot. Every other Loadout slot was preserved.</p> : null}
          {dialog === "equip-error" ? <p>The module could not be equipped safely. Your Loadout was not changed.</p> : null}
          {dialog && dialog !== "draft-conflict" ? <PrimaryButton fullWidth onClick={() => setDialog(null)}>Continue</PrimaryButton> : null}
        </div>
      </ModalLayer>

      <ModalLayer open={comingSoon !== null} title={comingSoon?.title ?? ""} onClose={() => setComingSoon(null)}>
        <div className="module-inventory-dialog"><p>{comingSoon?.message ?? "Coming soon."}</p><PrimaryButton fullWidth onClick={() => setComingSoon(null)}>Continue</PrimaryButton></div>
      </ModalLayer>
    </>
  );
}
