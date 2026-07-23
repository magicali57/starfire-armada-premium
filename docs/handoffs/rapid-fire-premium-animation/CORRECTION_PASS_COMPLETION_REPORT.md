# Rapid-Fire Gameplay — Mobile Playtest Correction Pass

Scope: `ship-01-rapid-fire` on `ch1-stage-1` only. Save schema unchanged at
v12. No debug Win/Lose controls in production.

Reference material: two gameplay videos (the project's own current build —
identified from its exact HUD text "HULL / WAVE N/12 / FIREPOWER N/10" and
Win/Lose debug buttons — and a competitor game) plus a HUD reference image,
were inspected by extracting still frames with `ffmpeg` and reading the
enemy/player sprite source PNGs directly. That inspection is what identified
the exact bugs below (not just the written brief) — in particular, the
thruster blob, the enemy 180°-flip bug, and the full-width HUD were all
directly visible in the extracted frames.

## 1. What was actually fixed (not just patched)

Every item below is a **removal and replacement**, not a resize or a tweak
of the existing bad effect.

| # | Problem (confirmed from video/source inspection) | Fix |
|---|---|---|
| 1 | Detached blob thruster (`ANIM.thruster`, a large teardrop spritesheet spawned behind the ship) | Spawn call deleted entirely. The player sprite's own baked-in engine-flame art now carries the "powered" feeling, plus the existing tight procedural under-ship glow (already present, tied to Firepower/Max Firepower) — no separate VFX layer. |
| 2 | Muzzle flash / firing splash at the ship nose (`ANIM.muzzleSmall`, `ANIM.muzzleWide`) | `spawnMuzzleFlash()` method deleted entirely, both call sites removed. Firing feel now comes only from projectile timing/spacing/trails (unchanged, already premium from the prior pass) plus the existing recoil kick. |
| 3 | Player-hit VFX (`ANIM.playerDamageRing` ring + `ANIM.hitSparkSmall`) | Both spawn calls deleted. Replaced with a `damageFlashMs` timer rendered as a **red tint clipped to the ship's own visible pixels** (`globalCompositeOperation = "source-atop"` + `rgba(255,40,40,α)`) — a clean red flash on the ship itself, no floating rings/sparks. Damage sound unchanged. |
| 4 | Enemy destruction (`ANIM.explosionSmall` / `ANIM.explosionMedium` spritesheets) | Both spawn calls deleted. Replaced with a new procedural `ExplosionFx` system (`spawnExplosion`/`updateExplosions`/`drawExplosions`): a hot radial flash, an expanding shockwave ring, and 6–13 flying debris streaks, entirely canvas-drawn (no image asset). Size-scaled by tier — basic (small, 6 debris) < shooter (medium, 9 debris) < Power Carrier (large, 13 debris, biggest ring). |
| 5 | Enemies visually backwards | Confirmed by inspecting the source PNGs directly: `enemy_basic_fighter_premium.png`, `enemy_shooter_premium.png`, and `enemy_power_carrier_premium.png` are all drawn nose-up, same convention as the player ship — correct for the player (flies up the screen) but backwards for enemies (which travel top→bottom). `drawEnemies()` now rotates by `Math.PI + bank` instead of `bank` alone, so the nose faces the direction of travel. |
| 6 | Enemies died in 1-2 hits | `ENEMY_DEFS` hull rebalanced: basic 45→**130**, shooter 90→**300**, Power Carrier 110→**550** (~3x/3.3x/5x). Ordering enforced (basic < shooter < Power Carrier) and verified. |
| 7 | Formation "hold" wasn't real, too sparse | See §2. |
| 8 | Full-width blocky top HUD | See §3. |
| 9 | Constant wave counter | See §4. |
| 10 | Stage too short | Already ~3 min from the prior pass; re-verified after the phase-model rewrite (§5). |
| 11 | Audio | Preserved — every event call site from the prior pass still fires from the same (or an equivalent) trigger point; see §6. |
| 12 | Background felt static | Scroll speed increased (far layer 0.035→**0.06** px/ms, near streaks 0.22→**0.26** px/ms) so motion reads clearly instead of being nearly imperceptible between frames. |

