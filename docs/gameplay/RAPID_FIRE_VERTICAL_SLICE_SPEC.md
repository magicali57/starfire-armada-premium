# Rapid-Fire Vertical Slice — Implementation Specification

Canonical implementation spec for the **first playable gameplay vertical slice**.  
Functional truth remains current source/stores; visual truth remains `STARFIRE_ARMADA_UI_HANDOFF/`.  
This document does **not** change code. Values marked **prototype** require playtesting.

---

## 1. Canonical ship identity

| Field | Canonical value | Source |
|-------|-----------------|--------|
| ID | `ship-01-rapid-fire` | `src/data/ships.ts` (`RAPID_FIRE.id`) |
| Display name | **Rapid-Fire** | `ships.ts` |
| Slug | `rapid-fire` | `ships.ts` |
| Rarity | `common` | `ships.ts` |
| Role | `Attack` | `ships.ts` |
| Element | `kinetic` | `ships.ts` |
| Default ownership | Yes — only default owned/selected ship | `src/data/player.ts` (`DEFAULT_SHIP_ID`) |
| Availability | `released`, `provisionalBalance: false` | `ships.ts` |

Menu / hangar art (registered):

- Hero: `/assets/ui-v2/ships/rapid_fire_hero_transparent.png`
- Roster: `/assets/ui-v2/ships/rapid_fire_roster_transparent.png`
- Master: `/assets/ui-v2/ships/master_art/01_rapid_fire_master.png`
- Gameplay sprite: `/assets/ui-v2/ships/gameplay_sprites/01_rapid_fire_sprite.png`

---

## 2. Permanent vs temporary progression

### Permanent (persisted `PlayerState` — do not redesign for this slice)

| Axis | Owner | Notes |
|------|--------|--------|
| Ship Level (1–20) | `shipProgress.level` + `shipStats.ts` | Numerical HP/Damage/FireRate/Speed/Defense/Crit |
| Star Rank (0–5) | `shipProgress.stars` + `shipStarRank.ts` | Cumulative **menu/power** HP%/Damage%/Defense%/Crit bonuses today |
| Ability Levels | `shipAbilityLevels` + `shipAbilities.ts` | Signature / Passive / Calamity levels 1–5 |
| Arsenal | `weaponProgress` / equipped weapon | **Postponed for combat firing** in this slice |
| Companions / Modules | loadout | **Postponed for combat** in this slice |

### Temporary (in-memory battle only — never persist)

| Axis | Scope |
|------|--------|
| Firepower 0–10 | Resets every battle / Replay / Retry |
| Max Firepower Overdrive | Timer while at Firepower 10 |
| Momentum (Passive) | Decays when not hitting |
| Calamity meter charge | Battle-session meter |
| Hull (current HP) | Session combat state derived from ship HP |

**Approved rule:** Normal damage does **not** reduce Firepower. There is **no** Firepower 11.

---

## 3. Resolved ability names (canonical — do not silently rename)

Ship abilities remain **separate from Arsenal**. Use existing canonical strings:

| Category | Canonical name | Canonical description (summary) | Unlock ★ |
|----------|----------------|-----------------------------------|----------|
| Signature | **Twin Shot** *(presentation today)* | Derived from `weaponLevels[0]` via `getShipAbilityDefinitions` / Ship Detail | 0★ |
| Passive | **Overdrive Coils** | Sustained firing builds overdrive charge, boosting fire rate | 1★ |
| Calamity | **Cataclysm Barrage** | Full-screen projectile storm derived from Level-5 vertical storm pattern | 2★ |

### Naming / behavior conflicts (unresolved product decisions — not silent renames)

| Topic | Current data | Approved combat design target | Spec stance |
|-------|--------------|-------------------------------|-------------|
| Signature **name** | `Twin Shot` (from permanent `weaponLevels[0]`) | Working concept **Suppressive Barrage** | Keep **Twin Shot** until an explicit rename task; implement **Suppressive Barrage behavior** under the Signature category |
| Signature **source** | Bound to legacy `weaponLevels` / `weaponLevel` | Signature ≠ primary Firepower | Combat must **not** use `weaponLevels` as Firepower; Signature is a separate cooldown attack |
| Passive **name** | **Overdrive Coils** | Working concept **Accelerating Assault** (Momentum stacks) | Keep **Overdrive Coils**; implement Momentum-style behavior as the Passive’s combat meaning |
| Calamity **name** | **Cataclysm Barrage** | Working concept **Overdrive Bullet Storm** | Keep **Cataclysm Barrage**; implement clear-projectiles + multi-lane storm + DR as combat meaning |
| “Overdrive” word | Passive name + module “Overdrive Matrix” + Max Firepower Overdrive | Three different systems | Disambiguate in HUD copy: Passive = “Overdrive Coils”; pickup buff = **MAX FIREPOWER — OVERDRIVE**; module remains non-combat for this slice |

