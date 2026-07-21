import type { ChestId, ConsumableId, CurrencyId, MaterialId, PlayerState, RewardEntry } from "@/types";
import { getPlayerProgressionSummary, type PlayerUnlockDefinition } from "@/systems/playerProgression";
import { calculateLoadoutTotalPower } from "@/data/loadout";
import { CAMPAIGN_STAGES, getChapterById } from "@/data/campaign";
import { SHIPS, getShipById } from "@/data/ships";
import { COMPANIONS } from "@/data/companions";
import { MODULES } from "@/data/modules";
import { WEAPONS } from "@/data/weapons";

// Player Profile view-model layer — the single selector the Profile screen
// and Edit Profile modal read through. No XP/level/Power/unlock math is
// duplicated here: getPlayerProfileSummary composes the existing canonical
// systems (getPlayerProgressionSummary for account XP/level,
// calculateLoadoutTotalPower for the one canonical Power number already
// shown on Loadout Manager/Inventory Hub) rather than recomputing them.

// ---------------------------------------------------------------------------
// Built-in avatars — coded badges, not artwork. No dedicated multi-choice
// avatar art exists in the asset registry (only one fixed HUD portrait,
// HOME_TOPBAR_FINAL.avatar, used for the top bar chrome everywhere), so per
// the disclosed-substitution convention this project already uses for
// missing art (see assetRegistry.ts's Ability Cores icon note), Profile
// avatars are a clean coded initials/badge system instead of invented
// artwork. Image upload, camera access, external URLs, and account login
// are deliberately not supported.
// ---------------------------------------------------------------------------

export type ProfileAvatarAccent = "primary" | "secondary" | "gold" | "danger" | "success" | "mythic";

export interface ProfileAvatarOption {
  id: string;
  label: string;
  /** Single glyph rendered inside the badge — decorative only, not text
   *  content that needs localization infrastructure yet. */
  glyph: string;
  accent: ProfileAvatarAccent;
}

export const PROFILE_AVATARS: readonly ProfileAvatarOption[] = [
  { id: "avatar-vanguard", label: "Vanguard", glyph: "★", accent: "primary" },
  { id: "avatar-sentinel", label: "Sentinel", glyph: "⛨", accent: "secondary" },
  { id: "avatar-strike", label: "Strike", glyph: "⚡", accent: "gold" },
  { id: "avatar-nova", label: "Nova", glyph: "☄", accent: "danger" },
  { id: "avatar-drift", label: "Drift", glyph: "✦", accent: "success" },
  { id: "avatar-void", label: "Void", glyph: "◈", accent: "mythic" },
];

export const PROFILE_AVATAR_IDS: ReadonlySet<string> = new Set(PROFILE_AVATARS.map((a) => a.id));

/** Fresh-install / migration default — must be a real entry in
 *  PROFILE_AVATARS above. */
export const DEFAULT_AVATAR_ID: string = PROFILE_AVATARS[0].id;

export function getProfileAvatar(avatarId: string): ProfileAvatarOption {
  return PROFILE_AVATARS.find((option) => option.id === avatarId) ?? PROFILE_AVATARS[0];
}

// ---------------------------------------------------------------------------
// Display name validation — the one place Edit Profile's rules live, so the
// modal's inline check and any future server-side/import validation share
// identical rules.
// ---------------------------------------------------------------------------

const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 16;

export interface DisplayNameValidation {
  valid: boolean;
  /** Trimmed value — only meaningful when `valid` is true. */
  value: string;
  reason?: string;
}

export function validateDisplayName(raw: string): DisplayNameValidation {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { valid: false, value: trimmed, reason: "Name cannot be empty." };
  }
  if (CONTROL_CHAR_PATTERN.test(trimmed)) {
    return { valid: false, value: trimmed, reason: "Name contains invalid characters." };
  }
  if (trimmed.length < DISPLAY_NAME_MIN_LENGTH) {
    return { valid: false, value: trimmed, reason: `Name must be at least ${DISPLAY_NAME_MIN_LENGTH} characters.` };
  }
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return { valid: false, value: trimmed, reason: `Name must be at most ${DISPLAY_NAME_MAX_LENGTH} characters.` };
  }
  return { valid: true, value: trimmed };
}

// ---------------------------------------------------------------------------
// Reward label formatting — display text only (no economy values computed
// here); mirrors the kind-to-label mapping ResultsScreen already uses
// inline, generalized into one reusable formatter for Profile's Next Level
// Rewards preview.
// ---------------------------------------------------------------------------

const CURRENCY_LABEL: Record<CurrencyId, string> = {
  coins: "Credits",
  crystals: "Crystals",
  energy: "Energy",
};

const MATERIAL_LABEL: Record<MaterialId, string> = {
  shipAlloy: "Ship Alloy",
  companionData: "Companion Data",
  moduleParts: "Module Parts",
  weaponParts: "Weapon Parts",
  universalShards: "Universal Shards",
  abilityCores: "Ability Cores",
  companionShards: "Companion Shards",
};

const CHEST_LABEL: Record<ChestId, string> = {
  chestBasic: "Basic Chest",
  chestRare: "Rare Chest",
  chestEpic: "Epic Chest",
};

