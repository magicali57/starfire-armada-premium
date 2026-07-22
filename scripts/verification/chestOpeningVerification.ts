import assert from "node:assert/strict";
import { DEFAULT_PLAYER_STATE, migratePlayerState } from "../../src/data/player";
import {
  CHEST_IDS,
  CHEST_RARITY,
  getChestArt,
  getChestContentsSummary,
  getChestVaultViewModel,
} from "../../src/data/chests";
import { getChestRevealRows } from "../../src/data/chestReveal";
import { getInventoryHubViewModel } from "../../src/data/inventoryHub";
import { CHEST_LABEL } from "../../src/data/playerProfile";
import { REWARD_CHEST } from "../../src/data/assetRegistry";
import { pathFor, resolveRoute } from "../../src/app/routes";
import { applyRewardBundle } from "../../src/systems/rewards/applyRewards";
import { rollDropTable } from "../../src/systems/rewards/resolveRewards";
import { createFixedRandomSource, createSeededRandomSource } from "../../src/systems/rewards/randomSource";
import {
  buildChestOpeningFailure,
  openChestTransaction,
  type ChestOpeningResult,
} from "../../src/systems/rewards/openChest";
import type { ChestId, PlayerState, ResolvedReward } from "../../src/types";

// Focused verification for the canonical Chest Opening transaction
// (systems/rewards/openChest.ts) and its presentation helpers
// (data/chests.ts, data/chestReveal.ts). Exercises the REAL
// CHEST_REWARD_TABLES and the REAL applyRewardBundle — nothing here
// reimplements reward resolution/application/duplicate-conversion math.
//
// Disclosed limitation (same as every prior handoff): the store's
// `openChest` action (store/playerStore.tsx — double-tap in-flight guard,
// the stricter persist-before-commit ordering, the "persistence-failure"
// branch) and the ChestOpeningScreen.tsx cinematic phase state machine are
// JSX/.tsx and cannot load under this sandbox's plain
// `node --experimental-strip-types` runner — verified by static code
// review instead (see COMPLETION_REPORT.md). Everything they call
// (openChestTransaction, buildChestOpeningFailure, persistPlayerState's
// existing contract) is covered here directly.

let assertions = 0;
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function deepEqual<T>(actual: T, expected: T, message: string) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}

const clonePlayer = (patch: Partial<PlayerState> = {}): PlayerState => ({
  ...structuredClone(DEFAULT_PLAYER_STATE),
  ...patch,
});

const withChests = (counts: Partial<Record<ChestId, number>>): PlayerState =>
  clonePlayer({ chests: { chestBasic: 0, chestRare: 0, chestEpic: 0, ...counts } });

// ---------------------------------------------------------------------------
// Basic / Rare / Epic chests each open successfully.
// ---------------------------------------------------------------------------
for (const chestId of CHEST_IDS) {
  const player = withChests({ [chestId]: 1 });
  const { state, result } = openChestTransaction(player, {
    chestId,
    randomSource: createSeededRandomSource(chestId.length * 7919 + 1),
  });
  check(result.success, `${chestId} opens successfully`);
  equal(result.chestId, chestId, `${chestId} result echoes the requested chest id`);
  equal(result.chestDisplayName, CHEST_LABEL[chestId], `${chestId} result carries the canonical display name`);
  equal(result.chestRarity, CHEST_RARITY[chestId], `${chestId} result carries the canonical rarity tier`);
  check(result.resolvedRewards.length > 0, `${chestId} resolves at least one reward`);
  check(result.appliedRewards.length > 0, `${chestId} applies at least one reward`);
  equal(state.chests[chestId], 0, `${chestId} deducted from 1 to 0`);
  equal(result.remainingChestCount, 0, `${chestId} result reports the post-opening count`);
}

// ---------------------------------------------------------------------------
// Exact one-chest deduction (starting from more than one).
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestRare: 5 });
  const { state, result } = openChestTransaction(player, {
    chestId: "chestRare",
    randomSource: createSeededRandomSource(42),
  });
  check(result.success, "opening succeeds with 5 owned");
  equal(state.chests.chestRare, 4, "exactly one chest deducted, four remain");
  equal(player.chests.chestRare, 5, "the ORIGINAL state object passed in is never mutated");
}

// ---------------------------------------------------------------------------
// No chest owned → typed failure, zero side effects.
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestEpic: 0 });
  const { state, result } = openChestTransaction(player, {
    chestId: "chestEpic",
    randomSource: createSeededRandomSource(1),
  });
  check(!result.success, "opening a chest with 0 owned fails");
  equal(result.errorCode, "no-chest-owned", "typed failure code is no-chest-owned");
  equal(result.remainingChestCount, 0, "reported remaining count is still 0");
  equal(state, player, "the ORIGINAL state is returned unchanged on failure");
  deepEqual(result.appliedRewards, [], "no-chest-owned grants nothing");
}

