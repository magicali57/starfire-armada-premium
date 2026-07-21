STARFIRE ARMADA --- GAME DESIGN AND SYSTEMS BLUEPRINT
=====================================================

**Document status:** Proposed v1.0 --- awaiting approval\
**Date:** July 16, 2026\
**Platform priority:** Android mobile, portrait orientation\
**Current development rule:** Do not generate new page references or
implement new dashboards until this blueprint is approved.\
**Next approval-gated deliverable:** Complete Screen and Navigation Map.

1. Purpose and authority
------------------------

This document defines how Starfire Armada works as a complete game. It
is the system-level source of truth for gameplay, progression, economy,
content, player data, and launch scope.

The existing homepage is approved and frozen for the current phase. Its
visible systems are treated as commitments that this blueprint must
support:

-   Player profile, level, and XP
-   Energy, Credits, and Crystals
-   Season Pass, Events, Achievements, Leaderboard, and Limited-Time
    Offers
-   Galaxy War, Boss Raid, Guild, and Multiplayer
-   Campaign progress and chapter selection
-   Player Power
-   Active Loadout
-   Daily and Weekly Missions
-   Home, Battle, Fleet, Inventory, and Shop navigation

The current codebase already contains a React/TypeScript foundation, 20
ship definitions, account and ship progress data, Campaign data, local
save handling, and preliminary Home, Fleet, Upgrade, Campaign, Gameplay,
and Results routes.

Existing balance values and unlock strings are provisional wherever they
conflict with this approved blueprint.

2. Game definition
------------------

Starfire Armada is a mobile-first, portrait vertical arcade shooter in
which the player commands collectible combat ships, clears short stages,
defeats bosses, earns resources, improves a loadout, and unlocks new
combat styles.

### 2.1 Target experience

The game should feel:

-   Immediate enough for a one-minute check-in
-   Deep enough to support months of progression
-   Easy to control with one thumb
-   Visually premium and readable on a phone
-   Rewarding without requiring constant spending
-   Understandable without excessive currencies or menus

### 2.2 Audience

The primary audience includes:

-   Mobile arcade-shooter players
-   Casual-to-midcore progression players
-   Players who enjoy collecting ships and improving builds
-   Players who prefer short sessions rather than long matches

### 2.3 Session targets

  Activity                            Target duration
  ----------------------------------- -----------------------
  Claim rewards and manage upgrades   1--3 minutes
  Standard Campaign stage             2--3 minutes
  Elite or boss stage                 3--5 minutes
  Daily Operation                     2--4 minutes
  Boss Raid attempt                   90 seconds--3 minutes
  Full daily session                  10--20 minutes

3. Product pillars
------------------

### 3.1 Distinct ships, not cosmetic reskins

Each of the 20 ships must have a recognizable weapon pattern, passive
effect, Calamity ability, role, and combat identity.

Unlocking a ship should meaningfully change how the player approaches a
stage.

### 3.2 Dodge, position, and time abilities

The game is not only about numerical Power. Skilled movement, target
positioning, pickup timing, and Calamity timing must remain important.

### 3.3 Clear progression

Every permanent upgrade must answer one of these questions:

-   Does it improve the selected ship?
-   Does it improve the equipped companion?
-   Does it improve one of the three module slots?
-   Does it unlock new content?
-   Is it cosmetic?

Systems that do not fit one of these purposes should not be added
without a strong reason.

### 3.4 Fair free-to-play structure

The player may spend money for convenience, cosmetics, and faster
collection, but the game must remain completable without payment.

No ship required for Campaign completion may be paid-only.

### 3.5 Mobile readability and performance

Combat effects must remain legible during intense scenes. The player
ship, enemy bullets, pickups, warnings, and boss attacks must be
visually distinguishable even on smaller phones.

4. Non-goals for the first public release
-----------------------------------------

The first release will not attempt to include every system shown on the
homepage as a fully networked feature.

The following are deliberately deferred:

-   Real-time competitive multiplayer
-   Real-time cooperative multiplayer
-   Guild chat and guild administration
-   Galaxy War territory simulation
-   Player-to-player trading
-   Global auction house
-   Complex crafting trees
-   Randomized stat rolls on equipment
-   Paid loot boxes
-   Forced interstitial advertising

The homepage entries for Guild, Multiplayer, and Galaxy War may display
locked or "Coming Soon" states until their post-launch phases.

5. Core player loops
--------------------

### 5.1 Moment-to-moment combat loop

1.  Enter a stage with one selected ship, one companion, and three
    modules.
2.  The ship fires its intrinsic primary weapon automatically.
3.  The player drags to move, dodge enemy fire, align shots, and collect
    pickups.
4.  The ship's passive effect activates automatically according to its
    rules.
5.  Dealing damage and collecting charge pickups fills the Calamity
    meter.
6.  The player activates Calamity at a strategically useful moment.
7.  The player survives waves, defeats elites, or destroys the boss.
8.  The stage ends in Victory, Defeat, or Abandon.

### 5.2 Short progression loop

**Play stage → receive results → claim rewards → upgrade ship/loadout →
select next stage**

This loop should take no more than a few taps after a result screen.

### 5.3 Daily loop

1.  Open the game and claim login or Inbox rewards.
2.  Review Daily Missions and available Energy.
3.  Complete Campaign, Daily Operations, or Boss Raid attempts.
4.  Claim mission activity rewards.
5.  Spend earned Credits and materials on upgrades.
6.  Check the Daily Shop or active Event rewards.

### 5.4 Weekly loop

1.  Complete five Weekly Missions.
2.  Progress the Season Pass.
3.  Improve Boss Raid performance.
4.  Clear a new Campaign milestone.
5.  Earn enough fragments or materials for a meaningful upgrade.

### 5.5 Long-term loop

