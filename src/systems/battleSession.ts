import type { BattleCompletionSummary, PlayerState, RandomSource, ResolvedReward, RewardDifficulty } from "@/types";
import { getStageById } from "@/data/campaign";
import {
  applyCompleteCampaignStage,
} from "@/systems/rewards/completeCampaignStage";
import { productionRandomSource } from "@/systems/rewards/randomSource";
import { getPlayerUnlocksAtLevel, type PlayerUnlockDefinition } from "@/systems/playerProgression";
import { CAMPAIGN_STAGES } from "@/data/campaign";

// Canonical battle-session state machine — THE single owner of battle
// lifecycle/outcome/completion truth (held in the player store provider as
// in-memory state; see store/playerStore.tsx). Frame-level combat state
// stays local to the future gameplay engine; permanent progression stays in
// the persisted PlayerState. Nothing here is written into the save (no
// schema change): rewards themselves persist through the existing atomic
// completion transaction, and first-clear truth remains
// highestClearedStageId — so a reload can never re-apply rewards even
// though the in-memory session (and its summary) is lost. Reload during an
// active battle simply returns to a session-less safe state.

export type BattleSessionStatus =
  | "idle" // no session (represented as null in the store; kept in the union for transition typing)
  | "preparing"
  | "active"
  | "paused"
  | "victory"
  | "defeat"
  | "completing"
  | "completed"
  | "results";

export type BattleOutcome = "victory" | "defeat";

/** Future-ready performance data — only fields the current gameplay
 *  genuinely provides are ever populated (today: none are mandatory; the
 *  placeholder engine passes nothing). Never fabricated. */
export interface BattlePerformance {
  score?: number;
  enemiesDestroyed?: number;
  bossesDestroyed?: number;
  remainingHp?: number;
  remainingHpPercent?: number;
  completionTimeMs?: number;
  damageTaken?: number;
  noDamage?: boolean;
  starsEarned?: number;
}

export interface BattleSessionConfig {
  stageId: string;
  difficulty?: RewardDifficulty;
  shipId: string;
  /** Injectable for deterministic verification; production uses the
   *  default unique generator. */
  sessionId?: string;
}

/** Player-progress deltas captured around the atomic completion, so the
 *  future Results UI needs no second data source. */
export interface BattleSessionCompletion {
  sessionId: string;
  stageId: string;
  difficulty: RewardDifficulty;
  outcome: BattleOutcome;
  summary: BattleCompletionSummary | null;
  previousHighestClearedStageId: string | null;
  newHighestClearedStageId: string | null;
  previousPlayerXp: number;
  newPlayerXp: number;
  previousPlayerLevel: number;
  newPlayerLevel: number;
  playerLevelsGained: number;
  unlocksEarned: PlayerUnlockDefinition[];
  /** Canonical next stage after this one (unlocked by a first clear). */
  nextStageId: string | null;
}

export interface BattleSession {
  sessionId: string;
  stageId: string;
  difficulty: RewardDifficulty;
  shipId: string;
  status: Exclude<BattleSessionStatus, "idle">;
  startedAt: number;
  outcome: BattleOutcome | null;
  performance: BattlePerformance | null;
  /** Exactly-once completion marker: set when (and only when) the
   *  completion transaction ran for this sessionId. */
  completion: BattleSessionCompletion | null;
  /** True once Energy was deducted for this session — start can never
   *  double-spend. */
  energySpent: boolean;
}

export type BattleSessionError =
  | "invalid-transition"
  | "no-session"
  | "session-mismatch"
  | "stage-mismatch"
  | "unknown-stage"
  | "insufficient-energy"
  | "already-started"
  | "already-completed"
  | "not-completed"
  | "busy";

export interface BattleSessionTransitionResult {
  ok: boolean;
  session: BattleSession | null;
  error?: BattleSessionError;
  /** Present on ok completion calls AND on already-completed rejections
   *  (returns the existing completion instead of re-running it). */
  completion?: BattleSessionCompletion | null;
}

