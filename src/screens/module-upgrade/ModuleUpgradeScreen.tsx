import { useMemo, useState } from "react";
import { getModuleUpgradeIdFromHash } from "@/app/routes";
import { ModuleUpgradeComparison } from "@/components/module-upgrade/ModuleUpgradeComparison";
import { ModuleUpgradeCostPanel } from "@/components/module-upgrade/ModuleUpgradeCostPanel";
import { ModuleUpgradeHero } from "@/components/module-upgrade/ModuleUpgradeHero";
import { ModuleUpgradeTitleBar } from "@/components/module-upgrade/ModuleUpgradeTitleBar";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { getModuleUpgradeBackPath, getModuleUpgradeOrigin, getModuleUpgradeViewModel } from "@/data/moduleUpgrade";
import { usePlayerStore, type UpgradeModuleResult } from "@/store/playerStore";
import "./ModuleUpgradeScreen.css";

type SuccessResult = Extract<UpgradeModuleResult, { success: true }>;
type DialogState = { title: string; message: string; result?: SuccessResult; name?: string } | null;

const FAILURE_MESSAGE: Record<Exclude<UpgradeModuleResult, { success: true }>["reason"], string> = {
  "not-found": "This module is unavailable.",
  "not-owned": "This module is locked and cannot be upgraded.",
  "max-level": "Maximum level reached. No further upgrade is available.",
  "insufficient-credits": "Not enough Credits for this upgrade.",
  "insufficient-module-parts": "Not enough Module Parts for this upgrade.",
  "insufficient-resources": "Not enough Credits or Module Parts for this upgrade.",
  busy: "An upgrade is already being processed. Please try again.",
};

export function ModuleUpgradeScreen() {
  const { player, upgradeModuleLevel } = usePlayerStore();
  const moduleId = getModuleUpgradeIdFromHash(window.location.hash);
  const origin = getModuleUpgradeOrigin(window.location.hash);
  const module = useMemo(() => moduleId ? getModuleUpgradeViewModel(moduleId, player) : null, [moduleId, player]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [comingSoon, setComingSoon] = useState<{ title: string; message: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const xpPct = player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;
  const goBack = () => { window.location.hash = getModuleUpgradeBackPath(moduleId, origin); };
  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  const handleUpgrade = () => {
    if (!module || processing) return;
    setProcessing(true);
    const result = upgradeModuleLevel(module.id);
    setProcessing(false);
    if (result.success) {
      setDialog({ title: "Upgrade Complete", message: `${module.name} is now Level ${result.newLevel}.`, result, name: module.name });
    } else {
      setDialog({ title: "Upgrade Unavailable", message: FAILURE_MESSAGE[result.reason] });
    }
  };

  const openSourceInfo = () => setDialog({ title: "Module Parts", message: "Module Parts will come from missions, salvage rewards, Inventory, and Shop systems. Those sources are not implemented yet, and this screen does not grant materials." });
  const openShortageInfo = () => {
    if (!module) return;
    const reason = module.resources.shortage === "both" ? "insufficient-resources" : module.resources.shortage === "credits" ? "insufficient-credits" : module.resources.shortage === "module-parts" ? "insufficient-module-parts" : "max-level";
    setDialog({ title: "Upgrade Unavailable", message: FAILURE_MESSAGE[reason] });
  };

  return (
    <>
      <HubScreenShell header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />} footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}>
        <main className="module-upgrade-screen">
          <ModuleUpgradeTitleBar onBack={goBack} />
          {!module ? (
            <section className="module-upgrade-missing"><h2>Module Not Found</h2><p>This module link is invalid or unavailable.</p><PrimaryButton onClick={() => { window.location.hash = "#/inventory/modules"; }}>Back to Modules</PrimaryButton></section>
          ) : (
            <><ModuleUpgradeHero module={module} />{!module.owned ? <section className="module-upgrade-locked"><h2>Module Locked</h2><p>This technology must be acquired before it can be enhanced.</p></section> : <><ModuleUpgradeComparison module={module} /><ModuleUpgradeCostPanel module={module} processing={processing} onUpgrade={handleUpgrade} onShortageInfo={openShortageInfo} onSourceInfo={openSourceInfo} /></>}</>
          )}
        </main>
      </HubScreenShell>
      <ModalLayer open={dialog !== null} title={dialog?.title ?? ""} onClose={() => setDialog(null)}>
        <div className="module-upgrade-dialog"><p>{dialog?.message}</p>{dialog?.result ? <dl><div><dt>Level</dt><dd>{dialog.result.previousLevel} → {dialog.result.newLevel}</dd></div><div><dt>Power</dt><dd>{dialog.result.previousPower.toLocaleString()} → {dialog.result.newPower.toLocaleString()}</dd></div><div><dt>Credits Used</dt><dd>{dialog.result.creditsSpent.toLocaleString()}</dd></div><div><dt>Module Parts Used</dt><dd>{dialog.result.modulePartsSpent.toLocaleString()}</dd></div></dl> : null}<PrimaryButton fullWidth onClick={() => setDialog(null)}>Continue</PrimaryButton></div>
      </ModalLayer>
      <LockedContentModal open={comingSoon !== null} title={comingSoon?.title ?? ""} unlockRequirement={comingSoon?.message ?? "Coming soon."} onClose={() => setComingSoon(null)} />
    </>
  );
}
