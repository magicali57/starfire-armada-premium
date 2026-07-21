import type { ReactNode } from "react";
import "./ScreenHeader.css";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}

export function ScreenHeader({ title, subtitle, trailing }: ScreenHeaderProps) {
  return (
    <div className="screen-header">
      <div>
        <h1 className="screen-header__title neon-text-primary">{title}</h1>
        {subtitle ? <p className="screen-header__subtitle">{subtitle}</p> : null}
      </div>
      {trailing ? <div className="screen-header__trailing">{trailing}</div> : null}
    </div>
  );
}
