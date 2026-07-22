# Rapid-Fire Gameplay Core — Completion Report

First playable combat vertical slice on `ch1-stage-1` with Rapid-Fire only.

## Installed assets

All five PNGs installed unchanged (RGBA transparency preserved) at:

`public/assets/ui-v2/gameplay/rapid-fire/`

| File | Registry key |
|------|----------------|
| `rapid_fire_primary_bolt.png` | `RAPID_FIRE_GAMEPLAY_ASSETS.primaryBolt` |
| `fire_up_pickup.png` | `fireUpPickup` |
| `enemy_basic_fighter.png` | `enemyBasic` |
| `enemy_shooter.png` | `enemyShooter` |
| `enemy_power_carrier.png` | `enemyPowerCarrier` |

Also used (pre-existing):

- Player: `public/assets/ui-v2/ships/gameplay_sprites/01_rapid_fire_sprite.png`
- Background: Chapter 1 backdrop via `CHAPTER_BACKGROUND_IMAGE["chapter-01"]`

Manifest: `src/data/gameplayRapidFire.ts` (`RAPID_FIRE_SLICE_ASSETS`).

## Renderer architecture

- **HTML Canvas 2D** + single `requestAnimationFrame` loop in `RapidFireEngine`
- Logical playfield `390×700`, scaled to CSS size
- React (`GameCanvas` / `GameplayScreen`) owns mount, session gate, pause/resume commands, HUD presentation, outcome navigation
- Engine owns temporary Hull, Firepower, Max Firepower timer, entities, projectiles, pickups, waves, score, collisions, performance counters
- No per-frame React state; HUD snapshots ~10 Hz
- Pipeline unchanged: `declareBattleVictory/Defeat` → `completeBattle` → `enterBattleResults` → `#/results`
- Rewards never granted from engine / render code
- Save schema **unchanged at v12**

## Firepower

Config: `src/gameplay/rapidFire/firepowerConfig.ts`

- Levels 0–10 (intervals/lanes/speeds per slice spec)
- Single bolt asset; scale / brightness / lane / damage weighting vary
- Max Firepower: 6s base, refresh cap 8s, +20% fire rate, +15% damage, procedural aura
- No Firepower 11; Replay/Retry starts at 0

## Enemies

Config: `src/gameplay/rapidFire/enemyConfig.ts`

| Kind | Behavior |
|------|----------|
| `basic` | Low Hull, downward/drift, contact damage |
| `shooter` | Medium Hull, stays high, slow hostile shots |
| `powerCarrier` | Drops exactly one Fire-Up on death (not on escape) |

## Waves

Table: `src/gameplay/rapidFire/waveTable.ts`

- 5 waves, ~82s deterministic spawn schedule
- 11 Power Carriers (10 guaranteed + 1 Max Firepower test)

## Hull

- Max Hull from `calculateShipStatsWithRank` HP
- Defense mitigates incoming damage
- `damageTaken` counts only applied Hull loss (clamped to remaining Hull)
- Firepower unaffected by damage; Hull clamps at 0; defeat once

## Victory / defeat

- Victory: all spawns finished and no living enemies
- Defeat: Hull ≤ 0
- First outcome wins; combat updates stop after lock
- Pause uses canonical `pauseBattle` / `resumeBattle`; Gameplay treats `paused` as a valid play session (does not redirect)

## BattlePerformance fields populated

`score`, `enemiesDestroyed`, `bossesDestroyed` (0), `remainingHp`, `remainingHpPercent`, `completionTimeMs`, `damageTaken`, `noDamage`

## Screenshots

`docs/handoffs/rapid-fire-gameplay-core/screenshots/`

1. `01_fp0_412x915.png`
2. `02_fp5_412x915.png`
3. `03_fp10_412x915.png`
4. `04_fp10_360x800.png`
5. `05_max_firepower_412x915.png`
6. `06_shooter_projectiles_412x915.png`
7. `07_power_carrier_fireup_412x915.png`
8. `08_pause_412x915.png`
9. `09_victory_results_412x915.png`
10. `10_defeat_results_412x915.png`

## Deferred (out of scope)

Signature Attack, Passive Ability, Calamity, Arsenal secondary, Companion/Module combat, boss, revive, sound, other pickups/ships, permanent Shield bar.

## Prototype values needing playtesting

Fire intervals, lane damage weights, enemy Hull/speeds/radii, wave timing, Max Firepower bonuses, Hull/Defense feel at high ship levels.

## Verification

- `npx vite-node scripts/verification/rapidFireCoreVerification.ts` — **136 assertions passed**
- TypeScript type-check — pass
- Production build — pass
- Production bundle excludes DEV Win/Lose controls
