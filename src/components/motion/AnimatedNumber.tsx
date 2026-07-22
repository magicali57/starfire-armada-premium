import { useEffect, useRef, useState } from "react";
import { computeAnimatedValue, toFiniteNumber } from "./motionMath";

interface AnimatedNumberProps {
  /** The canonical target value — this component only ever DISPLAYS it,
   *  never derives, rounds-for-storage, or feeds it back anywhere. */
  value: number;
  prefix?: string;
  suffix?: string;
  /** Defaults to `Math.round(n).toLocaleString()`. */
  formatter?: (rounded: number) => string;
  /** Capped animation length regardless of magnitude — never runs
   *  indefinitely. Default matches `--motion-duration-reveal`. */
  durationMs?: number;
  className?: string;
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
const prefersReducedMotion = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(reducedMotionQuery).matches
    : false;

/**
 * Presentation-only count-up. Animates the DISPLAYED text from the
 * previously-shown value to `value` using `requestAnimationFrame` and an
 * ease-out curve (see `./motionMath.ts` for the pure interpolation logic,
 * unit-tested separately); never touches PlayerState or any store — it is
 * purely a local, uncontrolled render detail. Renders the final value
 * immediately (no interpolation) under `prefers-reduced-motion: reduce`,
 * on first mount is always instant (nothing to count up from yet), and
 * always lands exactly on the real target value even if the animation is
 * interrupted by a fast subsequent value change or unmount.
 */
export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  formatter,
  durationMs = 480,
  className,
}: AnimatedNumberProps) {
  const target = toFiniteNumber(value);
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    const cancel = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    cancel();

    const from = displayRef.current;
    const firstMount = !mountedRef.current;
    mountedRef.current = true;

    // Instant on first mount (nothing to count from), on a no-op update,
    // and whenever the user prefers reduced motion.
    if (firstMount || from === target || prefersReducedMotion()) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const current = computeAnimatedValue(from, target, now - start, durationMs);
      displayRef.current = current;
      setDisplay(current);
      if (current !== target) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    return cancel;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  // Cancel cleanly on unmount even mid-animation.
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const rounded = toFiniteNumber(Math.round(display));
  const text = formatter ? formatter(rounded) : rounded.toLocaleString();

  return (
    <span className={className}>
      {prefix}
      {text}
      {suffix}
    </span>
  );
}
