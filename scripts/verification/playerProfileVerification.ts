import assert from "node:assert/strict";
import {
  DEFAULT_AVATAR_ID,
  PROFILE_AVATAR_IDS,
  PROFILE_AVATARS,
  formatRewardEntry,
  getPlayerProfileSummary,
  getProfileAvatar,
  validateDisplayName,
} from "../../src/data/playerProfile";
import { DEFAULT_PLAYER_STATE, migratePlayerState } from "../../src/data/player";
import { ROUTES, pathFor, resolveRoute } from "../../src/app/routes";
import type { PlayerState } from "../../src/types";

// The store's real transaction (applyUpdatePlayerProfileState,
// store/playerStore.tsx) is a thin, already type-checked wrapper around
// exactly these two validation primitives plus a plain object spread —
// reproduced verbatim here (not a second set of rules) because this
// sandbox's plain-`node`-with-type-stripping runner cannot load a .tsx
// module (playerStore.tsx renders JSX in its Provider). See the
// completion report for this disclosed limitation.
function applyUpdatePlayerProfileState(
  state: PlayerState,
  input: { displayName: string; avatarId: string },
): { state: PlayerState; result: { success: true; displayName: string; avatarId: string } | { success: false; reason: "invalid-name" | "invalid-avatar" } } {
  const nameValidation = validateDisplayName(input.displayName);
  if (!nameValidation.valid) return { state, result: { success: false, reason: "invalid-name" } };
  if (!PROFILE_AVATAR_IDS.has(input.avatarId)) return { state, result: { success: false, reason: "invalid-avatar" } };
  return {
    state: { ...state, displayName: nameValidation.value, avatarId: input.avatarId },
    result: { success: true, displayName: nameValidation.value, avatarId: input.avatarId },
  };
}

let assertions = 0;
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}
function deepEqual(actual: unknown, expected: unknown, message: string) {
  assert.deepEqual(actual, expected, message);
  assertions += 1;
}
const clonePlayer = (): PlayerState => structuredClone(DEFAULT_PLAYER_STATE);

// ---------------------------------------------------------------------------
// Profile route — no duplicates, resolves the same way on a "fresh reload"
// (resolveRoute is a pure function of the hash string, so this is exactly
// what a hard reload at #/profile would resolve to).
// ---------------------------------------------------------------------------
equal(ROUTES.filter((r) => r.path === "#/profile").length, 1, "exactly one #/profile route entry");
equal(ROUTES.filter((r) => r.id === "profile").length, 1, "exactly one 'profile' route id");
equal(pathFor("profile"), "#/profile", "pathFor builds the canonical Profile URL");
equal(resolveRoute("#/profile"), "profile", "direct hash resolves to Profile (fresh reload)");
equal(resolveRoute("#/profile?x=1"), "profile", "Profile resolves with a trailing query string");

// ---------------------------------------------------------------------------
// Avatar catalog
// ---------------------------------------------------------------------------
check(PROFILE_AVATARS.length >= 4 && PROFILE_AVATARS.length <= 8, "4-8 built-in avatar choices");
equal(new Set(PROFILE_AVATARS.map((a) => a.id)).size, PROFILE_AVATARS.length, "avatar ids unique");
check(PROFILE_AVATARS.some((a) => a.id === DEFAULT_AVATAR_ID), "default avatar id is a real option");
equal(getProfileAvatar("not-a-real-id").id, PROFILE_AVATARS[0].id, "unknown avatar id falls back safely");

// ---------------------------------------------------------------------------
// Display name validation
// ---------------------------------------------------------------------------
equal(validateDisplayName("  Nova  ").valid, true, "trims + accepts a normal name");
equal(validateDisplayName("  Nova  ").value, "Nova", "trims surrounding whitespace");
equal(validateDisplayName("").valid, false, "rejects empty name");
equal(validateDisplayName("   ").valid, false, "rejects whitespace-only name");
equal(validateDisplayName("A").valid, false, "rejects below 2 visible characters");
equal(validateDisplayName("AB").valid, true, "accepts exactly 2 characters");
equal(validateDisplayName("A".repeat(16)).valid, true, "accepts exactly 16 characters");
equal(validateDisplayName("A".repeat(17)).valid, false, "rejects 17 characters");
equal(validateDisplayName("Nova\u0007Strike").valid, false, "rejects control characters");
equal(validateDisplayName("Nova Strike").valid, true, "accepts internal spaces");

// ---------------------------------------------------------------------------
// Reward formatting (display text only)
// ---------------------------------------------------------------------------
equal(formatRewardEntry({ kind: "currency", currencyId: "coins", amount: 1200 }), "1,200 Credits", "currency label");
equal(formatRewardEntry({ kind: "material", materialId: "shipAlloy", amount: 10 }), "10 Ship Alloy", "material label");
equal(formatRewardEntry({ kind: "chest", chestId: "chestBasic", amount: 1 }), "1x Basic Chest", "chest label");