## 2. Wave/formation model — rebuilt, not tuned

The old model spawned enemies on a **flat absolute-time schedule**
(`atMs`) — waves could overlap or leave gaps arbitrarily and there was no
real "the wave is cleared" concept. It is now a genuine **enemy-clear-gated
phase state machine** (`RapidFireEngine.updatePhaseFlow`):

1. A phase's groups spawn (staggered by their own `delayMs` within the
   phase).
2. The phase is "complete" only once every one of its enemies has been
   **destroyed or exited** — formations always eventually leave the
   playfield on their own timer (`formationConfig.ts`), so this can never
   soft-lock even if the player does nothing.
3. Only then does the 2s pause → 2s announcement → 2s transition gap run
   (see §4) before the next phase's groups spawn.

`waveTable.ts` was rewritten around this model (`phase`/`delayMs` replace
`atMs`; `getSpawnsForPhase(n)` replaces the old flat `getOrderedSpawns()`).
Several phases now put real groups on stage together instead of one at a
time — peak simultaneous formation population is **`PEAK_PHASE_ENEMY_COUNT`
= 15** (Phase 11, "Climax Formation"), with Phases 5, 6, 8, and 9 also in
the 9–13 range, satisfying the "10–15 enemies together" requirement.
Several formation hold durations were also extended (e.g. `vFormationTop`
3.0s→4.0s, `carrierEscort` 3.4s→4.4s, `arcFormation` 2.6s→3.6s,
`splitFormation` 2.4s→3.4s) so groups visibly hold and shoot instead of
passing through.

## 3. HUD — compact corner layout, no full-width bar

