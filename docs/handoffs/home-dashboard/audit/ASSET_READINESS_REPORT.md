# Starfire Armada Home Dashboard — 42-Asset Readiness Audit

- Total canonical assets checked: **42**
- Directly ready: **31**
- Ready as source sheets (crop before runtime): **6**
- Ready with caveats: **5**

## Processing performed

- Converted generated checkerboard/matte backgrounds into real RGBA transparency where required.
- Preserved the cosmic background as an opaque full-screen image.
- Trimmed large transparent padding from extracted assets.
- Replaced the weak cropped bottom deck with the full multi-socket control-deck artwork.
- Repaired the top action button into a complete square frame.
- Preserved all 42 canonical filenames and organized them under `assets/major` and `assets/ui`.

## Important caveats

1. Icon/badge/navigation sheets are source sheets and should be cropped into individual runtime files.
2. The energy beam had a dark baked checkerboard; its transparency was reconstructed algorithmically and should be checked over the final background.
3. The timer icon is a derived asset rather than a bespoke generated clock.
4. Several small escort and mode-card images were extracted from generated sheets. They are suitable at their intended small UI sizes, not for large display.
5. The home background already includes a vortex and platform. Claude should avoid visually doubling them when layering separate vortex/platform assets.
6. Asset readiness does not guarantee a close visual match by itself; layout, typography, scale, and overlap must follow the reference exactly.

## Per-asset results

- `major/bottom_shortcut_icon_sheet.png` — **READY AS SOURCE SHEET**; 1254x1254 RGBA — Source sheet; crop five icons before runtime use.
- `major/chapter_panel_frame.png` — **READY**; 2172x724 RGBA
- `major/home_cosmic_background.png` — **READY**; 941x1672 RGB — Contains its own vortex and platform; use as base scene and layer extra vortex/beam selectively to avoid duplication.
- `major/home_energy_beam.png` — **READY WITH CAVEAT**; 724x2172 RGBA — Dark checkerboard was removed algorithmically; inspect glow edges in browser.
- `major/home_escort_ship_01.png` — **READY**; 244x205 RGBA — Extracted from a generated sheet; adequate for small escort placement, not large hero use.
- `major/home_escort_ship_02.png` — **READY**; 260x175 RGBA — Extracted from a generated sheet; adequate for small escort placement, not large hero use.
- `major/home_escort_ship_03.png` — **READY**; 262x209 RGBA — Extracted from a generated sheet; adequate for small escort placement, not large hero use.
- `major/home_escort_ship_04.png` — **READY**; 253x207 RGBA — Extracted from a generated sheet; adequate for small escort placement, not large hero use.
- `major/home_landing_platform.png` — **READY**; 1254x1254 RGBA
- `major/home_main_hero_ship.png` — **READY**; 1254x1254 RGBA
- `major/home_vortex_portal.png` — **READY**; 1254x1254 RGBA
- `major/left_menu_icon_sheet.png` — **READY AS SOURCE SHEET**; 2172x724 RGBA — Source sheet; crop five icons before runtime use.
- `major/mode_card_art_arena.png` — **READY**; 290x265 RGBA — Extracted preview art; intended for small mode card only.
- `major/mode_card_art_boss_raid.png` — **READY**; 1254x1254 RGBA
- `major/mode_card_art_galaxy_war.png` — **READY**; 273x268 RGBA — Extracted preview art; intended for small mode card only.
- `major/mode_card_art_guild.png` — **READY**; 302x268 RGBA — Extracted preview art; intended for small mode card only.
- `major/multiplayer_card_art.png` — **READY**; 1254x1254 RGBA
- `major/notification_badge.png` — **READY**; 1254x1254 RGBA
- `major/play_button_frame.png` — **READY**; 2172x724 RGBA
- `major/player_avatar_frame.png` — **READY**; 291x250 RGBA — Small/simple frame; the larger player_profile_hud_frame should supply the surrounding profile structure.
- `major/power_panel_frame.png` — **READY**; 330x93 RGBA
- `major/rarity_badge_sheet.png` — **READY AS SOURCE SHEET**; 1254x1254 RGBA — Source sheet with labels; crop badges before runtime use.
- `major/season_pass_emblem.png` — **READY**; 289x265 RGBA
- `major/topbar_icon_sheet.png` — **READY AS SOURCE SHEET**; 2172x724 RGBA — Source sheet; crop six icons before runtime use.
- `ui/frames/bottom_shortcut_card_frame.png` — **READY**; 351x181 RGBA
- `ui/frames/bottom_shortcut_selected_frame.png` — **READY**; 371x186 RGBA
- `ui/frames/home_bottom_control_deck.png` — **READY**; 2172x724 RGBA
- `ui/frames/home_top_hud_rail.png` — **READY WITH CAVEAT**; 2172x724 RGBA — Multi-socket rail may require CSS scaling/cropping to align precisely with the final 700×1024 layout.
- `ui/frames/left_menu_button_frame.png` — **READY**; 2172x724 RGBA
- `ui/frames/mode_card_frame.png` — **READY**; 351x400 RGBA
- `ui/frames/multiplayer_card_frame.png` — **READY**; 536x171 RGBA — Includes a baked VS emblem, which matches the reference concept but is not an empty frame.
- `ui/frames/player_profile_hud_frame.png` — **READY**; 2172x724 RGBA
- `ui/frames/resource_capsule_frame.png` — **READY**; 2172x724 RGBA
- `ui/frames/season_pass_card_frame.png` — **READY**; 1086x1448 RGBA
- `ui/frames/status_strip_frame.png` — **READY**; 401x121 RGBA
- `ui/frames/top_action_button_frame.png` — **READY WITH CAVEAT**; 435x435 RGBA — Derived from the resource capsule socket and repaired to a complete square frame.
- `ui/icons/power_crossed_swords_icon.png` — **READY**; 1254x1254 RGBA
- `ui/icons/timer_clock_icon.png` — **READY WITH CAVEAT**; 395x395 RGBA — Derived from pagination-dot artwork and manually given clock hands; usable at small size, but not a bespoke generated timer icon.
- `ui/navigation/chapter_navigation_icon_sheet.png` — **READY AS SOURCE SHEET**; 2508x627 RGBA — Source sheet containing left and right arrows; crop before runtime use.
- `ui/navigation/chapter_pagination_dot_sheet.png` — **READY AS SOURCE SHEET**; 2508x627 RGBA — Source sheet containing active and inactive dots; crop before runtime use.
- `ui/overlays/home_outer_hud_overlay.png` — **READY WITH CAVEAT**; 941x1672 RGBA — Decorative full-screen overlay; preserve aspect ratio and use pointer-events:none.
- `ui/portraits/player_avatar_portrait.png` — **READY**; 1254x1254 RGBA