// ---------------------------------------------------------------------------
// Energy — one canonical deduction moment: atomically when a prepared
// session successfully starts (SCREEN_NAVIGATION_MAP B-15: "Energy is
// consumed only once a battle session is successfully created"). Never on
// victory/defeat/pause/resume/Results; retry/replay create new sessions and
// spend again. Flat canonical cost matching the approved Stage Detail
// reference value.
// ---------------------------------------------------------------------------

export const BATTLE_ENERGY_COST = 10;

export function getBattleEnergyCost(_stageId: string): number {
  return BATTLE_ENERGY_COST;
}

// ---------------------------------------------------------------------------
// Transition table — centralized, explicit. Anything not listed is
// rejected without changing state (defeat→victory, completed→completing,
// idle→victory, paused→completed, results→active, …).
// ---------------------------------------------------------------------------

const LEGAL_TRANSITIONS: Record<BattleSessionStatus, readonly BattleSessionStatus[]> = {
  idle: ["preparing"],
  preparing: ["active", "idle"],
  active: ["paused", "victory", "defeat"],
  paused: ["active", "idle"],
  victory: ["completing"],
  defeat: ["completing"],
  completing: ["completed"],
  completed: ["results", "idle"],
  results: ["idle"],
};

export function canTransition(from: BattleSessionStatus, to: BattleSessionStatus): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

let sessionCounter = 0;

/** Unique per attempt: monotonic counter + random suffix + timestamp —
 *  never a timestamp alone. */
