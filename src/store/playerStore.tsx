import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CurrencyId, MaterialId, PlayerLoadout, PlayerState, SaveLoadoutResult } from "@/types";
import { DEFAULT_PLAYER_STATE, getShipById, parsePlayerSave } from "@/data";
import { getCompanionById } from "@/data/companions";
import { getCompanionProgressOrDefault, getLoadoutValidation, getModuleProgressOrDefault } from "@/data/loadout";
import { getModuleById } from "@/data/modules";
import { getWeaponById } from "@/data/weapons";
import { getWeaponLevel, getWeaponPower, getWeaponUpgradeCost } from "@/systems/weaponProgression";
import { calculateCompanionUpgradeQuote } from "@/systems/companionProgression";
import { calculateModuleUpgradeQuote } from "@/systems/moduleProgression";
import {
  calculateShipLevelUpgradeQuote,
  createDefaultShipProgress,
  isMaxLevel,
} from "@/systems/shipStats";
import { calculateShipRankUpQuote, type RankUpBlockReason } from "@/systems/shipStarRank";
import { PROFILE_AVATAR_IDS, validateDisplayName } from "@/data/playerProfile";
import {
  DEFAULT_SHIP_ABILITY_LEVELS,
  getShipAbilityPreview,
  type AbilityUpgradeBlockReason,
  type ShipAbilityCategory,
} from "@/systems/shipAbilities";
import {
  applyCompleteCampaignStage,
  type CompleteCampaignStageArgs,
} from "@/systems/rewards/completeCampaignStage";
import { buildChestOpeningFailure, openChestTransaction, type ChestOpeningResult } from "@/systems/rewards/openChest";
import {
  buildShopPurchaseFailure,
  purchaseShopOfferTransaction,
  type ShopPurchaseResult,
} from "@/systems/rewards/purchaseShopOffer";
import { productionRandomSource } from "@/systems/rewards/randomSource";
import type { BattleCompletionSummary, RewardDifficulty } from "@/types";
import {
  completeBattleSession as applyBattleCompletion,
  declareBattleOutcome,
  enterBattleResults as applyEnterBattleResults,
  getBattleEnergyCost,
  pauseBattleSession,
  prepareBattleSession,
  resumeBattleSession,
  startBattleSession as applyBattleStart,
  type BattlePerformance,
  type BattleSession,
  type BattleSessionTransitionResult,
} from "@/systems/battleSession";
import { recordDailyMissionEvent } from "@/systems/dailyMissions/recordDailyMissionEvent";
import {
  buildDailyMissionClaimFailure,
  claimDailyMissionReward,
} from "@/systems/dailyMissions/claimDailyMission";
import {
  buildDailyActivityClaimFailure,
  claimDailyActivityMilestone,
} from "@/systems/dailyMissions/claimDailyActivityMilestone";
import type { DailyActivityClaimResult, DailyMissionClaimResult } from "@/types/dailyMissions";
import { ensureCurrentDailyMissionState } from "@/systems/dailyMissions/dailyMissionDay";

// The ONE canonical save key. The ":recovery" sibling is not a second save
// — it only preserves the raw string of an unrecoverable save for manual
// inspection, and is never read back by the game.
const SAVE_KEY = "starfire-armada-v2:save";
const RECOVERY_KEY = `${SAVE_KEY}:recovery`;

export interface SaveDiagnostics {
  schemaVersion: number;
  loadSource: "fresh" | "current" | "migrated" | "fallback" | "unknown";
  recoveryReason: string | null;
  repairs: string[];
  /** Message of the last failed persist attempt, or null. In-memory state
   *  stays authoritative on failure — persistence never pretends success. */
  persistenceError: string | null;
}

const saveDiagnostics: SaveDiagnostics = {
  schemaVersion: 0,
  loadSource: "unknown",
  recoveryReason: null,
  repairs: [],
  persistenceError: null,
};

/** Compact development diagnostic — no production UI consumes this. */
export function getSaveDiagnostics(): SaveDiagnostics {
  return { ...saveDiagnostics, repairs: [...saveDiagnostics.repairs] };
}

function loadPlayerState(): PlayerState {
  const raw = window.localStorage.getItem(SAVE_KEY);
  const loaded = parsePlayerSave(raw);
  saveDiagnostics.schemaVersion = loaded.state.saveSchemaVersion;
  saveDiagnostics.loadSource = loaded.source;
  saveDiagnostics.recoveryReason = loaded.recoveryReason ?? null;
  saveDiagnostics.repairs = loaded.repairs;
  if (loaded.source === "fallback" && raw) {
    // Whole save was unrecoverable: keep a raw backup once, then start
    // fresh. Never crashes; never read back automatically.
    try {
      window.localStorage.setItem(RECOVERY_KEY, raw);
    } catch {
      // Backup is best-effort only.
    }
  }
  if (loaded.shouldPersist) persistPlayerState(loaded.state);
  return loaded.state;
}

/** Returns true when the write actually succeeded. On failure the valid
 *  in-memory state is retained, a typed diagnostic is recorded, and no
 *  rewards/transactions are re-run — the app continues un-crashed.
 *  Exported for the focused verification suite only. */
export function persistPlayerState(state: PlayerState): boolean {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveDiagnostics.persistenceError = null;
    return true;
  } catch (error) {
    saveDiagnostics.persistenceError = error instanceof Error ? error.message : String(error);
    return false;
  }
}

export type UpgradeShipFailureReason =
  | "not-owned"
  | "max-level"
  | "insufficient-coins"
  | "insufficient-ship-alloy"
  | "insufficient-resources"
  | "busy";

export interface UpgradeShipResult {
  success: boolean;
  reason?: UpgradeShipFailureReason;
  newLevel?: number;
  /** Number of levels actually purchased (0 on any failure). */
  levelsPurchased?: number;
  coinsSpent?: number;
  shipAlloySpent?: number;
}

export type UpgradeCompanionFailureReason =
  | "not-found"
  | "not-owned"
  | "max-level"
  | "insufficient-credits"
  | "insufficient-companion-data"
  | "insufficient-resources"
  | "busy";

export type UpgradeCompanionResult =
  | {
      success: true;
      companionId: string;
      previousLevel: number;
      newLevel: number;
      creditsSpent: number;
      companionDataSpent: number;
      previousPower: number;
      newPower: number;
    }
  | { success: false; reason: UpgradeCompanionFailureReason };

export interface CompanionUpgradeStateResult {
  state: PlayerState;
  result: UpgradeCompanionResult;
}

export type UpgradeModuleFailureReason =
  | "not-found"
  | "not-owned"
  | "max-level"
  | "insufficient-credits"
  | "insufficient-module-parts"
  | "insufficient-resources"
  | "busy";