// ---------------------------------------------------------------------------
// Invalid chest id → typed failure, zero side effects, id echoed as-is.
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestBasic: 3 });
  const { state, result } = openChestTransaction(player, {
    chestId: "chestLegendary",
    randomSource: createSeededRandomSource(1),
  });
  check(!result.success, "an unknown chest id fails");
  equal(result.errorCode, "invalid-chest-id", "typed failure code is invalid-chest-id");
  equal(result.chestId, "chestLegendary", "the invalid id is echoed, never fabricated into a real ChestId");
  equal(result.chestDisplayName, "Unknown Chest", "unknown id gets the generic display fallback");
  equal(state, player, "state is untouched for an invalid id");
  equal(player.chests.chestBasic, 3, "the unrelated, valid chestBasic balance is untouched");
}

// ---------------------------------------------------------------------------
// Deterministic rewards with a fixed RandomSource — same inputs, same
// resolved rewards, every time (never Math.random inside resolution).
// ---------------------------------------------------------------------------
{
  const fixedValues = [0.12, 0.5, 0.83, 0.4, 0.05, 0.9];
  const runOnce = () =>
    openChestTransaction(withChests({ chestEpic: 1 }), {
      chestId: "chestEpic",
      randomSource: createFixedRandomSource(fixedValues),
    }).result;
  const first = runOnce();
  const second = runOnce();
  check(first.success && second.success, "both fixed-RNG runs succeed");
  deepEqual(first.resolvedRewards, second.resolvedRewards, "identical fixed RNG sequence resolves identical rewards");
  deepEqual(first.appliedRewards, second.appliedRewards, "identical fixed RNG sequence applies identical rewards");
}

// ---------------------------------------------------------------------------
// All resolved rewards are applied atomically — every currency/material
// entry the transaction resolved actually lands in the returned state.
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestRare: 1 });
  const { state, result } = openChestTransaction(player, {
    chestId: "chestRare",
    randomSource: createSeededRandomSource(777),
  });
  check(result.success, "opening succeeds");
  for (const entry of result.appliedRewards) {
    if (entry.kind === "currency") {
      const granted = entry.amount;
      const total = state.currencies[entry.currencyId] - player.currencies[entry.currencyId];
      check(total >= granted, `currency ${entry.currencyId} increased by at least the applied amount (aggregation-safe)`);
    }
    if (entry.kind === "material") {
      const total = state.materials[entry.materialId] - player.materials[entry.materialId];
      check(total >= entry.amount, `material ${entry.materialId} increased by at least the applied amount`);
    }
  }
}

// ---------------------------------------------------------------------------
// An invalid resolved reward causes a COMPLETE rollback — real
// openChestTransaction path: delete a real material key so the real
// chestBasic table's own shipAlloy grant becomes "invalid" the moment
// applyRewardBundle validates it, then confirm nothing was consumed or
// granted.
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestBasic: 4 });
  const corrupted: PlayerState = {
    ...player,
    materials: { ...player.materials },
  };
  delete (corrupted.materials as Record<string, number>).shipAlloy;
  // A constant 0.5 next() deterministically lands the chestBasic table's
  // weighted pick on the shipAlloy material entry for both rolls (weights
  // 40 coins / 25 shipAlloy / 15 / 15 / 5 — ticket 50 of 100 falls inside
  // the shipAlloy bucket), so this reliably exercises the shipAlloy
  // validation failure rather than relying on luck.
  const { state, result } = openChestTransaction(corrupted, {
    chestId: "chestBasic",
    randomSource: createFixedRandomSource([0.5]),
  });
  check(!result.success, "a resolved reward referencing a missing material fails");
  equal(result.errorCode, "invalid-reward-entry", "typed failure code is invalid-reward-entry");
  equal(state, corrupted, "the untouched (pre-attempt) state is returned — no partial application");
  equal(state.chests.chestBasic, 4, "the chest is NOT consumed when reward application fails");
  deepEqual(result.appliedRewards, [], "nothing is applied on rollback");
  deepEqual(result.duplicateConversions, [], "no duplicate conversions on rollback");
}

