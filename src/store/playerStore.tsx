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

const SAVE_KEY = "starfire-armada-v2:save";

function loadPlayerState(): PlayerState {
  const loaded = parsePlayerSave(window.localStorage.getItem(SAVE_KEY));
  if (loaded.shouldPersist) persistPlayerState(loaded.state);
  return loaded.state;
}

function persistPlayerState(state: PlayerState) {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Storage may be unavailable (private mode, quota) — fail silently,
    // gameplay continues with in-memory state only.
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
  equipWeapon:(weaponId:string)=>boolean;
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
  const companionUpgradeInFlight = useRef<Set<string>>(new Set());
  const moduleUpgradeInFlight = useRef<Set<string>>(new Set());
  const weaponUpgradeInFlight = useRef<Set<string>>(new Set());

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
        return {
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
        return applied.state;
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
        return applied.state;
      });
      globalThis.setTimeout(() => moduleUpgradeInFlight.current.delete(moduleId), 300);
      return result;
    },
    [player, update],
  );
  const upgradeWeaponLevel=useCallback((weaponId:string):UpgradeWeaponResult=>{if(weaponUpgradeInFlight.current.has(weaponId))return{success:false,reason:"busy"};const preflight=applyWeaponLevelUpgradeState(player,weaponId);if(!preflight.result.success)return preflight.result;weaponUpgradeInFlight.current.add(weaponId);let result:UpgradeWeaponResult=preflight.result;update(prev=>{const applied=applyWeaponLevelUpgradeState(prev,weaponId);result=applied.result;return applied.state});globalThis.setTimeout(()=>weaponUpgradeInFlight.current.delete(weaponId),300);return result},[player,update]);
  const equipWeapon=useCallback((weaponId:string)=>{if(!player.ownedWeaponIds.includes(weaponId)||!getWeaponById(weaponId))return false;update(prev=>({...prev,equippedWeaponId:weaponId}));return true},[player.ownedWeaponIds,update]);

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

  const resetSave = useCallback(() => {
    upgradeInFlight.current.clear();
    companionUpgradeInFlight.current.clear();
    moduleUpgradeInFlight.current.clear();
    weaponUpgradeInFlight.current.clear();
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
      equipWeapon,
      saveActiveLoadout,
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
      equipWeapon,
      saveActiveLoadout,
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
