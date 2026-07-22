# STARFIRE ARMADA — ASSET INTEGRATION INSTRUCTIONS

**Project:** Starfire Armada  
**Platform priority:** Android mobile, portrait orientation  
**Purpose:** Guide Claude or another implementation agent in auditing, organizing, and integrating the approved UI assets, ship art, gameplay sprites, and mobile-screen references without damaging the completed homepage or creating a conflicting design system.

---

## 1. Supplied materials

The handoff package may include:

- Current Starfire Armada source project
- Existing project assets already used by the homepage and other implemented screens
- 80 reusable UI and system assets
- 20 high-resolution master ship artworks
- 20 gameplay ship sprites
- 53 approved portrait mobile-screen reference images
- Game Design and Systems Blueprint
- Screen and Navigation Map
- Master Handoff document

Treat the current source project as the authority for what is already implemented and working.

---

## 2. Critical implementation rules

1. This is a portrait mobile game, not a desktop or web dashboard.
2. Preserve the approved homepage and its established visual language.
3. Audit existing assets and components before importing or replacing anything.
4. Reuse existing top bars, bottom navigation, buttons, backgrounds, borders, glows, badges, icons, and decorative elements wherever suitable.
5. The 80 new assets extend the current design system; they do not replace it automatically.
6. Do not overwrite working assets or components without first documenting the reason.
7. Do not use full reference screenshots as production backgrounds.
8. Build screens with reusable components and dynamic code-driven content.
9. Render text, values, timers, progress bars, tabs, buttons, badges, filters, and states in code.
10. Do not generate new artwork until the supplied assets have been audited and mapped.
11. Do not begin gameplay implementation during the UI audit and integration phase.
12. Implement one approved screen or tightly related flow at a time.

---

## 3. Asset groups and intended use

### Existing project assets

Use these first when they already match the approved homepage:

- Top resource bar
- Bottom navigation
- Page backgrounds
- Buttons
- Panel frames and borders
- Glows and overlays
- Currency displays
- Existing icons
- Notification badges
- Decorative sci-fi elements
- Typography and spacing tokens

Do not create a duplicate component or asset when a suitable working version already exists.

### Reusable UI assets

Suggested locations and uses:

- `ui/frames/` — panels, cards, dialogs, sheets, feature areas
- `ui/icons/resources/` — currencies and resource displays
- `ui/icons/stats/` — ship and equipment statistics
- `ui/icons/roles/` — ship roles and filters
- `ui/icons/slots/` — loadout and equipment slots
- `ui/icons/utility/` — common actions and states
- `ui/modes/` — Battle Hub mode cards
- `ui/rewards/` — reward containers and chest art
- `materials/` — inventory, costs, rewards, missions, and shops
- `companions/` — companion roster, detail, upgrade, and loadout screens
- `modules/` — module inventory, details, upgrades, rewards, and loadout screens

### Ship artwork

- `ships/master_art/` — Fleet, Ship Detail, upgrades, unlocks, pre-battle presentation, and large cards
- `ships/gameplay_sprites/` — gameplay and gameplay-oriented previews only

Do not use gameplay sprites where master artwork is more appropriate.

### Screen references

The 53 portrait images are references for:

- Layout
- Visual hierarchy
- Spacing
- Panel placement
- Navigation
- Card structure
- Color direction
- Mobile proportions

They are not final production assets. Do not bake their text, numbers, or complete layout into a single image.

---

## 4. Required first task: audit only

Before changing code, inspect the project and produce an audit containing:

1. Current project structure
2. Framework and styling approach
3. Existing routes and screens
4. Existing reusable components
5. Existing asset folders and files
6. Assets and components that must be preserved
7. Duplicate or overlapping new assets
8. Missing or incorrectly named files
9. Mapping from supplied assets to planned screens
10. Mapping from reference screens to reusable components
11. Recommended shared component system
12. Recommended import and folder structure
13. Risks and inconsistencies
14. Exact files proposed for creation or modification

Do not modify code until the audit is approved.

---

## 5. Recommended integration sequence

After audit approval:

1. Back up the current working project.
2. Normalize asset filenames and verify all files open correctly.
3. Import assets into clear category folders.
4. Create a centralized asset manifest or typed asset registry.
5. Reuse or extract shared visual tokens from the completed homepage.
6. Create only the missing shared components.
7. Build the highest-priority mobile flow one screen at a time:

   `Home → Battle Hub → Campaign Overview → Chapter Map → Stage Detail → Pre-Battle → Fleet → Ship Detail → Loadout → Inventory`

8. For each screen:
   - Inspect the approved reference
   - Reuse existing components first
   - Use supplied assets
   - Keep content dynamic
   - Support common portrait mobile sizes and safe areas
   - Verify scrolling and touch targets
   - Capture a comparison screenshot
   - Report changed files
   - Wait for approval before the next major screen

---

## 6. Asset-handling requirements

- Keep original source images unchanged in an archival folder.
- Create optimized runtime copies only when needed.
- Preserve transparent backgrounds.
- Avoid lossy recompression of UI icons and ship art.
- Do not combine separate assets into sprite sheets unless later approved for performance.
- Do not rename files after they are referenced in code without updating the asset registry.
- Prefer a centralized import map over scattered hard-coded paths.
- Load only assets needed by the active route where practical.
- Record any asset that is unused, duplicated, visually inconsistent, or unsuitable at mobile size.

---

## 7. Claude handoff prompt

Use this instruction when opening the project in Claude:

> You are continuing development of Starfire Armada, a portrait Android mobile game. Read `SPACE_SHOOTER_MASTER_HANDOFF.md`, `GAME_DESIGN_SYSTEMS_BLUEPRINT.md`, `SCREEN_NAVIGATION_MAP.md`, and `ASSET_INTEGRATION_INSTRUCTIONS.md` before doing anything. Inspect the current project, all existing project assets, the 80 new reusable UI assets, 20 master ship artworks, 20 gameplay sprites, and 53 approved screen references. Preserve the completed homepage and reuse its existing UI assets and components. Treat references as layout guides only, not production backgrounds. Your first task is an audit only. Do not modify code until I approve the audit. The audit must identify existing reusable components and assets, duplicates, missing files, asset-to-screen mapping, reference-to-component mapping, risks, and the exact files you propose to create or change.

---

## 8. Approval gate

No implementation should begin until the project and asset audit has been reviewed and approved.
