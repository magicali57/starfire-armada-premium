import type {
  BattleCompletionSummary,
  PlayerState,
  RandomSource,
  RewardDifficulty,
} from "@/types";
import { CAMPAIGN_STAGES, getStageById } from "@/data/campaign";
import { getStageRewardDefinition } from "@/data/stageRewards";
import { resolveStageRewards } from "./resolveRewards";
import { applyRewardBundle } from "./applyRewards";
import { productionRandomSource } from "./randomSource";

// The single integration point future battle-completion flows call. Pure
// state-in/state-out (the store wraps it in its usual atomic update+persist
// pass). Not yet called from gameplay — the existing Results screen keeps
// its current disclosed prototype behavior until a real Victory flow is
// wired, which will call the store's completeCampaignStage action.

export interface CompleteCampaignStageArgs {
  stageId: string;
  result: "victory" | "defeat";
  difficulty?: RewardDifficulty;
  performance?: {
    noDamage?: boolean;
    remainingHpPercent?: number;
    completionTime?: number;
    enemiesDestroyed?: number;
    score?: number;
    starsEarned?: number;
  };
  randomSource?: RandomSource;
}

/** Ordinal position of a stage in the canonical campaign order (linear
 *  progression), or -1 for unknown stages. */
function stageOrderIndex(stageId: string): number {
  return CAMPAIGN_STAGES.findIndex((stage) => stage.id === stageId);
}

/**
 * First-clear truth comes from the existing campaign completion state
 * (PlayerState.highestClearedStageId — linear progression), never from a UI
 * flag: a stage counts as cleared iff it is at or before the highest
 * cleared stage.
 */
export function isStageCleared(state: PlayerState, stageId: string): boolean {
  if (state.highestClearedStageId === null) return false;
  const target = stageOrderIndex(stageId);
  const highest = stageOrderIndex(state.highestClearedStageId);
  return target !== -1 && highest !== -1 && target <= highest;
}

/**
 * Validates victory, determines first-clear from campaign state, resolves
 * and atomically applies rewards, then advances campaign progression when
 * this victory cleared the next stage in line. Defeats and unknown stages
 * grant nothing and change nothing. First-clear bundles can never be
 * claimed twice: once highestClearedStageId covers a stage, every later
 * victory resolves as a repeat clear.
 */
export function applyCompleteCampaignStage(
  state: PlayerState,
  args: CompleteCampaignStageArgs,
): { state: PlayerState; summary: BattleCompletionSummary } {
  const noReward = (victory: boolean): { state: PlayerState; summary: BattleCompletionSummary } => ({
    state,
    summary: {
      stageId: args.stageId,
      victory,
      firstClear: false,
      bundle: null,
      application: null,
      stageMarkedCleared: false,
    },
  });

  // No rewards on defeat, ever.
  if (args.result !== "victory") return noReward(false);

  const stage = getStageById(args.stageId);
  const definition = getStageRewardDefinition(args.stageId);
  if (!stage || !definition) return noReward(true);

  const firstClear = !isStageCleared(state, args.stageId);
  const bundle = resolveStageRewards(definition, {
    difficulty: args.difficulty ?? "normal",
    firstClear,
    random: args.randomSource ?? productionRandomSource,
    performance: args.performance,
  });

  const applied = applyRewardBundle(state, bundle.rewards);
  if (!applied.result.success) {
    // Atomic rejection — nothing was granted, progression is untouched.
    return {
      state,
      summary: {
        stageId: args.stageId,
        victory: true,
        firstClear,
        bundle,
        application: applied.result,
        stageMarkedCleared: false,
      },
    };
  }

  // Advance campaign progression only when this stage is exactly the next
  // uncleared one (linear campaign; replaying earlier stages never moves
  // the marker backwards or forwards).
  let nextState = applied.state;
  let stageMarkedCleared = false;
  if (firstClear) {
    const clearedCount =
      state.highestClearedStageId === null ? 0 : stageOrderIndex(state.highestClearedStageId) + 1;
    if (stageOrderIndex(args.stageId) === clearedCount) {
      nextState = { ...nextState, highestClearedStageId: args.stageId };
      stageMarkedCleared = true;
    }
  }

  return {
    state: nextState,
    summary: {
      stageId: args.stageId,
      victory: true,
      firstClear,
      bundle,
      application: applied.result,
      stageMarkedCleared,
    },
  };
}
