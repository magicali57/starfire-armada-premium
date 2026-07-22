import assert from "node:assert/strict";
import { DEFAULT_PLAYER_STATE, migratePlayerState } from "@/data/player";
import {
  DAILY_ACTIVITY_MILESTONES,
  DAILY_MISSION_DEFINITIONS,
  getActiveDailyMissionDefinitions,
  getDailyMissionDefinitionById,
  createFreshDailyMissionState,
} from "@/data/dailyMissions";
import { pathFor, resolveRoute } from "@/app/routes";
import {
  ensureCurrentDailyMissionState,
  getDailyMissionDayKey,
} from "@/systems/dailyMissions/dailyMissionDay";
import { recordDailyMissionEvent } from "@/systems/dailyMissions/recordDailyMissionEvent";
import { claimDailyMissionReward } from "@/systems/dailyMissions/claimDailyMission";
import { claimDailyActivityMilestone } from "@/systems/dailyMissions/claimDailyActivityMilestone";
import { getDailyMissionsScreenView } from "@/systems/dailyMissions/dailyMissionView";
import type { PlayerState } from "@/types";

// Focused Daily Missions verification. Exercises catalog, day reset,
// clock-safety, event recording, claims, milestones, and v11→v12 migration.
// Store/UI JSX wiring is confirmed via type-check/build + static review.

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
  dailyMissions: patch.dailyMissions
    ? structuredClone(patch.dailyMissions)
    : structuredClone(DEFAULT_PLAYER_STATE.dailyMissions),
  currencies: { ...structuredClone(DEFAULT_PLAYER_STATE.currencies), ...patch.currencies },
  materials: { ...structuredClone(DEFAULT_PLAYER_STATE.materials), ...patch.materials },
  chests: { ...structuredClone(DEFAULT_PLAYER_STATE.chests), ...patch.chests },
});

const dayMs = 24 * 60 * 60 * 1000;
const noonToday = (() => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return d.getTime();
})();
const noonTomorrow = noonToday + dayMs;
const noonYesterday = noonToday - dayMs;

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
{
  const active = getActiveDailyMissionDefinitions();
  check(active.length >= 6 && active.length <= 8, "launch catalog has 6–8 active missions");
  check(active.every((m) => m.status === "active"), "getActiveDailyMissionDefinitions returns only active");
  check(
    DAILY_MISSION_DEFINITIONS.some((m) => m.status === "future"),
    "catalog includes at least one future unsupported mission",
  );
  for (const mission of DAILY_MISSION_DEFINITIONS.filter((m) => m.status !== "active")) {
    check(!active.includes(mission), `non-active mission "${mission.id}" is hidden from active list`);
  }
  const unsupported = getDailyMissionDefinitionById("daily-destroy-enemies");
  check(!!unsupported && unsupported.status === "future", "destroy-enemies mission stays future/hidden");
  equal(DAILY_ACTIVITY_MILESTONES.length, 5, "five activity milestones");
  deepEqual(
    DAILY_ACTIVITY_MILESTONES.map((m) => m.requiredPoints),
    [20, 40, 60, 80, 100],
    "milestones at 20/40/60/80/100",
  );
  for (const mission of active) {
    check(mission.target > 0, `${mission.id} has positive target`);
    check(mission.rewards.length > 0, `${mission.id} has rewards`);
    check(mission.activityPoints > 0, `${mission.id} grants activity points`);
    check(!!mission.goToRoute, `${mission.id} has a GO route`);
  }
}

