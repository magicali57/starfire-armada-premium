import assert from "node:assert/strict";
import {
  getCompanionIdFromHash,
  getCompanionUpgradeIdFromHash,
  pathForCompanionDetail,
  pathForCompanionUpgrade,
  resolveRoute,
} from "../../src/app/routes";
import { COMPANION_ART, getShipMasterArt } from "../../src/data/assetRegistry";
import { getCompanionDetailViewModel } from "../../src/data/companionDetail";
import { getCompanionById } from "../../src/data/companions";
import { getCompanionUpgradeViewModel } from "../../src/data/companionUpgrade";
import { buildCompanionRosterItems } from "../../src/data/companionRoster";
import { calculateCompanionPower, calculateLoadoutTotalPower } from "../../src/data/loadout";
import { DEFAULT_PLAYER_STATE, migratePlayerState, parsePlayerSave } from "../../src/data/player";
import { getShipById } from "../../src/data/ships";
import {
  COMPANION_MAX_LEVEL,
  calculateCompanionDataCost,
  calculateCompanionUpgradeCreditsCost,
  calculateCompanionUpgradeQuote,
} from "../../src/systems/companionProgression";
import { applyCompanionLevelUpgradeState } from "../../src/store/playerStore";
import type { PlayerState } from "../../src/types";

let assertions = 0;
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function deepEqual(actual: unknown, expected: unknown, message: string) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}

function clonePlayer(): PlayerState {
  return structuredClone(DEFAULT_PLAYER_STATE);
}

const repair = getCompanionById("companion-repair-drone");
check(repair, "Repair Drone definition exists");

// Route architecture and parser precedence.
const upgradeUrl = pathForCompanionUpgrade(repair.id, "companions");
equal(upgradeUrl, "#/inventory/companions/companion-repair-drone/upgrade?origin=companions", "upgrade path");
equal(resolveRoute(upgradeUrl), "companion-upgrade", "upgrade route resolves before detail");
equal(getCompanionUpgradeIdFromHash(upgradeUrl), repair.id, "upgrade parser round trip");
equal(getCompanionIdFromHash(upgradeUrl), null, "detail parser rejects upgrade URL");
equal(resolveRoute(pathForCompanionDetail(repair.id, "companions")), "companion-detail", "detail route preserved");
equal(resolveRoute("#/inventory/companions"), "companions", "static roster route preserved");
equal(getCompanionUpgradeIdFromHash("#/inventory/companions//upgrade"), null, "empty id rejected");
equal(getCompanionUpgradeIdFromHash("#/inventory/companions/x"), null, "missing upgrade suffix rejected");
equal(getCompanionUpgradeIdFromHash("#/inventory/companions/x/upgrade/extra"), null, "extra segment rejected");
equal(getCompanionUpgradeIdFromHash("#/inventory/companions/%E0%A4%A/upgrade"), null, "malformed encoding rejected");
equal(resolveRoute("#/home"), "home", "existing static route preserved");