1.  Complete Campaign chapters.
2.  Unlock all 20 ships.
3.  Raise ships to Level 20, Weapon Level 5, and Star Rank 5.
4.  Build and upgrade companions and modules.
5.  Complete Achievements and seasonal collections.
6.  Prepare for future endgame modes such as Galaxy War and Multiplayer.

6. Combat system
----------------

This section defines the intended gameplay rules even though combat
implementation is postponed until after the interface phase.

### 6.1 Controls

-   Portrait orientation only for gameplay.
-   The player touches and drags anywhere in the lower gameplay area to
    move the ship.
-   The ship follows with configurable sensitivity and a small smoothing
    value.
-   Primary fire is automatic while combat is active.
-   Calamity is activated through a large, touch-friendly button.
-   Pause is always available from the HUD.
-   Optional settings include drag sensitivity, haptics, screen shake,
    damage numbers, reduced flashes, and left-handed HUD placement.

### 6.2 Player combat model

The player has:

-   Hull HP
-   Defense
-   Movement Speed
-   Damage
-   Fire Rate
-   Critical Chance
-   One intrinsic primary weapon
-   One passive ability
-   One Calamity ability
-   One equipped companion
-   Three equipped modules

The player does not manually swap weapons during a stage at launch.

### 6.3 Primary weapon

Each ship owns its weapon identity. The primary weapon is not a separate
inventory item and cannot be moved to another ship.

The weapon has five permanent levels. Each level changes the firing
pattern, projectile behavior, or combat function---not only the damage
number.

Examples include rapid projectiles, a continuous beam, homing missiles,
chain electricity, plasma spread, orbital cannons, and void effects.

### 6.4 Calamity ability

Each ship has one powerful active ability called a **Calamity**.

Rules:

-   Calamity begins each stage empty unless an event modifier says
    otherwise.
-   It charges by dealing damage, destroying enemies, and collecting
    Calamity pickups.
-   It cannot be purchased during combat.
-   It provides major damage, control, defense, healing, or area
    clearing according to the ship identity.
-   A full meter may be held until the player chooses to activate it.
-   Boss invulnerability phases pause damage but do not consume the
    meter unfairly.

### 6.5 Companion behavior

The equipped companion follows the ship and acts automatically.

A companion may attack, shield, repair, collect pickups, or apply
utility. Companions do not require a separate active button at launch.

### 6.6 In-stage pickups

  Pickup            Function
  ----------------- ------------------------------------------
  Repair Cell       Restores a percentage of Hull HP
  Shield Cell       Grants temporary absorb damage
  Overcharge        Temporarily improves fire output
  Calamity Charge   Adds Calamity meter charge
  Magnet            Temporarily increases pickup radius
  Credit Drop       Adds a small Results-screen Credit bonus

Permanent materials are awarded on the Results screen, not dropped as
tiny objects that may be missed.

### 6.7 Enemy and boss rules

Enemies are built from readable behavior families:

-   Straight attackers
-   Formation shooters
-   Side-entry attackers
-   Chargers
-   Turrets
-   Shielded units
-   Elite variants
-   Mini-bosses
-   Chapter bosses

Bosses use telegraphed phases. Dangerous attacks must show warnings
before damage begins.

A boss should never hide unavoidable damage beneath decorative effects.

### 6.8 Victory, defeat, and abandon

Victory conditions depend on stage type:

-   Destroy the stage boss
-   Destroy all required waves
-   Survive until the timer ends
-   Reach a target score or objective

Defeat occurs when Hull HP reaches zero and no revive is used.

Abandon occurs when the player exits through the Pause menu.

Rules:

-   Energy is consumed when a stage begins.
-   Victory grants full base and objective rewards.
-   Defeat grants a small consolation amount of Credits but no
    first-clear reward.
-   Abandon grants no rewards.
-   One optional revive may be offered per stage through a rewarded ad
    or a limited Revive Token.
-   The player must always be able to decline the revive.

7. Game modes
-------------

### 7.1 Campaign --- launch-critical

The main progression mode. Players clear chapters and stages, earn
Account XP, unlock ships, and access new systems.

-   Planned structure: 15 chapters, 10 stages per chapter.
-   Public-launch target: Chapters 1--5, totaling 50 stages.
-   Chapters 6--15 are post-launch content using the same structure.
-   Each chapter ends with a major boss at Stage 10.
-   Campaign uses Energy.

### 7.2 Daily Operations --- launch-critical

Short rotating resource missions.

Three operation types:

-   **Credit Run:** primarily awards Credits.
-   **Salvage Run:** primarily awards Ship Alloy and Module Parts.
-   **Core Extraction:** primarily awards Weapon Cores and Companion
    Data.

Rules:

-   Two rewarded entries per day across the operation set.
-   Additional entries may use Energy or an Operation Pass earned from
    missions.
-   Difficulty tiers unlock through Account Level and Campaign progress.

### 7.3 Boss Raid --- public-launch feature

A repeatable single-boss challenge designed for build testing and score
improvement.

-   Uses Raid Tickets rather than Energy.
-   Grants three tickets at daily reset, up to a cap of six.
-   Attempts last 90 seconds to three minutes.
-   Rewards are based on the highest damage tier reached that day.
-   Repeated attempts improve score but do not endlessly generate full
    rewards.
-   A local leaderboard works without a backend.
-   A platform or global leaderboard may be added through online
    services.

### 7.4 Event Missions --- public-launch feature

Limited-time stage sets with modifiers, rewards, and Event Tokens.

-   Typical duration: 7--14 days.
-   Event Tokens are temporary and belong only to that event.
-   Event rewards may include cosmetics, fragments, Credits, materials,
    and Crystals.
-   Event-exclusive combat power must return through another earnable
    route later.

### 7.5 Training --- launch-critical

A no-cost practice mode.

