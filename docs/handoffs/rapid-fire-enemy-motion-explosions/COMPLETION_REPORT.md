# Rapid-Fire Enemy Motion and Explosion Pass

## Scope

Focused PixiJS presentation correction only:

- clearer reference-style enemy formation motion;
- compact reference-style enemy destruction explosions.

The current background, simulation hitboxes, enemy HP/damage, collisions,
wave population, Firepower, audio, battle session, rewards, and save schema
were not changed.

## References inspected

- `C:\Users\Ali\Downloads\WhatsApp Video 2026-07-24 at 1.02.17 AM.mp4`
  — movement/explosion target.
- `C:\Users\Ali\Downloads\WhatsApp Video 2026-07-25 at 4.13.04 PM.mp4`
  — current-build comparison recording.

## Implemented

- Grid formations now enter in two readable beats: tight stream/staging column
  followed by a visible unfold into rows.
- Held formations travel laterally as a coherent block with restrained row
  offsets and stronger directional banking.
- Breakaway ships are scheduled within the real hold window and follow deeper
  curved attack/return paths.
- Enemy destruction now uses a short white-hot star ignition, layered filled
  orange fireball, faint pressure halo, and warm ember trails.
- The old explosion spritesheets remain unused.
- Existing pooled Pixi sprites and the one reused `Graphics` object continue
  to render all effects; no per-frame display objects or extra loop were added.

## Files changed

- `src/gameplay/rapidFire/formationConfig.ts`
- `src/gameplay/rapidFire/RapidFireEngine.ts`
- `src/gameplay/rapidFire/pixiRenderer.ts`
- `src/gameplay/rapidFire/renderTypes.ts`
- `scripts/verification/rapidFireRebuildVerification.ts`
- `scripts/verification/rapidFireCorrectionPassVerification.ts`

## Verification

- TypeScript type-check: passed.
- Rapid-Fire core verification: 842 assertions passed.
- Rapid-Fire premium verification: 334 assertions passed.
- Rapid-Fire rebuild verification: passed, including new formation-readability
  assertions.
- Rapid-Fire correction verification: 99 assertions passed.
- Rapid-Fire playability verification: 17 assertions passed.
- Production build: passed (`1113` modules transformed).
- Rendered PixiJS mobile review: performed at 412×915 and 360×800 with no
  renderer errors or horizontal clipping observed.

## Remaining scope

Transition pacing and high-Firepower projectile density were deliberately not
changed in this pass.
