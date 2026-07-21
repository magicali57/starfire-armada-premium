import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { UpgradeShipAbilityResult } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ShipProgressionTabs, type ShipProgressionTab } from "@/components/navigation/ShipProgressionTabs";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { InlineAlert } from "@/components/feedback/InlineAlert";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { getShipById } from "@/data";
import { getShipMasterArt, MATERIAL_ICON } from "@/data/assetRegistry";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import {
  SHIP_ABILITY_CATEGORIES,
  canUpgradeAnyShipAbility,
  getShipAbilityPreview,
  type ShipAbilityCategory,
  type ShipAbilityPreview,
} from "@/systems/shipAbilities";
import {
  SHIP_MAX_STAR_RANK,
  calculateShipRankUpQuote,
  canRankUpShip,
  getShipRankMilestones,
} from "@/systems/shipStarRank";
import { calculateShipLevelUpgradeQuote, createDefaultShipProgress, isMaxLevel } from "@/systems/shipStats";
import { getResourceState } from "@/data/shipUpgrade";
import {
  getShipAbilitiesIdFromHash,
  navigate,
  pathFor,
  pathForShipStarRank,
} from "@/app/routes";
import "./ShipAbilitiesScreen.css";

interface DialogState {
  title: string;
  message: string;
}

interface FeedbackState {
  tone: "success" | "danger";
  message: string;
}

const CATEGORY_LABEL: Record<ShipAbilityCategory, string> = {
  signature: "Signature Attack",
  passive: "Passive Ability",
  calamity: "Calamity Ability",
};

function failureMessage(result: Extract<UpgradeShipAbilityResult, { success: false }>): string {
  switch (result.reason) {
    case "not-found":
      return "This ship could not be found.";
    case "not-owned":
      return "This ship is not in your fleet.";
    case "locked-star-rank":
      return "This ability is still locked by Star Rank.";
    case "max-level":
      return "This ability is already at maximum level.";
    case "insufficient-credits":
      return "Not enough Credits for this upgrade.";
    case "insufficient-ability-cores":
      return "Not enough Ability Cores for this upgrade.";
    case "insufficient-resources":
      return "Not enough Credits and not enough Ability Cores for this upgrade.";
    case "busy":
      return "An upgrade is already processing — please wait a moment.";
    default:
      return "The upgrade could not be completed.";
  }
}

/**
 * Ship Abilities screen (#/ships/<shipId>/abilities) — the ABILITIES tab of
 * the shared ship progression navigation. Shows the ship's three built-in
 * abilities (SIGNATURE ATTACK / PASSIVE ABILITY / CALAMITY ABILITY — never
 * Arsenal terminology; the equipped Arsenal weapon is a separate system this
 * screen never reads or writes). All numbers come from
 * getShipAbilityPreview / getShipRankMilestones — no calculations in JSX.
 * 14_Ship_Abilities.png guided the layout only; identity/values are real
 * canonical ship data.
 */
