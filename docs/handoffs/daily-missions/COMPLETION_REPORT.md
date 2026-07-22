# Daily Missions — Completion Report

## Reference

- Visual truth: `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_4_Progression_Events_and_Account/31_Daily_Missions.png`
- Index: `docs/UI_REFERENCE_INDEX.md` → `31_Daily_Missions.png`

## Route

- `#/missions/daily` (`RouteId`: `daily-missions`)
- Home Dashboard “Daily Missions” Go → this route
- Back → Home

## Active mission types (8)

| id | event | target |
|----|--------|--------|
| `daily-complete-battle` | `battleCompleted` | 1 |
| `daily-win-battle` | `battleWon` | 1 |
| `daily-win-battles-3` | `battleWon` | 3 |
| `daily-spend-energy` | `energySpent` | 20 |
| `daily-upgrade-ship` | `shipUpgraded` | 1 |
| `daily-upgrade-weapon` | `weaponUpgraded` | 1 |
| `daily-open-chest` | `chestOpened` | 1 |
| `daily-shop-purchase` | `shopPurchaseCompleted` | 1 |

Future (hidden): `daily-destroy-enemies` (`status: "future"`).

Catalog: `src/data/dailyMissions.ts`. Progress never invented in JSX.

## Reset policy

- Local calendar day key `YYYY-MM-DD` (`getDailyMissionDayKey`)
- Forward day → fresh missions, activity, milestone claims; yesterday’s unclaimed rewards expire
- Backward clock → no reset; `lastObservedDayKey` never moves backward (prevents re-claim)
- Label: **Resets daily** (no fake countdown timer)

## Transaction owners

| Action | Owner |
|--------|--------|
| Event progress | `recordDailyMissionEvent` — hooked from successful `playerStore` txs only |
| Mission claim | `claimDailyMissionReward` → store `claimDailyMission` (persist-before-commit) |
| Milestone claim | `claimDailyActivityMilestone` → store `claimDailyActivityMilestone` |
| Rewards | `applyRewardBundle` with sources `daily-mission` / `daily-activity` |

UI never increments progress or grants rewards.

## Activity milestones

20 Credits · 40 Ship Alloy · 60 Basic Chest · 80 Credits+Weapon Parts · 100 Rare Chest + 25 Crystals  
Manual claim only.

## Schema

- `SAVE_SCHEMA_VERSION` **11 → 12**
- Persist: `dailyMissions.{ dayKey, lastObservedDayKey, missions, activityPoints, claimedMilestoneIds }`
- Migration initializes empty day state; does not grant claims/rewards

## Major visual implementation

- Hub shell + cyan title + “Resets daily” pill
- Compact mission cards: icon, copy, reward preview, `ProgressFill`, GO / CLAIM / DONE
- Sticky activity track with 5 chest milestones (claimable glow)
- Shared motion: fade-in, stagger, progress fill, claim success modal

## Intentional differences from reference

- “Resets daily” instead of a precise countdown timer
- Five milestones (20–100) vs reference’s three chest nodes
- Canonical mission titles/rewards (not placeholder screenshot copy)
- Activity strip sticky above bottom nav (reference mood); mission values from catalog

## Screenshots

- `docs/handoffs/daily-missions/screenshots/daily-missions-default-412x915.png`
- `docs/handoffs/daily-missions/screenshots/daily-missions-default-360x800.png`
- `docs/handoffs/daily-missions/screenshots/daily-missions-claimable-412x915.png`
- `docs/handoffs/daily-missions/screenshots/daily-missions-milestone-claimable-412x915.png`
- `docs/handoffs/daily-missions/screenshots/daily-missions-completed-412x915.png`

## Focused checks

- `scripts/verification/dailyMissionsVerification.ts` — **115 assertions passed**
- TypeScript type-check: pass
- Production build: pass
- Prod bundle excludes gameplay “Win Stage (debug)” / “Lose Stage (debug)”

## Unresolved

- At 360px, mission reward chips + CLAIM/GO share a denser two-row card grid; readable but tighter than 412.
- Activity track uses contained horizontal scroll on very narrow widths when five chests are shown.
