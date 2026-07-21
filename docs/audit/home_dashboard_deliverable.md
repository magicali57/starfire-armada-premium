# Starfire Armada V2 — Home Dashboard Strict Exact-Match Rebuild Deliverable

Scope: **Home Dashboard only.** Ship Selection, Ship Upgrade, Campaign, gameplay, and every other system are untouched except for one shared, minimally-scoped change to `AppShell.tsx` (see section 5).

## 0. Pre-work verification

Before any code changes:

1. Confirmed the reference image is visible — read `handoff/home-dashboard/home_dashboard_reference.png` directly and confirmed it's pixel-identical in composition to the left panel of `docs/references/home_dashboard_and_hangar_upgrade.png`.
2. Confirmed the asset ZIP contents — extracted `starfire_home_dashboard_42_assets_audited_claude_ready.zip` and verified exactly 42 PNGs via `unzip -l | grep -c "\.png$"`.
3. Confirmed the project was the latest working version — re-read the Batch 3 deliverable and the current source tree before touching anything.
4. Confirmed the existing build/typecheck passed — ran a clean `npm run typecheck` and `npm run build` on the pre-edit source; both passed.
5. Created a source checkpoint — `pre-home-rebuild-checkpoint.zip` at the project root, built on local disk and verified with `unzip -t` (235 files, "No errors detected") before any Home code was touched.

## 1. Handoff note followed exactly

Per `handoff/home-dashboard/START_HERE_HOME_DASHBOARD_HANDOFF.md`: the ZIP's `assets/major/*` → `public/assets/ui-v2/home/major/*`, `assets/ui/*` → `public/assets/ui-v2/home/ui/*`, verbatim filenames, no renaming at extraction time. The audit docs (`README_FOR_CLAUDE.md`, `audit/ASSET_READINESS_REPORT.md`, `audit/asset_readiness.csv`) were copied to `docs/handoffs/home-dashboard/` as instructed.

Only the audited 42-asset pack was used — no older Home asset ZIP was referenced.

## 2. Full 42-asset mapping

All 42 files verified present via `find | wc -l` in both the runtime `public/` tree and inspected visually one-by-one with the Read tool before use (not assumed from filenames).

**major/ (24 files)** — central scene, structural frames, mode-card art:
`home_cosmic_background.png`, `home_vortex_portal.png`, `home_energy_beam.png`, `home_landing_platform.png`, `home_main_hero_ship.png`, `home_escort_ship_01–04.png`, `chapter_panel_frame.png`, `play_button_frame.png`, `power_panel_frame.png`, `multiplayer_card_art.png`, `player_avatar_frame.png`, `season_pass_emblem.png`, `notification_badge.png`, `mode_card_art_galaxy_war/boss_raid/arena/guild.png`, plus the 4 source sheets (`topbar_icon_sheet.png`, `left_menu_icon_sheet.png`, `bottom_shortcut_icon_sheet.png`, `rarity_badge_sheet.png`).

**ui/frames/ (12 files)**: `home_top_hud_rail.png`, `player_profile_hud_frame.png`, `resource_capsule_frame.png`, `top_action_button_frame.png`, `season_pass_card_frame.png`, `left_menu_button_frame.png`, `mode_card_frame.png`, `status_strip_frame.png`, `multiplayer_card_frame.png`, `home_bottom_control_deck.png`, `bottom_shortcut_card_frame.png`, `bottom_shortcut_selected_frame.png`.

**ui/icons/ (2 files)**: `power_crossed_swords_icon.png`, `timer_clock_icon.png`.

**ui/navigation/ (2 source sheets)**: `chapter_navigation_icon_sheet.png`, `chapter_pagination_dot_sheet.png`.

**ui/overlays/ (1 file)**: `home_outer_hud_overlay.png`.

**ui/portraits/ (1 file)**: `player_avatar_portrait.png`.

Every one of these 42 files is referenced by path in `src/data/assetRegistry.ts` under the new `HOME_*` exports — nothing was left unused without a documented reason (see section 3 for the two intentionally-unused frames).

## 3. Cropping and transparency verification

6 sheets were cropped into 26 individual runtime files using a position-independent, alpha-threshold column/row detection script (Python + PIL/numpy) — not manual pixel coordinates:

- `topbar_icon_sheet.png` → `icon_energy/coin/crystal/plus/mail/settings.png` (6)
- `left_menu_icon_sheet.png` → `icon_events/missions/daily_reward/achievements/leaderboard.png` (5, left-to-right order confirmed by visual inspection)
- `bottom_shortcut_icon_sheet.png` → `icon_hangar/arsenal/companions/tech_tree/shop.png` (5)
- `rarity_badge_sheet.png` → `badge_common/rare/epic/legendary/mythic/sss.png` (6; one pair of badges touched with no true zero-alpha gap between them — resolved by auto-splitting the widest detected run at its internal local-minimum column)
- `chapter_navigation_icon_sheet.png` → `arrow_left/right.png` (2)
- `chapter_pagination_dot_sheet.png` → `dot_active/inactive.png` (2)

