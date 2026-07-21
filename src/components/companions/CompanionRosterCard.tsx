import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { MATERIAL_ICON, RESOURCE_ICON } from "@/data/assetRegistry";
import type { CompanionRosterItem } from "@/data/companionRoster";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import { COMPANION_FILTER_COLOR_VAR, COMPANION_FILTER_ICON } from "./companionRoleStyle";
import "./CompanionRosterCard.css";

interface CompanionRosterCardProps {
  item: CompanionRosterItem;
  focused: boolean;
  /** Selects this companion into the hero panel — only meaningful (and only
   *  wired) for owned companions; ignored for locked cards. */
  onSelect: () => void;
  /** Opens the informational Companion Detail (owned) or acquisition-info
   *  (locked) modal. A separate control from `onSelect` per the task's own
   *  accessibility requirement that "info buttons must not trigger card
   *  selection" — same dedicated-info-button convention already
   *  established by LoadoutItemCard/LoadoutSlotCard's `__info` button. */
  onInfo: () => void;
  /** Opens the non-transactional "Companion Upgrade coming soon" modal —
   *  only rendered/wired when `item.upgradeReady` is true. */
  onUpgradeInfo: () => void;
}

/**
 * One roster grid card (17_Companions_Roster.png rows 1-3). Real registered
 * assets only: COMPANION_ART (via item.artwork, already resolved),
 * RESOURCE_ICON.power, MATERIAL_ICON.companionData for the rank-progress
 * bar, UTILITY_ICON.lock via BattleModeIcon's "lock" variant for the
 * locked state. Names wrap (never ellipsize) per project convention.
 */
export function CompanionRosterCard({ item, focused, onSelect, onInfo, onUpgradeInfo }: CompanionRosterCardProps) {
  const locked = !item.owned;

  return (
    <div
      className={`companion-roster-card${focused ? " companion-roster-card--focused" : ""}${
        locked ? " companion-roster-card--locked" : ""
      }`}
    >
      {item.equipped ? <span className="companion-roster-card__equipped-ribbon">Equipped</span> : null}

      <button
        type="button"
        className="companion-roster-card__body press-scale"
        onClick={locked ? onInfo : onSelect}
        aria-pressed={focused}
        aria-label={`${item.name}, ${RARITY_LABEL[item.rarity]}${locked ? ", locked" : ""}`}
      >
        <span
          className="companion-roster-card__rarity-pill"
          style={{ color: rarityColorVar(item.rarity), borderColor: rarityColorVar(item.rarity) }}
        >
          {RARITY_LABEL[item.rarity].toUpperCase()}
        </span>

        <div className="companion-roster-card__art">
          {item.artwork ? (
            <img
              src={item.artwork}
              alt=""
              className={locked ? "companion-roster-card__art-img--locked" : undefined}
            />
          ) : null}
          {locked ? (
            <span className="companion-roster-card__lock-overlay" aria-hidden="true">
              <BattleModeIcon variant="lock" size={26} />
            </span>
          ) : null}
        </div>

        <span className="companion-roster-card__name">{item.name}</span>

        {locked ? (
          <span className="companion-roster-card__acquisition-label">
            {item.acquisition?.unlockDescription ?? "Locked"}
          </span>
        ) : (
          <>
            <span
              className="companion-roster-card__role-row"
              style={{ color: COMPANION_FILTER_COLOR_VAR[item.roleFilterKey] }}
            >
              <BattleModeIcon variant={COMPANION_FILTER_ICON[item.roleFilterKey]} size={12} />
              {item.roleDisplayLabel.toUpperCase()}
            </span>

            <span className="companion-roster-card__figures">
              <span>Lv. {item.level}</span>
              <span className="companion-roster-card__power">
                <img src={RESOURCE_ICON.power} alt="" />
                {item.power.toLocaleString()}
              </span>
            </span>

            <span className="companion-roster-card__stars" aria-label={`Rank ${item.rank} of ${item.maxRank}`}>
              {Array.from({ length: item.maxRank }).map((_, i) => (
                <BattleModeIcon
                  key={i}
                  variant="star"
                  size={12}
                  className={
                    i < item.rank
                      ? "companion-roster-card__star companion-roster-card__star--filled"
                      : "companion-roster-card__star"
                  }
                />
              ))}
            </span>
          </>
        )}
      </button>

      {!locked && item.upgradeReady ? (
        <button type="button" className="companion-roster-card__upgrade-banner press-scale" onClick={onUpgradeInfo}>
          Upgrade Ready
          <BattleModeIcon variant="chevron" size={12} style={{ transform: "rotate(-90deg)" }} />
        </button>
      ) : null}

      {!locked && !item.upgradeReady && item.acquisition ? (
        <div className="companion-roster-card__progress-row">
          <img src={MATERIAL_ICON.companionData} alt="" />
          <span>
            {item.acquisition.current}/{item.acquisition.required} RANK
          </span>
          <span className="companion-roster-card__progress-track">
            <i
              style={{
                width: `${Math.round(((item.acquisition.current ?? 0) / (item.acquisition.required ?? 1)) * 100)}%`,
              }}
            />
          </span>
        </div>
      ) : null}

      {locked && item.acquisition ? (
        <div className="companion-roster-card__progress-row companion-roster-card__progress-row--locked">
          <img src={MATERIAL_ICON.companionData} alt="" />
          <span>Locked</span>
        </div>
      ) : null}

      <button
        type="button"
        className="companion-roster-card__info press-scale"
        onClick={onInfo}
        aria-label={`${item.name} info`}
      >
        <BattleModeIcon variant="info" size={12} />
      </button>
    </div>
  );
}
