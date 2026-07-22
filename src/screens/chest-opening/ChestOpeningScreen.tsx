import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { navigate } from "@/app/routes";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { InlineAlert } from "@/components/feedback/InlineAlert";
import { CardCornerBadge } from "@/components/feedback/CardCornerBadge";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { getChestArt, getChestVaultViewModel, type ChestVaultCard } from "@/data/chests";
import { getChestRevealRows } from "@/data/chestReveal";
import type { ChestOpeningErrorCode, ChestOpeningResult } from "@/systems/rewards/openChest";
import { usePlayerStore } from "@/store/playerStore";
import type { ChestId } from "@/types";
import "./ChestOpeningScreen.css";

// The Chest Vault screen — views owned Basic/Rare/Epic chests and drives
// the canonical openChest transaction (store/playerStore.tsx, backed by
// systems/rewards/openChest.ts). This screen and its cinematic sequence
// NEVER grant, roll, or apply anything themselves: every reward shown was
// already atomically committed before `openChest` returned; the phases
// below are presentation-only.

type CinematicPhase = "idle" | "anticipation" | "opening" | "revealing" | "summary";

/** Bounded, deliberately short sequence — ~1.6s total before the summary
 *  becomes interactive, matching the "1.5-3s, never frustrating on repeat
 *  opens" guidance. Skipped outright under prefers-reduced-motion. */
const CINEMATIC_SEQUENCE: { phase: CinematicPhase; delayMs: number }[] = [
  { phase: "anticipation", delayMs: 480 },
  { phase: "opening", delayMs: 520 },
  { phase: "revealing", delayMs: 650 },
];

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_MOTION_QUERY).matches
    : false;
}

function describeChestOpeningError(code?: ChestOpeningErrorCode): string {
  switch (code) {
    case "invalid-chest-id":
      return "That chest type isn't recognized. Nothing was consumed.";
    case "no-chest-owned":
      return "You don't own that chest. Nothing was consumed.";
    case "invalid-reward-table":
      return "This chest's reward table couldn't be resolved. Nothing was consumed.";
    case "invalid-reward-entry":
      return "One of this chest's rewards was invalid. Nothing was consumed.";
    case "persistence-failure":
      return "Your save couldn't be written, so nothing was consumed. Please try again.";
    case "opening-in-progress":
      return "A chest is already opening — please wait.";
    default:
      return "This chest couldn't be opened. Nothing was consumed.";
  }
}

/** Amplitude tiers borrowed from the shared rarity-motion vocabulary
 *  (styles/motion.css) purely for their brightness-pulse AMPLITUDE, not
 *  their name — the wrapping element's own CSS supplies the actual tint
 *  (cyan/blue-violet/purple-gold) per the task's rarity treatment. Basic
 *  gets the mildest pulse, Rare a stronger one, Epic the strongest. */
const CHEST_GLOW_CLASS: Record<ChestVaultCard["rarity"], string> = {
  common: "motion-glow-rare",
  rare: "motion-glow-epic",
  epic: "motion-glow-legendary",
  legendary: "motion-glow-legendary",
};

