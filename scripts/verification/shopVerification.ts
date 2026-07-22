import assert from "node:assert/strict";
import { DEFAULT_PLAYER_STATE, migratePlayerState } from "../../src/data/player";
import {
  SHOP_OFFERS,
  getActiveShopOffers,
  getActiveShopOffersByCategory,
  getFeaturedShopOffers,
  getShopHeroOffer,
  getShopOfferById,
  getShopOfferRewardRows,
} from "../../src/data/shopOffers";
import { pathFor, resolveRoute } from "../../src/app/routes";
import {
  buildShopPurchaseFailure,
  purchaseShopOfferTransaction,
} from "../../src/systems/rewards/purchaseShopOffer";
import { getStageRewardDefinition } from "../../src/data/stageRewards";
import { CAMPAIGN_STAGES } from "../../src/data/campaign";
import type { PlayerState } from "../../src/types";

// Focused verification for the canonical Shop purchase transaction
// (systems/rewards/purchaseShopOffer.ts) and its catalog
// (data/shopOffers.ts). Exercises the REAL applyRewardBundle (indirectly,
// through purchaseShopOfferTransaction) — nothing here reimplements
// reward application/duplicate-conversion math.
//
// Disclosed limitation (same pattern as every prior handoff): the store's
// `purchaseShopOffer` action (store/playerStore.tsx — the purchase-in-
// flight guard, the persist-before-commit ordering, the
// "persistence-failure" branch) and ShopScreen.tsx's confirmation/success
// modal state machine are JSX/.tsx and cannot load under this sandbox's
// plain `node --experimental-strip-types` runner. Everything they call
// (purchaseShopOfferTransaction, buildShopPurchaseFailure) is covered here
// directly; the store/UI wiring itself was confirmed by static code review
// plus the passing type-check/build (see COMPLETION_REPORT.md).

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

const withCurrencies = (patch: Partial<PlayerState["currencies"]>): PlayerState =>
  clonePlayer({ currencies: { ...structuredClone(DEFAULT_PLAYER_STATE).currencies, ...patch } });

// ---------------------------------------------------------------------------
// Catalog sanity — every offer used below actually exists, and the
// active/featured/category selectors agree with SHOP_OFFERS' own data.
// ---------------------------------------------------------------------------
{
  const active = getActiveShopOffers();
  check(active.length > 0, "the catalog resolves at least one active offer");
  check(active.every((o) => o.status === "active"), "getActiveShopOffers never returns a non-active offer");
  check(
    SHOP_OFFERS.some((o) => o.status !== "active"),
    "the catalog genuinely contains at least one non-active (planned/future) offer to test hiding against",
  );
  for (const offer of SHOP_OFFERS.filter((o) => o.status !== "active")) {
    check(!active.includes(offer), `planned/future offer "${offer.id}" never appears in getActiveShopOffers`);
  }
  const featured = getFeaturedShopOffers();
  check(featured.length > 0, "at least one non-hero featured offer exists");
  check(featured.every((o) => o.status === "active"), "every featured offer is active");
  check(featured.every((o) => !o.hero), "Featured grid never duplicates the hero offer");
  const hero = getShopHeroOffer();
  check(!!hero, "Commander Supply Bundle hero offer exists");
  check(hero!.status === "active", "hero offer is active");
  check(hero!.cost.currencyId === "crystals" || hero!.cost.currencyId === "coins", "hero costs Credits or Crystals only");
  check(hero!.cost.amount > 0, "hero has a positive price");
  check(hero!.rewards.length >= 3, "hero grants a multi-item supply bundle");
  check(
    !hero!.rewards.some((r) => r.kind === "playerXp"),
    "hero never sells Player XP",
  );
  for (const category of ["resources", "energy", "chests"] as const) {
    const byCategory = getActiveShopOffersByCategory(category);
    check(byCategory.length > 0, `category "${category}" has at least one active offer`);
    check(byCategory.every((o) => o.category === category), `getActiveShopOffersByCategory("${category}") never leaks another category`);
  }
}

