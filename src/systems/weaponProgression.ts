import type { PlayerState, WeaponDefinition } from "@/types";
export const getWeaponLevel=(player:PlayerState,id:string)=>player.weaponProgress[id]?.level??1;
export const getWeaponPower=(weapon:WeaponDefinition,level:number)=>Math.max(1,Math.round(weapon.anchorPower+(level-weapon.anchorLevel)*weapon.powerPerLevel));
export const getWeaponStatValue=(weapon:WeaponDefinition,stat:WeaponDefinition["stats"][number],level:number)=>stat.anchorValue+(level-weapon.anchorLevel)*stat.perLevel+(stat.milestoneChanges??[]).filter(c=>level>=c.level).reduce((sum,c)=>sum+c.delta,0);
export const formatWeaponStat=(stat:WeaponDefinition["stats"][number],value:number)=>`${value.toFixed(stat.decimals)}${stat.suffix}`;
export const getWeaponUpgradeCost=(weapon:WeaponDefinition,level:number)=>{const m={uncommon:1,rare:1.2,epic:1.5,legendary:2}[weapon.rarity];return{credits:Math.round(((2000+level*143)*m)/500)*500,weaponParts:Math.round((4+level*.1715)*m)}};
export const buildWeaponView=(weapon:WeaponDefinition,player:PlayerState)=>{const level=getWeaponLevel(player,weapon.id);const owned=player.ownedWeaponIds.includes(weapon.id);return{...weapon,level,power:getWeaponPower(weapon,level),owned,equipped:player.equippedWeaponId===weapon.id,upgradeReady:owned&&level<weapon.maxLevel}};
