import { ModalLayer } from "./ModalLayer";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import "./LockedContentModal.css";

interface LockedContentModalProps {
  open: boolean;
  title: string;
  unlockRequirement: string;
  onClose: () => void;
}

/** Reusable "this is locked" dialog — used by locked ships today, and any
 *  other locked system (shortcuts, tabs) that needs the same treatment. */
export function LockedContentModal({
  open,
  title,
  unlockRequirement,
  onClose,
}: LockedContentModalProps) {
  return (
    <ModalLayer open={open} title={title} onClose={onClose}>
      <div className="locked-content-modal">
        <div className="locked-content-modal__icon" aria-hidden="true">
          🔒
        </div>
        <p className="locked-content-modal__requirement">{unlockRequirement}</p>
        <SecondaryButton fullWidth onClick={onClose}>
          Close
        </SecondaryButton>
      </div>
    </ModalLayer>
  );
}
