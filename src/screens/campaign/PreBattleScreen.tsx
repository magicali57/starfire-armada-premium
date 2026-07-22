import { useEffect, useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { PreBattleTopBar } from "@/components/pre-battle/PreBattleTopBar";
import { PreBattleMissionPanel } from "@/components/pre-battle/PreBattleMissionPanel";
import { PreBattleShipCard } from "@/components/pre-battle/PreBattleShipCard";
import { PreBattleCompanionCard } from "@/components/pre-battle/PreBattleCompanionCard";
import { PreBattleModuleRow } from "@/components/pre-battle/PreBattleModuleRow";
import { PreBattleInfoPanels } from "@/components/pre-battle/PreBattleInfoPanels";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { getShipById } from "@/data";
import { getStageMapNodeById } from "@/data/campaignChapterMap";
import { getPreBattleContent } from "@/data/preBattle";
import { getStageById, getChapterById, isStageAccessible } from "@/data/campaign";
import { RAPID_FIRE_SHIP_ID } from "@/data/gameplayRapidFire";
import { getBattleEnergyCost } from "@/systems/battleSession";
import { createDefaultShipProgress } from "@/systems/shipStats";
import { SHIP_ROSTER_ART, COMPANION_ART, MODULE_ART, getShipMasterArt } from "@/data/assetRegistry";
import { RARITY_LABEL } from "@/utils/rarity";
import { navigate, pathFor } from "@/app/routes";
import "./PreBattleScreen.css";

interface ModalState {
  title: string;
  message: string;
}

const LOADOUT_COMPANION_ART = COMPANION_ART.repairDrone;

const MODULE_ART_BY_SLOT = {
  core: MODULE_ART.energyShieldMatrix,
  plating: MODULE_ART.nanoHullPlating,
  system: MODULE_ART.targetingArray,
} as const;

export function PreBattleScreen() {
  const { player, startBattle } = usePlayerStore();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const openModal = (title: string, message: string) => setModal({ title, message });

  const stageId = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return undefined;
    return new URLSearchParams(hash.slice(queryIndex + 1)).get("id") ?? undefined;
  }, []);

  const rapidFireReason = useMemo(() => {
    const hash = window.location.hash;
    const queryIndex = hash.indexOf("?");
    if (queryIndex === -1) return false;
    return new URLSearchParams(hash.slice(queryIndex + 1)).get("reason") === "rapid-fire-required";
  }, []);

  useEffect(() => {
    if (!rapidFireReason) return;
    setModal({
      title: "Rapid-Fire Required",
      message: "Rapid-Fire is required for the current gameplay prototype. Equip it before starting battle.",
    });
  }, [rapidFireReason]);

  const realStage = stageId ? getStageById(stageId) : undefined;
  const stageNode = stageId ? getStageMapNodeById(stageId) : undefined;
  const content = realStage
    ? getPreBattleContent(realStage.id, realStage.index, getChapterById(realStage.chapterId)?.index ?? 1)
    : stageNode
      ? getPreBattleContent(stageNode.id, stageNode.index, 2)
      : undefined;

  const selectedShip = getShipById(player.selectedShipId);
  const shipProgress =
    player.shipProgress[player.selectedShipId] ?? createDefaultShipProgress(player.selectedShipId);
  const shipArt =
    (selectedShip
      ? SHIP_ROSTER_ART[selectedShip.id] ?? getShipMasterArt(selectedShip.id) ?? ""
      : "") ||
    SHIP_ROSTER_ART[RAPID_FIRE_SHIP_ID] ||
    "";
  const loadoutShip = {
    name: selectedShip?.name ?? "Unknown Ship",
    level: shipProgress.level,
    rarityLabel: selectedShip ? RARITY_LABEL[selectedShip.rarity].toUpperCase() : "—",
  };
  const isRapidFireEquipped = player.selectedShipId === RAPID_FIRE_SHIP_ID;

  const backToStageDetail = () => {
    if (!stageId) {
      navigate("campaign-chapter-map");
      return;
    }
    window.location.hash = `${pathFor("stage-detail")}?id=${encodeURIComponent(stageId)}`;
  };

  const energyCost = realStage ? getBattleEnergyCost(realStage.id) : content?.energyCost ?? 0;
  const hasSufficientEnergy = content ? player.currencies.energy >= energyCost : false;
  const isLocked = realStage ? !isStageAccessible(player, realStage.id) : false;
  const canStart =
    !!realStage &&
    !isLocked &&
    hasSufficientEnergy &&
    isRapidFireEquipped &&
    !isStarting;

  const goChangeShip = () => {
    if (!stageId) return;
    window.location.hash = `${pathFor("ship-selection")}?return=pre-battle&stage=${encodeURIComponent(stageId)}`;
  };

  // ENERGY DEDUCTION BOUNDARY: Energy is never spent in this component.
  // `startBattle` deducts Energy exactly once after validation passes.
  const handleStart = () => {
    if (!content || !stageId || isStarting) return;

    if (!realStage) {
      openModal("Stage Unavailable", "This stage isn't connected to the battle system yet.");
      return;
    }
    if (!isRapidFireEquipped) {
      openModal(
        "Rapid-Fire Required",
        "Rapid-Fire is required for the current gameplay prototype. Equip it in Fleet to continue.",
      );
      return;
    }
    if (isLocked) {
      openModal("Stage Locked", "Clear the previous stage first to unlock this one.");
      return;
    }
    if (!hasSufficientEnergy) {
      openModal("Not Enough Energy", `This stage costs ${energyCost} Energy. Come back once you've recovered enough.`);
      return;
    }

    setIsStarting(true);
    const result = startBattle({ stageId: realStage.id });
    setIsStarting(false);

    if (!result.ok) {
      if (result.error === "insufficient-energy") {
        openModal("Not Enough Energy", `This stage costs ${energyCost} Energy. Come back once you've recovered enough.`);
      } else if (result.error === "unknown-stage") {
        openModal("Stage Unavailable", "This stage isn't connected to the battle system yet.");
      } else {
        openModal("Please Wait", "A battle is already starting. Please try again in a moment.");
      }
      return;
    }

    navigate("gameplay");
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
              {!content.isReferenceMatched && !realStage ? (
                <p className="pre-battle__prototype-note">
                  Prototype layout — this stage reuses Stage 7's reference-matched design with placeholder
                  copy until real per-stage data exists.
                </p>
              ) : null}

              {!isRapidFireEquipped ? (
                <p className="pre-battle__prototype-note pre-battle__rapid-fire-warning" role="status">
                  Rapid-Fire is required for the current gameplay prototype.
                </p>
              ) : null}

              <PreBattleMissionPanel content={content} />

              <div className="pre-battle__loadout">
                <h3 className="pre-battle__loadout-heading">Your Loadout</h3>

                <div className="pre-battle__loadout-cards">
                  <PreBattleShipCard ship={loadoutShip} art={shipArt} />
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
                  className={`pre-battle__start press-scale${!canStart ? " pre-battle__start--insufficient" : ""}`}
                  onClick={handleStart}
                  disabled={!canStart}
                  aria-disabled={!canStart}
                >
                  <span className="pre-battle__start-label">Start</span>
                  <span className="pre-battle__start-cost">
                    <BattleModeIcon variant="energy" size={13} />
                    {energyCost}
                  </span>
                </button>

                <button type="button" className="pre-battle__change-loadout press-scale" onClick={goChangeShip}>
                  <BattleModeIcon variant="refresh" size={13} />
                  Change Ship
                </button>

                <button
                  type="button"
                  className="pre-battle__change-loadout press-scale"
                  onClick={() => {
                    if (!stageId) return;
                    window.location.hash = `${pathFor("loadout")}?return=pre-battle&stage=${encodeURIComponent(stageId)}`;
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