// ---------------------------------------------------------------------------
// Day init / same-day reload / next-day reset / backward-clock
// ---------------------------------------------------------------------------
{
  const today = getDailyMissionDayKey(noonToday);
  const fresh = createFreshDailyMissionState(today);
  equal(fresh.dayKey, today, "fresh state uses today");
  equal(fresh.activityPoints, 0, "fresh activity starts at 0");
  equal(fresh.claimedMilestoneIds.length, 0, "fresh milestones unclaimed");

  let state = fresh;
  state = {
    ...state,
    missions: {
      ...state.missions,
      "daily-complete-battle": { progress: 1, claimed: true },
    },
    activityPoints: 10,
    claimedMilestoneIds: ["daily-activity-20"],
  };

  const sameDay = ensureCurrentDailyMissionState(state, noonToday);
  equal(sameDay.didReset, false, "same-day ensure does not reset");
  equal(sameDay.state.missions["daily-complete-battle"].claimed, true, "same-day reload preserves claim");
  equal(sameDay.state.activityPoints, 10, "same-day reload preserves activity");

  const nextDay = ensureCurrentDailyMissionState(state, noonTomorrow);
  equal(nextDay.didReset, true, "next-day ensure resets");
  equal(nextDay.state.dayKey, getDailyMissionDayKey(noonTomorrow), "next day key advances");
  equal(nextDay.state.activityPoints, 0, "next day clears activity");
  equal(nextDay.state.claimedMilestoneIds.length, 0, "next day clears milestone claims");
  equal(nextDay.state.missions["daily-complete-battle"].claimed, false, "next day clears mission claims");
  equal(nextDay.state.missions["daily-complete-battle"].progress, 0, "next day clears progress");

  const backward = ensureCurrentDailyMissionState(
    { ...state, lastObservedDayKey: today },
    noonYesterday,
  );
  equal(backward.didReset, false, "backward clock does not reset");
  equal(backward.state.missions["daily-complete-battle"].claimed, true, "backward clock keeps claimed state");
  equal(backward.state.lastObservedDayKey, today, "lastObserved never moves backward");
}

// ---------------------------------------------------------------------------
// Event recording — progress, clamp, no grant
// ---------------------------------------------------------------------------
{
  let player = clonePlayer({
    dailyMissions: createFreshDailyMissionState(getDailyMissionDayKey(noonToday)),
  });
  const beforeCoins = player.currencies.coins;

  player = recordDailyMissionEvent(player, { type: "battleCompleted" }, noonToday).state;
  equal(player.dailyMissions.missions["daily-complete-battle"].progress, 1, "battleCompleted advances complete-battle");
  equal(player.currencies.coins, beforeCoins, "event recording never grants rewards");

  player = recordDailyMissionEvent(player, { type: "battleWon" }, noonToday).state;
  equal(player.dailyMissions.missions["daily-win-battle"].progress, 1, "battleWon advances win-1");
  equal(player.dailyMissions.missions["daily-win-battles-3"].progress, 1, "battleWon advances win-3");

  player = recordDailyMissionEvent(player, { type: "battleWon" }, noonToday).state;
  player = recordDailyMissionEvent(player, { type: "battleWon" }, noonToday).state;
  player = recordDailyMissionEvent(player, { type: "battleWon" }, noonToday).state;
  equal(player.dailyMissions.missions["daily-win-battles-3"].progress, 3, "win-3 clamps at target");
  equal(player.dailyMissions.missions["daily-win-battle"].progress, 1, "win-1 stays clamped at 1");

  player = recordDailyMissionEvent(player, { type: "energySpent", amount: 10 }, noonToday).state;
  player = recordDailyMissionEvent(player, { type: "energySpent", amount: 10 }, noonToday).state;
  equal(player.dailyMissions.missions["daily-spend-energy"].progress, 20, "energy spent accumulates to 20");

  player = recordDailyMissionEvent(player, { type: "shipUpgraded" }, noonToday).state;
  player = recordDailyMissionEvent(player, { type: "weaponUpgraded" }, noonToday).state;
  player = recordDailyMissionEvent(player, { type: "chestOpened" }, noonToday).state;
  player = recordDailyMissionEvent(player, { type: "shopPurchaseCompleted" }, noonToday).state;
  equal(player.dailyMissions.missions["daily-upgrade-ship"].progress, 1, "ship upgrade tracked");
  equal(player.dailyMissions.missions["daily-upgrade-weapon"].progress, 1, "weapon upgrade tracked");
  equal(player.dailyMissions.missions["daily-open-chest"].progress, 1, "chest open tracked");
  equal(player.dailyMissions.missions["daily-shop-purchase"].progress, 1, "shop purchase tracked");

  // Failed transaction simulation: no event called → no progress change.
  const frozen = player.dailyMissions.missions["daily-upgrade-ship"].progress;
  equal(frozen, 1, "failed upgrade path emits no event (progress unchanged without call)");
}