// v4 -> current migration and fallback behavior.
const v4 = clonePlayer() as PlayerState;
v4.saveSchemaVersion = 4;
v4.currencies = { coins: 54321, crystals: 77, energy: 42 };
v4.materials = { shipAlloy: 321, companionData: 999, moduleParts: 145 };
delete (v4.materials as Partial<PlayerState["materials"]>).companionData;
v4.companionProgress = {
  "companion-repair-drone": { level: 60, rank: 3, xp: 44 },
  "companion-assault-drone": { level: 25, rank: 2, xp: 9 },
  "companion-beam-drone": { level: 0, rank: 1, xp: 7 },
  "companion-missile-drone": { level: 6, rank: 4, xp: 5 },
};
v4.currentChapterId = "chapter-04";
v4.currentStageId = "ch4-stage-3";
v4.highestClearedStageId = "ch3-stage-10";
const migrated = migratePlayerState(v4);
equal(migrated.state.saveSchemaVersion, 6, "schema advances to current version");
equal(migrated.state.currencies.coins, 54321, "Credits preserved");
equal(migrated.state.materials.shipAlloy, 321, "Ship Alloy preserved");
equal(migrated.state.materials.companionData, DEFAULT_PLAYER_STATE.materials.companionData, "Companion Data added");
deepEqual(migrated.state.activeLoadout, v4.activeLoadout, "active loadout preserved");
deepEqual(migrated.state.ownedCompanionIds, v4.ownedCompanionIds, "companion ownership preserved");
deepEqual(migrated.state.ownedModuleIds, v4.ownedModuleIds, "module ownership preserved");
deepEqual(migrated.state.moduleProgress, v4.moduleProgress, "module progression preserved");
equal(migrated.state.currentChapterId, "chapter-04", "campaign chapter preserved");
equal(migrated.state.currentStageId, "ch4-stage-3", "campaign stage preserved");
equal(migrated.state.highestClearedStageId, "ch3-stage-10", "campaign clear preserved");
equal(migrated.state.companionProgress[repair.id].level, 8, "exact Repair Drone Level 60 migrates to 8");
equal(migrated.state.companionProgress[repair.id].rank, 3, "rank preserved");
equal(migrated.state.companionProgress[repair.id].xp, 44, "XP preserved");
equal(migrated.state.companionProgress["companion-assault-drone"].level, 20, "high invalid level clamped");
equal(migrated.state.companionProgress["companion-beam-drone"].level, 1, "low invalid level clamped");
equal(migrated.state.companionProgress["companion-missile-drone"].level, 6, "valid level preserved");

const currentSave = clonePlayer();
currentSave.materials.companionData = 47;
const current = migratePlayerState(currentSave);
equal(current.state.materials.companionData, 47, "existing Companion Data preserved");
equal(current.source, "current", "valid current save recognized as current");
equal(parsePlayerSave("{bad-json").source, "fallback", "corrupt save falls back");
equal(migratePlayerState({ saveSchemaVersion: 99 }).source, "fallback", "unsupported schema falls back");
equal(parsePlayerSave(null).source, "fresh", "fresh install uses defaults");

// Shared quote, reference calibration and monotonic costs.
const quote = calculateCompanionUpgradeQuote(repair, { level: 8, rank: 0 });
equal(quote.currentPower, 1980, "Repair Drone Power remains 1,980 at Level 8");
equal(quote.creditsCost, 12000, "reference Credits cost reproduced");
equal(quote.companionDataCost, 20, "reference Companion Data cost reproduced");
equal(quote.currentEffects.find((e) => e.key === "heal-per-second")?.value, 2450, "reference current heal reproduced");
equal(quote.nextEffects.find((e) => e.key === "heal-per-second")?.value, 2700, "reference next heal reproduced");
for (let level = 1; level < COMPANION_MAX_LEVEL - 1; level += 1) {
  const nextLevel = level + 1;
  check((calculateCompanionUpgradeCreditsCost(repair, nextLevel) ?? 0) > (calculateCompanionUpgradeCreditsCost(repair, level) ?? 0), `Credits cost rises at ${level}`);
  check((calculateCompanionDataCost(repair, nextLevel) ?? 0) > (calculateCompanionDataCost(repair, level) ?? 0), `Data cost rises at ${level}`);
}
equal(calculateCompanionUpgradeCreditsCost(repair, 20), null, "max level Credits cost absent");
equal(calculateCompanionDataCost(repair, 20), null, "max level Data cost absent");

// Atomic transaction success and failures.
const affordable = clonePlayer();
affordable.currencies.coins = 50000;
affordable.materials.companionData = 100;
affordable.companionProgress[repair.id] = { level: 8, rank: 3, xp: 88 };
const beforeLoadout = structuredClone(affordable.activeLoadout);
const beforeModules = structuredClone(affordable.moduleProgress);
const success = applyCompanionLevelUpgradeState(affordable, repair.id);
check(success.result.success, "upgrade succeeds");
equal(success.result.newLevel, 9, "level increases exactly one");
equal(success.state.currencies.coins, 38000, "Credits deducted once");
equal(success.state.materials.companionData, 80, "Companion Data deducted once");
equal(success.state.companionProgress[repair.id].rank, 3, "rank unchanged");
equal(success.state.companionProgress[repair.id].xp, 88, "XP unchanged");
deepEqual(success.state.activeLoadout, beforeLoadout, "active companion and modules unchanged");
deepEqual(success.state.moduleProgress, beforeModules, "module progression unchanged");
equal(success.state.selectedShipId, affordable.selectedShipId, "selected ship unchanged");

