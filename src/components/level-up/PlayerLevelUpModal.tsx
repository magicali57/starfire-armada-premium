import type { CSSProperties } from "react";
import type { ResolvedReward } from "@/types";
import type { PlayerUnlockDefinition } from "@/systems/playerProgression";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { toRewardDisplayRows } from "@/data/rewardDisplay";
import "./PlayerLevelUpModal.css";

export interface PlayerLevelUpModalProps {
  isOpen: boolean;
  previousLevel: number;
  newLevel: number;
  levelsGained: number;
  /** Raw canonical rewards already applied by the progression transaction
   *  (e.g. BattleResultsView.levelUpRewards) — this component converts
   *  them to display rows itself via the shared presentation helper. */
  rewards: readonly ResolvedReward[];
  /** Unlocks the canonical result actually returned — never invented. */
  unlocks: readonly PlayerUnlockDefinition[];
  reachedMaxLevel: boolean;
  onClose: () => void;
}

/**
 * Reusable, informational-only Level-Up modal. Displays progression a
 * canonical transaction (battle completion today; Daily Rewards/missions/
 * chest reveals later) already applied — it never grants XP, rewards,
 * unlocks, Energy, or campaign progress itself, and never re-runs any
 * reward transaction. Supports one gain crossing multiple levels: shows
 * the full transition and one combined, aggregated reward/unlock
 * presentation rather than one modal per level.
 */
/** Restrained milestone glow — only Rare/Epic/Legendary rows pulse at all
 *  (see styles/motion.css); Common rewards stay static, matching the
 *  "never apply strong animated effects to common items" rule. */
const RARITY_GLOW_CLASS: Partial<Record<string, string>> = {
  rare: "motion-glow-rare",
  epic: "motion-glow-epic",
  legendary: "motion-glow-legendary",
};

export function PlayerLevelUpModal({
  isOpen,
  previousLevel,
  newLevel,
  levelsGained,
  rewards,
  unlocks,
  reachedMaxLevel,
  onClose,
}: PlayerLevelUpModalProps) {
  const rewardRows = toRewardDisplayRows(rewards);

  return (
    <ModalLayer open={isOpen} title="Level Up" onClose={onClose}>
      <div className="level-up-modal">
        <div className="level-up-modal__scroll">
          <p className="level-up-modal__heading">LEVEL UP</p>

          <div className="level-up-modal__transition">
            <span className="level-up-modal__level level-up-modal__level--from">{previousLevel}</span>
            <span className="level-up-modal__arrow" aria-hidden="true">
              →
            </span>
            <span className="level-up-modal__level level-up-modal__level--to">{newLevel}</span>
          </div>

          {levelsGained > 1 ? (
            <p className="level-up-modal__multi">{levelsGained} LEVELS GAINED</p>
          ) : null}

          {reachedMaxLevel ? <p className="level-up-modal__max">MAX LEVEL REACHED</p> : null}

          {rewardRows.length > 0 ? (
            <section className="level-up-modal__section">
              <h3>Milestone Rewards</h3>
              <ul className="level-up-modal__rewards">
                {rewardRows.map((row, index) => (
                  <li
                    key={row.key}
                    className={[
                      "level-up-modal__reward",
                      `level-up-modal__reward--${row.rarity}`,
                      RARITY_GLOW_CLASS[row.rarity],
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    style={{ "--reveal-index": index } as CSSProperties}
                  >
                    <img src={row.icon} alt="" />
                    <span className="level-up-modal__reward-name">{row.displayName}</span>
                    {row.amount !== null ? (
                      <span className="level-up-modal__reward-amount">
                        ×{row.kind === "currency" ? <AnimatedNumber value={row.amount} /> : row.amount.toLocaleString()}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {unlocks.length > 0 ? (
            <section className="level-up-modal__section">
              <h3>Newly Unlocked</h3>
              <ul className="level-up-modal__unlocks">
                {unlocks.map((unlock, index) => (
                  <li
                    key={unlock.id}
                    className="level-up-modal__unlock"
                    style={{ "--reveal-index": index } as CSSProperties}
                  >
                    {unlock.label}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="level-up-modal__actions">
          <PrimaryButton fullWidth onClick={onClose}>
            Continue
          </PrimaryButton>
        </div>
      </div>
    </ModalLayer>
  );
}
