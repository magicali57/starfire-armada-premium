import type { ShipRarity } from "@/types";

// Centralized runtime asset paths. Everything here lives under
// public/assets/ui-v2/ and is served from the site root by Vite — never
// include "/public" in these paths. See docs/audit for the source handoff
// and STARFIRE_UI_ASSET_HANDOFF for original filenames.
//
// Cleaning note: every file below except the campaign background was
// delivered with a checkerboard "transparency preview" baked directly into
// the pixels (plain RGB, no alpha channel). Each was cleaned into a real
// RGBA version (see docs/audit/batch_03_deliverable.md for method) and the
// untouched originals were kept alongside them with the same base name.

const BASE = "/assets/ui-v2";

export const SHIP_HERO_ART: Partial<Record<string, string>> = {
  "ship-01-rapid-fire": `${BASE}/ships/rapid_fire_hero_transparent.png`,
};

export const SHIP_ROSTER_ART: Partial<Record<string, string>> = {
  "ship-01-rapid-fire": `${BASE}/ships/rapid_fire_roster_transparent.png`,
  "ship-02-laser-beam": `${BASE}/ships/laser_beam_preview_transparent.png`,
  "ship-03-homing-missiles": `${BASE}/ships/homing_missiles_preview_transparent.png`,
  "ship-04-electric-shock": `${BASE}/ships/electric_shock_preview_transparent.png`,
  "ship-05-plasma-spread": `${BASE}/ships/plasma_spread_preview_transparent.png`,
};

export const HANGAR_PLATFORM_IMAGE = `${BASE}/hangar/neon_hangar_platform_transparent.png`;

export const CHAPTER_BACKGROUND_IMAGE: Record<string, string> = {
  "chapter-01": `${BASE}/backgrounds/chapter_01_void_frontier.png`,
};

// The emblem sheet shipped 6 emblems; the 6th ("sss") has no corresponding
// ShipRarity yet and is kept for a future above-mythic tier.
export const RARITY_EMBLEM: Record<ShipRarity, string> = {
  common: `${BASE}/emblems/common.png`,
  rare: `${BASE}/emblems/rare.png`,
  epic: `${BASE}/emblems/epic.png`,
  legendary: `${BASE}/emblems/legendary.png`,
  mythic: `${BASE}/emblems/mythic.png`,
};

export const SSS_EMBLEM_RESERVED = `${BASE}/emblems/sss.png`;

// ---------------------------------------------------------------------------
// Home Dashboard (strict exact-match rebuild) — sourced from the 42-asset
// pack `starfire_home_dashboard_42_assets_audited_claude_ready.zip`. Every
// path below was copied verbatim from that pack's `assets/major/*` and
// `assets/ui/*` folders into public/assets/ui-v2/home/{major,ui/...}. See
// docs/handoffs/home-dashboard/ for the source README and asset audit, and
// docs/audit/home_dashboard_deliverable.md for the crop/compose method.
//
// All 6 icon/badge sheets in major/ and ui/navigation/ were auto-cropped
// (alpha-threshold column/row detection, not manual pixel guessing) into
// the individual files referenced under ui/icons/ and
// ui/navigation/cropped/ below.
// ---------------------------------------------------------------------------

const HOME_BASE = `${BASE}/home`;

// Final mobile top-bar pack. Dynamic labels, balances, XP fill, plus signs,
// and the inbox badge remain code-rendered layers; these files provide only
// the transparent portrait, icons, and reusable HUD frames.
export const HOME_TOPBAR_FINAL = {
  avatar: `${HOME_BASE}/topbar-final/player_avatar_portrait.png`,
  profileFrame: `${HOME_BASE}/topbar-final/profile_panel_frame.png`,
  resourceFrame: `${HOME_BASE}/topbar-final/resource_panel_frame.png`,
  utilityFrame: `${HOME_BASE}/topbar-final/utility_button_frame.png`,
  energy: `${HOME_BASE}/topbar-final/energy_icon.png`,
  coin: `${HOME_BASE}/topbar-final/coin_icon.png`,
  gem: `${HOME_BASE}/topbar-final/gem_icon.png`,
  mail: `${HOME_BASE}/topbar-final/mail_icon.png`,
  settings: `${HOME_BASE}/topbar-final/settings_icon.png`,
} as const;