-   No Energy cost.
-   No permanent rewards.
-   Lets players test owned ships, companions, modules, weapon levels,
    and Calamity behavior.
-   May provide stationary targets, moving targets, and a damage
    summary.

### 7.6 Endless Survival --- post-launch candidate

An escalating endless mode with score milestones and weekly rewards.

This is not required for the first public release.

### 7.7 Multiplayer --- post-launch

The homepage entry remains, but the first public release does not
promise real-time multiplayer.

The preferred eventual form is two-player cooperative survival or boss
combat before competitive PvP.

### 7.8 Guild --- post-launch

Guild membership, contribution tasks, guild rewards, and social
identity.

Chat and moderation require online infrastructure and are excluded from
the first release.

### 7.9 Galaxy War --- post-launch endgame

A guild-based territory or sector-control mode.

It depends on Guild, server-authoritative schedules, matchmaking,
rewards, and anti-cheat systems. It must not be implemented as a
disconnected decorative page.

8. Progression architecture
---------------------------

Player progression has five permanent layers:

1.  Account Level
2.  Campaign Progress
3.  Ship Progress
4.  Companion Progress
5.  Module Progress

Season Pass and Events are time-limited progression layers and do not
replace permanent progression.

### 8.1 Account Level

-   Launch maximum: Level 50.
-   Account XP comes from Campaign, Daily Operations, Boss Raid
    milestones, Missions, and Achievements.
-   Account Level unlocks systems and some ships.
-   Level-up rewards include Credits, Energy, materials, and occasional
    Crystals.
-   Leveling never directly reduces enemy difficulty.

Recommended milestone unlocks:

  Level   Unlock
  ------- ------------------------------------------------
  1       Home, Campaign, Fleet, Rapid-Fire ship
  2       Inventory and module management
  3       Daily Missions
  4       Achievements
  5       Season Pass and Laser Beam ship
  6       Daily Operations
  8       Events and Homing Missiles ship
  10      Boss Raid and Electric Shock ship
  12      Shield Generator ship
  15      Full companion system and Drone Support ship
  18      Ice/Frost ship
  20      Advanced Operation difficulty
  22      Boomerang Blades ship
  25      Mine Layer ship and future-mode preview access
  30      Veteran Campaign difficulty when released

Shop access should exist from the start, but real-money offers should
not interrupt the onboarding flow.

### 8.2 Campaign progress

Campaign progression records:

-   Highest unlocked chapter
-   Highest unlocked stage
-   Clear state for every stage
-   Best grade
-   Three objective stars per stage
-   First-clear reward claim state
-   Chapter reward chest claim state

### 8.3 Player Power

Player Power is an estimate of loadout strength, not a guarantee of
victory.

It is calculated from:

-   Selected ship stats
-   Ship Level
-   Ship Star Rank
-   Ship Weapon Level
-   Equipped companion
-   Equipped Core module
-   Equipped Plating module
-   Equipped System module

Recommended Power on stages is guidance:

-   Green: at or above recommendation
-   Yellow: within 15% below recommendation
-   Red: more than 15% below recommendation

Skillful players may clear red stages, but severe under-power should be
difficult.

9. Currencies and resources
---------------------------

### 9.1 Permanent top-bar currencies

Only three permanent resources appear in the global top bar.

#### Energy

Purpose: controls repeatable stage entry and session pacing.

Baseline rules:

-   Starting value: 120/120
-   Base cap: 120
-   Regeneration: 1 Energy every 5 minutes
-   Full natural refill: 10 hours
-   Campaign standard stage: 10 Energy
-   Campaign elite stage: 12 Energy
-   Campaign boss stage: 15 Energy
-   Event-stage baseline: 10 Energy
-   Energy may exceed the cap when granted as a reward.
-   Natural regeneration pauses while Energy remains above the cap.
-   An Account Level increase restores 20 Energy.

#### Credits

User-facing name: **Credits**\
Current internal code identifier: `coins`

Purpose: main earnable soft currency.

Primary sources:

-   Campaign results
-   Daily Operations
-   Missions
-   Achievements
-   Boss Raid milestones
-   Event Shops
-   Inbox compensation

Primary sinks:

-   Ship Level upgrades
-   Weapon Level upgrades
-   Companion upgrades
-   Module upgrades
-   Selected Daily Shop purchases

Starting value: 5,000 Credits.

#### Crystals

User-facing name: **Crystals**\
Current internal code identifier: `crystals`

Purpose: premium currency that is both earnable and purchasable.

Primary sources:

-   First-clear chapter milestones
-   Daily and Weekly Mission milestones
-   Achievements
-   Events
-   Season Pass free track
-   Real-money purchases

Primary sinks:

-   Optional ship-unlock shortcuts
-   Energy refills
-   Cosmetics
-   Premium Shop offers
-   Limited material bundles
-   Additional Event or Raid convenience within defined caps

Starting value: 300 Crystals.

Crystals must never be silently spent. Every Crystal purchase requires a
confirmation state showing the price and resulting balance.

### 9.2 Inventory resources

These are materials or entry items, not permanent top-bar currencies.

  Resource              Purpose
  --------------------- ------------------------------------------------------------
  Ship Alloy            Ship Level upgrades
  Ship Fragments        Unlock and increase Star Rank for a specific ship
  Universal Fragments   Substitute for a limited number of specific ship fragments
  Weapon Cores          Permanent Weapon Level upgrades
  Companion Data        Companion Level and rank upgrades
  Module Parts          Module Level upgrades
  Raid Tickets          Boss Raid entry
  Operation Passes      Additional Daily Operation entry
  Event Tokens          Temporary Event Shop currency
  Revive Tokens         Optional non-ad stage revive

The game should not add new materials unless a progression system
genuinely requires a separate resource.

10. Ship system
---------------

### 10.1 Authoritative roster

