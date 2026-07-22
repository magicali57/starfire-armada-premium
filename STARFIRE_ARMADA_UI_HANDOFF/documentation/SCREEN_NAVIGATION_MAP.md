# STARFIRE ARMADA — COMPLETE SCREEN AND NAVIGATION MAP

**Document status:** Proposed v1.0 — awaiting approval  
**Date:** July 16, 2026  
**Depends on:** `STARFIRE_ARMADA_GAME_DESIGN_SYSTEMS_BLUEPRINT.md` v1.0 — approved  
**Platform priority:** Android mobile, portrait orientation  
**Implementation status:** Planning only. No new reference images or dashboard implementation should begin until this map is approved.

---

## 1. Purpose

This document converts the approved game-systems blueprint into a complete interface architecture.

It defines:

- Every launch screen, subpage, modal, overlay, and system state
- Which of the five global tabs owns each screen
- Every major route and entry point
- How the approved Home dashboard connects to the rest of the game
- Forward and back-navigation rules
- Required dynamic data and principal actions
- Locked, empty, loading, offline, error, and claim states
- Which interfaces are required for prototype, public launch, or post-launch
- The order in which reference images should later be generated
- The order in which approved references should later be implemented

This document does **not** redesign the approved Home dashboard. It defines what each existing Home control should open.

---

## 2. Approved global information architecture

The five permanent navigation destinations remain:

1. **Home**
2. **Battle**
3. **Fleet**
4. **Inventory**
5. **Shop**

These are the only permanent bottom-navigation tabs.

Systems such as Missions, Achievements, Events, Season Pass, Inbox, Profile, Boss Raid, Guild, Multiplayer, and Galaxy War are reached through one of those five hubs or through approved Home shortcuts.

### 2.1 Tab ownership

| Tab | Owns |
|---|---|
| Home | Overview, profile, Inbox, settings, Missions, Achievements, Season Pass, Events, leaderboards, offers, progression summaries |
| Battle | Campaign, Daily Operations, Boss Raid, Training, Event missions, future battle modes, pre-battle preparation, gameplay and results |
| Fleet | Ship roster, ship details, acquisition, leveling, Star Rank, intrinsic weapon upgrades, abilities, skins and ship comparison |
| Inventory | Active loadout, companions, modules, materials, entry items, consumables and cosmetics inventory |
| Shop | Daily Shop, resources, ship fragments, cosmetics, Event Shop, Crystals, real-money products and purchase restoration |

### 2.2 Ownership rule

A feature has one primary owner even when it has multiple entry points.

Examples:

- Boss Raid is promoted on Home but owned by Battle.
- Season Pass is promoted on Home and owned by Home/Progression.
- Event missions are entered through Events but played under Battle.
- Event Token purchases are reached through Events but owned by Shop.
- Ship fragments are visible in Fleet and Inventory but purchased through Shop.

This prevents duplicate screens with conflicting logic.

---

## 3. Global shell rules

### 3.1 Standard dashboard shell

The standard shell contains:

- Safe-area padding
- Screen title or context header
- Player/resource top bar where appropriate
- Page content
- Persistent five-item bottom navigation
- Optional floating notification badge
- Optional contextual action bar

The standard shell is used by the five main hubs and most management screens.

### 3.2 Full-screen shell

The full-screen shell hides the persistent bottom navigation.

It is used for:

- First-run onboarding
- Pre-battle confirmation
- Gameplay
- Pause
- Victory, Defeat, and Results
- Reward reveal sequences
- Purchase processing
- Required update, maintenance, save conflict, and critical errors

### 3.3 Top-resource-bar visibility

Show Energy, Credits, and Crystals on:

- Home
- Battle Hub and non-gameplay Battle pages
- Fleet
- Inventory
- Shop
- Missions, Achievements, Events, Season Pass
- Profile and Inbox where space permits

Hide it on:

- Gameplay
- Pause
- Full-screen reward reveals
- Purchase processing
- Cinematics
- First-run tutorial combat
- Critical system screens

### 3.4 Bottom-navigation visibility

Show the five-tab bar on:

- Main tab hubs
- First-level screens that behave like part of a hub
- Roster and category screens

Hide it on:

- Item/ship detail screens when vertical space is needed
- Upgrade confirmation flows
- Pre-battle and gameplay
- Results and reward reveals
- System-critical screens

When hidden, the page must provide a clear Back control.

### 3.5 Active-tab behavior

The active tab reflects the owning area, not the exact route.

Examples:

- Campaign Stage Details keeps **Battle** active.
- Ship Upgrade keeps **Fleet** active.
- Module Detail keeps **Inventory** active.
- Daily Shop Product Detail keeps **Shop** active.
- Achievements keeps **Home** active.

### 3.6 Scroll preservation

Returning from a detail page should preserve:

- Selected tab
- Filter and sort settings
- Scroll position
- Selected item or stage
- Chapter carousel position
- Shop category position

Leaving a top-level tab and returning during the same session should preserve its latest state unless the player explicitly refreshes it.

---

## 4. Navigation behavior

### 4.1 Back priority

The Android system Back action and visible Back button follow this order:

1. Close the topmost modal, sheet, tooltip, or dropdown.
2. Close a full-screen overlay such as reward details.
3. Return from a detail screen to its immediate parent while preserving parent state.
4. Return from a secondary hub to its owning main tab.
5. From a main tab other than Home, return to Home.
6. From Home, open an “Exit game?” confirmation only in packaged Android builds.
7. On web preview, Home Back performs no destructive action.

### 4.2 Bottom-tab reselection

Tapping the active tab:

- Returns to that tab’s root hub if currently on a nested page.
- Scrolls the root hub to the top if already on the root.
- Does not reset filters or selected content unless tapped a second time after reaching the root.

### 4.3 Unsaved-change protection

A confirmation is required before leaving:

- A profile-name edit with unsaved text
- A loadout draft that differs from the equipped loadout
- Settings changes that require restart or confirmation
- A purchase flow that is processing
- Gameplay or Training currently in progress

### 4.4 Deep-link rule

Every non-modal detail page has a stable route and can reconstruct itself from IDs.

A route must never depend only on transient component state.

### 4.5 Invalid route handling

When an ID is missing, deleted, or unavailable:

- Show an inline “Content unavailable” state.
- Offer “Return to [parent hub].”
- Do not silently redirect to unrelated content.
- Log the invalid identifier during development.

---

## 5. Proposed route architecture

The current project uses simple hash routes. The approved future architecture may continue using hash navigation while adding parameterized parsing.

### 5.1 Main routes

| Route ID | Proposed path | Screen |
|---|---|---|
| `home` | `#/home` | Home Dashboard |
| `battle` | `#/battle` | Battle Hub |
| `fleet` | `#/fleet` | Fleet Roster |
| `inventory` | `#/inventory` | Inventory Hub |
| `shop` | `#/shop` | Shop Hub |