// Final side-menu card pack. Labels, frames, and card artwork are baked into
// these transparent card images. Runtime badges/timers remain separate code
// layers in HomeScreen so their values can change without editing the art.
export const HOME_SIDE_MENU_FINAL = {
  seasonPass: `${HOME_BASE}/side-menu-user-final/season_pass_card.png?v=20260716b`,
  events: `${HOME_BASE}/side-menu-user-final/events_card.png?v=20260716b`,
  achievements: `${HOME_BASE}/side-menu-user-final/achievements_card.png?v=20260716b`,
  leaderboard: `${HOME_BASE}/side-menu-user-final/leaderboard_card.png?v=20260716b`,
  limitedTimeOffer: `${HOME_BASE}/side-menu-user-final/limited_time_offer_card.png?v=20260716b`,
  galaxyWar: `${HOME_BASE}/side-menu-user-final/galaxy_war_card.png?v=20260716b`,
  bossRaid: `${HOME_BASE}/side-menu-user-final/boss_raid_card.png?v=20260716b`,
  guild: `${HOME_BASE}/side-menu-user-final/guild_card.png?v=20260716b`,
  multiplayer: `${HOME_BASE}/side-menu-user-final/multiplayer_card.png?v=20260716b`,
} as const;

// Central cinematic scene (region C). home_cosmic_background.png supplies
// the active vortex, open space, horizon, and distant landing area. The
// standalone vortex/platform paths remain registered for future repaired
// assets, but are intentionally not rendered on Home: their low-alpha matte
// remnants contaminate the composition. The live beam/landing glow are clean
// CSS effects in HomeScreen.css.
export const HOME_SCENE = {
  background: `${HOME_BASE}/major/home_cosmic_background.png`,
  vortexPortal: `${HOME_BASE}/major/home_vortex_portal.png`,
  energyBeam: `${HOME_BASE}/major/home_energy_beam.png`,
  landingPlatform: `${HOME_BASE}/major/home_landing_platform.png`,
  heroShip: `${HOME_BASE}/major/home_main_hero_ship_clean.png`,
  escortShips: [
    `${HOME_BASE}/major/home_escort_ship_01.png`,
    `${HOME_BASE}/major/home_escort_ship_02.png`,
    `${HOME_BASE}/major/home_escort_ship_03.png`,
    `${HOME_BASE}/major/home_escort_ship_04.png`,
  ],
} as const;

// Structural frames/plates used across regions A, B, D, E, F, G.
export const HOME_FRAMES = {
  topHudRail: `${HOME_BASE}/ui/frames/home_top_hud_rail.png`,
  playerProfileHudFrame: `${HOME_BASE}/ui/frames/player_profile_hud_frame.png`,
  resourceCapsuleFrame: `${HOME_BASE}/ui/frames/resource_capsule_frame.png`,
  topActionButtonFrame: `${HOME_BASE}/ui/frames/top_action_button_frame.png`,
  seasonPassCardFrame: `${HOME_BASE}/ui/frames/season_pass_card_frame.png`,
  leftMenuButtonFrame: `${HOME_BASE}/ui/frames/left_menu_button_frame.png`,
  modeCardFrame: `${HOME_BASE}/ui/frames/mode_card_frame.png`,
  chapterPanelFrame: `${HOME_BASE}/major/chapter_panel_frame.png`,
  statusStripFrame: `${HOME_BASE}/ui/frames/status_strip_frame.png`,
  powerPanelFrame: `${HOME_BASE}/major/power_panel_frame.png`,
  playButtonFrame: `${HOME_BASE}/major/play_button_frame.png`,
  multiplayerCardFrame: `${HOME_BASE}/ui/frames/multiplayer_card_frame.png`,
  bottomControlDeck: `${HOME_BASE}/ui/frames/home_bottom_control_deck.png`,
  bottomShortcutCardFrame: `${HOME_BASE}/ui/frames/bottom_shortcut_card_frame.png`,
  bottomShortcutSelectedFrame: `${HOME_BASE}/ui/frames/bottom_shortcut_selected_frame.png`,
  playerAvatarFrame: `${HOME_BASE}/major/player_avatar_frame.png`,
  outerHudOverlay: `${HOME_BASE}/ui/overlays/home_outer_hud_overlay.png`,
} as const;

export const HOME_PLAYER_AVATAR_PORTRAIT = `${HOME_BASE}/ui/portraits/player_avatar_portrait.png`;
export const HOME_SEASON_PASS_EMBLEM = `${HOME_BASE}/major/season_pass_emblem.png`;
export const HOME_NOTIFICATION_BADGE = `${HOME_BASE}/major/notification_badge.png`;

