import {
  pathFor,
  pathForModuleDetail,
  type ModuleDetailOrigin,
  type ModuleUpgradeOrigin,
} from "@/app/routes";
import { MODULE_ART } from "@/data/assetRegistry";
import { getModuleProgressOrDefault } from "@/data/loadout";
import { getModuleById } from "@/data/modules";
import { calculateModuleUpgradeQuote, type ModuleUpgradeQuote } from "@/systems/moduleProgression";
import type { ModuleSlot, PlayerState, ShipRarity } from "@/types";

export type ModuleResourceShortage = "none" | "credits" | "module-parts" | "both" | "max-level";

export interface ModuleResourceState {
  creditsBalance: number;
  modulePartsBalance: number;
  creditsCost: number | null;
  modulePartsCost: number | null;
  canAfford: boolean;
  shortage: ModuleResourceShortage;
}

export interface ModuleUpgradeViewModel {
  id: string;
  name: string;
  description: string;
  rarity: ShipRarity;
  slot: ModuleSlot;
  slotLabel: string;
  artwork?: string;
  owned: boolean;
  equipped: boolean;
  quote: ModuleUpgradeQuote;
  resources: ModuleResourceState;
}

const SLOT_LABEL: Record<ModuleSlot, string> = {
  core: "Core Module",
  plating: "Plating Module",
  system: "System Module",
};

export function getModuleUpgradeOrigin(hash: string): ModuleUpgradeOrigin {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "modules";
  const origin = new URLSearchParams(hash.slice(queryIndex + 1)).get("origin");
  return origin === "module-detail" || origin === "loadout" || origin === "modules"
    ? origin
    : "modules";
}

export function getModuleUpgradeBackPath(
  moduleId: string | null,
  origin: ModuleUpgradeOrigin,
): string {
  if (!moduleId) return pathFor("modules");
  const detailOrigin: ModuleDetailOrigin = origin === "loadout" ? "loadout" : "modules";
  return pathForModuleDetail(moduleId, detailOrigin);
}

export function getModuleResourceState(
  quote: ModuleUpgradeQuote,
  player: Pick<PlayerState, "currencies" | "materials">,
): ModuleResourceState {
  if (quote.atMaxLevel || quote.creditsCost === null || quote.modulePartsCost === null) {
    return {
      creditsBalance: player.currencies.coins,
      modulePartsBalance: player.materials.moduleParts,
      creditsCost: null,
      modulePartsCost: null,
      canAfford: false,
      shortage: "max-level",
    };
  }
  const shortCredits = player.currencies.coins < quote.creditsCost;
  const shortParts = player.materials.moduleParts < quote.modulePartsCost;
  return {
    creditsBalance: player.currencies.coins,
    modulePartsBalance: player.materials.moduleParts,
    creditsCost: quote.creditsCost,
    modulePartsCost: quote.modulePartsCost,
    canAfford: !shortCredits && !shortParts,
    shortage: shortCredits && shortParts ? "both" : shortCredits ? "credits" : shortParts ? "module-parts" : "none",
  };
}

export function getModuleUpgradeViewModel(
  moduleId: string,
  player: PlayerState,
): ModuleUpgradeViewModel | null {
  const definition = getModuleById(moduleId);
  if (!definition) return null;
  const progress = getModuleProgressOrDefault(moduleId, player);
  const quote = calculateModuleUpgradeQuote(definition, progress);
  const equippedId =
    definition.slot === "core"
      ? player.activeLoadout.coreModuleId
      : definition.slot === "plating"
        ? player.activeLoadout.platingModuleId
        : player.activeLoadout.systemModuleId;
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description,
    rarity: definition.rarity,
    slot: definition.slot,
    slotLabel: SLOT_LABEL[definition.slot],
    artwork: MODULE_ART[definition.artKey as keyof typeof MODULE_ART],
    owned: player.ownedModuleIds.includes(moduleId),
    equipped: equippedId === moduleId,
    quote,
    resources: getModuleResourceState(quote, player),
  };
}
