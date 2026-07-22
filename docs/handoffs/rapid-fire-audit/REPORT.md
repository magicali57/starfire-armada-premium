# Rapid-Fire Vertical Slice — Audit Report

Documentation-only audit. No application code, stores, schema, assets, or formulas were modified.

Canonical implementation spec: `docs/gameplay/RAPID_FIRE_VERTICAL_SLICE_SPEC.md`.

---

## Files inspected

### Identity / progression / abilities

- `src/data/ships.ts` — Rapid-Fire definition, `weaponLevels`, passive/calamity names
- `src/types/ship.ts` — `WeaponLevelDefinition`, `ShipProgress.weaponLevel`
- `src/data/player.ts` — `DEFAULT_SHIP_ID = ship-01-rapid-fire`
- `src/data/shipDetail.ts` — Signature presentation from `weaponLevels`
- `src/systems/shipAbilities.ts` — unlock ranks, effect scaling, definition derivation
- `src/systems/shipStats.ts` — level 1–20 stats / power
- `src/systems/shipStarRank.ts` — ★0–5 stat bonuses + milestone copy
- `src/data/assetRegistry.ts` — sprite/master/background paths
- `src/data/weapons.ts` — Arsenal Pulse Blaster linked flavor only (not combat owner)
- `src/data/campaign.ts` — `ch1-stage-1` Formation Breach (recommended host)

### Session / placeholder gameplay / Results contract

- `src/systems/battleSession.ts` — `BattlePerformance`, pause/resume, completion
- `src/store/playerStore.tsx` — `startBattle` / `pauseBattle` / `declare*` / `completeBattle`
- `src/screens/gameplay/GameplayScreen.tsx` (+ `.css`) — placeholder canvas, DEV win/lose
- `docs/PROJECT_STATUS.md`, `docs/UI_REFERENCE_INDEX.md`, `AGENTS.md`

### Handoffs skimmed (ship context only)

- `docs/handoffs/ship-detail/SHIP_DETAIL_COMPLETION_REPORT.md`
- `docs/handoffs/ship-upgrade/SHIP_LEVEL_UP_COMPLETION_REPORT.md`

---

## Exact visual-reference paths inspected

Opened and reviewed (not filename-only):

1. `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_5_Gameplay_and_Results/43_Standard_Gameplay_HUD.png`  
   — Hull/Shield chrome, wave nodes, score, Calamity meter/button, dense cyan multi-lane player fire, enemy formation, orange explosions, floating pickups (XP/crystal/star).
2. `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_5_Gameplay_and_Results/45_Pause_Menu.png`  
   — Pause overlay hierarchy; resume/restart/abandon mood; some chrome is boss/stick/consumable and must not force scope.
3. `STARFIRE_ARMADA_UI_HANDOFF/new_assets/ships/gameplay_sprites/01_rapid_fire_sprite.png`  
   — Top-down Rapid-Fire battle sprite (multi-barrel silhouette).
4. `STARFIRE_ARMADA_UI_HANDOFF/new_assets/ships/master_art/01_rapid_fire_master.png`  
   — High-detail menu/master art.
5. `public/assets/ui-v2/ships/gameplay_sprites/01_rapid_fire_sprite.png` — runtime copy verified.
6. `public/assets/ui-v2/backgrounds/chapter_01_void_frontier.png` — Chapter 1 backdrop candidate.

Index cross-check: Batch 5 rows in `docs/UI_REFERENCE_INDEX.md` (`43`–`45`, ship sprite/master sections B–C). Boss HUD `44` noted as out-of-slice.

No dedicated projectile / enemy / Fire-Up asset packs exist under `STARFIRE_ARMADA_UI_HANDOFF/new_assets` or `public/assets` (filename search empty).

---

## Current-project conflicts

1. **Legacy `weaponLevels` vs Firepower 0–10**  
   Rapid-Fire authors permanent levels Twin Shot→Vertical Storm (2/4/6/9/13 projectiles). Approved combat uses temporary Firepower 0–10. Spec: combat Firepower is separate; do not revive Ship Weapon Upgrade as a second system.

2. **Signature name collision**  
   UI/abilities resolve Signature as **Twin Shot** (`weaponLevels[0]`). Approved working name was Suppressive Barrage. Spec keeps **Twin Shot** until an explicit rename; combat implements barrage behavior on the Signature channel.

