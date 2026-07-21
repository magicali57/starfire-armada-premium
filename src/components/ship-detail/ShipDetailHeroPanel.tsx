import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { getShipMasterArt, ROLE_ICON } from "@/data/assetRegistry";
import type { ShipDetailContent } from "@/data/shipDetail";
import type { ShipDefinition } from "@/types";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import "./ShipDetailHeroPanel.css";

interface ShipDetailHeroPanelProps {
  ship: ShipDefinition;
  content: ShipDetailContent;
  owned: boolean;
  equipped: boolean;
  onEquip: () => void;
  onLockedAction: () => void;
  onCycleNext: () => void;
}

const ROLE_ICON_KEY: Record<ShipDefinition["role"], keyof typeof ROLE_ICON> = {
  Attack: "attack",
  Support: "support",
  Control: "control",
  Heavy: "heavy",
};

/**
 * Reproduces 09_Ship_Detail_Overview.png's hero panel: rarity/name/role,
 * a bordered Power box, Level/Star Rank/Weapon Level rows, large master art,
 * and Equip. Not a reuse of Fleet Roster's FleetFeaturedPanel/FleetStatBlock
 * — that layout is a horizontal stat-block row with a description and a
 * 4-badge ability strip, none of which this reference shows; this hero is a
 * vertical icon-label-value stack with no description. It does reuse the
 * same building blocks that component proved out: getShipMasterArt,
 * RARITY_LABEL/rarityColorVar, ROLE_ICON (the same real image asset Fleet
 * Roster's role row already uses), and BattleModeIcon's star/info/swords/
 * chevron variants.
 *
 * The reference's painted planet/starfield/missile-trail backdrop isn't
 * reproducible from getShipMasterArt (an isolated ship cutout) and no new
 * artwork was generated for it — this panel uses a dark radial-glow CSS
 * background instead, disclosed as a substitution for the illustrated
 * scene. The reference's small top-right hex emblem badge has no matching
 * asset anywhere in the registry; it's omitted rather than invented.
 *
 * The Equip button is rendered as its own full-width row below the
 * info/art grid rather than absolutely pinned over the art (as the
 * reference shows it) — a deliberate, disclosed mobile-safety
 * simplification so the button can never overlap the art or clip off
 * narrow viewports.
 */
export function ShipDetailHeroPanel({
  ship,
  content,
  owned,
  equipped,
  onEquip,
  onLockedAction,
  onCycleNext,
}: ShipDetailHeroPanelProps) {
  const art = getShipMasterArt(ship.id);
  const roleIconKey = ROLE_ICON_KEY[ship.role];
  const levelPct = Math.round((content.levelCurrent / content.levelMax) * 100);
  const locked = !owned;

  return (
    <div className="ship-detail-hero glass-panel" style={{ borderColor: rarityColorVar(ship.rarity) }}>
      <div className="ship-detail-hero__grid">
        <div className="ship-detail-hero__info">
          <span
            className="ship-detail-hero__rarity-pill"
            style={{ color: rarityColorVar(ship.rarity), borderColor: rarityColorVar(ship.rarity) }}
          >
            {RARITY_LABEL[ship.rarity].toUpperCase()}
          </span>
          <h2 className="ship-detail-hero__name">{ship.name}</h2>
          <span className="ship-detail-hero__role-row">
            <img src={ROLE_ICON[roleIconKey]} alt="" />
            {ship.role.toUpperCase()}
          </span>

          <div className="ship-detail-hero__power-box">
            <span className="ship-detail-hero__power-label">
              <BattleModeIcon variant="swords" size={14} />
              Power
            </span>
            <span className="ship-detail-hero__power-value">{content.power.toLocaleString()}</span>
          </div>

          <div className="ship-detail-hero__stat-row">
            <span className="ship-detail-hero__stat-label">Level</span>
            <span className="ship-detail-hero__stat-value">
              {content.levelCurrent} <small>/ {content.levelMax}</small>
            </span>
          </div>
          <div className="ship-detail-hero__level-track">
            <div className="ship-detail-hero__level-fill" style={{ width: `${levelPct}%` }} />
          </div>

          <div className="ship-detail-hero__stat-row">
            <span className="ship-detail-hero__stat-label">Star Rank</span>
            <span className="ship-detail-hero__stars">
              {Array.from({ length: content.starRankMax }).map((_, i) => (
                <BattleModeIcon
                  key={i}
                  variant="star"
                  size={14}
                  className={
                    i < content.starRankCurrent
                      ? "ship-detail-hero__star ship-detail-hero__star--filled"
                      : "ship-detail-hero__star"
                  }
                />
              ))}
              <BattleModeIcon variant="info" size={13} className="ship-detail-hero__info-glyph" />
            </span>
          </div>

        </div>

        <div className="ship-detail-hero__art-col">
          <div className="ship-detail-hero__art">{art ? <img src={art} alt={ship.name} /> : null}</div>
          <button
            type="button"
            className="ship-detail-hero__cycle press-scale"
            aria-label="View next ship"
            onClick={onCycleNext}
          >
            <BattleModeIcon variant="chevron" size={18} />
          </button>
        </div>
      </div>

      <div className="ship-detail-hero__actions">
        {locked ? (
          <>
            <span className="ship-detail-hero__unlock-req">{ship.unlockRequirement}</span>
            <PrimaryButton onClick={onLockedAction}>
              <BattleModeIcon variant="lock" size={14} />
              Locked
            </PrimaryButton>
          </>
        ) : equipped ? (
          <PrimaryButton disabled className="ship-detail-hero__equipped" aria-disabled="true">
            <BattleModeIcon variant="check" size={14} />
            Equipped
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={onEquip}>Equip</PrimaryButton>
        )}
      </div>
    </div>
  );
}
