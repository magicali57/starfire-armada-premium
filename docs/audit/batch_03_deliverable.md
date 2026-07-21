# Starfire Armada V2 — UI Asset Integration Deliverable

Visual/asset-integration batch only. No new features, no gameplay, no Batch 3 systems — same architecture and behavior as Batch 2, now presented with the real production art instead of glyph/CSS placeholders.

## 0. Pre-work

- Found the asset folders under a misspelled path: `public/assests/ui-v2/...` (extra "s") instead of the specified `public/assets/ui-v2/...`. Copied everything to the correctly-spelled path (checksum-verified identical), then deleted the misspelled folder. All 10 expected files were present once the path was corrected.
- No `STARFIRE_UI_ASSET_HANDOFF.md` was found anywhere in the project — proceeded from the code audit, reference manifest, and the asset mapping given directly in this task.
- Re-read `docs/audit/starfire_armada_v2_code_audit.md` and `starfire_v2_reference_manifest.csv`, and reviewed `home_dashboard_and_hangar_upgrade.png`, `ship_selection_and_arsenal.png`, `campaign_chapter_and_boss_raid.png`, and `ships_01_to_20.png` before touching any code.
- Confirmed the Batch 2 baseline (`npm install`, `npm run typecheck`, `npm run build`) passed clean before starting.
- No git checkpoint: still no reachable git repository (only `games/starfire-armada` is mounted, not the `arcadeverse-site` root), so I continued the zip-checkpoint approach from Batches 1-2 instead, per your earlier instruction not to initialize a nested repo.

## 1. Visual architecture summary

Nothing about the Batch 2 architecture changed — only presentation. The one addition is a centralized asset layer:

- **`src/data/assetRegistry.ts`** — every runtime image path lives here in one place: `SHIP_HERO_ART`, `SHIP_ROSTER_ART` (both keyed by ship id), `HANGAR_PLATFORM_IMAGE`, `CHAPTER_BACKGROUND_IMAGE` (keyed by chapter id), `SHORTCUT_ICON` (keyed by shortcut id), and `RARITY_EMBLEM` (keyed by rarity). `src/data/ships.ts` pulls Rapid-Fire's and the four preview ships' art from this registry rather than hardcoding paths inline.
- **`ShipArt`** (existing fallback component from Batch 2) now takes a `variant: "hero" | "roster"` prop and picks the matching image from ship data, falling back to the other variant, then to the themed glyph if neither exists — and now also has an `onError` handler so a broken image URL degrades to the glyph instead of showing a broken-image icon. This is the "reusable image fallback" the task asked for.
- All ship imagery renders through `object-fit: contain` (kept from Batch 2) — nothing is stretched or cropped to fill its box.

## 2. Screen-by-screen changes

**Home** — Real layered hangar composition: cosmic gradient background, two drifting nebula blobs, a CSS starfield, the CSS energy rings/beam from Batch 2 (kept, now peeking from behind the real artwork for depth), the real `neon_hangar_platform` image on top of those, and the real `rapid_fire_hero` ship art above that with its idle-float animation. Ship info row now shows the real rarity emblem image next to the rarity label. Shortcut cards use the five cropped icon images instead of unicode glyphs. Chapter card got a subtle gradient tint.

**Ship Selection** — Roster cards and the detail panel now render real art for Rapid-Fire (roster crop) and the four "preview" ships (Laser Beam, Homing Missiles, Electric Shock, Plasma Spread); ships 6-20 keep the Batch 2 glyph fallback, as instructed. Every card shows its rarity emblem image. Locked cards now show a proper dark gradient overlay over the (dimmed) art plus a corner lock badge, rather than just a full-card lock glyph. The detail panel shows the ship at its larger "hero" art variant when available. Filter tabs got a gradient active state with a glow.

**Ship Upgrade** — Larger hero presentation (140px → 190px) with the hangar platform image and a spinning accent ring behind it, matching Home's staging language. Rarity emblem added next to the rarity label. Upgrade button enlarged. **No logic was touched**: `handleUpgrade`, `calculateShipStats`/`calculatePowerScore`/`calculateUpgradeCost`, the store's `upgradeShipLevel`, and all state derivation are byte-for-byte what they were in Batch 2 — only the JSX/CSS around them changed.

**Campaign** — Complete visual rebuild: a hero section with the `chapter_01_void_frontier` background image, a dark gradient overlay for text legibility, chapter title/description, a real progress bar (stages cleared / total, derived from `player.highestClearedStageId` — no new state was added), and total reward totals. Stage cards now carry a per-kind icon and accent color (standard/mixed-pattern/elite/survival/boss all look distinct), the boss stage gets a gold border plus a red glow, the current stage gets a "Current" badge, and already-cleared stages get a checkmark badge. Routing and the underlying stage data are unchanged.

## 3. Exact asset mapping used

