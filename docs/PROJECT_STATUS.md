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
- Gameplay (placeholder canvas, requires an active battle session, dev-only debug victory/defeat trigger) (`src/screens/gameplay`)
- Results — complete Victory/Defeat screen (hero, performance summary, grouped reward summary, actions) consuming only the canonical battle-results contract (`src/screens/results`, `src/components/results`)
- Player Profile + Edit Profile modal (`src/screens/profile`, `src/components/profile`)
- Player Level-Up modal, integrated into Results on victory (`src/components/level-up`)
- Reward Reveal overlay for special rewards (new collectibles, Rare/Epic chests, Epic/Legendary rewards), integrated into Results after Level-Up (`src/components/reward-reveal`)

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
- Reward Reveal queue helper — decides which already-applied entries from a `BattleResultsView` are special enough for a dedicated reveal (new collectibles; Rare/Epic chests; other Epic/Legendary grants), built entirely on top of `rewardDisplay.ts` (`src/data/rewardReveal.ts`)
- Campaign stage accessibility helper — the one canonical "is this stage reachable" rule (linear per-chapter progression via `highestClearedStageId`), shared by Stage Detail and Pre-Battle instead of each re-deriving its own calculation (`src/data/campaign.ts`'s `isStageAccessible`)

## Current architecture

- Single canonical player store (`src/store/playerStore.tsx`) owns all persisted `PlayerState` plus the in-memory `battleSession`.
- `battleSession` (`src/systems/battleSession.ts`) is a pure, explicit state-machine (`idle → preparing → active → victory/defeat → completing → completed → results`) with a legal-transition table. It is held only in the store's in-memory state (`useState`/`useRef`), never persisted.
- Reward flow: `resolveStageRewards` (resolve) → `applyRewardBundle` (atomic apply) → `applyCompleteCampaignStage` (stage-clear/first-clear orchestration) → called once, exactly-once-per-session, from `completeBattleSession`.
- `ResultsScreen` reads only `getBattleResultsView(battleSession)`; it does not grant rewards itself — all rewards are applied before Results renders.
- `getBattleResultsView` groups the completion's already-applied entries (`application.applied`) into mutually-exclusive display groups — `firstClearRewards`, `baseRewards`, `levelUpRewards`, `newCollectibles` — plus `duplicateConversions`, purely by filtering on each entry's existing `source`/`kind` and on reference-equality with `duplicateConversions[i].converted`. Nothing is recomputed; an entry never appears in two groups.
- `ResultsScreen` opens `PlayerLevelUpModal` when `outcome === "victory" && playerLevelsGained > 0`, gated by an in-memory `sessionId` marker (component state, never persisted) so it shows exactly once per completed session and never reopens on rerender. Replay/Retry both reuse the existing `retryBattle` store action (fresh sessionId, same stage/difficulty, Energy validated + spent once via the canonical session-start path); Continue reuses the existing Stage Detail `?id=` navigation convention and never spends Energy.
- `ResultsScreen` opens `RewardRevealOverlay` (built from `getRewardRevealQueue(view)`) only after Level-Up is absent or already closed, gated by its own in-memory `sessionId` marker — same once-per-session/never-reopens-on-rerender pattern as Level-Up. Presentation order on victory is always Level-Up → Reward Reveal → normal Results; every Results navigation action is disabled while either overlay is open.
- Canonical battle navigation loop (Campaign → Stage Detail → Pre-Battle → Gameplay → Victory/Defeat → Results → Continue/Replay/Retry/Campaign) is stabilized end-to-end: `CampaignStageDetailScreen`/`PreBattleScreen` resolve a real canonical stage (`data/campaign.ts`'s `getStageById`) when the incoming `?id=` matches one — gating `isStageAccessible` and using the real `getBattleEnergyCost` — and fall back to the existing prototype reference-map content (`campaignChapterMap.ts`'s disconnected "stage-N" ids) unchanged for prototype-only ids. Pre-Battle's Start button now calls the real `startBattle` action (validates stage/accessibility/Energy, deducts Energy exactly once, only navigates to Gameplay on success) instead of navigating to the unwired Battle Launch placeholder. `GameplayScreen` now requires an active session (`battleSession?.status === "active"`) — a missing/invalid session redirects to Campaign and clears any stale session via `resetBattle`, never self-starts one — and reads stage/ship identity from the session itself, not the player's mutable "current" pointers. Its Win/Lose Stage debug controls are gated by `import.meta.env.DEV` (dead-code-eliminated from production builds; verified by grepping the built bundle) and still drive only the real canonical `declareBattleVictory`/`declareBattleDefeat` → `completeBattle` → `enterBattleResults` pipeline.
- The "legacy" real-stage `CampaignScreen` (`#/campaign/chapter-map/legacy`) now routes its Play/Continue buttons through Stage Detail (`?id=` convention) instead of jumping straight to Gameplay, so it also goes through Pre-Battle's Energy-validated session start rather than bypassing it.
- Shared UI motion foundation (`src/styles/motion.css` — tokens/keyframes/utility classes; `src/components/motion/` — `motionMath.ts`, `AnimatedNumber`, `ProgressFill`, `MotionStaggerGroup`) is applied selectively to Player Profile (XP bar, Total Power, section stagger), Battle Results (bounded reveal stagger, XP/Credits count-up, sequential stars), the Player Level-Up modal (shared tokens, currency count-up, rarity glow), the Reward Reveal overlay (shared tokens, Rare/Epic glow added alongside the existing Legendary glow), and `ModalLayer` (shared backdrop fade + panel entrance for every modal in the app). Purely presentational — no progression, reward, economy, save, or routing logic changed.

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

- Real combat victory/defeat conditions are not yet integrated — the gameplay engine is still a placeholder canvas; outcomes are only triggered via a dev-only debug button (stripped from production builds).
- No difficulty selector or loadout-validation gate exists yet in Pre-Battle — Start always uses the default `"normal"` difficulty and the player's already-owned `selectedShipId` (always valid by construction); both remain future work if/when those become real player choices.
- The prototype Chapter Map / Stage Detail / Pre-Battle reference content (`campaignChapterMap.ts`'s "stage-N" ids, disconnected from `data/campaign.ts`'s real "ch1-stage-N" ids) is unchanged and still cosmetic-only for those ids — only real canonical stage ids get a working Start button.
- Shop, Daily Rewards, Chest Opening, and Reward Reveal remain to be developed.
- Battle statistics on Player Profile are limited to what the save genuinely tracks today (stages cleared, highest stage reached, derived from `highestClearedStageId`) — battles-completed/victories/bosses-defeated counters are not persisted anywhere yet, so Profile intentionally omits them rather than showing invented zeros.

## Recommended next task

Player Profile (`#/profile`, schema v11), the Player Level-Up modal, the complete Battle Results screen (Victory/Defeat), the Reward Reveal overlay, and the full campaign battle navigation loop (Campaign → Stage Detail → Pre-Battle → Gameplay → Victory/Defeat → Results → Continue/Replay/Retry/Campaign) are implemented and stabilized end-to-end. Shop, Daily Rewards, and Chest Opening remain the next major screens to build. Real gameplay-engine integration (an actual wave/enemy/boss/firing/collision engine driving victory/defeat instead of the dev-only debug buttons) remains the main future work — every screen in the loop already calls the real canonical session/reward/XP pipeline and is ready for it.
