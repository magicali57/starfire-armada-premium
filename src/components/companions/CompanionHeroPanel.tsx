import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { CompanionRosterItem } from "@/data/companionRoster";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import { COMPANION_FILTER_COLOR_VAR, COMPANION_FILTER_ICON } from "./companionRoleStyle";
import "./CompanionHeroPanel.css";

interface CompanionHeroPanelProps {
  companion: CompanionRosterItem;
  onDetails: () => void;
  onEquip: () => void;
}

/**
 * Featured/focused companion panel (17_Companions_Roster.png's hero
 * region, between the title and the filter row) — not one of the task
 * prompt's own suggested component names, but required by direct bitmap
 * inspection: the reference shows a large art+stats panel with rarity
 * pill, Level x/20 with a fill bar, Rank stars x/5, Power, and DETAILS +
 * EQUIP buttons, structurally identical in spirit to Fleet Roster's own
 * FleetFeaturedPanel (same "focused item + Equip" pattern already
 * approved for this project). Disclosed as an intentional addition beyond
 * the task's suggested file list — see the completion report.
 */
export function CompanionHeroPanel({ companion, onDetails, onEquip }: CompanionHeroPanelProps) {
  const levelPct = Math.min(100, Math.round((companion.level / companion.maxLevel) * 100));

  return (
    <div className="companion-hero-panel glass-panel">
      <div className="companion-hero-panel__top">
        <div className="companion-hero-panel__art">
          {companion.artwork ? <img src={companion.artwork} alt="" /> : null}
        </div>

        <div className="companion-hero-panel__info">
          <span
            className="companion-hero-panel__rarity-pill"
            style={{ color: rarityColorVar(companion.rarity), borderColor: rarityColorVar(companion.rarity) }}
          >
            {RARITY_LABEL[companion.rarity].toUpperCase()}
          </span>
          <h2 className="companion-hero-panel__name">{companion.name}</h2>
          <span
            className="companion-hero-panel__role-row"
            style={{ color: COMPANION_FILTER_COLOR_VAR[companion.roleFilterKey] }}
          >
            <BattleModeIcon variant={COMPANION_FILTER_ICON[companion.roleFilterKey]} size={14} />
            {companion.roleDisplayLabel.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="companion-hero-panel__stats">
        <div className="companion-hero-panel__stat-block">
          <span className="companion-hero-panel__stat-label">Level</span>
          <strong className="companion-hero-panel__stat-value">
            {companion.level} <small>/ {companion.maxLevel}</small>
          </strong>
          <span className="companion-hero-panel__progress-track">
            <i style={{ width: `${levelPct}%` }} />
          </span>
        </div>

        <div className="companion-hero-panel__stat-block">
          <span className="companion-hero-panel__stat-label">Rank</span>
          <span className="companion-hero-panel__stars">
            {Array.from({ length: companion.maxRank }).map((_, i) => (
              <BattleModeIcon
                key={i}
                variant="star"
                size={15}
                className={
                  i < companion.rank
                    ? "companion-hero-panel__star companion-hero-panel__star--filled"
                    : "companion-hero-panel__star"
                }
              />
            ))}
            <small>
              {companion.rank}/{companion.maxRank}
            </small>
          </span>
        </div>

        <div className="companion-hero-panel__stat-block">
          <span className="companion-hero-panel__stat-label">Power</span>
          <span className="companion-hero-panel__power">
            <img src={RESOURCE_ICON.power} alt="" />
            {companion.power.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="companion-hero-panel__actions">
        <SecondaryButton onClick={onDetails}>Details</SecondaryButton>
        {companion.equipped ? (
          <PrimaryButton disabled aria-label="Already equipped">
            Equipped
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={onEquip} disabled={!companion.owned}>
            Equip
          </PrimaryButton>
        )}
      </div>
    </div>
  );
}
