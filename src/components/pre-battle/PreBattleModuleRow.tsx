import { SSS_EMBLEM_RESERVED } from "@/data/assetRegistry";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { PreBattleModuleSlot } from "@/data/preBattle";
import "./PreBattleModuleRow.css";

interface PreBattleModuleRowProps {
  module: PreBattleModuleSlot;
  art: string;
  /** Forward-compatible, unused by Stage 7 — the reference shows all 3
   *  module slots filled, same forward-compatible-but-unused pattern
   *  `StageObjectiveRow`'s `completed` prop and `StageLoadoutPanel`'s
   *  optional fields already established. */
  locked?: boolean;
  onSelect: () => void;
}

/** One MODULES row (Core / Plating / System) — icon, slot label, name,
 *  level, rarity. A real button, taps open an informational modal, same
 *  convention as every other tap in this flow. */
export function PreBattleModuleRow({ module, art, locked, onSelect }: PreBattleModuleRowProps) {
  return (
    <button
      type="button"
      className={`pre-battle-module-row press-scale${locked ? " pre-battle-module-row--locked" : ""}`}
      onClick={onSelect}
    >
      <span className="pre-battle-module-row__icon-wrap">
        {locked ? (
          <BattleModeIcon variant="lock" size={16} style={{ color: "var(--color-text-muted)" }} />
        ) : (
          <img className="pre-battle-module-row__icon" src={art} alt="" />
        )}
      </span>
      <span className="pre-battle-module-row__content">
        <span className="pre-battle-module-row__slot">{module.slotLabel}</span>
        <span className="pre-battle-module-row__name">{module.name}</span>
      </span>
      <span className="pre-battle-module-row__meta">
        <span className="pre-battle-module-row__level">Lv. {module.level}</span>
        <span className="pre-battle-module-row__rarity">
          <img src={SSS_EMBLEM_RESERVED} alt="" />
          {module.rarityLabel}
        </span>
      </span>
    </button>
  );
}