// multiplayer_card_art.png already has a baked "VS" emblem matching the
// reference's multiplayer card — used as the card's art layer.
// HOME_FRAMES.multiplayerCardFrame (also VS-branded) is kept in the
// registry but intentionally unused on the card itself to avoid a doubled
// VS mark; it's reserved for a smaller decorative accent if ever needed.
export const HOME_MULTIPLAYER_CARD_ART = `${HOME_BASE}/major/multiplayer_card_art.png`;

export const HOME_MODE_CARD_ART: Record<
  "galaxy-war" | "boss-raid" | "arena" | "guild",
  string
> = {
  "galaxy-war": `${HOME_BASE}/major/mode_card_art_galaxy_war.png`,
  "boss-raid": `${HOME_BASE}/major/mode_card_art_boss_raid.png`,
  arena: `${HOME_BASE}/major/mode_card_art_arena.png`,
  guild: `${HOME_BASE}/major/mode_card_art_guild.png`,
};

// Top HUD icons (region A), cropped from topbar_icon_sheet.png.
export const HOME_TOPBAR_ICON: Record<
  "energy" | "coin" | "crystal" | "plus" | "mail" | "settings",
  string
> = {
  energy: `${HOME_BASE}/ui/icons/topbar/icon_energy.png`,
  coin: `${HOME_BASE}/ui/icons/topbar/icon_coin.png`,
  crystal: `${HOME_BASE}/ui/icons/topbar/icon_crystal.png`,
  plus: `${HOME_BASE}/ui/icons/topbar/icon_plus.png`,
  mail: `${HOME_BASE}/ui/icons/topbar/icon_mail.png`,
  settings: `${HOME_BASE}/ui/icons/topbar/icon_settings.png`,
};

// Left utility rail icons (region B), cropped from left_menu_icon_sheet.png.
// Season Pass is its own card (HOME_FRAMES.seasonPassCardFrame /
// HOME_SEASON_PASS_EMBLEM) — the other 5 rail rows use these icons.
export const HOME_LEFT_MENU_ICON: Record<
  "events" | "missions" | "daily-reward" | "achievements" | "leaderboard",
  string
> = {
  events: `${HOME_BASE}/ui/icons/left_menu/icon_events.png`,
  missions: `${HOME_BASE}/ui/icons/left_menu/icon_missions.png`,
  "daily-reward": `${HOME_BASE}/ui/icons/left_menu/icon_daily_reward.png`,
  achievements: `${HOME_BASE}/ui/icons/left_menu/icon_achievements.png`,
  leaderboard: `${HOME_BASE}/ui/icons/left_menu/icon_leaderboard.png`,
};

// Bottom shortcut row icons (region G), cropped from
// bottom_shortcut_icon_sheet.png. Home-specific: Shop replaces Missions
// here per the strict rebuild spec (Missions already lives in the left
// rail for Home; other screens are unaffected since nothing else imports
// this registry entry).
export const HOME_BOTTOM_SHORTCUT_ICON: Record<
  "hangar" | "arsenal" | "companions" | "tech-tree" | "shop",
  string
> = {
  hangar: `${HOME_BASE}/ui/icons/bottom_shortcut/icon_hangar.png`,
  arsenal: `${HOME_BASE}/ui/icons/bottom_shortcut/icon_arsenal.png`,
  companions: `${HOME_BASE}/ui/icons/bottom_shortcut/icon_companions.png`,
  "tech-tree": `${HOME_BASE}/ui/icons/bottom_shortcut/icon_tech_tree.png`,
  shop: `${HOME_BASE}/ui/icons/bottom_shortcut/icon_shop.png`,
};

export const HOME_BOTTOM_NAV_FINAL = {
  home: `${HOME_BASE}/bottom-nav-final/home.png?v=20260715`,
  battle: `${HOME_BASE}/bottom-nav-final/battle.png?v=20260715`,
  fleet: `${HOME_BASE}/bottom-nav-final/fleet.png?v=20260715`,
  inventory: `${HOME_BASE}/bottom-nav-final/inventory.png?v=20260715`,
  shop: `${HOME_BASE}/bottom-nav-final/shop.png?v=20260715`,
} as const;

// Chapter strip (region E): nav arrows + pagination dots, cropped from
// chapter_navigation_icon_sheet.png / chapter_pagination_dot_sheet.png.
export const HOME_CHAPTER_NAV = {
  arrowLeft: `${HOME_BASE}/ui/navigation/cropped/arrow_left.png`,
  arrowRight: `${HOME_BASE}/ui/navigation/cropped/arrow_right.png`,
  dotActive: `${HOME_BASE}/ui/navigation/cropped/dot_active.png`,
  dotInactive: `${HOME_BASE}/ui/navigation/cropped/dot_inactive.png`,
} as const;

