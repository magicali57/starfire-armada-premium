# SPACE SHOOTER — MASTER HANDOFF

_Last updated: 2026-07-16_

## 1. Project Overview

This project is a **mobile-first vertical arcade space shooter** intended for **Android** and eventual release on the **Google Play Store**.

Core priorities:
- Mobile portrait layout
- Premium neon sci-fi visual style
- Touch-friendly controls and UI
- Reusable assets and dynamic UI
- Preserve working functionality while improving visuals
- Avoid unnecessary desktop/web optimization unless needed for testing

## 2. Working Method

Development has moved between Claude, Codex, and ChatGPT.

Before making changes:
1. Inspect the current project files.
2. Run the project.
3. Verify the current state.
4. Preserve approved sections.
5. Make one focused change batch at a time.
6. Test the affected flow.
7. Capture screenshots.
8. Summarize changed files and unresolved issues.

## 3. Current Project State

### Homepage / Main Dashboard

The homepage redesign is considered **complete for the current phase**.

It does not need to match the visual reference perfectly anymore. It is approved as the current finished version.

Current homepage components:
- Profile panel and avatar
- Player name, level, and XP
- Energy, coin, and gem counters
- Mail and settings
- Central ship and space background
- Season Pass
- Events
- Achievements
- Leaderboard
- Limited Time Offer
- Galaxy War
- Boss Raid
- Guild
- Multiplayer
- Chapter selector
- Your Power panel
- Main Play button
- Active Loadout panel
- Daily Missions
- Weekly Missions
- Campaign Progress
- Bottom navigation: Home, Battle, Fleet, Inventory, Shop

Homepage status:
- Approved
- Stable
- Frozen for now
- Do not redesign or reorganize unless explicitly requested later

## 4. Approved Homepage Design Decisions

### Top bar
Use separate reusable assets for the avatar, profile frame, resource frame, utility frame, and resource/utility icons.

Keep these dynamic in code:
- Player name
- Level
- XP values and bar
- Resource values
- Plus symbols
- Notification badges

### Side cards

Left column:
1. Season Pass
2. Events
3. Achievements
4. Leaderboard
5. Limited Time Offer

Right column:
1. Galaxy War
2. Boss Raid
3. Guild
4. Multiplayer

Rules:
- Events notification badge is dynamic and not baked into the image.
- Boss Raid timer is dynamic and not baked into the image.
- Season Pass and Limited Time Offer labels use gold/yellow.
- Other card labels use white.
- Final compact side-card proportions are approved.

### Bottom navigation
The existing tab backgrounds and active-tab background are approved.

Only the five tab icons were replaced:
- Home
- Battle
- Fleet
- Inventory
- Shop

Do not replace the existing bottom-nav rectangles unless explicitly requested later.

## 5. Generated Asset Packs

### Top bar asset pack
`space_shooter_topbar_asset_pack.zip`

### Compact side-card asset pack
`space_shooter_compact_sidecards_pack.zip`

### Bottom navigation icon work
A five-icon set was created for Home, Battle, Fleet, Inventory, and Shop.

Implementation rule:
- Replace icons only
- Keep existing tab backgrounds
- Keep existing active-tab box
- Adjust alignment and labels to match the reference

## 6. Existing Gameplay / Ship Work

Completed:
- 20 master ship artworks
- 20 gameplay ship sprites
- Corrected homing missile ship version
- Projectile assets including energy bolt, guided missile, and powerful cyan beam

Important:
Use the later corrected homing missile ship version, not the earlier incorrect one.

## 7. Mobile Requirements

- Portrait orientation
- Touch-friendly UI
- Safe-area awareness
- Responsive scaling across phone aspect ratios
- Preserve asset aspect ratios
- Avoid non-uniform stretching
- Keep images crisp
- Use a design-coordinate system with uniform scaling where appropriate

## 8. Dynamic UI Rules

Do not bake changing information into images.

Keep these dynamic:
- Player name
- Level
- XP
- Resource values
- Notification badges
- Timers
- Mission progress
- Chapter progress
- Equipment levels
- Rarity labels
- Button costs
- Active tab state
- Claim states
- Event availability

## 9. Homepage Approval

The latest comparison between the original reference homepage and the current project homepage was accepted as good enough for now.

The user explicitly decided:
- Homepage is complete
- No more homepage changes for the current phase
- Future adjustments may happen later
- Development should continue to other pages and systems

## 10. Recommended Next Development Order

### Phase 1 — Battle / Gameplay
Play flow, movement, shooting, enemy waves, damage, health, score, stage flow, pause, win/loss, and bosses.

### Phase 2 — Fleet
Ship selection, details, stats, upgrades, unlocks, equipped state, and previews.

### Phase 3 — Inventory / Loadout
Weapons, companions, equipment slots, rarity, levels, materials, and equip logic.

### Phase 4 — Shop / Economy
Currencies, offers, purchases, reward packs, daily offers, and confirmations.

### Phase 5 — Progression
Daily missions, weekly missions, campaign progress, achievements, events, season pass, and rewards.

### Phase 6 — Advanced Modes
Galaxy War, Boss Raid, Guild, and Multiplayer.

### Phase 7 — Android Release Preparation
Performance, save data, persistence, audio, haptics, settings, testing, builds, store assets, privacy, and Google Play preparation.

