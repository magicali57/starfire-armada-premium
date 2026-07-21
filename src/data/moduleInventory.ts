import { MODULE_ART } from "@/data/assetRegistry";
import {
  buildStatContributionRows,
  calculateModulePower,
  calculateModuleStatContributions,
  getModuleProgressOrDefault,
  type LoadoutStatContributionRow,
} from "@/data/loadout";
import { MODULES } from "@/data/modules";
import { MODULE_MAX_LEVEL } from "@/systems/moduleProgression";
import type { ModuleSlot, PlayerLoadout, PlayerState, ShipRarity } from "@/types";

export type ModuleInventoryFilter = "all" | ModuleSlot;
export type ModuleInventorySort = "default" | "power" | "rarity" | "level" | "name";
export type ModuleUpgradePresentationState = "locked" | "max-level" | "upgrade-ready";

export interface ModuleInventoryItem {
  id: string;
  name: string;
  description: string;
  rarity: ShipRarity;
  slot: ModuleSlot;
  slotLabel: string;
  level: number;
  power: number;
  artwork?: string;
  owned: boolean;
  equipped: boolean;
  upgradeState: ModuleUpgradePresentationState;
  statRows: LoadoutStatContributionRow[];
}

export interface ModuleInventoryCounts {
  owned: number;
  total: number;
}

const SLOT_LABEL: Record<ModuleSlot, string> = {
  core: "Core",
  plating: "Plating",
  system: "System",
};

const RARITY_ORDER: Record<ShipRarity, number> = {
  common: 0,
  rare: 1,
  epic: 2,
  legendary: 3,
  mythic: 4,
};

// Module progression is not implemented yet. This threshold is only the
// reference-facing presentation rule used to label the existing Level-80
// fixtures as MAX LEVEL; it does not clamp, upgrade, or mutate module data.
export const MODULE_PRESENTATION_MAX_LEVEL = MODULE_MAX_LEVEL;

export function getEquippedModuleIds(loadout: PlayerLoadout): Set<string> {
  return new Set(
    [loadout.coreModuleId, loadout.platingModuleId, loadout.systemModuleId].filter(
      (id): id is string => id !== null,
    ),
  );
}

export function getModuleUpgradePresentationState(
  owned: boolean,
  level: number,
): ModuleUpgradePresentationState {
  if (!owned) return "locked";
  return level >= MODULE_PRESENTATION_MAX_LEVEL ? "max-level" : "upgrade-ready";
}

export function buildModuleInventoryItems(player: PlayerState): ModuleInventoryItem[] {
  const equippedIds = getEquippedModuleIds(player.activeLoadout);
  return MODULES.map((moduleDef) => {
    const progress = getModuleProgressOrDefault(moduleDef.id, player);
    const contributions = calculateModuleStatContributions(moduleDef, progress);
    const owned = player.ownedModuleIds.includes(moduleDef.id);
    return {
      id: moduleDef.id,
      name: moduleDef.name,
      description: moduleDef.description,
      rarity: moduleDef.rarity,
      slot: moduleDef.slot,
      slotLabel: SLOT_LABEL[moduleDef.slot],
      level: progress.level,
      power: calculateModulePower(moduleDef, progress),
      artwork: MODULE_ART[moduleDef.artKey as keyof typeof MODULE_ART],
      owned,
      equipped: equippedIds.has(moduleDef.id),
      upgradeState: getModuleUpgradePresentationState(owned, progress.level),
      statRows: buildStatContributionRows(contributions).filter(
        (row) => contributions[row.key] !== 0,
      ),
    };
  });
}

export function filterModuleInventoryItems(
  items: readonly ModuleInventoryItem[],
  filter: ModuleInventoryFilter,
): ModuleInventoryItem[] {
  return filter === "all" ? [...items] : items.filter((item) => item.slot === filter);
}

export function sortModuleInventoryItems(
  items: readonly ModuleInventoryItem[],
  sort: ModuleInventorySort,
): ModuleInventoryItem[] {
  const sorted = [...items];
  if (sort === "default") return sorted;
  sorted.sort((a, b) => {
    if (sort === "power") return b.power - a.power || a.name.localeCompare(b.name);
    if (sort === "rarity") return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity] || b.power - a.power;
    if (sort === "level") return b.level - a.level || b.power - a.power;
    return a.name.localeCompare(b.name);
  });
  return sorted;
}

export function getModuleInventoryCounts(items: readonly ModuleInventoryItem[]): ModuleInventoryCounts {
  return {
    owned: items.filter((item) => item.owned).length,
    total: items.length,
  };
}

export function getFeaturedModule(
  items: readonly ModuleInventoryItem[],
  selectedId?: string | null,
): ModuleInventoryItem | null {
  if (selectedId) {
    const selected = items.find((item) => item.id === selectedId);
    if (selected) return selected;
  }
  return items.find((item) => item.equipped) ?? items.find((item) => item.owned) ?? items[0] ?? null;
}