### 5.2 Home-owned routes

| Route ID | Proposed path |
|---|---|
| `profile` | `#/profile` |
| `profile-edit` | `#/profile/edit` |
| `power-breakdown` | `#/profile/power` |
| `inbox` | `#/inbox` |
| `inbox-message` | `#/inbox/:messageId` |
| `settings` | `#/settings` |
| `settings-controls` | `#/settings/controls` |
| `settings-audio` | `#/settings/audio` |
| `settings-graphics` | `#/settings/graphics` |
| `settings-accessibility` | `#/settings/accessibility` |
| `settings-account` | `#/settings/account` |
| `help` | `#/help` |
| `missions` | `#/missions` |
| `missions-daily` | `#/missions/daily` |
| `missions-weekly` | `#/missions/weekly` |
| `achievements` | `#/achievements` |
| `achievement-category` | `#/achievements/:categoryId` |
| `season-pass` | `#/season` |
| `events` | `#/events` |
| `event-detail` | `#/events/:eventId` |
| `leaderboards` | `#/leaderboards` |
| `leaderboard-detail` | `#/leaderboards/:boardId` |
| `offers` | `#/offers` |
| `offer-detail` | `#/offers/:offerId` |

### 5.3 Battle-owned routes

| Route ID | Proposed path |
|---|---|
| `campaign` | `#/battle/campaign` |
| `campaign-chapter` | `#/battle/campaign/:chapterId` |
| `campaign-stage` | `#/battle/campaign/:chapterId/:stageId` |
| `daily-operations` | `#/battle/operations` |
| `operation-detail` | `#/battle/operations/:operationId` |
| `boss-raid` | `#/battle/boss-raid` |
| `boss-raid-rankings` | `#/battle/boss-raid/rankings` |
| `training` | `#/battle/training` |
| `event-mission-list` | `#/battle/events/:eventId` |
| `event-stage` | `#/battle/events/:eventId/:stageId` |
| `pre-battle` | `#/battle/prepare/:modeId/:contentId` |
| `gameplay` | `#/battle/play/:sessionId` |
| `results` | `#/battle/results/:sessionId` |

### 5.4 Fleet-owned routes

| Route ID | Proposed path |
|---|---|
| `fleet` | `#/fleet` |
| `ship-detail` | `#/fleet/ships/:shipId` |
| `ship-level` | `#/fleet/ships/:shipId/level` |
| `ship-stars` | `#/fleet/ships/:shipId/stars` |
| `ship-weapon` | `#/fleet/ships/:shipId/weapon` |
| `ship-abilities` | `#/fleet/ships/:shipId/abilities` |
| `ship-skins` | `#/fleet/ships/:shipId/skins` |
| `ship-acquisition` | `#/fleet/ships/:shipId/acquire` |
| `ship-compare` | `#/fleet/compare` |

### 5.5 Inventory-owned routes

| Route ID | Proposed path |
|---|---|
| `inventory` | `#/inventory` |
| `loadout` | `#/inventory/loadout` |
| `companions` | `#/inventory/companions` |
| `companion-detail` | `#/inventory/companions/:companionId` |
| `companion-upgrade` | `#/inventory/companions/:companionId/upgrade` |
| `modules` | `#/inventory/modules` |
| `module-detail` | `#/inventory/modules/:moduleId` |
| `module-upgrade` | `#/inventory/modules/:moduleId/upgrade` |
| `materials` | `#/inventory/materials` |
| `material-detail` | `#/inventory/materials/:materialId` |
| `entry-items` | `#/inventory/entry-items` |
| `cosmetics-inventory` | `#/inventory/cosmetics` |

### 5.6 Shop-owned routes

| Route ID | Proposed path |
|---|---|
| `shop` | `#/shop` |
| `shop-daily` | `#/shop/daily` |
| `shop-resources` | `#/shop/resources` |
| `shop-ships` | `#/shop/ships` |
| `shop-cosmetics` | `#/shop/cosmetics` |
| `shop-event` | `#/shop/events/:eventId` |
| `shop-crystals` | `#/shop/crystals` |
| `shop-product` | `#/shop/product/:productId` |
| `purchase-history` | `#/shop/purchases` |

### 5.7 Post-launch routes

| Route ID | Proposed path |
|---|---|
| `guild-coming-soon` | `#/future/guild` |
| `multiplayer-coming-soon` | `#/future/multiplayer` |
| `galaxy-war-coming-soon` | `#/future/galaxy-war` |
| `endless-coming-soon` | `#/future/endless` |

These routes initially show honest feature previews, not fake functional dashboards.

---

## 6. Approved Home dashboard destination map

The Home dashboard layout and component positions remain frozen. Only navigation behavior and dynamic data will evolve.

### 6.1 Top bar

| Existing Home control | Destination | Behavior |
|---|---|---|
| Profile panel/avatar | Profile | Opens player identity, progression, badges, statistics and edit actions |
| Energy resource panel | Energy Refill modal | Shows current regeneration timer, cap, refill options and Energy sources |
| Credits resource panel | Shop → Resources | Opens Credit-related earn/purchase options, with earning routes emphasized before Crystal purchases |
| Crystals resource panel | Shop → Crystals | Opens Crystal packs and earnable Crystal sources |
| Energy plus | Energy Refill modal | Same as Energy resource panel |
| Credits plus | Shop → Resources | Focuses Credit bundles or source guide |
| Crystals plus | Shop → Crystals | Focuses premium currency products |
| Mail | Inbox | Badge equals unread or unclaimed count |
| Settings | Settings Hub | Opens settings categories |

### 6.2 Left-side cards

| Card | Destination |
|---|---|
| Season Pass | Season Pass |
| Events | Events Hub |
| Achievements | Achievements |
| Leaderboard | Leaderboards Hub |
| Limited Time Offer | Offers Hub or active featured Offer Detail |

The Events notification badge is dynamic and represents newly available or claimable Event content.

### 6.3 Right-side cards

| Card | Destination |
|---|---|
| Galaxy War | Galaxy War Coming Soon |
| Boss Raid | Boss Raid Hub |
| Guild | Guild Coming Soon |
| Multiplayer | Multiplayer Coming Soon |

The Boss Raid timer is dynamic and opens the currently active Raid.

### 6.4 Center and action area

| Home control | Destination |
|---|---|
| Chapter selector | Campaign Chapter/Stage map at the player’s current chapter |
| Your Power | Power Breakdown |
| Main Play button | Pre-Battle for the currently selected Campaign stage |
| Active Loadout | Loadout Manager |
| Selected ship in hero scene | Selected Ship Detail |
| Daily Missions card | Daily Missions |
| Weekly Missions card | Weekly Missions |
| Campaign Progress card | Campaign Chapter/Stage map |

The Play button must **not** launch the gameplay engine directly after the route redesign. It opens Pre-Battle so the player can review the stage, Energy cost, recommended Power and loadout.

### 6.5 Bottom navigation

