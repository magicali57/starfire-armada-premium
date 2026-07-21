export type ShipRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export type ShipRole = "Attack" | "Support" | "Control" | "Heavy";

// Damage/utility theme shown as a small icon on the roster card — matches
// the identity icons in docs/references/ships_01_to_20.png.
export type ShipElement =
  | "kinetic"
  | "energy"
  | "homing"
  | "electric"
  | "plasma"
  | "shield"
  | "stealth"
  | "drone"
  | "fire"
  | "ice"
  | "gravity"
  | "poison"
  | "sniper"
  | "healing"
  | "emp"
  | "blade"
  | "explosive"
  | "orbital"
  | "berserker"
  | "void";

// Content availability — distinct from the player's per-ship *ownership*
// (that lives in PlayerState.ownedShipIds / store, not here). All 20 ships
// in the authoritative roster are "released" content in Batch 2; none are
// held back as coming-soon.
export type ShipAvailability = "released" | "coming-soon";

export type ShipUnlockType = "default" | "player-level" | "campaign-stage" | "currency";

export interface ShipStatBlock {
  hp: number;
  damage: number;
  fireRate: number;
  speed: number;
  defense: number;
  critRate: number;
}

export interface WeaponLevelDefinition {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  projectileCount: number;
  damageMultiplier: number;
}

export interface ShipArtwork {
  /** Single-glyph temporary art slot (emoji/unicode icon) shown until real sprites exist. */
  icon: string;
  /** Optional path to a real asset; left undefined intentionally in Batch 2 — see docs/audit. */
  hangarSprite?: string;
  rosterIcon?: string;
}

export interface ShipDefinition {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  role: ShipRole;
  element: ShipElement;
  rarity: ShipRarity;
  themeColor: string;
  accentColor: string;
  baseStats: ShipStatBlock;
  statGrowth: ShipStatBlock;
  passiveName: string;
  passiveDescription: string;
  calamityName: string;
  calamityDescription: string;
  unlockType: ShipUnlockType;
  unlockRequirement: string;
  defaultUnlocked: boolean;
  artwork: ShipArtwork;
  availability: ShipAvailability;
  /** Ships 2-20 use placeholder balance numbers pending real design pass. */
  provisionalBalance: boolean;
  tag?: "new" | "featured";
  weaponLevels: WeaponLevelDefinition[];
}

export interface ShipProgress {
  shipId: string;
  level: number;
  xp: number;
  stars: number;
  weaponLevel: WeaponLevelDefinition["level"];
  equippedSkinId: string | null;
}
