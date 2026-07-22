import { COMPANION_ART, MATERIAL_ICON, MODULE_ART } from "@/data/assetRegistry";
import { getActiveLoadoutViewModel, type ActiveLoadoutViewModel } from "@/data/loadout";
import { getChestVaultViewModel, type ChestVaultCard } from "@/data/chests";
import type { PlayerState } from "@/types";

export type InventoryHubCategoryId = "loadout" | "materials" | "chests" | "entry-items" | "cosmetics";

export interface InventoryHubCategory {
  id: InventoryHubCategoryId;
  label: string;
  implemented: boolean;
}

export interface InventoryHubMaterial {
  id: keyof PlayerState["materials"];
  label: string;
  amount: number;
  icon: string;
  tone: "cyan" | "purple" | "green";
}

export interface InventoryHubViewModel {
  loadout: ActiveLoadoutViewModel;
  categories: InventoryHubCategory[];
  materials: InventoryHubMaterial[];
  chests: ChestVaultCard[];
}

const resolveCompanionArt = (artKey: string) => COMPANION_ART[artKey as keyof typeof COMPANION_ART];
const resolveModuleArt = (artKey: string) => MODULE_ART[artKey as keyof typeof MODULE_ART];

export function getInventoryHubViewModel(player: PlayerState): InventoryHubViewModel {
  return {
    loadout: getActiveLoadoutViewModel(
      player.selectedShipId,
      player.shipProgress[player.selectedShipId],
      player.activeLoadout,
      player,
      resolveCompanionArt,
      resolveModuleArt,
    ),
    categories: [
      { id: "loadout", label: "Loadout", implemented: true },
      { id: "materials", label: "Materials", implemented: true },
      { id: "chests", label: "Chests", implemented: true },
      { id: "entry-items", label: "Entry Items", implemented: false },
      { id: "cosmetics", label: "Cosmetics", implemented: false },
    ],
    materials: [
      { id: "shipAlloy", label: "Ship Alloy", amount: player.materials.shipAlloy, icon: MATERIAL_ICON.shipAlloy, tone: "cyan" },
      { id: "companionData", label: "Companion Data", amount: player.materials.companionData, icon: MATERIAL_ICON.companionData, tone: "purple" },
      { id: "moduleParts", label: "Module Parts", amount: player.materials.moduleParts, icon: MATERIAL_ICON.moduleParts, tone: "green" },
    ],
    chests: getChestVaultViewModel(player),
  };
}
