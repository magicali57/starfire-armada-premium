import type { ButtonHTMLAttributes, ReactNode } from "react";
import "./Buttons.css";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  label: string;
}

export function IconButton({ icon, label, className, ...rest }: IconButtonProps) {
  const classes = ["btn", "btn--icon", "press-scale"];
  if (className) classes.push(className);
  return (
    <button type="button" className={classes.join(" ")} aria-label={label} {...rest}>
      {icon}
    </button>
  );
}