| Home nav item | Destination |
|---|---|
| Home | Home Dashboard |
| Battle | Battle Hub |
| Fleet | Fleet Roster |
| Inventory | Inventory Hub |
| Shop | Shop Hub |

---

# PART A — SCREEN INVENTORY

## 7. System and first-run screens

### SYS-01 — Splash and boot

**Phase:** Prototype and public launch  
**Purpose:** Initialize assets, save data, configuration and platform services.  
**Shows:** Logo, version and loading indicator.  
**Transitions:** First-run consent, save recovery, update requirement or Home.  
**States:** Normal loading, slow loading, recoverable initialization error.

### SYS-02 — First-run privacy and consent

**Phase:** Public launch  
**Purpose:** Present required privacy, age and advertising-consent choices.  
**Actions:** Review policy, accept, configure consent, continue.  
**Rule:** The player must be able to understand which data use is optional.

### SYS-03 — New commander setup

**Phase:** Prototype/public launch  
**Purpose:** Select initial display name and starter profile identity.  
**Actions:** Enter name, select initial avatar, continue.  
**Validation:** Length, prohibited content and empty-name handling.

### SYS-04 — Intro sequence

**Phase:** Gameplay MVP  
**Purpose:** Establish the setting and transition into tutorial.  
**Actions:** Continue, skip where allowed.

### SYS-05 — Tutorial movement

**Phase:** Gameplay MVP  
**Purpose:** Teach drag movement and automatic fire.  
**Shell:** Full-screen gameplay.

### SYS-06 — Tutorial Calamity and pickups

**Phase:** Gameplay MVP  
**Purpose:** Teach pickups and the active Calamity button.

### SYS-07 — Tutorial Results

**Phase:** Gameplay MVP  
**Purpose:** Explain stage grade, Credits, Account XP and reward claiming.

### SYS-08 — Tutorial Fleet upgrade

**Phase:** Gameplay MVP  
**Purpose:** Guide the first Rapid-Fire level upgrade without overwhelming the player.

### SYS-09 — Save migration

**Phase:** Public launch  
**Purpose:** Upgrade an older local schema safely.  
**States:** Migrating, success, recoverable failure, backup restored.

### SYS-10 — Save conflict

**Phase:** Public launch  
**Purpose:** Resolve incompatible local/cloud progress.  
**Shows:** Last played time, Account Level, chapter progress and verified purchases for both saves.  
**Actions:** Use local, use cloud, support/help.

### SYS-11 — Required update

**Phase:** Public launch  
**Purpose:** Block incompatible versions and link to the official store listing.

### SYS-12 — Maintenance

**Phase:** Online post-launch/public services  
**Purpose:** Explain temporary server downtime while allowing eligible offline play where safe.

### SYS-13 — Global recoverable error

**Phase:** All  
**Purpose:** Handle route, configuration or content errors without a blank screen.  
**Actions:** Retry, return Home, copy diagnostic code.

---

## 8. Home and account screens

### H-01 — Home Dashboard

**Status:** Existing, approved and frozen  
**Phase:** Prototype/public launch  
**Dynamic data:** Player profile, XP, resources, selected ship, current chapter, Power, loadout, Missions, badges and timers.  
**Primary exits:** All mappings in Section 6.

### H-02 — Player Profile

**Purpose:** Show identity and long-term player record.

**Required content:**

- Avatar and frame
- Display name
- Account Level and XP
- Selected badge/title
- Campaign completion
- Ships owned
- Bosses defeated
- Highest Boss Raid score
- Total play time
- Achievement completion
- Edit Profile action

**Actions:** Edit profile, view Power Breakdown, view Achievements.

**States:** Normal, new badge available, statistics unavailable during migration.

### H-03 — Edit Profile

**Purpose:** Change display name, avatar, frame, title and badge.

**Actions:** Preview, save, cancel.  
**Special states:** Locked cosmetic, invalid name, unsaved changes.

### H-04 — Power Breakdown

**Purpose:** Explain the `Your Power` number.

**Sections:**

- Selected ship contribution
- Ship Level contribution
- Star Rank contribution
- Weapon Level contribution
- Companion contribution
- Core module contribution
- Plating module contribution
- System module contribution
- Total Power
- Comparison to current Campaign recommendation

**Actions:** Open Ship Detail, Companion Detail, Module Detail or Loadout.

### H-05 — Inbox

**Purpose:** Display messages and unclaimed rewards.

**Tabs/filters:** All, Rewards, System, Events.  
**Actions:** Open message, claim, claim all eligible, delete read non-reward messages.  
**States:** Unread, reward attached, claimed, expiring, expired, empty, offline.

### H-06 — Inbox Message Detail

**Purpose:** Read a complete message and inspect attached rewards.  
**Actions:** Claim, delete when eligible, return to Inbox.

### H-07 — Settings Hub

**Categories:**

- Controls
- Audio
- Graphics
- Accessibility
- Notifications
- Language
- Account and save
- Help and legal

### H-08 — Controls Settings

**Controls:** Drag sensitivity, smoothing, left-handed HUD, optional touch-offset behavior and reset to defaults.

### H-09 — Audio Settings

**Controls:** Master, music and effects volume; mute toggles.

### H-10 — Graphics Settings

**Controls:** 30/60 FPS preference, graphics quality, effects density, damage numbers and screen shake.

### H-11 — Accessibility Settings

**Controls:** Reduced flashes, stronger warnings, larger combat text, color-independent rarity labels and haptic intensity.

### H-12 — Notifications Settings

**Controls:** Energy full, daily reset, Event ending, Season ending and Inbox expiry.

### H-13 — Account and Save Settings

**Content:** Player ID, save status, cloud sync, last backup, restore purchases, privacy, delete-data request and sign-out where applicable.

### H-14 — Help and Legal

**Content:** Tutorial replay, gameplay guide, FAQ, support, privacy policy, terms, licenses and version.

---

## 9. Missions, Achievements and Season screens

### P-01 — Missions Hub

**Owner:** Home  
**Purpose:** One destination for Daily and Weekly Missions.  
**Tabs:** Daily, Weekly.  
**Header:** Time until relevant reset and activity progression.

### P-02 — Daily Missions

**Content:**

- Six Daily Missions
- Per-task progress
- Activity-point value
- Individual reward
- Go button
- Claim state
- 20/40/60 activity milestone chests
- Daily reset timer

**States:** In progress, complete, claimable, claimed, unavailable requirement, reset pending, offline.

### P-03 — Weekly Missions

**Content:**

- Five Weekly Missions
- Per-task progress
- Season XP reward
- Weekly milestone reward
- Monday reset timer

### P-04 — Mission Details sheet

**Purpose:** Explain exact task conditions and destination.  
**Actions:** Go, close.

### P-05 — Achievements Hub

**Categories:** Campaign, Combat, Collection, Upgrade, Boss, Account, Event.  
**Summary:** Total completed, total Crystals earned, featured near-completion goals.

