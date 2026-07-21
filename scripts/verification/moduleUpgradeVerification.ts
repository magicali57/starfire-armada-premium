import assert from "node:assert/strict";
import {
  getModuleIdFromHash,
  getModuleUpgradeIdFromHash,
  pathForModuleDetail,
  pathForModuleUpgrade,
  resolveRoute,
} from "../../src/app/routes";
import { getModuleUpgradeViewModel } from "../../src/data/moduleUpgrade";
import { getModuleById } from "../../src/data/modules";
import { DEFAULT_PLAYER_STATE, migratePlayerState } from "../../src/data/player";
import {
  MODULE_MAX_LEVEL,
  calculateModulePartsCost,
  calculateModuleUpgradeCreditsCost,
  calculateModuleUpgradeQuote,
} from "../../src/systems/moduleProgression";
import { applyModuleLevelUpgradeState } from "../../src/store/playerStore";
import type { PlayerState } from "../../src/types";

let assertions = 0;
function equal<T>(actual: T, expected: T, message: string) { assert.equal(actual, expected, message); assertions += 1; }
function check(value: unknown, message: string): asserts value { assert.ok(value, message); assertions += 1; }
function deepEqual(actual: unknown, expected: unknown, message: string) { assert.deepEqual(actual, expected, message); assertions += 1; }
const clonePlayer = (): PlayerState => structuredClone(DEFAULT_PLAYER_STATE);

const targeting = getModuleById("module-targeting-array");
const overdrive = getModuleById("module-overdrive-matrix");
check(targeting && overdrive, "verification modules exist");

const upgradePath = pathForModuleUpgrade(targeting.id, "modules");
equal(upgradePath, "#/inventory/modules/module-targeting-array/upgrade?origin=modules", "upgrade path");
equal(resolveRoute(upgradePath), "module-upgrade", "upgrade resolves before detail");
equal(getModuleUpgradeIdFromHash(upgradePath), targeting.id, "upgrade parser round trip");
equal(getModuleIdFromHash(upgradePath), null, "detail parser rejects upgrade route");
equal(resolveRoute(pathForModuleDetail(targeting.id, "modules")), "module-detail", "detail route preserved");
equal(getModuleUpgradeIdFromHash("#/inventory/modules//upgrade"), null, "empty id rejected");
equal(getModuleUpgradeIdFromHash("#/inventory/modules/x"), null, "missing suffix rejected");
equal(getModuleUpgradeIdFromHash("#/inventory/modules/x/upgrade/extra"), null, "extra segment rejected");
equal(getModuleUpgradeIdFromHash("#/inventory/modules/%E0%A4%A/upgrade"), null, "malformed encoding rejected");

const v5 = clonePlayer();
v5.saveSchemaVersion = 5;
v5.materials.moduleParts = 999;
delete (v5.materials as Partial<PlayerState["materials"]>).moduleParts;
v5.currencies.coins = 12345;
const migrated = migratePlayerState(v5);
equal(migrated.state.saveSchemaVersion, 6, "schema advances to v6");
equal(migrated.state.materials.moduleParts, 145, "Module Parts added");
equal(migrated.state.currencies.coins, 12345, "Credits preserved by migration");
deepEqual(migrated.state.activeLoadout, v5.activeLoadout, "loadout preserved by migration");
deepEqual(migrated.state.moduleProgress, v5.moduleProgress, "module levels preserved by migration");

const referenceQuote = calculateModuleUpgradeQuote(overdrive, { level: 7 });
equal(referenceQuote.creditsCost, 16000, "reference Credits cost reproduced");
equal(referenceQuote.modulePartsCost, 28, "reference Module Parts cost reproduced");
for (let level = 1; level < MODULE_MAX_LEVEL - 1; level += 1) {
  check((calculateModuleUpgradeCreditsCost(targeting, level + 1) ?? 0) > (calculateModuleUpgradeCreditsCost(targeting, level) ?? 0), `Credits cost rises at ${level}`);
  check((calculateModulePartsCost(targeting, level + 1) ?? 0) >= (calculateModulePartsCost(targeting, level) ?? 0), `Parts cost does not fall at ${level}`);
}
equal(calculateModuleUpgradeCreditsCost(targeting, 80), null, "max Credits cost absent");
equal(calculateModulePartsCost(targeting, 80), null, "max Parts cost absent");

const affordable = clonePlayer();
affordable.currencies.coins = 5000;
affordable.materials.moduleParts = 145;
const originalLoadout = structuredClone(affordable.activeLoadout);
const originalCompanions = structuredClone(affordable.companionProgress);
const success = applyModuleLevelUpgradeState(affordable, targeting.id);
check(success.result.success, "upgrade succeeds");
equal(success.state.moduleProgress[targeting.id].level, 2, "level increases exactly one");
equal(success.state.currencies.coins, 2500, "Credits deducted once");
equal(success.state.materials.moduleParts, 137, "Module Parts deducted once");
deepEqual(success.state.activeLoadout, originalLoadout, "active IDs unchanged");
deepEqual(success.state.companionProgress, originalCompanions, "companion progression unchanged");
equal(success.state.selectedShipId, affordable.selectedShipId, "selected ship unchanged");

function expectFailure(state: PlayerState, id: string, reason: string) {
  const applied = applyModuleLevelUpgradeState(state, id);
  check(!applied.result.success, `${reason} fails`);
  if (!applied.result.success) equal(applied.result.reason, reason as typeof applied.result.reason, `${reason} reason`);
  equal(applied.state, state, `${reason} is atomic`);
}
const maxed = clonePlayer(); maxed.moduleProgress[targeting.id] = { level: 80 }; expectFailure(maxed, targeting.id, "max-level");
const noCredits = clonePlayer(); noCredits.currencies.coins = 0; expectFailure(noCredits, targeting.id, "insufficient-credits");
const noParts = clonePlayer(); noParts.materials.moduleParts = 0; expectFailure(noParts, targeting.id, "insufficient-module-parts");
const neither = clonePlayer(); neither.currencies.coins = 0; neither.materials.moduleParts = 0; expectFailure(neither, targeting.id, "insufficient-resources");
const locked = clonePlayer(); locked.ownedModuleIds = locked.ownedModuleIds.filter((id) => id !== targeting.id); expectFailure(locked, targeting.id, "not-owned");
expectFailure(clonePlayer(), "module-missing", "not-found");

const view = getModuleUpgradeViewModel(targeting.id, success.state);
check(view, "view model resolves");
equal(view.quote.currentLevel, 2, "view reflects upgraded level");
equal(view.resources.creditsBalance, 2500, "view reflects Credits balance");
equal(view.resources.modulePartsBalance, 137, "view reflects Module Parts balance");

console.log(`Module Upgrade verification passed: ${assertions} assertions.`);
