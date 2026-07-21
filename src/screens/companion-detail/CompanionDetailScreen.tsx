import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { CompanionDetailTitleBar } from "@/components/companion-detail/CompanionDetailTitleBar";
import { CompanionDetailHero } from "@/components/companion-detail/CompanionDetailHero";
import { CompanionBehaviorPanel } from "@/components/companion-detail/CompanionBehaviorPanel";
import { CompanionEffectList } from "@/components/companion-detail/CompanionEffectList";
import { CompanionDetailProgress } from "@/components/companion-detail/CompanionDetailProgress";
import { CompanionDetailActions } from "@/components/companion-detail/CompanionDetailActions";
import { CompanionPairingPanel } from "@/components/companion-detail/CompanionPairingPanel";
import { CompanionAcquisitionPanel } from "@/components/companion-detail/CompanionAcquisitionPanel";
import { CompanionDetailDialog } from "@/components/companion-detail/CompanionDetailDialog";
import { COMPANION_ART, getShipMasterArt } from "@/data/assetRegistry";
import { getCompanionDetailReturnTarget, getCompanionDetailViewModel } from "@/data/companionDetail";
import { getLoadoutDraftSession, updateLoadoutDraftCompanion } from "@/data/loadoutDraftSession";
import { getCompanionIdFromHash, navigate, pathFor, pathForCompanionUpgrade } from "@/app/routes";
import "./CompanionDetailScreen.css";

function resolveCompanionArt(artKey: string): string | undefined {
  return COMPANION_ART[artKey as keyof typeof COMPANION_ART];
}

interface ComingSoonState {
  title: string;
  message: string;
}

type DialogState =
  | { kind: "equipSuccess"; name: string }
  | { kind: "equipFailure"; message: string }
  | { kind: "locked"; name: string; description: string }
  | { kind: "upgrade" }
  | { kind: "rankUp" }
  | { kind: "rankInfo" }
  | { kind: "draftConflict" }
  | null;

/**
 * Companion Detail (18_Companion_Detail.png) — dynamic route at
 * #/inventory/companions/:companionId. Uses the same standard
 * <HubScreenShell>/<HubHeader>/<HubBottomNav> hub pattern as Companions
 * Roster (reference's footer crop shows the normal 5-tab nav, same as the
 * Roster screen — see the completion report's "shell decision" section).
 *
 * companionId and returnTarget are both parsed once on mount directly from
 * window.location.hash (not from client-side navigation state), so a
 * direct link or a hard reload into this URL resolves correctly — same
 * "parse once on mount" convention every dynamic-entry screen in this
 * project already follows.
 *
 * Fleet navigation correction (see
 * COMPANIONS_FLEET_NAVIGATION_FIX_REPORT.md): Companion Detail belongs to
 * the Companions branch of Fleet, so the bottom nav's active tab is now
 * "fleet" (not "inventory"). Its `?return=companions` Back path (and the
 * default/invalid-id fallback, which also lands on the Roster) now sends
 * the player to `#/inventory/companions?return=fleet` explicitly, rather
 * than a bare `#/inventory/companions`, so the Roster's own Back button
 * continues the chain back to Fleet Roster instead of Home. The dynamic
 * route shape, `?return=loadout`/`?return=home` handling, Equip/draft-
 * session behavior, and every other piece of this screen are unchanged.
 */