function expectFailure(state: PlayerState, id: string, reason: string) {
  const result = applyCompanionLevelUpgradeState(state, id);
  check(!result.result.success, `${reason} fails`);
  if (!result.result.success) equal(result.result.reason, reason as typeof result.result.reason, `${reason} reason`);
  equal(result.state, state, `${reason} leaves state object unchanged`);
}
const maxed = clonePlayer(); maxed.companionProgress[repair.id] = { level: 20 }; expectFailure(maxed, repair.id, "max-level");
const noCredits = clonePlayer(); noCredits.currencies.coins = 0; expectFailure(noCredits, repair.id, "insufficient-credits");
const noData = clonePlayer(); noData.currencies.coins = 50000; noData.materials.companionData = 0; expectFailure(noData, repair.id, "insufficient-companion-data");
const neither = clonePlayer(); neither.currencies.coins = 0; neither.materials.companionData = 0; expectFailure(neither, repair.id, "insufficient-resources");
const locked = clonePlayer(); locked.ownedCompanionIds = locked.ownedCompanionIds.filter((id) => id !== repair.id); expectFailure(locked, repair.id, "not-owned");
expectFailure(clonePlayer(), "companion-missing", "not-found");

// Cross-screen parity and equipped/unequipped Loadout regression.
const parityPlayer = success.state;
const artResolver = (key: string) => COMPANION_ART[key as keyof typeof COMPANION_ART];
const rosterRepair = buildCompanionRosterItems(parityPlayer, artResolver).find((item) => item.id === repair.id);
const detailRepair = getCompanionDetailViewModel(repair.id, parityPlayer, artResolver, getShipMasterArt);
const upgradeRepair = getCompanionUpgradeViewModel(repair.id, parityPlayer);
check(rosterRepair && detailRepair && upgradeRepair, "all three companion view models resolve");
const sharedPower = calculateCompanionPower(repair, parityPlayer.companionProgress[repair.id]);
equal(rosterRepair.power, sharedPower, "Roster Power parity");
equal(detailRepair.power, sharedPower, "Detail Power parity");
equal(upgradeRepair.quote.currentPower, sharedPower, "Upgrade Power parity");
equal(detailRepair.upgradeCost.credits, upgradeRepair.quote.creditsCost, "Detail Credits quote parity");
equal(detailRepair.upgradeCost.companionData, upgradeRepair.quote.companionDataCost, "Detail Data quote parity");
equal(rosterRepair.upgradeReady, upgradeRepair.resources.canAfford, "Roster Upgrade Ready parity");

const ship = getShipById(parityPlayer.selectedShipId);
check(ship, "selected ship resolves");
const shipLevel = parityPlayer.shipProgress[ship.id]?.level ?? 1;
const beforePower = calculateLoadoutTotalPower(ship, shipLevel, affordable.activeLoadout, affordable).totalPower;
const afterPower = calculateLoadoutTotalPower(ship, shipLevel, parityPlayer.activeLoadout, parityPlayer).totalPower;
equal(afterPower - beforePower, success.result.success ? success.result.newPower - success.result.previousPower : 0, "equipped companion raises Loadout Power by exact delta");

const assault = getCompanionById("companion-assault-drone");
check(assault, "unequipped companion resolves");
const unequipped = clonePlayer(); unequipped.currencies.coins = 50000; unequipped.materials.companionData = 100;
const unequippedBefore = calculateLoadoutTotalPower(ship, shipLevel, unequipped.activeLoadout, unequipped).totalPower;
const unequippedResult = applyCompanionLevelUpgradeState(unequipped, assault.id);
check(unequippedResult.result.success, "unequipped companion upgrades");
const unequippedAfter = calculateLoadoutTotalPower(ship, shipLevel, unequippedResult.state.activeLoadout, unequippedResult.state).totalPower;
equal(unequippedAfter, unequippedBefore, "unequipped companion does not change active Loadout Power");

console.log(`Companion Upgrade verification passed: ${assertions} assertions.`);
