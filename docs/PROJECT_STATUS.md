# Starfire Armada — Project Status

Factual snapshot based on the current repository and recent Git history. This document is functional source-of-truth priority #3 after source code/canonical stores and Git (see `AGENTS.md`).

## Visual references

The approved UI visual-reference library is available at `STARFIRE_ARMADA_UI_HANDOFF/` (173 readable images). Index: `docs/UI_REFERENCE_INDEX.md`. All visual create/redesign work must inspect the matching reference image(s) first — see **VISUAL REFERENCE RULES** in `AGENTS.md`. References are visual truth only; they do not override economy, routes, stores, or transaction logic.

## Implemented major screens

- Home (`src/screens/home`)
- Fleet Roster (`src/screens/fleet`)
- Ship Detail, Ship Level Up (Upgrade), Ship Star Rank, Ship Abilities (`src/screens/ship-detail`, `ship-upgrade`, `ship-star-rank`, `ship-abilities`)
- Arsenal (weapon list, detail, upgrade) (`src/screens/arsenal`)
- Companions Roster, Companion Detail, Companion Upgrade (`src/screens/companions`, `companion-detail`, `companion-upgrade`)
- Modules Inventory, Module Detail, Module Upgrade (`src/screens/modules`, `module-detail`, `module-upgrade`)
- Loadout Manager (`src/screens/loadout`)
- Inventory Hub (`src/screens/inventory`)
- Gameplay — Rapid-Fire canvas combat core on `ch1-stage-1` (`src/screens/gameplay`, `src/gameplay/rapidFire/`). Requires an active/paused battle session; non–Rapid-Fire ships redirect. DEV-only Win/Lose debug controls remain gated by `import.meta.env.DEV`.
- Results — Victory/Defeat visually aligned to `47_Victory_Results.png` / `48_Defeat_Results.png` (hero wings, nebula backdrop mood, framed reward cards, gold Next Stage / red Retry hierarchy). Still consumes only `getBattleResultsView` (`src/screens/results`, `src/components/results`)
- Player Profile + Edit Profile modal (`src/screens/profile`, `src/components/profile`)
- Player Level-Up modal, integrated into Results on victory (`src/components/level-up`)
- Reward Reveal overlay visually aligned to `49_Rewards_Acquired.png` (heading, first-clear banner, rarity art, gold Continue), integrated into Results after Level-Up (`src/components/reward-reveal`)
- Chest Vault / Chest Opening screen at `#/inventory/chests`, reachable from Inventory Hub's Chests category/section (`src/screens/chest-opening`)
- Shop Hub at `#/shop` — Featured hero (Commander Supply Bundle), Resources/Energy/Chests categories, confirmation + success modals, canonical `purchaseShopOffer` transaction (`src/screens/shop`, `src/data/shopOffers.ts`, `src/systems/rewards/purchaseShopOffer.ts`)
- Daily Missions at `#/missions/daily` — 8 trackable missions, activity milestones 20–100, local-day reset, atomic claims (`src/screens/missions`, `src/data/dailyMissions.ts`, `src/systems/dailyMissions/`)

## Gameplay vertical slice (implemented — Rapid-Fire core)