| Registry key | File |
|---|---|
| `SHIP_HERO_ART["ship-01-rapid-fire"]` | `ships/rapid_fire_hero_transparent.png` |
| `SHIP_ROSTER_ART["ship-01-rapid-fire"]` | `ships/rapid_fire_roster_transparent.png` |
| `SHIP_ROSTER_ART["ship-02-laser-beam"]` | `ships/laser_beam_preview_transparent.png` |
| `SHIP_ROSTER_ART["ship-03-homing-missiles"]` | `ships/homing_missiles_preview_transparent.png` |
| `SHIP_ROSTER_ART["ship-04-electric-shock"]` | `ships/electric_shock_preview_transparent.png` |
| `SHIP_ROSTER_ART["ship-05-plasma-spread"]` | `ships/plasma_spread_preview_transparent.png` |
| `HANGAR_PLATFORM_IMAGE` | `hangar/neon_hangar_platform_transparent.png` |
| `CHAPTER_BACKGROUND_IMAGE["chapter-01"]` | `backgrounds/chapter_01_void_frontier.png` |
| `SHORTCUT_ICON.hangar` / `.arsenal` / `.companions` / `["tech-tree"]` / `.missions` | `icons/hangar.png`, `arsenal.png`, `companions.png`, `tech_tree.png`, `missions.png` |
| `RARITY_EMBLEM.common` … `.mythic` | `emblems/common.png` … `mythic.png` |

All paths are served from `/assets/ui-v2/...` at the site root (no `/public` prefix), matching Vite's `public/` convention.

## 4. Cropped / cleaned images

**Cleaned (checkerboard removed, real alpha added)** — every source file except the campaign background needed this; see section 5 for method and verification:
`ships/rapid_fire_hero_transparent.png`, `ships/rapid_fire_roster_transparent.png`, `ships/laser_beam_preview_transparent.png`, `ships/homing_missiles_preview_transparent.png`, `ships/electric_shock_preview_transparent.png`, `ships/plasma_spread_preview_transparent.png`, `hangar/neon_hangar_platform_transparent.png`, `icons/dashboard_shortcuts_sheet_transparent.png`, `emblems/rarity_emblems_sheet_transparent.png`. Every original file is untouched and sits alongside its cleaned `_transparent` counterpart with the same base name.

**Cropped from sheets** (cropped from the cleaned sheet, not the raw original):

- `icons/hangar.png`, `icons/arsenal.png`, `icons/companions.png`, `icons/tech_tree.png`, `icons/missions.png` — cropped left-to-right in that order from `dashboard_shortcuts_sheet.png` (ship silhouette → pistol → robotic cat → branching hex tree → supply crate). Crop boxes (x0, y0, x1, y1, in source-image pixels, padding already included): `(76,122,470,614)`, `(519,178,874,580)`, `(938,192,1270,578)`, `(1351,171,1673,591)`, `(1736,205,2100,583)`.
- `emblems/common.png`, `rare.png`, `epic.png`, `legendary.png`, `mythic.png`, `sss.png` — cropped left-to-right from `rarity_emblems_sheet.png` (cyan → blue → violet → gold → red → ornate gold/violet). Crop boxes: `(29,184,363,572)`, `(375,173,718,584)`, `(738,164,1085,581)`, `(1098,160,1454,588)`, `(1464,133,1805,596)`, `(1803,112,2156,604)`.
- Method: cleaned the full sheet to real alpha first, then auto-detected column boundaries as the gaps between columns with non-transparent pixels (5 and 6 columns detected automatically, matching the expected counts), then cropped each to its content bounding box with 6px padding. Nothing was manually eyeballed pixel-by-pixel — the boundaries came from the alpha data itself.
- `sss.png` has no corresponding `ShipRarity` yet (only 5 rarities exist in the data model) — it's registered as `SSS_EMBLEM_RESERVED` in the asset registry for a future above-mythic tier, not currently used on screen.

## 5. Transparency verification

Checked every PNG with `file` (which reports RGB vs RGBA) before touching anything — **all 9 non-background images came back as plain 8-bit RGB with no alpha channel at all.** Viewing them confirmed why: each one has a checkerboard "this is transparent" preview pattern baked directly into the pixels (light gray/white checkers on the ship and hangar images, a darker navy checker on the two sheets) — exactly the failure case the task described. Only `backgrounds/chapter_01_void_frontier.png` is correctly RGB with no alpha needed, since it's used as a full-bleed cover image, not a composited sprite.

Cleaning method: rather than assuming a fixed checkerboard period, I sampled each image's outer border ring, split those background pixels into two lightness clusters (the checker's two alternating tones), then for every pixel in the whole image computed its distance to the nearest of those two tones. Pixels close to either tone became transparent; pixels far from both (i.e., real art) stayed opaque; pixels in between got a proportional alpha with the background color "unmixed" out of them, so faded glow edges don't carry a haze of the old checker color. A light Gaussian blur on the alpha channel only (not the color) removed residual per-block noise in soft gradient areas like the hangar platform's beam without softening the ships' crisp edges.