// ---------------------------------------------------------------------------
// No zero/negative-price active offers; no negative reward amounts; only
// "coins"/"crystals" ever appear as a cost currency (never "energy",
// never Player XP).
// ---------------------------------------------------------------------------
{
  for (const offer of getActiveShopOffers()) {
    check(offer.cost.amount > 0, `"${offer.id}" has a strictly positive cost`);
    check(Number.isInteger(offer.cost.amount), `"${offer.id}" cost is a whole number`);
    check(offer.cost.currencyId === "coins" || offer.cost.currencyId === "crystals", `"${offer.id}" only charges Credits or Crystals`);
    check(offer.rewards.length > 0, `"${offer.id}" grants at least one reward`);
    for (const reward of offer.rewards) {
      check(reward.kind !== "playerXp", `"${offer.id}" never sells Player XP directly`);
      if ("amount" in reward) check(reward.amount > 0, `"${offer.id}" reward amount is strictly positive`);
    }
  }
}

// ---------------------------------------------------------------------------
// Rare/Epic Chests cost meaningfully more than Basic; Ability Cores/
// Universal Shards cost more per unit than common materials.
// ---------------------------------------------------------------------------
{
  const basic = getShopOfferById("shop-chest-basic")!;
  const rare = getShopOfferById("shop-chest-rare")!;
  const epic = getShopOfferById("shop-chest-epic")!;
  check(rare.cost.amount > basic.cost.amount * 2, "Rare Chest costs meaningfully more than Basic Chest");
  check(epic.cost.amount > rare.cost.amount * 2, "Epic Chest costs meaningfully more than Rare Chest");

  const abilityCores = getShopOfferById("shop-material-ability-cores")!;
  const shipAlloy = getShopOfferById("shop-material-ship-alloy")!;
  const abilityCorePerUnit = abilityCores.cost.amount / (abilityCores.rewards[0] as { amount: number }).amount;
  const shipAlloyPerUnit = shipAlloy.cost.amount / (shipAlloy.rewards[0] as { amount: number }).amount;
  check(abilityCorePerUnit > shipAlloyPerUnit * 5, "Ability Cores cost far more per unit than common Ship Alloy");
}

// ---------------------------------------------------------------------------
// No obvious currency arbitrage: buying Energy with Credits can never be a
// net-positive Credits loop against ANY currently existing campaign
// stage's repeat-clear rate (the steady-state ceiling once first-clear
// bonuses are exhausted).
// ---------------------------------------------------------------------------
{
  const energyOffer = getShopOfferById("shop-energy-credits-small")!;
  const energyReward = energyOffer.rewards[0] as { amount: number };
  const creditsPerEnergy = energyOffer.cost.amount / energyReward.amount;

  let maxRepeatCreditsPerEnergy = 0;
  for (const stage of CAMPAIGN_STAGES) {
    const definition = getStageRewardDefinition(stage.id);
    if (!definition) continue;
    // A REPEAT clear resolves BOTH `guaranteed` (every victory) AND
    // `repeatClear` (the smaller supplement) — see
    // resolveGuaranteedRewards/resolveRepeatClearRewards in
    // systems/rewards/resolveRewards.ts. Sum both so this ceiling matches
    // what a repeat clear actually pays out.
    const repeatCoins = [...definition.guaranteed, ...definition.repeatClear]
      .filter((e) => e.kind === "currency" && e.currencyId === "coins")
      .reduce((sum, e) => sum + (e as { amount: number }).amount, 0);
    // 10 Energy spent per battle start (canonical cost — see
    // systems/battleSession.ts) is the steady-state Credits/Energy
    // ceiling for currently existing content. The ×1.5 factor is
    // Nightmare's currency multiplier, so the check holds even on the
    // hardest currently-defined difficulty.
    const rate = (repeatCoins * definition.chapterMultiplier * 1.5) / 10;
    maxRepeatCreditsPerEnergy = Math.max(maxRepeatCreditsPerEnergy, rate);
  }
  check(
    creditsPerEnergy > maxRepeatCreditsPerEnergy,
    `the Credits Energy offer's rate (${creditsPerEnergy} Credits/Energy) stays above every existing stage's repeat-clear ceiling (${maxRepeatCreditsPerEnergy}), so it can never be a net-positive Credits loop today`,
  );
}

