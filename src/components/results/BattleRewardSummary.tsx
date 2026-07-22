import type { CSSProperties } from "react";
import { NeonPanel } from "@/components/cards/NeonPanel";
import { CardCornerBadge } from "@/components/feedback/CardCornerBadge";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { toRewardDisplayRows, type RewardDisplayRow } from "@/data/rewardDisplay";
import type { DuplicateConversion, ResolvedReward } from "@/types";
import "./BattleRewardSummary.css";

interface BattleRewardSummaryProps {
  playerXpGained: number;
  firstClearRewards: readonly ResolvedReward[];
  baseRewards: readonly ResolvedReward[];
  levelUpRewards: readonly ResolvedReward[];
  newCollectibles: readonly ResolvedReward[];
  duplicateConversions: readonly DuplicateConversion[];
  previousPlayerLevel: number;
  newPlayerLevel: number;
  playerLevelsGained: number;
}

function RewardRow({ row, index }: { row: RewardDisplayRow; index: number }) {
  return (
    <li
      className={`battle-reward-summary__row battle-reward-summary__row--${row.rarity}`}
      style={{ "--reveal-index": index } as CSSProperties}
    >
      <img src={row.icon} alt="" />
      <span className="battle-reward-summary__row-name">{row.displayName}</span>
      {row.amount !== null ? (
        <span className="battle-reward-summary__row-amount">×{row.amount.toLocaleString()}</span>
      ) : null}
    </li>
  );
}

function RewardGroup({ title, rewards }: { title: string; rewards: readonly ResolvedReward[] }) {
  if (rewards.length === 0) return null;
  const rows = toRewardDisplayRows(rewards);
  return (
    <section className="battle-reward-summary__group">
      <h4>{title}</h4>
      <ul className="battle-reward-summary__rows">
        {rows.map((row, index) => (
          <RewardRow key={row.key} row={row} index={index} />
        ))}
      </ul>
    </section>
  );
}

/**
 * Shared Results reward-display component — the ONE place battle rewards
 * (base clear, first-clear bonus, Player Level milestones, new
 * collectibles, duplicate conversions) render. Every group reads
 * already-applied canonical data (BattleResultsView) and reuses the
 * shared rewardDisplay.ts presentation/aggregation helper — no reward
 * value is computed here. Groups are mutually exclusive (an entry never
 * appears in two groups), so nothing is ever shown twice.
 */
export function BattleRewardSummary({
  playerXpGained,
  firstClearRewards,
  baseRewards,
  levelUpRewards,
  newCollectibles,
  duplicateConversions,
  previousPlayerLevel,
  newPlayerLevel,
  playerLevelsGained,
}: BattleRewardSummaryProps) {
  const hasAnyContent =
    playerXpGained > 0 ||
    firstClearRewards.length > 0 ||
    baseRewards.length > 0 ||
    levelUpRewards.length > 0 ||
    newCollectibles.length > 0 ||
    duplicateConversions.length > 0;

  if (!hasAnyContent) return null;

  return (
    <NeonPanel tone="gold" className="battle-reward-summary">
      <h3>Rewards</h3>

      {playerXpGained > 0 ? (
        <p className="battle-reward-summary__xp">
          <BattleModeIcon variant="star" size={16} />
          {playerXpGained.toLocaleString()} Player XP
        </p>
      ) : null}

      {playerLevelsGained > 0 ? (
        <p className="battle-reward-summary__level-transition">
          Player Level {previousPlayerLevel} → {newPlayerLevel}
        </p>
      ) : null}

      <RewardGroup title="First-Clear Rewards" rewards={firstClearRewards} />
      <RewardGroup title="Battle Rewards" rewards={baseRewards} />
      <RewardGroup title="Player Level Rewards" rewards={levelUpRewards} />

      {newCollectibles.length > 0 ? (
        <section className="battle-reward-summary__group">
          <h4>New</h4>
          <ul className="battle-reward-summary__collectibles">
            {toRewardDisplayRows(newCollectibles).map((row, index) => (
              <li
                key={row.key}
                className="battle-reward-summary__collectible"
                style={{ "--reveal-index": index } as CSSProperties}
              >
                <CardCornerBadge icon={<BattleModeIcon variant="star" size={12} />} label="New" tone="success" />
                <img src={row.icon} alt="" />
                <span>{row.displayName}</span>
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
              const row = toRewardDisplayRows([{ entry: conversion.converted, source: "campaign-drop", rarity: "common" }])[0];
              return (
                <li
                  key={`${conversion.collectibleType}-${conversion.collectibleId}-${index}`}
                  className="battle-reward-summary__conversion"
                  style={{ "--reveal-index": index } as CSSProperties}
                >
                  <span className="battle-reward-summary__conversion-text">
                    Duplicate {conversion.collectibleType} converted
                  </span>
                  {row ? (
                    <span className="battle-reward-summary__conversion-result">
                      <img src={row.icon} alt="" />
                      {row.displayName}
                      {row.amount !== null ? ` ×${row.amount.toLocaleString()}` : ""}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </NeonPanel>
  );
}