- **Rapid-Fire** (`ship-01-rapid-fire`) first playable combat core on **`ch1-stage-1`**.
- Spec: `docs/gameplay/RAPID_FIRE_VERTICAL_SLICE_SPEC.md`. Audit: `docs/handoffs/rapid-fire-audit/REPORT.md`. Completion: `docs/handoffs/rapid-fire-gameplay-core/COMPLETION_REPORT.md`.
- Canvas engine: Firepower 0–10 (premium 2→12 lane presentation), Fire-Up, Max Firepower, three enemy types, Hull, pause, real `BattlePerformance`, session→Results. Signature / Passive / Calamity / Arsenal secondary / companions / modules / boss still deferred.
- **Premium presentation pass**: spritesheet VFX runtime, 10-style enemy formation choreography (`src/gameplay/rapidFire/formationConfig.ts`) replacing simple downward drift, a 3-layer parallax scrolling background, and a procedural Web Audio sound system (17 event categories, mobile unlock-on-gesture, pause-menu mute/master/music/SFX controls, prefs persisted separately from the versioned save). See `docs/handoffs/rapid-fire-premium-animation/REBUILD_COMPLETION_REPORT.md`.
- **PixiJS 8 WebGL renderer migration** (renderer-only, latest): the Rapid-Fire slice now draws through a `PixiRenderer` (`src/gameplay/rapidFire/pixiRenderer.ts`) — a WebGL scene graph with pooled sprites, pre-sliced spritesheet textures, and additive-glow bloom (single `BlurFilter`) — instead of Canvas2D. The engine's simulation, formations/phase-flow, Firepower, enemy HP/damage/collisions/hitboxes, pickups, audio, `BattlePerformance`, `BattleSession`, Results/rewards, and save schema v12 are all preserved (shared entity types moved to `renderTypes.ts`; the engine builds a `RenderState` each frame and drives one loop — Pixi's ticker stays stopped). Verified here by esbuild bundling against real Pixi + structural/sim assertions; deep `tsc` and `vite build` plus all visual/mobile checks run on the developer's machine (sandbox can't run WebGL or a Pixi-scale build). See `docs/handoffs/rapid-fire-premium-animation/PIXI_MIGRATION_REPORT.md`.
- **Mobile playtest correction pass** (superseded in part by the Pixi migration above for rendering; gameplay/tuning still current): the detached thruster VFX, ship-nose muzzle-flash spritesheets, player-hit ring/spark VFX, and spritesheet enemy explosions were all removed after real mobile playtesting flagged them as fake-looking — replaced with a red ship-tint hit flash and a procedural flash/shockwave/debris destruction system. Enemy sprites were also flipped 180° (they were rendering nose-up/backwards relative to their downward travel), enemy HP was rebalanced (basic 45→130, shooter 90→300, Power Carrier 110→550) so enemies survive multiple hits, the wave timeline is now an enemy-clear-gated 12-phase state machine (`getSpawnsForPhase`, not a flat absolute-time schedule) with up to 15 enemies on stage at once, the constant top-bar wave counter was replaced with a center-screen "WARNING / WAVE N/12" announcement (exact 2s pause / 2s show / 2s transition), and the gameplay HUD was rebuilt from a full-width bar into a compact floating corner layout so the canvas fills the entire screen. See `docs/handoffs/rapid-fire-premium-animation/CORRECTION_PASS_COMPLETION_REPORT.md` — visual/audio verification is structural only (no headless browser in this sandbox), disclosed there.
- **Playability navigation** (Campaign chapter routing, Chapter 1 → `ch1-stage-1`, Fleet Equip + Pre-Battle Rapid-Fire gate): `docs/handoffs/rapid-fire-playability-fix/COMPLETION_REPORT.md`.

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
- Chest Opening transaction (`src/systems/rewards/openChest.ts`'s `openChestTransaction`) — validates a chest id + ownership, resolves `CHEST_REWARD_TABLES` via the injected `RandomSource`, and applies every resolved reward atomically through the existing `applyRewardBundle` (deducting exactly one chest in the same derived state); any failure returns the untouched original state. Chest Vault presentation helpers (`src/data/chests.ts`, `src/data/chestReveal.ts`) describe the three canonical chest containers and build reveal rows from an already-successful opening — never resolve or apply anything themselves.
- Daily Missions (`src/systems/dailyMissions/`) — `recordDailyMissionEvent` from successful store transactions only; `claimDailyMissionReward` / `claimDailyActivityMilestone` apply rewards via `applyRewardBundle`; day reset + clock-safety in `dailyMissionDay.ts`.

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
- Chest Opening screen (`ChestOpeningScreen.tsx`, route `#/inventory/chests`) drives `openChest` (a new player-store action wrapping `openChestTransaction`) — one owned chest at a time, deterministic double-tap guard (`chestOpenInFlight` ref), and a persist-before-commit ordering stricter than the store's usual best-effort `update()` helper (so a disk-write failure can never leave the UI showing a reveal the save doesn't contain). The screen's own cinematic sequence (idle → anticipation → opening → revealing → summary, SKIP-able, reduced-motion-safe) is presentation-only and reuses the shared motion foundation + `rewardDisplay.ts`/`toRewardDisplayRows` — it never resolves or applies rewards itself. Inventory Hub gained an implemented "Chests" category and a live chest-count section, both navigating to the new screen.

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
- Save schema version constant: `src/types/player.ts` (`SAVE_SCHEMA_VERSION = 12`)
- Save key: `starfire-armada-v2:save` (`src/store/playerStore.tsx`)
- Stage/economy reward definitions: `src/data/stageRewards.ts`, `src/data/chestRewards.ts`
- Daily Missions catalog: `src/data/dailyMissions.ts`
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

- Rapid-Fire combat core is playable on `ch1-stage-1` only; Signature / Passive / Calamity / Arsenal secondary / companion & module combat / bosses are not implemented yet.
- No difficulty selector or loadout-validation gate exists yet in Pre-Battle — Start always uses the default `"normal"` difficulty and the player's already-owned `selectedShipId` (always valid by construction); both remain future work if/when those become real player choices.
- The prototype Chapter Map / Stage Detail / Pre-Battle reference content (`campaignChapterMap.ts`'s "stage-N" ids, disconnected from `data/campaign.ts`'s real "ch1-stage-N" ids) is unchanged and still cosmetic-only for those ids — only real canonical stage ids get a working Start button.
- Daily Login Rewards (calendar/streak) remain to be developed. Daily Missions (task board + activity milestones) are implemented.
- Battle statistics on Player Profile are limited to what the save genuinely tracks today (stages cleared, highest stage reached, derived from `highestClearedStageId`) — battles-completed/victories/bosses-defeated counters are not persisted anywhere yet, so Profile intentionally omits them rather than showing invented zeros.

## Recommended next task

Playtest and tune Rapid-Fire prototype combat values (Firepower intervals, enemy pacing, Hull feel), then expand deferred combat systems (Signature / Passive / Calamity) or additional ships only when scheduled. Daily Login Rewards remain separate and postponed. Chapter 2+ map stages still use prototype `stage-N` ids until connected.
