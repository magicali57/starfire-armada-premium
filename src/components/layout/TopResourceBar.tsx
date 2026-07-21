import { PlayerProfileChip } from "./PlayerProfileChip";
import type { CurrencyBalances, CurrencyId } from "@/types";
import "./TopResourceBar.css";

interface TopResourceBarProps {
  displayName: string;
  level: number;
  currencies: CurrencyBalances;
}

// Explicit display order (matches the reference dashboards: energy, coins,
// crystals) rather than relying on object key insertion order.
const CURRENCY_ORDER: CurrencyId[] = ["energy", "coins", "crystals"];

const CURRENCY_ICON: Record<CurrencyId, string> = {
  energy: "⚡",
  coins: "◈",
  crystals: "◆",
};

const CURRENCY_LABEL: Record<CurrencyId, string> = {
  energy: "Energy",
  coins: "Coins",
  crystals: "Crystals",
};

export function TopResourceBar({ displayName, level, currencies }: TopResourceBarProps) {
  return (
    <div className="top-resource-bar">
      <PlayerProfileChip displayName={displayName} level={level} />
      <div className="top-resource-bar__currencies">
        {CURRENCY_ORDER.map((id) => (
          <div className="top-resource-bar__currency" key={id}>
            <span className="top-resource-bar__icon" aria-hidden="true">
              {CURRENCY_ICON[id]}
            </span>
            <span className="visually-hidden">{CURRENCY_LABEL[id]}</span>
            <span>{currencies[id].toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