### P-06 — Achievement Category

**Content:** Achievement cards with tier, progress, reward and claim state.  
**States:** Hidden future tier, completed, claimable, claimed.

### P-07 — Achievement Detail

**Purpose:** Show full requirement, cumulative progress and rewards.  
**Actions:** Go to relevant system, claim when complete.

### P-08 — Season Pass

**Content:**

- Season name and timer
- Current tier and Season XP
- Free and Premium reward tracks
- 50 tiers
- Claim available rewards
- Premium purchase entry
- Season missions shortcut
- Rules and expiry disclosure

**States:** Free only, Premium active, rewards available, season ended, offline cached view.

### P-09 — Season Reward Detail

**Purpose:** Preview a reward or bundle before claim.

### P-10 — Premium Pass Offer

**Purpose:** Show exact Premium rewards and price before platform purchase.  
**Rule:** Never imply Premium is required to continue.

### P-11 — Season End Summary

**Purpose:** Claim or route remaining eligible rewards and explain unclaimed-reward handling.

---

## 10. Events, offers and leaderboard screens

### E-01 — Events Hub

**Purpose:** Show active, upcoming and recently ended Events.

**Tabs:** Active, Upcoming, Ended/Grace Period.  
**Card data:** Event art, name, timer, completion, claim badge and token balance.

### E-02 — Event Detail

**Content:**

- Event story/description
- Start and end times
- Progress track
- Event Missions
- Event battle stages
- Event Token balance
- Event Shop shortcut
- Featured cosmetic or ship fragments
- Rules and Token-conversion disclosure

**Actions:** Play Event, view Missions, open Event Shop, claim milestones.

### E-03 — Event Mission List

**Owner:** Battle when stages are selected  
**Entry:** Event Detail.  
**Content:** Stage progression, modifiers, rewards, recommended Power and Energy cost.

### E-04 — Event Progress Reward Detail

**Purpose:** Preview milestone rewards.

### E-05 — Event Ended/Grace screen

**Purpose:** Allow final claims and Event Shop spending during a defined grace period.

### O-01 — Offers Hub

**Purpose:** Display current starter, convenience and cosmetic offers without overwhelming Home.

**Sections:** Featured, Starter, Cosmetic, Resource, Ending Soon.  
**Rules:** Honest timer and purchase limit.

### O-02 — Offer Detail

**Content:** All included items, normal value comparison where factual, price, purchase limit, timer and eligibility.

### L-01 — Leaderboards Hub

**Boards at launch:**

- Boss Raid
- Event score, when active
- Local records

**Future boards:** Endless, Multiplayer and Galaxy War.

### L-02 — Leaderboard Detail

**Content:** Rank, player, score, loadout summary where appropriate, reward tiers and season timer.  
**States:** Online, cached offline, no rank, tie display, season ended.

### L-03 — Leaderboard Rewards

**Purpose:** Explain score/rank reward thresholds and delivery.

---

## 11. Battle screens

### B-01 — Battle Hub

**This is the Battle tab’s root. It replaces the current behavior that sends Battle directly to gameplay.**

**Primary mode cards:**

1. Campaign
2. Daily Operations
3. Boss Raid
4. Training
5. Active Event Mission
6. Endless Survival — post-launch/Coming Soon

**Required dynamic data:**

- Current Campaign chapter and stage
- Available Energy
- Daily Operation entries
- Raid Tickets and Raid timer
- Active Event timer and completion
- Recommended next action
- Claim badges

**Primary actions:** Open a mode.  
**States:** New unlock, unavailable due to Account Level, no active Event, offline limitations.

### B-02 — Campaign Overview

**Purpose:** Browse planned chapters and current progress.

**Content:**

- Chapter carousel or sector map
- 15 planned chapter positions
- Chapters 1–5 available at public launch
- Current chapter focus
- Stars collected
- Chapter chest progress
- Boss preview
- Lock requirement for later chapters

**Actions:** Select chapter, open star chest, return Battle.

### B-03 — Campaign Chapter Map

**Purpose:** Browse the chapter’s 10 stages.

**Content:**

- Chapter title and environment
- Ten stage nodes
- Cleared grade
- Objective stars
- Current/next stage
- Boss node
- Chapter chest thresholds: 10/20/30
- Chapter reward and ship/system unlock preview

**Actions:** Select available stage, inspect chest, switch chapter.

### B-04 — Campaign Stage Detail

**Content:**

- Stage name and kind
- Enemy or boss preview
- Energy cost
- Recommended Power
- Current Power
- Three objectives
- First-clear reward
- Repeat reward
- Possible material rewards
- Best grade and fastest clear
- Current loadout summary

**Actions:** Prepare, change loadout, view reward details.  
**States:** Locked, available, cleared, all objectives complete, insufficient Energy.

### B-05 — Chapter Chest Detail

**Purpose:** Show threshold, current stars, contents and claim state.

### B-06 — Daily Operations Hub

**Content:**

- Credit Run
- Salvage Run
- Core Extraction
- Daily rewarded entries remaining
- Additional-entry rules
- Reset timer
- Difficulty tier access

### B-07 — Operation Detail

**Content:** Description, difficulty tiers, objectives, rewards, entry rule and current loadout.  
**Actions:** Select tier, prepare, view rewards.

### B-08 — Boss Raid Hub

**Content:**

- Active boss art and name
- Boss mechanics summary
- Remaining Raid Tickets
- Daily best damage
- Highest reward tier reached
- Daily timer
- Loadout summary
- Reward tiers
- Rankings shortcut

**Actions:** Prepare attempt, view boss guide, rankings, rewards.

### B-09 — Boss Raid Reward Tiers

**Purpose:** Show damage thresholds, reached state and claimed state.

### B-10 — Boss Guide

**Purpose:** Explain phases, warnings, weaknesses/status interactions and recommended strategies without revealing misleading guaranteed outcomes.

### B-11 — Boss Raid Rankings

**Purpose:** Local leaderboard initially; online/global when backend services exist.

### B-12 — Training Setup

**Content:**

- Owned ship selection
- Companion selection
- Three module slots
- Target type
- Moving/static targets
- Optional invulnerability
- Duration
- No-reward disclosure

**Actions:** Start Training.

### B-13 — Event Battle Stage List

**Entry:** Event Detail or Battle Hub active Event card.  
**Content:** Event-specific stages, modifiers, progress and Token rewards.

### B-14 — Event Stage Detail

**Same structure as Campaign Stage Detail** with Event Token rewards, Event modifiers and expiry context.

### B-15 — Pre-Battle

**Shell:** Full-screen  
**Used by:** Campaign, Operations, Boss Raid, Training and Event missions.

**Required content:**

- Mode and stage
- Energy/ticket/entry cost
- Recommended and current Power
- Selected ship
- Selected companion
- Core, Plating and System modules
- Objectives and key modifiers
- Reward preview
- Start button
- Change Loadout
- Insufficient-resource resolution

