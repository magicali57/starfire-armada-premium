import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubHeader } from "@/components/layout/HubHeader";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { LoadoutTitleBar } from "@/components/loadout/LoadoutTitleBar";
import { LoadoutMainPanel } from "@/components/loadout/LoadoutMainPanel";
import { LoadoutPowerSummary } from "@/components/loadout/LoadoutPowerSummary";
import { LoadoutStatContributions } from "@/components/loadout/LoadoutStatContributions";
import { LoadoutActions } from "@/components/loadout/LoadoutActions";
import { LoadoutAlternativeItems } from "@/components/loadout/LoadoutAlternativeItems";
import { LoadoutDialog } from "@/components/loadout/LoadoutDialog";
import { COMPANION_ART, MODULE_ART, getShipMasterArt } from "@/data/assetRegistry";
import { getCompanionById } from "@/data/companions";
import { getModuleById } from "@/data/modules";
import { getShipById } from "@/data/ships";
import {
  areLoadoutsEqual,
  buildStatContributionRows,
  calculateCompanionPower,
  calculateCompanionStatContributions,
  calculateLoadoutTotalPower,
  calculateModulePower,
  calculateModuleStatContributions,
  categoryForSlot,
  getActiveLoadoutViewModel,
  getAlternativeItems,
  getCompanionProgressOrDefault,
  getLoadoutReturnTarget,
  getLoadoutValidation,
  getModuleProgressOrDefault,
  type LoadoutActiveSlot,
  type LoadoutAlternativeItem,
  type LoadoutCategory,
  type LoadoutStatContributionRow,
} from "@/data/loadout";
import { createDefaultShipProgress } from "@/systems/shipStats";
import { navigate, pathFor, pathForCompanionDetail, pathForModuleDetail } from "@/app/routes";
import {
  clearLoadoutDraftSession,
  getLoadoutDraftSession,
  setLoadoutDraftSession,
} from "@/data/loadoutDraftSession";
import type { LoadoutFailureReason, ModuleSlot, PlayerLoadout, ShipRarity } from "@/types";
import "./LoadoutManagerScreen.css";

function resolveCompanionArt(artKey: string): string | undefined {
  return COMPANION_ART[artKey as keyof typeof COMPANION_ART];
}

function resolveModuleArt(artKey: string): string | undefined {
  return MODULE_ART[artKey as keyof typeof MODULE_ART];
}

const MODULE_SLOT_LABEL: Record<ModuleSlot, string> = {
  core: "Core Module",
  plating: "Plating Module",
  system: "System Module",
};

interface ItemInfoState {
  name: string;
  rarity: ShipRarity;
  level: number;
  power: number;
  description: string;
  slotLabel: string;
  statRows: LoadoutStatContributionRow[];
}

interface ComingSoonState {
  title: string;
  message: string;
}

// The in-memory-only draft cache this screen relies on now lives in
// data/loadoutDraftSession.ts (getLoadoutDraftSession/setLoadoutDraftSession/
// clearLoadoutDraftSession, imported above) rather than as a private
// module-level variable here — centralized so the Companion Detail screen
// can safely update just the draft's companion selection (via that same
// shared module's updateLoadoutDraftCompanion) without either screen
// reaching into the other's private state. Behavior is unchanged from the
// original private-variable implementation: still deliberately NOT
// localStorage/sessionStorage, still exists solely so an in-progress,
// unsaved companion/module draft survives a route change (Fleet Roster's
// "Change Ship" round trip, and now also Companion Detail's round trip),
// still cleared only on a successful Save, an explicit Reset, or a
// confirmed Discard, and still never consulted after a real page reload.

/**
 * Real Loadout Manager screen, reproducing 10_Loadout_Manager.png. Uses a
 * bespoke shell — the shared <HubHeader/> only, with NO bottom navigation
 * (not even a screen-owned one, since the Save/Reset action row already
 * occupies that space) — per the explicit instruction not to use
 * <HubScreenShell/> (which cannot render footerless without modifying a
 * frozen shared component) and not to modify HubHeader/HubScreenShell/
 * HubBottomNav themselves.
 */
