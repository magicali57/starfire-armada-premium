# Starfire Armada V2 — Code and Reference Audit

## Executive decision

Starfire Armada should be rebuilt as a V2 application. The current release is useful as a **gameplay prototype and algorithm library**, but it should not remain the architectural foundation for the final 31-screen premium game.

There is no requirement to preserve old saves, the old interface, or uninterrupted compatibility. The rebuild can use a fresh data model and fresh project structure.

## Files audited

- `starfire-armada.zip`
- `references.zip`

## Current project inventory

### Editable application files

| File | Size / scale | Finding |
|---|---:|---|
| `index.html` | 270 lines | Contains all menu screens, gameplay HUD, and overlays in one document. |
| `main.css` | 1,361 lines | Contains the complete visual system and all screen styling in one stylesheet. |
| `main.js` | 5,496 lines / ~160 KB | Contains save data, audio, input, entities, combat, stages, UI rendering, and navigation. Symbol names such as `ce`, `ue`, `qe`, and `O` show that this is bundle-like output rather than clean source modules. |
| `asset-prompts.md` | 124 lines | Records prompts for several existing assets. |

### Orphaned build output

- `assets/index-aCijyug3.js`
- `assets/index-BY5Qv_A-.css`

The current `index.html` does not load these files. They appear to be an older bundled copy and should not be part of the V2 source tree.

### Existing gameplay content

- 6 playable ships
- 8 universal weapon tiers
- 15 enemy definitions
- 8 boss definitions
- 20 generated campaign stages
- 3 companions
- 9 power-up types
- 17 achievements
- 9 daily mission definitions
- 6 prestige talents
- Campaign, Endless, Boss Rush, and Duel modes
- Pointer/touch and keyboard controls
- Local saving
- Synthesized sound effects and music
- Object pools, particles, screen shake, hit-stop, zoom punches, and boss phases

### Existing visual assets

- 6 player ship images
- 8 enemy images
- 4 boss images
- 3 companion images
- 11 projectile images
- 5 power-up images
- 3 vertical gameplay backgrounds
- 2 older visual references

All 40 paths in the active JavaScript asset manifest exist. Many filenames contain doubled extensions such as `.png.png`; V2 should rename these cleanly.

## Reference package inventory

The reference ZIP contains 23 full-resolution images covering:

- 20-ship roster
- 20 final fire styles
- Four sheets showing fire Levels 1–5
- Home and Hangar
- Ship Selection and Arsenal
- Weapon Upgrade and Companions
- Companion Formation and Tech Tree
- Modules/Core and Shop
- Weapons and Skins
- Awakening and Calamity UI
- Stats and Missions
- Daily Rewards and Achievements
- Season Pass and Leaderboard
- Profile and Inventory
- Campaign and Boss Raid
- Arena and Galaxy War
- Multiplayer and Guild
- Events
- Dashboard connection map

### Authoritative references

Use these as the source of truth:

1. `ships_01_to_20.png` — identity and silhouette of the 20 ships.
2. `fire_levels_ships_01_to_05.png`
3. `fire_levels_ships_06_to_10.png`
4. `fire_levels_ships_11_to_15.png`
5. `fire_levels_ships_16_to_20.png`
6. All dashboard mockups — visual language and functional hierarchy.
7. `dashboard_map.png` — navigation and system grouping.

### Reference requiring correction

`calamity_attacks_ships_01_to_20.png` is **not authoritative for ship identity or attack-to-ship mapping**. It contains the mismatched spacecraft and special moves that were previously rejected. It may be used only as broad VFX inspiration.

Each calamity attack must instead be designed from:

- the matching ship in `ships_01_to_20.png`;
- that ship's Level 5 form in the relevant five-level sheet;
- the ship's named role and signature mechanic.

## What should be reused

The following current systems are valuable and should be translated into clean V2 modules:

- Canvas resize and playfield-bound calculations
- Pointer/touch drag controls and keyboard controls
- Main update/render loop concepts
- Object pooling for bullets, particles, and pickups
- Collision helpers
- Enemy movement patterns: straight, zigzag, sine, hover, dive, sweep, cloak, dash, static
- Enemy firing patterns: straight, aimed, mine, spiral, multi
- Boss attack concepts: bullet rain, side sweep, missile burst, summon minions, circular wave, laser sweep, charge attack, shield phase
- Particle explosions, screen shake, hit-stop, warning banners, and zoom punch concepts
- Stage generation and reward-resolution concepts
- Asset preloading concepts
- Settings for quality, shake, sound, haptics, and sensitivity

Reuse the **behavior and algorithms**, not the bundle's current file structure or short variable names.

## What should be rewritten

### Complete UI rewrite

Rewrite all HTML/CSS menu screens. The current project has only nine screen containers and five overlays; the final plan has 31 screens including gameplay and results.

The generated mockups must be rebuilt as real responsive components. Do not use the screenshots as page backgrounds.

