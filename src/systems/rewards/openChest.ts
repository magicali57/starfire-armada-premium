import type { ChestId, PlayerState, RandomSource, ResolvedReward, RewardEntry, RewardRarity } from "@/types";
import { CHEST_REWARD_TABLES } from "@/data/chestRewards";
import { CHEST_LABEL } from "@/data/playerProfile";
import { CHEST_RARITY, CHEST_IDS } from "@/data/chests";
import { rollDropTable } from "./resolveRewards";
import { applyRewardBundle } from "./applyRewards";

// The ONE canonical Chest Opening transaction. Consumes exactly one owned
// chest and applies its resolved rewards through the existing atomic
// applyRewardBundle (the same function battle completion uses) — never a
// second reward-application path, never a second duplicate-conversion
// rule. Pure state-in/state-out, like completeCampaignStage — the store
// wraps this in its own single persist pass (see
// store/playerStore.tsx's openChest action). Nothing here calls
// Math.random directly; all randomness flows through the injected
// RandomSource.

export type ChestOpeningErrorCode =
  | "invalid-chest-id"
  | "no-chest-owned"
  | "invalid-reward-table"
  | "invalid-reward-entry"
  | "persistence-failure"
  | "opening-in-progress";

export interface ChestOpeningResult {
  success: boolean;
  /** Unique per attempt — a fresh id every time openChestTransaction runs,
   *  even for a failed attempt or a repeat Open on the same chest type. */
  openingId: string;
  /** Echoes exactly what was requested, even when invalid — never
   *  fabricated into a valid id. */
  chestId: string;
  chestDisplayName: string;
  chestRarity: RewardRarity;
  /** The exact table roll, pre-duplicate-conversion, with rarity/
   *  provenance — used for reveal ordering/rarity treatment. */
  resolvedRewards: ResolvedReward[];
  /** What was actually committed to PlayerState (duplicates already
   *  replaced by their conversion entry) — same length/order as
   *  `resolvedRewards`, since chests never grant Player XP (no extra
   *  level-up entries are ever appended by applyRewardBundle here). */
  appliedRewards: RewardEntry[];
  /** The conversion entries only (a subset value-equal to some of
   *  `appliedRewards`) — flattened from applyRewardBundle's
   *  DuplicateConversion[] for direct display. */
  duplicateConversions: RewardEntry[];
  /** Collectible entries that were genuinely new (never a duplicate). */
  newCollectibles: RewardEntry[];
  /** Owned count of this chest AFTER this attempt (unchanged from before
   *  on any failure). */
  remainingChestCount: number;
  errorCode?: ChestOpeningErrorCode;
}

let openingCounter = 0;

/** Same opaque-id convention as battleSession.ts's generateBattleSessionId
 *  — a counter + Math.random for uniqueness, not reward randomness (the
 *  "no Math.random in reward resolution" rule is about WHAT gets granted,
 *  not about generating an opaque tracking id). */
export function generateOpeningId(): string {
  openingCounter += 1;
  return `chest-opening-${openingCounter}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function isChestId(value: string): value is ChestId {
  return (CHEST_IDS as readonly string[]).includes(value);
}

/** Builds a typed failure result. Exported so the store can reuse the
 *  exact same shape for its own busy/persistence-failure branches. */
export function buildChestOpeningFailure(
  state: PlayerState,
  rawChestId: string,
  errorCode: ChestOpeningErrorCode,
  openingId: string = generateOpeningId(),
): ChestOpeningResult {
  const chestId = isChestId(rawChestId) ? rawChestId : null;
  return {
    success: false,
    openingId,
    chestId: rawChestId,
    chestDisplayName: chestId ? CHEST_LABEL[chestId] : "Unknown Chest",
    chestRarity: chestId ? CHEST_RARITY[chestId] : "common",
    resolvedRewards: [],
    appliedRewards: [],
    duplicateConversions: [],
    newCollectibles: [],
    remainingChestCount: chestId ? state.chests[chestId] ?? 0 : 0,
    errorCode,
  };
}

export interface OpenChestArgs {
  chestId: string;
  randomSource: RandomSource;
  openingId?: string;
}

/**
 * Validate → resolve → apply, all inside ONE derived PlayerState:
 * 1. Validate the chest id against the canonical ChestId enum.
 * 2. Validate the player owns at least one.
 * 3. Validate the referenced chest reward table exists and rolls
 *    something.
 * 4-5. Resolve rewards from CHEST_REWARD_TABLES via the provided
 *    RandomSource (rollDropTable — the same resolver stage drops use).
 * 6-9. Deduct exactly one chest and hand the resulting draft state to
 *    applyRewardBundle, which validates every resolved entry BEFORE
 *    mutating anything and runs duplicate-collectible conversion through
 *    the one existing canonical system. On success, the returned state
 *    already reflects both the chest deduction and every reward.
 * 10-11. Returns the final state once (no partial writes) plus a typed
 *    ChestOpeningResult. On ANY failure, returns the ORIGINAL, untouched
 *    `state` — no chest is ever deducted and nothing is ever applied on a
 *    failure path.
 */
export function openChestTransaction(
  state: PlayerState,
  args: OpenChestArgs,
): { state: PlayerState; result: ChestOpeningResult } {
  const openingId = args.openingId ?? generateOpeningId();
  const rawChestId = args.chestId;

  const failure = (errorCode: ChestOpeningErrorCode) => ({
    state,
    result: buildChestOpeningFailure(state, rawChestId, errorCode, openingId),
  });

  // 1. Validate the chest id.
  if (!isChestId(rawChestId)) return failure("invalid-chest-id");
  const chestId = rawChestId;

  // 2. Validate ownership.
  const owned = state.chests[chestId] ?? 0;
  if (!Number.isFinite(owned) || owned < 1) return failure("no-chest-owned");

  // 3. Validate the referenced reward table.
  const table = CHEST_REWARD_TABLES[chestId];
  if (!table || table.length === 0) return failure("invalid-reward-table");

  // 4-5. Resolve — never Math.random directly, always through the
  // injected RandomSource.
  const resolvedRewards = rollDropTable(table, args.randomSource, 1, "chest");
  if (resolvedRewards.length === 0) return failure("invalid-reward-table");

  // 6. Deduct exactly one chest into a draft state — this draft is only
  // ever returned if step 8 (apply) also succeeds; on any apply failure
  // we return the pristine ORIGINAL `state` instead, so the deduction
  // below never survives a failed opening.
  const draftState: PlayerState = {
    ...state,
    chests: { ...state.chests, [chestId]: owned - 1 },
  };

  // 7-9. Validate + apply every resolved reward atomically, including
  // duplicate-collectible conversion, through the one existing canonical
  // applier — no second application path.
  const application = applyRewardBundle(draftState, resolvedRewards);
  if (!application.result.success) {
    // Complete rollback: nothing consumed, nothing granted.
    return failure("invalid-reward-entry");
  }

  const appliedRewards = application.result.applied.map((reward) => reward.entry);
  const duplicateConversions = application.result.duplicateConversions.map((conversion) => conversion.converted);
  const newCollectibles = appliedRewards.filter((entry) => entry.kind === "collectible");

  // 10-11. One final state, one typed success result.
  return {
    state: application.state,
    result: {
      success: true,
      openingId,
      chestId,
      chestDisplayName: CHEST_LABEL[chestId],
      chestRarity: CHEST_RARITY[chestId],
      resolvedRewards,
      appliedRewards,
      duplicateConversions,
      newCollectibles,
      remainingChestCount: application.state.chests[chestId],
    },
  };
}