1.  Rapid-Fire
2.  Laser Beam
3.  Homing Missiles
4.  Electric Shock
5.  Plasma Spread
6.  Shield Generator
7.  Stealth Ops
8.  Drone Support
9.  Flamethrower
10. Ice/Frost
11. Gravity Pulse
12. Poison/Acid
13. Sniper Railgun
14. Healing Support
15. EMP Burst
16. Boomerang Blades
17. Mine Layer
18. Orbital Cannons
19. Berserker Overdrive
20. Cosmic/Void

The later corrected Homing Missiles gameplay sprite is the authoritative
version.

### 10.2 Ship roles

Roles describe playstyle rather than party position:

-   **Attack:** direct damage and aggressive clearing
-   **Control:** slowing, grouping, disabling, or manipulating enemies
-   **Support:** shields, healing, drones, or survivability
-   **Heavy:** slower but high-impact or high-durability combat

### 10.3 Ship statistics

Every ship uses the same six core statistics:

-   HP
-   Damage
-   Fire Rate
-   Speed
-   Defense
-   Critical Chance

Additional effects such as burn, freeze, poison, shield generation,
healing, homing, or gravity are ability rules---not additional universal
stat bars.

### 10.4 Ship progression tracks

Each ship has four permanent tracks.

#### A. Ship Level: 1--20

-   Increases base statistics.
-   Costs Credits and Ship Alloy.
-   Does not require duplicate ships.
-   Level 20 is the public-launch cap.

The current rarity-scaled Credit curve is a suitable initial baseline.

  Rarity      Approximate total Credits from Level 1 to 20
  ----------- ----------------------------------------------
  Common      92,000
  Rare        110,000
  Epic        137,000
  Legendary   183,000
  Mythic      229,000

These are tuning values, not immutable economy promises.

#### B. Star Rank: 0--5

-   Uses ship-specific Fragments plus Credits.
-   Improves percentage-based statistics.
-   Enhances the passive at Stars 1, 3, and 5.
-   Enhances Calamity at Stars 2 and 4.
-   Star 0 means owned but not ranked up.

  Upgrade      Fragments required
  ------------ --------------------
  Star 0 → 1   20
  Star 1 → 2   40
  Star 2 → 3   80
  Star 3 → 4   120
  Star 4 → 5   200

#### C. Weapon Level: 1--5

-   Uses Weapon Cores and Credits.
-   Changes firing pattern or core behavior.
-   Must visibly feel stronger at every level.
-   Weapon Level is intrinsic to the ship and cannot be equipped
    elsewhere.

  Upgrade       Weapon Cores
  ------------- --------------
  Level 1 → 2   5
  Level 2 → 3   15
  Level 3 → 4   30
  Level 4 → 5   60

#### D. Skins

-   Cosmetic only at public launch.
-   May change ship appearance, projectiles, trails, and hangar
    presentation.
-   Skins do not provide combat statistics in the first public release.

### 10.5 Ship acquisition

A ship may be acquired through Account Level, Campaign milestones,
fragments, or Crystals.

No random loot box is required.

  Ship                  Primary unlock
  --------------------- ---------------------------------
  Rapid-Fire            Starter ship
  Laser Beam            Account Level 5
  Homing Missiles       Account Level 8
  Electric Shock        Account Level 10
  Plasma Spread         Clear Chapter 1, Stage 10
  Shield Generator      Account Level 12
  Stealth Ops           Clear Chapter 2, Stage 5
  Drone Support         Account Level 15
  Flamethrower          Clear Chapter 2, Stage 10
  Ice/Frost             Account Level 18
  Gravity Pulse         80 Fragments or 1,200 Crystals
  Poison/Acid           80 Fragments or 1,400 Crystals
  Sniper Railgun        Clear Chapter 3, Stage 5
  Healing Support       80 Fragments or 1,000 Crystals
  EMP Burst             Clear Chapter 3, Stage 10
  Boomerang Blades      Account Level 22
  Mine Layer            Account Level 25
  Orbital Cannons       Clear Chapter 4, Stage 10
  Berserker Overdrive   120 Fragments or 2,200 Crystals
  Cosmic/Void           Clear Chapter 5, Stage 10

Campaign- or level-unlocked ships enter the roster at Star 0. Their
fragments are then earned through repeat content, Missions, Events, Raid
rewards, and the Shop.

### 10.6 Ship ownership rules

-   The player may own all 20 ships.
-   Only one ship is selected for battle.
-   A locked ship can be previewed but not equipped.
-   Upgrades are permanent and cannot be refunded at launch.
-   Balance changes must never delete progress.
-   Duplicate ship rewards convert into the correct ship fragments.

11. Companion system
--------------------

### 11.1 Function

A companion is a small autonomous support craft equipped alongside the
selected ship.

The player equips exactly one companion at launch.

### 11.2 Companion categories

The initial companion set should cover six readable roles:

-   Rapid attack drone
-   Beam drone
-   Missile drone
-   Shield drone
-   Repair drone
-   Collection or utility drone

### 11.3 Companion progression

-   Level 1--20
-   Rank 0--5
-   Level costs Credits and Companion Data
-   Rank uses companion-specific Data or duplicate rewards
-   Rank upgrades improve the companion's main behavior

Companions do not use Weapon Cores, Ship Alloy, or ship fragments.

### 11.4 Companion acquisition

Sources include:

-   Campaign first-clear rewards
-   Achievements
-   Daily Operations
-   Events
-   Season Pass
-   Shop fragments or complete unlocks

At least two companions must be earnable through Campaign alone.

12. Module and Inventory system
-------------------------------

### 12.1 Loadout slots

Each loadout has three module slots:

1.  **Core** --- offensive output
2.  **Plating** --- defense and Hull survivability
3.  **System** --- utility, cooldown, pickup, movement, or economy
    effects

