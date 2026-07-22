import { Children, cloneElement, isValidElement, type CSSProperties, type ReactNode } from "react";

interface MotionStaggerGroupProps {
  children: ReactNode;
}

/**
 * Wraps a short, fixed list of sibling elements (e.g. Player Profile's
 * account-overview cards) and gives each one a bounded entrance stagger —
 * purely presentational: it adds `--motion-index`/`.motion-stagger-item`
 * to each child (see `styles/motion.css`) and changes nothing else about
 * them. Not meant for long/dynamic reward-row lists (those already set
 * their own `--reveal-index` per row directly); this is for a handful of
 * screen-level cards/sections.
 */
export function MotionStaggerGroup({ children }: MotionStaggerGroupProps) {
  return (
    <>
      {Children.toArray(children).map((child, index) => {
        if (!isValidElement<{ className?: string; style?: CSSProperties }>(child)) return child;
        const style: CSSProperties = { ...(child.props.style ?? {}), ["--motion-index" as string]: index };
        const className = [child.props.className, "motion-stagger-item"].filter(Boolean).join(" ");
        return cloneElement(child, { key: child.key ?? index, style, className });
      })}
    </>
  );
}
