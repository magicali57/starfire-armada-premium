import type { CSSProperties } from "react";
import { CardCornerBadge } from "@/components/feedback/CardCornerBadge";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { ProgressFill } from "@/components/motion/ProgressFill";
import { HOME_TOPBAR_FINAL } from "@/data/assetRegistry";
import { toRewardDisplayRows, type RewardDisplayRow } from "@/data/rewardDisplay";
import type { DuplicateConversion, ResolvedReward } from "@/types";
import "./BattleRewardSummary.css";

interface BattleRewardSummaryProps {
  playerXpGained: number;
  firstClearRewards: readonly ResolvedReward[];
  baseRewards: readonly ResolvedReward[];
  /** Level-up milestone rewards are shown in PlayerLevelUpModal — Results
   *  only surfaces the level transition, not a second detailed list. */
  newCollectibles: readonly ResolvedReward[];
  duplicateConversions: readonly DuplicateConversion[];
  previousPlayerLevel: number;
  newPlayerLevel: number;
  playerLevelsGained: number;
  xpProgressPercent: number;
  xpWithinLevel: number;
  xpToNextLevel: number;
  displayName?: string;
  avatarSrc?: string;
}

function RewardCard({ row, index, badge }: { row: RewardDisplayRow; index: number; badge?: string }) {
  return (
    <li
      className={`battle-reward-summary__card battle-reward-summary__card--${row.rarity}`}
      style={{ "--reveal-index": index } as CSSProperties}
    >
      {badge ? <span className="battle-reward-summary__card-badge">{badge}</span> : null}
      <img src={row.icon} alt="" />
      <span className="battle-reward-summary__card-name">{row.displayName}</span>
      {row.amount !== null ? (
        <span className="battle-reward-summary__card-amount">
          {row.kind === "currency" ? <AnimatedNumber value={row.amount} /> : row.amount.toLocaleString()}
        </span>
      ) : null}
    </li>
  );
}

/**
 * Shared Results reward-display — card grid matching 47_Victory_Results
 * mood. Every group reads already-applied BattleResultsView data via
 * rewardDisplay.ts. Groups stay mutually exclusive (nothing shown twice).
 * Level-up milestone item lists are intentionally omitted here (Level-Up
 * modal owns that detail).
 */
export function BattleRewardSummary({
  playerXpGained,
  firstClearRewards,
  baseRewards,
  newCollectibles,
  duplicateConversions,
  previousPlayerLevel,
  newPlayerLevel,
  playerLevelsGained,
  xpProgressPercent,
  xpWithinLevel,
  xpToNextLevel,
  displayName,
  avatarSrc,
}: BattleRewardSummaryProps) {
  const firstClearRows = toRewardDisplayRows(firstClearRewards);
  const baseRows = toRewardDisplayRows(baseRewards);
  const collectibleRows = toRewardDisplayRows(newCollectibles);
  const hasRewardCards =
    firstClearRows.length > 0 || baseRows.length > 0 || collectibleRows.length > 0 || duplicateConversions.length > 0;
  const hasProgression = playerXpGained > 0 || playerLevelsGained > 0;

  if (!hasRewardCards && !hasProgression) return null;

  const baseStart = firstClearRows.length;
  const collectibleStart = baseStart + baseRows.length;

  return (
    <section className="battle-reward-summary">
      {hasRewardCards ? (
        <>
          <h3 className="battle-reward-summary__heading">
            <span className="battle-reward-summary__rule" aria-hidden="true" />
            Rewards
            <span className="battle-reward-summary__rule" aria-hidden="true" />
          </h3>

          {firstClearRows.length > 0 ? (
            <section className="battle-reward-summary__group">
              <h4>First-Clear Rewards</h4>
              <ul className="battle-reward-summary__cards">
                {firstClearRows.map((row, index) => (
                  <RewardCard key={row.key} row={row} index={index} badge="First Clear" />
                ))}
              </ul>
            </section>
          ) : null}

          {baseRows.length > 0 ? (
            <section className="battle-reward-summary__group">
              <h4>Battle Rewards</h4>
              <ul className="battle-reward-summary__cards">
                {baseRows.map((row, index) => (
                  <RewardCard key={row.key} row={row} index={baseStart + index} />
                ))}
              </ul>
            </section>
          ) : null}

          {collectibleRows.length > 0 ? (
            <section className="battle-reward-summary__group">
              <h4>New</h4>
              <ul className="battle-reward-summary__cards">
                {collectibleRows.map((row, index) => (
                  <li
                    key={row.key}
                    className={`battle-reward-summary__card battle-reward-summary__card--${row.rarity} battle-reward-summary__card--collectible`}
                    style={{ "--reveal-index": collectibleStart + index } as CSSProperties}
                  >
                    <CardCornerBadge icon={<BattleModeIcon variant="star" size={12} />} label="New" tone="success" />
                    <img src={row.icon} alt="" />
                    <span className="battle-reward-summary__card-name">{row.displayName}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {duplicateConversions.length > 0 ? (
            <section className="battle-reward-summary__group">
              <h4>Duplicate Conversions</h4>
              <ul className="battle-reward-summary__conversions">
                {duplicateConversions.map((conversion, index) => {
                  const row = toRewardDisplayRows([
                    { entry: conversion.converted, source: "campaign-drop", rarity: "common" },
                  ])[0];
                  return (
                    <li key={`${conversion.collectibleType}-${conversion.collectibleId}-${index}`}>
                      <span>Duplicate {conversion.collectibleType} converted</span>
                      {row ? (
                        <strong>
                          <img src={row.icon} alt="" />
                          {row.displayName}
                          {row.amount !== null ? ` ×${row.amount.toLocaleString()}` : ""}
                        </strong>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}

      {hasProgression ? (
        <div className="battle-reward-summary__progression">
          <img className="battle-reward-summary__avatar" src={avatarSrc || HOME_TOPBAR_FINAL.avatar} alt="" />
          <div className="battle-reward-summary__progression-body">
            <div className="battle-reward-summary__progression-top">
              <span className="battle-reward-summary__level">Lv. {newPlayerLevel}</span>
              {playerXpGained > 0 ? (
                <span className="battle-reward-summary__xp-gain">
                  +<AnimatedNumber value={playerXpGained} /> XP
                </span>
              ) : null}
              {displayName ? <span className="battle-reward-summary__name">{displayName}</span> : null}
            </div>
            <ProgressFill percent={xpProgressPercent} tone="primary" className="battle-reward-summary__xp-fill" />
            <span className="battle-reward-summary__xp-numbers">
              {xpWithinLevel.toLocaleString()} / {xpToNextLevel > 0 ? xpToNextLevel.toLocaleString() : "MAX"}
            </span>
          </div>
          {playerLevelsGained > 0 ? (
            <div className="battle-reward-summary__level-up" aria-label={`Level up to ${newPlayerLevel}`}>
              <span>Level Up</span>
              <strong>
                {previousPlayerLevel}→{newPlayerLevel}
              </strong>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