---

## 4. Combat loadout structure (approved)

| Slot | Behavior in this slice |
|------|-------------------------|
| Intrinsic Primary Fire | Automatic; Rapid-Fire only; driven by **Firepower 0–10** |
| Arsenal Secondary | **Postponed** — do not fire equipped Arsenal weapons |
| Signature Attack | Automatic on cooldown (Twin Shot / Suppressive Barrage behavior) |
| Passive Ability | Always-on when unlocked (★≥1): Overdrive Coils / Momentum |
| Calamity Ability | Manual ultimate when unlocked (★≥2) and meter full |
| Companion | **Postponed** |
| Modules | **Postponed** (stats may still affect Power/menus; no combat procs) |

Do **not** recreate the old permanent Ship Weapon Upgrade combat ladder.  
`ShipDefinition.weaponLevels` (Twin Shot → Vertical Storm, counts 2/4/6/9/13) is **legacy authored data** used today for UI Signature presentation — **not** the Firepower table.

---

## 5. Firepower Levels 0–10 (approved rules + prototype values)

**Approved rules**

- Start every battle at Firepower **0 / 10**.
- Each Fire-Up pickup: +1 level until 10.
- At 10, further Fire-Ups trigger / refresh **MAX FIREPOWER — OVERDRIVE** (no level 11).
- Levels **3, 5, 7, 10** are major visual/mechanic breakpoints.
- Prototype target: Firepower 10 ≈ **4–5×** practical output of Firepower 0; keep enemy/hostile bullets readable.

**Prototype interval / pattern table** (playtest-tunable)

| FP | Pattern (prototype) | Interval (ms) | Notes |
|----|---------------------|---------------|--------|
| 0 | 2 narrow straight bolts | ~240 | Baseline |
| 1 | 3 narrow bolts | ~240 | |
| 2 | 3 bolts, faster projectiles | ~215 | |
| 3 | 4 lanes, wider | ~215 | Major visual |
| 4 | 4 lanes, stronger center | ~195 | |
| 5 | 5-lane pattern | ~190 | Major visual |
| 6 | 5 main + 2 side shots every 3rd volley | ~185 | |
| 7 | Center eligible for ★ pierce rules | ~180 | Major mechanic |
| 8 | Side cannons every 2nd volley; larger shots | ~165 | |
| 9 | 7 lanes; outer reduced damage | ~160 | |
| 10 | 7 rapid lanes + heavy burst ~every 1.35s | ~145 | Max form |

Damage multipliers per lane / heavy burst: **prototype — set in engine constants; playtest to hit 4–5× output.**

---

## 6. Star Rank combat modifiers (approved target)

**Current code** only applies menu/stat % bonuses (`getShipRankBonuses`).  
**Approved combat modifiers** below are **runtime combat-only** layers for the engine — they must **not** replace or duplicate Arsenal, and should not require rewriting Level-Up economy.

| ★ | Combat modifier (approved target) |
|---|-----------------------------------|
| 0 | All FP 0–10 available; standard patterns; no pierce |
| 1 | Primary speed ~+8%; primary damage ~+5%; improved pattern stability from FP 3+ |
| 2 | Signature: extra burst **or** modest cooldown improvement (pick one in playtest) |
| 3 | From FP 7+: central shots pierce 1; FP 10 heavy may pierce up to 2 |
| 4 | Stronger Passive scaling; improved Calamity; slightly longer Overdrive |
| 5 | FP 10 mastery: heavy burst more frequent; stronger central pierce; mastery side shots during Overdrive; enhanced max-FP visuals |

**0★ must remain enjoyable and able to reach Firepower 10.**

**Unlock gate interaction (current data):** Passive unlocks at 1★, Calamity at 2★ (`ABILITY_UNLOCK_STAR_RANK`). A brand-new 0★ ship still has Signature + primary Firepower; Passive/Calamity wait for rank — **approved by current progression, not a conflict to force-change.**

---

