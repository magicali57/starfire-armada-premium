import type { HTMLAttributes, ReactNode } from "react";
import "./NeonPanel.css";

interface NeonPanelProps extends HTMLAttributes<HTMLDivElement> {
  tone?: "primary" | "secondary" | "gold" | "neutral";
  children: ReactNode;
}

export function NeonPanel({ tone = "neutral", className, children, ...rest }: NeonPanelProps) {
  const classes = ["neon-panel", `neon-panel--${tone}`, "glass-panel"];
  if (className) classes.push(className);
  return (
    <div className={classes.join(" ")} {...rest}>
      {children}
    </div>
  );
}