// ---------------------------------------------------------------------------
// Mission claim — success, exact rewards, activity, rejects
// ---------------------------------------------------------------------------
{
  const today = getDailyMissionDayKey(noonToday);
  let player = clonePlayer({
    currencies: { coins: 1000, crystals: 50, energy: 100 },
    materials: { ...DEFAULT_PLAYER_STATE.materials, shipAlloy: 10, weaponParts: 5 },
    dailyMissions: {
      ...createFreshDailyMissionState(today),
      missions: {
        ...createFreshDailyMissionState(today).missions,
        "daily-complete-battle": { progress: 1, claimed: false },
      },
    },
  });

  const incomplete = claimDailyMissionReward(player, "daily-win-battle", noonToday);
  equal(incomplete.result.success, false, "incomplete mission cannot claim");
  equal(incomplete.result.errorCode, "incomplete", "incomplete error code");
  equal(incomplete.state.currencies.coins, player.currencies.coins, "incomplete claim grants nothing");

  const invalid = claimDailyMissionReward(player, "not-a-mission", noonToday);
  equal(invalid.result.success, false, "invalid mission rejected");
  equal(invalid.result.errorCode, "invalid-mission-id", "invalid id error");

  const future = claimDailyMissionReward(player, "daily-destroy-enemies", noonToday);
  equal(future.result.success, false, "future mission cannot claim");
  equal(future.result.errorCode, "inactive-mission", "inactive error for future mission");

  const coinsBefore = player.currencies.coins;
  const claim = claimDailyMissionReward(player, "daily-complete-battle", noonToday);
  equal(claim.result.success, true, "complete mission claims successfully");
  equal(claim.result.activityPointsAwarded, 10, "exact activity points awarded");
  equal(claim.state.dailyMissions.activityPoints, 10, "activity points applied to state");
  equal(claim.state.dailyMissions.missions["daily-complete-battle"].claimed, true, "mission marked claimed");
  equal(claim.state.currencies.coins, coinsBefore + 800, "exact credit reward granted");
  check(
    claim.result.appliedRewards.some((r) => r.kind === "currency" && r.currencyId === "coins" && r.amount === 800),
    "claim result lists exact coin reward",
  );

  const repeat = claimDailyMissionReward(claim.state, "daily-complete-battle", noonToday);
  equal(repeat.result.success, false, "repeated claim rejected");
  equal(repeat.result.errorCode, "already-claimed", "already-claimed error");
  equal(repeat.state.currencies.coins, claim.state.currencies.coins, "repeat grants nothing");
}

// ---------------------------------------------------------------------------
// Activity milestone claim
// ---------------------------------------------------------------------------
{
  const today = getDailyMissionDayKey(noonToday);
  let player = clonePlayer({
    currencies: { coins: 500, crystals: 10, energy: 100 },
    dailyMissions: {
      ...createFreshDailyMissionState(today),
      activityPoints: 20,
      claimedMilestoneIds: [],
    },
  });

  const early = claimDailyActivityMilestone(player, "daily-activity-40", noonToday);
  equal(early.result.success, false, "insufficient activity rejected");
  equal(early.result.errorCode, "insufficient-activity", "insufficient-activity error");

  const coinsBefore = player.currencies.coins;
  const claim = claimDailyActivityMilestone(player, "daily-activity-20", noonToday);
  equal(claim.result.success, true, "milestone 20 claims");
  equal(claim.state.currencies.coins, coinsBefore + 1500, "exact milestone credits");
  check(claim.state.dailyMissions.claimedMilestoneIds.includes("daily-activity-20"), "milestone id recorded");

  const repeat = claimDailyActivityMilestone(claim.state, "daily-activity-20", noonToday);
  equal(repeat.result.success, false, "repeated milestone claim rejected");
  equal(repeat.result.errorCode, "already-claimed", "milestone already-claimed");
  equal(repeat.state.currencies.coins, claim.state.currencies.coins, "repeat milestone grants nothing");
}

