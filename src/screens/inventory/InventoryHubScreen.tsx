import { useMemo, useState } from "react";
import { navigate } from "@/app/routes";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { MATERIAL_ICON, SLOT_ICON } from "@/data/assetRegistry";
import { getInventoryHubViewModel, type InventoryHubCategoryId } from "@/data/inventoryHub";
import { usePlayerStore } from "@/store/playerStore";
import "./InventoryHubScreen.css";

type DialogState = { title: string; message: string; materials?: boolean } | null;

export function InventoryHubScreen() {
  const { player } = usePlayerStore();
  const view = useMemo(() => getInventoryHubViewModel(player), [player]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const xpPct = player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;
  const openComingSoon = (title: string, message: string) => setDialog({ title, message });

  const openCategory = (id: InventoryHubCategoryId) => {
    if (id === "loadout") return navigate("loadout");
    if (id === "materials") return setDialog({ title: "Materials Summary", message: "Current upgrade materials", materials: true });
    const label = view.categories.find((category) => category.id === id)?.label ?? "Inventory Category";
    return openComingSoon(label, `${label} browsing is coming soon. No items or quantities have been created for this category.`);
  };

  const slots = [
    { label: "Companion", item: view.loadout.companion, icon: SLOT_ICON.companion },
    { label: "Core", item: view.loadout.core, icon: SLOT_ICON.core },
    { label: "Plating", item: view.loadout.plating, icon: SLOT_ICON.plating },
    { label: "System", item: view.loadout.system, icon: SLOT_ICON.system },
  ];

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
        footer={<HubBottomNav active="inventory" onComingSoon={openComingSoon} />}
      >
        <main className="inventory-hub">
          <header className="inventory-hub__title"><h1>Inventory</h1><p>Manage your combat loadout</p></header>

          <section className="inventory-hub__loadout" aria-labelledby="inventory-loadout-title">
            <h2 id="inventory-loadout-title">Active Loadout</h2>
            <div className="inventory-hub__loadout-grid">
              <article className="inventory-hub__ship">
                <div><small>Selected Ship</small><h3>{view.loadout.ship?.name ?? "No Ship Selected"}</h3><p>{view.loadout.ship?.weaponName ?? "No intrinsic weapon"}</p></div>
                {view.loadout.ship?.artSrc ? <img src={view.loadout.ship.artSrc} alt={`${view.loadout.ship.name} ship`} /> : null}
              </article>
              <div className="inventory-hub__slots">
                {slots.map(({ label, item, icon }) => <article key={label}><small>{label}</small><img src={item.artSrc ?? icon} alt="" /><div><strong>{item.name}</strong>{!item.empty ? <span>Lv. {item.level}</span> : null}</div></article>)}
              </div>
            </div>
            <footer><div><small>Total Power</small><strong>{view.loadout.power.totalPower.toLocaleString()}</strong></div><PrimaryButton onClick={() => navigate("loadout")}>Edit Loadout</PrimaryButton></footer>
          </section>

          <nav className="inventory-hub__categories" aria-label="Inventory categories">
            {view.categories.map((category) => <button key={category.id} type="button" className={`press-scale${category.id === "loadout" ? " is-active" : ""}`} onClick={() => openCategory(category.id)}><strong>{category.label}</strong>{!category.implemented ? <small>Coming Soon</small> : null}</button>)}
          </nav>

          <section className="inventory-hub__section" aria-labelledby="inventory-materials-title">
            <div className="inventory-hub__section-title"><h2 id="inventory-materials-title">Materials</h2><button type="button" onClick={() => openCategory("materials")}>View Summary</button></div>
            <div className="inventory-hub__materials">
              {view.materials.map((material) => <button key={material.id} type="button" className={`inventory-hub__material inventory-hub__material--${material.tone} press-scale`} onClick={() => openCategory("materials")}><span>{material.label}</span><img src={material.icon} alt="" /><strong>{material.amount.toLocaleString()}</strong></button>)}
            </div>
          </section>

          <section className="inventory-hub__section" aria-labelledby="inventory-entry-title">
            <div className="inventory-hub__section-title"><h2 id="inventory-entry-title">Entry Items</h2><small>Systems preview</small></div>
            <div className="inventory-hub__entry-items">
              {[{ label: "Raid Tickets", icon: MATERIAL_ICON.raidTicket }, { label: "Operation Passes", icon: MATERIAL_ICON.operationPass }, { label: "Revive Tokens", icon: MATERIAL_ICON.reviveToken }].map((item) => <button key={item.label} type="button" className="press-scale" onClick={() => openCategory("entry-items")}><img src={item.icon} alt="" /><span><strong>{item.label}</strong><small>Coming Soon</small></span></button>)}
            </div>
          </section>

          <section className="inventory-hub__recommendation"><div><small>Loadout Ready</small><strong>Review your equipped technology</strong><span>Manage your current companion and module configuration.</span></div><PrimaryButton onClick={() => navigate("loadout")}>Review</PrimaryButton></section>
        </main>
      </HubScreenShell>

      <ModalLayer open={dialog !== null} title={dialog?.title ?? ""} onClose={() => setDialog(null)}>
        <div className="inventory-hub__dialog"><p>{dialog?.message}</p>{dialog?.materials ? <dl>{view.materials.map((material) => <div key={material.id}><dt><img src={material.icon} alt="" />{material.label}</dt><dd>{material.amount.toLocaleString()}</dd></div>)}</dl> : null}<PrimaryButton fullWidth onClick={() => setDialog(null)}>Continue</PrimaryButton></div>
      </ModalLayer>
    </>
  );
}
