# Starfire Armada V2 — Batch 1 Deliverable

Foundation and UI shell only, per `CLAUDE_BATCH_01.txt`. No gameplay ported, no full roster built, no economy systems.

## 1. Architecture summary

New Vite + React + TypeScript app scaffolded at the project root, alongside the untouched legacy prototype (moved into `legacy/current-prototype/`) and the reference/audit docs (`docs/references/`, `docs/audit/`).

- **Routing**: a minimal hash-based router (`src/app/routes.tsx`, `src/app/useHashRoute.ts`) — no library dependency, safe for static GitHub Pages hosting at any nested path. Six routes: `#/home`, `#/ships`, `#/ships/upgrade`, `#/campaign`, `#/play`, `#/results`.
- **State**: a single `PlayerStoreProvider` (`src/store/playerStore.tsx`) using React context, with explicit actions (`selectShip`, `setCurrentStage`, `addCurrency`, `spendCurrency`, `markStageCleared`, `resetSave`) and `localStorage` persistence under a fresh `starfire-armada-v2:save` key — no migration from the old game.
- **Design tokens**: `src/styles/tokens.css` — navy/violet/cyan/gold/red/green neon palette, spacing, radii, shadows/glows, typography, and rarity colors, all as CSS custom properties.
- **Shared components**: layout (`AppShell`, `TopResourceBar`, `PlayerProfileChip`, `ScreenHeader`), navigation (`BottomNavigation`), cards (`NeonPanel`, `RarityFrame`, `ItemCard`), controls (`PrimaryButton`, `SecondaryButton`, `IconButton`, `ProgressBar`), feedback (`NotificationBadge`, `ModalLayer`). Each screen composes these rather than duplicating markup.
- **Data-driven content**: ship roster (`src/data/ships.ts`), campaign chapter/stages (`src/data/campaign.ts`), and default player state (`src/data/player.ts`) are all arrays/objects, not hard-coded JSX — the ship-selection grid and campaign stage list both render from these arrays.
- **Gameplay isolation**: `GameplayScreen.tsx` renders a bare `<canvas>` with a placeholder draw call. The real Canvas engine (translated from `legacy/current-prototype/main.js`) will be built behind this same component boundary in a later batch — nothing else in the app touches the canvas.

## 2. Changed / added files

Everything under the project is new for this batch except the untouched `legacy/current-prototype/` copy and the `docs/` reference material (also newly added this batch, copied verbatim from the handoff zip).

```
.gitignore
index.html
package.json
tsconfig.json / tsconfig.app.json / tsconfig.node.json
vite.config.ts
public/favicon.svg
src/app/{App.tsx, main.tsx, routes.tsx, useHashRoute.ts}
src/components/layout/{AppShell, TopResourceBar, PlayerProfileChip, ScreenHeader}.{tsx,css}
src/components/navigation/BottomNavigation.{tsx,css}
src/components/cards/{NeonPanel, RarityFrame, ItemCard}.{tsx,css}
src/components/controls/{PrimaryButton, SecondaryButton, IconButton, ProgressBar, Buttons.css}.tsx
src/components/feedback/{NotificationBadge, ModalLayer}.{tsx,css}
src/data/{ships, campaign, player, index}.ts
src/screens/home/HomeScreen.{tsx,css}
src/screens/ship-selection/ShipSelectionScreen.{tsx,css}
src/screens/ship-upgrade/ShipUpgradeScreen.{tsx,css}
src/screens/campaign/CampaignScreen.{tsx,css}
src/screens/gameplay/GameplayScreen.{tsx,css}
src/screens/results/ResultsScreen.{tsx,css}
src/store/playerStore.tsx
src/styles/{tokens, reset, globals, effects}.css
src/types/{player, ship, campaign, index}.ts
src/gameplay/, src/systems/, src/utils/   (empty, reserved for Batch 2+)

legacy/current-prototype/   (moved verbatim from the old project root; checksums verified identical)
docs/references/*.png       (23 mockups, copied from handoff zip)
docs/audit/*                (code audit + reference manifest, copied from handoff zip)
```

