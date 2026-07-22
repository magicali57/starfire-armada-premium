import assert from "node:assert/strict";
import {
  getChapterMapInfo,
  getChapter1MapStages,
  getChapterMapStages,
  resolveChapterMapIdFromHash,
  CAMPAIGN_CHAPTER_MAP_STAGES,
} from "@/data/campaignChapterMap";
import { getStageById } from "@/data/campaign";
import { getFleetRosterEntry } from "@/data/fleetRoster";
import { DEFAULT_PLAYER_STATE } from "@/data/player";
import { RAPID_FIRE_SHIP_ID } from "@/data/gameplayRapidFire";
import { SAVE_SCHEMA_VERSION } from "@/types";
import type { PlayerState } from "@/types";

let assertions = 0;
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}

equal(SAVE_SCHEMA_VERSION, 12, "save schema unchanged at v12");

// Chapter route resolution
{
  equal(resolveChapterMapIdFromHash("#/campaign/chapter-map?chapter=chapter-01"), "chapter-01", "chapter-01 query");
  equal(resolveChapterMapIdFromHash("#/campaign/chapter-map?chapter=chapter-02"), "chapter-02", "chapter-02 query");
  equal(resolveChapterMapIdFromHash("#/campaign/chapter-map?chapter=nope"), "chapter-01", "invalid falls back to chapter-01");
  equal(resolveChapterMapIdFromHash("#/campaign/chapter-map"), "chapter-01", "missing falls back to chapter-01");
  equal(getChapterMapInfo("chapter-01").chapterIndex, 1, "chapter-01 map info");
  equal(getChapterMapInfo("chapter-02").chapterIndex, 2, "chapter-02 map info");
}

// Chapter 1 Stage 1 → ch1-stage-1
{
  const player = structuredClone(DEFAULT_PLAYER_STATE) as PlayerState;
  const stages = getChapter1MapStages(player);
  equal(stages[0]?.id, "ch1-stage-1", "Chapter 1 Stage 1 uses canonical id");
  check(!!getStageById("ch1-stage-1"), "ch1-stage-1 exists in campaign.ts");
  check(stages.every((s) => s.id.startsWith("ch1-stage-")), "only canonical ch1 stages");
  equal(getChapterMapStages("chapter-02", player), CAMPAIGN_CHAPTER_MAP_STAGES, "chapter-02 keeps prototype nodes");
}

// Fleet owned/equipped from selectedShipId
{
  const player = structuredClone(DEFAULT_PLAYER_STATE) as PlayerState;
  player.selectedShipId = RAPID_FIRE_SHIP_ID;
  const rf = getFleetRosterEntry(RAPID_FIRE_SHIP_ID, player);
  const hm = getFleetRosterEntry("ship-03-homing-missiles", player);
  check(rf?.owned === true, "Rapid-Fire owned by default");
  check(rf?.equipped === true, "Rapid-Fire equipped when selectedShipId matches");
  check(hm?.equipped === false, "Homing Missiles not equipped when not selected");
  check(hm?.owned === false, "Homing Missiles not owned by default save");

  player.selectedShipId = "ship-03-homing-missiles";
  player.ownedShipIds = [...player.ownedShipIds, "ship-03-homing-missiles"];
  const hmOwned = getFleetRosterEntry("ship-03-homing-missiles", player);
  const rf2 = getFleetRosterEntry(RAPID_FIRE_SHIP_ID, player);
  check(hmOwned?.owned === true && hmOwned.equipped === true, "Homing can be equipped when owned+selected");
  check(rf2?.equipped === false, "Rapid-Fire unequipped ribbon when another ship selected");
}

console.log(`rapidFirePlayabilityFixVerification: ${assertions} assertions passed`);
