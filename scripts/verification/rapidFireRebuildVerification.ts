/**
 * Focused verification for the "Rebuild Rapid-Fire gameplay presentation,
 * waves, background, and audio" task: formation choreography, wave pacing,
 * the audio system's pure logic (prefs persistence, volume clamping,
 * throttling constants), and static engine-wiring checks for the new
 * systems. Does not require a browser/AudioContext — audio synthesis and
 * canvas rendering are exercised structurally, not audibly/visually (no
 * headless browser is available in this sandbox; see the completion report).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeFormationPose, type FormationType } from "@/gameplay/rapidFire/formationConfig";
import {
  getAllSpawns,
  getSpawnsForPhase,
  WAVE_PHASES,
  WAVE_COUNT,
  STAGE_DURATION_HINT_MS,
  TOTAL_POWER_CARRIERS,
  PEAK_PHASE_ENEMY_COUNT,
} from "@/gameplay/rapidFire/waveTable";
import {
  clampVolume,
  sanitizeAudioPrefs,
  loadAudioPrefs,
  saveAudioPrefs,
  DEFAULT_AUDIO_PREFS,
  AUDIO_PREFS_STORAGE_KEY,
} from "@/gameplay/rapidFire/audioSystem";
import { SAVE_SCHEMA_VERSION } from "@/types";

let assertions = 0;
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ---------------------------------------------------------------------
// Formation choreography
// ---------------------------------------------------------------------
{
  const types: FormationType[] = [
    "vFormationTop",
    "sideSweepLeft",
    "sideSweepRight",
    "twoRowShooter",
    "carrierEscort",
    "arcFormation",
    "staggeredLane",
    "splitFormation",
    "alternatingDive",
    "denseMixedFinal",
  ];
  equal(types.length, 10, "all 10 required formation styles are implemented");

  for (const type of types) {
    // Every formation must eventually resolve (exit the 0..1 band) so the
    // engine's generic offscreen despawn always fires — no permanent
    // enemies.
    let resolved = false;
    for (let t = 0; t <= 12000; t += 200) {
      const pose = computeFormationPose(type, 1, 3, t);
      check(Number.isFinite(pose.xNorm) && Number.isFinite(pose.yNorm), `${type} pose is finite at t=${t}`);
      if (pose.yNorm > 1.05 || pose.xNorm < -0.05 || pose.xNorm > 1.05) resolved = true;
    }
    check(resolved, `${type} eventually exits the playfield within 12s`);

    // Early on (still entering), nothing should be allowed to fire.
    const early = computeFormationPose(type, 1, 3, 50);
    check(!early.canFire, `${type} cannot fire immediately on spawn (still entering)`);
  }

  // Readability: at t=0 every slot of every group starts at/near the top
  // center and never begins already past the bottom of the screen.
  for (const type of types) {
    const pose = computeFormationPose(type, 0, 4, 0);
    check(pose.yNorm < 0.5, `${type} starts in the upper playfield`);
  }
}

// ---------------------------------------------------------------------
// Wave pacing (12 enemy-clear-gated phases, ~2:00-3:00 target range,
// formation-tagged spawns, 10-15 enemies together in the densest phases)
// ---------------------------------------------------------------------
{
  equal(WAVE_PHASES.length, 12, "12 named wave phases");
  equal(WAVE_COUNT, 12, "WAVE_COUNT matches the phase table");
  const labels = new Set(WAVE_PHASES.map((w) => w.label));
  equal(labels.size, 12, "wave phase labels are unique");

  const spawns = getAllSpawns();
  check(spawns.length >= 60, "stage has a substantial enemy population across 12 phases");
  equal(TOTAL_POWER_CARRIERS, 11, "11 Power Carriers thread the whole stage");
  check(PEAK_PHASE_ENEMY_COUNT >= 10 && PEAK_PHASE_ENEMY_COUNT <= 15, "peak simultaneous phase population is 10-15 enemies");

  // Every phase is non-empty and delay-sorted; every group has a real
  // formation type and stays within its own slotCount.
  const validTypes = new Set([
    "vFormationTop",
    "sideSweepLeft",
    "sideSweepRight",
    "twoRowShooter",
    "carrierEscort",
    "arcFormation",
    "staggeredLane",
    "splitFormation",
    "alternatingDive",
    "denseMixedFinal",
  ]);
  for (const w of WAVE_PHASES) {
    const forPhase = getSpawnsForPhase(w.index);
    check(forPhase.length > 0, `phase ${w.index} ("${w.label}") has spawns`);
    for (let i = 1; i < forPhase.length; i += 1) {
      check(forPhase[i].delayMs >= forPhase[i - 1].delayMs, `phase ${w.index} spawns sorted by delay`);
    }
  }
  for (const s of spawns) {
    check(validTypes.has(s.formation), `spawn formation "${s.formation}" is a recognized type`);
  }

  check(STAGE_DURATION_HINT_MS >= 120000 && STAGE_DURATION_HINT_MS <= 200000, "authored duration hint sits in the 2:00-3:20 band");
}

// ---------------------------------------------------------------------
// Audio system — pure logic (no AudioContext required)
// ---------------------------------------------------------------------
{
  equal(clampVolume(-1), 0, "clampVolume floors at 0");
  equal(clampVolume(2), 1, "clampVolume ceils at 1");
  equal(clampVolume(0.5), 0.5, "clampVolume passes through valid values");
  equal(clampVolume(Number.NaN), 0, "clampVolume treats NaN as 0");

  const sanitized = sanitizeAudioPrefs({ master: 3, music: -1, sfx: "x", muted: 1 });
  equal(sanitized.master, 1, "sanitize clamps master");
  equal(sanitized.music, 0, "sanitize clamps music");
  equal(sanitized.sfx, DEFAULT_AUDIO_PREFS.sfx, "sanitize falls back to default for invalid sfx");
  equal(sanitized.muted, DEFAULT_AUDIO_PREFS.muted, "sanitize falls back to default for invalid muted");

  // Fake localStorage — round-trip persistence, isolated from the real
  // versioned save (schema v12) under a dedicated key.
  const store = new Map<string, string>();
  const fakeStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  };
  check(AUDIO_PREFS_STORAGE_KEY !== "starfire-armada-v2:save", "audio prefs key is separate from the versioned save key");
  check(AUDIO_PREFS_STORAGE_KEY.startsWith("starfire-armada-v2:"), "audio prefs key is namespaced under the project");

  const before = loadAudioPrefs(fakeStorage);
  assert.deepEqual(before, DEFAULT_AUDIO_PREFS, "loadAudioPrefs falls back to defaults when nothing is stored");
  assertions += 1;

  saveAudioPrefs({ master: 0.3, music: 0.9, sfx: 0.1, muted: true }, fakeStorage);
  const after = loadAudioPrefs(fakeStorage);
  assert.deepEqual(after, { master: 0.3, music: 0.9, sfx: 0.1, muted: true }, "saveAudioPrefs/loadAudioPrefs round-trip");
  assertions += 1;
}

// ---------------------------------------------------------------------
// Engine wiring — static checks (audio, formations, parallax background)
// ---------------------------------------------------------------------
{
  const engineSrc = fs.readFileSync(path.join(root, "src/gameplay/rapidFire/RapidFireEngine.ts"), "utf8");
  for (const needle of [
    "computeFormationPose",
    "this.audio.playerShot",
    "this.audio.enemyShot",
    "this.audio.impact",
    "this.audio.explosion(",
    "this.audio.playerDamage",
    "this.audio.pickupCollect",
    "this.audio.maxFirepowerActivate",
    "this.audio.waveStart",
    "this.audio.warning",
    "this.audio.pauseCue",
    "this.audio.resumeCue",
    "this.audio.victory",
    "this.audio.defeat",
    "this.audio.unlock",
    "this.audio.startMusic",
    "this.audio.destroy",
    "midStars",
  ]) {
    check(engineSrc.includes(needle), `engine wires ${needle}`);
  }
  check(!engineSrc.includes("STAGE_WAVES"), "engine no longer references the retired flat STAGE_WAVES table");
  check(!engineSrc.includes("getWaveIndexAt"), "engine no longer uses the retired absolute-time wave lookup");
  check(engineSrc.includes("updatePhaseFlow"), "engine drives waves through the enemy-clear-gated phase state machine");
  check(engineSrc.includes("getSpawnsForPhase"), "engine pulls spawns per-phase, not from a flat schedule");

  const gameplayScreenSrc = fs.readFileSync(
    path.join(root, "src/screens/gameplay/GameplayScreen.tsx"),
    "utf8",
  );
  check(gameplayScreenSrc.includes("import.meta.env.DEV"), "Win/Lose debug controls remain DEV-gated");
  check(gameplayScreenSrc.includes("setAudioPrefs"), "pause menu wires audio prefs to the engine");
  check(gameplayScreenSrc.includes("Mute"), "pause menu exposes a mute control");

  equal(SAVE_SCHEMA_VERSION, 12, "save schema unchanged at v12");
}

console.log(`rapidFireRebuildVerification: ${assertions} assertions passed`);