// Standalone icons used inside frames (Power panel, event/timer badges).
export const HOME_MISC_ICON = {
  powerCrossedSwords: `${HOME_BASE}/ui/icons/power_crossed_swords_icon.png`,
  timerClock: `${HOME_BASE}/ui/icons/timer_clock_icon.png`,
} as const;

// Rarity badges (full illustrated badge with baked label text), cropped
// from rarity_badge_sheet.png. Not used on Home itself but registered here
// since they shipped in this same asset pack and share the same crop
// pipeline; reserved for a future ship-rarity display upgrade.
export const HOME_RARITY_BADGE: Record<
  "common" | "rare" | "epic" | "legendary" | "mythic" | "sss",
  string
> = {
  common: `${HOME_BASE}/ui/icons/rarity/badge_common.png`,
  rare: `${HOME_BASE}/ui/icons/rarity/badge_rare.png`,
  epic: `${HOME_BASE}/ui/icons/rarity/badge_epic.png`,
  legendary: `${HOME_BASE}/ui/icons/rarity/badge_legendary.png`,
  mythic: `${HOME_BASE}/ui/icons/rarity/badge_mythic.png`,
  sss: `${HOME_BASE}/ui/icons/rarity/badge_sss.png`,
};

// =============================================================================
// Expansion asset pack (imported 2026-07-17) — Battle Hub / Campaign / Fleet /
// Loadout / Inventory integration phase.
//
// Source: STARFIRE_ARMADA_UI_HANDOFF handoff package. Every file below was
// delivered with a checkerboard "transparency preview" baked into the pixels
// (plain RGB, no real alpha) and was cleaned into a genuine RGBA file before
// import — see docs/audit and the cleanup reports for method. The untouched
// originals plus the cleaned versions actually imported here are archived
// verbatim at asset-archive/2026-07-17_cleaned_batch1/ (zip checksum
// 5d4ce8c10d6baecfdb0e6d8e21e57a87 for the 90-file bulk pack).
//
// This pack extends the design system the Home screen already established;
// nothing above this line was touched or replaced by this import.
// =============================================================================

// ---------------------------------------------------------------------------
// Ship artwork
// ---------------------------------------------------------------------------

const SHIPS_V2_BASE = `${BASE}/ships`;

// All 20 ships have a cleaned gameplay sprite (small, simple, verified
// transparent, no known defects). Safe to use anywhere a compact ship
// preview is needed, and doubles as the fallback for deferred master art
// below.
export const SHIP_GAMEPLAY_SPRITE: Record<string, string> = {
  "ship-01-rapid-fire": `${SHIPS_V2_BASE}/gameplay_sprites/01_rapid_fire_sprite.png`,
  "ship-02-laser-beam": `${SHIPS_V2_BASE}/gameplay_sprites/02_laser_beam_sprite.png`,
  "ship-03-homing-missiles": `${SHIPS_V2_BASE}/gameplay_sprites/03_homing_missiles_sprite.png`,
  "ship-04-electric-shock": `${SHIPS_V2_BASE}/gameplay_sprites/04_electric_shock_sprite.png`,
  "ship-05-plasma-spread": `${SHIPS_V2_BASE}/gameplay_sprites/05_plasma_spread_sprite.png`,
  "ship-06-shield-generator": `${SHIPS_V2_BASE}/gameplay_sprites/06_shield_generator_sprite.png`,
  "ship-07-stealth-ops": `${SHIPS_V2_BASE}/gameplay_sprites/07_stealth_ops_sprite.png`,
  "ship-08-drone-support": `${SHIPS_V2_BASE}/gameplay_sprites/08_drone_support_sprite.png`,
  "ship-09-flamethrower": `${SHIPS_V2_BASE}/gameplay_sprites/09_flamethrower_sprite.png`,
  "ship-10-ice-frost": `${SHIPS_V2_BASE}/gameplay_sprites/10_ice_frost_sprite.png`,
  "ship-11-gravity-pulse": `${SHIPS_V2_BASE}/gameplay_sprites/11_gravity_pulse_sprite.png`,
  "ship-12-poison-acid": `${SHIPS_V2_BASE}/gameplay_sprites/12_poison_acid_sprite.png`,
  "ship-13-sniper-railgun": `${SHIPS_V2_BASE}/gameplay_sprites/13_sniper_railgun_sprite.png`,
  "ship-14-healing-support": `${SHIPS_V2_BASE}/gameplay_sprites/14_healing_support_sprite.png`,
  "ship-15-emp-burst": `${SHIPS_V2_BASE}/gameplay_sprites/15_emp_burst_sprite.png`,
  "ship-16-boomerang-blades": `${SHIPS_V2_BASE}/gameplay_sprites/16_boomerang_blades_sprite.png`,
  "ship-17-mine-layer": `${SHIPS_V2_BASE}/gameplay_sprites/17_mine_layer_sprite.png`,
  "ship-18-orbital-cannons": `${SHIPS_V2_BASE}/gameplay_sprites/18_orbital_cannons_sprite.png`,
  "ship-19-berserker-overdrive": `${SHIPS_V2_BASE}/gameplay_sprites/19_berserker_overdrive_sprite.png`,
  "ship-20-cosmic-void": `${SHIPS_V2_BASE}/gameplay_sprites/20_cosmic_void_sprite.png`,
};

