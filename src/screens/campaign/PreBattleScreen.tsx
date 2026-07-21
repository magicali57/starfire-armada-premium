import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { PreBattleTopBar } from "@/components/pre-battle/PreBattleTopBar";
import { PreBattleMissionPanel } from "@/components/pre-battle/PreBattleMissionPanel";
import { PreBattleShipCard } from "@/components/pre-battle/PreBattleShipCard";
import { PreBattleCompanionCard } from "@/components/pre-battle/PreBattleCompanionCard";
import { PreBattleModuleRow } from "@/components/pre-battle/PreBattleModuleRow";
import { PreBattleInfoPanels } from "@/components/pre-battle/PreBattleInfoPanels";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { getStageMapNodeById } from "@/data/campaignChapterMap";
import { getPreBattleContent } from "@/data/preBattle";
import { SHIP_ROSTER_ART, COMPANION_ART, MODULE_ART } from "@/data/assetRegistry";
import { navigate, pathFor } from "@/app/routes";
import "./PreBattleScreen.css";

interface ModalState {
  title: string;
  message: string;
}

// The reference's ship caption reads "HOMING MISSILES" verbatim — an exact
// name match to the real roster id `ship-03-homing-missiles`, not a loose
// substitution like Stage Detail's own loadout art (which used
// ship-01-rapid-fire for its differently-named "Void Reaper"). Companion
// caption "REPAIR DRONE" is likewise an exact match to `repairDrone`.
const LOADOUT_SHIP_ART = SHIP_ROSTER_ART["ship-03-homing-missiles"] ?? "";
const LOADOUT_COMPANION_ART = COMPANION_ART.repairDrone;

// Closest-by-function module art substitutions — no exact "Nebula Core" /
// "Titanium Plating" / "Targeting AI" assets exist in MODULE_ART. Disclosed
// in the completion report.
const MODULE_ART_BY_SLOT = {
  core: MODULE_ART.energyShieldMatrix,
  plating: MODULE_ART.nanoHullPlating,
  system: MODULE_ART.targetingArray,
} as const;

export function PreBattleScreen() {
  const { player } = usePlayerStore();
  const [modal, setModal] = useState<ModalState | null>(null);
  const openModal = (title: string, message: string) => setModal({ title, message });

  const stageId = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return undefined;
    return new URLSearchParams(hash.slice(queryIndex + 1)).get("id") ?? undefined;
  }, []);

  const stageNode = stageId ? getStageMapNodeById(stageId) : undefined;
  const content = stageNode ? getPreBattleContent(stageNode.id, stageNode.index, 2) : undefined;

  const backToStageDetail = () => {
    if (!stageId) {
      navigate("campaign-chapter-map");
      return;
    }
    window.location.hash = `${pathFor("stage-detail")}?id=${stageId}`;
  };

  // Eligibility is read-only — `player.currencies.energy` is never written
  // here. See handleStart below for why: the governing rule
  // (SCREEN_NAVIGATION_MAP.md B-15) states Energy is consumed only once a
  // battle session is *successfully created*, and the Battle Launch
  // destination this screen currently has available is a disclosed
  // placeholder, not a real session — so no deduction happens yet.
  const hasSufficientEnergy = content ? player.currencies.energy >= content.energyCost : false;

  const handleStart = () => {
    if (!content || !stageId) return;

    if (!hasSufficientEnergy) {
      openModal("Not Enough Energy", `This stage costs ${content.energyCost} Energy. Come back once you've recovered enough.`);
      return;
    }

    // Intentionally NOT calling spendCurrency("energy", ...) here.
    // ENERGY DEDUCTION BOUNDARY: real Energy spend must be wired at the
    // point a real battle session is actually created (i.e. inside the
    // future real gameplay-launch flow, after GameplayScreen/data/campaign.ts
    // are connected to this prototype stage id space) — not here, and not
    // inside GameplayLaunchPlaceholderScreen, since neither creates a real
    // session yet. Navigating to the placeholder must never mutate the
    // player's real Energy balance.
    window.location.hash = `${pathFor("battle-launch")}?id=${stageId}`;
  };

  return (
    <div className="pre-battle">
      <PreBattleTopBar
        player={player}
        onBack={backToStageDetail}
        onResourceTap={(label) => openModal(label, "Resource details are coming soon.")}
      />

      <div className="pre-battle__scroll">
        <div className="pre-battle__content">
          <h1 className="pre-battle__title">Prepare for Battle</h1>
          <p className="pre-battle__subtitle">Review your loadout and mission details</p>

          {!content ? (
            <div className="pre-battle__not-found">
              <p>Stage not found.</p>
              <button type="button" className="btn btn--secondary press-scale" onClick={backToStageDetail}>
                Back to Stage Detail
              </button>
            </div>
          ) : (
            <>
              {!content.isReferenceMatched ? (
                <p className="pre-battle__prototype-note">
                  Prototype layout — this stage reuses Stage 7's reference-matched design with placeholder
                  copy until real per-stage data exists.
                </p>
              ) : null}

              <PreBattleMissionPanel content={content} />

              <div className="pre-battle__loadout">
                <h3 className="pre-battle__loadout-heading">Your Loadout</h3>

                <div className="pre-battle__loadout-cards">
                  <PreBattleShipCard ship={content.loadoutShip} art={LOADOUT_SHIP_ART} />
                  <PreBattleCompanionCard companion={content.loadoutCompanion} art={LOADOUT_COMPANION_ART} />
                </div>

                <div className="pre-battle__modules">
                  <span className="pre-battle__modules-heading">Modules</span>
                  <PreBattleModuleRow
                    module={content.modules.core}
                    art={MODULE_ART_BY_SLOT.core}
                    onSelect={() => openModal(content.modules.core.name, "Module details aren't wired up yet — coming soon.")}
                  />
                  <PreBattleModuleRow
                    module={content.modules.plating}
                    art={MODULE_ART_BY_SLOT.plating}
                    onSelect={() => openModal(content.modules.plating.name, "Module details aren't wired up yet — coming soon.")}
                  />
                  <PreBattleModuleRow
                    module={content.modules.system}
                    art={MODULE_ART_BY_SLOT.system}
                    onSelect={() => openModal(content.modules.system.name, "Module details aren't wired up yet — coming soon.")}
                  />
                </div>
              </div>

              <PreBattleInfoPanels
                content={content}
                onSelectModifier={() => openModal("Stage Modifier", "Modifier details aren't wired up yet — coming soon.")}
                onSelectReward={() => openModal("Reward Preview", "Full reward details aren't built yet — coming soon.")}
              />

              <div className="pre-battle__actions">
                <button
                  type="button"
                  className={`pre-battle__start press-scale${!hasSufficientEnergy ? " pre-battle__start--insufficient" : ""}`}
                  onClick={handleStart}
                  aria-disabled={!hasSufficientEnergy}
                >
                  <span className="pre-battle__start-label">Start</span>
                  <span className="pre-battle__start-cost">
                    <BattleModeIcon variant="energy" size={13} />
                    {content.energyCost}
                  </span>
                </button>

                <button
                  type="button"
                  className="pre-battle__change-loadout press-scale"
                  onClick={() => {
                    if (!stageId) return;
                    window.location.hash = `${pathFor("loadout")}?return=pre-battle&stage=${stageId}`;
                  }}
                >
                  <BattleModeIcon variant="refresh" size={13} />
                  Change Loadout
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <LockedContentModal
        open={modal !== null}
        title={modal?.title ?? ""}
        unlockRequirement={modal?.message ?? "Coming soon."}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