I verified the result was real alpha (not just visually transparent-looking) by running `file` again on every cleaned output — all report `8-bit/color RGBA`, confirmed above and reproducible with `file public/assets/ui-v2/**/*_transparent.png`.

**Files that required cleaning:** all 6 ship images, the hangar platform, and both sheets (9 of 10 source files). **File that did not:** the campaign background (correct as delivered).

## 6. Type-check result

`npm run typecheck` — 0 errors, strict mode, verified on a from-scratch `rm -rf node_modules package-lock.json dist && npm install`.

## 7. Build result

`npm run build` — 92 modules transformed. `dist/index.html` 0.54 kB, CSS 33.14 kB (6.37 kB gzip), JS 185.92 kB (57.78 kB gzip). Confirmed `public/assets/ui-v2/` is copied into `dist/assets/ui-v2/` by Vite's build (checked directly), so the runtime `/assets/ui-v2/...` paths resolve correctly in the production bundle, not just in dev.

## 8. Manual/automated test result

Re-ran the same kind of throwaway executed-behavior script used in the Batch 2 deliverable (compiled the real `App.tsx` with esbuild, mounted it in `jsdom` with React's actual renderer, drove it with real DOM events) against the new asset-integrated markup. All 22 checks passed, including several added specifically for this batch:

- Home renders Rapid-Fire, a Play button, the hangar platform `<img>`, the hero ship `<img>`, and all 5 shortcut icons as images.
- Ship Selection: all 20 cards render, exactly 19 locked / 1 selected, all 20 cards show a rarity emblem image, locked-ship click opens the modal without changing selection, Escape closes it.
- Ship Upgrade: the hangar platform image renders behind the ship; clicking Upgrade still increases level by exactly 1 and decreases coins (i.e., the Batch 2 logic is provably intact after the visual rewrite).
- Campaign: opens with the correct chapter title, renders the hero background `<img>`, shows all 5 stage cards, and shows a "Continue" button for the current stage.
- Zero `console.error` calls throughout.

This script was a throwaway verification tool and was deleted before packaging — it is not part of the shipped project.

## 9. Screenshots

**Not captured — same sandbox limitation as the Batch 2 report.** I re-confirmed rather than assumed: Playwright's Chromium download is blocked by this sandbox's network allowlist (`cdn.playwright.dev` rejected), and there's no root/sudo available to install a system browser (`apt-get` also requires privileges this sandbox doesn't grant me). No browser binary exists anywhere on the filesystem. I did not describe or imply screenshots that don't exist.

To see the real result yourself:

```
npm install
npm run dev
```

Then open the printed local URL and check `#/home`, `#/ships`, `#/ships/upgrade`, and `#/campaign` at a mobile width (~390-430px) and at least one at a wide desktop width (~1536px). `npm run build && npm run preview` works the same way against the production bundle.

## 10. Remaining visual gaps vs. the approved references

- The references show a far more elaborate Home (season pass card, events/missions/daily-reward/achievements/leaderboard rail, multiplayer button, chapter carousel with left/right arrows) — only the in-scope pieces (hero ship, campaign card, Play, 5 shortcuts) were built; the rest stay as later-batch systems, not represented on screen at all yet.
- Ship Selection's reference has a two-pane desktop-style layout (grid + fixed side panel) — the current implementation stacks the detail panel above the grid on all sizes, which works but isn't the same information density as the reference at desktop width.
- Ship Upgrade's reference shows companions, modules, and equipped-weapons rows alongside the stat panel — those remain out of scope per this batch's instructions and are not visually represented, only the disabled tab row hints at them.
- Campaign's reference has difficulty tiers (Normal/Hard/Nightmare), a node-map with branching stage icons, and three-star per-stage ratings — the current Campaign is a linear 5-stage list with a progress bar, since those richer systems don't exist in the Batch 2 data model yet and weren't in scope to invent here.
- Ships 6-20 still show the plain glyph fallback in Ship Selection, per the explicit instruction that only ships 1-5 get real art this batch.

## 11. Asset list still needed for a full visual match

- Hero (large) art for ships 2-20 — only Rapid-Fire has a hero-scale render; the rest would need one each to look right on Ship Upgrade if a locked ship's hero shot were ever needed.
- Roster art for ships 6-20 (currently glyph fallback).
- Companion, module, and weapon-icon art for the systems shown in the reference dashboards but not yet built.
- Additional chapter background art beyond `chapter_01_void_frontier.png` for chapters 2+ once they exist.
- A proper "SSS" rarity tier definition if the `sss.png` emblem is meant to represent a real above-mythic rarity rather than staying reserved/unused.

## 12. Checkpoint

`ui-asset-integration-complete.zip` created at the project root, same exclusions as Batches 1-2 (no `node_modules`, `dist`, `.git`, cache files, or any of the three checkpoint zips). `legacy/current-prototype/` and `docs/references/` and `docs/audit/` were preserved — checksum-verified before and after.