Modules are shared across ships and may be moved freely outside combat.

### 12.2 Module design

-   Module Level: 1--20
-   Rarity: Common, Rare, Epic, Legendary, Mythic
-   No random stat rolls at launch
-   Each named module has fixed, understandable effects
-   Duplicate copies convert into Module Parts or rank progress
-   Modules may not be changed after a stage begins

### 12.3 Initial module content target

Public-launch target: at least 12 modules.

Recommended distribution:

-   Four Core modules
-   Four Plating modules
-   Four System modules

Set bonuses are deferred until the base equipment system is stable.

### 12.4 Inventory categories

Inventory stores:

-   Companions
-   Modules
-   Ship Fragments
-   Upgrade Materials
-   Entry Items
-   Consumables
-   Cosmetics or cosmetic tokens

There is no hard inventory-cap penalty at launch.

Stackable materials use quantities. Named modules appear once with their
progression state rather than filling the Inventory with identical
copies.

13. Campaign structure
----------------------

### 13.1 Chapter architecture

The complete planned Campaign has 15 chapters. The first public release
contains Chapters 1--5.

Each chapter contains 10 stages.

  Stage   Recommended structure
  ------- ----------------------------------
  1       Standard introduction
  2       Formation variation
  3       New enemy behavior
  4       Elite stage
  5       Mini-boss or major encounter
  6       Mixed-pattern stage
  7       Hazard or environmental modifier
  8       High-density assault
  9       Survival or elite gauntlet
  10      Chapter boss

### 13.2 Stage objectives

Every Campaign stage has three objective stars:

1.  Clear the stage.
2.  Clear while retaining at least 50% Hull HP.
3.  Clear without using a revive or complete the stage-specific mastery
    objective.

The third objective may vary when a stage needs a more interesting
mastery condition.

### 13.3 Chapter reward chests

Each chapter has 30 total objective stars.

Chapter chests unlock at:

-   10 stars
-   20 stars
-   30 stars

Chest rewards may contain Credits, Crystals, Ship Alloy, Weapon Cores,
and ship fragments.

### 13.4 Stage reward rules

Each stage defines:

-   Energy cost
-   Recommended Power
-   Base Credits
-   Account XP
-   First-clear reward
-   Repeat reward
-   Possible material drops
-   Objective-star rewards

Boss stages provide significantly better first-clear rewards and may
unlock ships or systems.

### 13.5 Stage grades

Results use S, A, B, or C grades based on completion time, Hull
remaining, damage taken, and objective performance.

Grade affects a small repeat-reward bonus but does not replace the three
objective stars.

### 13.6 Campaign difficulty

Only Normal difficulty is required for public launch.

Veteran difficulty is a post-launch layer unlocked after completing
Chapter 5 and reaching Account Level 30.

Veteran reuses stage layouts with new patterns, stronger enemies, and
improved rewards rather than only multiplying enemy HP.

14. Reward system
-----------------

### 14.1 Reward categories

-   Credits
-   Crystals
-   Energy
-   Account XP
-   Ship Alloy
-   Ship Fragments
-   Weapon Cores
-   Companion Data
-   Module Parts
-   Modules
-   Companions
-   Cosmetics
-   Tickets and passes
-   Event Tokens

### 14.2 Reward presentation

Every reward source should show:

-   Reward icon
-   Reward name
-   Quantity
-   First-clear or repeat status when relevant
-   Destination after claim

Large reward bundles use a reveal sequence, but the player may skip the
animation.

### 14.3 First-clear versus repeat rewards

-   First-clear rewards are claimed once.
-   Repeat rewards are lower and farmable within Energy limits.
-   Objective stars and chapter chests are one-time.
-   Boss Raid and Events use daily or event caps to prevent unlimited
    farming.

### 14.4 Duplicate handling

-   Duplicate ships convert into ship-specific Fragments.
-   Duplicate companions convert into companion-specific Data.
-   Duplicate named modules convert into Module Parts or rank progress.
-   Duplicate cosmetics convert into a small cosmetic-token value if
    duplicates are ever possible.

### 14.5 Inbox delivery

Rewards may be delivered to Inbox when:

-   An Inventory or claim flow is interrupted
-   An Event ends
-   Compensation is issued
-   A purchase is restored
-   A leaderboard season ends

Standard Inbox rewards expire after 30 days unless marked permanent.

15. Missions, Achievements, and progression programs
----------------------------------------------------

### 15.1 Daily Missions

Six Daily Missions are generated from a controlled pool.

The pool must avoid requiring spending, advertising, or unavailable game
modes.

Example tasks:

-   Clear three Campaign stages
-   Defeat 100 enemies
-   Upgrade any ship once
-   Complete one Daily Operation
-   Use Calamity three times
-   Collect one Campaign objective star

Daily activity milestone rewards unlock at 20, 40, and 60 activity
points.

### 15.2 Weekly Missions

Five Weekly Missions provide larger goals:

-   Clear 20 stages
-   Defeat five bosses
-   Earn 15 Campaign stars
-   Complete five Daily Operations
-   Spend earned Credits on upgrades

Weekly completion grants Credits, Crystals, materials, and Season XP.

### 15.3 Achievements

Achievements are permanent, one-time goals divided into:

-   Campaign
-   Combat
-   Collection
-   Upgrade
-   Boss
-   Account
-   Event

Achievements grant Crystals, profile badges, titles, and selected
materials.

### 15.4 Season Pass

-   Season length: 28 days
-   Tiers: 50
-   Tracks: Free and Premium
-   Season XP sources: Daily Missions, Weekly Missions, Events, and
    special objectives
-   Premium track may include cosmetics, resources, Crystals, and
    fragments
-   No mandatory Campaign-completion ship is exclusive to the paid track
-   Premium purchase is optional and must clearly show all included
    rewards

### 15.5 Events