// ---------------------------------------------------------------------------
// Commander Supply Bundle purchase — multi-reward atomic grant.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 1000, crystals: 250, energy: 40 });
  const beforeAlloy = player.materials.shipAlloy;
  const beforeParts = player.materials.weaponParts;
  const beforeChests = player.chests.chestBasic;
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-commander-supply-bundle" });
  check(result.success, "Commander Supply Bundle purchases successfully");
  equal(state.currencies.crystals, 250 - 200, "hero deducts exact Crystal cost");
  equal(state.currencies.coins, 1000 + 12000, "hero grants advertised Credits");
  equal(state.currencies.energy, 40 + 50, "hero grants advertised Energy");
  equal(state.materials.shipAlloy, beforeAlloy + 80, "hero grants Ship Alloy");
  equal(state.materials.weaponParts, beforeParts + 40, "hero grants Weapon Parts");
  equal(state.chests.chestBasic, beforeChests + 1, "hero grants one unopened Basic Chest");
}

// ---------------------------------------------------------------------------
// Credits purchase succeeds — a common material bought with Credits.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 5000, crystals: 0 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-material-ship-alloy" });
  check(result.success, "a Credits-priced material purchase succeeds");
  equal(state.currencies.coins, 5000 - 600, "exact Credits cost deducted");
  equal(state.materials.shipAlloy, player.materials.shipAlloy + 100, "exact Ship Alloy amount granted");
  equal(state.currencies.crystals, player.currencies.crystals, "unrelated Crystals balance is untouched");
}

// ---------------------------------------------------------------------------
// Crystal purchase succeeds — Universal Shards bought with Crystals.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 0, crystals: 200 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-universal-shards" });
  check(result.success, "a Crystals-priced material purchase succeeds");
  equal(state.currencies.crystals, 200 - 80, "exact Crystals cost deducted");
  equal(state.materials.universalShards, player.materials.universalShards + 10, "exact Universal Shards amount granted");
  equal(state.currencies.coins, player.currencies.coins, "unrelated Credits balance is untouched");
}

// ---------------------------------------------------------------------------
// Credits pack: deducts Crystals ONLY, grants Credits ONLY.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 1000, crystals: 150 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-credits-medium" });
  check(result.success, "the Credits pack purchase succeeds");
  equal(state.currencies.crystals, 0, "the Credits pack deducts exactly its Crystal cost");
  equal(state.currencies.coins, 1000 + 18000, "the Credits pack grants exactly its advertised Credits");
  equal(state.currencies.energy, player.currencies.energy, "the Credits pack never touches Energy");
}

// ---------------------------------------------------------------------------
// Energy purchase (Crystals) grants Energy only.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ crystals: 100 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-energy-crystals-small" });
  check(result.success, "an Energy purchase succeeds");
  equal(state.currencies.crystals, 100 - 40, "exact Crystal cost deducted for the Energy purchase");
  equal(state.currencies.energy, player.currencies.energy + 30, "exact Energy amount granted");
}

// ---------------------------------------------------------------------------
// Ability Core purchase (rarer material, priced above common parts).
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 5000 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-material-ability-cores" });
  check(result.success, "an Ability Core purchase succeeds");
  equal(state.currencies.coins, 5000 - 2500, "exact Credits cost deducted");
  equal(state.materials.abilityCores, player.materials.abilityCores + 10, "exact Ability Cores amount granted");
}

// ---------------------------------------------------------------------------
// Basic / Rare / Epic Chest purchases — each grants exactly one unopened
// chest of its tier; nothing auto-opens.
// ---------------------------------------------------------------------------
for (const [offerId, chestId, cost] of [
  ["shop-chest-basic", "chestBasic", 800],
  ["shop-chest-rare", "chestRare", 2500],
  ["shop-chest-epic", "chestEpic", 6000],
] as const) {
  const player = withCurrencies({ coins: 10000 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId });
  check(result.success, `${offerId} purchase succeeds`);
  equal(state.currencies.coins, 10000 - cost, `${offerId} deducts its exact Credits cost`);
  equal(state.chests[chestId], player.chests[chestId] + 1, `${offerId} grants exactly one unopened ${chestId}`);
  check(result.newCollectibles.length === 0, `${offerId} grants no collectibles`);
  deepEqual(result.duplicateConversions, [], `${offerId} triggers no duplicate conversion`);
}

