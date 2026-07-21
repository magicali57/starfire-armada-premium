import type { ButtonHTMLAttributes } from "react";
import "./Buttons.css";

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
}

export function SecondaryButton({ fullWidth, className, ...rest }: SecondaryButtonProps) {
  const classes = ["btn", "btn--secondary", "press-scale"];
  if (fullWidth) classes.push("btn--full");
  if (className) classes.push(className);
  return <button type="button" className={classes.join(" ")} {...rest} />;
}