Events may include:

-   Limited missions
-   Boss variants
-   Score challenges
-   Login calendars
-   Token Shops
-   Cosmetic collections

Events must have visible start and end times.

Event Tokens do not silently carry into unrelated Events. Remaining
Tokens are converted into a predefined fallback reward when an Event
closes, after a short claim grace period.

16. Economy design
------------------

### 16.1 Economy goals

-   The player should afford frequent small upgrades.
-   A major ship unlock or rank-up should feel earned.
-   Credits should remain useful throughout the game.
-   Crystals should feel valuable without being mandatory.
-   Materials should guide players toward different modes without
    creating excessive clutter.

### 16.2 Source-and-sink matrix

  Item             Main sources                                                 Main sinks
  ---------------- ------------------------------------------------------------ ----------------------------------------------------
  Energy           Regeneration, level-up, Missions, Inbox                      Campaign, Events, additional Operations
  Credits          Campaign, Operations, Missions, Events                       All standard upgrades, Daily Shop
  Crystals         Achievements, Missions, chapter rewards, Events, purchases   Ship shortcuts, refills, cosmetics, premium offers
  Ship Alloy       Campaign, Salvage Run, Missions                              Ship Level
  Ship Fragments   Campaign milestones, Raid, Events, Shop                      Ship unlocks and Star Rank
  Weapon Cores     Core Extraction, bosses, Missions                            Weapon Level
  Companion Data   Operations, Events, duplicates                               Companion progression
  Module Parts     Campaign, Salvage Run, duplicates                            Module progression
  Raid Tickets     Daily reset, Missions                                        Boss Raid entry
  Event Tokens     Event activities                                             Event Shop

### 16.3 Economy safeguards

-   No negative balances.
-   No purchase action without price validation.
-   No Crystal spending without confirmation.
-   Failed network purchases must not consume currency.
-   Claim actions must be idempotent so repeated taps cannot duplicate
    rewards.
-   Every limited purchase displays the remaining quantity and reset
    time.
-   Economy values live in centralized configuration rather than being
    repeated across screens.

17. Shop system
---------------

The Shop is a hub with distinct categories, not one endless offer feed.

### 17.1 Daily Shop

-   Uses Credits and limited Crystals.
-   Contains materials, fragments, and occasional modules.
-   Refreshes once at the daily reset.
-   One optional rewarded-ad refresh may be offered.
-   No mandatory refresh spending.

### 17.2 Resource Shop

Contains fixed bundles of Credits, Energy, Alloy, Cores, Data, and
Parts.

Crystal prices must remain consistent with the economy model.

### 17.3 Ship and Fragment Shop

-   Shows direct-unlock ships where permitted.
-   Shows rotating fragment offers.
-   Clearly distinguishes a complete unlock from a fragment quantity.
-   Never uses misleading "almost unlocked" language.

### 17.4 Cosmetic Shop

-   Ship skins
-   Projectile skins
-   Trails
-   Profile avatars and frames
-   Cosmetic bundles

Cosmetics do not provide combat statistics at public launch.

### 17.5 Event Shop

Uses the active Event Token and closes after the Event's grace period.

### 17.6 Real-money store

Potential products:

-   Crystal packs
-   Starter pack
-   Premium Season Pass
-   Cosmetic packs
-   Limited convenience bundles

The store must support purchase restoration where the platform permits
it.

18. Unlock logic
----------------

Every feature and item uses an explicit unlock rule.

Supported rule types:

-   Available from start
-   Account Level
-   Campaign Stage clear
-   Campaign star total
-   Achievement completion
-   Fragment quantity
-   Credit or Crystal purchase
-   Event progress
-   Season Pass tier
-   Post-launch availability

A locked item always shows:

-   What it is
-   Why it is locked
-   The exact unlock requirement
-   Current progress toward the requirement
-   Whether the requirement is currently obtainable

"Coming Soon" is used only for unreleased systems, not as a substitute
for an unclear requirement.

19. Reset and timing rules
--------------------------

All live timing should use trusted server time when online. The
interface displays countdowns in the player's local time.

  System                          Reset
  ------------------------------- ----------------------------
  Daily Missions                  00:00 UTC daily
  Daily Shop                      00:00 UTC daily
  Daily Operation entries         00:00 UTC daily
  Boss Raid tickets and rewards   00:00 UTC daily
  Weekly Missions                 Monday 00:00 UTC
  Weekly leaderboard period       Monday 00:00 UTC
  Season Pass                     Every 28 days at 00:00 UTC
  Event timing                    Defined per Event
  Energy                          Continuous regeneration

Offline fallback may use device time for basic single-player systems,
but purchases, leaderboards, Event expiry, and premium claims require
verification when connectivity returns.

20. Monetization policy
-----------------------

### 20.1 Allowed monetization

-   Optional rewarded ads
-   Crystal packs
-   Premium Season Pass
-   Starter pack
-   Cosmetics
-   Clearly priced convenience bundles
-   Energy refills

### 20.2 Rewarded ads

Allowed placements:

-   One revive per stage
-   One optional Daily Shop refresh
-   A limited Energy reward
-   A limited Results-reward bonus

Rules:

-   No forced interstitial ads.
-   No ad is required to continue Campaign.
-   Ad rewards have daily caps.
-   The player sees the exact reward before watching.
-   A failed ad does not consume the opportunity.

### 20.3 Fairness rules

-   No paid-only Campaign-required ship.
-   No paid random loot box at launch.
-   No hidden odds.
-   No stat-bearing skins at launch.
-   No purchase prompt immediately after every defeat.
-   No false countdowns.
-   No offers that imply scarcity when an item is permanently available.

### 20.4 Child safety and compliance

Before public release, the game must define:

-   Target age rating
-   Privacy policy
-   Ad-network configuration
-   Consent flow where legally required
-   Purchase disclosures
-   Google Play Data Safety information