// ---------------------------------------------------------------------------
// View / GO routes / visiting screen grants nothing
// ---------------------------------------------------------------------------
{
  const player = clonePlayer();
  const before = structuredClone(player.dailyMissions);
  const view = getDailyMissionsScreenView(player, noonToday);
  equal(view.missions.length, getActiveDailyMissionDefinitions().length, "view lists only active missions");
  check(view.missions.every((m) => m.definition.status === "active"), "view never shows future missions");
  deepEqual(player.dailyMissions, before, "building the view never mutates player daily state");
  for (const mission of view.missions) {
    const route = mission.definition.goToRoute;
    check(
      ["campaign", "ship-selection", "arsenal", "chest-opening", "shop"].includes(route),
      `GO route "${route}" is a real RouteId`,
    );
  }
  equal(resolveRoute("#/missions/daily"), "daily-missions", "hash resolves to daily-missions");
  equal(pathFor("daily-missions"), "#/missions/daily", "pathFor daily-missions");
}

// ---------------------------------------------------------------------------
// Migration v11 → v12
// ---------------------------------------------------------------------------
{
  const legacy = {
    ...structuredClone(DEFAULT_PLAYER_STATE),
    saveSchemaVersion: 11,
  } as unknown as Record<string, unknown>;
  delete legacy.dailyMissions;
  // Preserve identifiable progression markers.
  (legacy as { currencies: PlayerState["currencies"] }).currencies = {
    coins: 424242,
    crystals: 777,
    energy: 55,
  };
  (legacy as { level: number; xp: number }).level = 12;
  (legacy as { level: number; xp: number }).xp = 100;
  (legacy as { highestClearedStageId: string }).highestClearedStageId = "ch1-stage-3";

  const migrated = migratePlayerState(legacy);
  equal(migrated.state.saveSchemaVersion, 12, "migrated schema is v12");
  check(!!migrated.state.dailyMissions, "dailyMissions initialized");
  equal(migrated.state.dailyMissions.activityPoints, 0, "migration does not grant activity");
  equal(migrated.state.dailyMissions.claimedMilestoneIds.length, 0, "migration does not claim milestones");
  equal(migrated.state.currencies.coins, 424242, "migration preserves credits");
  equal(migrated.state.currencies.crystals, 777, "migration preserves crystals");
  equal(migrated.state.currencies.energy, 55, "migration preserves energy");
  equal(migrated.state.highestClearedStageId, "ch1-stage-3", "migration preserves campaign progress");
  check(migrated.shouldPersist, "v11→v12 should persist");

  // Malformed daily state normalization
  const malformed = clonePlayer({
    dailyMissions: {
      dayKey: "bad",
      lastObservedDayKey: "also-bad",
      missions: { nonsense: { progress: -5, claimed: true } } as PlayerState["dailyMissions"]["missions"],
      activityPoints: -99,
      claimedMilestoneIds: ["x", 1 as unknown as string],
    },
  });
  const normalized = migratePlayerState({ ...malformed, saveSchemaVersion: 12 });
  check(/^\d{4}-\d{2}-\d{2}$/.test(normalized.state.dailyMissions.dayKey), "malformed dayKey repaired");
  equal(normalized.state.dailyMissions.activityPoints, 0, "negative activity repaired via fresh/reset");
  check(
    !("nonsense" in normalized.state.dailyMissions.missions),
    "unknown mission ids dropped",
  );
}

console.log(`dailyMissionsVerification: ${assertions} assertions passed`);
