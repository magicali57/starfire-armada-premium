import { useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import type { RankUpShipResult } from "@/store/playerStore";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ShipProgressionTabs, type ShipProgressionTab } from "@/components/navigation/ShipProgressionTabs";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { InlineAlert } from "@/components/feedback/InlineAlert";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { getShipById } from "@/data";
import { getShipDetailContent } from "@/data/shipDetail";
import { getShipMasterArt, MATERIAL_ICON } from "@/data/assetRegistry";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import {
  SHIP_MAX_STAR_RANK,
  calculateShipRankUpQuote,
  getShipRankMilestones,
} from "@/systems/shipStarRank";
import { canUpgradeAnyShipAbility } from "@/systems/shipAbilities";
import { calculateShipLevelUpgradeQuote, createDefaultShipProgress, isMaxLevel } from "@/systems/shipStats";
import { getResourceState } from "@/data/shipUpgrade";
import { getShipStarRankIdFromHash, navigate, pathFor, pathForShipAbilities } from "@/app/routes";
import "./ShipStarRankScreen.css";

interface DialogState {
  title: string;
  message: string;
}

interface FeedbackState {
  tone: "success" | "danger";
  message: string;
}

function failureMessage(shipName: string, result: Extract<RankUpShipResult, { success: false }>): string {
  switch (result.reason) {
    case "not-found":
      return "This ship could not be found.";
    case "not-owned":
      return `${shipName} is not in your fleet.`;
    case "max-rank":
      return `${shipName} is already at maximum Star Rank.`;
    case "insufficient-fragments":
      return "Not enough ship fragments (including Universal Shards) for this rank up.";
    case "insufficient-credits":
      return "Not enough Credits for this rank up.";
    case "insufficient-resources":
      return "Not enough fragments and not enough Credits for this rank up.";
    case "busy":
      return "A rank up is already processing — please wait a moment.";
    default:
      return "The rank up could not be completed.";
  }
}

/**
 * Ship Star Rank screen (#/ships/<shipId>/rank) — the STAR RANK tab of the
 * shared ship progression navigation. Uses the same HubScreenShell shell
 * family as Ship Level Up. Every number shown comes from
 * calculateShipRankUpQuote / getShipRankMilestones (systems/shipStarRank.ts)
 * — no calculations live in this JSX. The 12_Ship_Star_Rank.png concept
 * reference guided the layout only; all identity/values are the selected
 * ship's real data. Star Rank is ship progression — the equipped Arsenal
 * weapon is untouched by anything on this screen.
 */