**Rule:** Entry resource is consumed only after the Start action successfully creates the battle session.

### B-16 — Insufficient Entry Resource sheet

**Variants:** Energy, Raid Tickets, Operation entries.  
**Actions:** Wait/source guide, use eligible item, refill where allowed, cancel.

---

## 12. Gameplay and result interfaces

These interfaces are planned now but their engine is implemented later.

### G-01 — Standard Gameplay HUD

**Content:**

- Player Hull HP
- Optional shield layer
- Stage progress or wave indicator
- Score
- Calamity meter and button
- Pause button
- Temporary pickup timers
- Boss warning area
- Minimal objective text

**Hidden:** Global top bar and bottom navigation.

### G-02 — Boss Gameplay HUD

Adds:

- Boss name
- Boss HP bar
- Phase markers where appropriate
- Enrage or remaining-time indicator for Boss Raid
- Dangerous-attack warning layer

### G-03 — Stage objective overlay

**Purpose:** Briefly show a new objective, survival timer or mastery condition.

### G-04 — Boss warning overlay

**Purpose:** Introduce the boss without blocking input longer than necessary.

### G-05 — Pickup/status overlay

**Purpose:** Show temporary power-up names and durations.

### G-06 — Pause menu

**Actions:**

- Resume
- Controls reminder
- Settings subset
- Restart where mode permits
- Abandon

**Rule:** Abandon clearly states the reward and entry-cost consequence.

### G-07 — Revive offer

**Purpose:** Offer one optional revive through a rewarded ad or Revive Token.

**Shows:** Exact revive effect, available method, decline button and “one per stage” rule.

### G-08 — Victory transition

Short, skippable result transition.

### G-09 — Defeat transition

Short, respectful defeat transition without an immediate aggressive purchase prompt.

### G-10 — Results Summary

**Content:**

- Victory/Defeat
- Grade
- Completion time
- Hull remaining
- Damage dealt/taken
- Enemies destroyed
- Objectives completed
- Base and bonus rewards
- Account XP
- Level-up state
- New best state

**Actions:** Continue, replay where allowed, next stage on Victory, return to mode hub.

### G-11 — Reward Reveal

**Purpose:** Show high-value first-clear, chapter, unlock or Event rewards.  
**Action:** Skip animation and continue.

### G-12 — Account Level-Up

**Content:** New level, reward and newly unlocked systems.  
**Actions:** Continue, view newly unlocked feature.

### G-13 — New Ship Unlocked

**Content:** Master ship art, role, intrinsic weapon, passive, Calamity and Equip action.

### G-14 — New Companion/Module Unlocked

**Content:** Item purpose, rarity, initial stats and Equip action.

### G-15 — Objective/Chapter Completion

**Purpose:** Show new stars, chapter chest availability or next chapter unlock.

### G-16 — Training Damage Report

**Content:** Damage per second, total damage, critical rate, Calamity damage and comparison to previous session.  
**No permanent rewards.**

---

## 13. Fleet screens

### F-01 — Fleet Roster

**This replaces/expands the current Ship Selection route and becomes the Fleet tab root.**

**Content:**

- Owned/20 count
- Selected ship
- Search
- Role filters: All, Attack, Support, Control, Heavy
- Rarity filter
- Sort: roster, Power, rarity, level, name
- Grid/list of all 20 ships
- Lock progress
- Equipped marker
- Upgrade-available badge
- Fragment-ready badge

**Actions:** Select ship, equip owned ship, inspect locked ship, open detail, compare.

**States:** Owned, selected, locked but obtainable, unreleased only if future ships are added, no filter results.

### F-02 — Ship Detail Overview

**Content:**

- Large ship presentation
- Name, rarity and role
- Current Power
- Level, Star Rank and Weapon Level
- Six core stats
- Intrinsic weapon
- Passive
- Calamity
- Equipped skin
- Fragment count
- Acquisition requirement if locked

**Actions:** Equip, acquire, Level Up, Stars, Weapon, Abilities, Skins, compare.

### F-03 — Ship Level Up

**Content:**

- Current and next stats
- Level 1–20 progress
- Credit and Ship Alloy costs
- Current balances
- Upgrade once
- Optional multi-level upgrade preview
- Max-level state

**Modals:** Upgrade confirmation for expensive/multi-level action, insufficient resources, upgrade success.

### F-04 — Ship Star Rank

**Content:**

- Star 0–5 track
- Ship-specific Fragment count
- Universal Fragment eligibility and cap
- Credit cost
- Exact passive/Calamity milestone improvement
- Stat percentage improvement
- Rank-up preview

### F-05 — Ship Weapon Upgrade

**Content:**

- Weapon Level 1–5
- Current firing pattern preview
- Next-level behavior
- Weapon Core and Credit costs
- Fire-pattern comparison
- Max-level state

### F-06 — Ship Abilities

**Tabs/sections:**

- Intrinsic Weapon
- Passive
- Calamity
- Star milestone modifications
- Status effects and rules

This is informational unless an upgrade is available through the linked progression pages.

### F-07 — Ship Skins

**Content:**

- Owned and locked skins
- Large preview
- Projectile/trail preview where supported
- Acquisition source
- Equip action
- “Cosmetic only” statement

### F-08 — Ship Acquisition

**Used for locked ships.**

**Content:**

- Exact primary unlock rule
- Current progress
- Fragment quantity
- Optional Crystal shortcut when permitted
- Campaign/Account destination
- Ship preview and abilities

**Actions:** Go to requirement, unlock with fragments, purchase shortcut with confirmation.

### F-09 — Ship Compare

**Content:** Two selected ships, equalized/current-stat toggle, role, weapon, passive, Calamity and progression differences.  
**Purpose:** Inform choice, not declare a universal winner.

### F-10 — Equip Ship confirmation

**Modal:** Usually lightweight; bypass confirmation when no meaningful side effect exists.

### F-11 — Upgrade Success overlay

**Content:** New level/rank/weapon behavior and Power increase.

---

## 14. Inventory and loadout screens

### I-01 — Inventory Hub

**Root tabs:**

1. Loadout
2. Companions
3. Modules
4. Materials
5. Entry Items
6. Cosmetics

**Header data:** Capacity is not shown because no hard Inventory cap exists at launch.

### I-02 — Loadout Manager

**Content:**

- Selected ship summary with Fleet shortcut
- One companion slot
- Core module slot
- Plating module slot
- System module slot
- Total Power
- Stat contribution summary
- Current/edited indicator
- Save/Equip Loadout action
- Reset changes

**Rules:**

- Weapons are not a separate slot.
- Ship intrinsic weapon is shown as part of the ship summary.
- Changes are unavailable after gameplay begins.

### I-03 — Slot Selection sheet

**Variants:** Companion, Core, Plating, System.  
**Content:** Compatible owned items, filters, sort, current selection and stat comparison.  
**Actions:** Select, inspect detail, clear slot where allowed.

