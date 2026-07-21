import { useMemo, useState } from "react";
import { getModuleIdFromHash, pathFor, pathForModuleUpgrade, type ModuleDetailOrigin } from "@/app/routes";
import { ModuleDetailActions } from "@/components/module-detail/ModuleDetailActions";
import { ModuleDetailHero } from "@/components/module-detail/ModuleDetailHero";
import { ModuleDetailPanels } from "@/components/module-detail/ModuleDetailPanels";
import { ModuleDetailTitleBar } from "@/components/module-detail/ModuleDetailTitleBar";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { areLoadoutsEqual } from "@/data/loadout";
import {
  getLoadoutDraftSession,
  updateLoadoutDraftModule,
} from "@/data/loadoutDraftSession";
import {
  getModuleDetailBackPath,
  getModuleDetailOrigin,
  getModuleDetailViewModel,
  replaceLoadoutModule,
} from "@/data/moduleDetail";
import { usePlayerStore } from "@/store/playerStore";
import "./ModuleDetailScreen.css";

type DialogState =
  | "source"
  | "draft-conflict"
  | "equipped"
  | "equip-error"
  | null;

export function ModuleDetailScreen() {
  const { player, saveActiveLoadout } = usePlayerStore();
  // Hash-route changes can reuse this mounted component when moving from one
  // module detail URL to another, so derive both values on every router
  // render instead of freezing the first URL in an empty-dependency memo.
  const moduleId = getModuleIdFromHash(window.location.hash);
  const origin: ModuleDetailOrigin = getModuleDetailOrigin(window.location.hash);
  const module = useMemo(
    () => (moduleId ? getModuleDetailViewModel(moduleId, player) : null),
    [moduleId, player],
  );
  const [dialog, setDialog] = useState<DialogState>(null);
  const [comingSoon, setComingSoon] = useState<{ title: string; message: string } | null>(null);
  const xpPct = player.xpToNextLevel > 0
    ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100))
    : 0;

  const goBack = () => {
    window.location.hash = getModuleDetailBackPath(origin);
  };

  const equipIntoDraft = () => {
    if (!module || !module.owned) return;
    updateLoadoutDraftModule(module.id, module.slot, player.activeLoadout);
    window.location.hash = pathFor("loadout");
  };

  const equipDirectly = () => {
    if (!module || !module.owned) return;
    const next = replaceLoadoutModule(player.activeLoadout, module.id, module.slot);
    const result = saveActiveLoadout(next);
    setDialog(result.success ? "equipped" : "equip-error");
  };

  const handleEquip = () => {
    if (!module || !module.owned || module.equipped) return;
    if (origin === "loadout") {
      equipIntoDraft();
      return;
    }

    const draft = getLoadoutDraftSession();
    if (draft && !areLoadoutsEqual(draft, player.activeLoadout)) {
      setDialog("draft-conflict");
      return;
    }
    equipDirectly();
  };

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={(title, message) => setComingSoon({ title, message })} />}
        footer={<HubBottomNav active="fleet" onComingSoon={(title, message) => setComingSoon({ title, message })} />}
      >
        <main className="module-detail-screen">
          <ModuleDetailTitleBar moduleName={module?.name} backLabel={origin === "modules" ? "Back to Modules" : "Back to Loadout"} onBack={goBack} />
          {!module ? (
            <section className="module-detail-missing">
              <h2>Module Not Found</h2>
              <p>This module link is invalid or unavailable.</p>
              <PrimaryButton onClick={goBack}>Back to Loadout</PrimaryButton>
            </section>
          ) : (
            <>
              <ModuleDetailHero module={module} />
              {!module.owned ? (
                <section className="module-detail-locked">
                  <h2>Module Locked</h2>
                  <p>{module.acquisitionDescription}</p>
                </section>
              ) : null}
              <ModuleDetailPanels module={module} onSourceInfo={() => setDialog("source")} />
              <ModuleDetailActions
                owned={module.owned}
                equipped={module.equipped}
                onEquip={handleEquip}
                onUpgrade={() => {
                  if (!module) return;
                  window.location.hash = pathForModuleUpgrade(
                    module.id,
                    origin === "loadout" || origin === "pre-battle" ? "loadout" : "module-detail",
                  );
                }}
              />
            </>
          )}
        </main>
      </HubScreenShell>

      <ModalLayer open={dialog !== null} title={dialog === "source" ? "ACQUISITION SOURCE" : dialog === "draft-conflict" ? "UNSAVED LOADOUT DRAFT" : dialog === "equipped" ? "MODULE EQUIPPED" : "EQUIP UNAVAILABLE"} onClose={() => setDialog(null)}>
        <div className="module-detail-dialog">
          {dialog === "source" && module ? <><p><strong>{module.acquisitionTitle}</strong></p><p>{module.acquisitionDescription}</p></> : null}
          {dialog === "draft-conflict" ? <><p>An unsaved Loadout draft is already open. Add this module to that draft and return to Loadout Manager?</p><div><SecondaryButton onClick={() => setDialog(null)}>Cancel</SecondaryButton><PrimaryButton onClick={equipIntoDraft}>Use in Draft</PrimaryButton></div></> : null}
          {dialog === "equipped" && module ? <p>{module.name} is now equipped in the {module.slotLabel} slot. Other Loadout slots were preserved.</p> : null}
          {dialog === "equip-error" ? <p>The module could not be equipped safely. Your Loadout was not changed.</p> : null}
          {dialog && dialog !== "draft-conflict" ? <PrimaryButton fullWidth onClick={() => setDialog(null)}>Continue</PrimaryButton> : null}
        </div>
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
