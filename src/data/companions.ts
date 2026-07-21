import type { CompanionDefinition } from "@/types";

// Typed companion definitions for the Loadout Manager (10_Loadout_Manager.png)
// and any future Companion Roster/Detail screens. Uses the project's six
// existing registered companion art assets (COMPANION_ART in
// data/assetRegistry.ts) — no new artwork, no hard-coded paths.
//
// PROTOTYPE DATA NOTICE: `basePower` and `statContributions` are provisional
// balance numbers (same status as ships.ts's `provisionalBalance` ships) —
// there is no real companion design pass yet. Four values below
// (repairDrone's basePower/health/energyRegen, and the matching fields on
// overdriveMatrix/reactiveArmor/calamityCapacitor in modules.ts) are
// precisely back-solved so the reference-matched default loadout (see
// data/player.ts) reproduces 10_Loadout_Manager.png's own Companion Power
// (1,980), Core/Plating/System Power (2,640 / 2,360 / 1,880), and Loadout
// Stat Contribution totals (Attack +3,450, Health +16,400, Critical Rate
// +18.0%, Critical Damage +42.0%, Armor +2,150, Energy Regen +12.0%)
// exactly, using the shared scaling formula in data/loadout.ts
// (`scaleByLevelAndRarity`: base * (1 + level * 0.01) * rarity multiplier).
// Repair Drone was recalibrated in the Companion Upgrade phase: its old
// Level-60 fixture is now Level 8, while its Power (1,980) and existing
// loadout stat contribution remain unchanged through adjusted base values.
// Every other companion/module's numbers are reasonable estimates in the
// same formula, not calibrated against any reference value.
export const COMPANIONS: CompanionDefinition[] = [
  {
    id: "companion-assault-drone",
    name: "Assault Drone",
    rarity: "rare",
    role: "Attack Support",
    description: "A forward-deployed combat drone that adds sustained offensive fire.",
    artKey: "assaultDrone",
    basePower: 300,
    statContributions: { attack: 250, health: 0, criticalRate: 1.2, criticalDamage: 0, armor: 0, energyRegen: 0 },
  },
  {
    id: "companion-beam-drone",
    name: "Beam Drone",
    rarity: "epic",
    role: "Attack Support",
    description: "Fires a continuous focused beam, amplifying critical strike damage.",
    artKey: "beamDrone",
    basePower: 480,
    statContributions: { attack: 400, health: 0, criticalRate: 0, criticalDamage: 2.5, armor: 0, energyRegen: 0 },
  },
  {
    id: "companion-missile-drone",
    name: "Missile Drone",
    rarity: "epic",
    role: "Attack Support",
    description: "Launches homing micro-missiles alongside the ship's own weapons.",
    artKey: "missileDrone",
    basePower: 460,
    statContributions: { attack: 380, health: 0, criticalRate: 1.8, criticalDamage: 0, armor: 0, energyRegen: 0 },
  },
  {
    id: "companion-repair-drone",
    name: "Repair Drone",
    rarity: "epic",
    role: "Support",
    description: "Continuously repairs hull integrity and stabilizes ship systems mid-battle.",
    artKey: "repairDrone",
    // Calibrated — see file header. base * (1 + 8*0.01) * 1.5 = 1,980.
    basePower: 1222.222222,
    statContributions: {
      attack: 0,
      health: 5555.555556,
      criticalRate: 0,
      criticalDamage: 0,
      armor: 0,
      energyRegen: 4.320987654,
    },
  },
  {
    id: "companion-shield-drone",
    name: "Shield Drone",
    rarity: "legendary",
    role: "Defense Support",
    description: "Projects a supplementary deflector field that reinforces the ship's armor.",
    artKey: "shieldDrone",
    basePower: 560,
    statContributions: { attack: 0, health: 300, criticalRate: 0, criticalDamage: 0, armor: 420, energyRegen: 0 },
  },
  {
    id: "companion-utility-drone",
    name: "Utility Drone",
    rarity: "rare",
    role: "Utility Support",
    description: "Optimizes onboard systems for faster energy recovery and targeting.",
    artKey: "utilityDrone",
    basePower: 280,
    statContributions: { attack: 0, health: 0, criticalRate: 0.8, criticalDamage: 0, armor: 0, energyRegen: 2.0 },
  },
];

export function getCompanionById(id: string): CompanionDefinition | undefined {
  return COMPANIONS.find((c) => c.id === id);
}

export function getCompanionArtKey(id: string): string | undefined {
  return getCompanionById(id)?.artKey;
}