21. Player data model
---------------------

The save system must be designed for migration, not as one unstructured
object that cannot evolve.

### 21.1 Identity and profile

-   Player ID
-   Display name
-   Avatar ID
-   Profile frame ID
-   Account creation timestamp
-   Account Level
-   Current XP and XP requirement
-   Selected title or badge

### 21.2 Currency state

-   Current Energy
-   Energy cap
-   Last Energy-regeneration timestamp
-   Credits
-   Crystals

### 21.3 Ship state

For each ship:

-   Ship ID
-   Owned state
-   Level
-   Star Rank
-   Weapon Level
-   Fragment quantity
-   Equipped skin
-   Unlock progress
-   Usage statistics

Global ship fields:

-   Selected ship ID
-   Favorite ship IDs, if added later

### 21.4 Companion state

For each companion:

-   Owned state
-   Level
-   Rank
-   Data quantity
-   Equipped state

### 21.5 Module state

For each named module:

-   Owned state
-   Level
-   Rank, if used
-   Duplicate or Part progress
-   Equipped slot and ship-independent loadout state

### 21.6 Inventory state

Quantities for:

-   Ship Alloy
-   Universal Fragments
-   Weapon Cores
-   Companion Data
-   Module Parts
-   Raid Tickets
-   Operation Passes
-   Revive Tokens
-   Event Tokens by Event ID
-   Cosmetics and cosmetic tokens

### 21.7 Campaign state

-   Current chapter and stage
-   Highest unlocked chapter and stage
-   Per-stage clear state
-   Best grade
-   Objective stars
-   First-clear reward claims
-   Chapter chest claims
-   Selected difficulty

### 21.8 Mission and program state

-   Daily Mission IDs and progress
-   Daily activity milestones claimed
-   Weekly Mission IDs and progress
-   Weekly milestones claimed
-   Achievement progress and claims
-   Season ID, XP, tier claims, and Premium entitlement
-   Event progress and Event Shop purchases

### 21.9 Commerce state

-   Purchase receipts or platform references
-   Non-consumable entitlements
-   Season Pass entitlement
-   Starter-pack claimed state
-   Restore-purchase status

Sensitive payment data is never stored directly in the game save.

### 21.10 Settings state

-   Master, music, and effects volume
-   Haptics
-   Screen shake
-   Damage numbers
-   Reduced flashes
-   Graphics quality
-   Frame-rate preference
-   Drag sensitivity
-   Left-handed HUD
-   Notification permissions
-   Language

### 21.11 Statistics

-   Total play time
-   Stages entered and cleared
-   Bosses defeated
-   Enemies defeated
-   Highest Boss Raid score
-   Total Credits earned
-   Total ships unlocked
-   Calamities used

### 21.12 Save integrity

-   Save-schema version
-   Last-updated timestamp
-   Last cloud-sync timestamp
-   Local revision number
-   Cloud revision number
-   Migration history where necessary

22. Save, sync, and online architecture
---------------------------------------

### 22.1 Current development stage

Local storage is acceptable for the interface prototype and early
gameplay prototype.

### 22.2 Public-launch requirement

The public build should support:

-   Versioned local save
-   Automatic migration between schemas
-   Exportable diagnostic information without exposing private data
-   Cloud backup through an approved account or platform route where
    practical
-   Purchase restoration
-   Conflict handling using revision and timestamp rules

### 22.3 Authority rules

Local authority is acceptable for:

-   Offline Campaign progress
-   Settings
-   Training
-   Local Inventory during prototype development

Server or platform verification is required for:

-   Real-money purchases
-   Global leaderboards
-   Competitive rewards
-   Event timing and premium claims
-   Future Guild, Multiplayer, and Galaxy War systems

### 22.4 Conflict resolution

When local and cloud saves conflict, the game should compare:

-   Schema compatibility
-   Revision number
-   Latest valid timestamp
-   Progress totals
-   Purchase entitlements

The player should not lose a verified purchase because an older local
save is loaded.

23. Balance and content rules
-----------------------------

### 23.1 Rarity

Rarity indicates acquisition difficulty, growth potential, and
presentation. It must not make lower-rarity ships useless.

-   Common
-   Rare
-   Epic
-   Legendary
-   Mythic

Lower-rarity ships may remain competitive through easier progression,
specialized mechanics, and strong skill expression.

### 23.2 No twenty-element weakness chart

The ship identity tags---kinetic, electric, plasma, frost, poison, void,
and others---do not create a 20-way elemental counter chart at launch.

Enemy interactions use a limited set of understandable status effects:

-   Burn
-   Freeze or Slow
-   Shock
-   Corrode
-   EMP or Disable
-   Gravity or Pull
-   Mark or Homing
-   Shield
-   Repair

### 23.3 Power-creep control

-   New ships should provide new playstyles, not automatically higher
    base Power.
-   Campaign-required content must remain clearable with freely earned
    ships.
-   New module tiers must not invalidate all earlier modules.
-   Season rewards may accelerate progress but cannot create permanent
    unavailable superiority.

### 23.4 Centralized tuning

The following values must eventually live in centralized data or
configuration:

-   Upgrade costs
-   Reward quantities
-   Energy costs
-   XP curves
-   Unlock levels
-   Fragment costs
-   Drop rates
-   Shop prices
-   Mission targets
-   Enemy and stage scaling

Screens must read these values rather than hard-code display-only
copies.

24. Onboarding
--------------

The first-session flow should teach one system at a time.

Recommended sequence:

1.  Brief cinematic or title sequence.
2.  Player receives Rapid-Fire.
3.  Guided Campaign Stage 1 teaches drag movement and automatic fire.
4.  Stage 2 introduces pickups and Calamity.
5.  Results explain Credits and Account XP.
6.  Fleet tutorial performs one ship upgrade.
7.  Home is fully introduced.
8.  Inventory unlocks at Account Level 2.
9.  Daily Missions unlock at Account Level 3.
10. Other systems unlock gradually through the milestone table.