// Large presentation artwork for Fleet, Ship Detail, upgrades/unlocks, and
// Pre-Battle. All 20 ships now have cleaned, approved master art (the last
// 6 — electric-shock, shield-generator, gravity-pulse, healing-support,
// emp-burst, orbital-cannons — were promoted from
// asset-archive/2026-07-18_recovery_deferred6/ on 2026-07-18; 3 came through
// automated checkerboard cleanup, 3 required manual per-image repair, both
// documented in docs/handoffs/fleet-roster/). This is kept as a Partial map
// (rather than Record) so a future regression is a type-safe possibility,
// but every one of the 20 ship IDs is now populated. Use getShipMasterArt()
// below instead of indexing this map directly.
export const SHIP_MASTER_ART: Partial<Record<string, string>> = {
  "ship-01-rapid-fire": `${SHIPS_V2_BASE}/master_art/01_rapid_fire_master.png`,
  "ship-02-laser-beam": `${SHIPS_V2_BASE}/master_art/02_laser_beam_master.png`,
  "ship-03-homing-missiles": `${SHIPS_V2_BASE}/master_art/03_homing_missiles_master.png`,
  "ship-04-electric-shock": `${SHIPS_V2_BASE}/master_art/04_electric_shock_master.png`,
  "ship-05-plasma-spread": `${SHIPS_V2_BASE}/master_art/05_plasma_spread_master.png`,
  "ship-06-shield-generator": `${SHIPS_V2_BASE}/master_art/06_shield_generator_master.png`,
  "ship-07-stealth-ops": `${SHIPS_V2_BASE}/master_art/07_stealth_ops_master.png`,
  "ship-08-drone-support": `${SHIPS_V2_BASE}/master_art/08_drone_support_master.png`,
  "ship-09-flamethrower": `${SHIPS_V2_BASE}/master_art/09_flamethrower_master.png`,
  "ship-10-ice-frost": `${SHIPS_V2_BASE}/master_art/10_ice_frost_master.png`,
  "ship-11-gravity-pulse": `${SHIPS_V2_BASE}/master_art/11_gravity_pulse_master.png`,
  "ship-12-poison-acid": `${SHIPS_V2_BASE}/master_art/12_poison_acid_master.png`,
  "ship-13-sniper-railgun": `${SHIPS_V2_BASE}/master_art/13_sniper_railgun_master.png`,
  "ship-14-healing-support": `${SHIPS_V2_BASE}/master_art/14_healing_support_master.png`,
  "ship-15-emp-burst": `${SHIPS_V2_BASE}/master_art/15_emp_burst_master.png`,
  "ship-16-boomerang-blades": `${SHIPS_V2_BASE}/master_art/16_boomerang_blades_master.png`,
  "ship-17-mine-layer": `${SHIPS_V2_BASE}/master_art/17_mine_layer_master.png`,
  "ship-18-orbital-cannons": `${SHIPS_V2_BASE}/master_art/18_orbital_cannons_master.png`,
  "ship-19-berserker-overdrive": `${SHIPS_V2_BASE}/master_art/19_berserker_overdrive_master.png`,
  "ship-20-cosmic-void": `${SHIPS_V2_BASE}/master_art/20_cosmic_void_master.png`,
};

// Historical: previously listed the 6 ships whose master art was deferred
// due to a baked-in checkerboard defect (see
// docs/handoffs/fleet-roster/MASTER_ART_RECOVERY_REPORT.md and
// MANUAL_REPAIR_REPORT.md for the recovery/cleanup/repair history). All 6
// were repaired and promoted into SHIP_MASTER_ART above on 2026-07-18, so
// this list is now empty and getShipMasterArt() no longer has any fallback
// case to serve. Kept (empty) rather than deleted so any remaining
// references to it fail loudly instead of silently, and so the id list is
// still discoverable if a future ship's master art ever needs to be
// deferred again.
export const DEFERRED_MASTER_ART_SHIP_IDS: readonly string[] = [];

