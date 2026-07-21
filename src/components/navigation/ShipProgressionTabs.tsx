import { BattleModeIcon, type BattleModeIconVariant } from "@/components/icons/BattleModeIcon";
import "./ShipProgressionTabs.css";

export type ShipProgressionTab = "level-up" | "star-rank" | "abilities" | "skins";

interface ShipProgressionTabsProps {
  /** The ship this progression nav belongs to — kept on the component so
   *  future tab destinations can carry the id without changing call sites. */
  shipId: string;
  /** Which tab (if any) represents the current screen. Ship Detail passes
   *  null (it is the overview hub, not one of the four tabs). */
  activeTab: ShipProgressionTab | null;
  /** Optional truthful actionable-state badges — only set a key when the
   *  caller can actually determine the action is available right now. */
  badges?: Partial<Record<ShipProgressionTab, boolean>>;
  onSelect: (tab: ShipProgressionTab) => void;
}

const TABS: { id: ShipProgressionTab; label: string; icon: BattleModeIconVariant }[] = [
  { id: "level-up", label: "Level Up", icon: "check" },
  { id: "star-rank", label: "Star Rank", icon: "star" },
  { id: "abilities", label: "Abilities", icon: "shield" },
  { id: "skins", label: "Skins", icon: "search" },
];

/**
 * Shared four-tab ship progression navigation (LEVEL UP | STAR RANK |
 * ABILITIES | SKINS), reused by Ship Detail Overview and Ship Level Up so
 * the markup is defined exactly once. Replaces Ship Detail's old
 * five-button action row (the Weapon action moved to the Arsenal system
 * and no longer appears here). Four equal columns fit at 360px; labels use
 * a readable fixed size with ellipsis as a safety net only.
 */
export function ShipProgressionTabs({ shipId, activeTab, badges, onSelect }: ShipProgressionTabsProps) {
  return (
    <nav className="ship-progression-tabs" aria-label="Ship progression" data-ship-id={shipId}>
      {TABS.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            className={
              active
                ? "ship-progression-tabs__tab ship-progression-tabs__tab--active"
                : "ship-progression-tabs__tab press-scale"
            }
            aria-current={active ? "page" : undefined}
            onClick={() => onSelect(tab.id)}
          >
            {badges?.[tab.id] ? <b className="ship-progression-tabs__badge">!</b> : null}
            <BattleModeIcon variant={tab.icon} size={20} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
