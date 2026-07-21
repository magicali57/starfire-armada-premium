import type { ReactNode } from "react";
import "./HubScreenShell.css";

interface HubScreenShellProps {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}

/**
 * The standard outer shell for every non-Home hub screen (Battle first;
 * Fleet/Inventory/Shop to follow). This is not a derived approximation of
 * Home's layout — it is Home's own outer grid recipe, reproduced verbatim:
 * `height: 100dvh`, the same `min-height` floor, and the same 5-row
 * `grid-template-rows` string (`--hub-shell-rows` / `--hub-shell-min-height`
 * in tokens.css) that `HomeScreen.tsx`'s `.home-final` uses. Because both
 * screens run the identical CSS Grid track-sizing algorithm against the
 * same viewport, the header (row 1) and footer (row 5) land in exactly the
 * same box Home's own topbar/bottom-nav occupy — not an approximation of
 * it, the same computed pixels.
 *
 * Home's middle three rows (hero / actions / missions, 49.1% + 13.4% +
 * 22.1% = 84.6% combined) collapse into a single scrollable row here, since
 * hub screens don't share Home's fixed three-section body — `children` is
 * rendered inside that scrollable row, with its scrollbar hidden (but
 * scrolling still fully functional) via `scrollbar-width: none` /
 * `::-webkit-scrollbar { display: none }`.
 *
 * `header` and `footer` are rendered as plain siblings (row 1 and row 5 of
 * the grid) rather than baked into this component, so `HubHeader` and
 * `HubBottomNav` stay reusable on their own. Home itself is never touched
 * or refactored to produce this — it's a parallel implementation of the
 * same recipe, not an extraction of Home's private markup.
 */
export function HubScreenShell({ header, footer, children }: HubScreenShellProps) {
  return (
    <div className="hub-screen-shell">
      {header}
      <div className="hub-screen-shell__scroll">{children}</div>
      {footer}
    </div>
  );
}
