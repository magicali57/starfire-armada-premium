import type { RandomSource } from "@/types";

// The ONE randomness abstraction the reward system uses. Nothing in
// resolve/apply calls Math.random directly — production code injects
// productionRandomSource; focused verification injects a deterministic
// source. Not cryptographic by design; no seeds are persisted.

export const productionRandomSource: RandomSource = {
  next: () => Math.random(),
};

/** Deterministic source cycling a fixed list of [0,1) values — for
 *  verification only. */
export function createFixedRandomSource(values: number[]): RandomSource {
  let i = 0;
  return {
    next: () => {
      const value = values[i % values.length] ?? 0;
      i += 1;
      return Math.min(0.999999, Math.max(0, value));
    },
  };
}

/** Tiny seeded LCG for repeatable-but-varied verification runs. */
export function createSeededRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 4294967296;
    },
  };
}