/**
 * Resolves a ship's large presentation artwork for Fleet / Ship Detail /
 * Pre-Battle / Loadout. All 20 ships now have real master art in
 * SHIP_MASTER_ART, so this no longer needs to fall back to a gameplay
 * sprite in normal operation — the SHIP_GAMEPLAY_SPRITE fallback is kept
 * only as a defensive guard against a future ship being added to the
 * roster (ships.ts) before its master art exists, so a screen never
 * renders nothing for a valid ship id. Gameplay sprites are otherwise
 * reserved for gameplay only and must not be used as a Fleet/Detail
 * substitute while master art is available.
 */
export function getShipMasterArt(shipId: string): string | undefined {
  return SHIP_MASTER_ART[shipId] ?? SHIP_GAMEPLAY_SPRITE[shipId];
}

// ---------------------------------------------------------------------------
// UI frames — panels, cards, dialogs, feature areas
// ---------------------------------------------------------------------------

// Only 2 of 10 frame files are cleaned and approved so far. Do not add the
// other 8 (bottom_sheet, coming_soon, featured_offer, large_hero_panel,
// list_row, locked_card, reward_card, small_card) until they've been
// cleaned — screens needing one of those in the meantime should fall back
// to the existing NeonPanel / RarityFrame coded styling (see
// INTEGRATION_PLAN.md §4) rather than using the uncleaned source file.
export const UI_FRAME: Partial<Record<"mediumPanel" | "modalDialog", string>> = {
  mediumPanel: `${BASE}/ui/frames/medium_panel_frame.png`,
  modalDialog: `${BASE}/ui/frames/modal_dialog_frame.png`,
};

// ---------------------------------------------------------------------------
// Icon sets
// ---------------------------------------------------------------------------

export const RESOURCE_ICON: Record<
  "energy" | "credits" | "crystals" | "power",
  string
> = {
  energy: `${BASE}/ui/icons/resources/energy_icon.png`,
  credits: `${BASE}/ui/icons/resources/credits_icon.png`,
  crystals: `${BASE}/ui/icons/resources/crystals_icon.png`,
  power: `${BASE}/ui/icons/resources/power_icon.png`,
};

export const STAT_ICON: Record<
  "hp" | "damage" | "fireRate" | "speed" | "defense" | "critChance",
  string
> = {
  hp: `${BASE}/ui/icons/stats/hull_hp_icon.png`,
  damage: `${BASE}/ui/icons/stats/damage_icon.png`,
  fireRate: `${BASE}/ui/icons/stats/fire_rate_icon.png`,
  speed: `${BASE}/ui/icons/stats/speed_icon.png`,
  defense: `${BASE}/ui/icons/stats/defense_icon.png`,
  critChance: `${BASE}/ui/icons/stats/critical_chance_icon.png`,
};

export const ROLE_ICON: Record<"attack" | "support" | "control" | "heavy", string> = {
  attack: `${BASE}/ui/icons/roles/attack_role_icon.png`,
  support: `${BASE}/ui/icons/roles/support_role_icon.png`,
  control: `${BASE}/ui/icons/roles/control_role_icon.png`,
  heavy: `${BASE}/ui/icons/roles/heavy_role_icon.png`,
};

export const SLOT_ICON: Record<"companion" | "core" | "plating" | "system", string> = {
  companion: `${BASE}/ui/icons/slots/companion_slot_icon.png`,
  core: `${BASE}/ui/icons/slots/core_slot_icon.png`,
  plating: `${BASE}/ui/icons/slots/plating_slot_icon.png`,
  system: `${BASE}/ui/icons/slots/system_slot_icon.png`,
};

export const UTILITY_ICON: Record<
  | "missions"
  | "achievements"
  | "inbox"
  | "settings"
  | "leaderboard"
  | "lock"
  | "timer"
  | "upgrade"
  | "warning"
  | "equip"
  | "newItem"
  | "sort"
  | "filter"
  | "compare"
  | "emptySlot",
  string
