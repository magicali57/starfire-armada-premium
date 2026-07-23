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

/**
 * Durability rebalance (mobile playtest correction pass): the prior HP
 * values let a basic fighter die in ~1-2 hits at Firepower 0, which read as
 * "paper cutouts" rather than real targets. Roughly 3x (basic/shooter) and
 * 5x (Power Carrier) increases so enemies survive multiple volleys — basic
 * still dies fastest, shooters noticeably tougher, carriers the toughest —
 * while staying killable within a formation's own hold window.
 */
export const ENEMY_DEFS: Record<EnemyKind, EnemyDefinition> = {
  basic: {
    kind: "basic",
    hull: 130,
    radius: 18,
    drawWidth: 46,
    drawHeight: 54,
    speedY: 78,
    contactDamage: 28,
    scoreValue: 100,
  },
  shooter: {
    kind: "shooter",
    hull: 300,
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
    hull: 550,
    radius: 24,
    drawWidth: 58,
    drawHeight: 64,
    speedY: 52,
    contactDamage: 40,
    scoreValue: 350,
  },
};
