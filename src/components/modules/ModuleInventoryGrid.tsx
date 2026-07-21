import type { ModuleInventoryItem } from "@/data/moduleInventory";
import { ModuleInventoryCard } from "./ModuleInventoryCard";

interface ModuleInventoryGridProps {
  items: ModuleInventoryItem[];
  selectedId: string | null;
  onSelect: (item: ModuleInventoryItem) => void;
  onDetails: (item: ModuleInventoryItem) => void;
  onResetFilters: () => void;
}

export function ModuleInventoryGrid({ items, selectedId, onSelect, onDetails, onResetFilters }: ModuleInventoryGridProps) {
  if (items.length === 0) {
    return (
      <section className="module-inventory-empty">
        <h2>No Modules Found</h2>
        <p>No modules match the current slot filter.</p>
        <button type="button" onClick={onResetFilters}>Show All Modules</button>
      </section>
    );
  }

  return (
    <div className="module-inventory-grid">
      {items.map((item) => (
        <ModuleInventoryCard
          key={item.id}
          item={item}
          selected={selectedId === item.id}
          onSelect={() => onSelect(item)}
          onDetails={() => onDetails(item)}
        />
      ))}
    </div>
  );
}
