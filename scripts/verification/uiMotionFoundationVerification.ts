import assert from "node:assert/strict";
import {
  boundedStaggerIndex,
  clampPercent,
  computeAnimatedValue,
  easeOutCubic,
  MOTION_STAGGER_MAX_STEPS,
  toFiniteNumber,
} from "../../src/components/motion/motionMath";

// Focused verification for the shared UI motion foundation's pure math
// (src/components/motion/motionMath.ts) — the exact logic AnimatedNumber
// and ProgressFill render every frame. The components themselves
// (AnimatedNumber.tsx/ProgressFill.tsx/MotionStaggerGroup.tsx — all .tsx/
// JSX, and AnimatedNumber additionally depends on requestAnimationFrame/
// matchMedia, which don't exist under plain Node) cannot load under this
// sandbox's plain `node --experimental-strip-types` runner — same
// disclosed limitation as every prior handoff. Their JSX wiring
// (unmount-cancels-animation, reduced-motion branch, prop plumbing into
// Profile/Results/Level-Up/Reward Reveal) was verified by static code
// review — see COMPLETION_REPORT.md.

let assertions = 0;
function equal<T>(actual: T, expected: T, message: string) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function check(value: unknown, message: string): asserts value {
  assert.ok(value, message);
  assertions += 1;
}

// ---------------------------------------------------------------------------
// toFiniteNumber — never lets NaN/Infinity escape.
// ---------------------------------------------------------------------------
equal(toFiniteNumber(42), 42, "a normal finite number passes through unchanged");
equal(toFiniteNumber(0), 0, "zero passes through unchanged");
equal(toFiniteNumber(-7), -7, "a negative finite number passes through unchanged");
equal(toFiniteNumber(NaN), 0, "NaN safely becomes 0");
equal(toFiniteNumber(Infinity), 0, "+Infinity safely becomes 0");
equal(toFiniteNumber(-Infinity), 0, "-Infinity safely becomes 0");

// ---------------------------------------------------------------------------
// clampPercent — ProgressFill's exact guard: always finite, always 0-100.
// ---------------------------------------------------------------------------
equal(clampPercent(50), 50, "a normal in-range percent passes through");
equal(clampPercent(0), 0, "0% clamps to 0");
equal(clampPercent(100), 100, "100% clamps to 100");
equal(clampPercent(150), 100, "over 100% clamps down to 100");
equal(clampPercent(-30), 0, "a negative percent clamps up to 0");
equal(clampPercent(NaN), 0, "NaN percent clamps safely to 0, never NaN");
// Non-finite input is treated as invalid (falls back to 0, same as
// toFiniteNumber) rather than being clamped as if it were a real large
// number — either way the result is always a finite, safe 0-100 value.
equal(clampPercent(Infinity), 0, "+Infinity percent is treated as invalid and safely renders as 0, never Infinity/NaN");
equal(clampPercent(-Infinity), 0, "-Infinity percent is treated as invalid and safely renders as 0");

// ---------------------------------------------------------------------------
// easeOutCubic — bounded to [0,1] output for [0,1] input, monotonic.
// ---------------------------------------------------------------------------
equal(easeOutCubic(0), 0, "ease-out at t=0 is 0");
equal(easeOutCubic(1), 1, "ease-out at t=1 is 1");
check(easeOutCubic(0.5) > 0 && easeOutCubic(0.5) < 1, "ease-out at t=0.5 is strictly between 0 and 1");
check(easeOutCubic(0.9) > easeOutCubic(0.1), "ease-out is monotonically increasing");

// ---------------------------------------------------------------------------
// computeAnimatedValue — AnimatedNumber's per-frame interpolation.
// ---------------------------------------------------------------------------
{
  // Reaches the correct final value once elapsed >= duration.
  equal(computeAnimatedValue(0, 1000, 480, 480), 1000, "at elapsed==duration, the value is exactly the target");
  equal(computeAnimatedValue(0, 1000, 999999, 480), 1000, "well past duration, the value is still exactly the target (never overshoots)");

  // Zero target value.
  equal(computeAnimatedValue(500, 0, 480, 480), 0, "animating down to a target of 0 lands exactly on 0");
  equal(computeAnimatedValue(0, 0, 240, 480), 0, "animating with a target of 0 throughout stays exactly 0");

  // Changed target mid-flight is just a new (from, to) pair — verify the
  // midpoint is between the two bounds, never outside them or fabricated.
  const mid = computeAnimatedValue(100, 300, 240, 480); // t=0.5
  check(mid > 100 && mid < 300, "a changed target's in-flight value stays strictly between the new from/to bounds");

  // Invalid numeric inputs handled safely — never NaN/Infinity, never throws.
  equal(computeAnimatedValue(NaN, 100, 240, 480) >= 0, true, "a NaN 'from' is treated as 0, never propagates NaN");
  check(Number.isFinite(computeAnimatedValue(Infinity, 100, 240, 480)), "an Infinity 'from' never produces a non-finite result");
  check(Number.isFinite(computeAnimatedValue(0, Infinity, 240, 480)), "an Infinity 'to' never produces a non-finite result");
  equal(computeAnimatedValue(0, 100, 240, 0), 100, "a zero duration is treated as already-complete (lands on target, no divide-by-zero NaN)");
  equal(computeAnimatedValue(0, 100, 240, -50), 100, "a negative duration is treated as already-complete, never throws");
  check(Number.isFinite(computeAnimatedValue(0, 100, NaN, 480)), "NaN elapsed time never produces a non-finite result");

  // Negative target/from values render safely (no special-case blow-up).
  equal(computeAnimatedValue(-50, -10, 480, 480), -10, "a negative target is reached exactly, same as a positive one");
}

// ---------------------------------------------------------------------------
// boundedStaggerIndex — the same bound the CSS `min(var(--motion-index), 8)`
// rule applies, so a long list can never generate an extremely long wait.
// ---------------------------------------------------------------------------
equal(boundedStaggerIndex(0), 0, "index 0 is unbounded (no delay)");
equal(boundedStaggerIndex(3), 3, "an in-range index passes through unchanged");
equal(boundedStaggerIndex(MOTION_STAGGER_MAX_STEPS), MOTION_STAGGER_MAX_STEPS, "exactly the max step is unchanged");
equal(boundedStaggerIndex(9), MOTION_STAGGER_MAX_STEPS, "one past the max step is clamped down to the max");
equal(boundedStaggerIndex(500), MOTION_STAGGER_MAX_STEPS, "a huge index (a very long reward list) is clamped to the same max — bounded total wait");
equal(boundedStaggerIndex(-4), 0, "a negative index never produces a negative (backwards) delay");
equal(boundedStaggerIndex(NaN), 0, "a NaN index safely clamps to 0");

console.log(`UI motion foundation verification passed: ${assertions} assertions.`);
