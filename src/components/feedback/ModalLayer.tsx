import { useEffect, useRef, type ReactNode } from "react";
import "./ModalLayer.css";

interface ModalLayerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function ModalLayer({ open, title, onClose, children }: ModalLayerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const getFocusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    queueMicrotask(() => (getFocusable()[0] ?? panel)?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "Tab") {
        const focusable = getFocusable();
        if (focusable.length === 0) {
          event.preventDefault();
          panel?.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-layer" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-layer__backdrop" onClick={onClose} />
      <div ref={panelRef} className="modal-layer__panel glass-panel" tabIndex={-1}>
        <div className="modal-layer__header">
          <h2 className="modal-layer__title">{title}</h2>
          <button type="button" className="modal-layer__close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>
        <div className="modal-layer__body">{children}</div>
      </div>
    </div>
  );
}
