import type { CompanionUpgradeOrigin } from "@/app/routes";
import { pathForCompanionDetail, pathFor } from "@/app/routes";
import { COMPANION_ART, getShipMasterArt } from "@/data/assetRegistry";
import { getCompanionAcquisitionInfo, getCompanionDetailViewModel } from "@/data/companionDetail";
import { getCompanionById } from "@/data/companions";
import { getCompanionProgressOrDefault } from "@/data/loadout";
import {
  calculateCompanionUpgradeQuote,
  getCompanionRankMilestones,
  getCompanionUpgradeProfile,
  type CompanionRankMilestone,
  type CompanionUpgradeEffectValue,
  type CompanionUpgradeQuote,
} from "@/systems/companionProgression";
import type { CompanionRole, PlayerState, ShipRarity } from "@/types";

export type CompanionResourceShortage = "none" | "credits" | "companion-data" | "both" | "max-level";

export interface CompanionResourceState {
  creditsBalance: number;
  companionDataBalance: number;
  creditsCost: number | null;
  companionDataCost: number | null;
  canAfford: boolean;
  shortage: CompanionResourceShortage;
}

export interface CompanionUpgradeViewModel {
  id: string;
  name: string;
  rarity: ShipRarity;
  role: CompanionRole;
  roleLabel: string;
  description: string;
  artwork: string | undefined;
  owned: boolean;
  equipped: boolean;
  rank: number;
  maxRank: number;
  primaryEffectName: string;
  behaviorSummary: string;
  targeting: string;
  quote: CompanionUpgradeQuote;
  milestones: CompanionRankMilestone[];
  resources: CompanionResourceState;
  acquisition: ReturnType<typeof getCompanionAcquisitionInfo>;
}

function resolveCompanionArt(artKey: string): string | undefined {
  return COMPANION_ART[artKey as keyof typeof COMPANION_ART];
}

export function getCompanionUpgradeOrigin(hash: string): CompanionUpgradeOrigin {
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return "companions";
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const origin = params.get("origin");
  return origin === "loadout" || origin === "home" || origin === "companions" ? origin : "companions";
}

export function getCompanionUpgradeBackPath(
  companionId: string | null,
  origin: CompanionUpgradeOrigin,
): string {
  if (!companionId) return `${pathFor("companions")}?return=fleet`;
  return pathForCompanionDetail(companionId, origin);
}

export function formatCompanionUpgradeEffect(effect: CompanionUpgradeEffectValue): string {
  const number = effect.value.toLocaleString(undefined, {
    minimumFractionDigits: effect.precision,
    maximumFractionDigits: effect.precision,
  });
  switch (effect.unit) {
    case "percent":
      return `${number}%`;
    case "seconds":
      return `${number}s`;
    case "per-second":
      return `${number}/s`;
    case "flat":
    default:
      return number;
  }
}

export function getCompanionResourceState(
  quote: CompanionUpgradeQuote,
  player: Pick<PlayerState, "currencies" | "materials">,
): CompanionResourceState {
  if (quote.atMaxLevel || quote.creditsCost === null || quote.companionDataCost === null) {
    return {
      creditsBalance: player.currencies.coins,
      companionDataBalance: player.materials.companionData,
      creditsCost: null,
      companionDataCost: null,
      canAfford: false,
      shortage: "max-level",
    };
  }
  const shortCredits = player.currencies.coins < quote.creditsCost;
  const shortData = player.materials.companionData < quote.companionDataCost;
  return {
    creditsBalance: player.currencies.coins,
    companionDataBalance: player.materials.companionData,
    creditsCost: quote.creditsCost,
    companionDataCost: quote.companionDataCost,
    canAfford: !shortCredits && !shortData,
    shortage: shortCredits && shortData ? "both" : shortCredits ? "credits" : shortData ? "companion-data" : "none",
  };
}

export function getCompanionUpgradeViewModel(
  companionId: string,
  player: PlayerState,
): CompanionUpgradeViewModel | null {
  const definition = getCompanionById(companionId);
  if (!definition) return null;
  const progress = getCompanionProgressOrDefault(companionId, player);
  const quote = calculateCompanionUpgradeQuote(definition, progress);
  const detail = getCompanionDetailViewModel(companionId, player, resolveCompanionArt, getShipMasterArt);
  if (!detail) return null;
  return {
    id: definition.id,
    name: definition.name,
    rarity: definition.rarity,
    role: definition.role,
    roleLabel: detail.roleLabel,
    description: definition.description,
    artwork: resolveCompanionArt(definition.artKey),
    owned: detail.owned,
    equipped: detail.equipped,
    rank: detail.rank,
    maxRank: detail.maxRank,
    primaryEffectName: getCompanionUpgradeProfile(definition.id)?.primaryEffectName ?? "Companion Ability",
    behaviorSummary: detail.behavior.summary,
    targeting: detail.behavior.targeting ?? "Automatic",
    quote,
    milestones: getCompanionRankMilestones(definition, progress),
    resources: getCompanionResourceState(quote, player),
    acquisition: getCompanionAcquisitionInfo(detail.owned),
  };
}
