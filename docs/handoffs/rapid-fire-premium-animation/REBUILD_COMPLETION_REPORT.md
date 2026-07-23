# Rapid-Fire Gameplay Presentation, Waves, Background & Audio — Rebuild

Scope: `ship-01-rapid-fire` on `ch1-stage-1` only. No other ships, no
Signature/Passive/Calamity/Arsenal/companions/boss work. Save schema
unchanged at v12. No debug Win/Lose controls in production.

## 1. Implementation summary

Two prior sessions had already built the "premium animation pass" (12-sheet
VFX runtime, thruster/banking/recoil/glow/damage-flash/invuln flicker,
Firepower 0–10 lane/muzzle/glow differentiation, pickup bob/pulse/halo, hit
rings/sparks, small/medium enemy explosions). This session's job was
everything still missing per the new brief:

- **Enemy formation choreography** (new) — every enemy now belongs to a
  named formation group with enter → form/hold → attack/dive → exit phases,
  replacing simple downward drift.
- **Stage pacing rebuild** (new) — `ch1-stage-1` rebuilt from 5 flat waves
  (~85s) into 12 named phases (~2:56 authored).
- **Moving parallax background** (new) — the background was previously drawn
  statically (a `bgScroll` variable existed but was never applied). It now
  drives a real seamless vertical wrap, plus a new procedural starfield
  middle layer, plus the existing speed-streak near layer.
- **Full audio system** (new) — procedural Web Audio API sound design across
  all 17 required event categories, mobile unlock-on-gesture, throttling/
  voice-pooling, pause ducking, and a persisted mute/volume prefs UI in the
  pause menu.
- **Pause/cleanup coverage** extended to the new systems (audio ducks on
  pause, stops on destroy; background/VFX/sim already froze correctly).

Firepower 0–10 presentation, player ship presentation, pickup presentation,
and hit/destruction feedback were already implemented to spec from the prior
session and were verified, not rewritten (see §10 for what was reused vs.
newly proven this session).

## 2. Changed files

```
src/gameplay/rapidFire/formationConfig.ts        NEW — 10 formation types, pure pose function
src/gameplay/rapidFire/audioSystem.ts            NEW — Web Audio procedural sound system
src/gameplay/rapidFire/waveTable.ts              REWRITTEN — 12-phase formation-tagged stage timeline
src/gameplay/rapidFire/RapidFireEngine.ts        MODIFIED — formation-driven enemy movement, audio wiring,
                                                             3-layer parallax background, generalized offscreen despawn
src/gameplay/rapidFire/GameCanvas.tsx            MODIFIED — exposes the live engine via onEngineReady
src/screens/gameplay/GameplayScreen.tsx          MODIFIED — pause-menu mute/master/music/sfx controls
src/screens/gameplay/GameplayScreen.css          MODIFIED — pause-menu audio control styling
scripts/verification/rapidFireCoreVerification.ts   MODIFIED — wave-table assertions updated for the 12-phase rebuild
scripts/verification/rapidFireRebuildVerification.ts NEW — formation/wave/audio/wiring checks for this task
```

(`firepowerConfig.ts`, `assetRegistry.ts`, `gameplayRapidFire.ts`,
`animationDefs.ts`, `spriteAnimation.ts`, `rapidFirePremiumVerification.ts`
were the prior session's premium-animation-pass work; unchanged this
session except where noted.)

## 3. Animation-runtime architecture

Unchanged from the prior session: `spriteAnimation.ts`'s `SpriteAnimationInstance`
+ `VfxSystem` — elapsed-time frame selection driven only by the single
gameplay `requestAnimationFrame` loop's `dt`, capped pool with one-shot
eviction, pause-safe (freezes when `update()` stops being called).

## 4. Audio architecture

`src/gameplay/rapidFire/audioSystem.ts` — `RapidFireAudioSystem`:

- **Buses:** `masterGain → destination`; `musicGain`/`sfxGain → masterGain`.
  No licensed audio assets exist in the repo, so every effect is synthesized
  (oscillators + filtered noise bursts) — the architecture is buffer-ready
  for later WAV/OGG replacement (each `play*` method is the one call site an
  eventual sample-based version would swap).