3. **Passive / Calamity naming vs working concepts**  
   Canonical **Overdrive Coils** / **Cataclysm Barrage** vs Accelerating Assault / Overdrive Bullet Storm. Keep canonical names; map behaviors in the engine.

4. **“Overdrive” overloaded**  
   Passive name, Max Firepower Overdrive buff, and module Overdrive Matrix. Disambiguate in HUD; modules stay non-combat for the slice.

5. **Star Rank combat modifiers absent**  
   Code today: HP/Damage/Defense/Crit % only. Pierce / FP mastery / Signature cooldown combat mods are **new runtime layers**, not existing data — doable without schema change.

6. **HUD Shield bar**  
   Reference shows Shield; ship combat stats expose HP + Defense, no battle shield pool. Unresolved: Hull-only vs temp shield.

7. **Placeholder GameplayScreen**  
   No movement, fire, collisions, or performance population; DEV buttons only. Session pipeline is otherwise ready.

---

## Missing assets (genuine)

| Asset | Status |
|-------|--------|
| Primary / heavy projectile art | **missing** (procedural reusable bolt OK for prototype) |
| Muzzle / hit / destruction VFX | **missing** (procedural OK) |
| Fire-Up pickup | **missing** |
| Overdrive aura | **missing** (sprite tint/aura OK) |
| Calamity activation art | **missing** (procedural OK) |
| Basic / shooting / Power Carrier sprites | **missing** (geometric temps OK) |

**Ready:** Rapid-Fire gameplay sprite, master/hero/roster art, Chapter 1 background (CSS crop/parallax).

---

## Recommended implementation file structure

```
src/gameplay/                 # new engine module (suggested)
  RapidFireVerticalSlice.ts    # stage config / wave table (data)
  firepower.ts                 # FP 0–10 patterns + Overdrive
  combatModifiers.ts           # ★ runtime combat layers
  abilities/
    signature.ts
    passive.ts
    calamity.ts
  entities/                    # player, enemies, pickups, projectiles
  systems/                     # collision, spawn, damage, meter
  GameCanvas.tsx               # mounts into GameplayScreen
docs/gameplay/RAPID_FIRE_VERTICAL_SLICE_SPEC.md  # this slice’s law
```

Keep `GameplayScreen.tsx` as the route shell (session gate + pause + Results handoff). Do not put reward grants in the canvas.

---

## Recommended first coding task

**Implement in-memory Rapid-Fire combat core on `GameplayScreen` for `ch1-stage-1`:**

1. Touch-drag player using ready gameplay sprite  
2. Automatic primary fire with Firepower 0–10 + Fire-Up pickups + Overdrive  
3. Basic + shooting + Power Carrier enemies, finite waves, Hull death  
4. Wire victory/defeat through existing session APIs with real `BattlePerformance`  
5. Minimal HUD: Hull, Firepower, waves, Pause, Calamity when unlocked  

Defer Signature/Passive/Calamity polish to immediately follow once primary fire loop is playable — or include thin stubs in the same PR if time allows, but **do not block** on missing VFX PNGs (use procedural fallbacks).

---

## Risks that could force architecture changes

| Risk | Severity | Mitigation |
|------|----------|------------|
| Treating `weaponLevels` / `weaponLevel` as Firepower | High | Spec forbids; Firepower is battle-only state |
| Persisting Firepower / Momentum / Overdrive | High | Keep in engine memory only |
| Dual weapon systems (ship weapon + Arsenal + Firepower) | High | Arsenal secondary postponed; one intrinsic fire path |
| Renaming abilities mid-slice without UI migration | Medium | Keep names; behavior-first |
| Adding shield persistence for HUD parity | Medium | Prefer temp combat shield or Hull-only |
| Expanding `BattlePerformance` for new meters | Low | Existing optional fields suffice for Results |

No save-schema bump is required for the slice if temporary state stays in memory.

---

## Verification (this audit)

- Referenced project files exist (inspected).  
- Listed **ready** asset paths exist under `public/assets/ui-v2/...`.  
- Canonical ship ID not guessed: `ship-01-rapid-fire` / Rapid-Fire.  
- No duplicate Arsenal/ship-weapon combat system proposed.  
- Postponed systems explicitly excluded.  
- Build **not** run (documentation-only).
