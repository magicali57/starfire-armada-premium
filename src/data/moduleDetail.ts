import { pathFor, type ModuleDetailOrigin } from "@/app/routes";
import { MODULE_ART } from "@/data/assetRegistry";
import {
  buildStatContributionRows,
  calculateModulePower,
  calculateModuleStatContributions,
  getModuleProgressOrDefault,
  type LoadoutStatContributionRow,
} from "@/data/loadout";
import { getModuleById } from "@/data/modules";
import type { ModuleDefinition, ModuleSlot, PlayerLoadout, PlayerState, ShipRarity } from "@/types";

export interface ModuleDetailViewModel {
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
  statRows: LoadoutStatContributionRow[];
  acquisitionTitle: string;
  acquisitionDescription: string;
}

const SLOT_LABEL: Record<ModuleSlot, string> = {
  core: "Core Module",
  plating: "Plating Module",
  system: "System Module",
};

function getEquippedModuleId(loadout: PlayerLoadout, slot: ModuleSlot): string | null {
  if (slot === "core") return loadout.coreModuleId;
  if (slot === "plating") return loadout.platingModuleId;
  return loadout.systemModuleId;
}

export function replaceLoadoutModule(
  loadout: PlayerLoadout,
  moduleId: string,
  slot: ModuleSlot,
): PlayerLoadout {
  if (slot === "core") return { ...loadout, coreModuleId: moduleId };
  if (slot === "plating") return { ...loadout, platingModuleId: moduleId };
  return { ...loadout, systemModuleId: moduleId };
}

export function getModuleDetailOrigin(hash: string): ModuleDetailOrigin {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "direct";
  const origin = new URLSearchParams(hash.slice(queryIndex + 1)).get("origin");
  return origin === "loadout" || origin === "pre-battle" || origin === "modules" ? origin : "direct";
}

export function getModuleDetailBackPath(origin: ModuleDetailOrigin): string {
  return origin === "modules" ? pathFor("modules") : pathFor("loadout");
}

function getAcquisitionCopy(moduleDef: ModuleDefinition): Pick<
  ModuleDetailViewModel,
  "acquisitionTitle" | "acquisitionDescription"
> {
  return {
    acquisitionTitle: `${SLOT_LABEL[moduleDef.slot]} Chests`,
    acquisitionDescription:
      "Module acquisition will be surfaced through future Inventory rewards. No item is granted from this screen.",
  };
}

export function getModuleDetailViewModel(
  moduleId: string,
  player: PlayerState,
): ModuleDetailViewModel | null {
  const moduleDef = getModuleById(moduleId);
  if (!moduleDef) return null;
  const progress = getModuleProgressOrDefault(moduleDef.id, player);
  const contributions = calculateModuleStatContributions(moduleDef, progress);
  const statRows = buildStatContributionRows(contributions).filter(
    (row) => contributions[row.key] !== 0,
  );
  const acquisition = getAcquisitionCopy(moduleDef);

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
    owned: player.ownedModuleIds.includes(moduleDef.id),
    equipped: getEquippedModuleId(player.activeLoadout, moduleDef.slot) === moduleDef.id,
    statRows,
    ...acquisition,
  };
}
