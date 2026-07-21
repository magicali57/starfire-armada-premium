import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { UpgradeShipResult } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { InlineAlert } from "@/components/feedback/InlineAlert";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { ShipUpgradeTitleBar } from "@/components/ship-upgrade/ShipUpgradeTitleBar";
import { ShipUpgradeHeroPanel } from "@/components/ship-upgrade/ShipUpgradeHeroPanel";
import { ShipUpgradeStatTable } from "@/components/ship-upgrade/ShipUpgradeStatTable";
import { ShipUpgradePowerCard } from "@/components/ship-upgrade/ShipUpgradePowerCard";
import { ShipUpgradeCostCard } from "@/components/ship-upgrade/ShipUpgradeCostCard";
import { ShipUpgradeActions } from "@/components/ship-upgrade/ShipUpgradeActions";
import { ShipUpgradeDialog } from "@/components/ship-upgrade/ShipUpgradeDialog";
import { ShipProgressionTabs, type ShipProgressionTab } from "@/components/navigation/ShipProgressionTabs";
import { getShipById } from "@/data";
import {
  UPGRADE_X5_LEVELS,
  buildStatComparisonRows,
  getMaxPreviewData,
  getPowerDisplay,
  getResourceState,
  getShipXpDisplay,
  getUpgradeX5PreviewData,
} from "@/data/shipUpgrade";
import {
  SHIP_MAX_LEVEL,
  calculateShipLevelUpgradeQuote,
  createDefaultShipProgress,
  isMaxLevel,
} from "@/systems/shipStats";
import { navigate, pathFor, pathForShipAbilities, pathForShipStarRank } from "@/app/routes";
import "./ShipUpgradeScreen.css";

interface ComingSoonState {
  title: string;
  message: string;
}

interface FeedbackState {
  tone: "success" | "danger";
  message: string;
}

function reasonMessage(shipName: string, result: UpgradeShipResult): string {
  switch (result.reason) {
    case "not-owned":
      return `${shipName} is not in your fleet.`;
    case "max-level":
      return `${shipName} is already at maximum level.`;
    case "insufficient-coins":
      return "Not enough Credits for this upgrade.";
    case "insufficient-ship-alloy":
      return "Not enough Ship Alloy for this upgrade.";
    case "insufficient-resources":
      return "Not enough Credits and not enough Ship Alloy for this upgrade.";
    case "busy":
      return "An upgrade is already processing — please wait a moment.";
    default:
      return "The upgrade could not be completed.";
  }
}

/**
 * Real Ship Level Up screen, reproducing 11_Ship_Level_Up.png. Uses the
 * approved shared hub shell (HubScreenShell/HubHeader/HubBottomNav, Fleet
 * tab active) rather than Ship Detail's full-screen shell — the reference
 * shows the same 5-tab bottom navigation Fleet Roster uses, not a
 * screen-owned action row, so this screen deliberately does not reuse Ship
 * Detail's screen-owned footer. Both screens now share the same
 * ShipProgressionTabs four-tab progression navigation (rendered below the
 * title bar here, with LEVEL UP active).
 *
 * Ship selection continues to flow entirely through
 * `player.selectedShipId` (set by Ship Detail's existing "Level Up" button
 * via `selectOwnedShip` before it navigates here) — no second
 * ship-selection mechanism or query parameter was added.
 */