export type UpgradeModuleResult =
  | {
      success: true;
      moduleId: string;
      previousLevel: number;
      newLevel: number;
      creditsSpent: number;
      modulePartsSpent: number;
      previousPower: number;
      newPower: number;
    }
  | { success: false; reason: UpgradeModuleFailureReason };

export interface ModuleUpgradeStateResult {
  state: PlayerState;
  result: UpgradeModuleResult;
}

export type UpgradeWeaponResult={success:true;weaponId:string;previousLevel:number;newLevel:number;creditsSpent:number;weaponPartsSpent:number;previousPower:number;newPower:number}|{success:false;reason:"not-found"|"not-owned"|"max-level"|"insufficient-credits"|"insufficient-weapon-parts"|"insufficient-resources"|"busy"};
export function applyWeaponLevelUpgradeState(state:PlayerState,weaponId:string):{state:PlayerState;result:UpgradeWeaponResult}{
  const weapon=getWeaponById(weaponId); if(!weapon)return{state,result:{success:false,reason:"not-found"}};
  if(!state.ownedWeaponIds.includes(weaponId))return{state,result:{success:false,reason:"not-owned"}};
  const level=getWeaponLevel(state,weaponId); if(level>=weapon.maxLevel)return{state,result:{success:false,reason:"max-level"}};
  const cost=getWeaponUpgradeCost(weapon,level),shortCredits=state.currencies.coins<cost.credits,shortParts=state.materials.weaponParts<cost.weaponParts;
  if(shortCredits&&shortParts)return{state,result:{success:false,reason:"insufficient-resources"}};
  if(shortCredits)return{state,result:{success:false,reason:"insufficient-credits"}};
  if(shortParts)return{state,result:{success:false,reason:"insufficient-weapon-parts"}};
  const nextLevel=level+1;
  return{state:{...state,currencies:{...state.currencies,coins:state.currencies.coins-cost.credits},materials:{...state.materials,weaponParts:state.materials.weaponParts-cost.weaponParts},weaponProgress:{...state.weaponProgress,[weaponId]:{level:nextLevel}}},result:{success:true,weaponId,previousLevel:level,newLevel:nextLevel,creditsSpent:cost.credits,weaponPartsSpent:cost.weaponParts,previousPower:getWeaponPower(weapon,level),newPower:getWeaponPower(weapon,nextLevel)}};
}

/** Pure atomic Module upgrade. Every validation happens before either
 * resource balance or progression is changed. */
export function applyModuleLevelUpgradeState(
  state: PlayerState,
  moduleId: string,
): ModuleUpgradeStateResult {
  const moduleDef = getModuleById(moduleId);
  if (!moduleDef) return { state, result: { success: false, reason: "not-found" } };
  if (!state.ownedModuleIds.includes(moduleId)) {
    return { state, result: { success: false, reason: "not-owned" } };
  }
  const progress = getModuleProgressOrDefault(moduleId, state);
  const quote = calculateModuleUpgradeQuote(moduleDef, progress);
  if (quote.atMaxLevel || quote.nextLevel === null || quote.creditsCost === null || quote.modulePartsCost === null) {
    return { state, result: { success: false, reason: "max-level" } };
  }
  const shortCredits = state.currencies.coins < quote.creditsCost;
  const shortParts = state.materials.moduleParts < quote.modulePartsCost;
  if (shortCredits && shortParts) return { state, result: { success: false, reason: "insufficient-resources" } };
  if (shortCredits) return { state, result: { success: false, reason: "insufficient-credits" } };
  if (shortParts) return { state, result: { success: false, reason: "insufficient-module-parts" } };

  const nextState: PlayerState = {
    ...state,
    currencies: { ...state.currencies, coins: state.currencies.coins - quote.creditsCost },
    materials: { ...state.materials, moduleParts: state.materials.moduleParts - quote.modulePartsCost },
    moduleProgress: {
      ...state.moduleProgress,
      [moduleId]: { ...progress, level: quote.nextLevel },
    },
  };
  return {
    state: nextState,
    result: {
      success: true,
      moduleId,
      previousLevel: quote.currentLevel,
      newLevel: quote.nextLevel,
      creditsSpent: quote.creditsCost,
      modulePartsSpent: quote.modulePartsCost,
      previousPower: quote.currentPower,
      newPower: quote.nextPower ?? quote.currentPower,
    },
  };
}

/** Pure atomic state transition used by PlayerStore and the verification
 * suite. It either returns one complete upgraded state or the original
 * state object unchanged; partial deductions are impossible. */
export function applyCompanionLevelUpgradeState(
  state: PlayerState,
  companionId: string,
): CompanionUpgradeStateResult {
  const companion = getCompanionById(companionId);
  if (!companion) return { state, result: { success: false, reason: "not-found" } };
  if (!state.ownedCompanionIds.includes(companionId)) {
    return { state, result: { success: false, reason: "not-owned" } };
  }

  const progress = getCompanionProgressOrDefault(companionId, state);
  const quote = calculateCompanionUpgradeQuote(companion, progress);
  if (quote.atMaxLevel || quote.nextLevel === null || quote.creditsCost === null || quote.companionDataCost === null) {
    return { state, result: { success: false, reason: "max-level" } };
  }

  const shortCredits = state.currencies.coins < quote.creditsCost;
  const shortData = state.materials.companionData < quote.companionDataCost;
  if (shortCredits && shortData) {
    return { state, result: { success: false, reason: "insufficient-resources" } };
  }
  if (shortCredits) return { state, result: { success: false, reason: "insufficient-credits" } };
  if (shortData) return { state, result: { success: false, reason: "insufficient-companion-data" } };

  const nextState: PlayerState = {
    ...state,
    currencies: { ...state.currencies, coins: state.currencies.coins - quote.creditsCost },
    materials: {
      ...state.materials,
      companionData: state.materials.companionData - quote.companionDataCost,
    },
    companionProgress: {
      ...state.companionProgress,
      [companionId]: { ...progress, level: quote.nextLevel },
    },
  };
  return {
    state: nextState,
    result: {
      success: true,
      companionId,
      previousLevel: quote.currentLevel,
      newLevel: quote.nextLevel,
      creditsSpent: quote.creditsCost,
      companionDataSpent: quote.companionDataCost,
      previousPower: quote.currentPower,
      newPower: quote.nextPower ?? quote.currentPower,
    },
  };
}

export type RankUpShipResult =
  | {
      success: true;
      shipId: string;
      previousRank: number;
      newRank: number;
      creditsSpent: number;
      shipFragmentsSpent: number;
      universalShardsSpent: number;
      previousPower: number;
      newPower: number;
    }
  | { success: false; reason: RankUpBlockReason | "busy" | "not-found" };