export function generateBattleSessionId(): string {
  sessionCounter += 1;
  return `battle-${sessionCounter}-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

// ---------------------------------------------------------------------------
// Pure transition helpers — every store action flows through these.
// ---------------------------------------------------------------------------

/** idle → preparing. Validates the stage exists in the canonical campaign
 *  space (the same ids completeCampaignStage uses). */
export function prepareBattleSession(
  current: BattleSession | null,
  config: BattleSessionConfig,
): BattleSessionTransitionResult {
  const currentStatus: BattleSessionStatus = current?.status ?? "idle";
  // A finished session may be replaced; an in-flight one may not.
  const replaceable = current === null || current.status === "completed" || current.status === "results";
  if (!replaceable || !canTransition(replaceable ? "idle" : currentStatus, "preparing")) {
    if (!replaceable) return { ok: false, session: current, error: "invalid-transition" };
  }
  if (!getStageById(config.stageId)) return { ok: false, session: current, error: "unknown-stage" };
  return {
    ok: true,
    session: {
      sessionId: config.sessionId ?? generateBattleSessionId(),
      stageId: config.stageId,
      difficulty: config.difficulty ?? "normal",
      shipId: config.shipId,
      status: "preparing",
      startedAt: Date.now(),
      outcome: null,
      performance: null,
      completion: null,
      energySpent: false,
    },
  };
}

/** preparing → active, atomically deducting Energy exactly once. Returns
 *  the untouched player state on ANY failure (insufficient Energy never
 *  goes negative; an already-started session never spends again). */
export function startBattleSession(
  player: PlayerState,
  session: BattleSession | null,
): { player: PlayerState; result: BattleSessionTransitionResult } {
  if (!session) return { player, result: { ok: false, session: null, error: "no-session" } };
  if (session.status !== "preparing" || session.energySpent) {
    return {
      player,
      result: {
        ok: false,
        session,
        error: session.energySpent ? "already-started" : "invalid-transition",
      },
    };
  }
  const cost = getBattleEnergyCost(session.stageId);
  if (player.currencies.energy < cost) {
    return { player, result: { ok: false, session, error: "insufficient-energy" } };
  }
  return {
    player: {
      ...player,
      currencies: { ...player.currencies, energy: player.currencies.energy - cost },
    },
    result: {
      ok: true,
      session: { ...session, status: "active", energySpent: true, startedAt: Date.now() },
    },
  };
}

export function pauseBattleSession(session: BattleSession | null): BattleSessionTransitionResult {
  if (!session) return { ok: false, session: null, error: "no-session" };
  if (!canTransition(session.status, "paused")) return { ok: false, session, error: "invalid-transition" };
  return { ok: true, session: { ...session, status: "paused" } };
}

export function resumeBattleSession(session: BattleSession | null): BattleSessionTransitionResult {
  if (!session) return { ok: false, session: null, error: "no-session" };
  if (session.status !== "paused") return { ok: false, session, error: "invalid-transition" };
  return { ok: true, session: { ...session, status: "active" } };
}

/**
 * active → victory|defeat, exactly once. The FIRST declared outcome wins:
 * repeated boss-death callbacks, victory-after-defeat, and
 * defeat-after-victory are all rejected without changing state (there is
 * no revival system). Combat updates must treat any non-"active" status as
 * frozen.
 */
export function declareBattleOutcome(
  session: BattleSession | null,
  outcome: BattleOutcome,
  performance?: BattlePerformance,
): BattleSessionTransitionResult {
  if (!session) return { ok: false, session: null, error: "no-session" };
  if (session.status !== "active" || !canTransition(session.status, outcome)) {
    return { ok: false, session, error: "invalid-transition" };
  }
  return {
    ok: true,
    session: { ...session, status: outcome, outcome, performance: performance ?? null },
  };
}

/**
 * victory|defeat → completing → completed, running the canonical campaign
 * completion/reward transaction EXACTLY ONCE per session. Idempotency:
 * - keyed by sessionId (caller passes the id it believes it is completing;
 *   mismatches are rejected) — never timestamps.
 * - an already-completed session returns its existing completion result
 *   ("already-completed") and applies nothing again.
 * - defeat completes WITHOUT calling the victory reward path: no rewards,
 *   no stage clear, no first-clear consumption.
 * One pure pass: validate → run completion → build summary → "completed".
 */
export function completeBattleSession(
  player: PlayerState,
  session: BattleSession | null,
  expectedSessionId: string,
  randomSource: RandomSource = productionRandomSource,
): { player: PlayerState; result: BattleSessionTransitionResult } {
  if (!session) return { player, result: { ok: false, session: null, error: "no-session" } };
  if (session.sessionId !== expectedSessionId) {
    return { player, result: { ok: false, session, error: "session-mismatch" } };
  }
  if (session.completion) {
    return {
      player,
      result: { ok: false, session, error: "already-completed", completion: session.completion },
    };
  }
  if ((session.status !== "victory" && session.status !== "defeat") || session.outcome === null) {
    return { player, result: { ok: false, session, error: "invalid-transition" } };
  }

  const previousLevel = player.level;
  const previousXp = player.xp;
  const previousHighest = player.highestClearedStageId;

  let nextPlayer = player;
  let summary: BattleCompletionSummary | null = null;

  if (session.outcome === "victory") {
    const applied = applyCompleteCampaignStage(player, {
      stageId: session.stageId,
      result: "victory",
      difficulty: session.difficulty,
      performance: session.performance ?? undefined,
      randomSource,
    });
    nextPlayer = applied.state;
    summary = applied.summary;
  }
  // Defeat: nothing applied — no rewards, no clear, no XP.

  const levelsGained = nextPlayer.level - previousLevel;
  const unlocksEarned: PlayerUnlockDefinition[] = [];
  for (let level = previousLevel + 1; level <= nextPlayer.level; level += 1) {
    unlocksEarned.push(...getPlayerUnlocksAtLevel(level));
  }

  const stageIndex = CAMPAIGN_STAGES.findIndex((stage) => stage.id === session.stageId);
  const nextStage =
    summary?.stageMarkedCleared && stageIndex !== -1 ? CAMPAIGN_STAGES[stageIndex + 1] ?? null : null;

  const completion: BattleSessionCompletion = {
    sessionId: session.sessionId,
    stageId: session.stageId,
    difficulty: session.difficulty,
    outcome: session.outcome,
    summary,
    previousHighestClearedStageId: previousHighest,
    newHighestClearedStageId: nextPlayer.highestClearedStageId,
    previousPlayerXp: previousXp,
    newPlayerXp: nextPlayer.xp,
    previousPlayerLevel: previousLevel,
    newPlayerLevel: nextPlayer.level,
    playerLevelsGained: levelsGained,
    unlocksEarned,
    nextStageId: nextStage?.id ?? null,
  };

  return {
    player: nextPlayer,
    result: {
      ok: true,
      session: { ...session, status: "completed", completion },
      completion,
    },
  };
}

/** completed → results. Rejects sessions that never completed and stale
 *  session-id mismatches (an old Results request can never alter state). */
export function enterBattleResults(
  session: BattleSession | null,
  expectedSessionId: string,
): BattleSessionTransitionResult {
  if (!session) return { ok: false, session: null, error: "no-session" };
  if (session.sessionId !== expectedSessionId) return { ok: false, session, error: "session-mismatch" };
  if (session.status !== "completed" || !session.completion) {
    return { ok: false, session, error: "not-completed" };
  }
  return { ok: true, session: { ...session, status: "results" } };
}

/** Any status → idle (null). Clears TEMPORARY session state only — never
 *  touches persisted progression. */
export function resetBattleSession(): BattleSessionTransitionResult {
  return { ok: true, session: null };
}

// ---------------------------------------------------------------------------
// Results data contract — the one selector the future Results UI consumes.
// ---------------------------------------------------------------------------

export interface BattleResultsView {
  outcome: BattleOutcome;
  sessionId: string;
  stageId: string;
  stageName: string;
  difficulty: RewardDifficulty;
  firstClear: boolean;
  performance: BattlePerformance | null;
  rewards: BattleCompletionSummary["bundle"];
  duplicateConversions: NonNullable<BattleCompletionSummary["application"]>["duplicateConversions"] | [];
  playerXpGained: number;
  previousPlayerLevel: number;
  newPlayerLevel: number;
  playerLevelsGained: number;
  unlocksEarned: PlayerUnlockDefinition[];
  /** Player-level milestone rewards crossed by this completion ONLY (the
   *  entries the atomic application tagged `source: "level-up"`) — never
   *  the stage/campaign bundle itself, and never recomputed here. Empty
   *  when playerLevelsGained is 0. Feeds PlayerLevelUpModal exclusively;
   *  ResultsScreen's own reward list continues to read `rewards`. */
  levelUpRewards: ResolvedReward[];
  nextStageId: string | null;
  /** Victory: continue/replay/return · Defeat: retry/return. */
  availableActions: ("continue" | "replay" | "retry" | "return-to-campaign")[];
}

/** Null when there is no completed/results-stage session to show — the
 *  caller should redirect safely (e.g. back to Campaign) without touching
 *  progression. */
export function getBattleResultsView(session: BattleSession | null): BattleResultsView | null {
  if (!session || !session.completion) return null;
  if (session.status !== "completed" && session.status !== "results") return null;
  const completion = session.completion;
  const stage = getStageById(session.stageId);
  const victory = completion.outcome === "victory";
  return {
    outcome: completion.outcome,
    sessionId: session.sessionId,
    stageId: session.stageId,
    stageName: stage?.name ?? session.stageId,
    difficulty: completion.difficulty,
    firstClear: completion.summary?.firstClear ?? false,
    performance: session.performance,
    rewards: completion.summary?.bundle ?? null,
    duplicateConversions: completion.summary?.application?.duplicateConversions ?? [],
    // Within-level xp resets on each level-up, so gained XP is read from
    // the resolved bundle (the authoritative award amounts), not from the
    // before/after within-level values.
    playerXpGained: victory
      ? (completion.summary?.bundle?.rewards ?? []).reduce(
          (sum, reward) => (reward.entry.kind === "playerXp" ? sum + reward.entry.amount : sum),
          0,
        )
      : 0,
    previousPlayerLevel: completion.previousPlayerLevel,
    newPlayerLevel: completion.newPlayerLevel,
    playerLevelsGained: completion.playerLevelsGained,
    unlocksEarned: completion.unlocksEarned,
    levelUpRewards:
      completion.summary?.application?.applied.filter((reward) => reward.source === "level-up") ?? [],
    nextStageId: completion.nextStageId,
    availableActions: victory
      ? completion.nextStageId
        ? ["continue", "replay", "return-to-campaign"]
        : ["replay", "return-to-campaign"]
      : ["retry", "return-to-campaign"],
  };
}