## 7. Signature — Twin Shot (combat behavior target)

**Approved behavior intent (working: Suppressive Barrage)**

- Automatic; ~9 s cooldown (prototype)
- Three concentrated rapid volleys
- Does not interrupt primary fire
- Ability levels improve damage, volley count, cooldown, and late piercing

**Prototype values** — cooldown 9s; volleys 3; scale from `shipAbilities` Signature effect %.

---

## 8. Passive — Overdrive Coils (combat behavior target)

**Approved behavior intent (working: Accelerating Assault)**

- Successful continuous hits build **Momentum**
- Momentum increases Fire Rate
- Decays after player stops hitting enemies
- Switching targets does **not** reset
- Levels improve max stacks, bonus, decay delay

Keep display name **Overdrive Coils**.

---

## 9. Calamity — Cataclysm Barrage (combat behavior target)

**Approved behavior intent (working: Overdrive Bullet Storm)**

- Manual ultimate (HUD Calamity button — see `43_Standard_Gameplay_HUD.png`)
- Clears nearby hostile projectiles on activation
- ~4 s duration (prototype)
- Large multi-lane bullet storm; primary fire continues
- Temporary damage reduction — **not** full invincibility
- Levels improve duration, damage, coverage, final burst

---

## 10. MAX FIREPOWER — OVERDRIVE

**Approved / prototype**

| Field | Value |
|-------|--------|
| Trigger | Collect Fire-Up while already at Firepower 10 |
| Duration | ~6 s base (prototype) |
| Refresh | Additional Fire-Ups refresh; cap ~8 s |
| Bonuses | ~+20% primary Fire Rate; ~+15% primary damage; small Calamity-meter gain |
| Visual | Stronger muzzle/projectiles; subtle ship aura |
| Stacking | Bonuses do **not** stack infinitely |

---

## 11. Pickups

| Pickup | Behavior |
|--------|----------|
| Fire-Up | +1 Firepower if &lt;10; else Overdrive trigger/refresh |
| Guaranteed Power Carriers | Drop Fire-Ups (stage pacing) |
| XP / crystal / star pickups in HUD art | **Out of slice** (advanced pickups postponed) |

---

## 12. Prototype stage pacing

**Recommended host stage:** `ch1-stage-1` (“Formation Breach”) — first standard campaign stage; no boss (`kind: "standard"`). Boss stage `ch1-stage-5` is out of slice.

| Goal | Prototype target |
|------|------------------|
| Duration | ~75–90 s |
| Boss | None |
| Waves | Finite (prototype: align HUD wave chrome; e.g. 5 waves) |
| Fire-Ups | 10 guaranteed via Power Carriers + 1 extra for Overdrive testing |
| FP milestones | ~FP3 @20s · FP5 @35s · FP8 @60s · FP10 before final wave |
| Victory | All waves spawned **and** all enemies defeated |
| Defeat | Player Hull ≤ 0 |

---

## 13. Enemies required

| Type | Role |
|------|------|
| Basic enemy | Contact / simple movement; no (or rare) shots |
| Shooting enemy | Fires hostile projectiles |
| Power Carrier | Priority target; drops Fire-Up on death |

No boss entity in this slice.

---

## 14. HUD requirements

Visual reference: `43_Standard_Gameplay_HUD.png` (composition mood).  
Pause reference: `45_Pause_Menu.png` (overlay mood; strip unsupported revive/monetization).

**In-slice HUD**

- Hull bar (from ship HP) — required
- Firepower 0–10 indicator — required (not explicit in reference; add compact meter)
- Wave progress — required
- Score — optional but `BattlePerformance.score` exists
- Pause control → pause session (`pauseBattle` / `resumeBattle` already on store)
- Calamity meter + button — required when ★≥2 and ability unlocked; hidden/disabled otherwise
- Touch-drag movement (no mandatory virtual stick for prototype; reference pause art shows a stick — optional)

**Reference-only / postponed for HUD fidelity**

- Separate Shield bar (no battle shield pool in current ship stats — **unresolved**: Hull-only vs temporary shield derived from Defense)
- Objective “DESTROY 80%…” — slice victory is clear-all, not %-clear
- Floating XP/crystal pickups
- Boss HP chrome (`44_Boss_Gameplay_HUD.png`)

---

## 15. BattlePerformance fields

Existing contract (`src/systems/battleSession.ts`):