/**
 * Pure atomic Star Rank transaction. Validates everything through
 * calculateShipRankUpQuote (the single source of truth the screen also
 * uses) before touching any balance: ship exists + owned, below max rank,
 * fragments (ship-specific first, universal shards covering only the exact
 * shortage), and Credits. On any failure the original state object is
 * returned unchanged — partial deductions are impossible. On success it
 * deducts all three costs and raises `shipProgress[shipId].stars` by
 * exactly one in the same state transition.
 */
export function applyShipRankUpState(
  state: PlayerState,
  shipId: string,
): { state: PlayerState; result: RankUpShipResult } {
  const ship = getShipById(shipId);
  if (!ship) return { state, result: { success: false, reason: "not-found" } };
  const quote = calculateShipRankUpQuote(ship, state);
  if (!quote.canRankUp || quote.cost === null || quote.nextRank === null) {
    return { state, result: { success: false, reason: quote.blockReason ?? "max-rank" } };
  }

  const progress = state.shipProgress[shipId] ?? createDefaultShipProgress(shipId);
  const nextState: PlayerState = {
    ...state,
    currencies: { ...state.currencies, coins: state.currencies.coins - quote.cost.credits },
    materials: {
      ...state.materials,
      universalShards: state.materials.universalShards - quote.universalToSpend,
    },
    shipFragments: {
      ...state.shipFragments,
      [shipId]: quote.fragmentsOwned - quote.fragmentsToSpend,
    },
    shipProgress: {
      ...state.shipProgress,
      [shipId]: { ...progress, stars: quote.nextRank },
    },
  };
  return {
    state: nextState,
    result: {
      success: true,
      shipId,
      previousRank: quote.currentRank,
      newRank: quote.nextRank,
      creditsSpent: quote.cost.credits,
      shipFragmentsSpent: quote.fragmentsToSpend,
      universalShardsSpent: quote.universalToSpend,
      previousPower: quote.currentPower,
      newPower: quote.nextPower ?? quote.currentPower,
    },
  };
}

export type UpgradeShipAbilityResult =
  | {
      success: true;
      shipId: string;
      category: ShipAbilityCategory;
      abilityName: string;
      previousLevel: number;
      newLevel: number;
      creditsSpent: number;
      abilityCoresSpent: number;
      previousEffectText: string;
      newEffectText: string;
    }
  | { success: false; reason: AbilityUpgradeBlockReason | "busy" | "not-found" };

/**
 * Pure atomic Ship Ability upgrade. All validation flows through
 * getShipAbilityPreview (the exact helper the Abilities screen renders
 * from): ship exists + owned, ability unlocked by Star Rank, below max
 * level, enough Credits AND Ability Cores. On any failure the original
 * state object is returned unchanged; on success both costs are deducted
 * and the one chosen ability is raised by exactly one level in the same
 * state transition. Arsenal weapon state is never touched.
 */
export function applyShipAbilityUpgradeState(
  state: PlayerState,
  shipId: string,
  category: ShipAbilityCategory,
): { state: PlayerState; result: UpgradeShipAbilityResult } {
  const ship = getShipById(shipId);
  if (!ship) return { state, result: { success: false, reason: "not-found" } };
  const preview = getShipAbilityPreview(ship, state, category);
  if (!preview.canUpgrade || preview.cost === null) {
    return { state, result: { success: false, reason: preview.blockReason ?? "max-level" } };
  }

  const currentLevels = state.shipAbilityLevels[shipId] ?? DEFAULT_SHIP_ABILITY_LEVELS;
  const nextLevel = preview.level + 1;
  const nextState: PlayerState = {
    ...state,
    currencies: { ...state.currencies, coins: state.currencies.coins - preview.cost.credits },
    materials: {
      ...state.materials,
      abilityCores: state.materials.abilityCores - preview.cost.abilityCores,
    },
    shipAbilityLevels: {
      ...state.shipAbilityLevels,
      [shipId]: { ...currentLevels, [category]: nextLevel },
    },
  };
  return {
    state: nextState,
    result: {
      success: true,
      shipId,
      category,
      abilityName: preview.definition.name,
      previousLevel: preview.level,
      newLevel: nextLevel,
      creditsSpent: preview.cost.credits,
      abilityCoresSpent: preview.cost.abilityCores,
      previousEffectText: preview.currentEffectText,
      newEffectText: preview.nextEffectText ?? preview.currentEffectText,
    },
  };
}

export type UpdateProfileFailureReason = "invalid-name" | "invalid-avatar";

export type UpdateProfileResult =
  | { success: true; displayName: string; avatarId: string }
  | { success: false; reason: UpdateProfileFailureReason };

/** Pure atomic Edit Profile transaction — validates the name (trim, 2-16
 * visible characters, no control characters) and avatar id (must be a real
 * PROFILE_AVATARS entry) before touching state; on any failure the
 * original state is returned unchanged. */
export function applyUpdatePlayerProfileState(
  state: PlayerState,
  input: { displayName: string; avatarId: string },
): { state: PlayerState; result: UpdateProfileResult } {
  const nameValidation = validateDisplayName(input.displayName);
  if (!nameValidation.valid) {
    return { state, result: { success: false, reason: "invalid-name" } };
  }
  if (!PROFILE_AVATAR_IDS.has(input.avatarId)) {
    return { state, result: { success: false, reason: "invalid-avatar" } };
  }
  return {
    state: { ...state, displayName: nameValidation.value, avatarId: input.avatarId },
    result: { success: true, displayName: nameValidation.value, avatarId: input.avatarId },
  };
}

export interface LockedShipInfo {
  shipId: string;
  unlockType: string;
  unlockRequirement: string;
}