- **Unlock:** `unlock()` creates/resumes the `AudioContext` only from inside
  `RapidFireEngine.onPointerDown` — the first guaranteed real user gesture in
  the combat loop (mobile autoplay policy).
- **Throttling/pooling:** per-sound-key minimum gap (`THROTTLE_MS`) and a
  concurrent-voice cap (`VOICE_CAP`) so FP10's ~145 ms volley cadence and
  dense impacts never overlap into noise/clipping. Player-shot pitch has
  small random jitter to avoid a static repeating tone.
- **Ducking:** `setDuck()` fades `musicGain` under pause; `pauseCue()` /
  `resumeCue()` call it automatically.
- **Persistence:** a dedicated `starfire-armada-v2:audio-prefs` localStorage
  key — deliberately separate from the versioned save
  (`starfire-armada-v2:save`, schema v12). Audio prefs are presentation-only
  and never touch the schema.
- **Cleanup:** `destroy()` stops the music bed and closes the `AudioContext`;
  called from `RapidFireEngine.destroy()`.

## 5. Full sound-event mapping

| # | Event | Trigger site | Sound |
|---|-------|---------------|-------|
| 1 | Player Rapid-Fire shot | every fired volley | bright short pulse, pitch-jittered |
| 2 | Heavier FP5–FP10 layer | same call, `heavy` flag when Firepower ≥ 5, plus the FP10 heavy burst | deeper/longer layered tone |
| 3 | Enemy firing | `fireEnemyShot` | lower red-energy pulse |
| 4 | Ordinary projectile impact | player shot → enemy hit | sharp filtered noise click |
| 5 | Heavier enemy hit | same site, `heavy` flag (heavy bolt or ≥1.3× damage) | stronger click |
| 6 | Small enemy explosion | `killEnemy`, `basic` | noise burst + low tone |
| 7 | Medium enemy explosion | `killEnemy`, shooter/carrier | longer noise burst + lower tone |
| 8 | Player damage | `applyPlayerDamage` (only when Hull actually drops) | noise burst + falling tone |
| 9 | Fire-Up pickup collection | pickup collision resolve | ascending chime |
| 10 | MAX FIREPOWER activation | first time Firepower reaches 10 | rising sawtooth + noise |
| 11 | Wave-start cue | `getWaveIndexAt` phase change | short rising triangle |
| 12 | Warning cue | Hull first crosses ≤25% | double square blip |
| 13 | Pause | `setPaused(true)` | falling tone + music duck |
| 14 | Resume | `setPaused(false)` | rising tone + music restore |
| 15 | Victory | `lockOutcome("victory")` | 3-note rising sequence, music fades out |
| 16 | Defeat | `lockOutcome("defeat")` | falling sawtooth, music fades out |
| 17 | Looping ambient combat bed | `startMusic()` on first unlock | two detuned sine drones + slow LFO swell |

UI click (`uiClick()`) is implemented but not yet wired to a specific button —
disclosed in §13.

## 6. Final Stage 1 wave timeline (approximate)

12 named phases, `src/gameplay/rapidFire/waveTable.ts`:

| # | Label | Starts | Formation(s) |
|---|-------|--------|---------------|
| 1 | Approach | 0:00 | V formation (3 fighters) + 1 carrier |
| 2 | Flank Sweep | 0:12 | Side sweep left + right + 1 carrier |
| 3 | Shooter Line | 0:26 | Two-row shooter hold (4 shooters) + 1 carrier |
| 4 | Dive Runs | 0:42 | Alternating dive attacks (5 fighters) + 1 carrier |
| 5 | Escort Convoy | 0:58 | Carrier + 4 escorts, then arc formation |
| 6 | Crossfire | 1:16 | Split formation + side sweep + 1 carrier |
| 7 | Breather | 1:36 | Sparse arc (pressure release) |
| 8 | Carrier Wing | 1:44 | Carrier + 5 mixed escorts |
| 9 | Cross-Screen Sweep | 2:04 | Left + right sweeps + 1 carrier |
| 10 | Advanced Shooter Wall | 2:22 | Two-row shooter hold (6 shooters) + 1 carrier |
| 11 | Climax Formation | 2:40 | Dense mixed final (10 enemies incl. 1 carrier) + Overdrive-test carrier |
| 12 | Cleanup | 2:56 | Staggered-lane short finish |

