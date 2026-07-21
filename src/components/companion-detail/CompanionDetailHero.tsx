import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { CompanionDetailViewModel } from "@/data/companionDetail";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import { COMPANION_FILTER_COLOR_VAR, COMPANION_FILTER_ICON } from "@/components/companions/companionRoleStyle";
import "./CompanionDetailHero.css";

interface CompanionDetailHeroProps {
  companion: CompanionDetailViewModel;
  onEquip: () => void;
  onAcquireInfo: () => void;
  onRankInfo: () => void;
}

/**
 * Identity/hero panel (18_Companion_Detail.png's single bordered box:
 * "COMPANION" pill, name, rarity, a 5-star row, art, role, Power, Level/
 * Rank readout, and the primary action button). Kept as one component
 * rather than split into a separate "Identity" file — the reference
 * renders this as one cohesive bordered region, and splitting it further
 * would fragment one visual unit without a real benefit (disclosed in the
 * completion report).
 *
 * The star row directly under the rarity label and the later numeric
 * "RANK x/5" readout both represent the SAME real `rank` value — the
 * reference shows rank twice, once as stars near the portrait and once as
 * a labeled numeric readout, exactly like Companions Roster's own cards
 * already show rank as a star row. No second "rarity stars" data field
 * was invented for this.
 */
export function CompanionDetailHero({ companion, onEquip, onAcquireInfo, onRankInfo }: CompanionDetailHeroProps) {
  const locked = !companion.owned;
  const levelPct = Math.min(100, Math.round((companion.level / companion.maxLevel) * 100));

  return (
    <div className="companion-detail-hero glass-panel">
      <span className="companion-detail-hero__pill">Companion</span>

      <div className="companion-detail-hero__top">
        <div className="companion-detail-hero__identity">
          <h2 className="companion-detail-hero__name">{companion.name}</h2>
          <span
            className="companion-detail-hero__rarity"
            style={{ color: rarityColorVar(companion.rarity) }}
          >
            {RARITY_LABEL[companion.rarity]}
          </span>
          <span className="companion-detail-hero__stars" aria-label={`Rank ${companion.rank} of ${companion.maxRank}`}>
            {Array.from({ length: companion.maxRank }).map((_, i) => (
              <BattleModeIcon
                key={i}
                variant="star"
                size={16}
                className={
                  i < companion.rank
                    ? "companion-detail-hero__star companion-detail-hero__star--filled"
                    : "companion-detail-hero__star"
                }
              />
            ))}
          </span>
        </div>

        <div className="companion-detail-hero__art">
          {companion.artwork ? (
            <img
              src={companion.artwork}
              alt={companion.name}
              className={locked ? "companion-detail-hero__art-img--locked" : undefined}
            />
          ) : null}
          {locked ? (
            <span className="companion-detail-hero__lock-overlay" aria-hidden="true">
              <BattleModeIcon variant="lock" size={30} />
            </span>
          ) : null}
        </div>
      </div>

      <div className="companion-detail-hero__stat-block">
        <span className="companion-detail-hero__stat-label">Role</span>
        <span
          className="companion-detail-hero__role-row"
          style={{ color: COMPANION_FILTER_COLOR_VAR[companion.roleFilterKey] }}
        >
          <BattleModeIcon variant={COMPANION_FILTER_ICON[companion.roleFilterKey]} size={16} />
          {companion.roleLabel.toUpperCase()}
        </span>
      </div>

      <div className="companion-detail-hero__stat-block">
        <span className="companion-detail-hero__stat-label">Power</span>
        <span className="companion-detail-hero__power">
          <img src={RESOURCE_ICON.power} alt="" />
          {companion.power.toLocaleString()}
        </span>
      </div>

      <div className="companion-detail-hero__level-rank-row">
        <div className="companion-detail-hero__level">
          <span className="companion-detail-hero__stat-label">Level</span>
          <strong>
            {companion.level} <small>/ {companion.maxLevel}</small>
          </strong>
          <span className="companion-detail-hero__progress-track">
            <i style={{ width: `${levelPct}%` }} />
          </span>
        </div>
        <div className="companion-detail-hero__rank">
          <span className="companion-detail-hero__stat-label">Rank</span>
          <span className="companion-detail-hero__rank-value">
            <BattleModeIcon variant="chevron" size={14} style={{ transform: "rotate(-90deg)" }} />
            {companion.rank} <small>/ {companion.maxRank}</small>
            <button
              type="button"
              className="companion-detail-hero__rank-info press-scale"
              onClick={onRankInfo}
              aria-label="Rank information"
            >
              <BattleModeIcon variant="info" size={12} />
            </button>
          </span>
        </div>
      </div>

      <div className="companion-detail-hero__action">
        {locked ? (
          <PrimaryButton onClick={onAcquireInfo} fullWidth>
            How to Acquire
          </PrimaryButton>
        ) : companion.equipped ? (
          <PrimaryButton disabled fullWidth aria-label="Already equipped">
            Equipped
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={onEquip} fullWidth>
            Equip
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