### I-04 — Companions Roster

**Content:**

- Owned/total count
- Role filters: Attack, Defense, Repair, Utility
- Sort by Power, rarity, level and name
- Equipped marker
- Upgrade-ready badge
- Locked acquisition progress

### I-05 — Companion Detail

**Content:**

- Companion art
- Role and behavior
- Level 1–20
- Rank 0–5
- Stats/effect
- Current ship pairing
- Acquisition source

**Actions:** Equip, upgrade, rank up, acquire.

### I-06 — Companion Upgrade

**Content:** Current/next behavior, Credit and Companion Data costs, Rank milestones and max state.

### I-07 — Modules Inventory

**Filters:**

- Slot: All, Core, Plating, System
- Rarity
- Equipped/unassigned
- Upgrade available
- Sort: Power, rarity, level, name

**Card data:** Name, slot, rarity, level, main effect, equipped state.

### I-08 — Module Detail

**Content:**

- Fixed module effect
- Slot
- Rarity
- Level
- Stat contribution
- Current equipped state
- Upgrade cost
- Acquisition sources

**Actions:** Equip/replace, upgrade, source guide.

### I-09 — Module Upgrade

**Content:** Level 1–20, current/next effect, Credit and Module Part cost, max state.

### I-10 — Materials Inventory

**Content:** Ship Alloy, Universal Fragments, Weapon Cores, Companion Data, Module Parts and any valid future permanent material.

**Actions:** Open Material Detail.

### I-11 — Material Detail

**Content:** Quantity, purpose, used-by systems and exact earn sources.  
**Actions:** Go to Campaign/Operation/Event/Shop source.

### I-12 — Entry Items

**Content:** Raid Tickets, Operation Passes and Revive Tokens.  
**Shows:** Quantity, caps, refresh rule and usage.

### I-13 — Cosmetics Inventory

**Categories:** Ship skins, projectile styles, trails, avatars, frames, titles and badges.  
**Actions:** Preview, equip where appropriate, view source.

### I-14 — Replace Equipped Item confirmation

**Purpose:** Show outgoing and incoming item effects only when the replacement is meaningful.

### I-15 — Loadout Save Success

Short confirmation showing new total Power.

---

## 15. Shop screens

### S-01 — Shop Hub

**Root categories:**

1. Daily
2. Resources
3. Ships
4. Cosmetics
5. Events
6. Crystals

**Header:** Credits and Crystals; Energy where relevant.  
**Featured area:** Current honest offer, not an auto-playing disruptive carousel.

### S-02 — Daily Shop

**Content:**

- Daily material, fragment and module offers
- Credit/Crystal price
- Purchase limit
- Sold-out state
- Reset timer
- Optional one-ad refresh

### S-03 — Resource Shop

**Content:** Credit, Energy, Ship Alloy, Weapon Core, Companion Data and Module Part bundles.

**Rule:** Clearly identify whether a product uses Credits, Crystals, an ad, or real money.

### S-04 — Ship and Fragment Shop

**Content:**

- Eligible direct ship unlocks
- Rotating ship-specific Fragments
- Universal Fragment offers where allowed
- Complete-unlock versus fragment labeling
- Ownership and current-fragment progress

### S-05 — Cosmetic Shop

**Categories:** Ship skins, projectiles, trails, profile cosmetics and bundles.  
**Rule:** “Cosmetic only” is visible on combat-cosmetic products.

### S-06 — Event Shop

**Content:** Active Event Token, available products, purchase limits and grace timer.  
**Entry:** Events and Shop.

### S-07 — Crystal Store

**Content:**

- Crystal packs
- Local platform price
- Bonus disclosure
- Restore purchases
- Earn Crystals shortcut
- Legal purchase information

### S-08 — Product Detail

**Content:**

- Exact contents
- Price/currency
- Quantity and purchase limit
- Ownership warnings
- Timer
- Resulting balance preview for currency purchases where appropriate

### S-09 — Purchase Confirmation

**Variants:**

- Credits
- Crystals
- Event Tokens
- Real money/platform

**Rule:** Crystal and real-money purchases always require explicit confirmation.

### S-10 — Insufficient Currency

**Shows:** Required amount, current balance and valid earning/purchase routes.  
**Rule:** Never auto-open the real-money store.

### S-11 — Purchase Processing

**Shell:** Full-screen or blocking modal for platform purchases.  
**Actions:** No duplicate submit.

### S-12 — Purchase Success

**Content:** Purchased items, new balance and destination.  
**Actions:** Equip/view/continue when relevant.

### S-13 — Purchase Failure or Cancelled

**Content:** Clear status, no currency consumed assurance and retry when safe.

### S-14 — Purchase History and Restore

**Content:** Restorable entitlements, last restore time, help link and platform limitations.

### S-15 — Daily Refresh Confirmation

**Variants:** Free/ad/Crystal only if a Crystal refresh is deliberately approved later.  
**Public-launch baseline:** One optional rewarded-ad refresh.

---

## 16. Shared modals, sheets and overlays

### M-01 — Locked Content

Shows exact unlock requirement and current progress.

### M-02 — Coming Soon Feature

Shows:

- Feature name
- Honest post-launch status
- Brief intended purpose
- No fake countdown unless a real date exists
- Back action

### M-03 — Reward Preview

Lists all items in a chest, stage, Mission or offer.

### M-04 — Claim Reward

Confirms a claim when needed; simple claims may complete immediately.

### M-05 — Claim All Summary

Shows successfully claimed rewards and any skipped/failed claims.

### M-06 — Resource Source Guide

Shows where a selected currency/material is earned and links to available destinations.

### M-07 — Energy Refill

Shows:

- Current Energy and cap
- Regeneration timer
- Eligible Energy item
- Crystal refill options if approved
- Limited rewarded-ad option if active
- Resulting Energy
- Confirmation before Crystal spending

### M-08 — Currency Confirmation

Used for Crystal purchases and unusually expensive Credit actions.

### M-09 — Upgrade Confirmation

Used for multi-level or high-value upgrades.

### M-10 — Insufficient Materials

Shows missing quantities and valid source routes.

### M-11 — Item Acquired

Shows new item and destination.

### M-12 — System Unlocked

Shows newly available feature and opens it optionally.

### M-13 — Reset Timer Information

Explains UTC reset and local countdown.

### M-14 — Filter and Sort sheet

Reusable mobile sheet with Apply, Reset and result count.

### M-15 — Detailed Stats sheet

Shows formulas/descriptions at a user-friendly level.

### M-16 — Confirmation dialog

Reusable destructive/irreversible confirmation with explicit action labels.

### M-17 — Toast/inline feedback

Used for small successes, failures and non-blocking information.

### M-18 — Loading skeleton

Used for content cards without reflow.

### M-19 — Offline banner

Shows cached state and which actions are unavailable.

### M-20 — Network retry sheet

