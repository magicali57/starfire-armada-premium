import type { ModuleDefinition, ModuleSlot } from "@/types";

// Typed module definitions for the Loadout Manager (10_Loadout_Manager.png).
// Uses the project's twelve existing registered module art assets
// (MODULE_ART in data/assetRegistry.ts) — no new artwork, no hard-coded
// paths.
//
// Slot assignment: the reference only pictures three modules directly
// (Overdrive Matrix = Core, Reactive Armor = Plating, Calamity Capacitor =
// System — reproduced exactly below). The other 9 modules' slots are not
// shown in the reference and are assigned here by name/theme (Core =
// offense/amplifier-themed, Plating = armor/repair/shield-themed, System =
// utility/targeting/thruster-themed), split 4/4/4. This is an independent,
// disclosed assignment — it does not need to (and does not) match
// PreBattleScreen.tsx's own unrelated MODULE_ART_BY_SLOT substitution,
// which was a different, already-disclosed art-only stand-in for that
// screen's un-implemented per-stage module data.
//
// PROTOTYPE DATA NOTICE — see companions.ts's file header for the full
// explanation of the calibrated-vs-estimated `basePower`/`statContributions`
// split. overdriveMatrix, reactiveArmor, and calamityCapacitor below are
// precisely calibrated to reproduce the reference's default-loadout Power
// and stat-contribution totals; every other module's numbers are reasonable
// estimates only.
export const MODULES: ModuleDefinition[] = [
  // --- Core (4) ---
  {
    id: "module-overdrive-matrix",
    name: "Overdrive Matrix",
    slot: "core",
    rarity: "epic",
    description: "Redirects reserve power into the weapon core, boosting attack output and burst damage.",
    artKey: "overdriveMatrix",
    // Calibrated — base * (1 + 80*0.01) * 1.5 = base * 2.7
    basePower: 977.777778,
    statContributions: {
      attack: 888.888889,
      health: 0,
      criticalRate: 2.962963,
      criticalDamage: 15.555556,
      armor: 0,
      energyRegen: 0,
    },
  },
  {
    id: "module-plasma-amplifier",
    name: "Plasma Amplifier",
    slot: "core",
    rarity: "legendary",
    description: "Superheats plasma charge before firing, sharply increasing critical damage output.",
    artKey: "plasmaAmplifier",
    basePower: 620,
    statContributions: { attack: 520, health: 0, criticalRate: 0, criticalDamage: 4.0, armor: 0, energyRegen: 0 },
  },
  {
    id: "module-critical-scope",
    name: "Critical Scope",
    slot: "core",
    rarity: "rare",
    description: "A precision targeting overlay that improves critical hit consistency.",
    artKey: "criticalScope",
    basePower: 260,
    statContributions: { attack: 0, health: 0, criticalRate: 2.5, criticalDamage: 3.0, armor: 0, energyRegen: 0 },
  },
  {
    id: "module-magnet-relay",
    name: "Magnet Relay",
    slot: "core",
    rarity: "rare",
    description: "Channels magnetic drive output into the weapon core for a modest attack boost.",
    artKey: "magnetRelay",
    basePower: 240,
    statContributions: { attack: 150, health: 0, criticalRate: 0, criticalDamage: 0, armor: 0, energyRegen: 0.8 },
  },

  // --- Plating (4) ---
  {
    id: "module-reactive-armor",
    name: "Reactive Armor",
    slot: "plating",
    rarity: "epic",
    description: "Hull plating that hardens on impact, reinforcing both armor and structural integrity.",
    artKey: "reactiveArmor",
    // Calibrated — base * (1 + 80*0.01) * 1.5 = base * 2.7
    basePower: 874.074074,
    statContributions: {
      attack: 0,
      health: 2740.740741,
      criticalRate: 0,
      criticalDamage: 0,
      armor: 796.296296,
      energyRegen: 0,
    },
  },
  {
    id: "module-nano-hull-plating",
    name: "Nano Hull Plating",
    slot: "plating",
    rarity: "epic",
    description: "Self-repairing nano-layer plating that steadily reinforces hull integrity.",
    artKey: "nanoHullPlating",
    basePower: 440,
    statContributions: { attack: 0, health: 900, criticalRate: 0, criticalDamage: 0, armor: 250, energyRegen: 0 },
  },
  {
    id: "module-emergency-repair-plating",
    name: "Emergency Repair Plating",
    slot: "plating",
    rarity: "rare",
    description: "Automated field-repair layer that restores hull integrity and stabilizes power draw.",
    artKey: "emergencyRepairPlating",
    basePower: 270,
    statContributions: { attack: 0, health: 600, criticalRate: 0, criticalDamage: 0, armor: 0, energyRegen: 0.5 },
  },
  {
    id: "module-energy-shield-matrix",
    name: "Energy Shield Matrix",
    slot: "plating",
    rarity: "epic",
    description: "A layered energy barrier that absorbs incoming damage before it reaches the hull.",
    artKey: "energyShieldMatrix",
    basePower: 430,
    statContributions: { attack: 0, health: 400, criticalRate: 0, criticalDamage: 0, armor: 380, energyRegen: 0 },
  },

  // --- System (4) ---
  {
    id: "module-calamity-capacitor",
    name: "Calamity Capacitor",
    slot: "system",
    rarity: "epic",
    description: "Stores and releases a burst charge that empowers the ship's calamity ability.",
    artKey: "calamityCapacitor",
    // Calibrated — base * (1 + 80*0.01) * 1.5 = base * 2.7
    basePower: 696.296296,
    statContributions: {
      attack: 388.888889,
      health: 0,
      criticalRate: 3.703704,
      criticalDamage: 0,
      armor: 0,
      energyRegen: 1.851852,
    },
  },
  {
    id: "module-cooldown-optimizer",
    name: "Cooldown Optimizer",
    slot: "system",
    rarity: "rare",
    description: "Streamlines ability cooldown cycles, improving energy recovery and crit uptime.",
    artKey: "cooldownOptimizer",
    basePower: 250,
    statContributions: { attack: 0, health: 0, criticalRate: 0.6, criticalDamage: 0, armor: 0, energyRegen: 1.5 },
  },
  {
    id: "module-targeting-array",
    name: "Targeting Array",
    slot: "system",
    rarity: "common",
    description: "A basic auxiliary sensor suite that improves critical strike targeting.",
    artKey: "targetingArray",
    basePower: 150,
    statContributions: { attack: 0, health: 0, criticalRate: 1.0, criticalDamage: 0, armor: 0, energyRegen: 0 },
  },
  {
    id: "module-adaptive-thrusters",
    name: "Adaptive Thrusters",
    slot: "system",
    rarity: "common",
    description: "Self-tuning thrusters that reduce power draw, freeing energy for other systems.",
    artKey: "adaptiveThrusters",
    basePower: 140,
    statContributions: { attack: 0, health: 0, criticalRate: 0, criticalDamage: 0, armor: 0, energyRegen: 1.0 },
  },
];

export function getModuleById(id: string): ModuleDefinition | undefined {
  return MODULES.find((m) => m.id === id);
}

export function getModulesBySlot(slot: ModuleSlot): ModuleDefinition[] {
  return MODULES.filter((m) => m.slot === slot);
}

export function getModuleArtKey(id: string): string | undefined {
  return getModuleById(id)?.artKey;
}