export function ShipUpgradeScreen() {
  const { player, upgradeShipLevels } = usePlayerStore();
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [showX5Confirm, setShowX5Confirm] = useState(false);
  const [showMaxPreview, setShowMaxPreview] = useState(false);
  // Mirrors the store's own synchronous upgradeInFlight guard as a UI-level
  // affordance (disables buttons, shows "Upgrading…") — the store ref is
  // still the actual authority that prevents a double-spend; both
  // transactions here are synchronous (no network layer yet), so this flag
  // is never actually visible mid-click, only across the render it produces.
  const [busy, setBusy] = useState(false);

  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const ship = getShipById(player.selectedShipId);
  const owned = ship ? player.ownedShipIds.includes(ship.id) : false;
  const progress = ship ? player.shipProgress[ship.id] ?? createDefaultShipProgress(ship.id) : null;

  // Back returns to the same Ship Detail id the player came from. Only
  // falls back to Fleet ("#/ships") when the selected ship can't be
  // resolved at all — an unowned-but-known ship still goes back to its own
  // Ship Detail page, since the id itself is valid.
  const handleBack = () => {
    if (ship) {
      window.location.hash = `${pathFor("ship-detail-placeholder")}?id=${ship.id}`;
    } else {
      navigate("ship-selection");
    }
  };

  const comingSoonModal = (
    <LockedContentModal
      open={comingSoon !== null}
      title={comingSoon?.title ?? ""}
      unlockRequirement={comingSoon?.message ?? "Coming soon."}
      onClose={() => setComingSoon(null)}
    />
  );

  // ---- Missing / unresolvable selected ship ----
  if (!ship || !progress) {
    return (
      <>
        <HubScreenShell
          header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
          footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}
        >
          <ShipUpgradeTitleBar onBack={handleBack} />
          <div className="ship-upgrade-screen__empty">
            <p>No ship selected yet.</p>
            <SecondaryButton onClick={() => navigate("ship-selection")}>Back to Fleet</SecondaryButton>
          </div>
        </HubScreenShell>
        {comingSoonModal}
      </>
    );
  }

  // ---- Selected ship not owned ----
  if (!owned) {
    return (
      <>
        <HubScreenShell
          header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
          footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}
        >
          <ShipUpgradeTitleBar onBack={handleBack} />
          <div className="ship-upgrade-screen__empty">
            <p>{ship.name} is not in your fleet yet.</p>
            <SecondaryButton onClick={handleBack}>Back to Ship Detail</SecondaryButton>
          </div>
        </HubScreenShell>
        {comingSoonModal}
      </>
    );
  }

  const atMaxLevel = isMaxLevel(progress.level);
  const oneLevelQuote = calculateShipLevelUpgradeQuote(ship, progress.level, 1);
  const statRows = buildStatComparisonRows(
    oneLevelQuote.currentStats,
    atMaxLevel ? null : oneLevelQuote.resultingStats,
  );
  const xpDisplay = getShipXpDisplay(progress);
  const powerDisplay = getPowerDisplay(oneLevelQuote);
  const resourceState = getResourceState(oneLevelQuote, player);
  const x5Preview = getUpgradeX5PreviewData(ship, progress.level, player);
  const maxPreviewData = getMaxPreviewData(ship, progress.level);

  // Shared four-tab progression nav: LEVEL UP is this screen (no-op when
  // tapped); the three future tabs open the Coming Soon dialog.
  const handleProgressionTab = (tab: ShipProgressionTab) => {
    switch (tab) {
      case "level-up":
        break;
      case "star-rank":
        if (ship) window.location.hash = pathForShipStarRank(ship.id);
        break;
      case "abilities":
        if (ship) window.location.hash = pathForShipAbilities(ship.id);
        break;
      case "skins":
        openComingSoon("Skins", "The Skins screen isn't built yet — coming soon.");
        break;
    }
  };

  const applyResult = (result: UpgradeShipResult) => {
    if (result.success) {
      const levels = result.levelsPurchased ?? 1;
      const heading = levels > 1 ? "Multi-level upgrade complete" : "Upgrade complete";
      setFeedback({
        tone: "success",
        message: `${heading}: ${ship.name} reached Level ${result.newLevel}. -${(result.coinsSpent ?? 0).toLocaleString()} Credits, -${(result.shipAlloySpent ?? 0).toLocaleString()} Ship Alloy.`,
      });
    } else {
      setFeedback({ tone: "danger", message: reasonMessage(ship.name, result) });
    }
  };

  const handleUpgradeOne = () => {
    if (busy || atMaxLevel) return;
    setBusy(true);
    const result = upgradeShipLevels(ship.id, 1);
    applyResult(result);
    setBusy(false);
  };

  const handleUpgradeX5Confirm = () => {
    if (busy) return;
    setBusy(true);
    const result = upgradeShipLevels(ship.id, UPGRADE_X5_LEVELS);
    setShowX5Confirm(false);
    applyResult(result);
    setBusy(false);
  };

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
        footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}
      >
        <ShipUpgradeTitleBar onBack={handleBack} />

        <ShipProgressionTabs
          shipId={ship.id}
          activeTab="level-up"
          badges={{ "level-up": !atMaxLevel && resourceState.canAfford }}
          onSelect={handleProgressionTab}
        />

        <div className="ship-upgrade-screen__content">
          {feedback ? (
            <InlineAlert
              tone={feedback.tone}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          <ShipUpgradeHeroPanel
            ship={ship}
            currentLevel={progress.level}
            nextLevel={atMaxLevel ? null : progress.level + 1}
            maxLevel={SHIP_MAX_LEVEL}
            currentPower={oneLevelQuote.currentPower}
            xp={xpDisplay}
            atMaxLevel={atMaxLevel}
          />

          <ShipUpgradeStatTable
            rows={statRows}
            currentLevel={progress.level}
            nextLevel={atMaxLevel ? null : progress.level + 1}
            atMaxLevel={atMaxLevel}
          />

          <div className="ship-upgrade-screen__cards-row">
            <ShipUpgradePowerCard power={powerDisplay} />
            <ShipUpgradeCostCard
              atMaxLevel={atMaxLevel}
              creditsCost={oneLevelQuote.totalCoins}
              creditsBalance={player.currencies.coins}
              shipAlloyCost={oneLevelQuote.totalShipAlloy}
              shipAlloyBalance={player.materials.shipAlloy}
              insufficientCoins={resourceState.insufficientCoins}
              insufficientShipAlloy={resourceState.insufficientShipAlloy}
            />
          </div>

          <ShipUpgradeActions
            atMaxLevel={atMaxLevel}
            busy={busy}
            oneLevelCreditsCost={oneLevelQuote.totalCoins}
            oneLevelShipAlloyCost={oneLevelQuote.totalShipAlloy}
            canAffordOne={resourceState.canAfford}
            onUpgrade={handleUpgradeOne}
            onUpgradeX5={() => setShowX5Confirm(true)}
            onMaxPreview={() => setShowMaxPreview(true)}
          />
        </div>
      </HubScreenShell>

      <ModalLayer
        open={showX5Confirm}
        title="Upgrade x5"
        onClose={() => {
          if (!busy) setShowX5Confirm(false);
        }}
      >
        <ShipUpgradeDialog
          kind="confirmX5"
          shipName={ship.name}
          preview={x5Preview}
          busy={busy}
          onConfirm={handleUpgradeX5Confirm}
          onCancel={() => setShowX5Confirm(false)}
        />
      </ModalLayer>

      <ModalLayer open={showMaxPreview} title="Max Preview" onClose={() => setShowMaxPreview(false)}>
        <ShipUpgradeDialog
          kind="maxPreview"
          shipName={ship.name}
          data={maxPreviewData}
          onClose={() => setShowMaxPreview(false)}
        />
      </ModalLayer>

      {comingSoonModal}
    </>
  );
}