### Navigation

Replace manual class switching with a real screen/router layer that supports:

- safe back behavior;
- route parameters such as selected ship and stage;
- modal stacking;
- static GitHub Pages hosting;
- direct testing of individual screens.

### Ship and weapon models

The current weapon system has eight universal tiers shared by every ship. The final game requires:

- 20 unique ship definitions;
- five unique fire levels per ship;
- one passive or signature mechanic per ship;
- one calamity attack per ship;
- ship-specific projectile and effect configuration.

This requires a new configuration-driven combat system.

### Progression and economy

Create fresh models for:

- player level and XP;
- credits, crystals, energy, and materials;
- ship levels, stars, awakening, and skins;
- weapon levels, evolution, merge, and rarity;
- companion levels, formation, skills, and synergy;
- modules/cores;
- tech-tree nodes;
- inventory;
- missions, events, achievements, season pass, and shop.

No old-save migration is required.

### Companions

The current system equips one companion. The visual target uses formations and multiple active companions. Build a formation system rather than extending the single-slot implementation.

### Special attacks

The current active skill system is ship-specific but small. V2 needs a separate calamity system with:

- charge meter;
- special power-up support;
- activation state;
- full-screen VFX;
- enemy projectile interaction;
- boss damage rules;
- cooldown or charge consumption;
- adaptive quality limits.

## Recommended V2 technology

### Application

- Vite
- TypeScript
- React for dashboard UI and shared components
- Hash-based routing for reliable GitHub Pages deployment
- CSS custom properties plus component-level styles
- A small centralized player store with explicit actions and serializable state

### Gameplay

Begin with a modular TypeScript Canvas 2D engine translated from the current algorithms. Keep it isolated behind a `GameCanvas` component.

Do not introduce Phaser or another engine during the first vertical slice. Run a maximum-effects stress test first. A renderer migration can be considered only if the Canvas engine fails the performance target.

## Recommended source structure

```text
starfire-armada-v2/
├── index.html
├── package.json
├── vite.config.ts
├── public/
│   └── assets/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── bootstrap.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── cards/
│   │   ├── controls/
│   │   ├── feedback/
│   │   └── navigation/
│   ├── data/
│   │   ├── ships/
│   │   ├── weapons/
│   │   ├── companions/
│   │   ├── modules/
│   │   ├── campaign/
│   │   └── economy/
│   ├── gameplay/
│   │   ├── engine/
│   │   ├── entities/
│   │   ├── combat/
│   │   ├── patterns/
│   │   ├── effects/
│   │   └── scenes/
│   ├── screens/
│   │   ├── home/
│   │   ├── ship-selection/
│   │   ├── ship-upgrade/
│   │   ├── campaign/
│   │   ├── gameplay/
│   │   └── results/
│   ├── store/
│   ├── systems/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── reset.css
│   │   ├── globals.css
│   │   └── effects.css
│   ├── types/
│   └── utils/
├── legacy/
│   └── current-prototype/
└── docs/
    └── references/
```

## First vertical slice

Build only this loop first:

```text
Home
→ Ship Selection
→ Ship Upgrade
→ Campaign Chapter
→ Gameplay
→ Results and Rewards
→ Home or Upgrade
```

Use Ship 1, Rapid-Fire, as the only production-ready ship. Show the other 19 roster cards as locked placeholders using their approved names and colors.

### Rapid-Fire requirements

- Level 1: twin beginner shots
- Level 2: four narrow streams
- Level 3: dense forward spread
- Level 4: wide bullet curtain
- Level 5: full vertical projectile storm
- Passive: sustained firing builds an overheat/overdrive bonus without making the weapon unusable
- Calamity: `Cataclysm Barrage`, a controlled full-screen projectile storm derived from Level 5

### First campaign requirements

- One chapter
- Five stages
- Standard formation stage
- Mixed attack-pattern stage
- Elite stage
- Survival stage
- Chapter boss stage
- Results and rewards
- Upgrade currency loop

## Asset-production gap

The concept sheets are not production sprites because they contain backgrounds, frames, labels, glow composition, and multiple objects.

Before all 20 ships can be implemented, produce for each ship:

- transparent gameplay sprite;
- transparent large hangar render;
- square roster icon;
- optional skin renders;
- projectile/effect layers;
- calamity preview art.

The existing current-game assets are technically usable as temporary placeholders, but they do not match the final 20-ship roster.

## Immediate next action

Run Claude Batch 1 using the companion prompt file delivered with this audit. Batch 1 must scaffold the V2 project and design-system shell only. It must not build all dashboards or rewrite combat yet.

After Batch 1 is returned, review:

- generated file structure;
- package scripts;
- responsive shell at 430×932 and 1536×1024;
- GitHub Pages build configuration;
- design tokens;
- shared components;
- console/build errors.

Only then proceed to Home and Ship Selection.