export function ShipAbilitiesScreen() {
  const { player, upgradeShipAbility, selectOwnedShip, attemptSelectLockedShip } = usePlayerStore();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busy, setBusy] = useState(false);

  const openDialog = (title: string, message: string) => setDialog({ title, message });

  const shipId = getShipAbilitiesIdFromHash(window.location.hash);
  const ship = shipId ? getShipById(shipId) : undefined;

  const xpPct =
    player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const handleBack = () => {
    if (ship) {
      window.location.hash = `${pathFor("ship-detail-placeholder")}?id=${ship.id}`;
    } else {
      navigate("ship-selection");
    }
  };

  const dialogModal = (
    <LockedContentModal
      open={dialog !== null}
      title={dialog?.title ?? ""}
      unlockRequirement={dialog?.message ?? "Coming soon."}
      onClose={() => setDialog(null)}
    />
  );

  const titleBar = (
    <div className="ship-abilities__title-bar">
      <button
        type="button"
        className="ship-abilities__back press-scale"
        aria-label="Back to Ship Detail"
        onClick={handleBack}
      >
        <BattleModeIcon variant="chevron" size={16} style={{ transform: "rotate(180deg)" }} />
      </button>
      <div className="ship-abilities__title-text">
        <h1>Ship Abilities</h1>
        <p>Signature, passive, and Calamity</p>
      </div>
      <span className="ship-abilities__title-spacer" aria-hidden="true" />
    </div>
  );

  // ---- Unknown ship id ----
  if (!ship) {
    return (
      <>
        <HubScreenShell
          header={<HubHeader player={player} xpPct={xpPct} onOpen={openDialog} />}
          footer={<HubBottomNav active="fleet" onComingSoon={openDialog} />}
        >
          {titleBar}
          <div className="ship-abilities__empty">
            <p>Ship not found.</p>
            <SecondaryButton onClick={() => navigate("ship-selection")}>Back to Fleet</SecondaryButton>
          </div>
        </HubScreenShell>
        {dialogModal}
      </>
    );
  }

  const owned = player.ownedShipIds.includes(ship.id);
  const progress = player.shipProgress[ship.id] ?? createDefaultShipProgress(ship.id);
  const rankQuote = calculateShipRankUpQuote(ship, player);
  const previews = SHIP_ABILITY_CATEGORIES.map((category) =>
    getShipAbilityPreview(ship, player, category),
  );
  const signaturePreview = previews[0];
  const milestones = getShipRankMilestones(ship, signaturePreview.definition.name);
  const art = getShipMasterArt(ship.id);

  const levelUpActionable =
    owned &&
    !isMaxLevel(progress.level) &&
    getResourceState(calculateShipLevelUpgradeQuote(ship, progress.level, 1), player).canAfford;

  const handleProgressionTab = (tab: ShipProgressionTab) => {
    switch (tab) {
      case "level-up":
        if (!owned) {
          const info = attemptSelectLockedShip(ship.id);
          openDialog(ship.name, info?.unlockRequirement ?? ship.unlockRequirement);
          return;
        }
        selectOwnedShip(ship.id);
        navigate("ship-upgrade");
        break;
      case "star-rank":
        window.location.hash = pathForShipStarRank(ship.id);
        break;
      case "abilities":
        break; // already here
      case "skins":
        openDialog("Skins", "The Skins screen isn't built yet — coming soon.");
        break;
    }
  };

  const handleUpgrade = (preview: ShipAbilityPreview) => {
    if (busy || !preview.canUpgrade) return;
    setBusy(true);
    const result = upgradeShipAbility(ship.id, preview.category);
    if (result.success) {
      setFeedback({
        tone: "success",
        message: `${result.abilityName} reached Level ${result.newLevel}. -${result.creditsSpent.toLocaleString()} Credits, -${result.abilityCoresSpent.toLocaleString()} Ability Cores. ${preview.definition.effectLabel}: ${result.previousEffectText} → ${result.newEffectText}.`,
      });
    } else {
      setFeedback({ tone: "danger", message: failureMessage(result) });
    }
    setBusy(false);
  };

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openDialog} />}
        footer={<HubBottomNav active="fleet" onComingSoon={openDialog} />}
      >
        {titleBar}

        <ShipProgressionTabs
          shipId={ship.id}
          activeTab="abilities"
          badges={{
            "level-up": levelUpActionable,
            "star-rank": canRankUpShip(ship, player),
            abilities: canUpgradeAnyShipAbility(ship, player),
          }}
          onSelect={handleProgressionTab}
        />

        <div className="ship-abilities__content">
          {feedback ? (
            <InlineAlert
              tone={feedback.tone}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {/* Hero — real ship identity only */}
          <section
            className="ship-abilities__hero glass-panel"
            style={{ borderColor: rarityColorVar(ship.rarity) }}
          >
            <div className="ship-abilities__hero-art">
              {art ? <img src={art} alt={ship.name} /> : null}
            </div>
            <div className="ship-abilities__hero-info">
              <span
                className="ship-abilities__rarity-pill"
                style={{ color: rarityColorVar(ship.rarity), borderColor: rarityColorVar(ship.rarity) }}
              >
                {RARITY_LABEL[ship.rarity]}
              </span>
              <h2 className="ship-abilities__ship-name">{ship.name}</h2>
              <span className="ship-abilities__role">{ship.role}</span>
              <div className="ship-abilities__hero-stats">
                <span>
                  Power <b>{rankQuote.currentPower.toLocaleString()}</b>
                </span>
                <span>
                  Level <b>{progress.level}</b>
                </span>
                <span className="ship-abilities__hero-stars">
                  <BattleModeIcon variant="star" size={13} />
                  <b>
                    {rankQuote.currentRank}
                    <small>/{SHIP_MAX_STAR_RANK}</small>
                  </b>
                </span>
              </div>
            </div>
          </section>

          {/* Ability cards */}
          {previews.map((preview) => {
            const def = preview.definition;
            const locked = !preview.unlocked;
            return (
              <section
                key={def.id}
                className={`ship-abilities__card glass-panel ship-abilities__card--${def.category}${
                  locked ? " ship-abilities__card--locked" : ""
                }`}
              >
                <span className="ship-abilities__card-pill">{CATEGORY_LABEL[def.category]}</span>

                <div className="ship-abilities__card-body">
                  <span className="ship-abilities__card-icon">
                    <BattleModeIcon variant={def.iconKey} size={22} />
                  </span>
                  <div className="ship-abilities__card-copy">
                    <h3 className="ship-abilities__card-name">{def.name}</h3>
                    <p className="ship-abilities__card-description">{def.description}</p>
                  </div>
                  <span className="ship-abilities__card-level">
                    Level
                    <b>
                      {preview.level}
                      <small>/ {preview.maxLevel}</small>
                    </b>
                  </span>
                </div>

                <div className="ship-abilities__card-effects">
                  <span className="ship-abilities__effect-current">
                    {def.effectLabel}: <b>{preview.currentEffectText}</b>
                  </span>
                  {preview.nextEffectText !== null ? (
                    <span className="ship-abilities__effect-next">
                      <BattleModeIcon variant="chevron" size={11} /> {preview.nextEffectText} at Level{" "}
                      {preview.level + 1}
                    </span>
                  ) : null}
                </div>

                {locked ? (
                  <div className="ship-abilities__card-locked-row">
                    <BattleModeIcon variant="lock" size={14} />
                    <span>
                      {owned
                        ? `Unlocks at ${preview.lockedUntilStarRank}★ Star Rank`
                        : "Ship not in your fleet"}
                    </span>
                    <SecondaryButton className="ship-abilities__upgrade-btn" disabled>
                      Locked
                    </SecondaryButton>
                  </div>
                ) : preview.atMaxLevel ? (
                  <div className="ship-abilities__card-cost-row">
                    <b className="ship-abilities__max-level">MAX LEVEL</b>
                    <SecondaryButton className="ship-abilities__upgrade-btn" disabled>
                      Upgrade
                    </SecondaryButton>
                  </div>
                ) : (
                  <div className="ship-abilities__card-cost-row">
                    <span
                      className={`ship-abilities__cost${
                        preview.shortCredits ? " ship-abilities__cost--short" : ""
                      }`}
                    >
                      <i className="ship-abilities__credits-glyph" aria-hidden="true">
                        ¢
                      </i>
                      {(preview.cost?.credits ?? 0).toLocaleString()}
                    </span>
                    <span
                      className={`ship-abilities__cost${
                        preview.shortAbilityCores ? " ship-abilities__cost--short" : ""
                      }`}
                    >
                      <img src={MATERIAL_ICON.abilityCores} alt="Ability Cores" />
                      {(preview.cost?.abilityCores ?? 0).toLocaleString()}
                      <small>/ {preview.abilityCoresOwned.toLocaleString()}</small>
                    </span>
                    <SecondaryButton
                      className="ship-abilities__upgrade-btn"
                      disabled={busy || !preview.canUpgrade}
                      onClick={() => handleUpgrade(preview)}
                    >
                      {busy ? "…" : "Upgrade"}
                    </SecondaryButton>
                  </div>
                )}
                {!locked && !preview.atMaxLevel && (preview.shortCredits || preview.shortAbilityCores) ? (
                  <p className="ship-abilities__shortage">
                    {preview.shortCredits && preview.shortAbilityCores
                      ? "Not enough Credits or Ability Cores."
                      : preview.shortCredits
                        ? "Not enough Credits."
                        : "Not enough Ability Cores."}
                  </p>
                ) : null}
              </section>
            );
          })}

          {/* Star Rank ability-bonus summary — canonical milestone data */}
          <section className="ship-abilities__milestones glass-panel">
            <h3 className="ship-abilities__section-title">Star Rank Ability Bonuses</h3>
            <ul className="ship-abilities__milestone-list">
              {milestones.map((m) => (
                <li
                  key={m.rank}
                  className={
                    m.rank <= rankQuote.currentRank
                      ? "ship-abilities__milestone ship-abilities__milestone--reached"
                      : "ship-abilities__milestone"
                  }
                >
                  <b>{m.rank}★</b>
                  <span>{m.abilityText}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </HubScreenShell>
      {dialogModal}
    </>
  );
}
