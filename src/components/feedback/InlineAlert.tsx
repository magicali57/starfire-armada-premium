import { useEffect } from "react";
import "./InlineAlert.css";

interface InlineAlertProps {
  tone: "success" | "danger";
  message: string;
  onDismiss?: () => void;
  autoDismissMs?: number;
}

/** Small transient banner for "upgrade succeeded" / "not enough coins"
 *  style feedback. Reused wherever a screen needs a one-line result message. */
export function InlineAlert({ tone, message, onDismiss, autoDismissMs = 3200 }: InlineAlertProps) {
  useEffect(() => {
    if (!onDismiss) return;
    const timer = window.setTimeout(onDismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [onDismiss, autoDismissMs]);

  return (
    <div className={`inline-alert inline-alert--${tone}`} role="status" aria-live="polite">
      <span className="inline-alert__icon" aria-hidden="true">
        {tone === "success" ? "✓" : "!"}
      </span>
      <span>{message}</span>
    </div>
  );
}