> = {
  missions: `${BASE}/ui/icons/utility/missions_icon.png`,
  achievements: `${BASE}/ui/icons/utility/achievements_icon.png`,
  inbox: `${BASE}/ui/icons/utility/inbox_icon.png`,
  settings: `${BASE}/ui/icons/utility/settings_icon.png`,
  leaderboard: `${BASE}/ui/icons/utility/leaderboard_icon.png`,
  lock: `${BASE}/ui/icons/utility/lock_icon.png`,
  timer: `${BASE}/ui/icons/utility/timer_icon.png`,
  upgrade: `${BASE}/ui/icons/utility/upgrade_arrow_icon.png`,
  warning: `${BASE}/ui/icons/utility/warning_icon.png`,
  equip: `${BASE}/ui/icons/utility/equip_icon.png`,
  newItem: `${BASE}/ui/icons/utility/new_item_badge.png`,
  sort: `${BASE}/ui/icons/utility/sort_icon.png`,
  filter: `${BASE}/ui/icons/utility/filter_icon.png`,
  compare: `${BASE}/ui/icons/utility/compare_icon.png`,
  emptySlot: `${BASE}/ui/icons/utility/empty_slot_placeholder.png`,
};

// ---------------------------------------------------------------------------
// Mode illustrations (Battle Hub cards)
// ---------------------------------------------------------------------------

export const MODE_ILLUSTRATION: Record<
  "campaign" | "dailyOperations" | "bossRaid" | "training" | "events",
  string
> = {
  campaign: `${BASE}/ui/modes/campaign_illustration.png`,
  dailyOperations: `${BASE}/ui/modes/daily_operations_illustration.png`,
  bossRaid: `${BASE}/ui/modes/boss_raid_illustration.png`,
  training: `${BASE}/ui/modes/training_illustration.png`,
  events: `${BASE}/ui/modes/event_illustration.png`,
};

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

export const REWARD_CHEST: Record<"basic" | "rare" | "epic" | "legendary", string> = {
  basic: `${BASE}/ui/rewards/basic_reward_chest.png`,
  rare: `${BASE}/ui/rewards/rare_reward_chest.png`,
  epic: `${BASE}/ui/rewards/epic_reward_chest.png`,
  legendary: `${BASE}/ui/rewards/legendary_reward_chest.png`,
};

// ---------------------------------------------------------------------------
// Materials — inventory, upgrade costs, mission/shop rewards
// ---------------------------------------------------------------------------

export const MATERIAL_ICON: Record<
  | "abilityCores"
  | "companionData"
  | "eventToken"
  | "moduleParts"
  | "operationPass"
  | "raidTicket"
  | "reviveToken"
  | "shipAlloy"
  | "shipFragment"
  | "universalFragment"
  | "weaponCore",
  string
> = {
  // TEMPORARY DISCLOSED SUBSTITUTION: no dedicated Ability Cores art exists
  // in the asset collection, so the closest approved generic ship-upgrade
  // material icon (Ship Alloy) is reused until real art is delivered. Do
  // not treat this as the final Ability Cores icon.
  abilityCores: `${BASE}/materials/ship_alloy_icon.png`,
  companionData: `${BASE}/materials/companion_data_icon.png`,
  eventToken: `${BASE}/materials/event_token_icon.png`,
  moduleParts: `${BASE}/materials/module_parts_icon.png`,
  operationPass: `${BASE}/materials/operation_pass_icon.png`,
  raidTicket: `${BASE}/materials/raid_ticket_icon.png`,
  reviveToken: `${BASE}/materials/revive_token_icon.png`,
  shipAlloy: `${BASE}/materials/ship_alloy_icon.png`,
  shipFragment: `${BASE}/materials/ship_fragment_icon.png`,
  universalFragment: `${BASE}/materials/universal_fragment_icon.png`,
  weaponCore: `${BASE}/materials/weapon_core_icon.png`,
};

export const WEAPON_PARTS_ICON = "/assets/materials/weapon_parts.png";
export const ARSENAL_WEAPON_ART = {
  pulseBlaster: "/assets/arsenal/weapons/01_pulse_blaster.png",
  homingMissiles: "/assets/arsenal/weapons/02_homing_missiles.png",
  prismBeam: "/assets/arsenal/weapons/03_prism_beam.png",
  railCannon: "/assets/arsenal/weapons/04_rail_cannon.png",
  scatterCannons: "/assets/arsenal/weapons/05_scatter_cannons.png",
  plasmaLance: "/assets/arsenal/weapons/06_plasma_lance.png",
  arcEmitter: "/assets/arsenal/weapons/07_arc_emitter.png",
  novaLauncher: "/assets/arsenal/weapons/08_nova_launcher.png",
  tempestGaussRifle: "/assets/arsenal/weapons/09_tempest_gauss_rifle.png",
  gravityWellLauncher: "/assets/arsenal/weapons/10_gravity_well_launcher.png",
  quantumDisruptor: "/assets/arsenal/weapons/11_quantum_disruptor.png",
  infernoTwinBlasters: "/assets/arsenal/weapons/12_inferno_twin_blasters.png",
} as const;

