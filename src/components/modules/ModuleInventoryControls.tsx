import type { ModuleInventoryFilter, ModuleInventorySort } from "@/data/moduleInventory";

const FILTERS: { id: ModuleInventoryFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "core", label: "Core" },
  { id: "plating", label: "Plating" },
  { id: "system", label: "System" },
];

interface ModuleInventoryControlsProps {
  filter: ModuleInventoryFilter;
  sort: ModuleInventorySort;
  onFilter: (filter: ModuleInventoryFilter) => void;
  onSort: (sort: ModuleInventorySort) => void;
}

export function ModuleInventoryControls({ filter, sort, onFilter, onSort }: ModuleInventoryControlsProps) {
  return (
    <div className="module-inventory-controls">
      <div className="module-inventory-filters" role="group" aria-label="Filter modules by slot">
        {FILTERS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={entry.id === filter ? "module-inventory-filter module-inventory-filter--active" : "module-inventory-filter"}
            aria-pressed={entry.id === filter}
            onClick={() => onFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <label className="module-inventory-sort">
        <span>Sort</span>
        <select value={sort} onChange={(event) => onSort(event.target.value as ModuleInventorySort)}>
          <option value="default">Default Order</option>
          <option value="power">Power</option>
          <option value="rarity">Rarity</option>
          <option value="level">Level</option>
          <option value="name">Name</option>
        </select>
      </label>
    </div>
  );
}