Authored duration hint: **`STAGE_DURATION_HINT_MS = 184500` (~3:04)** — the
last spawn plus that formation's own resolve time. The stage never ends on a
timer; it ends when every spawned enemy is destroyed or has exited (verified
structurally — see §10). This sits close to, slightly above, the spec's
preferred 2:20–3:00 window; disclosed honestly in §13 rather than
misreported as exactly in-range.

11 Power Carriers are threaded through the timeline (10 to carry Firepower
0→10, 1 extra near the climax to exercise MAX FIREPOWER — OVERDRIVE refresh).

## 7. Enemy formation/state design

`src/gameplay/rapidFire/formationConfig.ts` — `computeFormationPose(type, slot,
slotCount, tMs)` is a pure function of elapsed time since a group's spawn; it
returns normalized `xNorm`/`yNorm` (0–1 across the playfield), a coarse
`phase` (`entering | forming | holding | attacking | repositioning | diving |
exiting`), a `canFire` gate, and a bank hint. `RapidFireEngine.updateEnemies`
calls this every frame instead of integrating velocity — formation position
is authoritative, not simulated. All 10 required styles are implemented:
`vFormationTop`, `sideSweepLeft`/`sideSweepRight`, `twoRowShooter`,
`carrierEscort`, `arcFormation`, `staggeredLane`, `splitFormation`,
`alternatingDive`, `denseMixedFinal`. Shooters only fire while `canFire` is
true (i.e., in position, not mid-transit), so volleys stay readable instead
of firing while off-formation. Despawn is now generic (position-based on any
axis) instead of "y past the bottom," so side-sweep exits correctly clear
off-canvas.

## 8. Moving-background architecture

Three layers in `RapidFireEngine.drawBackground`:

1. **Far** — the existing Chapter 1 source art, now genuinely scrolled: two
   stacked copies offset by `bgScroll % LOGICAL_H` are drawn each frame so
   there is no seam at the wrap point.
2. **Middle** — a new procedural starfield (26 points generated once in the
   constructor, not re-randomized per frame), drifting at 0.55–1.05× the far
   layer's speed for real parallax depth without new art.
3. **Near** — the existing speed-streak instances (already present),
   fastest and sparsest.

All three are driven by `bgScroll`/`streakScroll`, which only advance inside
`update()` — pausing the game freezes the background along with everything
else (verified structurally in §10; visually unconfirmed, see §13).

## 9. Firepower 0–10 presentation table

Unchanged from the prior session (already matched the spec before this
task); reverified this session via `rapidFirePremiumVerification.ts` and
`rapidFireRebuildVerification.ts`. Lane counts 2→12, muzzle switches
small→wide at FP5, glow escalates monotonically, FP7+ adds side-emitter
stagger, FP8 adds alternating center/side rhythm, FP10 adds a heavy
concentrated burst layer.

## 10. Verification results

Run via `node --experimental-strip-types --import ./scripts/verification/ts-alias-hooks.mjs <script>`
(this sandbox has no network access for `ts-node`/`tsx`; see the loader's own
comment for why):

- `rapidFireRebuildVerification.ts` (new, this task) — **758 assertions
  passed**: all 10 formation types produce finite, readable, self-resolving
  poses; nothing can fire mid-transit; 12 wave phases with unique labels and
  strictly increasing start times; 11 Power Carriers; every spawn references
  a valid formation/groupId/slot; stage duration ≥2:00 and close to the
  2:00–3:00 target; audio prefs clamp/sanitize/round-trip correctly through
  a fake localStorage under a key separate from the versioned save; engine
  source statically wired to every required audio call site, formation pose
  function, and the new starfield layer; pause menu wired to `setAudioPrefs`
  with a visible mute control; save schema still 12.
- `rapidFireCoreVerification.ts` (updated for the rebuild) — **327
  assertions passed**.
- `rapidFirePremiumVerification.ts` (prior session, rerun) — **334
  assertions passed**.
- `npm run typecheck` (`tsc -b --noEmit`) — clean, zero errors.
- Production build (`vite build`) — clean. JS/CSS bundle step timed
  separately from the `public/` asset copy because this sandbox's
  OneDrive-mounted filesystem makes a full `vite build` exceed this
  environment's per-command time budget; both steps individually verified
  successful and their outputs combined and inspected (documented workaround,
  not a build failure).