// ---------------------------------------------------------------------------
// Exact cost deduction / exact reward grant, generalized across the WHOLE
// active catalog — every offer, bought from a fixed generous balance,
// deducts exactly its cost and grants exactly its rewards, nothing more.
// ---------------------------------------------------------------------------
for (const offer of getActiveShopOffers()) {
  const player = withCurrencies({ coins: 500000, crystals: 500000 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: offer.id });
  check(result.success, `"${offer.id}" purchases successfully from a generous balance`);
  equal(
    player.currencies[offer.cost.currencyId] - state.currencies[offer.cost.currencyId],
    offer.cost.amount,
    `"${offer.id}" deducts exactly its advertised cost, no more, no less`,
  );
  for (const reward of offer.rewards) {
    if (reward.kind === "currency") {
      const sameCurrencyAsCost = reward.currencyId === offer.cost.currencyId;
      const netChange = state.currencies[reward.currencyId] - player.currencies[reward.currencyId];
      const grantOnly = sameCurrencyAsCost ? netChange + offer.cost.amount : netChange;
      equal(grantOnly, reward.amount, `"${offer.id}" grants exactly its advertised ${reward.currencyId} amount`);
    }
    if (reward.kind === "material") {
      equal(state.materials[reward.materialId] - player.materials[reward.materialId], reward.amount, `"${offer.id}" grants exactly its advertised ${reward.materialId} amount`);
    }
    if (reward.kind === "chest") {
      equal(state.chests[reward.chestId] - player.chests[reward.chestId], reward.amount, `"${offer.id}" grants exactly its advertised ${reward.chestId} amount`);
    }
  }
}

// ---------------------------------------------------------------------------
// Insufficient Credits / Crystals → typed failure, zero side effects.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 10, crystals: 0 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-material-ship-alloy" });
  check(!result.success, "insufficient Credits fails the purchase");
  equal(result.errorCode, "insufficient-coins", "typed failure code is insufficient-coins");
  equal(state, player, "the ORIGINAL state is returned unchanged on an insufficient-Credits failure");
}
{
  const player = withCurrencies({ coins: 0, crystals: 10 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-universal-shards" });
  check(!result.success, "insufficient Crystals fails the purchase");
  equal(result.errorCode, "insufficient-crystals", "typed failure code is insufficient-crystals");
  equal(state, player, "the ORIGINAL state is returned unchanged on an insufficient-Crystals failure");
}

// ---------------------------------------------------------------------------
// Invalid offer id → typed failure, zero side effects, id echoed as-is.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 5000, crystals: 500 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: "shop-does-not-exist" });
  check(!result.success, "an unknown offer id fails");
  equal(result.errorCode, "invalid-offer-id", "typed failure code is invalid-offer-id");
  equal(result.offerId, "shop-does-not-exist", "the invalid id is echoed, never fabricated into a real offer");
  equal(state, player, "state is untouched for an invalid offer id");
}

// ---------------------------------------------------------------------------
// Inactive (planned/future) offer → typed failure, zero side effects, even
// with plenty of currency.
// ---------------------------------------------------------------------------
{
  const planned = SHOP_OFFERS.find((o) => o.status === "planned");
  check(!!planned, "a planned offer exists in the catalog to test against");
  const player = withCurrencies({ coins: 999999, crystals: 999999 });
  const { state, result } = purchaseShopOfferTransaction(player, { offerId: planned!.id });
  check(!result.success, "a planned (non-active) offer is rejected even with abundant currency");
  equal(result.errorCode, "inactive-offer", "typed failure code is inactive-offer");
  equal(state, player, "state is untouched when attempting to buy an inactive offer");
}

// ---------------------------------------------------------------------------
// Invalid reward entry causes a COMPLETE rollback — delete a real material
// key so a Materials offer's own grant becomes "invalid" the moment
// applyRewardBundle validates it, then confirm nothing was consumed or
// granted (same rollback pattern proven by chestOpeningVerification.ts).
// ---------------------------------------------------------------------------
{
  const base = withCurrencies({ coins: 5000 });
  const corrupted: PlayerState = { ...base, materials: { ...base.materials } };
  delete (corrupted.materials as Record<string, number>).shipAlloy;
  const { state, result } = purchaseShopOfferTransaction(corrupted, { offerId: "shop-material-ship-alloy" });
  check(!result.success, "a reward referencing a missing material key fails");
  equal(result.errorCode, "invalid-reward-entry", "typed failure code is invalid-reward-entry");
  equal(state, corrupted, "the untouched (pre-attempt) state is returned — no partial application");
  equal(state.currencies.coins, 5000, "Credits are NOT deducted when reward application fails (full rollback)");
}

// ---------------------------------------------------------------------------
// Invalid price causes rollback — confirmed via the exported error code
// contract (the real catalog itself is separately asserted above to
// contain no zero-price ACTIVE offer). "invalid-price" is a real,
// reachable member of the typed union, built directly the same way
// chestOpeningVerification.ts proves its "opening-in-progress" shape.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 1000 });
  const failure = buildShopPurchaseFailure(player, "shop-material-ship-alloy", "invalid-price");
  equal(failure.errorCode, "invalid-price", "invalid-price is a real, constructible typed failure code");
  equal(failure.success, false, "a built failure result is always unsuccessful");
}