const WEAPON_ID_TO_ART_KEY: Record<string, keyof typeof ARSENAL_WEAPON_ART> = {
  "weapon-pulse-blaster": "pulseBlaster",
  "weapon-homing-missiles": "homingMissiles",
  "weapon-prism-beam": "prismBeam",
  "weapon-rail-cannon": "railCannon",
  "weapon-scatter-cannons": "scatterCannons",
  "weapon-plasma-lance": "plasmaLance",
  "weapon-arc-emitter": "arcEmitter",
  "weapon-nova-launcher": "novaLauncher",
  "weapon-tempest-gauss-rifle": "tempestGaussRifle",
  "weapon-gravity-well-launcher": "gravityWellLauncher",
  "weapon-quantum-disruptor": "quantumDisruptor",
  "weapon-inferno-twin-blasters": "infernoTwinBlasters",
};

export function getWeaponMasterArt(weaponId: string): string {
  const key = WEAPON_ID_TO_ART_KEY[weaponId];
  return key ? ARSENAL_WEAPON_ART[key] : "";
}

// ---------------------------------------------------------------------------
// Companions — roster, detail, upgrades, loadout, rewards
// ---------------------------------------------------------------------------

export const COMPANION_ART: Record<
  | "assaultDrone"
  | "beamDrone"
  | "missileDrone"
  | "repairDrone"
  | "shieldDrone"
  | "utilityDrone",
  string
> = {
  assaultDrone: `${BASE}/companions/assault_drone.png`,
  beamDrone: `${BASE}/companions/beam_drone.png`,
  missileDrone: `${BASE}/companions/missile_drone.png`,
  repairDrone: `${BASE}/companions/repair_drone.png`,
  shieldDrone: `${BASE}/companions/shield_drone.png`,
  utilityDrone: `${BASE}/companions/utility_drone.png`,
};

// ---------------------------------------------------------------------------
// Modules — inventory, details, upgrades, loadout, rewards, shop
// ---------------------------------------------------------------------------

export const MODULE_ART: Record<
  | "adaptiveThrusters"
  | "calamityCapacitor"
  | "cooldownOptimizer"
  | "criticalScope"
  | "emergencyRepairPlating"
  | "energyShieldMatrix"
  | "magnetRelay"
  | "nanoHullPlating"
  | "overdriveMatrix"
  | "plasmaAmplifier"
  | "reactiveArmor"
  | "targetingArray",
  string
> = {
  adaptiveThrusters: `${BASE}/modules/adaptive_thrusters_module.png`,
  calamityCapacitor: `${BASE}/modules/calamity_capacitor_module.png`,
  cooldownOptimizer: `${BASE}/modules/cooldown_optimizer_module.png`,
  criticalScope: `${BASE}/modules/critical_scope_module.png`,
  emergencyRepairPlating: `${BASE}/modules/emergency_repair_plating_module.png`,
  energyShieldMatrix: `${BASE}/modules/energy_shield_matrix_module.png`,
  magnetRelay: `${BASE}/modules/magnet_relay_module.png`,
  nanoHullPlating: `${BASE}/modules/nano_hull_plating_module.png`,
  overdriveMatrix: `${BASE}/modules/overdrive_matrix_module.png`,
  plasmaAmplifier: `${BASE}/modules/plasma_amplifier_module.png`,
  reactiveArmor: `${BASE}/modules/reactive_armor_module.png`,
  targetingArray: `${BASE}/modules/targeting_array_module.png`,
};

// ---------------------------------------------------------------------------
// Rapid-Fire vertical-slice combat art (installed from
// rapid_fire_cursor_ready_assets.zip — filenames preserved).
// ---------------------------------------------------------------------------

export const RAPID_FIRE_GAMEPLAY_ASSETS = {
  primaryBolt: `${BASE}/gameplay/rapid-fire/rapid_fire_primary_bolt.png`,
  fireUpPickup: `${BASE}/gameplay/rapid-fire/fire_up_pickup.png`,
  enemyBasic: `${BASE}/gameplay/rapid-fire/enemy_basic_fighter.png`,
  enemyShooter: `${BASE}/gameplay/rapid-fire/enemy_shooter.png`,
  enemyPowerCarrier: `${BASE}/gameplay/rapid-fire/enemy_power_carrier.png`,
} as const;