interface PlayerStoreValue {
  player: PlayerState;
  selectOwnedShip: (shipId: string) => void;
  attemptSelectLockedShip: (shipId: string) => LockedShipInfo | null;
  setCurrentStage: (chapterId: string, stageId: string) => void;
  addCurrency: (currencyId: CurrencyId, amount: number) => void;
  spendCurrency: (currencyId: CurrencyId, amount: number) => boolean;
  addMaterial: (materialId: MaterialId, amount: number) => void;
  markStageCleared: (stageId: string) => void;
  /** Atomic Loadout Manager save — validates every slot (existence,
   *  ownership, and correct module slot) against the freshest state before
   *  committing all four fields in one update. See the function body for
   *  the full validation sequence. */
  saveActiveLoadout: (loadout: PlayerLoadout) => SaveLoadoutResult;
  /** One-level compatibility wrapper around upgradeShipLevels(shipId, 1). */
  upgradeShipLevel: (shipId: string) => UpgradeShipResult;
  /** Atomic multi-level upgrade transaction — see the function body for the
   *  full validate-then-commit sequence. Used by the single Upgrade button
   *  (requestedLevels = 1), the Upgrade x5 confirmation, and any future
   *  bulk-upgrade entry point. */
  upgradeShipLevels: (shipId: string, requestedLevels: number) => UpgradeShipResult;
  /** Atomic one-level Companion upgrade using Credits + Companion Data. */
  upgradeCompanionLevel: (companionId: string) => UpgradeCompanionResult;
  /** Atomic one-level Module upgrade using Credits + Module Parts. */
  upgradeModuleLevel: (moduleId: string) => UpgradeModuleResult;
  upgradeWeaponLevel:(weaponId:string)=>UpgradeWeaponResult;
  /** Atomic one-rank Star Rank up using ship fragments + universal-shard
   *  shortage fill + Credits. See applyShipRankUpState. */
  rankUpShip: (shipId: string) => RankUpShipResult;
  /** Atomic one-level Ship Ability upgrade using Credits + Ability Cores. */
  upgradeShipAbility: (shipId: string, category: ShipAbilityCategory) => UpgradeShipAbilityResult;
  /** Canonical battle-completion entry point (reward foundation): resolves
   *  + atomically applies stage rewards and advances campaign progression.
   *  Not yet called by gameplay — future Victory/Results flows use this. */
  completeCampaignStage: (args: CompleteCampaignStageArgs) => BattleCompletionSummary;
  /** Canonical battle-session lifecycle (systems/battleSession.ts). The
   *  session lives HERE (in-memory, never persisted) — the one owner of
   *  battle lifecycle/outcome/completion truth. */
  battleSession: BattleSession | null;
  /** Prepare + start in one action: creates a fresh session and atomically
   *  deducts Energy exactly once. Rejects when a session is in flight. */
  startBattle: (args: { stageId: string; difficulty?: RewardDifficulty }) => BattleSessionTransitionResult;
  pauseBattle: () => BattleSessionTransitionResult;
  resumeBattle: () => BattleSessionTransitionResult;
  declareBattleVictory: (performance?: BattlePerformance) => BattleSessionTransitionResult;
  declareBattleDefeat: (performance?: BattlePerformance) => BattleSessionTransitionResult;
  /** Runs the canonical completion transaction exactly once per session. */
  completeBattle: (sessionId: string) => BattleSessionTransitionResult;
  enterBattleResults: (sessionId: string) => BattleSessionTransitionResult;
  /** Clears temporary session state only (progression untouched). */
  resetBattle: () => void;
  /** New session for the SAME stage/difficulty (retry after defeat /
   *  replay after victory): fresh sessionId, Energy validated + spent
   *  again, no stale state. */
  retryBattle: () => BattleSessionTransitionResult;
  equipWeapon:(weaponId:string)=>boolean;
  /** Atomic Edit Profile save (display name + built-in avatar id). */
  updatePlayerProfile: (input: { displayName: string; avatarId: string }) => UpdateProfileResult;
  /** Canonical Chest Opening transaction (systems/rewards/openChest.ts):
   *  consumes exactly one owned chest and atomically applies its resolved
   *  rewards. Ignored (typed "opening-in-progress" failure) while a
   *  previous call from this same store instance hasn't finished. Accepts
   *  an injectable RandomSource for verification; defaults to the
   *  production one. */
  openChest: (input: { chestId: string; randomSource?: import("@/types").RandomSource }) => ChestOpeningResult;
  /** Canonical Shop purchase transaction
   *  (systems/rewards/purchaseShopOffer.ts): deducts the offer's exact
   *  cost and atomically applies its full reward bundle. Ignored (typed
   *  "purchase-in-progress" failure) while a previous call from this same
   *  store instance hasn't finished. Same persist-before-commit strategy
   *  as openChest — a disk-write failure can never report a successful
   *  purchase the save doesn't actually contain. */
  purchaseShopOffer: (offerId: string) => ShopPurchaseResult;
  /** Atomic Daily Mission reward claim — progress must already meet target. */
  claimDailyMission: (missionId: string) => DailyMissionClaimResult;
  /** Atomic Daily Activity milestone claim. */
  claimDailyActivityMilestone: (milestoneId: string) => DailyActivityClaimResult;
  /** Ensure daily mission day state (reset validation only — never grants). */
  ensureDailyMissions: () => void;
  resetSave: () => void;
}

const PlayerStoreContext = createContext<PlayerStoreValue | null>(null);