The tutorial must be skippable after the first essential movement lesson
and replayable from Settings or Help.

25. Notifications and retention
-------------------------------

Optional notifications may be offered for:

-   Energy full
-   Daily reset available
-   Event ending soon
-   Season ending soon
-   Inbox reward expiring

Notifications are opt-in, individually configurable where practical, and
never use misleading urgency.

Login streak rewards may exist, but missing a day should pause or reset
only a short streak---not erase long-term progress.

26. Accessibility and mobile requirements
-----------------------------------------

-   Portrait layout and safe-area support
-   Uniform scaling without non-uniform asset stretching
-   Touch targets large enough for phone use
-   Text remains readable on small screens
-   Color is never the only indicator of rarity, danger, or lock state
-   Reduced-flashing option
-   Adjustable screen shake
-   Haptics toggle
-   Independent music and effects volume
-   Damage-number toggle
-   Left-handed HUD option
-   30 FPS compatibility mode and 60 FPS target mode
-   Pause or safe recovery when the app loses focus

27. Launch scope
----------------

### 27.1 Current planning and UI phase

Deliverables after blueprint approval:

-   Complete Screen and Navigation Map
-   Prioritized page groups
-   State and interaction specification for each screen
-   Reference-image prompts
-   Approved reference mockups
-   UI implementation with mock data

No gameplay engine is required during this phase.

### 27.2 Gameplay MVP and closed-test scope

-   Home dashboard
-   Battle hub
-   Campaign Chapters 1--2
-   20 ship roster definitions, with a smaller balanced test subset
    playable where needed
-   Fleet and ship progression
-   One companion and the initial companion framework
-   Three module slots and starter modules
-   Basic HUD, Pause, Victory, Defeat, and Results
-   Local save
-   Daily Missions
-   Basic Shop using non-paid test currency
-   Settings

### 27.3 Public launch 1.0 target

-   Campaign Chapters 1--5, totaling 50 stages
-   All 20 ships obtainable
-   Six companions
-   At least 12 modules
-   Daily Operations
-   Boss Raid
-   Daily and Weekly Missions
-   Achievements
-   Season Pass
-   Limited Events
-   Daily, Resource, Fragment, Cosmetic, Event, and real-money Shop
    categories
-   Inbox
-   Profile and Settings
-   Rewarded ads under the stated limits
-   Purchases and restore flow
-   Versioned save and backup strategy
-   Performance, accessibility, privacy, and Google Play release
    requirements

### 27.4 Explicitly post-launch

-   Campaign Chapters 6--15
-   Veteran difficulty
-   Endless Survival
-   Real-time Multiplayer
-   Guild
-   Galaxy War
-   Advanced social features
-   Complex module sets
-   Additional ships beyond the original 20

28. Implementation rules derived from this blueprint
----------------------------------------------------

When development resumes:

-   Preserve the approved homepage layout.
-   Replace its mock values with centralized dynamic data over time.
-   Keep only Energy, Credits, and Crystals in the top bar.
-   Treat primary weapons as part of ships, not Inventory equipment.
-   Use one companion and three module slots.
-   Keep all 20 ship identities and the corrected Homing Missiles
    sprite.
-   Use Level 1--20, Star Rank 0--5, and Weapon Level 1--5 for ships.
-   Build Campaign data for 10 stages per chapter.
-   Separate first-clear, repeat, objective, Mission, and Event rewards.
-   Do not implement Guild, Multiplayer, or Galaxy War as fake
    functional systems.
-   Do not add forced advertisements or paid loot boxes.
-   Store economy values and requirements centrally.
-   Use versioned player data and migration-safe schemas.

29. Approval decisions
----------------------

Approval of this blueprint locks the following high-level decisions
unless later amended deliberately:

1.  Starfire Armada is a portrait, one-thumb, auto-fire arcade shooter.
2.  The global navigation remains Home, Battle, Fleet, Inventory, and
    Shop.
3.  The permanent top-bar economy is Energy, Credits, and Crystals.
4.  The roster contains the existing 20 ships.
5.  Each ship has an intrinsic primary weapon, passive, and Calamity.
6.  Ship progression uses Level 1--20, Star Rank 0--5, and Weapon Level
    1--5.
7.  Skins are cosmetic at public launch.
8.  The loadout contains one ship, one companion, and three modules.
9.  Campaign is planned for 15 chapters of 10 stages; Chapters 1--5 are
    the public-launch target.
10. Campaign, Daily Operations, Training, Boss Raid, and Events form the
    initial mode plan.
11. Guild, Multiplayer, and Galaxy War are post-launch systems.
12. Daily Missions use six tasks; Weekly Missions use five tasks.
13. The Season Pass lasts 28 days and has Free and Premium tracks.
14. Monetization uses optional rewarded ads, purchases, a Season Pass,
    and cosmetics without forced ads or paid loot boxes.
15. Player data is versioned, migration-safe, and prepared for eventual
    cloud verification.

30. Approval gate and next deliverable
--------------------------------------

This document is a proposed system blueprint and must be approved before
visual page planning continues.

The **Complete Screen and Navigation Map is intentionally not included
yet**.

After approval, the next document will define:

-   Every screen, tab, subpage, modal, overlay, and state
-   Which global navigation area owns each screen
-   Every major button destination
-   Back-navigation behavior
-   Locked, empty, loading, error, and offline states
-   Required dynamic data on each screen
-   Which screens are launch-critical, post-launch, or Coming Soon
-   The order in which reference images and UI pages should be created

Until approval, no new reference images or dashboard implementations
should be generated from this blueprint.
