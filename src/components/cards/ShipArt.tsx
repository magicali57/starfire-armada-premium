import { useState } from "react";
import type { ShipDefinition } from "@/types";
import "./ShipArt.css";

interface ShipArtProps {
  ship: ShipDefinition;
  size?: "sm" | "md" | "lg";
  /** "hero" = large dramatic presentation (Home, Ship Upgrade).
   *  "roster" = compact card art (Ship Selection grid + detail panel). */
  variant?: "hero" | "roster";
  animated?: boolean;
}

/**
 * Ship art slot with a built-in fallback: renders the real production sprite
 * for the given variant if one exists in ship data, falls back to the other
 * variant's art if that's missing, and finally falls back to a themed glyph
 * so a missing or broken image file never breaks a card or screen. See
 * docs/audit "Artwork handling" — no rarity frames or dashboard chrome is
 * baked into this, it's pure ship-colored gradient + image/icon.
 */
export function ShipArt({ ship, size = "md", variant = "roster", animated = false }: ShipArtProps) {
  const primary = variant === "hero" ? ship.artwork.hangarSprite : ship.artwork.rosterIcon;
  const secondary = variant === "hero" ? ship.artwork.rosterIcon : ship.artwork.hangarSprite;
  const spriteSrc = primary ?? secondary;
  const [imageFailed, setImageFailed] = useState(false);

  const showImage = !!spriteSrc && !imageFailed;

  return (
    <div
      className={`ship-art ship-art--${size}${animated ? " ship-art--animated" : ""}`}
      style={{ ["--ship-theme-color" as string]: ship.themeColor }}
    >
      <div className="ship-art__glow" aria-hidden="true" />
      {showImage ? (
        <img
          src={spriteSrc}
          alt={ship.name}
          className="ship-art__sprite"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="ship-art__icon" aria-hidden="true">
          {ship.artwork.icon}
        </span>
      )}
    </div>
  );
}