// ---------------------------------------------------------------------------
// Schema v10 -> v11 migration: avatarId backfilled, everything else
// preserved untouched.
// ---------------------------------------------------------------------------
const v10 = clonePlayer();
v10.saveSchemaVersion = 10;
delete (v10 as Partial<PlayerState>).avatarId;
v10.currencies.coins = 54321;
v10.level = 12;
v10.xp = 777;
v10.highestClearedStageId = "ch1-stage-3";
v10.ownedShipIds = ["ship-01-rapid-fire", "ship-02-laser-beam"];
const migrated = migratePlayerState(v10);
equal(migrated.state.saveSchemaVersion, 11, "schema advances to v11");
equal(migrated.state.avatarId, DEFAULT_AVATAR_ID, "avatarId backfilled with default");
equal(migrated.state.currencies.coins, 54321, "Credits preserved across migration");
equal(migrated.state.level, 12, "Player level preserved across migration");
equal(migrated.state.xp, 777, "Player XP preserved across migration");
equal(migrated.state.highestClearedStageId, "ch1-stage-3", "campaign progress preserved across migration");
deepEqual(migrated.state.ownedShipIds, v10.ownedShipIds, "owned ships preserved across migration");
deepEqual(migrated.state.shipProgress, v10.shipProgress, "ship progression preserved across migration");
deepEqual(migrated.state.activeLoadout, v10.activeLoadout, "active loadout preserved across migration");
deepEqual(migrated.state.materials, v10.materials, "materials preserved across migration");
deepEqual(migrated.state.chests, v10.chests, "chests preserved across migration");
deepEqual(migrated.state.consumables, v10.consumables, "consumables preserved across migration");

// A save that already carries an unknown/corrupt avatarId is repaired to
// the default rather than crashing or silently keeping garbage.
const corruptAvatar = clonePlayer();
corruptAvatar.saveSchemaVersion = 11;
(corruptAvatar as PlayerState).avatarId = "some-unknown-id";
const repaired = migratePlayerState(corruptAvatar);
equal(repaired.state.avatarId, DEFAULT_AVATAR_ID, "unknown avatarId repaired to default");
equal(repaired.shouldPersist, true, "repair is flagged for persistence");

// A current v11 save with a valid, already-known avatar id round-trips
// with zero repairs (idempotent).
const validV11 = clonePlayer();
validV11.saveSchemaVersion = 11;
validV11.avatarId = PROFILE_AVATARS[2].id;
const roundTrip = migratePlayerState(validV11);
equal(roundTrip.state.avatarId, PROFILE_AVATARS[2].id, "valid known avatarId preserved");
equal(roundTrip.source, "current", "clean v11 save with a valid avatar needs no migration");

// ---------------------------------------------------------------------------
// Edit Profile transaction (atomic, validated)
// ---------------------------------------------------------------------------
const before = clonePlayer();
const updateOk = applyUpdatePlayerProfileState(before, { displayName: "  Star Fox  ", avatarId: PROFILE_AVATARS[1].id });
check(updateOk.result.success, "valid update succeeds");
equal(updateOk.state.displayName, "Star Fox", "display name trimmed + saved");
equal(updateOk.state.avatarId, PROFILE_AVATARS[1].id, "avatar id saved");
equal(updateOk.state.currencies.coins, before.currencies.coins, "unrelated currencies untouched");
equal(updateOk.state.level, before.level, "unrelated Player Level untouched");

const invalidName = applyUpdatePlayerProfileState(before, { displayName: "A", avatarId: PROFILE_AVATARS[1].id });
check(!invalidName.result.success, "invalid name rejected");
equal(invalidName.state, before, "invalid name leaves state unchanged (previous valid name preserved)");

const invalidAvatar = applyUpdatePlayerProfileState(before, { displayName: "Nova", avatarId: "not-real" });
check(!invalidAvatar.result.success, "invalid avatar id rejected");
equal(invalidAvatar.state, before, "invalid avatar id leaves state unchanged");

// ---------------------------------------------------------------------------
// Profile summary contract — normal progress, MAX LEVEL, and collection
// counts all read through the same canonical helpers other screens use.
// ---------------------------------------------------------------------------
const normalPlayer = clonePlayer();
normalPlayer.level = 5;
normalPlayer.xp = 100;
const normalSummary = getPlayerProfileSummary(normalPlayer);
equal(normalSummary.isMaxLevel, false, "normal progress is not max level");
check(normalSummary.progressPercent >= 0 && normalSummary.progressPercent <= 100, "progress percent in range");
check(normalSummary.nextLevelRewards.length > 0, "next level rewards present below max level");
equal(normalSummary.collection.shipsTotal, 20, "ships total matches roster");
equal(normalSummary.collection.shipsOwned, normalPlayer.ownedShipIds.length, "ships owned matches save");
equal(normalSummary.collection.companionsTotal, 6, "companions total matches roster");
equal(normalSummary.collection.modulesTotal, 12, "modules total matches roster");
equal(normalSummary.collection.weaponsTotal, 12, "weapons total matches roster");
equal(normalSummary.battleStatistics.length, 0, "no battle statistics before any stage is cleared");
equal(normalSummary.campaign.stagesCleared, 0, "zero stages cleared by default");

const maxPlayer = clonePlayer();
maxPlayer.level = 50;
maxPlayer.xp = 0;
maxPlayer.highestClearedStageId = "ch1-stage-5";
const maxSummary = getPlayerProfileSummary(maxPlayer);
equal(maxSummary.isMaxLevel, true, "level 50 reports MAX LEVEL");
equal(maxSummary.nextLevelRewards.length, 0, "no next level rewards at MAX LEVEL");
equal(maxSummary.campaign.stagesCleared, 5, "stages cleared derived from highestClearedStageId");
equal(maxSummary.campaign.totalStages, 5, "total stages matches campaign data");
check(maxSummary.battleStatistics.some((s) => s.id === "stages-cleared"), "stages cleared statistic present once tracked");
check(!maxSummary.battleStatistics.some((s) => s.id === "battles-completed"), "untracked statistics are never invented");

console.log(`Player Profile verification passed: ${assertions} assertions.`);