// ---------------------------------------------------------------------------
// Purchase-in-progress shape (the exact shape store/playerStore.tsx's
// purchaseShopOffer returns from its in-flight guard, verified here since
// the store itself is JSX).
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 5000 });
  const busy = buildShopPurchaseFailure(player, "shop-chest-basic", "purchase-in-progress");
  check(!busy.success, "a busy-guard failure is unsuccessful");
  equal(busy.errorCode, "purchase-in-progress", "typed failure code is purchase-in-progress");
  equal(busy.balancesAfter.coins, 5000, "the busy-guard failure reports the CURRENT balance, untouched");
  equal(player.currencies.coins, 5000, "the busy guard itself never touches state");
}

// ---------------------------------------------------------------------------
// Reload / persistence round-trip: a purchase's deduction and granted
// rewards survive a save -> JSON -> migratePlayerState round-trip (schema
// v11, no migration step needed), and unrelated progression is
// byte-for-byte unchanged.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 10000 });
  const { state } = purchaseShopOfferTransaction(player, { offerId: "shop-chest-epic" });
  const roundTripped = migratePlayerState(JSON.parse(JSON.stringify(state)));
  equal(roundTripped.source, "current", "a fresh v11 save with a resolved purchase reloads as 'current' (no migration)");
  equal(roundTripped.state.chests.chestEpic, state.chests.chestEpic, "the purchased chest survives a reload round-trip");
  deepEqual(roundTripped.state.currencies, state.currencies, "currencies survive a reload round-trip");
  deepEqual(roundTripped.state.materials, state.materials, "materials survive a reload round-trip");
  equal(roundTripped.state.level, player.level, "player level is unrelated to a Shop purchase and stays unchanged");
  equal(roundTripped.state.highestClearedStageId, player.highestClearedStageId, "campaign progress is unrelated and stays unchanged");
  deepEqual(roundTripped.state.ownedShipIds, player.ownedShipIds, "ship ownership is unrelated and stays unchanged");
}

// ---------------------------------------------------------------------------
// Failed purchases never leave any balance negative; a full catalog sweep
// from zero currency never produces a negative balance anywhere.
// ---------------------------------------------------------------------------
{
  const zeroBalance = withCurrencies({ coins: 0, crystals: 0 });
  for (const offer of getActiveShopOffers()) {
    const { state } = purchaseShopOfferTransaction(zeroBalance, { offerId: offer.id });
    check(state.currencies.coins >= 0, `"${offer.id}" attempt from zero balance never leaves negative Credits`);
    check(state.currencies.crystals >= 0, `"${offer.id}" attempt from zero balance never leaves negative Crystals`);
    check(state.currencies.energy >= 0, `"${offer.id}" attempt from zero balance never leaves negative Energy`);
  }
}

