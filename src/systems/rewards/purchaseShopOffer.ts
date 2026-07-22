import type { PlayerState, ResolvedReward, RewardEntry, RewardRarity } from "@/types";
import { getShopOfferById, type ShopCostCurrencyId } from "@/data/shopOffers";
import { applyRewardBundle } from "./applyRewards";

// The ONE canonical Shop purchase transaction — same shape as
// systems/rewards/openChest.ts's openChestTransaction (deduct into a draft
// state, then applyRewardBundle over that draft; return the original state
// untouched on ANY failure). Pure state-in/state-out; the store wraps this
// in its own single persist pass (store/playerStore.tsx's purchaseShopOffer
// action). Nothing here mutates SHOP_OFFERS or resolves randomness — Shop
// offers are fixed grants, never rolled.

export type ShopPurchaseErrorCode =
  | "invalid-offer-id"
  | "inactive-offer"
  | "invalid-price"
  | "invalid-reward-entry"
  | "insufficient-coins"
  | "insufficient-crystals"
  | "persistence-failure"
  | "purchase-in-progress";

export interface ShopPurchaseResult {
  success: boolean;
  purchaseId: string;
  offerId: string;
  offerTitle: string;
  cost: { currencyId: ShopCostCurrencyId; amount: number };
  /** What was actually committed to PlayerState (duplicates already
   *  replaced by their conversion entry, if a future offer ever contains
   *  a collectible). */
  appliedRewards: RewardEntry[];
  duplicateConversions: RewardEntry[];
  newCollectibles: RewardEntry[];
  /** Canonical balances AFTER this attempt — unchanged from before on any
   *  failure. Lets the UI show "balance after" without a second locally
   *  computed number. */
  balancesAfter: { coins: number; crystals: number; energy: number };
  errorCode?: ShopPurchaseErrorCode;
}

let purchaseCounter = 0;

/** Same opaque-id convention as generateOpeningId/generateBattleSessionId
 *  — a counter + Math.random for uniqueness only, never reward
 *  randomness (Shop offers grant fixed, never rolled, rewards). */
export function generatePurchaseId(): string {
  purchaseCounter += 1;
  return `shop-purchase-${purchaseCounter}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function balancesOf(state: PlayerState): ShopPurchaseResult["balancesAfter"] {
  return {
    coins: state.currencies.coins,
    crystals: state.currencies.crystals,
    energy: state.currencies.energy,
  };
}

/** Builds a typed failure result. Exported so the store can reuse the
 *  exact same shape for its own busy/persistence-failure branches. */
export function buildShopPurchaseFailure(
  state: PlayerState,
  offerId: string,
  errorCode: ShopPurchaseErrorCode,
  purchaseId: string = generatePurchaseId(),
): ShopPurchaseResult {
  const offer = getShopOfferById(offerId);
  return {
    success: false,
    purchaseId,
    offerId,
    offerTitle: offer?.title ?? "Unknown Offer",
    cost: offer?.cost ?? { currencyId: "coins", amount: 0 },
    appliedRewards: [],
    duplicateConversions: [],
    newCollectibles: [],
    balancesAfter: balancesOf(state),
    errorCode,
  };
}

export interface PurchaseShopOfferArgs {
  offerId: string;
  purchaseId?: string;
}

/**
 * Validate → deduct → apply, all inside ONE derived PlayerState:
 * 1. Validate the offer id resolves to a real catalog entry.
 * 2. Validate the offer is "active" (never "planned"/"future").
 * 3. Validate the cost (positive integer amount, a real cost currency).
 * 4-5. Validate the player has enough of that exact currency.
 * 6-7. Deduct the exact cost into a draft state, then hand the resolved
 *    reward bundle to applyRewardBundle, which validates every entry
 *    BEFORE mutating anything and runs duplicate-collectible conversion
 *    through the one existing canonical system.
 * 8-11. Return the final state once (no partial writes) plus a typed
 *    ShopPurchaseResult. On ANY failure, returns the ORIGINAL, untouched
 *    `state` — no cost is ever deducted and nothing is ever granted on a
 *    failure path.
 */
export function purchaseShopOfferTransaction(
  state: PlayerState,
  args: PurchaseShopOfferArgs,
): { state: PlayerState; result: ShopPurchaseResult } {
  const purchaseId = args.purchaseId ?? generatePurchaseId();

  const failure = (errorCode: ShopPurchaseErrorCode) => ({
    state,
    result: buildShopPurchaseFailure(state, args.offerId, errorCode, purchaseId),
  });

  // 1. Validate the offer id.
  const offer = getShopOfferById(args.offerId);
  if (!offer) return failure("invalid-offer-id");

  // 2. Only "active" offers are ever purchasable.
  if (offer.status !== "active") return failure("inactive-offer");

  // 3. Validate the cost itself — never a zero/negative/non-finite price,
  // and only the two real payment currencies.
  const { currencyId, amount } = offer.cost;
  if (
    (currencyId !== "coins" && currencyId !== "crystals") ||
    !Number.isFinite(amount) ||
    !Number.isInteger(amount) ||
    amount <= 0
  ) {
    return failure("invalid-price");
  }

  // 4-5. Validate the player owns enough of the exact cost currency.
  const owned = state.currencies[currencyId];
  if (!Number.isFinite(owned) || owned < amount) {
    return failure(currencyId === "coins" ? "insufficient-coins" : "insufficient-crystals");
  }

  if (offer.rewards.length === 0) return failure("invalid-reward-entry");

  // 6. Deduct the exact cost into a draft state — this draft is only ever
  // returned if step 7 (apply) also succeeds; on any apply failure we
  // return the pristine ORIGINAL `state` instead, so the deduction below
  // never survives a failed purchase.
  const draftState: PlayerState = {
    ...state,
    currencies: { ...state.currencies, [currencyId]: owned - amount },
  };

  // 7. Validate + apply every granted reward atomically, including
  // duplicate-collectible conversion (if a future offer ever grants a
  // collectible), through the one existing canonical applier.
  const resolvedRewards: ResolvedReward[] = offer.rewards.map((entry) => ({
    entry,
    source: "shop",
    rarity: offer.rarity ?? ("common" as RewardRarity),
  }));
  const application = applyRewardBundle(draftState, resolvedRewards);
  if (!application.result.success) {
    // Complete rollback: nothing spent, nothing granted.
    return failure("invalid-reward-entry");
  }

  const appliedRewards = application.result.applied.map((reward) => reward.entry);
  const duplicateConversions = application.result.duplicateConversions.map((conversion) => conversion.converted);
  const newCollectibles = appliedRewards.filter((entry) => entry.kind === "collectible");

  return {
    state: application.state,
    result: {
      success: true,
      purchaseId,
      offerId: offer.id,
      offerTitle: offer.title,
      cost: offer.cost,
      appliedRewards,
      duplicateConversions,
      newCollectibles,
      balancesAfter: balancesOf(application.state),
    },
  };
}
