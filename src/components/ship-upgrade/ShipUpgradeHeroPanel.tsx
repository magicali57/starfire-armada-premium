import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RARITY_EMBLEM, ROLE_ICON, RESOURCE_ICON, getShipMasterArt } from "@/data/assetRegistry";
import type { ShipUpgradeXpDisplay } from "@/data/shipUpgrade";
import type { ShipDefinition } from "@/types";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import "./ShipUpgradeHeroPanel.css";

interface ShipUpgradeHeroPanelProps {
  ship: ShipDefinition;
  currentLevel: number;
  nextLevel: number | null;
  maxLevel: number;
  currentPower: number;
  xp: ShipUpgradeXpDisplay;
  atMaxLevel: boolean;
}

const ROLE_ICON_KEY: Record<ShipDefinition["role"], keyof typeof ROLE_ICON> = {
  Attack: "attack",
  Support: "support",
  Control: "control",
  Heavy: "heavy",
};

/**
 * Large purple presentation panel, reproducing 11_Ship_Level_Up.png's hero
 * section: rarity/name/role, POWER, master artwork, rarity emblem, current
 * vs. next level with a direction chevron, and the Ship XP bar.
 *
 * Same disclosed substitution ShipDetailHeroPanel already established for
 * this exact reference set: the illustrated planet/starfield/missile-trail
 * backdrop behind the reference's ship art isn't reproducible from
 * getShipMasterArt (an isolated cutout, no scene), so this panel uses a
 * dark radial-glow CSS background instead and lays the info column and art
 * column out side by side rather than diagonally overlapping — the same
 * mobile-safe simplification, for the same reason (object-fit: contain
 * artwork must never overlap the level/XP controls beneath it).
 */
export function ShipUpgradeHeroPanel({
  ship,
  currentLevel,
  nextLevel,
  maxLevel,
  currentPower,
  xp,
  atMaxLevel,
}: ShipUpgradeHeroPanelProps) {
  const art = getShipMasterArt(ship.id);
  const roleIconKey = ROLE_ICON_KEY[ship.role];

  return (
    <div className="ship-upgrade-hero glass-panel" style={{ borderColor: rarityColorVar(ship.rarity) }}>
      <div className="ship-upgrade-hero__grid">
        <div className="ship-upgrade-hero__info">
          <span
            className="ship-upgrade-hero__rarity-pill"
            style={{ color: rarityColorVar(ship.rarity), borderColor: rarityColorVar(ship.rarity) }}
          >
            {RARITY_LABEL[ship.rarity].toUpperCase()}
          </span>
          <h2 className="ship-upgrade-hero__name">{ship.name}</h2>
          <span className="ship-upgrade-hero__role-row">
            <img src={ROLE_ICON[roleIconKey]} alt="" />
            {ship.role.toUpperCase()}
          </span>

          <div className="ship-upgrade-hero__power-box">
            <span className="ship-upgrade-hero__power-label">
              <img src={RESOURCE_ICON.power} alt="" />
              Power
            </span>
            <span className="ship-upgrade-hero__power-value">{currentPower.toLocaleString()}</span>
          </div>
        </div>

        <div className="ship-upgrade-hero__art-col">
          <div className="ship-upgrade-hero__art">
            {art ? <img src={art} alt={`${ship.name} artwork`} /> : null}
          </div>
          <img
            className="ship-upgrade-hero__rarity-emblem"
            src={RARITY_EMBLEM[ship.rarity]}
            alt=""
            aria-hidden="true"
          />
        </div>
      </div>

      <div className="ship-upgrade-hero__level-row">
        <div className="ship-upgrade-hero__level-block">
          <span className="ship-upgrade-hero__level-label">Current Level</span>
          <span className="ship-upgrade-hero__level-value">
            {currentLevel} <small>/ {maxLevel}</small>
          </span>
        </div>
        <BattleModeIcon
          variant="chevron"
          size={20}
          className="ship-upgrade-hero__level-chevron"
        />
        <div className="ship-upgrade-hero__level-block ship-upgrade-hero__level-block--next">
          <span className="ship-upgrade-hero__level-label">Next Level</span>
          {atMaxLevel || nextLevel === null ? (
            <span className="ship-upgrade-hero__level-value ship-upgrade-hero__level-value--max">MAX</span>
          ) : (
            <span className="ship-upgrade-hero__level-value ship-upgrade-hero__level-value--next">
              {nextLevel} <small>/ {maxLevel}</small>
            </span>
          )}
        </div>
      </div>

      <div className="ship-upgrade-hero__xp-track" role="progressbar" aria-label="Ship XP" aria-valuenow={xp.pct} aria-valuemin={0} aria-valuemax={100}>
        <div className="ship-upgrade-hero__xp-fill" style={{ width: `${xp.pct}%` }} />
        <span className="ship-upgrade-hero__xp-label">
          {atMaxLevel ? "MAX LEVEL" : `${xp.current.toLocaleString()} / ${xp.requirement.toLocaleString()} XP`}
        </span>
      </div>
    </div>
  );
}