```ts
score?, enemiesDestroyed?, bossesDestroyed?, remainingHp?, remainingHpPercent?,
completionTimeMs?, damageTaken?, noDamage?, starsEarned?
```

**Slice must populate (real values only):**

- `enemiesDestroyed`
- `remainingHp` / `remainingHpPercent`
- `completionTimeMs`
- `damageTaken`
- `score` (simple formula OK)
- `noDamage` when `damageTaken === 0`
- `starsEarned` if Results already expects it — use existing Results rules; do not invent persistence
- `bossesDestroyed` → `0` or omit (no boss)

Pass performance into `declareBattleVictory` / `declareBattleDefeat` — never fabricate from Results UI.

---

## 16. Asset manifest

| Required asset | Existing file | Repo-relative path | Use | Suitability | Notes |
|----------------|---------------|--------------------|-----|-------------|-------|
| Rapid-Fire gameplay sprite | `01_rapid_fire_sprite.png` | `public/assets/ui-v2/ships/gameplay_sprites/01_rapid_fire_sprite.png` | In-battle ship | **ready** | Also mirrored in handoff `new_assets/ships/gameplay_sprites/` |
| Rapid-Fire master / menu | `01_rapid_fire_master.png` | `public/assets/ui-v2/ships/master_art/01_rapid_fire_master.png` | Menus / detail | **ready** | Hero/roster transparent variants also ready |
| Normal primary projectile | — | — | FP bolts | **missing** | Prefer 1 reusable cyan bolt via scale/glow/speed |
| Heavy burst projectile | — | — | FP10 heavy | **missing** | Same art, larger/brighter — do not require separate file if coded |
| Muzzle flash | — | — | Shot spawn | **missing** | Canvas/CSS flash fallback OK for prototype |
| Projectile hit flash | — | — | Impact | **missing** | Procedural flash OK |
| Enemy destruction | — | — | Death | **missing** | Orange burst from HUD reference mood — procedural OK |
| Fire-Up pickup | — | — | Power-up | **missing** | Distinct pickup icon required for readability; temp: gold star-like canvas shape |
| Overdrive aura | — | — | FP10 Overdrive | **missing** | CSS/canvas aura on ship sprite |
| Calamity activation | — | — | Ultimate | **missing** | Procedural storm + screen pulse OK |
| Gameplay background | `chapter_01_void_frontier.png` | `public/assets/ui-v2/backgrounds/chapter_01_void_frontier.png` | Stage backdrop | **usable with CSS treatment** | Cinematic still; parallax/crop for portrait scroll |
| Basic enemy sprite | — | — | Wave fodder | **missing** | Temp: geometric dark silhouette + red accent |
| Shooting enemy sprite | — | — | Ranged foe | **missing** | Temp: larger silhouette |
| Power Carrier treatment | — | — | Fire-Up source | **missing** | Temp: distinct color outline / icon badge |

**Reuse policy:** one primary bolt + one heavy tint/scale; do not request ten projectile PNGs.

---

## 17. Implementation boundaries

### In scope (later coding task)

Touch-drag move · auto primary Firepower 0–10 · Fire-Up · Overdrive · Star combat modifiers · Signature · Passive · Calamity · 3 enemy types · finite waves · Hull/damage/collisions · victory/defeat · real Results via existing session pipeline · basic Pause · real `BattlePerformance`.

### Explicitly out of scope

Boss · companion combat · module combat procs · Arsenal secondary fire · revive · advanced pickups · SFX · final VFX polish · ships 02–20 · Daily Login · schema/economy redesign · permanent `weaponLevels` as combat Firepower.

### Architecture constraints

- Temporary combat state lives in memory (engine + session), **not** save schema.
- Outcomes still go through `declareBattle*` → `completeBattle` → `enterBattleResults`.
- Do not add a second weapon-upgrade system.
- Do not rename abilities in data without a dedicated rename task.

---

## 18. Configurable values requiring playtesting

Fire intervals · lane damage weights · FP10 heavy cadence · Overdrive duration/cap/bonuses · Signature cooldown/volleys · Momentum stack/decay · Calamity duration/DR%/meter gain rate · enemy HP/DPS · Fire-Up drop timing · wave count · Hull vs optional temp shield.

---

## 19. Status legend for this document

| Label | Meaning |
|-------|---------|
| **Approved rule** | Design law for the slice |
| **Prototype value** | Starting number; expect tuning |
| **Unresolved decision** | Needs explicit product choice before or during first coding task |
