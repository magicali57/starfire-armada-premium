# Rapid-Fire Playability Flow — Completion Report

Focused fix so players can reach the Rapid-Fire combat prototype through normal Campaign → Fleet → Pre-Battle navigation.

## Root causes (exact)

### 1. Chapter 1 → Open Chapter opened Chapter 2

- `CampaignOverviewScreen` kept `selectedChapterId` in local React state for the detail panel only.
- `goToChapterMap` called `navigate("campaign-chapter-map")` with **no chapter query**.
- `CampaignChapterMapScreen` always rendered hard-coded `CHAPTER_MAP_INFO` (Chapter 2 / Shattered Nebula).

Selecting Chapter 1 updated the panel visually, but Open Chapter ignored that id.

### 2. Disconnected Stage 1

- Chapter Map stage cards used prototype ids `stage-1` … `stage-10` from `campaignChapterMap.ts`.
- Canonical battle pipeline expects `ch1-stage-1` from `campaign.ts`.
- Pre-Battle / Stage Detail fell back to prototype content; Start blocked with “isn't connected…”.

### 3. Missing Equip / false Homing Missiles equipped

- `getFleetRosterEntry` returned static `FLEET_ROSTER_CARDS` fixtures for reference ships.
- Fixture marked Homing Missiles `equipped: true` and Rapid-Fire `equipped: false`, ignoring `player.selectedShipId`.
- Card tap only set preview; Equip called `selectOwnedShip`, but UI lied about equipped state.
- Featured panel defaulted preview to Homing Missiles, not the live selected ship.

## Fixes

| Area | Change |
|------|--------|
| Chapter selection | `selectedChapterId` → `#/campaign/chapter-map?chapter=<id>`; map resolves via `resolveChapterMapIdFromHash`; invalid → `chapter-01` |
| Chapter 1 map | `getChapter1MapStages` maps only real `ch1-stage-N` ids |
| Fleet equip | `owned`/`equipped` from save; Equip → `selectOwnedShip`; return `?return=pre-battle&stage=` |
| Pre-Battle | Real selected ship art/name; Rapid-Fire gate; Change Ship; Start disabled unless Rapid-Fire |
| Gameplay safety | Non–Rapid-Fire session → reset (no reward) → Pre-Battle with reason |
| Labels | `chapterLabel` from `chapterIndex` in stage detail content |

## Conventions

- **Chapter selection owner:** local UI `selectedChapterId` on Campaign Overview (not save).
- **Chapter route:** `#/campaign/chapter-map?chapter=chapter-01|chapter-02`
- **Original Stage 1 id:** `stage-1` (prototype)
- **Canonical Stage 1:** `ch1-stage-1`
- **Equipped ship owner:** `player.selectedShipId` only
- **Fleet return:** `#/ships?return=pre-battle&stage=ch1-stage-1`

## Screenshots

`docs/handoffs/rapid-fire-playability-fix/screenshots/`

1. `01_chapter1_selected_412x915.png`
2. `02_chapter1_map_412x915.png`
3. `03_chapter2_map_412x915.png`
4. `04_prebattle_homing_warning_412x915.png`
5. `05_fleet_rapidfire_equip_412x915.png`
6. `06_prebattle_rapidfire_412x915.png`
7. `07_gameplay_normal_flow_412x915.png`
8. `08_prebattle_360x800.png`

## Verification

- Browser: Chapter 1/2 open correctly; Stage 1 → `ch1-stage-1`; Homing gates Start; Equip Rapid-Fire returns; Energy −10 once; combat starts
- `rapidFirePlayabilityFixVerification.ts` — 17 assertions
- Type-check / production build — pass
- Save schema — **unchanged v12**

## Unresolved

- Pre-Battle / Stage Detail mission copy still reuses Stage 7 reference placeholders (flavor only).
- Chapter 2 map stages remain prototype `stage-N` (cosmetic; Start still blocked until connected).