export function CompanionDetailScreen() {
  const { player, saveActiveLoadout } = usePlayerStore();

  const companionId = useMemo(() => getCompanionIdFromHash(window.location.hash), []);
  const returnTarget = useMemo(() => getCompanionDetailReturnTarget(window.location.hash), []);

  const companion = useMemo(
    () =>
      companionId
        ? getCompanionDetailViewModel(companionId, player, resolveCompanionArt, getShipMasterArt)
        : null,
    [companionId, player],
  );

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);
  const [dialog, setDialog] = useState<DialogState>(null);

  const openComingSoon = (title: string, message: string) => setComingSoon({ title, message });

  // Return-target priority per task §10: loadout > companions > home >
  // (unknown/missing) companions — getCompanionDetailReturnTarget already
  // resolves the unknown/missing case to "companions", so the fallback
  // branch below only ever fires for the explicit "companions" value.
  //
  // Fleet navigation correction: the "companions" case now navigates to
  // the Roster with an explicit `?return=fleet`, not a bare
  // `#/inventory/companions` — this preserves Fleet as the Roster's own
  // Back destination for this chain (Roster → Detail → Back → Roster →
  // Back → Fleet), rather than letting the Roster fall back to whatever
  // its own default happens to be. `navigate()` only builds bare paths for
  // static routes, so this one case is built manually via `pathFor`.
  const resolveBackDestination = () => {
    if (returnTarget === "loadout") {
      navigate("loadout");
      return;
    }
    if (returnTarget === "home") {
      navigate("home");
      return;
    }
    window.location.hash = `${pathFor("companions")}?return=fleet`;
  };

  // Invalid/missing companion id: Back always defaults to Companions
  // Roster regardless of the parsed return target — a deliberately
  // different, simpler rule than the valid-companion case above, per the
  // task's explicit §10/§27 instruction for this specific safe state.
  // Same explicit `?return=fleet` chain as resolveBackDestination above, so
  // the Roster's own Back button still lands on Fleet from this path too.
  const handleBackFromMissing = () => {
    window.location.hash = `${pathFor("companions")}?return=fleet`;
  };

  const commitEquip = () => {
    if (!companion) return;
    const result = saveActiveLoadout({ ...player.activeLoadout, companionId: companion.id });
    if (result.success) {
      setDialog({ kind: "equipSuccess", name: companion.name });
    } else {
      setDialog({ kind: "equipFailure", message: "This companion could not be equipped." });
    }
  };

  const handleEquip = () => {
    if (!companion || !companion.owned || companion.equipped) return;

    // Opened from Loadout Manager (§23): update only the companion slot of
    // the existing transient draft session and return to Loadout Manager.
    // Never auto-saves the whole Loadout — unsaved core/plating/system
    // selections in the draft are left completely untouched.
    if (returnTarget === "loadout") {
      updateLoadoutDraftCompanion(companion.id, player.activeLoadout);
      navigate("loadout");
      return;
    }

    // Opened from Companions Roster/direct route: Equip commits immediately
    // through the real saveActiveLoadout transaction — same immediate-equip
    // behavior Companions Roster's own hero panel already uses. Guard
    // against silently discarding an unrelated *unsaved* Loadout Manager
    // draft (module or companion changes made in Loadout Manager but never
    // saved) by asking for confirmation first, per §23's "when an
    // unresolved draft conflict exists, show an in-app confirmation" rule.
    const draft = getLoadoutDraftSession();
    const draftConflicts =
      draft !== null &&
      (draft.companionId !== player.activeLoadout.companionId ||
        draft.coreModuleId !== player.activeLoadout.coreModuleId ||
        draft.platingModuleId !== player.activeLoadout.platingModuleId ||
        draft.systemModuleId !== player.activeLoadout.systemModuleId);

    if (draftConflicts) {
      setDialog({ kind: "draftConflict" });
      return;
    }

    commitEquip();
  };

  const handleAcquireInfo = () => {
    if (!companion) return;
    setDialog({ kind: "locked", name: companion.name, description: companion.acquisition.unlockDescription });
  };

  const handleGoToInventory = () => navigate("inventory");

  // -----------------------------------------------------------------------
  // Invalid/missing companion id — safe dedicated state (task §10/§27): no
  // crash, no silently displaying another companion, no undefined labels,
  // no store mutation, Back still functional (defaults to Companions
  // Roster). Reuses the same shell so the screen doesn't feel broken, but
  // renders only a dedicated "not found" panel instead of the full detail
  // layout.
  // -----------------------------------------------------------------------
  if (!companion) {
    return (
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
        footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}
      >
        <div className="companion-detail__content companion-detail__content--missing">
          <CompanionDetailTitleBar onBack={handleBackFromMissing} companionName="Not Found" />
          <div className="companion-detail__missing glass-panel">
            <p className="companion-detail__missing-title">Companion Not Found</p>
            <p className="companion-detail__missing-copy">
              This companion could not be found. It may have an invalid or outdated link.
            </p>
            <PrimaryButton onClick={handleBackFromMissing}>Back to Companions</PrimaryButton>
          </div>
        </div>

        <LockedContentModal
          open={comingSoon !== null}
          title={comingSoon?.title ?? ""}
          unlockRequirement={comingSoon?.message ?? "Coming soon."}
          onClose={() => setComingSoon(null)}
        />
      </HubScreenShell>
    );
  }

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openComingSoon} />}
        footer={<HubBottomNav active="fleet" onComingSoon={openComingSoon} />}
      >
        <div className="companion-detail__content">
          <CompanionDetailTitleBar onBack={resolveBackDestination} companionName={companion.name} />

          <CompanionDetailHero
            companion={companion}
            onEquip={handleEquip}
            onAcquireInfo={handleAcquireInfo}
            onRankInfo={() => setDialog({ kind: "rankInfo" })}
          />

          <CompanionBehaviorPanel behavior={companion.behavior} />
          <CompanionEffectList behavior={companion.behavior} statRows={companion.statRows} />

          <CompanionDetailProgress companion={companion} />
          <CompanionDetailActions
            onUpgrade={() => {
              window.location.hash = pathForCompanionUpgrade(companion.id, returnTarget);
            }}
            onRankUp={() => setDialog({ kind: "rankUp" })}
            disabled={!companion.owned}
          />

          <CompanionPairingPanel companion={companion} />
          <CompanionAcquisitionPanel
            owned={companion.owned}
            acquisition={companion.acquisition}
            onGoToInventory={handleGoToInventory}
          />
        </div>
      </HubScreenShell>

      <ModalLayer
        open={dialog !== null}
        title={
          dialog?.kind === "equipSuccess"
            ? "Equipped"
            : dialog?.kind === "equipFailure"
              ? "Companion"
              : dialog?.kind === "locked"
                ? dialog.name
                : dialog?.kind === "upgrade"
                  ? "Upgrade"
                  : dialog?.kind === "rankUp"
                    ? "Rank Up"
                    : dialog?.kind === "rankInfo"
                      ? "Rank"
                      : dialog?.kind === "draftConflict"
                        ? "Unsaved Loadout Changes"
                        : ""
        }
        onClose={() => setDialog(null)}
      >
        {dialog?.kind === "equipSuccess" ? (
          <CompanionDetailDialog kind="equipSuccess" name={dialog.name} onClose={() => setDialog(null)} />
        ) : null}
        {dialog?.kind === "equipFailure" ? (
          <CompanionDetailDialog kind="equipFailure" message={dialog.message} onClose={() => setDialog(null)} />
        ) : null}
        {dialog?.kind === "locked" ? (
          <CompanionDetailDialog
            kind="locked"
            name={dialog.name}
            description={dialog.description}
            onClose={() => setDialog(null)}
          />
        ) : null}
        {dialog?.kind === "upgrade" ? <CompanionDetailDialog kind="upgrade" onClose={() => setDialog(null)} /> : null}
        {dialog?.kind === "rankUp" ? <CompanionDetailDialog kind="rankUp" onClose={() => setDialog(null)} /> : null}
        {dialog?.kind === "rankInfo" ? (
          <CompanionDetailDialog kind="rankInfo" onClose={() => setDialog(null)} />
        ) : null}
        {dialog?.kind === "draftConflict" ? (
          <CompanionDetailDialog
            kind="draftConflict"
            onCancel={() => setDialog(null)}
            onConfirm={() => {
              commitEquip();
            }}
          />
        ) : null}
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