## 3. Commands to run locally

```
npm install
npm run dev        # local dev server
npm run build      # tsc -b && vite build — production build
npm run preview    # serve the built dist/ folder
npm run typecheck  # tsc -b --noEmit
```

## 4. Build / typecheck results

Verified in a clean install (Node 22, npm 10) on a native filesystem:

- `npm install` — succeeded, 70 packages, 0 vulnerabilities reported.
- `npm run typecheck` — passed with 0 errors under `strict` mode.
- `npm run build` — passed: 74 modules transformed, output `dist/index.html` (0.54 kB), `dist/assets/index-*.css` (16.1 kB), `dist/assets/index-*.js` (159.4 kB, 50.8 kB gzip).

Note: I built and verified in a staging copy on local disk rather than directly inside the OneDrive-synced project folder — the live sync mount in my sandbox has flaky directory-rename semantics that caused spurious `ENOTEMPTY` errors during `npm install` (unrelated to the code). This is a quirk of my sandbox's bridge to your OneDrive folder, not of your actual machine — `npm install` should run normally in a regular terminal on your computer. Worth confirming once, though.

## 5. Responsive behavior at target viewports

Verified by code review of the layout CSS (no headless browser available in this environment to capture actual screenshots):

- **Mobile portrait (430×932)**: `AppShell` renders edge-to-edge, capped at `--shell-max-width: 520px`. `TopResourceBar` is sticky with horizontally-scrollable currency chips so nothing clips. `BottomNavigation` is fixed, 72px tall, with `env(safe-area-inset-bottom)` padding. Home's shortcut grid is 3 columns, ship-selection grid is 3 columns — both scale down cleanly at this width.
- **Desktop (1536×1024)**: `AppShell` frame is centered with `max-width: 520px`, rounded corners, border, and vertical margin, sitting on the radial-gradient void background — matching the "centered premium game shell" direction called for in the audit, rather than stretching a phone layout across the full desktop viewport.
- No horizontal overflow: all grids/flex rows use `gap` and `1fr` tracks rather than fixed pixel widths; the only horizontal scroll region is the currency strip, which is intentional.

If you want actual screenshots, I can spin up the dev server and capture them with a browser tool — just say so.

## 6. Known limitations

- `GameplayScreen` is a placeholder `<canvas>` — no ported gameplay, no input handling, no entities.
- Only Ship 1 (Rapid-Fire) has real weapon-level/passive/calamity data; ships 2–20 are locked roster placeholders with names/colors from `ships_01_to_20.png` but no stats.
- Campaign has one chapter, five stages, no actual combat resolution — "Play" just navigates to the placeholder gameplay screen, and "End Stage (debug)" jumps straight to Results.
- No shop, companions, modules, tech tree, events, guild, multiplayer, or season pass — out of scope per the batch spec.
- Save data is a fresh V2 schema in `localStorage`; nothing reads the old game's save.
- No automated tests; verification was build + typecheck + manual code review only.
- Asset filenames in `legacy/current-prototype` still have the doubled-extension issue (`*.png.png`) noted in the audit — untouched, since the legacy folder was kept as-is.

## 7. Recommended Batch 2 scope

Build out the **Ship Selection** and **Ship Upgrade** screens for real (currently placeholders beyond Ship 1), plus:

1. Production sprite pipeline for Ship 1 (transparent gameplay sprite, hangar render, roster icon) so `ItemCard`/`RarityFrame` show real art instead of a vector glyph.
2. Real weapon-level visuals for Rapid-Fire's five levels, matching `fire_levels_ships_01_to_05.png`.
3. Wire `ShipUpgradeScreen`'s upgrade button to actually spend currency and advance `ShipProgress` (level/stars/weapon level) in the store.
4. Begin the `GameCanvas` component: port the legacy engine's resize/playfield-bound logic, pointer/keyboard controls, and object-pool pattern into TypeScript modules under `src/gameplay/engine/`, still rendering only a stub scene.
5. Do **not** yet: port full combat/collision, build ships 2–20, or touch companions/shop/economy — hold those for Batch 3 onward per the audit's phased plan.
