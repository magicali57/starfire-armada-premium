// Pure, presentation-only math shared by AnimatedNumber/ProgressFill (and
// directly unit-testable under plain Node — see
// scripts/verification/uiMotionFoundationVerification.ts — unlike the
// .tsx components themselves, which contain JSX). Never reads or writes
// PlayerState; every function here is a total function of its inputs.

/** Any non-finite input (NaN, +/-Infinity, or anything else that slipped
 *  through) safely becomes 0 — never propagates NaN/Infinity into a
 *  render. */
export function toFiniteNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/** Clamps to the 0-100 percentage range every progress display uses,
 *  after first guarding against non-finite input. */
export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, toFiniteNumber(value)));
}

/** Standard ease-out cubic — used for the count-up interpolation. */
export function easeOutCubic(t: number): number {
  const clampedT = Math.min(1, Math.max(0, t));
  return 1 - Math.pow(1 - clampedT, 3);
}

/**
 * The exact interpolation AnimatedNumber renders each animation frame:
 * given a start value, a target value, elapsed time, and a total
 * duration, returns the current displayed value — always finite, always
 * exactly `to` once `elapsedMs >= durationMs`, and safe against a
 * zero/negative duration (treated as "already complete").
 */
export function computeAnimatedValue(from: number, to: number, elapsedMs: number, durationMs: number): number {
  const safeFrom = toFiniteNumber(from);
  const safeTo = toFiniteNumber(to);
  const safeDuration = Math.max(1, toFiniteNumber(durationMs));
  const t = Math.min(1, Math.max(0, toFiniteNumber(elapsedMs) / safeDuration));
  if (t >= 1) return safeTo;
  return safeFrom + (safeTo - safeFrom) * easeOutCubic(t);
}

/** The same bound the CSS stagger classes apply via `min(var(--motion-
 *  index), 8)` — exported so the bound itself is unit-testable without a
 *  browser/CSS engine, and so a future JS-driven stagger could reuse the
 *  identical rule instead of re-deriving it. */
export const MOTION_STAGGER_MAX_STEPS = 8;

export function boundedStaggerIndex(index: number): number {
  const safeIndex = Math.max(0, Math.trunc(toFiniteNumber(index)));
  return Math.min(MOTION_STAGGER_MAX_STEPS, safeIndex);
}