export function LoadoutManagerScreen() {
  const { player, saveActiveLoadout } = usePlayerStore();

  const [draftLoadout, setDraftLoadoutState] = useState<PlayerLoadout>(
    () => getLoadoutDraftSession() ?? { ...player.activeLoadout },
  );
  const [activeSlot, setActiveSlot] = useState<LoadoutActiveSlot>(null);
  const [category, setCategory] = useState<LoadoutCategory>("all");
  const [saving, setSaving] = useState(false);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [savedDialogPower, setSavedDialogPower] = useState<number | null>(null);
  const [invalidReason, setInvalidReason] = useState<LoadoutFailureReason | undefined>(undefined);
  const [itemInfo, setItemInfo] = useState<ItemInfoState | null>(null);
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);

  const setDraftLoadout = (updater: PlayerLoadout | ((prev: PlayerLoadout) => PlayerLoadout)) => {
    setDraftLoadoutState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: PlayerLoadout) => PlayerLoadout)(prev) : updater;
      setLoadoutDraftSession(next);
      return next;
    });
  };

  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  // Parsed once on mount — same convention as PreBattleScreen/
  // CampaignStageDetailScreen's own `stageId` useMemo. Works on a direct
  // route entry/reload (it reads window.location.hash, not router state),
  // per the requirement that Back/return must not rely only on browser
  // history.
  const returnTarget = useMemo(() => getLoadoutReturnTarget(window.location.hash), []);

  const shipId = player.selectedShipId;
  const shipDef = shipId ? getShipById(shipId) : undefined;
  const shipProgress = shipId ? player.shipProgress[shipId] ?? createDefaultShipProgress(shipId) : undefined;

  const viewModel = useMemo(
    () =>
      getActiveLoadoutViewModel(
        shipId,
        shipProgress,
        draftLoadout,
        player,
        resolveCompanionArt,
        resolveModuleArt,
      ),
    [shipId, shipProgress, draftLoadout, player],
  );

  const isDirty = !areLoadoutsEqual(draftLoadout, player.activeLoadout);
  const validation = getLoadoutValidation(draftLoadout, player);
  const statRows = buildStatContributionRows(viewModel.statContributions);

  // Only meaningful (and only computed) while the draft actually differs
  // from the saved loadout — this is the "optional saved-vs-draft change
  // indicator" the Total Power panel shows, using the same real
  // calculateLoadoutTotalPower helper as the draft total itself, just fed
  // the currently-saved loadout instead of the draft.
  const savedTotalPower =
    isDirty && shipDef && shipProgress
      ? calculateLoadoutTotalPower(shipDef, shipProgress.level, player.activeLoadout, player).totalPower
      : undefined;

  const alternativeItems: LoadoutAlternativeItem[] = useMemo(
    () =>
      getAlternativeItems(category, player, draftLoadout, getShipMasterArt, resolveCompanionArt, resolveModuleArt),
    [category, player, draftLoadout],
  );

  const resolveBackDestination = () => {
    if (returnTarget.kind === "pre-battle") {
      window.location.hash = `${pathFor("pre-battle-placeholder")}?id=${returnTarget.stageId}`;
      return;
    }
    if (returnTarget.kind === "stage-detail") {
      window.location.hash = `${pathFor("stage-detail")}?id=${returnTarget.stageId}`;
      return;
    }
    navigate("home");
  };

  const handleBack = () => {
    if (isDirty) {
      setShowUnsavedDialog(true);
      return;
    }
    resolveBackDestination();
  };

  const handleDiscardAndBack = () => {
    setDraftLoadout({ ...player.activeLoadout });
    clearLoadoutDraftSession();
    setShowUnsavedDialog(false);
    resolveBackDestination();
  };

  const handleChangeShip = () => {
    window.location.hash = `${pathFor("ship-selection")}?return=loadout`;
  };

  const handleSelectSlot = (slot: LoadoutActiveSlot) => {
    setActiveSlot((prev) => (prev === slot ? null : slot));
    setCategory(categoryForSlot(slot));
  };

  const openCompanionInfo = (companionId: string) => {
    const def = getCompanionById(companionId);
    if (!def) return;
    const progress = getCompanionProgressOrDefault(companionId, player);
    const contributions = calculateCompanionStatContributions(def, progress);
    const rows = buildStatContributionRows(contributions).filter(
      (row) => contributions[row.key] !== 0,
    );
    setItemInfo({
      name: def.name,
      rarity: def.rarity,
      level: progress.level,
      power: calculateCompanionPower(def, progress),
      description: def.description,
      slotLabel: "Companion",
      statRows: rows,
    });
  };

  const openModuleInfo = (moduleId: string, slot: ModuleSlot) => {
    const def = getModuleById(moduleId);
    if (!def) return;
    const progress = getModuleProgressOrDefault(moduleId, player);
    const contributions = calculateModuleStatContributions(def, progress);
    const rows = buildStatContributionRows(contributions).filter(
      (row) => contributions[row.key] !== 0,
    );
    setItemInfo({
      name: def.name,
      rarity: def.rarity,
      level: progress.level,
      power: calculateModulePower(def, progress),
      description: def.description,
      slotLabel: MODULE_SLOT_LABEL[slot],
      statRows: rows,
    });
  };

  const handleSlotInfo = (slot: LoadoutActiveSlot) => {
    if (slot === "ship") {
      if (viewModel.ship) {
        window.location.hash = `${pathFor("ship-detail-placeholder")}?id=${viewModel.ship.shipId}`;
      }
      return;
    }
    // Companion slot's Info control now navigates to the real Companion
    // Detail screen (not the Roster, and not the itemInfo dialog) — reusing
    // this existing control (rather than adding new UI) mirrors the ship
    // slot's own "Info navigates to a real detail screen" behavior directly
    // above. Alternative Items' own onInfoItem still opens the lightweight
    // openCompanionInfo dialog for companions being browsed mid-comparison
    // (see handleInfoAltItem below) — only the main equipped slot's Info
    // tap changes. Draft safety: this is a pure route change, so React
    // unmounts this screen but the shared loadoutDraftSession module-level
    // state is untouched and this component's own state re-hydrates from
    // it on return — see docs/handoffs/companion-detail/
    // COMPANION_DETAIL_COMPLETION_REPORT.md's "Loadout draft-preservation
    // behavior" section for the full verification.
    if (slot === "companion" && draftLoadout.companionId) {
      window.location.hash = pathForCompanionDetail(draftLoadout.companionId, "loadout");
      return;
    }
    if (slot === "core" && draftLoadout.coreModuleId) {
      window.location.hash = pathForModuleDetail(draftLoadout.coreModuleId, "loadout");
    } else if (slot === "plating" && draftLoadout.platingModuleId) {
      window.location.hash = pathForModuleDetail(draftLoadout.platingModuleId, "loadout");
    } else if (slot === "system" && draftLoadout.systemModuleId) {
      window.location.hash = pathForModuleDetail(draftLoadout.systemModuleId, "loadout");
    }
    // Empty slots (or slot === null) intentionally have nothing to show.
  };

  const handleSelectAltItem = (item: LoadoutAlternativeItem) => {
    if (item.kind === "ship") {
      // Never mutate selectedShipId from this local draft — the real ship
      // equip flow lives entirely in Fleet Roster's existing Equip action.
      // This screen only opens Fleet with a return marker so it knows to
      // come straight back here afterward.
      window.location.hash = `${pathFor("ship-selection")}?return=loadout`;
      return;
    }
    setDraftLoadout((prev) => {
      switch (item.kind) {
        case "companion":
          return { ...prev, companionId: item.id };
        case "core":
          return { ...prev, coreModuleId: item.id };
        case "plating":
          return { ...prev, platingModuleId: item.id };
        case "system":
          return { ...prev, systemModuleId: item.id };
        default:
          return prev;
      }
    });
  };

  const handleInfoAltItem = (item: LoadoutAlternativeItem) => {
    if (item.kind === "ship") {
      window.location.hash = `${pathFor("ship-detail-placeholder")}?id=${item.id}`;
      return;
    }
    if (item.kind === "companion") openCompanionInfo(item.id);
    else openModuleInfo(item.id, item.kind);
  };

  const handleClearSlot = () => {
    if (!activeSlot || activeSlot === "ship") return;
    setDraftLoadout((prev) => {
      switch (activeSlot) {
        case "companion":
          return { ...prev, companionId: null };
        case "core":
          return { ...prev, coreModuleId: null };
        case "plating":
          return { ...prev, platingModuleId: null };
        case "system":
          return { ...prev, systemModuleId: null };
        default:
          return prev;
      }
    });
  };

  const handleReset = () => {
    setDraftLoadout({ ...player.activeLoadout });
    clearLoadoutDraftSession();
  };

  const handleSave = () => {
    if (saving || !isDirty) return;
    setSaving(true);
    const result = saveActiveLoadout(draftLoadout);
    setSaving(false);
    if (result.success) {
      clearLoadoutDraftSession();
      // The draft that was just submitted is now the saved loadout — the
      // already-computed viewModel.power.totalPower (built from that same
      // draft) is exactly the resulting Total Power, no need to recompute.
      setSavedDialogPower(viewModel.power.totalPower);
    } else {
      setInvalidReason(result.reason);
    }
  };

  const handleSavedContinue = () => {
    setSavedDialogPower(null);
    if (returnTarget.kind === "pre-battle" || returnTarget.kind === "stage-detail") {
      resolveBackDestination();
    }
  };

  return (
    <div className="loadout-screen">
      <HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />

      <main className="loadout-screen__scroll">
        <LoadoutTitleBar onBack={handleBack} />

        <div className="loadout-screen__content">
          <LoadoutMainPanel
            viewModel={viewModel}
            activeSlot={activeSlot}
            onSelectSlot={handleSelectSlot}
            onChangeShip={handleChangeShip}
            onInfo={handleSlotInfo}
          />

          <LoadoutPowerSummary totalPower={viewModel.power.totalPower} savedPower={savedTotalPower} />

          <LoadoutStatContributions rows={statRows} />

          <LoadoutActions
            canSave={isDirty && validation.valid}
            canReset={isDirty}
            saving={saving}
            onSave={handleSave}
            onReset={handleReset}
          />

          <LoadoutAlternativeItems
            category={category}
            onCategoryChange={setCategory}
            items={alternativeItems}
            onSelectItem={handleSelectAltItem}
            onInfoItem={handleInfoAltItem}
            onClearSlot={activeSlot && activeSlot !== "ship" ? handleClearSlot : undefined}
          />
        </div>
      </main>

      <ModalLayer open={showUnsavedDialog} title="Unsaved Changes" onClose={() => setShowUnsavedDialog(false)}>
        <LoadoutDialog
          kind="unsavedChanges"
          onDiscard={handleDiscardAndBack}
          onContinueEditing={() => setShowUnsavedDialog(false)}
        />
      </ModalLayer>

      <ModalLayer open={savedDialogPower !== null} title="Loadout Saved" onClose={handleSavedContinue}>
        <LoadoutDialog kind="saved" totalPower={savedDialogPower ?? 0} onContinue={handleSavedContinue} />
      </ModalLayer>

      <ModalLayer
        open={invalidReason !== undefined}
        title="Invalid Selection"
        onClose={() => setInvalidReason(undefined)}
      >
        <LoadoutDialog kind="invalidSelection" reason={invalidReason} onClose={() => setInvalidReason(undefined)} />
      </ModalLayer>

      <ModalLayer open={itemInfo !== null} title={itemInfo?.name ?? ""} onClose={() => setItemInfo(null)}>
        {itemInfo ? (
          <LoadoutDialog
            kind="itemInfo"
            name={itemInfo.name}
            rarity={itemInfo.rarity}
            level={itemInfo.level}
            power={itemInfo.power}
            description={itemInfo.description}
            slotLabel={itemInfo.slotLabel}
            statRows={itemInfo.statRows}
            onClose={() => setItemInfo(null)}
          />
        ) : null}
      </ModalLayer>

      <LockedContentModal
        open={comingSoon !== null}
        title={comingSoon?.title ?? ""}
        unlockRequirement={comingSoon?.message ?? "Coming soon."}
        onClose={() => setComingSoon(null)}
      />
    </div>
  );
}