export function ShipStarRankScreen() {
  const { player, rankUpShip, selectOwnedShip, attemptSelectLockedShip } = usePlayerStore();
  const [comingSoon, setComingSoon] = useState<DialogState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [busy, setBusy] = useState(false);

  const openDialog = (title: string, message: string) => setComingSoon({ title, message });

  const shipId = getShipStarRankIdFromHash(window.location.hash);
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
      open={comingSoon !== null}
      title={comingSoon?.title ?? ""}
      unlockRequirement={comingSoon?.message ?? "Coming soon."}
      onClose={() => setComingSoon(null)}
    />
  );

  const titleBar = (
    <div className="ship-star-rank__title-bar">
      <button
        type="button"
        className="ship-star-rank__back press-scale"
        aria-label="Back to Ship Detail"
        onClick={handleBack}
      >
        <BattleModeIcon variant="chevron" size={16} style={{ transform: "rotate(180deg)" }} />
      </button>
      <div className="ship-star-rank__title-text">
        <h1>Ship Star Rank</h1>
        <p>Evolve ship potential</p>
      </div>
      <span className="ship-star-rank__title-spacer" aria-hidden="true" />
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
          <div className="ship-star-rank__empty">
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
  const quote = calculateShipRankUpQuote(ship, player);
  const detailContent = getShipDetailContent(ship.id, player);
  const signatureName = detailContent?.signatureAttack.name ?? "Signature Attack";
  const milestones = getShipRankMilestones(ship, signatureName);
  const art = getShipMasterArt(ship.id);

  // Truthful Level Up tab badge — same helpers Ship Detail uses.
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
        break; // already here
      case "abilities":
        window.location.hash = pathForShipAbilities(ship.id);
        break;
      case "skins":
        openDialog("Skins", "The Skins screen isn't built yet — coming soon.");
        break;
    }
  };

  const handleRankUp = () => {
    if (busy || !quote.canRankUp) return;
    setBusy(true);
    const result = rankUpShip(ship.id);
    if (result.success) {
      setFeedback({
        tone: "success",
        message: `${ship.name} reached ${result.newRank}★. -${result.creditsSpent.toLocaleString()} Credits, -${result.shipFragmentsSpent.toLocaleString()} ship fragments${
          result.universalShardsSpent > 0
            ? `, -${result.universalShardsSpent.toLocaleString()} Universal Shards`
            : ""
        }. Power ${result.previousPower.toLocaleString()} → ${result.newPower.toLocaleString()}.`,
      });
    } else {
      setFeedback({ tone: "danger", message: failureMessage(ship.name, result) });
    }
    setBusy(false);
  };

  const handleFindFragments = () =>
    openDialog(
      "Find Fragments",
      `${ship.name} fragments will come from Campaign rewards, Reward Chests, Events, and Shop offers. These sources aren't built yet — coming soon.`,
    );

  const rankUpDisabled = busy || !quote.canRankUp;
  const requiredFragments = quote.cost?.fragments ?? 0;

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openDialog} />}
        footer={<HubBottomNav active="fleet" onComingSoon={openDialog} />}
      >
        {titleBar}

        <ShipProgressionTabs
          shipId={ship.id}
          activeTab="star-rank"
          badges={{
            "level-up": levelUpActionable,
            "star-rank": quote.canRankUp,
            abilities: canUpgradeAnyShipAbility(ship, player),
          }}
          onSelect={handleProgressionTab}
        />

        <div className="ship-star-rank__content">
          {feedback ? (
            <InlineAlert
              tone={feedback.tone}
              message={feedback.message}
              onDismiss={() => setFeedback(null)}
            />
          ) : null}

          {/* Hero — real ship identity only */}
          <section
            className="ship-star-rank__hero glass-panel"
            style={{ borderColor: rarityColorVar(ship.rarity) }}
          >
            <div className="ship-star-rank__hero-art">
              {art ? <img src={art} alt={ship.name} /> : null}
            </div>
            <div className="ship-star-rank__hero-info">
              <span
                className="ship-star-rank__rarity-pill"
                style={{ color: rarityColorVar(ship.rarity), borderColor: rarityColorVar(ship.rarity) }}
              >
                {RARITY_LABEL[ship.rarity]}
              </span>
              <h2 className="ship-star-rank__ship-name">{ship.name}</h2>
              <span className="ship-star-rank__role">{ship.role}</span>
              <div className="ship-star-rank__hero-stats">
                <span>
                  Power <b>{quote.currentPower.toLocaleString()}</b>
                </span>
                <span>
                  Level <b>{progress.level}</b>
                </span>
              </div>
              <div className="ship-star-rank__stars" aria-label={`Star Rank ${quote.currentRank} of ${SHIP_MAX_STAR_RANK}`}>
                {Array.from({ length: SHIP_MAX_STAR_RANK }).map((_, i) => (
                  <BattleModeIcon
                    key={i}
                    variant="star"
                    size={18}
                    className={
                      i < quote.currentRank
                        ? "ship-star-rank__star ship-star-rank__star--filled"
                        : "ship-star-rank__star"
                    }
                  />
                ))}
                <b className="ship-star-rank__stars-count">
                  {quote.currentRank}
                  <small>/ {SHIP_MAX_STAR_RANK}</small>
                </b>
              </div>
            </div>
          </section>

          {/* Milestones — contained horizontal scroller */}
          <section className="ship-star-rank__milestones-section">
            <h3 className="ship-star-rank__section-title">Rank Milestones</h3>
            <div className="ship-star-rank__milestones" role="list">
              {milestones.map((m) => {
                const stateClass =
                  m.rank <= quote.currentRank
                    ? "completed"
                    : m.rank === quote.currentRank + 1
                      ? "current"
                      : "upcoming";
                return (
                  <article
                    key={m.rank}
                    role="listitem"
                    className={`ship-star-rank__milestone ship-star-rank__milestone--${stateClass}`}
                  >
                    <header className="ship-star-rank__milestone-head">
                      <BattleModeIcon variant="star" size={14} />
                      <b>{m.rank}★</b>
                      <span className="ship-star-rank__milestone-state">
                        {stateClass === "completed" ? "Completed" : stateClass === "current" ? "Next" : "Locked"}
                      </span>
                    </header>
                    <p className="ship-star-rank__milestone-ability">{m.abilityText}</p>
                    <p className="ship-star-rank__milestone-bonus">{m.bonusText}</p>
                  </article>
                );
              })}
            </div>
          </section>

          {/* Current → next rank preview */}
          <section className="ship-star-rank__preview glass-panel">
            <h3 className="ship-star-rank__section-title">
              {quote.atMaxRank
                ? "Max Rank Bonuses"
                : `${quote.currentRank}★ → ${quote.nextRank}★ Preview`}
            </h3>
            <table className="ship-star-rank__stat-table">
              <tbody>
                {(
                  [
                    ["HP", quote.currentStats.hp, quote.nextStats?.hp],
                    ["Damage", quote.currentStats.damage, quote.nextStats?.damage],
                    ["Defense", quote.currentStats.defense, quote.nextStats?.defense],
                    ["Crit Rate", quote.currentStats.critRate, quote.nextStats?.critRate],
                    ["Power", quote.currentPower, quote.nextPower],
                  ] as const
                ).map(([label, current, next]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{current.toLocaleString()}</td>
                    <td className="ship-star-rank__stat-next">
                      {next !== null && next !== undefined ? (
                        <>
                          <BattleModeIcon variant="chevron" size={11} /> {next.toLocaleString()}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!quote.atMaxRank && quote.nextRank !== null ? (
              <p className="ship-star-rank__preview-ability">
                {milestones[quote.nextRank - 1]?.abilityText}
              </p>
            ) : null}
          </section>

          {/* Requirements */}
          {quote.atMaxRank ? (
            <section className="ship-star-rank__requirements glass-panel ship-star-rank__requirements--max">
              <b>MAX RANK</b>
              <p>{ship.name} has reached its maximum Star Rank. All milestones are complete.</p>
            </section>
          ) : (
            <section className="ship-star-rank__requirements glass-panel">
              <h3 className="ship-star-rank__section-title">Requirements</h3>
              <div className="ship-star-rank__req-cards">
                <div
                  className={`ship-star-rank__req-card${
                    quote.fragmentShortfall > 0 ? " ship-star-rank__req-card--short" : ""
                  }`}
                >
                  <img src={MATERIAL_ICON.shipFragment} alt="" />
                  <span className="ship-star-rank__req-label">Ship Fragments</span>
                  <b>
                    {quote.fragmentsOwned.toLocaleString()} / {requiredFragments.toLocaleString()}
                  </b>
                </div>
                <div
                  className={`ship-star-rank__req-card${
                    quote.fragmentShortfall > 0 ? " ship-star-rank__req-card--short" : ""
                  }`}
                >
                  <img src={MATERIAL_ICON.universalFragment} alt="" />
                  <span className="ship-star-rank__req-label">Universal Shards</span>
                  <b>
                    {quote.universalToSpend > 0
                      ? `${quote.universalToSpend.toLocaleString()} of ${quote.universalOwned.toLocaleString()}`
                      : `${quote.universalOwned.toLocaleString()} owned`}
                  </b>
                  <small>
                    {quote.universalToSpend > 0 ? "fills the shortage" : "no fill needed"}
                  </small>
                </div>
                <div
                  className={`ship-star-rank__req-card${
                    quote.cost !== null && quote.creditsOwned < quote.cost.credits
                      ? " ship-star-rank__req-card--short"
                      : ""
                  }`}
                >
                  <span className="ship-star-rank__req-credits" aria-hidden="true">
                    ¢
                  </span>
                  <span className="ship-star-rank__req-label">Credits</span>
                  <b>{(quote.cost?.credits ?? 0).toLocaleString()}</b>
                  <small>have {quote.creditsOwned.toLocaleString()}</small>
                </div>
              </div>
              {quote.fragmentShortfall > 0 ? (
                <p className="ship-star-rank__shortfall">
                  Missing {quote.fragmentShortfall.toLocaleString()} fragments even with Universal
                  Shards.
                </p>
              ) : null}
            </section>
          )}

          {/* Actions */}
          <div className="ship-star-rank__actions">
            <PrimaryButton
              fullWidth
              disabled={rankUpDisabled}
              onClick={handleRankUp}
              aria-label={quote.atMaxRank ? "Max rank reached" : "Rank up"}
            >
              {quote.atMaxRank ? "MAX RANK" : busy ? "Ranking Up…" : "RANK UP"}
            </PrimaryButton>
            <SecondaryButton fullWidth onClick={handleFindFragments}>
              FIND FRAGMENTS
            </SecondaryButton>
          </div>
        </div>
      </HubScreenShell>
      {dialogModal}
    </>
  );
}