- Schema confirmation: `SAVE_SCHEMA_VERSION = 12` present in source and in
  the built bundle; the versioned save key (`starfire-armada-v2:save`) and
  the new, separate audio-prefs key (`starfire-armada-v2:audio-prefs`) both
  present and distinct in the bundle.
- Production debug-control search: `grep` for `debugForceVictory`,
  `debugForceDefeat`, `Win Stage`, `Lose Stage` against the built JS bundle
  returns **0 matches**; `import.meta.env.DEV` gating confirmed present in
  `GameplayScreen.tsx` source.
- Asset-path verification: `rapidFirePremiumVerification.ts` still confirms
  every premium still/spritesheet resolves on disk under `public/assets/...`
  and that no `.gif` is referenced at runtime.
- Mobile viewport verification: not re-tested visually this session (no
  headless browser — see §13); the canvas engine's logical-to-CSS scaling
  (`LOGICAL_W`/`LOGICAL_H` mapped to `canvas.clientWidth/clientHeight` each
  frame) and formation math (normalized 0–1, independent of pixel
  dimensions) are unchanged in kind from the prior session's approach, which
  was itself designed around 412×915/390×844/360×800.

## 11. Screenshot paths

Not produced this session. This sandbox has no headless browser (no
Playwright/Puppeteer/canvas package installed, and this project's own
verification scripts run through a plain Node loader specifically to avoid
needing one). The 3 pre-existing screenshots under
`docs/handoffs/rapid-fire-premium-animation/screenshots/` are from an earlier
session's use of the desktop's real Chrome (not reproducible headlessly
here). Capturing the 21 requested states (FP0/5/10 combat, background
motion, formation entering/holding/diving, Fire-Up idle/magnet/collection,
impacts, all 3 destruction tiers, player damage, MAX FIREPOWER activation,
pause, victory/defeat) needs either: (a) a real browser session against the
running dev server, ideally via this environment's screen-control tools
against the user's own machine, or (b) `playwright install chromium` if this
sandbox's network allowlist is ever opened to it. Flagging this as the
single biggest gap versus the full spec.

## 12. Approximate tested stage duration

Not played end-to-end in a real browser this session (same constraint as
§11). The authored/structural duration is **~3:04** (`STAGE_DURATION_HINT_MS
= 184500`, derived from the last spawn's `atMs` plus its formation's own
resolve time) — verified arithmetically, not by clock-timing an actual
playthrough.

## 13. Remaining issues (disclosed, not fixed this session)

- **No real visual/audio verification.** Everything in §7–§9 is verified
  structurally (types, ranges, wiring, static grep) but not by eyes-on
  gameplay or ears-on audio — no headless browser or audio-capable sandbox
  is available here. Recommend a follow-up pass with real device/browser
  access before calling this launch-ready.
- **Authored duration runs slightly past the preferred 2:20–3:00 window**
  (~3:04 vs. a 3:00 preferred ceiling) — within the "acceptable" 2:00
  minimum but not perfectly centered; a few seconds of phase-8/phase-11
  timing could be trimmed if a hard 3:00 ceiling matters.
- **`uiClick()` sound exists but isn't wired to any button yet** (Resume/
  Abandon/mute-toggle currently silent) — trivial follow-up, not done here
  to avoid touching pause-menu logic beyond what was asked.
- **Enemy contact/ramming damage** still uses the pre-existing rule (no
  score/no Fire-Up drop, destruction presentation only) — unchanged, not
  revisited this session.
- **No per-category (player-weapon vs. enemy-weapon vs. impacts, etc.) user
  volume sliders** — the spec listed 8 audio *categories* for internal
  organization but only requires master/music/SFX *controls*, which are
  implemented; category-level buses exist implicitly via throttle/voice-cap
  keys, not as separate exposed gain nodes, since no user-facing requirement
  needed them separated further.
- **Performance under the new denser formations (Phase 8/11) is unmeasured**
  — the VFX pool cap (48) and shot caps (120 player / 80 hostile) are
  unchanged from the prior session; worth a real-device profiling pass.

## 14. Local commit

One commit, exact message:

```
Rebuild Rapid-Fire gameplay presentation, waves, background, and audio
```

Not pushed.
