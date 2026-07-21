import { useMemo, useState } from "react";
import { getCompanionUpgradeIdFromHash } from "@/app/routes";
import { CompanionRankMilestones } from "@/components/companion-upgrade/CompanionRankMilestones";
import { CompanionUpgradeComparison } from "@/components/companion-upgrade/CompanionUpgradeComparison";
import { CompanionUpgradeCostPanel } from "@/components/companion-upgrade/CompanionUpgradeCostPanel";
import { CompanionUpgradeDialog } from "@/components/companion-upgrade/CompanionUpgradeDialog";
import { CompanionUpgradeHero } from "@/components/companion-upgrade/CompanionUpgradeHero";
import { CompanionUpgradeTitleBar } from "@/components/companion-upgrade/CompanionUpgradeTitleBar";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { getCompanionUpgradeBackPath, getCompanionUpgradeOrigin, getCompanionUpgradeViewModel } from "@/data/companionUpgrade";
import { usePlayerStore, type UpgradeCompanionResult } from "@/store/playerStore";
import "./CompanionUpgradeScreen.css";

type DialogState =
  | { title: string; kind: "message"; message: string }
  | { title: string; kind: "success"; name: string; result: Extract<UpgradeCompanionResult, { success: true }> }
  | null;

const FAILURE_MESSAGE: Record<Exclude<UpgradeCompanionResult, { success: true }>["reason"], string> = {
  "not-found": "COMPANION NOT FOUND",
  "not-owned": "This companion is locked and cannot be upgraded.",
  "max-level": "Maximum level reached. No further level upgrade is available.",
  "insufficient-credits": "Not enough Credits for this upgrade.",
  "insufficient-companion-data": "Not enough Companion Data for this upgrade.",
  "insufficient-resources": "Not enough Credits or Companion Data for this upgrade.",
  busy: "An upgrade is already being processed. Please try again.",
};

export function CompanionUpgradeScreen() {
  const { player, upgradeCompanionLevel } = usePlayerStore();
  const companionId = useMemo(() => getCompanionUpgradeIdFromHash(window.location.hash), []);
  const origin = useMemo(() => getCompanionUpgradeOrigin(window.location.hash), []);
  const companion = useMemo(() => companionId ? getCompanionUpgradeViewModel(companionId, player) : null, [companionId, player]);
  const [dialog, setDialog] = useState<DialogState>(null);
  const [comingSoon, setComingSoon] = useState<{ title: string; message: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const xpPct = player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;
  const goBack = () => { window.location.hash = getCompanionUpgradeBackPath(companionId, origin); };
  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  const handleUpgrade = () => {
    if (!companion || processing) return;
    setProcessing(true);
    const result = upgradeCompanionLevel(companion.id);
    setProcessing(false);
    if (result.success) setDialog({ title: "Upgrade Complete", kind: "success", name: companion.name, result });
    else setDialog({ title: "Upgrade Unavailable", kind: "message", message: FAILURE_MESSAGE[result.reason] ?? "The upgrade could not be completed safely." });
  };

  const openSourceInfo = () => setDialog({ title: "Companion Data", kind: "message", message: "Companion Data will come from missions, events, companion crates, Inventory and Shop systems. Those sources are not implemented yet, and this screen does not grant materials." });
  const openShortageInfo = () => {
    if (!companion) return;
    const message = companion.resources.shortage === "both" ? FAILURE_MESSAGE["insufficient-resources"] : companion.resources.shortage === "credits" ? FAILURE_MESSAGE["insufficient-credits"] : companion.resources.shortage === "companion-data" ? FAILURE_MESSAGE["insufficient-companion-data"] : FAILURE_MESSAGE["max-level"];
    setDialog({ title: "Upgrade Unavailable", kind: "message", message });
  };

  return (
    <>
      <HubScreenShell header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />} footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}>
        <main className="companion-upgrade-screen">
          <CompanionUpgradeTitleBar onBack={goBack} />
          {!companion ? (
            <section className="companion-upgrade-missing"><h2>COMPANION NOT FOUND</h2><p>This companion link is invalid or unavailable.</p><PrimaryButton onClick={goBack}>Back to Companions</PrimaryButton></section>
          ) : (
            <>
              <CompanionUpgradeHero companion={companion} />
              {!companion.owned ? (
                <section className="companion-upgrade-locked"><h2>Companion Locked</h2><p>{companion.acquisition.unlockDescription}</p><PrimaryButton onClick={() => setDialog({ title: companion.name, kind: "message", message: companion.acquisition.unlockDescription })}>Acquisition Info</PrimaryButton></section>
              ) : (
                <>
                  <CompanionUpgradeComparison companion={companion} />
                  <CompanionRankMilestones milestones={companion.milestones} onInfo={() => setDialog({ title: "Rank Milestones", kind: "message", message: "Rank milestones preview future behavior improvements. Rank Up, rank materials and milestone claiming are not implemented in this phase." })} />
                  <CompanionUpgradeCostPanel companion={companion} processing={processing} onUpgrade={handleUpgrade} onRankInfo={() => setDialog({ title: "Rank Up", kind: "message", message: "Rank Up is informational in this phase. No rank, duplicate reward or material transaction is performed." })} onShortageInfo={openShortageInfo} onSourceInfo={openSourceInfo} />
                </>
              )}
          </>)}
        </main>
      </HubScreenShell>
      <ModalLayer open={dialog !== null} title={dialog?.title ?? ""} onClose={() => setDialog(null)}>
        {dialog?.kind === "success" ? <CompanionUpgradeDialog kind="success" name={dialog.name} result={dialog.result} onClose={() => setDialog(null)} /> : dialog ? <CompanionUpgradeDialog kind="message" message={dialog.message} onClose={() => setDialog(null)} /> : null}
      </ModalLayer>
      <LockedContentModal open={comingSoon !== null} title={comingSoon?.title ?? ""} unlockRequirement={comingSoon?.message ?? "Coming soon."} onClose={() => setComingSoon(null)} />
    </>
  );
}
