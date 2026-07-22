export type EnemyKind = "basic" | "shooter" | "powerCarrier";

export interface EnemyDefinition {
  kind: EnemyKind;
  hull: number;
  radius: number;
  drawWidth: number;
  drawHeight: number;
  speedY: number;
  contactDamage: number;
  /** Shooter-only. */
  shootIntervalMs?: number;
  shotSpeed?: number;
  shotDamage?: number;
  scoreValue: number;
}

export const ENEMY_DEFS: Record<EnemyKind, EnemyDefinition> = {
  basic: {
    kind: "basic",
    hull: 45,
    radius: 18,
    drawWidth: 46,
    drawHeight: 54,
    speedY: 78,
    contactDamage: 28,
    scoreValue: 100,
  },
  shooter: {
    kind: "shooter",
    hull: 90,
    radius: 22,
    drawWidth: 52,
    drawHeight: 60,
    speedY: 36,
    contactDamage: 36,
    shootIntervalMs: 1400,
    shotSpeed: 190,
    shotDamage: 22,
    scoreValue: 220,
  },
  powerCarrier: {
    kind: "powerCarrier",
    hull: 110,
    radius: 24,
    drawWidth: 58,
    drawHeight: 64,
    speedY: 52,
    contactDamage: 40,
    scoreValue: 350,
  },
};
