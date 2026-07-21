import { BattleModeIcon, type BattleModeIconVariant } from "@/components/icons/BattleModeIcon";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import "./ShipDetailAbilityCard.css";

export type ShipDetailAbilityVariant = "signature" | "passive" | "calamity";

interface ShipDetailAbilityCardProps {
  variant: ShipDetailAbilityVariant;
  name: string;
  description: string;
  /** Omitted for the compact Signature Attack summary, which has no
   *  progression level of its own in this task (no upgrade logic). */
  levelCurrent?: number;
  levelMax?: number;
  locked: boolean;
  onUpgrade?: () => void;
}

const VARIANT_CONFIG: Record<
  ShipDetailAbilityVariant,
  { pillLabel: string; icon: BattleModeIconVariant; levelLabel: string; showInfo: boolean }
> = {
  // No dedicated per-ability icon assets exist anywhere in assetRegistry.ts
  // (MATERIAL_ICON/SLOT_ICON/UTILITY_ICON don't cover this) — each variant
  // reuses an existing BattleModeIcon glyph as a themed coded stand-in,
  // same disclosed-substitution approach Fleet Roster's ability-tier
  // badges already use. "target" (signature attack's homing/seeking
  // theme), "search" (passive's tracking/lock theme), "skull" (calamity's
  // danger theme). "Signature Attack" is the ship's own built-in attack —
  // a separate concept from the Arsenal's external weapons, so this card
  // shows no weapon level and no upgrade action.
  signature: { pillLabel: "Signature Attack", icon: "target", levelLabel: "", showInfo: false },
  passive: { pillLabel: "Passive Ability", icon: "search", levelLabel: "Level", showInfo: false },
  calamity: { pillLabel: "Calamity Ability", icon: "skull", levelLabel: "Level", showInfo: true },
};

/**
 * One reusable ability-card layout for all three cards
 * 09_Ship_Detail_Overview.png shows (Intrinsic Weapon / Passive Ability /
 * Calamity Ability) — identical structure across all three in the
 * reference, varying only by pill label/level label and whether the info
 * glyph shows (Calamity only). Upgrade always opens an informational modal
 * this round (owned: "coming soon"; locked: unlock requirement) — real
 * per-ability upgrading is explicitly out of scope.
 */
export function ShipDetailAbilityCard({
  variant,
  name,
  description,
  levelCurrent,
  levelMax,
  locked,
  onUpgrade,
}: ShipDetailAbilityCardProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div className={`ship-detail-ability-card ship-detail-ability-card--${variant}`}>
      <span className="ship-detail-ability-card__pill">{config.pillLabel}</span>

      <div className="ship-detail-ability-card__body">
        <span className="ship-detail-ability-card__icon">
          <BattleModeIcon variant={config.icon} size={22} />
        </span>

        <div className="ship-detail-ability-card__copy">
          <h3 className="ship-detail-ability-card__name">{name}</h3>
          <p className="ship-detail-ability-card__description">{description}</p>
        </div>

        {levelCurrent !== undefined && levelMax !== undefined && onUpgrade ? (
          <div className="ship-detail-ability-card__side">
            <span className="ship-detail-ability-card__level">
              {config.levelLabel}
              {config.showInfo ? <BattleModeIcon variant="info" size={12} /> : null}
              <b>
                {levelCurrent}
                <small>/ {levelMax}</small>
              </b>
            </span>
            <SecondaryButton className="ship-detail-ability-card__upgrade" onClick={onUpgrade}>
              {locked ? <BattleModeIcon variant="lock" size={13} /> : null}
              {locked ? "Locked" : "Upgrade"}
            </SecondaryButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}