Shows error context and retry/return options.

---

## 17. Post-launch feature preview screens

### FUT-01 — Guild Coming Soon

**Content:** Intended guild identity, contribution and group-reward concept.  
**Must not show:** Fake member lists, fake chat or functional donation controls.

### FUT-02 — Multiplayer Coming Soon

**Content:** Intended cooperative mode direction and development status.  
**Must not promise:** Exact release date without a committed schedule.

### FUT-03 — Galaxy War Coming Soon

**Content:** Intended guild-based sector-control concept and dependency on Guild.

### FUT-04 — Endless Survival Coming Soon

**Content:** Intended endless scoring mode and post-launch status.

When these systems are later approved for implementation, each requires a separate system blueprint and expanded navigation map.

---

# PART B — CROSS-SCREEN FLOWS

## 18. Primary Campaign flow

**Home Play or Battle → Campaign → Chapter Map → Stage Detail → Pre-Battle → Gameplay → Results**

### Victory outcomes

From Results:

- **Next Stage** → next Stage Detail or Pre-Battle, depending on player preference setting
- **Replay** → Pre-Battle for same stage
- **Campaign Map** → current Chapter Map
- **Home** → Home Dashboard
- Reward/level/ship unlock overlays appear before the final destination when required

### Defeat outcomes

From Results:

- **Retry** → Pre-Battle
- **Change Loadout** → Loadout Manager with a return target to Pre-Battle
- **Campaign Map**
- **Home**

---

## 19. Ship progression flow

**Fleet Roster → Ship Detail → Level/Stars/Weapon → Confirm → Upgrade Success → Ship Detail**

Locked-ship flow:

**Fleet Roster → Ship Acquisition → requirement destination or unlock confirmation → New Ship Unlocked → Equip or Ship Detail**

The player returns to the same roster filters and scroll position.

---

## 20. Loadout flow

**Inventory → Loadout → Select slot → Slot Selection → select item → Loadout draft → Save/Equip → success**

When entered from Pre-Battle:

**Pre-Battle → Change Loadout → Loadout → Save → return to the same Pre-Battle session draft**

The return target must be preserved explicitly.

---

## 21. Mission flow

**Home Mission card → Daily/Weekly Missions → Go → destination screen → complete activity → Missions → Claim**

A Go button must route to the closest actionable screen, not just a broad tab.

Examples:

- “Upgrade any ship” → selected Ship Level page
- “Complete a Daily Operation” → Daily Operations Hub
- “Defeat a boss” → current Campaign boss or Boss Raid, depending on mission definition
- “Use Calamity” → suitable Pre-Battle screen

---

## 22. Event flow

**Home Events → Events Hub → Event Detail**

From Event Detail:

- Event Missions → event Mission list
- Play Event → Event Battle Stage List
- Event Shop → Event Shop
- Progress reward → reward detail/claim

When the Event ends:

- Active play is disabled.
- Grace-period claims and Shop remain available only until the shown time.
- Remaining Tokens convert according to the published rule.

---

## 23. Shop flow

**Shop category → Product Detail → Confirmation → Processing if needed → Success/Failure**

Non-platform currency purchase:

- Validate balance
- Apply one idempotent transaction
- Show Purchase Success
- Update all resource displays immediately

Platform purchase:

- Start platform sheet
- Verify result
- Grant entitlement/currency once
- Support restore and pending states

---

## 24. Boss Raid flow

**Home/Battle → Boss Raid → optional Boss Guide/Rewards/Rankings → Pre-Battle → Gameplay → Results → Raid Hub**

Results update:

- Daily best
- Highest reward tier
- Local/global rank where available
- Ticket balance
- Claimable tier badge

---

## 25. Inbox reward flow

**Inbox → Message Detail → Claim → Reward Reveal/Summary → Message claimed**

Claim All:

- Claims only eligible, unexpired rewards
- Reports skipped messages with reasons
- Cannot duplicate rewards on repeated taps

---

# PART C — STATES AND DATA CONTRACTS

## 26. Universal screen states

Every applicable screen must define these states before visual implementation:

1. Loading
2. Ready
3. Empty
4. Filtered empty
5. Locked
6. Offline/cached
7. Recoverable error
8. Action in progress
9. Action success
10. Action failed
11. Expired content
12. Max progression
13. Insufficient resource
14. Newly unlocked
15. Claimable reward
16. Claimed reward

A reference image does not need to show every state, but the implementation specification must list them.

---

## 27. Dynamic-data rule

The following must never be baked into reference artwork:

- Player name, avatar selection and frame
- Account Level and XP
- Energy, Credits and Crystals
- Regeneration and reset timers
- Notification badges
- Campaign chapter, stage and star progress
- Ship names, levels, Stars, Weapon Levels and Power
- Companion/module progression
- Upgrade costs
- Fragment/material quantities
- Mission progress and claim states
- Event dates and Event Token balances
- Season tier and XP
- Shop products, prices and purchase limits
- Leaderboard names, ranks and scores
- Inbox content
- Lock requirements
- Active tab and filter state
- Gameplay HP, score, boss HP, progress and temporary effects

Artwork may contain decorative labels only when they are permanently true and localization-safe.

---

## 28. Shared data entities required by the UI

The final implementation should expose normalized entities for:

- Player profile
- Currency balances and Energy regeneration
- Ships and per-ship progress
- Companions and progress
- Modules and progress
- Materials and entry items
- Loadout
- Campaign chapters and stages
- Stage objectives and rewards
- Missions and activity milestones
- Achievements
- Season and tiers
- Events, progress and Tokens
- Shop products and transactions
- Inbox messages and attachments
- Boss Raid session and rankings
- Settings
- Save/sync status
- Feature unlocks
- Notifications/badges

UI screens should consume these entities rather than define their own conflicting mock values.

---

## 29. Badge rules

A badge appears only for a meaningful action.

Examples:

- Claimable reward
- New system/item
- Upgrade available
- Unread Inbox message
- Free Shop refresh
- New active Event
- Raid reward tier reached

A badge must disappear when its underlying condition is resolved.

Do not use permanent exclamation marks solely to increase taps.

---

## 30. Lock-state rules

Every locked card or page displays:

- Exact requirement
- Current progress
- Valid destination
- Whether the feature is currently obtainable

Types:

- Account Level lock
- Campaign lock
- Star-total lock
- Fragment lock
- Purchase option
- Event availability
- Coming Soon

A Coming Soon feature is not represented as a normal progression lock.

---

## 31. Loading and error principles

- Prefer skeletons over full-screen spinners for dashboard content.
- Preserve cached content where safe.
- Never erase visible balances because one service failed.
- Disable only the actions that require unavailable connectivity.
- Errors must state what the player can do next.
- A retry action must not duplicate purchases, claims or upgrades.

---

# PART D — LAUNCH PRIORITY

## 32. Prototype UI priority

The UI prototype may use centralized mock data and no gameplay engine.

