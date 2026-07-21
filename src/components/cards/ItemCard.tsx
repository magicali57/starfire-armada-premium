import type { ReactNode } from "react";
import { RarityFrame } from "./RarityFrame";
import type { ShipRarity } from "@/types";
import "./ItemCard.css";

interface ItemCardProps {
  title: string;
  subtitle?: string;
  rarity?: ShipRarity;
  locked?: boolean;
  media: ReactNode;
  onSelect?: () => void;
}

export function ItemCard({ title, subtitle, rarity, locked, media, onSelect }: ItemCardProps) {
  const body = (
    <div className="item-card__media" aria-hidden={locked ? "true" : undefined}>
      {media}
      {locked ? <div className="item-card__lock">🔒</div> : null}
    </div>
  );

  return (
    <button
      type="button"
      className={`item-card press-scale${locked ? " item-card--locked" : ""}`}
      onClick={onSelect}
      disabled={!onSelect}
    >
      {rarity ? <RarityFrame rarity={rarity}>{body}</RarityFrame> : body}
      <span className="item-card__title">{title}</span>
      {subtitle ? <span className="item-card__subtitle">{subtitle}</span> : null}
    </button>
  );
}
