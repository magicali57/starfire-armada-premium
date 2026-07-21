import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { getShipMasterArt, MATERIAL_ICON } from "@/data/assetRegistry";
import type { ShipDetailFragments, ShipDetailSkin } from "@/data/shipDetail";
import "./ShipDetailFragmentsSkinRow.css";

interface ShipDetailFragmentsSkinRowProps {
  shipId: string;
  fragments: ShipDetailFragments;
  skin: ShipDetailSkin;
  onFindFragments: () => void;
  onChangeSkin: () => void;
}

/**
 * Reproduces the reference's two-panel Fragments / Equipped Skin row.
 * Fragments reuses the already-registered MATERIAL_ICON.shipFragment asset.
 * The Skin panel has no dedicated skin-art assets anywhere in the registry,
 * so it uses the ship's own master art as a temporary thumbnail (disclosed
 * substitution) for the one reference-matched ship's "Void Hunter" skin;
 * every other ship shows a generic "No Skin Equipped" state rather than an
 * invented skin name, since no real per-ship skin system exists yet.
 */
export function ShipDetailFragmentsSkinRow({
  shipId,
  fragments,
  skin,
  onFindFragments,
  onChangeSkin,
}: ShipDetailFragmentsSkinRowProps) {
  const art = getShipMasterArt(shipId);

  return (
    <div className="ship-detail-frag-skin">
      <div className="ship-detail-frag-skin__panel">
        <span className="ship-detail-frag-skin__heading">Fragments</span>
        <div className="ship-detail-frag-skin__frag-body">
          <img className="ship-detail-frag-skin__frag-icon" src={MATERIAL_ICON.shipFragment} alt="" />
          <div className="ship-detail-frag-skin__frag-copy">
            <span className="ship-detail-frag-skin__frag-count">
              {fragments.current} <small>/ {fragments.max}</small>
            </span>
            <p className="ship-detail-frag-skin__frag-helper">
              Collect fragments to unlock Star Rank and improve your ship.
            </p>
          </div>
        </div>
        <SecondaryButton fullWidth onClick={onFindFragments}>
          Find Fragments
        </SecondaryButton>
      </div>

      <div className="ship-detail-frag-skin__panel">
        <span className="ship-detail-frag-skin__heading">Equipped Skin</span>
        <div className="ship-detail-frag-skin__skin-body">
          <div className="ship-detail-frag-skin__skin-thumb">
            {art ? <img src={art} alt="" /> : null}
          </div>
          <div className="ship-detail-frag-skin__skin-copy">
            {skin.equipped ? (
              <>
                <span className="ship-detail-frag-skin__skin-name">{skin.name}</span>
                <span className="ship-detail-frag-skin__skin-rarity">{skin.rarityLabel}</span>
                <span className="ship-detail-frag-skin__skin-bonus">{skin.bonusLabel}</span>
              </>
            ) : (
              <span className="ship-detail-frag-skin__skin-empty">No Skin Equipped</span>
            )}
          </div>
        </div>
        <SecondaryButton fullWidth onClick={onChangeSkin}>
          Change Skin
        </SecondaryButton>
      </div>
    </div>
  );
}