### Tier UI-0 — Existing/foundation

- H-01 Home Dashboard — preserve
- Standard top resource bar
- Five-tab bottom navigation
- Global header/back behavior
- Shared modal and sheet system
- Route parser with parameter support
- Loading/empty/error foundations

### Tier UI-1 — Main hubs

- B-01 Battle Hub
- F-01 Fleet Roster
- I-01 Inventory Hub
- S-01 Shop Hub

### Tier UI-2 — Core connected flows

- B-02/B-03/B-04 Campaign screens
- B-15 Pre-Battle
- F-02 through F-08 Ship detail/progression/acquisition
- I-02 through I-11 Loadout, companions, modules and materials
- S-02 through S-10 Shop categories and purchase dialogs

### Tier UI-3 — Progression and account

- Daily/Weekly Missions
- Achievements
- Season Pass
- Events
- Profile
- Inbox
- Settings
- Power Breakdown
- Offers and Leaderboards

### Tier UI-4 — Gameplay-facing UI

- Gameplay HUD
- Boss HUD
- Pause
- Revive
- Results
- Reward reveals
- Unlock and level-up overlays

### Tier UI-5 — Honest post-launch previews

- Guild
- Multiplayer
- Galaxy War
- Endless Survival

---

## 33. Gameplay MVP screen requirement

The closed-test gameplay MVP does not need all public-launch pages, but it requires:

- Home
- Battle Hub
- Campaign Overview/Map/Stage Detail
- Pre-Battle
- Gameplay HUD and Pause
- Victory/Defeat Results
- Fleet Roster and Ship Level
- Basic Loadout
- Basic Inventory materials
- Daily Missions
- Basic Shop with test currency
- Settings
- Local save recovery

---

## 34. Public-launch screen requirement

Public launch requires every launch screen in Sections 7–16 except systems explicitly marked post-launch.

The following may use reduced initial content while retaining complete architecture:

- Only one active Event at a time
- Local Boss Raid leaderboard if online ranking is not ready
- Six companions
- Twelve modules
- Five Campaign chapters
- One Season Pass
- A restrained Shop catalog

---

# PART E — REFERENCE-IMAGE PRODUCTION PLAN

## 35. Approval gate

No reference image should be generated until this complete map is approved.

After approval, references are produced in connected groups. Each group begins with a written screen-content specification and ends with one or more approved visual targets.

## 36. Reference group order

### Group 1 — Global visual system and main hubs

1. Shared dashboard shell
2. Battle Hub
3. Fleet Roster
4. Inventory Hub
5. Shop Hub

**Reason:** Establishes the common visual language outside the already approved Home screen.

### Group 2 — Campaign flow

1. Campaign Overview
2. Campaign Chapter Map
3. Campaign Stage Detail
4. Pre-Battle

**Reason:** Defines the central non-gameplay Battle journey.

### Group 3 — Fleet progression

1. Ship Detail Overview
2. Ship Level Up
3. Star Rank
4. Weapon Upgrade
5. Abilities
6. Skins
7. Ship Acquisition

### Group 4 — Inventory and loadout

1. Loadout Manager
2. Companions Roster
3. Companion Detail/Upgrade
4. Modules Inventory
5. Module Detail/Upgrade
6. Materials

### Group 5 — Shop and purchase flows

1. Daily Shop
2. Resource Shop
3. Ship/Fragment Shop
4. Cosmetic Shop
5. Product Detail
6. Purchase confirmations and results

### Group 6 — Progression

1. Daily Missions
2. Weekly Missions
3. Achievements
4. Season Pass
5. Events Hub
6. Event Detail
7. Leaderboards

### Group 7 — Account and utility

1. Profile
2. Power Breakdown
3. Inbox
4. Settings Hub
5. Key settings subpages

### Group 8 — Gameplay interface

1. Standard Gameplay HUD
2. Boss HUD
3. Pause
4. Revive
5. Victory Results
6. Defeat Results
7. Reward reveal
8. Ship unlock

### Group 9 — Post-launch previews

1. Guild Coming Soon
2. Multiplayer Coming Soon
3. Galaxy War Coming Soon
4. Endless Coming Soon

---

## 37. Reference-image rules

Every visual-reference prompt must specify:

- Exact screen ID and purpose
- Phone portrait dimensions/aspect
- Required visible components
- Required example state and mock values
- Which values are dynamic and must remain editable in code
- Which existing assets should be reused
- Which new assets, if any, are genuinely needed
- Safe-area and touch-target requirements
- Back and bottom-navigation visibility
- Active tab
- Scroll/non-scroll regions
- Modal state, if the reference represents a modal
- Original premium neon sci-fi direction without copying another game’s protected assets

A reference is a layout and styling target, not a flattened production screen.

---

# PART F — IMPLEMENTATION ORDER AFTER REFERENCE APPROVAL

## 38. Recommended implementation sequence

1. Expand the route model and navigation service.
2. Make one reusable global shell for non-Home pages.
3. Preserve the approved Home layout and replace Coming Soon handlers with approved routes gradually.
4. Build the four missing tab hubs.
5. Build Campaign browsing and Pre-Battle.
6. Build Fleet progression.
7. Build Inventory and Loadout.
8. Build Shop and transaction states using mock transactions.
9. Build Missions, Achievements, Season, Events, Profile, Inbox and Settings.
10. Build gameplay-facing UI without connecting the combat engine.
11. Build honest post-launch feature previews.
12. Only then implement gameplay and connect actual rewards, progression and economy.

---

## 39. Existing-route migration

The current routes should migrate as follows:

| Current route | Future destination |
|---|---|
| `#/home` | Keep as Home |
| `#/ships` | Redirect or rename to `#/fleet` |
| `#/ships/upgrade` | Convert to selected ship detail/level route |
| `#/campaign` | Convert to `#/battle/campaign` |
| `#/play` | Replace direct access with a valid battle-session route; otherwise return to Pre-Battle |
| `#/results` | Require a valid results session or show a development-only fixture |

The current non-Home shared bottom bar contains four provisional items and must eventually become the approved five tabs in the approved order.

---

## 40. Definition of map approval

Approving this document locks:

- The five-tab ownership model
- Battle Hub as the Battle tab root
- The Home destination mapping
- The launch screen inventory
- The route hierarchy
- The primary cross-screen flows
- The global shell and Back behavior
- The distinction between launch screens and Coming Soon previews
- The reference-image production order

Small route names, labels and visual arrangements may change during implementation without reopening the complete system blueprint, provided the approved user flow and ownership remain intact.

---

## 41. Next step after approval

After approval, begin **Reference Group 1 — Global visual system and main hubs**.

Before generating images, prepare a concise visual specification for:

1. Battle Hub
2. Fleet Roster
3. Inventory Hub
4. Shop Hub
5. Shared non-Home dashboard shell

Do not modify the approved Home dashboard and do not begin gameplay-engine implementation.