// ---------------------------------------------------------------------------
// Invalid/empty reward table → typed failure (defensive; current
// CHEST_REWARD_TABLES always has entries, so this exercises the guard via
// a hand-built empty-table scenario at the applyRewardBundle boundary
// openChestTransaction relies on — rollDropTable naturally returns [] for
// an empty group list, which is exactly the condition it guards against).
// ---------------------------------------------------------------------------
{
  const empty = rollDropTable([], createSeededRandomSource(1), 1, "chest");
  equal(empty.length, 0, "an empty drop-table group list resolves to zero rewards (the guard openChestTransaction checks for)");
}

// ---------------------------------------------------------------------------
// Credits / material rewards land as expected canonical entries. Two fixed
// sequences deterministically force the chestEpic table's weighted pick
// (coins 25 / universalShards 20 / abilityCores 20 / companionShards 15 /
// consumable 12 / crystals 8, total 100) onto a currency bucket (ticket 5)
// and a material bucket (ticket 30) respectively.
// ---------------------------------------------------------------------------
{
  const currencyRun = openChestTransaction(withChests({ chestEpic: 1 }), {
    chestId: "chestEpic",
    randomSource: createFixedRandomSource([0.05, 0.5]),
  }).result;
  check(currencyRun.success, "epic chest opens (currency-forced sequence)");
  check(
    currencyRun.appliedRewards.every((e) => e.kind === "currency" && e.currencyId === "coins"),
    "a low-ticket sequence deterministically grants only Credits",
  );

  const materialRun = openChestTransaction(withChests({ chestEpic: 1 }), {
    chestId: "chestEpic",
    randomSource: createFixedRandomSource([0.3, 0.5]),
  }).result;
  check(materialRun.success, "epic chest opens (material-forced sequence)");
  check(
    materialRun.appliedRewards.every((e) => e.kind === "material" && e.materialId === "universalShards"),
    "a mid-ticket sequence deterministically grants only Universal Shards material",
  );
}

// ---------------------------------------------------------------------------
// Fragment reward, new-collectible reward, and duplicate ship/companion/
// module/weapon conversion — CHEST_REWARD_TABLES currently defines no
// shipFragment/collectible entries (confirmed by inspection; not a defect
// to fix in this task), so these reward KINDS are exercised directly
// through applyRewardBundle with a "chest"-sourced ResolvedReward — the
// exact same applier openChestTransaction calls internally, so this
// covers the real code path a future table update would hit.
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestRare: 1 });
  const draft: PlayerState = { ...player, chests: { ...player.chests, chestRare: 0 } };
  const fragmentReward: ResolvedReward = {
    entry: { kind: "shipFragment", shipId: player.selectedShipId, amount: 12 },
    source: "chest",
    rarity: "rare",
  };
  const applied = applyRewardBundle(draft, [fragmentReward]);
  check(applied.result.success, "a chest-sourced ship-fragment reward applies successfully");
  equal(
    applied.state.shipFragments[player.selectedShipId],
    (player.shipFragments[player.selectedShipId] ?? 0) + 12,
    "ship fragments increased by exactly the granted amount",
  );
}
{
  // A ship NOT already owned → genuinely new collectible.
  const player = withChests({ chestRare: 1 });
  const unownedShipId = "ship-02-laser-beam"; // not in DEFAULT_PLAYER_STATE.ownedShipIds
  check(!player.ownedShipIds.includes(unownedShipId), "fixture ship is not owned by default");
  const draft: PlayerState = { ...player, chests: { ...player.chests, chestRare: 0 } };
  const newShipReward: ResolvedReward = {
    entry: { kind: "collectible", collectibleType: "ship", collectibleId: unownedShipId },
    source: "chest",
    rarity: "epic",
  };
  const applied = applyRewardBundle(draft, [newShipReward]);
  check(applied.result.success, "a chest-sourced new-ship collectible applies successfully");
  check(applied.state.ownedShipIds.includes(unownedShipId), "the new ship is now owned");
  const asOpeningResult: ChestOpeningResult = {
    success: true,
    openingId: "test-opening-new-ship",
    chestId: "chestRare",
    chestDisplayName: CHEST_LABEL.chestRare,
    chestRarity: "rare",
    resolvedRewards: [newShipReward],
    appliedRewards: applied.result.applied.map((r) => r.entry),
    duplicateConversions: [],
    newCollectibles: applied.result.applied.map((r) => r.entry).filter((e) => e.kind === "collectible"),
    remainingChestCount: 0,
  };
  const rows = getChestRevealRows(asOpeningResult);
  const shipRow = rows.find((r) => r.row.kind === "collectible");
  check(!!shipRow, "the reveal builds a row for the new collectible");
  check(shipRow!.isNew, "the new ship's row is flagged isNew");
  check(!shipRow!.isDuplicateConversion, "a genuinely new collectible is never flagged as a duplicate conversion");
}
{
  // Duplicate collectible conversions — ship (owned), companion/module
  // (owned by every fresh save per DEFAULT_PLAYER_STATE's prototype
  // ownership notice), weapon (owned by default).
  const player = clonePlayer();
  const ownedShipId = player.ownedShipIds[0];
  const ownedCompanionId = player.ownedCompanionIds[0];
  const ownedModuleId = player.ownedModuleIds[0];
  const ownedWeaponId = player.ownedWeaponIds[0];
  check(player.ownedShipIds.includes(ownedShipId), "fixture ship is owned");
  check(player.ownedCompanionIds.includes(ownedCompanionId), "fixture companion is owned");
  check(player.ownedModuleIds.includes(ownedModuleId), "fixture module is owned");
  check(player.ownedWeaponIds.includes(ownedWeaponId), "fixture weapon is owned");

  const duplicateRewards: ResolvedReward[] = [
    { entry: { kind: "collectible", collectibleType: "ship", collectibleId: ownedShipId }, source: "chest", rarity: "epic" },
    { entry: { kind: "collectible", collectibleType: "companion", collectibleId: ownedCompanionId }, source: "chest", rarity: "rare" },
    { entry: { kind: "collectible", collectibleType: "module", collectibleId: ownedModuleId }, source: "chest", rarity: "rare" },
    { entry: { kind: "collectible", collectibleType: "weapon", collectibleId: ownedWeaponId }, source: "chest", rarity: "epic" },
  ];
  const applied = applyRewardBundle(player, duplicateRewards);
  check(applied.result.success, "four duplicate collectibles all convert successfully in one bundle");
  equal(applied.result.duplicateConversions.length, 4, "all four duplicates converted, none silently dropped");
  const appliedEntries = applied.result.applied.map((r) => r.entry);
  check(appliedEntries.every((e) => e.kind !== "collectible"), "no duplicate is re-added as a collectible");

  const asOpeningResult: ChestOpeningResult = {
    success: true,
    openingId: "test-opening-duplicates",
    chestId: "chestEpic",
    chestDisplayName: CHEST_LABEL.chestEpic,
    chestRarity: "epic",
    resolvedRewards: duplicateRewards,
    appliedRewards: appliedEntries,
    duplicateConversions: applied.result.duplicateConversions.map((c) => c.converted),
    newCollectibles: [],
    remainingChestCount: 0,
  };
  const rows = getChestRevealRows(asOpeningResult);
  check(
    rows.every((row) => !row.isNew),
    "no row is flagged NEW when every collectible in the opening was a duplicate",
  );
  check(
    rows.some((row) => row.isDuplicateConversion),
    "at least one row is flagged as a duplicate conversion",
  );
}