export function PlayerStoreProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(loadPlayerState);
  // Tracks ships with an upgrade currently being applied, so rapid repeated
  // clicks (or a stuck click) cannot fire two upgrades before React re-renders
  // the disabled button state. Ref mutation here is synchronous, unlike
  // setState, which is what makes this an effective guard.
  const upgradeInFlight = useRef<Set<string>>(new Set());
  // Same synchronous-guard pattern as upgradeInFlight, scoped to the single
  // loadout save transaction (there is only ever one active loadout, so a
  // boolean is enough — no per-id Set needed).
  const loadoutSaveInFlight = useRef(false);
  // Synchronous guard for openChest — same reasoning as loadoutSaveInFlight.
  // There is only ever one chest-opening presentation on screen at a time,
  // so a single boolean (not a per-chestId Set) is enough.
  const chestOpenInFlight = useRef(false);
  // Same synchronous-guard pattern, scoped to Shop purchases — there is
  // only ever one purchase confirmation on screen at a time.
  const shopPurchaseInFlight = useRef(false);
  const dailyMissionClaimInFlight = useRef(false);
  const dailyActivityClaimInFlight = useRef(false);
  const companionUpgradeInFlight = useRef<Set<string>>(new Set());
  const moduleUpgradeInFlight = useRef<Set<string>>(new Set());
  const weaponUpgradeInFlight = useRef<Set<string>>(new Set());
  const rankUpInFlight = useRef<Set<string>>(new Set());
  const abilityUpgradeInFlight = useRef<Set<string>>(new Set());

  const update = useCallback((updater: (prev: PlayerState) => PlayerState) => {
    setPlayer((prev) => {
      const next = updater(prev);
      if (next === prev) return prev;
      const withTimestamp = { ...next, lastUpdatedAt: Date.now() };
      persistPlayerState(withTimestamp);
      return withTimestamp;
    });
  }, []);

  const selectOwnedShip = useCallback(
    (shipId: string) => {
      update((prev) => {
        if (!prev.ownedShipIds.includes(shipId)) return prev;
        if (prev.selectedShipId === shipId) return prev;
        return { ...prev, selectedShipId: shipId };
      });
    },
    [update],
  );

  const attemptSelectLockedShip = useCallback(
    (shipId: string): LockedShipInfo | null => {
      // Intentionally does not mutate state — locked ships can never become
      // selected this way. Returns the info the UI needs for its modal.
      const ship = getShipById(shipId);
      if (!ship) return null;
      return {
        shipId,
        unlockType: ship.unlockType,
        unlockRequirement: ship.unlockRequirement,
      };
    },
    [],
  );

  const setCurrentStage = useCallback(
    (chapterId: string, stageId: string) => {
      update((prev) => ({
        ...prev,
        currentChapterId: chapterId,
        currentStageId: stageId,
      }));
    },
    [update],
  );

  const addCurrency = useCallback(
    (currencyId: CurrencyId, amount: number) => {
      update((prev) => ({
        ...prev,
        currencies: {
          ...prev.currencies,
          [currencyId]: prev.currencies[currencyId] + amount,
        },
      }));
    },
    [update],
  );

  const spendCurrency = useCallback(
    (currencyId: CurrencyId, amount: number) => {
      let success = false;
      update((prev) => {
        if (prev.currencies[currencyId] < amount) {
          success = false;
          return prev;
        }
        success = true;
        return {
          ...prev,
          currencies: {
            ...prev.currencies,
            [currencyId]: prev.currencies[currencyId] - amount,
          },
        };
      });
      return success;
    },
    [update],
  );

  const addMaterial = useCallback(
    (materialId: MaterialId, amount: number) => {
      update((prev) => ({
        ...prev,
        materials: {
          ...prev.materials,
          [materialId]: prev.materials[materialId] + amount,
        },
      }));
    },
    [update],
  );

  const markStageCleared = useCallback(
    (stageId: string) => {
      update((prev) => ({ ...prev, highestClearedStageId: stageId }));
    },
    [update],
  );

  const upgradeShipLevels = useCallback(
    (shipId: string, requestedLevels: number): UpgradeShipResult => {
      // Validated synchronously against `player` (this render's committed
      // state), same reasoning as the previous one-level implementation:
      // setState updaters run asynchronously relative to this call, so a
      // result computed only inside one would not be readable by the time
      // this function returns. The updater below re-applies the same guards
      // against the freshest state as a safety net (step 7 of the required
      // transaction sequence) but does not change what's returned to the
      // caller — this synchronous, single-threaded validation pass is what
      // actually determines success/failure here, matching this store's
      // existing pattern (see the old upgradeShipLevel this replaces).
      if (upgradeInFlight.current.has(shipId)) {
        // A transaction is already in flight for this ship — this is
        // distinct from an affordability failure, so it gets its own
        // reason rather than being reported as insufficient-coins.
        return { success: false, reason: "busy", levelsPurchased: 0 };
      }

      // 1-2. Ship must exist and be owned.
      if (!player.ownedShipIds.includes(shipId)) {
        return { success: false, reason: "not-owned", levelsPurchased: 0 };
      }
      const ship = getShipById(shipId);
      if (!ship) {
        return { success: false, reason: "not-owned", levelsPurchased: 0 };
      }

      const progress = player.shipProgress[shipId] ?? createDefaultShipProgress(shipId);

      // 3. Must not already be at max level.
      if (isMaxLevel(progress.level)) {
        return { success: false, reason: "max-level", levelsPurchased: 0 };
      }

      // 4. Calculate the exact requested quote (clamped to SHIP_MAX_LEVEL,
      // summed per-level — never approximated).
      const quote = calculateShipLevelUpgradeQuote(ship, progress.level, requestedLevels);
      if (quote.isEmpty) {
        return { success: false, reason: "max-level", levelsPurchased: 0 };
      }

      // 5-6. Confirm sufficient Credits and Ship Alloy, reported separately
      // (and together) so the UI can highlight each independently.
      const shortCoins = player.currencies.coins < quote.totalCoins;
      const shortAlloy = player.materials.shipAlloy < quote.totalShipAlloy;
      if (shortCoins && shortAlloy) {
        return { success: false, reason: "insufficient-resources", levelsPurchased: 0 };
      }
      if (shortCoins) {
        return { success: false, reason: "insufficient-coins", levelsPurchased: 0 };
      }
      if (shortAlloy) {
        return { success: false, reason: "insufficient-ship-alloy", levelsPurchased: 0 };
      }

      upgradeInFlight.current.add(shipId);

      // 7-10. Revalidate against the freshest state inside the updater,
      // deduct both resources and raise the level in the same pass (so
      // there is no intermediate state where one resource is spent but not
      // the other, and no state where coins are spent but the ship level
      // does not change), then persist once via `update`'s own single
      // persistPlayerState call. If revalidation fails here (a race that
      // cannot actually happen in this single-threaded/synchronous-update
      // architecture, but is kept as a defensive no-op per the required
      // "never partially deduct" guarantee), `update` sees `next === prev`
      // and skips both the state change and the persist.
      update((prev) => {
        const latestProgress = prev.shipProgress[shipId] ?? createDefaultShipProgress(shipId);
        if (
          !prev.ownedShipIds.includes(shipId) ||
          prev.currencies.coins < quote.totalCoins ||
          prev.materials.shipAlloy < quote.totalShipAlloy ||
          isMaxLevel(latestProgress.level)
        ) {
          return prev;
        }
        const upgraded: PlayerState = {
          ...prev,
          currencies: { ...prev.currencies, coins: prev.currencies.coins - quote.totalCoins },
          materials: {
            ...prev.materials,
            shipAlloy: prev.materials.shipAlloy - quote.totalShipAlloy,
          },
          shipProgress: {
            ...prev.shipProgress,
            [shipId]: { ...latestProgress, level: latestProgress.level + quote.levels },
          },
        };
        return recordDailyMissionEvent(upgraded, {
          type: "shipUpgraded",
          amount: quote.levels,
        }).state;
      });

      upgradeInFlight.current.delete(shipId);
      return {
        success: true,
        newLevel: quote.targetLevel,
        levelsPurchased: quote.levels,
        coinsSpent: quote.totalCoins,
        shipAlloySpent: quote.totalShipAlloy,
      };
    },
    [player, update],
  );

  const upgradeShipLevel = useCallback(
    (shipId: string): UpgradeShipResult => upgradeShipLevels(shipId, 1),
    [upgradeShipLevels],
  );

  const upgradeCompanionLevel = useCallback(
    (companionId: string): UpgradeCompanionResult => {
      if (companionUpgradeInFlight.current.has(companionId)) {
        return { success: false, reason: "busy" };
      }

      const preflight = applyCompanionLevelUpgradeState(player, companionId);
      if (!preflight.result.success) return preflight.result;

      companionUpgradeInFlight.current.add(companionId);
      let result: UpgradeCompanionResult = preflight.result;
      update((prev) => {
        const applied = applyCompanionLevelUpgradeState(prev, companionId);
        result = applied.result;
        if (!applied.result.success) return prev;
        return recordDailyMissionEvent(applied.state, { type: "companionUpgraded" }).state;
      });
      // Keep the synchronous guard through the browser's double-tap window.
      // The state update itself is immediate, but releasing in a microtask
      // would allow a second click event to purchase another level before the
      // user can see the refreshed quote and balances.
      globalThis.setTimeout(() => companionUpgradeInFlight.current.delete(companionId), 300);
      return result;
    },
    [player, update],
  );

  const upgradeModuleLevel = useCallback(
    (moduleId: string): UpgradeModuleResult => {
      if (moduleUpgradeInFlight.current.has(moduleId)) {
        return { success: false, reason: "busy" };
      }
      const preflight = applyModuleLevelUpgradeState(player, moduleId);
      if (!preflight.result.success) return preflight.result;

      moduleUpgradeInFlight.current.add(moduleId);
      let result: UpgradeModuleResult = preflight.result;
      update((prev) => {
        const applied = applyModuleLevelUpgradeState(prev, moduleId);
        result = applied.result;
        if (!applied.result.success) return prev;
        return recordDailyMissionEvent(applied.state, { type: "moduleUpgraded" }).state;
      });
      globalThis.setTimeout(() => moduleUpgradeInFlight.current.delete(moduleId), 300);
      return result;
    },
    [player, update],
  );
  const upgradeWeaponLevel=useCallback((weaponId:string):UpgradeWeaponResult=>{if(weaponUpgradeInFlight.current.has(weaponId))return{success:false,reason:"busy"};const preflight=applyWeaponLevelUpgradeState(player,weaponId);if(!preflight.result.success)return preflight.result;weaponUpgradeInFlight.current.add(weaponId);let result:UpgradeWeaponResult=preflight.result;update(prev=>{const applied=applyWeaponLevelUpgradeState(prev,weaponId);result=applied.result;if(!applied.result.success)return prev;return recordDailyMissionEvent(applied.state,{type:"weaponUpgraded"}).state});globalThis.setTimeout(()=>weaponUpgradeInFlight.current.delete(weaponId),300);return result},[player,update]);
  const equipWeapon=useCallback((weaponId:string)=>{if(!player.ownedWeaponIds.includes(weaponId)||!getWeaponById(weaponId))return false;update(prev=>({...prev,equippedWeaponId:weaponId}));return true},[player.ownedWeaponIds,update]);

  const rankUpShip = useCallback(
    (shipId: string): RankUpShipResult => {
      if (rankUpInFlight.current.has(shipId)) return { success: false, reason: "busy" };
      const preflight = applyShipRankUpState(player, shipId);
      if (!preflight.result.success) return preflight.result;

      rankUpInFlight.current.add(shipId);
      let result: RankUpShipResult = preflight.result;
      update((prev) => {
        const applied = applyShipRankUpState(prev, shipId);
        result = applied.result;
        return applied.state;
      });
      // Same double-tap guard window as the other upgrade transactions.
      globalThis.setTimeout(() => rankUpInFlight.current.delete(shipId), 300);
      return result;
    },
    [player, update],
  );

  const upgradeShipAbility = useCallback(
    (shipId: string, category: ShipAbilityCategory): UpgradeShipAbilityResult => {
      const key = `${shipId}:${category}`;
      if (abilityUpgradeInFlight.current.has(key)) return { success: false, reason: "busy" };
      const preflight = applyShipAbilityUpgradeState(player, shipId, category);
      if (!preflight.result.success) return preflight.result;

      abilityUpgradeInFlight.current.add(key);
      let result: UpgradeShipAbilityResult = preflight.result;
      update((prev) => {
        const applied = applyShipAbilityUpgradeState(prev, shipId, category);
        result = applied.result;
        if (!applied.result.success) return prev;
        return recordDailyMissionEvent(applied.state, { type: "shipAbilityUpgraded" }).state;
      });
      // Same double-tap guard window as the other upgrade transactions.
      globalThis.setTimeout(() => abilityUpgradeInFlight.current.delete(key), 300);
      return result;
    },
    [player, update],
  );

  // ---- Canonical battle session (in-memory only, one owner) ----
  // The ref mirror is the synchronous source of truth so chained actions
  // inside one event handler (declare → complete → results) always see the
  // freshest session; the state copy drives re-renders.
  const [battleSession, setBattleSessionState] = useState<BattleSession | null>(null);
  const battleSessionRef = useRef<BattleSession | null>(null);
  const setBattleSession = useCallback((session: BattleSession | null) => {
    battleSessionRef.current = session;
    setBattleSessionState(session);
  }, []);
  const battleStartInFlight = useRef(false);
  const battleCompleteInFlight = useRef(false);

  const startBattle = useCallback(
    (args: { stageId: string; difficulty?: RewardDifficulty }): BattleSessionTransitionResult => {
      const current = battleSessionRef.current;
      // Synchronous guard: rapid repeated taps cannot double-spend Energy.
      if (battleStartInFlight.current) {
        return { ok: false, session: current, error: "busy" };
      }
      // An in-flight (non-finished) session cannot be replaced or restarted.
      if (current && current.status !== "completed" && current.status !== "results") {
        return { ok: false, session: current, error: "invalid-transition" };
      }
      const prepared = prepareBattleSession(current, {
        stageId: args.stageId,
        difficulty: args.difficulty,
        shipId: player.selectedShipId,
      });
      if (!prepared.ok || !prepared.session) return prepared;

      const started = applyBattleStart(player, prepared.session);
      if (!started.result.ok) return started.result;

      battleStartInFlight.current = true;
      // Energy deduction + session activation commit together: the player
      // update re-derives the deduction against the freshest state, and the
      // session is only stored when the spend succeeded. Successful spends
      // also feed Daily Missions (energySpent / battleStarted).
      const energySpent = getBattleEnergyCost(prepared.session.stageId);
      update((prev) => {
        const startedState =
          prev === player
            ? started.player
            : (() => {
                const reapplied = applyBattleStart(prev, prepared.session);
                return reapplied.result.ok ? reapplied.player : null;
              })();
        if (!startedState) return prev;
        let next = recordDailyMissionEvent(startedState, {
          type: "energySpent",
          amount: energySpent,
        }).state;
        next = recordDailyMissionEvent(next, { type: "battleStarted" }).state;
        return next;
      });
      setBattleSession(started.result.session);
      globalThis.setTimeout(() => {
        battleStartInFlight.current = false;
      }, 300);
      return started.result;
    },
    [player, update, setBattleSession],
  );

  const pauseBattle = useCallback((): BattleSessionTransitionResult => {
    const result = pauseBattleSession(battleSessionRef.current);
    if (result.ok) setBattleSession(result.session);
    return result;
  }, [setBattleSession]);

  const resumeBattle = useCallback((): BattleSessionTransitionResult => {
    const result = resumeBattleSession(battleSessionRef.current);
    if (result.ok) setBattleSession(result.session);
    return result;
  }, [setBattleSession]);

  const declareBattleVictory = useCallback(
    (performance?: BattlePerformance): BattleSessionTransitionResult => {
      const result = declareBattleOutcome(battleSessionRef.current, "victory", performance);
      if (result.ok) setBattleSession(result.session);
      return result;
    },
    [setBattleSession],
  );

  const declareBattleDefeat = useCallback(
    (performance?: BattlePerformance): BattleSessionTransitionResult => {
      const result = declareBattleOutcome(battleSessionRef.current, "defeat", performance);
      if (result.ok) setBattleSession(result.session);
      return result;
    },
    [setBattleSession],
  );

  const completeBattle = useCallback(
    (sessionId: string): BattleSessionTransitionResult => {
      const current = battleSessionRef.current;
      if (battleCompleteInFlight.current) {
        return { ok: false, session: current, error: "busy" };
      }
      const completed = applyBattleCompletion(player, current, sessionId);
      if (!completed.result.ok) return completed.result;

      battleCompleteInFlight.current = true;
      // Same resolve-once pattern as completeCampaignStage below: the
      // returned summary's random rolls are exactly what persists.
      // Successful completion also feeds Daily Missions (battleCompleted /
      // battleWon) — never from UI.
      const wasVictory = completed.result.session?.outcome === "victory";
      update((prev) => {
        const completedState =
          prev === player
            ? completed.player
            : (() => {
                const reapplied = applyBattleCompletion(prev, current, sessionId);
                return reapplied.result.ok ? reapplied.player : null;
              })();
        if (!completedState) return prev;
        let next = recordDailyMissionEvent(completedState, { type: "battleCompleted" }).state;
        if (wasVictory) {
          next = recordDailyMissionEvent(next, { type: "battleWon" }).state;
        }
        return next;
      });
      setBattleSession(completed.result.session);
      globalThis.setTimeout(() => {
        battleCompleteInFlight.current = false;
      }, 300);
      return completed.result;
    },
    [player, update, setBattleSession],
  );

  const enterBattleResults = useCallback(
    (sessionId: string): BattleSessionTransitionResult => {
      const result = applyEnterBattleResults(battleSessionRef.current, sessionId);
      if (result.ok) setBattleSession(result.session);
      return result;
    },
    [setBattleSession],
  );

  const resetBattle = useCallback(() => {
    setBattleSession(null);
  }, [setBattleSession]);

  const retryBattle = useCallback((): BattleSessionTransitionResult => {
    const current = battleSessionRef.current;
    if (!current || (current.status !== "completed" && current.status !== "results")) {
      return { ok: false, session: current, error: "invalid-transition" };
    }
    // Fresh sessionId, same stage/difficulty; Energy validated + spent again.
    return startBattle({ stageId: current.stageId, difficulty: current.difficulty });
  }, [startBattle]);

  const completeCampaignStage = useCallback(
    (args: CompleteCampaignStageArgs): BattleCompletionSummary => {
      // Resolve ONCE against this render's committed state so the returned
      // summary's random rolls are exactly what gets persisted. The updater
      // reuses that resolved state when `prev` is unchanged (always true in
      // this single-threaded store); if a concurrent update ever landed
      // first, it re-runs the whole transaction against the freshest state
      // rather than persisting a stale roll. Commit + persist happen in
      // `update`'s single atomic pass, same as every other transaction.
      const preflight = applyCompleteCampaignStage(player, args);
      let summary = preflight.summary;
      update((prev) => {
        if (prev === player) return preflight.state;
        const applied = applyCompleteCampaignStage(prev, args);
        summary = applied.summary;
        return applied.state;
      });
      return summary;
    },
    [player, update],
  );

  const saveActiveLoadout = useCallback(
    (loadout: PlayerLoadout): SaveLoadoutResult => {
      if (loadoutSaveInFlight.current) {
        return { success: false, reason: "busy" };
      }

      // Validate against `player` (this render's committed state) up
      // front, same synchronous-validation reasoning as
      // upgradeShipLevels above. getLoadoutValidation (data/loadout.ts) is
      // the single source of truth for these rules — the screen's Save
      // button uses the exact same function to decide enabled/disabled, so
      // there is only one place that defines "is this draft saveable."
      const validation = getLoadoutValidation(loadout, player);
      if (!validation.valid) {
        return { success: false, reason: validation.reason };
      }

      loadoutSaveInFlight.current = true;

      // Revalidate against the freshest state inside the updater (same
      // defensive re-check pattern as upgradeShipLevels), then commit all
      // four fields atomically in one update — never one slot at a time —
      // and persist once via `update`'s own single persistPlayerState call.
      // Never touches currencies/materials.
      update((prev) => {
        if (!getLoadoutValidation(loadout, prev).valid) return prev;
        return { ...prev, activeLoadout: { ...loadout } };
      });

      loadoutSaveInFlight.current = false;
      return { success: true, loadout: { ...loadout } };
    },
    [player, update],
  );

  const updatePlayerProfile = useCallback(
    (input: { displayName: string; avatarId: string }): UpdateProfileResult => {
      const preflight = applyUpdatePlayerProfileState(player, input);
      if (!preflight.result.success) return preflight.result;
      update((prev) => applyUpdatePlayerProfileState(prev, input).state);
      return preflight.result;
    },
    [player, update],
  );

  const openChest = useCallback(
    (input: { chestId: string; randomSource?: import("@/types").RandomSource }): ChestOpeningResult => {
      // Repeated Open taps while a previous call from this store instance
      // hasn't finished are ignored outright — a typed failure, no state
      // change, no second chest consumed.
      if (chestOpenInFlight.current) {
        return buildChestOpeningFailure(player, input.chestId, "opening-in-progress");
      }
      chestOpenInFlight.current = true;
      try {
        // Resolve against `player` (this render's committed state) — the
        // synchronous click-to-return window is far too short for a
        // concurrent update to land first in this single-threaded store,
        // so (unlike completeCampaignStage's extra prev!==player re-derive
        // guard) there is no meaningful race to protect against here.
        const attempt = openChestTransaction(player, {
          chestId: input.chestId,
          randomSource: input.randomSource ?? productionRandomSource,
        });
        if (!attempt.result.success) return attempt.result;

        // Daily Missions: chestOpened fires only after a successful open.
        const withMission = recordDailyMissionEvent(attempt.state, { type: "chestOpened" }).state;
        // Deliberately stricter than this store's usual best-effort
        // `update()` helper (which always commits in-memory even if the
        // persist write fails): a chest opening only ever reports success
        // once the deduction + rewards are actually confirmed written, so
        // a disk-write failure can never leave the UI showing a granted
        // chest reveal the save doesn't actually contain. On failure here,
        // `setPlayer` is never called — in-memory state is untouched too,
        // matching "consume nothing, grant nothing" for every failure
        // path, including this one.
        const withTimestamp: PlayerState = { ...withMission, lastUpdatedAt: Date.now() };
        if (!persistPlayerState(withTimestamp)) {
          return {
            ...buildChestOpeningFailure(player, input.chestId, "persistence-failure", attempt.result.openingId),
          };
        }
        setPlayer(withTimestamp);
        return attempt.result;
      } finally {
        chestOpenInFlight.current = false;
      }
    },
    [player],
  );

  const purchaseShopOffer = useCallback(
    (offerId: string): ShopPurchaseResult => {
      // Repeated BUY taps while a previous call from this store instance
      // hasn't finished are rejected outright — a typed failure, no state
      // change, nothing charged twice.
      if (shopPurchaseInFlight.current) {
        return buildShopPurchaseFailure(player, offerId, "purchase-in-progress");
      }
      shopPurchaseInFlight.current = true;
      try {
        // Resolve against `player` (this render's committed state) — same
        // reasoning as openChest: the synchronous click-to-return window is
        // far too short for a concurrent update to land first.
        const attempt = purchaseShopOfferTransaction(player, { offerId });
        if (!attempt.result.success) return attempt.result;

        // Daily Missions: shopPurchaseCompleted fires only after success.
        const withMission = recordDailyMissionEvent(attempt.state, {
          type: "shopPurchaseCompleted",
        }).state;
        // Same stricter persist-before-commit strategy as openChest: a
        // Shop purchase only ever reports success once the deduction +
        // rewards are actually confirmed written to disk. On failure here,
        // `setPlayer` is never called — in-memory state stays untouched
        // too, so "consume nothing, grant nothing" holds for this failure
        // path as well.
        const withTimestamp: PlayerState = { ...withMission, lastUpdatedAt: Date.now() };
        if (!persistPlayerState(withTimestamp)) {
          return buildShopPurchaseFailure(player, offerId, "persistence-failure", attempt.result.purchaseId);
        }
        setPlayer(withTimestamp);
        return attempt.result;
      } finally {
        shopPurchaseInFlight.current = false;
      }
    },
    [player],
  );

  const claimDailyMission = useCallback(
    (missionId: string): DailyMissionClaimResult => {
      if (dailyMissionClaimInFlight.current) {
        return buildDailyMissionClaimFailure(player, missionId, "claim-in-progress");
      }
      dailyMissionClaimInFlight.current = true;
      try {
        const attempt = claimDailyMissionReward(player, missionId);
        if (!attempt.result.success) return attempt.result;
        const withTimestamp: PlayerState = { ...attempt.state, lastUpdatedAt: Date.now() };
        if (!persistPlayerState(withTimestamp)) {
          return buildDailyMissionClaimFailure(player, missionId, "persistence-failure");
        }
        setPlayer(withTimestamp);
        return attempt.result;
      } finally {
        dailyMissionClaimInFlight.current = false;
      }
    },
    [player],
  );

  const claimDailyActivityMilestoneAction = useCallback(
    (milestoneId: string): DailyActivityClaimResult => {
      if (dailyActivityClaimInFlight.current) {
        return buildDailyActivityClaimFailure(player, milestoneId, "claim-in-progress");
      }
      dailyActivityClaimInFlight.current = true;
      try {
        const attempt = claimDailyActivityMilestone(player, milestoneId);
        if (!attempt.result.success) return attempt.result;
        const withTimestamp: PlayerState = { ...attempt.state, lastUpdatedAt: Date.now() };
        if (!persistPlayerState(withTimestamp)) {
          return buildDailyActivityClaimFailure(player, milestoneId, "persistence-failure");
        }
        setPlayer(withTimestamp);
        return attempt.result;
      } finally {
        dailyActivityClaimInFlight.current = false;
      }
    },
    [player],
  );

  const ensureDailyMissions = useCallback(() => {
    update((prev) => {
      const ensured = ensureCurrentDailyMissionState(prev.dailyMissions);
      if (!ensured.didReset && !ensured.repaired) return prev;
      return { ...prev, dailyMissions: ensured.state };
    });
  }, [update]);

  const resetSave = useCallback(() => {
    upgradeInFlight.current.clear();
    rankUpInFlight.current.clear();
    abilityUpgradeInFlight.current.clear();
    battleStartInFlight.current = false;
    battleCompleteInFlight.current = false;
    setBattleSession(null);
    companionUpgradeInFlight.current.clear();
    moduleUpgradeInFlight.current.clear();
    weaponUpgradeInFlight.current.clear();
    chestOpenInFlight.current = false;
    shopPurchaseInFlight.current = false;
    dailyMissionClaimInFlight.current = false;
    dailyActivityClaimInFlight.current = false;
    update(() => ({ ...DEFAULT_PLAYER_STATE }));
  }, [update]);

  const value = useMemo<PlayerStoreValue>(
    () => ({
      player,
      selectOwnedShip,
      attemptSelectLockedShip,
      setCurrentStage,
      addCurrency,
      spendCurrency,
      addMaterial,
      markStageCleared,
      upgradeShipLevel,
      upgradeShipLevels,
      upgradeCompanionLevel,
      upgradeModuleLevel,
      upgradeWeaponLevel,
      rankUpShip,
      upgradeShipAbility,
      completeCampaignStage,
      battleSession,
      startBattle,
      pauseBattle,
      resumeBattle,
      declareBattleVictory,
      declareBattleDefeat,
      completeBattle,
      enterBattleResults,
      resetBattle,
      retryBattle,
      equipWeapon,
      saveActiveLoadout,
      updatePlayerProfile,
      openChest,
      purchaseShopOffer,
      claimDailyMission,
      claimDailyActivityMilestone: claimDailyActivityMilestoneAction,
      ensureDailyMissions,
      resetSave,
    }),
    [
      player,
      selectOwnedShip,
      attemptSelectLockedShip,
      setCurrentStage,
      addCurrency,
      spendCurrency,
      addMaterial,
      markStageCleared,
      upgradeShipLevel,
      upgradeShipLevels,
      upgradeCompanionLevel,
      upgradeModuleLevel,
      upgradeWeaponLevel,
      rankUpShip,
      upgradeShipAbility,
      completeCampaignStage,
      battleSession,
      startBattle,
      pauseBattle,
      resumeBattle,
      declareBattleVictory,
      declareBattleDefeat,
      completeBattle,
      enterBattleResults,
      resetBattle,
      retryBattle,
      equipWeapon,
      saveActiveLoadout,
      updatePlayerProfile,
      openChest,
      purchaseShopOffer,
      claimDailyMission,
      claimDailyActivityMilestoneAction,
      ensureDailyMissions,
      resetSave,
    ],
  );

  return <PlayerStoreContext.Provider value={value}>{children}</PlayerStoreContext.Provider>;
}

export function usePlayerStore(): PlayerStoreValue {
  const ctx = useContext(PlayerStoreContext);
  if (!ctx) {
    throw new Error("usePlayerStore must be used within a PlayerStoreProvider");
  }
  return ctx;
}
