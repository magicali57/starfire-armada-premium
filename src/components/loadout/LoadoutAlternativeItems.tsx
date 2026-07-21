import { useMemo, useState } from "react";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { UTILITY_ICON } from "@/data/assetRegistry";
import type { LoadoutAlternativeItem, LoadoutCategory } from "@/data/loadout";
import { RARITY_ORDER } from "@/utils/rarity";
import { LoadoutItemCard } from "./LoadoutItemCard";
import "./LoadoutAlternativeItems.css";

interface LoadoutAlternativeItemsProps {
  category: LoadoutCategory;
  onCategoryChange: (category: LoadoutCategory) => void;
  items: LoadoutAlternativeItem[];
  onSelectItem: (item: LoadoutAlternativeItem) => void;
  onInfoItem: (item: LoadoutAlternativeItem) => void;
  /** Present only when the active slot is a clearable companion/module slot
   *  (never for "ship" — the selected ship can never be cleared). */
  onClearSlot?: () => void;
}

const CATEGORY_OPTIONS: { value: LoadoutCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ships", label: "Ships" },
  { value: "companions", label: "Companions" },
  { value: "core", label: "Core" },
  { value: "plating", label: "Plating" },
  { value: "system", label: "System" },
];

type SortMode = "default" | "power" | "level" | "rarity";

/**
 * "Alternative Items" section — category selector (a real, accessible
 * `<select>` rather than a custom widget, so it works with narrow phones
 * and keyboards alike), an optional lightweight Filter popover (Owned
 * only / sort order — deliberately small, not a full Inventory Hub), and
 * the horizontally-scrolling card row. Only this row scrolls horizontally
 * (`overflow-x: auto` scoped to `.loadout-alt-items__scroller` in the CSS)
 * — the page itself never gains a horizontal scrollbar.
 *
 * "Owned only" defaults to enabled, per spec, since ownership is prototype
 * -only right now (every companion/module is owned by default — see
 * data/player.ts) and locked ships are still meaningful to show (tapping
 * one previews/opens Fleet Roster), so the default only hides genuinely
 * unobtainable items rather than hiding real prototype content.
 */
export function LoadoutAlternativeItems({
  category,
  onCategoryChange,
  items,
  onSelectItem,
  onInfoItem,
  onClearSlot,
}: LoadoutAlternativeItemsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [ownedOnly, setOwnedOnly] = useState(true);
  const [sortMode, setSortMode] = useState<SortMode>("default");

  const visibleItems = useMemo(() => {
    let list = items;
    if (ownedOnly) {
      list = list.filter((item) => !item.locked);
    }
    if (sortMode === "power") {
      list = [...list].sort((a, b) => b.power - a.power);
    } else if (sortMode === "level") {
      list = [...list].sort((a, b) => b.level - a.level);
    } else if (sortMode === "rarity") {
      list = [...list].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));
    }
    return list;
  }, [items, ownedOnly, sortMode]);

  return (
    <div className="loadout-alt-items glass-panel">
      <div className="loadout-alt-items__header">
        <h3 className="loadout-alt-items__heading">Alternative Items</h3>
        <div className="loadout-alt-items__controls">
          <label className="loadout-alt-items__category-label">
            <span className="visually-hidden">Category</span>
            <select
              className="loadout-alt-items__category-select"
              value={category}
              onChange={(event) => onCategoryChange(event.target.value as LoadoutCategory)}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="loadout-alt-items__filter-btn press-scale"
            aria-label="Filter alternative items"
            aria-expanded={showFilters}
            onClick={() => setShowFilters((v) => !v)}
          >
            <img src={UTILITY_ICON.filter} alt="" />
          </button>
        </div>
      </div>

      {onClearSlot ? (
        <button type="button" className="loadout-alt-items__clear-slot press-scale" onClick={onClearSlot}>
          Clear Slot
        </button>
      ) : null}

      {showFilters ? (
        <div className="loadout-alt-items__filter-panel">
          <label className="loadout-alt-items__filter-row">
            <input
              type="checkbox"
              checked={ownedOnly}
              onChange={(event) => setOwnedOnly(event.target.checked)}
            />
            Owned only
          </label>
          <label className="loadout-alt-items__filter-row">
            Sort
            <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)}>
              <option value="default">Default</option>
              <option value="power">Power</option>
              <option value="level">Level</option>
              <option value="rarity">Rarity</option>
            </select>
          </label>
        </div>
      ) : null}

      {visibleItems.length === 0 ? (
        <p className="loadout-alt-items__empty">
          <BattleModeIcon variant="info" size={14} /> No items match this filter.
        </p>
      ) : (
        <div className="loadout-alt-items__scroller">
          {visibleItems.map((item) => (
            <LoadoutItemCard
              key={`${item.kind}-${item.id}`}
              item={item}
              onSelect={() => onSelectItem(item)}
              onInfo={() => onInfoItem(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
