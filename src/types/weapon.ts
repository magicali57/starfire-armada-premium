export type WeaponClass = "laser" | "missile" | "beam" | "kinetic" | "energy";
export type WeaponRarity = "uncommon" | "rare" | "epic" | "legendary";
export interface WeaponProgress { level: number; }
export interface WeaponDetailField { label: string; value: string; }
export type WeaponStatDirection = "higherIsBetter" | "lowerIsBetter" | "milestoneOnly";
export interface WeaponStatDefinition { id:string; label:string; anchorValue:number; perLevel:number; suffix:string; decimals:number; direction:WeaponStatDirection; milestoneChanges?:Array<{level:number;delta:number}>; }
export interface WeaponPairing { shipId:string; bonus:string; description:string; }
export interface WeaponMilestone { level:number; title:string; bonus:string; }
export interface WeaponDefinition {
  id:string; name:string; weaponClass:WeaponClass; rarity:WeaponRarity; description:string; artKey:string;
  maxLevel:number; anchorLevel:number; anchorPower:number; powerPerLevel:number;
  configuration:WeaponDetailField[]; stats:WeaponStatDefinition[]; pairing:WeaponPairing; milestones:WeaponMilestone[]; unlockCondition?:string;
}