`GameplayScreen.tsx`/`.css` rebuilt: the old `.gameplay-hud` was a
full-width flex-column bar consuming real layout height (`flex: 0 0 auto`
inside the screen's flex column, shrinking the canvas). It's replaced with
`.gameplay-hud-compact` — `position: absolute`, floating over the canvas —
with two small pill clusters:

- **Top-left**: a circular ship-icon avatar + a short Hull bar/value.
- **Top-right**: a circular styled Pause button + a short Firepower
  bar/score value.
- A MAX FIREPOWER badge appears centered near the top only while active.

Because the HUD is now out of normal flex flow, `.gameplay-screen__playfield`
(`flex: 1 1 auto`, unchanged) fills the **entire** screen — verified by
inspecting the CSS directly (no `flex: 0 0 auto` HUD sibling remains to
shrink it). No black dead area.

## 4. Wave counter → center-screen announcement, exact 2s/2s/2s timing

The persistent "WAVE N/12" text in the top bar is gone. `updatePhaseFlow`
now exposes `announcement: { title: "WARNING", subtitle: "WAVE N/12" } |
null` on the HUD snapshot, and `GameplayScreen.tsx` renders it as a centered,
pop-in overlay (`.gameplay-announcement`) only while non-null:

```
gap-pause      (2000ms, nothing shown)
gap-announce   (2000ms, "WARNING" / "WAVE N/12" centered)
gap-transition (2000ms, hidden again)
→ next phase begins
```

`PHASE_GAP_PAUSE_MS`, `PHASE_GAP_ANNOUNCE_MS`, `PHASE_GAP_TRANSITION_MS` are
each exactly `2000` — verified directly in
`rapidFireCorrectionPassVerification.ts`. Total gap ≈ 6s, matching the
brief. The final phase (12) skips the gap and goes straight to victory once
resolved.

## 5. Stage duration

Unchanged target from the prior pass (~2:56–3:04 depending on player
performance, since phases are now enemy-clear-gated rather than fixed-time —
a faster player finishes the *combat* faster but still passes through the
same fixed ~6s inter-phase gaps). `STAGE_DURATION_HINT_MS = 180000` (3:00)
remains the documented estimate; re-verified as still ≥2:00 and ≤3:20 after
the phase-model rewrite.

## 6. Sound — preserved

No sound behavior was removed. Every event call site from the prior pass
(`playerShot`, `enemyShot`, `impact`, `explosion`, `playerDamage`,
`pickupCollect`, `maxFirepowerActivate`, `waveStart`, `warning`, `pauseCue`,
`resumeCue`, `victory`, `defeat`) still fires — `waveStart()` now triggers
from the phase-gap's `gap-announce` transition instead of a raw elapsed-time
check, which is a more accurate trigger point (exactly when the "next wave"
banner appears), not a functional change to what plays. `explosion()`'s two
audio tiers (`"small"`/`"medium"`) are unchanged; the new 3-tier *visual*
system (small/medium/large) maps the Power Carrier's "large" visual tier to
the existing "medium" audio tier since no new audio tier was requested.

## 7. Changed files

```
src/gameplay/rapidFire/RapidFireEngine.ts            REWRITTEN (360-line diff) — thruster/muzzle removal,
                                                       red-flash damage, procedural explosions, enemy rotation
                                                       fix, phase-gated wave state machine, faster background scroll
src/gameplay/rapidFire/enemyConfig.ts                 MODIFIED — HP rebalance (basic/shooter/carrier)
src/gameplay/rapidFire/formationConfig.ts             MODIFIED — extended hold durations on 4 formation types
src/gameplay/rapidFire/waveTable.ts                   REWRITTEN — phase/delayMs model, 10-15 enemy formations
src/screens/gameplay/GameplayScreen.tsx               MODIFIED — compact HUD markup, center announcement overlay
src/screens/gameplay/GameplayScreen.css               MODIFIED — compact HUD styling, announcement animation
scripts/verification/rapidFirePremiumVerification.ts  MODIFIED — assertions flipped for intentionally-removed effects
scripts/verification/rapidFireCoreVerification.ts     MODIFIED — updated for new waveTable API + HP/peak-count checks
scripts/verification/rapidFireRebuildVerification.ts  MODIFIED — updated for new waveTable API + phase-flow checks
scripts/verification/rapidFireCorrectionPassVerification.ts  NEW — this pass's 46 targeted assertions
```

No files outside `src/gameplay/rapidFire/`, `src/screens/gameplay/`, and
`scripts/verification/` were touched.

## 8. Assets — reused, removed from use, or replaced

- **Reused as-is**: player/enemy sprites, projectile bolts/trails, hostile
  bullets, Fire-Up pickup + magnet glow, the Chapter 1 background image, the
  speed-streak asset, and every still-used spritesheet (`enemyMuzzle`,
  `enemyHitSpark`, `pickupBurst`, `maxFpBurst`, `impactRing`).
- **No longer spawned by the engine** (files still exist on disk under
  `public/assets/.../animations/`, just unreferenced by the combat code):
  `rapid_fire_thruster` sheet, `rapid_fire_muzzle_flash_small` sheet,
  `rapid_fire_muzzle_flash_wide` sheet, `rapid_fire_player_damage_ring`
  sheet, `enemy_explosion_small` sheet, `enemy_explosion_medium` sheet.
  Left in place rather than deleted from `public/` — deleting binary assets
  wasn't asked for and risks breaking an unrelated future reference; the
  important fix is that combat no longer renders them.
- **Replaced with procedural (no-asset) presentation**: player under-ship
  glow (already procedural, kept), player damage flash (new, canvas
  gradient/fill), enemy destruction (new, canvas flash/ring/debris),
  background middle starfield layer (already procedural from the prior
  pass, unchanged).

## 9. Verification results

Run via `node --experimental-strip-types --import ./scripts/verification/ts-alias-hooks.mjs <script>`:

- `rapidFireCorrectionPassVerification.ts` (new) — **46/46 assertions
  passed**: thruster field/spawn gone; muzzle method gone; damage-ring/
  hit-spark gone and replaced by a verified red source-atop tint;
  explosion spritesheets gone and replaced by a verified procedural
  flash/shockwave/debris system scaled by tier; enemy rotation includes
  `Math.PI`; HP thresholds (basic ≥100, shooter ≥250, carrier ≥450); peak
  formation population 10–15; compact HUD markup present and the old
  full-width container gone; playfield still `flex: 1 1 auto`; exact
  `2000`/`2000`/`2000` gap constants; announcement overlay markup present
  and the old constant wave-counter markup gone; background scroll-speed
  constants increased; every sound call site preserved; schema v12; DEV
  debug controls still gated.
- `rapidFireCoreVerification.ts` (updated) — **514/514 assertions passed**
  (added HP-ordering and peak-formation-count checks; updated for the new
  `getAllSpawns()`/`getSpawnsForPhase()` API).
- `rapidFireRebuildVerification.ts` (updated) — **894/894 assertions
  passed** (updated for the new waveTable API and the phase-flow engine
  wiring, replacing the retired `getWaveIndexAt` check).
- `rapidFirePremiumVerification.ts` (updated) — **334/334 assertions
  passed** (assertions for the removed effects flipped from "engine wires
  X" to "engine no longer wires X").
- `npm run typecheck` (`tsc -b --noEmit`) — clean, zero errors, after every
  edit round.
- Production build (`vite build`) — clean. JS/CSS bundle timed separately
  from the `public/` asset copy (documented OneDrive-mount workaround, same
  as the prior pass — not a build failure).
- Bundle inspection: `SAVE_SCHEMA_VERSION = 12` present; zero matches for
  `debugForceVictory`/`debugForceDefeat`/"Win Stage"/"Lose Stage"; zero
  matches for the removed VFX identifiers `ANIM.thruster` /
  `ANIM.muzzleSmall` / `ANIM.muzzleWide` / `ANIM.playerDamageRing` /
  `ANIM.hitSparkSmall` (the strings `explosionSmall`/`explosionMedium` do
  still appear in the bundle, but only as the **audio system's** internal
  throttle-key labels — `audioSystem.ts`'s `THROTTLE_MS`/`VOICE_CAP` reuse
  those names for sound bookkeeping, unrelated to the removed sprite VFX;
  confirmed by inspecting the surrounding minified code directly).

## 10. Screenshots / video evidence

**Not captured this session** — same disclosed constraint as the prior
pass: this sandbox has no headless browser (no Playwright/Puppeteer/canvas
package; the project's own verification scripts deliberately run through a
plain Node loader to avoid needing one). What *was* done instead: your two
uploaded videos were decoded with `ffmpeg` (frame extraction, both a fixed
interval and specific timestamp seeks) and the frames were read directly —
that's how the thruster blob, the full-width HUD, and the "Crossfire Belt"
stage were positively identified as this project's own build rather than
guessed at. The actual fixes above are verified structurally (source
inspection + the 46-assertion script + a clean production bundle), not by
re-recording new gameplay video, since this sandbox cannot run a mobile
browser against the built game.

## 11. What still remains placeholder / unresolved

- **No new visual/audio confirmation from an actual playthrough** — same
  gap as above; recommend you re-record a short clip after this pass to
  confirm the red flash, procedural explosions, and enemy orientation read
  well in motion (stills can't fully judge a shockwave/debris animation).
- **Old spritesheet asset files remain on disk** (thruster, muzzle ×2,
  damage ring, explosion ×2) but are no longer referenced by the engine —
  left in place per §8; say the word if you'd like them actually deleted
  from `public/`.
- **`audio.explosion()` still only has two tiers** (`small`/`medium`); the
  new "large" visual tier (Power Carrier) reuses the medium sound rather
  than getting a distinct, heavier explosion sound. Not requested
  explicitly, but worth flagging since visuals now have 3 tiers and audio
  has 2.
- **Enemy HP values are a reasoned estimate**, not derived from live combat
  logs (this sandbox can't run the browser game) — they're checked for
  correct *ordering* and a *floor* value, not tuned against exact real
  player DPS at every level; may need a further pass after real playtesting.
- **Formation peak count (15) only occurs in Phase 11** — most other phases
  are in the 3–13 range by design (pacing: intro phases stay lighter, the
  "Breather" phase is deliberately sparse). If you want 10–15 in *every*
  phase rather than the densest few, that's a follow-up tuning pass.

## 12. Local commit

One commit, message:

```
Correct Rapid-Fire presentation per mobile playtest: remove fake thruster/muzzle VFX, red hit-flash, procedural destruction, enemy orientation fix, HP rebalance, larger formations, compact HUD, wave announcements
```

Not pushed.