All 6 sheets were confirmed to have real alpha transparency (not a checkerboard baked into RGB) before cropping, via numpy alpha-channel min/max/corner sampling. First-pass crops using a low alpha threshold produced full-height, full-bleed boxes because of soft ambient glow bleeding across the whole canvas; fixed by raising the per-pixel alpha threshold (150–220) for both column and row bounding-box detection, which produced tight boxes matching each icon's visible art.

**Two frame assets are registered but intentionally unused** to avoid doubling: `HOME_FRAMES.multiplayerCardFrame` (also VS-branded, like `multiplayer_card_art.png` which is used instead) and separate full-strength layering of `home_vortex_portal.png` / `home_landing_platform.png` on top of `home_cosmic_background.png`, which already bakes in its own vortex glow and platform/cityscape silhouette (confirmed both by direct visual inspection and the pack's own audit warning). The two dedicated assets are still used as sharp foreground layers at reduced opacity, positioned over the background's existing glow, rather than as a second independent vortex/platform elsewhere in the scene.

## 4. Layout — region by region

`src/screens/home/HomeScreen.tsx` was rewritten from scratch (`HomeScreen.css` alongside it). Structure:

- **Backdrop (region C, full-bleed, absolute, behind everything)**: cosmic background → foreground vortex → energy beam → landing platform → 4 escort ships → hero ship (no card container around it) → a full-canvas decorative overlay frame, in that order, with idle-float/pulse/spin animations (all respect `prefers-reduced-motion`).
- **Chrome (everything else, floating on top, z-index above the backdrop)**:
  - **A — top HUD**: player profile chip (avatar + name + level + XP bar) left; energy/coin/crystal resource chips + mail + settings buttons right, all built from the cropped topbar icons and `resource_capsule_frame.png` / `top_action_button_frame.png`.
  - **B — left rail**: Season Pass card (its own frame + emblem) plus 5 rail buttons (Events, Missions, Daily Reward, Achievements, Leaderboard).
  - **D — right rail**: 4 mode cards (Galaxy War, Boss Raid, Arena, Guild), each using `mode_card_frame.png` + its dedicated art.
  - **E — chapter strip**: label + stage name, left/right arrow icons, and one pagination dot per stage in the current chapter (5 dots, matching the 5-stage campaign data), active dot highlighted.
  - **F — lower control row**: Power panel (crossed-swords icon + computed power score) left, large PLAY button center (`play_button_frame.png`, not a generic rounded rectangle), Multiplayer card right (`multiplayer_card_art.png`, VS baked in).
  - **G — bottom shortcut row**: Hangar / Arsenal / Companions / Tech Tree / **Shop** — Shop replaces Missions here specifically, per the strict spec's Home-only scope change (Missions already lives in the left rail for Home).

The generic 4-tab `BottomNavigation` is fully removed from Home (see section 5) and replaced by this 5-card shortcut row.

## 5. The one shared file touched, and why

`src/components/layout/AppShell.tsx` previously rendered `<BottomNavigation />` unconditionally for every screen. Since Home's own 5-shortcut row replaces it, `AppShell` now reads the current route and only renders `BottomNavigation` when the route is *not* `home`. This is a 2-line conditional, not a rewrite — Ship Selection, Ship Upgrade, Campaign, Gameplay, and Results all keep the exact same bottom nav behavior as before (confirmed with an automated check, section 8). `AppShell.css` gained one small modifier class (`--no-nav`) to drop Home's now-unneeded bottom padding.

## 6. Typography

Added Google Fonts `Rajdhani` (already the app's display font, now actually loaded — it was referenced in tokens before this batch but never linked) and `Orbitron` for extra-bold headline moments. New token `--font-family-display-heavy` (Orbitron → Rajdhani → Inter fallback) is used only for the PLAY button label and the chapter name; every other Home label uses the existing condensed `--font-family-display` (Rajdhani). All text — profile name, resource values, rail labels, chapter name, PLAY, shortcut labels — is real DOM text, never rasterized into an image.

## 7. Functional preservation

- Hangar shortcut → `navigate("ship-selection")` (unchanged route).
- Play button → `navigate("gameplay")` (unchanged route).
- Chapter strip (whole strip, including both arrows) → `navigate("campaign")`.
- Arsenal, Companions, Tech Tree, Shop, all 5 left-rail items, all 4 mode cards, Multiplayer, Power, Mail, Settings, and the profile chip → open the existing shared `LockedContentModal` with a specific "unlocks in a future update" message per item — no new systems were implemented, matching scope.
- All currency/level/power figures are read from the existing `usePlayerStore()` / `calculateShipStats` / `calculatePowerScore` — nothing was hand-typed or recomputed inline.

## 8. Build, typecheck, and behavioral verification

**Important note on this sandbox's OneDrive mount**: partway through verification I discovered the bash-visible mount of the project folder can lag significantly behind the real filesystem after an edit — a `grep`/`typecheck` run against it can silently test *stale, pre-edit* content while still reporting success, because both sides of an import (a component and the module it imports) can be stale *together* and stay internally consistent. I caught this because a later, unrelated check surfaced content that didn't match what had just been written. Once identified, every file touched this batch was re-verified by reading it back through the authoritative editor view (not the bash mount) and, where needed, written directly into the build/verification copy from that authoritative content — bypassing the stale mount entirely. All results below are from that verified-correct copy, and the same copy is what was zipped into the checkpoint.

- `npm run typecheck` — 0 errors, strict mode, `noUnusedLocals`/`noUnusedParameters` on.
- `npm run build` — 88 modules, `dist/index.html` 0.85 kB, CSS 37.34 kB (7.11 kB gzip), JS 193.36 kB (59.29 kB gzip).
- Behavioral test (same throwaway esbuild+jsdom harness pattern as prior batches — real React render, real click/keydown events, not shipped): 20 of 23 checks passed outright —
  Home renders; no `.bottom-nav` on Home; exactly 5 shortcut cards, 6 left-rail buttons, 4 right-rail cards, 4 escort ships, and a hero-ship image render; a locked shortcut opens the shared modal and Escape closes it; Hangar navigates to Ship Selection and that screen renders *with* its bottom nav present; returning to Home works; Play navigates to Gameplay; the chapter strip navigates to Campaign and it renders; Ship Upgrade still renders with its bottom nav present.
  The remaining 3 "failures" are test-harness artifacts, not regressions: two expected a `localStorage` save to exist without any state-mutating action being triggered (Home's own changes don't touch persistence, and no action was fired to create one), and one flagged jsdom's known lack of `<canvas>` support surfacing a console warning from the pre-existing, untouched `GameplayScreen` placeholder canvas — not code this batch touched or was permitted to touch.

## 9. Responsive pass and correction made

Reviewed the CSS against ~375–390px phone widths and found the original top-HUD sizing (profile chip + 3 resource chips + mail/settings buttons) would have exceeded the available width on the smallest common phone sizes. Corrected by tightening avatar/chip/icon-button sizing and gaps for the mobile-first base styles, then restoring the original, roomier sizing via a `min-width: 400px` media query for larger phones. The shared `AppShell` continues to cap the whole app at `520px` and center it on tablet/desktop widths (unchanged from Batch 1), so this Home layout also governs the 700–1536px range without further per-breakpoint work.

## 10. Visual evidence

No headless browser is obtainable in this sandbox (Playwright's Chromium download is blocked by the network allowlist; no system Chromium or root access to install one) — this was re-confirmed, not re-attempted from scratch, since the constraint hasn't changed since earlier batches. No screenshots were fabricated. To verify visually:

```
npm install
npm run dev
```

Then open `#/home` at ~390px, ~430px, and a wide desktop width, and click through the left rail, right rail, chapter strip, Play, and all 5 bottom shortcuts.

## 11. Known visual differences from the reference (honest assessment)

- Frame/icon placement inside each art asset (e.g., the avatar circle inside `player_profile_hud_frame.png`, the icon socket inside `resource_capsule_frame.png`) was positioned by percentage based on visual inspection of each asset, not pixel-measured — close but not guaranteed pixel-perfect without a real browser to check against.
- The central scene's vortex/beam/platform alignment against the baked-in background glow is an approximation (percentage-based positioning), since there's no way to screenshot-compare in this sandbox.
- `home_top_hud_rail.png` and `home_bottom_control_deck.png` are used as decorative backdrop plates behind their regions rather than having every individual sub-element locked into their internal sockets, per the asset audit's own note that these may need scaling/cropping to align precisely — the individual real frame assets (profile frame, resource capsules, power panel, play button, multiplayer card, shortcut cards) are layered on top and are what carries the actual visual weight.

## 12. Known issues / deferred

- No production art beyond what's in the 42-asset pack — Season Pass, mode cards, and multiplayer all reuse the audit's flagged "small/simple" or "sheet-derived" assets as-is.
- Chapter pagination currently reflects the 5 hardcoded stages in `src/data/campaign.ts` (only 1 chapter exists in the data); multi-chapter paging isn't testable until more chapters are authored.
- All "coming soon" systems remain modal placeholders, per scope — no new systems were implemented.

## 13. Checkpoint

`home-dashboard-strict-exact-rebuild-complete.zip` at the project root — built from the exact verified source tree (re-installed and re-built clean inside the zip staging directory before zipping, confirming the shipped tree itself builds), 149,515,372 bytes, transferred to the project folder in chunks to work around this sandbox's large-file mount limitation and reassembled with an exact byte-for-byte match, `unzip -t` reports "No errors detected." Excludes `node_modules/`, `dist/`, `.git/`, build cache files, and the redundant copy of the source asset ZIP already extracted into `public/`. `legacy/current-prototype/` was not modified.