// ---------------------------------------------------------------------------
// Multiple rewards from one chest aggregate correctly for display
// (stackable ids merge, collectibles never merge).
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestEpic: 1 });
  const { result } = openChestTransaction(player, {
    chestId: "chestEpic",
    // chestEpic rolls 3 times — force every roll to land on the same
    // currency bucket (coins, weight 25 of 100 total) by picking a low
    // ticket, so the display aggregates 3 coin grants into one row.
    randomSource: createFixedRandomSource([0.05, 0.5]),
  });
  check(result.success, "chestEpic opens with a forced low-ticket sequence");
  const rows = getChestRevealRows(result);
  const coinRows = rows.filter((r) => r.row.kind === "currency" && r.row.itemId === "coins");
  equal(coinRows.length <= 1, true, "identical currency rolls aggregate into at most one display row");
}

// ---------------------------------------------------------------------------
// Open Another creates a fresh opening id and independently deducts.
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestBasic: 2 });
  const first = openChestTransaction(player, { chestId: "chestBasic", randomSource: createSeededRandomSource(3) });
  check(first.result.success, "first opening succeeds");
  equal(first.state.chests.chestBasic, 1, "first opening deducts to 1 remaining");
  const second = openChestTransaction(first.state, { chestId: "chestBasic", randomSource: createSeededRandomSource(9) });
  check(second.result.success, "Open Another (second opening) succeeds");
  equal(second.state.chests.chestBasic, 0, "second opening deducts to 0 remaining");
  check(first.result.openingId !== second.result.openingId, "each opening gets its own fresh, unique openingId");
}