export function ChestOpeningScreen() {
  const { player, openChest } = usePlayerStore();
  const chests = useMemo(() => getChestVaultViewModel(player), [player]);
  const xpPct = player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const [phase, setPhase] = useState<CinematicPhase>("idle");
  const [openingResult, setOpeningResult] = useState<ChestOpeningResult | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  const runCinematicSequence = useCallback(() => {
    if (prefersReducedMotion()) {
      // Reduced motion still reaches the full reward summary — it just
      // skips straight there, never hiding the reveal.
      setPhase("summary");
      return;
    }
    let index = 0;
    const step = () => {
      if (index >= CINEMATIC_SEQUENCE.length) {
        setPhase("summary");
        return;
      }
      const { phase: nextPhase, delayMs } = CINEMATIC_SEQUENCE[index];
      index += 1;
      setPhase(nextPhase);
      timerRef.current = window.setTimeout(step, delayMs);
    };
    step();
  }, []);

  const handleOpen = (chestId: ChestId) => {
    if (phase !== "idle") return; // no reveal animation currently active
    setFeedback(null);
    const result = openChest({ chestId });
    if (!result.success) {
      setFeedback(describeChestOpeningError(result.errorCode));
      return;
    }
    setOpeningResult(result);
    runCinematicSequence();
  };

  const handleOpenAnother = () => {
    if (!openingResult || phase !== "summary") return;
    const owned = player.chests[openingResult.chestId as ChestId] ?? 0;
    if (owned < 1) return;
    setFeedback(null);
    const result = openChest({ chestId: openingResult.chestId });
    if (!result.success) {
      setFeedback(describeChestOpeningError(result.errorCode));
      setOpeningResult(null);
      clearTimer();
      setPhase("idle");
      return;
    }
    setOpeningResult(result);
    runCinematicSequence();
  };

  const handleSkip = () => {
    clearTimer();
    setPhase("summary");
  };

  const handleDone = () => {
    clearTimer();
    setPhase("idle");
    setOpeningResult(null);
  };

  const handleCinematicClose = () => {
    // Backdrop click / Escape can only ever act like Done, and only once
    // the summary is showing — it can never skip or reroll mid-sequence.
    if (phase === "summary") handleDone();
  };

  const revealRows = openingResult ? getChestRevealRows(openingResult) : [];
  const rarity = openingResult?.chestRarity ?? "common";
  const glowClass = CHEST_GLOW_CLASS[rarity];
  const showChestFocus = phase === "anticipation" || phase === "opening";
  const showSkip = phase === "anticipation" || phase === "opening" || phase === "revealing";
  const showRewards = phase === "revealing" || phase === "summary";
  const canOpenAnother =
    phase === "summary" && !!openingResult && (player.chests[openingResult.chestId as ChestId] ?? 0) > 0;

  const openNotice = (title: string, message: string) => setNotice({ title, message });

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openNotice} />}
        footer={<HubBottomNav active="inventory" onComingSoon={openNotice} />}
      >
        <main className="chest-vault">
          <div className="chest-vault__topline">
            <SecondaryButton onClick={() => navigate("inventory")}>Back to Inventory</SecondaryButton>
          </div>
          <header className="chest-vault__title">
            <h1>Chest Vault</h1>
            <p>Open your unopened chests to reveal their rewards.</p>
          </header>

          {feedback ? (
            <InlineAlert tone="danger" message={feedback} onDismiss={() => setFeedback(null)} />
          ) : null}

          <div className="chest-vault__grid">
            {chests.map((chest) => (
              <article key={chest.chestId} className={`chest-card chest-card--${chest.rarity} glass-panel`}>
                <div className="chest-card__art-wrap">
                  <img src={chest.art} alt="" className="chest-card__art" />
                </div>
                <h2 className="chest-card__name">{chest.displayName}</h2>
                <ul className="chest-card__contents">
                  {chest.contentsSummary.map((category) => (
                    <li key={category}>{category}</li>
                  ))}
                </ul>
                <div className="chest-card__footer">
                  <span className="chest-card__owned">
                    Owned: <strong>{chest.ownedCount}</strong>
                  </span>
                  {chest.ownedCount > 0 ? (
                    <PrimaryButton disabled={phase !== "idle"} onClick={() => handleOpen(chest.chestId)}>
                      Open
                    </PrimaryButton>
                  ) : (
                    <span className="chest-card__empty">None owned</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        </main>
      </HubScreenShell>

      <ModalLayer
        open={phase !== "idle"}
        title={openingResult?.chestDisplayName ?? "Opening Chest"}
        onClose={handleCinematicClose}
      >
        {openingResult ? (
          <div className={`chest-cinematic chest-cinematic--${phase}`}>
            <div className="chest-cinematic__stage">
              <img
                src={getChestArt(openingResult.chestId as ChestId)}
                alt=""
                className={[
                  "chest-cinematic__art",
                  `chest-cinematic__art--${rarity}`,
                  showChestFocus ? glowClass : "",
                  phase === "anticipation" ? "chest-cinematic__art--anticipate" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              />
              {phase === "opening" ? <span className="chest-cinematic__burst" aria-hidden="true" /> : null}
            </div>

            {showSkip ? (
              <button type="button" className="chest-cinematic__skip press-scale" onClick={handleSkip}>
                Skip
              </button>
            ) : null}

            {showRewards ? (
              <div className="chest-cinematic__rewards">
                <h3>Rewards</h3>
                <ul className="chest-cinematic__reward-list">
                  {revealRows.map((item, index) => (
                    <li
                      key={item.row.key}
                      className={`chest-cinematic__reward chest-cinematic__reward--${item.row.rarity} motion-stagger-item`}
                      style={{ "--motion-index": index } as CSSProperties}
                    >
                      {item.isNew ? (
                        <CardCornerBadge icon={<BattleModeIcon variant="star" size={12} />} label="New" tone="success" />
                      ) : null}
                      <img src={item.row.icon} alt="" />
                      <span className="chest-cinematic__reward-name">{item.row.displayName}</span>
                      {item.row.amount !== null ? (
                        <span className="chest-cinematic__reward-amount">
                          ×
                          {item.row.kind === "currency" ? (
                            <AnimatedNumber value={item.row.amount} />
                          ) : (
                            item.row.amount.toLocaleString()
                          )}
                        </span>
                      ) : null}
                      {item.isDuplicateConversion ? (
                        <small className="chest-cinematic__reward-note">Duplicate converted</small>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {phase === "summary" ? (
              <div className="chest-cinematic__actions">
                {canOpenAnother ? (
                  <SecondaryButton onClick={handleOpenAnother}>Open Another</SecondaryButton>
                ) : null}
                <PrimaryButton fullWidth={!canOpenAnother} onClick={handleDone}>
                  Done
                </PrimaryButton>
              </div>
            ) : null}
          </div>
        ) : null}
      </ModalLayer>

      <ModalLayer open={notice !== null} title={notice?.title ?? ""} onClose={() => setNotice(null)}>
        <div className="chest-vault__dialog">
          <p>{notice?.message}</p>
          <PrimaryButton fullWidth onClick={() => setNotice(null)}>
            Continue
          </PrimaryButton>
        </div>
      </ModalLayer>
    </>
  );
}
