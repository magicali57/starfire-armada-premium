# Starfire Armada — Project Status

Factual snapshot based on the current repository and recent Git history. This document is the second-priority source of truth after source code/Git (see `AGENTS.md`).

## Implemented major screens

- Home (`src/screens/home`)
- Fleet Roster (`src/screens/fleet`)
- Ship Detail, Ship Level Up (Upgrade), Ship Star Rank, Ship Abilities (`src/screens/ship-detail`, `ship-upgrade`, `ship-star-rank`, `ship-abilities`)
- Arsenal (weapon list, detail, upgrade) (`src/screens/arsenal`)
- Companions Roster, Companion Detail, Companion Upgrade (`src/screens/companions`, `companion-detail`, `companion-upgrade`)
- Modules Inventory, Module Detail, Module Upgrade (`src/screens/modules`, `module-detail`, `module-upgrade`)
- Loadout Manager (`src/screens/loadout`)
- Inventory Hub (`src/screens/inventory`)
- Gameplay (placeholder canvas + debug victory/defeat trigger) (`src/screens/gameplay`)
- Results (consumes canonical battle-results contract) (`src/screens/results`)
- Player Profile + Edit Profile modal (`src/screens/profile`, `src/components/profile`)
- Player Level-Up modal, integrated into Results on victory (`src/components/level-up`)

## Implemented progression systems

- Ship progression: Level, Star Rank, Weapon/Ability level (`src/systems/shipStats.ts`, `shipStarRank.ts`, `shipAbilities.ts`)
- Weapon progression (Arsenal) (`src/systems/weaponProgression.ts`)
- Companion progression (`src/systems/companionProgression.ts`)
- Module progression (`src/systems/moduleProgression.ts`)
- Player (account) progression: XP and Level (`src/systems/playerProgression.ts`)
- Reward resolution and atomic application (`src/systems/rewards/`)
- Campaign stage completion (first-clear detection, stage-clear advancement) (`src/systems/rewards/completeCampaignStage.ts`)
- Battle session state machine (`src/systems/battleSession.ts`)
- Player Profile summary contract (display name, avatar, XP/level, Power, campaign/collection counts, tracked-only battle statistics) (`src/data/playerProfile.ts`)
- Reward-row presentation helper — canonical rewards → display rows (icon/label/quantity/rarity), reused by both Player Profile and the Level-Up modal (`src/data/rewardDisplay.ts`)

## Current architecture

- Single canonical player store (`src/store/playerStore.tsx`) owns all persisted `PlayerState` plus the in-memory `battleSession`.
- `battleSession` (`src/systems/battleSession.ts`) is a pure, explicit state-machine (`idle → preparing → active → victory/defeat → completing → completed → results`) with a legal-transition table. It is held only in the store's in-memory state (`useState`/`useRef`), never persisted.
- Reward flow: `resolveStageRewards` (resolve) → `applyRewardBundle` (atomic apply) → `applyCompleteCampaignStage` (stage-clear/first-clear orchestration) → called once, exactly-once-per-session, from `completeBattleSession`.
- `ResultsScreen` reads only `getBattleResultsView(battleSession)`; it does not grant rewards itself — all rewards are applied before Results renders.
- `getBattleResultsView` additionally exposes `levelUpRewards` (the completion's already-applied entries tagged `source: "level-up"`, filtered from `application.applied` — never recomputed) and reuses `unlocksEarned`. `ResultsScreen` opens `PlayerLevelUpModal` when `outcome === "victory" && playerLevelsGained > 0`, gated by an in-memory `sessionId` marker (component state, never persisted) so it shows exactly once per completed session and never reopens on rerender.
- `GameplayScreen` currently renders a placeholder canvas; its "End Stage (debug)" button manually drives the battle-session pipeline (`declareBattleVictory` → `completeBattle` → `enterBattleResults`) as a stand-in for real combat outcomes.

## Recent important commits

- `539d0f7` — Implement battle reward foundation
- `5f14307` — Implement player progression and rebalance XP
- `2dd8685` — Integrate battle session and completion flow
- `3645276` — Stabilize save system and migrations
- `30cd0ec` — Audit and balance launch economy

## Canonical state owners

- Persisted player state: `PlayerState` in the player store (`src/store/playerStore.tsx`, shape in `src/types/player.ts`).
- Temporary battle/session state: `BattleSession` in `src/systems/battleSession.ts`, held in-memory only by the player-store provider.
- Campaign clear truth: `PlayerState.highestClearedStageId` (linear progression) — never a UI flag.

## Canonical reward, XP, battle-session, save, and economy files

- Reward resolution: `src/systems/rewards/resolveRewards.ts`
- Reward application: `src/systems/rewards/applyRewards.ts`
- Campaign completion transaction: `src/systems/rewards/completeCampaignStage.ts`
- Random source (production + injectable for tests): `src/systems/rewards/randomSource.ts`
- Player (account) XP/Level: `src/systems/playerProgression.ts`
- Battle session state machine: `src/systems/battleSession.ts`
- Save persistence and migrations: `src/store/playerStore.tsx`, `src/data/player.ts`
- Save schema version constant: `src/types/player.ts` (`SAVE_SCHEMA_VERSION = 11`)
- Save key: `starfire-armada-v2:save` (`src/store/playerStore.tsx`)
- Stage/economy reward definitions: `src/data/stageRewards.ts`, `src/data/chestRewards.ts`
- Launch economy audit reference: `docs/economy/LAUNCH_ECONOMY_AUDIT.md`, `docs/economy/STARFIRE_ARMADA_COMPLETE_ECONOMY_DOCUMENT.md`

## Facts worth stating explicitly

- Player XP is account/profile XP, not ship XP. Maximum Player Level is 50.
- Rewards, Player XP, and campaign completion use canonical atomic systems (single transaction, no manual double-granting).
- Battle completion is idempotent per session (`completeBattleSession` keyed by `sessionId`; repeats return the existing completion and apply nothing again).
- `BattleSession` is owned by the player-store provider in memory and is not persisted.
- `ResultsScreen` consumes the battle-results contract (`getBattleResultsView`) and must not grant rewards manually.
- Economy launch balancing has been audited (see `docs/economy/LAUNCH_ECONOMY_AUDIT.md`).
- Ship Detail, Ship Level Up, Ship Star Rank, and Ship Abilities are implemented.

## Postponed features

- Ship Skins
- Companion Rank Up

## Known current limitations

- Real combat victory/defeat conditions are not yet integrated — the gameplay engine is still a placeholder canvas; outcomes are only triggered via a debug button.
- Shop, Daily Rewards, Chest Opening, and Reward Reveal remain to be developed.
- Battle statistics on Player Profile are limited to what the save genuinely tracks today (stages cleared, highest stage reached, derived from `highestClearedStageId`) — battles-completed/victories/bosses-defeated counters are not persisted anywhere yet, so Profile intentionally omits them rather than showing invented zeros.

## Recommended next task

Player Profile (`#/profile`, schema v11) and the Player Level-Up modal (integrated into Results) are implemented. Shop, Daily Rewards, Chest Opening, and Reward Reveal remain the next major screens to build; the full Results screen redesign is also still pending (current Results remains the minimal canonical-contract consumer).