## 11. What Claude Should Do First

1. Inspect the entire project structure.
2. Identify the framework, build system, navigation, state management, asset folders, screen files, shared components, and mobile configuration.
3. Run the project.
4. Verify the current homepage.
5. Confirm existing routes.
6. Report which pages exist, are placeholders, or are missing.
7. Do not modify the approved homepage.
8. Do not begin a broad refactor.
9. Recommend the next page to build.
10. Produce a phased implementation plan.

## 12. Do Not Do These Things

- Do not regenerate assets unless explicitly asked.
- Do not redesign approved homepage sections.
- Do not assume a discussion request means “generate an image.”
- Do not change unrelated files during focused tasks.
- Do not delete assets before verifying usage.
- Do not bake dynamic values into images.
- Do not replace working UI without approval.
- Do not optimize for desktop at the expense of mobile.
- Do not restart the project from scratch.

## 13. Communication Rules

When continuing in a new chat:
- Read this file first.
- Review relevant project chats when needed.
- Confirm the current status before proposing work.
- Do not make the user repeat old project history.
- Keep implementation prompts ready for Claude or Codex.
- Preserve approved decisions.
- Update this master handoff after each major milestone.

## 14. Current Next Task

The homepage is complete.

The next step is:

**Audit the current project and choose the next screen to implement, most likely the Battle / Gameplay screen.**

Do not start implementation until the current project structure, routes, and existing pages have been inspected.

## 15. New-Chat Resume Prompt

> Read `SPACE_SHOOTER_MASTER_HANDOFF.md` and the relevant previous chats in this project. Confirm the current project status before doing anything. The homepage is approved and frozen for now. Continue from the “Current Next Task” section. Do not regenerate assets or modify completed sections unless I explicitly ask.

## 16. Progress Log

### Completed
- Initial visual redesign planning
- Premium sci-fi direction
- Ship artwork
- Gameplay ship sprites
- Projectile assets
- Homepage rebuild
- Top bar assets
- Compact side-card assets
- Bottom navigation icons
- Homepage accepted as complete

### Current
- Preparing to continue development in Claude
- Preparing next pages and systems

### Next
- Full project audit
- Route and screen inventory
- Battle / Gameplay implementation plan

## 17. Blueprint Approval and Navigation Planning Update

### Approved on 2026-07-16

`STARFIRE_ARMADA_GAME_DESIGN_SYSTEMS_BLUEPRINT.md` v1.0 is approved and is now the system-level source of truth.

Locked high-level decisions include:
- Portrait one-thumb auto-fire arcade shooter
- Permanent navigation: Home, Battle, Fleet, Inventory, Shop
- Permanent top-bar resources: Energy, Credits, Crystals
- Existing 20-ship roster
- Intrinsic ship weapon, passive, and Calamity
- Ship Level 1–20, Star Rank 0–5, Weapon Level 1–5
- One companion and three module slots
- 15 planned Campaign chapters, with Chapters 1–5 targeted for public launch
- Guild, Multiplayer, and Galaxy War deferred to post-launch
- Optional rewarded ads and fair free-to-play monetization rules

### Current

The complete `STARFIRE_ARMADA_SCREEN_AND_NAVIGATION_MAP.md` v1.0 has been created and is awaiting approval.

No new reference images or dashboards should be generated until the screen and navigation map is approved.

### Current Next Task

Review and approve or revise `STARFIRE_ARMADA_SCREEN_AND_NAVIGATION_MAP.md`.

After approval:
1. Prepare the visual specification for the shared non-Home shell.
2. Prepare visual specifications for Battle Hub, Fleet Roster, Inventory Hub, and Shop Hub.
3. Generate and review Reference Group 1.
4. Do not modify the approved Home dashboard.
5. Do not begin gameplay-engine implementation.

## 18. Screen Map Approval and Reference Group 1 Update

### Approved on 2026-07-16

`STARFIRE_ARMADA_SCREEN_AND_NAVIGATION_MAP.md` v1.0 is approved and is now the interface-architecture source of truth.

Locked decisions include:
- Five-tab ownership model
- Battle Hub as the Battle tab root
- Complete Home destination mapping
- Route hierarchy and Back behavior
- Launch screen inventory
- Cross-screen Campaign, Fleet, Loadout, Event, Shop, Raid, and Inbox flows
- Honest Coming Soon treatment for post-launch systems
- Reference-image production order

### Current

`STARFIRE_ARMADA_REFERENCE_GROUP_1_VISUAL_SPECIFICATIONS.md` v1.0 has been created and is awaiting approval.

It defines:
- Shared non-Home shell
- Battle Hub
- Fleet Roster
- Inventory Hub
- Shop Hub
- Representative shared overlay
- Dynamic-data and reusable-asset boundaries

No reference images or new dashboard implementation should begin until these visual specifications are approved.

### Current Next Task

Review and approve or revise `STARFIRE_ARMADA_REFERENCE_GROUP_1_VISUAL_SPECIFICATIONS.md`.

After approval:
1. Generate the Battle Hub reference image.
2. Review and approve it.
3. Generate Fleet Roster, Inventory Hub, Shop Hub, and the shared overlay individually.
4. Preserve the approved Home dashboard.
5. Do not begin gameplay-engine implementation.