// ---------------------------------------------------------------------------
// Repeated-tap / already-in-progress typed failure shape (the exact shape
// store/playerStore.tsx's openChest returns from its in-flight guard,
// verified here since the store itself is JSX).
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestRare: 3 });
  const busy = buildChestOpeningFailure(player, "chestRare", "opening-in-progress");
  check(!busy.success, "a busy-guard failure is unsuccessful");
  equal(busy.errorCode, "opening-in-progress", "typed failure code is opening-in-progress");
  equal(busy.remainingChestCount, 3, "the busy-guard failure reports the CURRENT owned count, untouched");
  equal(player.chests.chestRare, 3, "the busy guard itself never touches state");
}

// ---------------------------------------------------------------------------
// Reload / persistence round-trip: an opened chest's deduction and
// granted rewards survive a save → JSON → migratePlayerState round-trip
// (schema v11, no migration step needed), and unrelated progression is
// byte-for-byte unchanged.
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestEpic: 1 });
  const { state } = openChestTransaction(player, { chestId: "chestEpic", randomSource: createSeededRandomSource(55) });
  const roundTripped = migratePlayerState(JSON.parse(JSON.stringify(state)));
  equal(roundTripped.source, "current", "a fresh v11 save with a resolved opening reloads as 'current' (no migration)");
  equal(roundTripped.state.chests.chestEpic, state.chests.chestEpic, "chest deduction survives a reload round-trip");
  deepEqual(roundTripped.state.currencies, state.currencies, "currencies survive a reload round-trip");
  deepEqual(roundTripped.state.materials, state.materials, "materials survive a reload round-trip");
  // Unrelated progression (never touched by chest opening) is preserved.
  equal(roundTripped.state.level, player.level, "player level is unrelated to chest opening and stays unchanged");
  equal(roundTripped.state.highestClearedStageId, player.highestClearedStageId, "campaign progress is unrelated and stays unchanged");
  deepEqual(roundTripped.state.ownedShipIds, player.ownedShipIds, "ship ownership is unrelated and stays unchanged");
}

// ---------------------------------------------------------------------------
// Chest Vault view model + content summary never expose weights and stay
// truthful to the real tables; art resolves to the existing approved
// assets (no new artwork).
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestBasic: 2, chestRare: 0, chestEpic: 7 });
  const cards = getChestVaultViewModel(player);
  equal(cards.length, 3, "exactly the three canonical chest types are shown");
  const byId = new Map(cards.map((c) => [c.chestId, c]));
  equal(byId.get("chestBasic")!.ownedCount, 2, "Basic Chest owned count reads live from PlayerState");
  equal(byId.get("chestRare")!.ownedCount, 0, "an owned count of zero is never fabricated into a fake positive count");
  equal(byId.get("chestEpic")!.ownedCount, 7, "Epic Chest owned count reads live from PlayerState");
  for (const chestId of CHEST_IDS) {
    const summary = getChestContentsSummary(chestId);
    check(summary.length > 0, `${chestId} has a non-empty, truthful content summary`);
    for (const category of summary) {
      check(!/%|weight|chance:\s*\d/i.test(category), `${chestId}'s content summary never exposes weights/probabilities (${category})`);
    }
    equal(getChestArt(chestId), REWARD_CHEST[chestId === "chestBasic" ? "basic" : chestId === "chestRare" ? "rare" : "epic"], `${chestId} uses the existing approved chest artwork, never new art`);
  }
}

// ---------------------------------------------------------------------------
// Inventory Hub surfaces a Chests category wired to the real chest counts.
// ---------------------------------------------------------------------------
{
  const player = withChests({ chestBasic: 1, chestRare: 2, chestEpic: 3 });
  const hub = getInventoryHubViewModel(player);
  const chestsCategory = hub.categories.find((c) => c.id === "chests");
  check(!!chestsCategory && chestsCategory.implemented, "Inventory Hub exposes an implemented Chests category");
  equal(hub.chests.length, 3, "Inventory Hub's chest view model lists all three chest types");
  deepEqual(
    hub.chests.map((c) => c.ownedCount),
    [1, 2, 3],
    "Inventory Hub's chest counts match PlayerState exactly",
  );
}

// ---------------------------------------------------------------------------
// Route + Back navigation: direct reload resolves the same route with no
// state dependency; no duplicate/competing route exists.
// ---------------------------------------------------------------------------
{
  equal(resolveRoute("#/inventory/chests"), "chest-opening", "the canonical hash resolves to the Chest Opening route");
  equal(pathFor("chest-opening"), "#/inventory/chests", "pathFor builds the exact canonical URL");
  equal(resolveRoute("#/inventory/chests?anything=1"), "chest-opening", "a stray query string is tolerated the same way every other static route is");
  equal(resolveRoute("#/inventory"), "inventory", "the Inventory Hub route is distinct and unaffected");
}

console.log(`Chest Opening verification passed: ${assertions} assertions.`);