const CONSUMABLE_LABEL: Record<ConsumableId, string> = {
  consumableShieldCharge: "Shield Charge",
  consumableRepairKit: "Repair Kit",
  consumableDamageAmplifier: "Damage Amplifier",
};

export function formatRewardEntry(entry: RewardEntry): string {
  switch (entry.kind) {
    case "currency":
      return `${entry.amount.toLocaleString()} ${CURRENCY_LABEL[entry.currencyId]}`;
    case "playerXp":
      return `${entry.amount.toLocaleString()} Player XP`;
    case "material":
      return `${entry.amount.toLocaleString()} ${MATERIAL_LABEL[entry.materialId]}`;
    case "chest":
      return `${entry.amount}x ${CHEST_LABEL[entry.chestId]}`;
    case "consumable":
      return `${entry.amount}x ${CONSUMABLE_LABEL[entry.consumableId]}`;
    case "shipFragment":
      return `${entry.amount.toLocaleString()} Ship Fragments`;
    case "collectible":
      return entry.collectibleId;
  }
}

// ---------------------------------------------------------------------------
// Profile summary contract
// ---------------------------------------------------------------------------

export interface ProfileCampaignSummary {
  stagesCleared: number;
  totalStages: number;
  highestStageName: string | null;
  currentChapterName: string | null;
}

export interface ProfileCollectionCounts {
  shipsOwned: number;
  shipsTotal: number;
  companionsOwned: number;
  companionsTotal: number;
  modulesOwned: number;
  modulesTotal: number;
  weaponsOwned: number;
  weaponsTotal: number;
}

/** Only statistics the save genuinely tracks — derived from
 *  highestClearedStageId, never invented/zero-filled counters (battles
 *  completed, victories, bosses defeated are NOT tracked anywhere in
 *  PlayerState today, so they are intentionally absent from this list). */
export interface ProfileBattleStatistic {
  id: string;
  label: string;
  value: number;
}

export interface PlayerProfileSummary {
  displayName: string;
  avatarId: string;
  currentLevel: number;
  maxLevel: number;
  totalXp: number;
  xpWithinCurrentLevel: number;
  xpRequiredWithinCurrentLevel: number;
  progressPercent: number;
  isMaxLevel: boolean;
  nextLevelRewards: RewardEntry[];
  upcomingUnlock: PlayerUnlockDefinition | null;
  currentEnergyCap: number;
  totalFleetPower: number;
  campaign: ProfileCampaignSummary;
  collection: ProfileCollectionCounts;
  battleStatistics: ProfileBattleStatistic[];
}

export function getPlayerProfileSummary(player: PlayerState): PlayerProfileSummary {
  const progression = getPlayerProgressionSummary(player);

  // Total Power reuses the exact same canonical calculation Loadout
  // Manager/Inventory Hub already show (current ship + companion + core/
  // plating/system modules) — never a second Power formula.
  const ship = getShipById(player.selectedShipId);
  const shipLevel = player.shipProgress[player.selectedShipId]?.level ?? 1;
  const power = calculateLoadoutTotalPower(ship, shipLevel, player.activeLoadout, player);

  const highestIndex =
    player.highestClearedStageId !== null
      ? CAMPAIGN_STAGES.findIndex((stage) => stage.id === player.highestClearedStageId)
      : -1;
  const stagesCleared = highestIndex + 1;
  const highestStage = highestIndex >= 0 ? CAMPAIGN_STAGES[highestIndex] : null;
  const currentChapter = getChapterById(player.currentChapterId);

  const battleStatistics: ProfileBattleStatistic[] = [];
  if (stagesCleared > 0) {
    battleStatistics.push({ id: "stages-cleared", label: "Stages Cleared", value: stagesCleared });
    battleStatistics.push({ id: "highest-stage", label: "Highest Stage Reached", value: highestIndex + 1 });
  }

  return {
    displayName: player.displayName,
    avatarId: player.avatarId,
    currentLevel: progression.currentLevel,
    maxLevel: progression.maxLevel,
    totalXp: progression.totalXp,
    xpWithinCurrentLevel: progression.xpWithinCurrentLevel,
    xpRequiredWithinCurrentLevel: progression.xpRequiredWithinCurrentLevel,
    progressPercent: progression.progressPercent,
    isMaxLevel: progression.isMaxLevel,
    nextLevelRewards: progression.nextLevelRewards,
    upcomingUnlock: progression.upcomingUnlock,
    currentEnergyCap: progression.currentEnergyCap,
    totalFleetPower: power.totalPower,
    campaign: {
      stagesCleared,
      totalStages: CAMPAIGN_STAGES.length,
      highestStageName: highestStage?.name ?? null,
      currentChapterName: currentChapter?.name ?? null,
    },
    collection: {
      shipsOwned: player.ownedShipIds.length,
      shipsTotal: SHIPS.length,
      companionsOwned: player.ownedCompanionIds.length,
      companionsTotal: COMPANIONS.length,
      modulesOwned: player.ownedModuleIds.length,
      modulesTotal: MODULES.length,
      weaponsOwned: player.ownedWeaponIds.length,
      weaponsTotal: WEAPONS.length,
    },
    battleStatistics,
  };
}
