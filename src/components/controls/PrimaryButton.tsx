import type { ButtonHTMLAttributes } from "react";
import "./Buttons.css";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export function PrimaryButton({ fullWidth, className, ...rest }: PrimaryButtonProps) {
  const classes = ["btn", "btn--primary", "press-scale"];
  if (fullWidth) classes.push("btn--full");
  if (className) classes.push(className);
  return <button type="button" className={classes.join(" ")} {...rest} />;
}
