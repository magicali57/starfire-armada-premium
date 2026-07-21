import type { ReactNode } from "react";
import type { ShipRarity } from "@/types";
import { RARITY_LABEL } from "@/utils/rarity";
import "./RarityFrame.css";

interface RarityFrameProps {
  rarity: ShipRarity;
  children: ReactNode;
}

export function RarityFrame({ rarity, children }: RarityFrameProps) {
  return (
    <div className={`rarity-frame rarity-frame--${rarity}`}>
      <div className="rarity-frame__content">{children}</div>
      <span className="rarity-frame__label">{RARITY_LABEL[rarity]}</span>
    </div>
  );
}