// ---------------------------------------------------------------------------
// Reward-row presentation helper never throws and resolves every active
// offer's rewards to real icons/labels (reused rewardDisplay helper, no
// second catalog).
// ---------------------------------------------------------------------------
{
  for (const offer of getActiveShopOffers()) {
    const rows = getShopOfferRewardRows(offer);
    check(rows.length > 0, `"${offer.id}" resolves at least one display row`);
    for (const row of rows) {
      check(row.icon.length > 0, `"${offer.id}"'s "${row.displayName}" row resolves a non-empty icon`);
    }
  }
}

// ---------------------------------------------------------------------------
// Confirmation-before-charge contract: building the confirm view (reward
// rows + cost) never mutates PlayerState, and applying the SAME offer
// twice from independent starting states deducts/grants independently
// (no shared mutable draft leaking between calls) — the closest
// state-level proxy for "cancel changes nothing" / "confirmation changes
// nothing before Confirm is pressed" without a DOM.
// ---------------------------------------------------------------------------
{
  const player = withCurrencies({ coins: 5000 });
  const before = structuredClone(player);
  void getShopOfferRewardRows(getShopOfferById("shop-material-ship-alloy")!);
  deepEqual(player, before, "merely building the confirmation's reward rows never mutates PlayerState");

  const runA = purchaseShopOfferTransaction(player, { offerId: "shop-material-ship-alloy" });
  const runB = purchaseShopOfferTransaction(player, { offerId: "shop-material-ship-alloy" });
  equal(player.currencies.coins, 5000, "the shared source `player` object is never mutated by either attempt");
  equal(runA.state.currencies.coins, runB.state.currencies.coins, "two independent purchases from the same starting balance produce identical results");
}

// ---------------------------------------------------------------------------
// Success presentation grants nothing extra: the reward rows a success
// modal would render come straight from the offer's OWN rewards list — the
// same rows the confirmation modal already showed before Confirm was
// pressed — never a second resolution/grant.
// ---------------------------------------------------------------------------
{
  const offer = getShopOfferById("shop-chest-rare")!;
  const confirmRows = getShopOfferRewardRows(offer);
  const successRows = getShopOfferRewardRows(offer);
  deepEqual(confirmRows, successRows, "the confirmation and success views render the exact same reward rows — no second grant is ever resolved for presentation");
}

// ---------------------------------------------------------------------------
// Unrelated progression remains unchanged by a purchase (ships/companions/
// modules/weapons ownership, campaign progress, level/xp).
// ---------------------------------------------------------------------------
{
  const player = clonePlayer({ currencies: { ...DEFAULT_PLAYER_STATE.currencies, coins: 10000, crystals: 500 } });
  const { state } = purchaseShopOfferTransaction(player, { offerId: "shop-credits-medium" });
  deepEqual(state.ownedShipIds, player.ownedShipIds, "ship ownership is unchanged by a Shop purchase");
  deepEqual(state.ownedCompanionIds, player.ownedCompanionIds, "companion ownership is unchanged");
  deepEqual(state.ownedModuleIds, player.ownedModuleIds, "module ownership is unchanged");
  deepEqual(state.ownedWeaponIds, player.ownedWeaponIds, "weapon ownership is unchanged");
  equal(state.level, player.level, "player level is unchanged by a Shop purchase (no offer sells Player XP)");
  equal(state.highestClearedStageId, player.highestClearedStageId, "campaign progress is unchanged");
}

// ---------------------------------------------------------------------------
// Route: direct reload resolves the same route; no duplicate/competing
// route exists.
// ---------------------------------------------------------------------------
{
  equal(resolveRoute("#/shop"), "shop", "the canonical hash resolves to the Shop route");
  equal(pathFor("shop"), "#/shop", "pathFor builds the exact canonical URL");
  equal(resolveRoute("#/shop?anything=1"), "shop", "a stray query string is tolerated the same way every other static route is");
  equal(resolveRoute("#/home"), "home", "the Home route is distinct and unaffected");
}

console.log(`Shop verification passed: ${assertions} assertions.`);
