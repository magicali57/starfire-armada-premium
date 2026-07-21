import { PrimaryButton } from "@/components/controls/PrimaryButton";
import "./CompanionDetailDialog.css";

interface EquipSuccessProps {
  kind: "equipSuccess";
  name: string;
  onClose: () => void;
}

interface EquipFailureProps {
  kind: "equipFailure";
  message: string;
  onClose: () => void;
}

interface LockedProps {
  kind: "locked";
  name: string;
  description: string;
  onClose: () => void;
}

interface UpgradeProps {
  kind: "upgrade";
  onClose: () => void;
}

interface RankUpProps {
  kind: "rankUp";
  onClose: () => void;
}

interface RankInfoProps {
  kind: "rankInfo";
  onClose: () => void;
}

interface DraftConflictProps {
  kind: "draftConflict";
  onCancel: () => void;
  onConfirm: () => void;
}

type CompanionDetailDialogProps =
  | EquipSuccessProps
  | EquipFailureProps
  | LockedProps
  | UpgradeProps
  | RankUpProps
  | RankInfoProps
  | DraftConflictProps;

/**
 * Body content rendered inside <ModalLayer> for every Companion Detail
 * dialog — same content-only pattern as LoadoutDialog/CompanionRosterDialog
 * (ModalLayer itself owns backdrop/Escape/close chrome). Every state here
 * is informational only or reports a real transaction's result; none of
 * them spend currency/materials or change level/rank.
 */
export function CompanionDetailDialog(props: CompanionDetailDialogProps) {
  if (props.kind === "equipSuccess") {
    return (
      <div className="companion-detail-dialog">
        <p className="companion-detail-dialog__intro">
          <strong>{props.name}</strong> is now your equipped companion.
        </p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Continue
        </PrimaryButton>
      </div>
    );
  }

  if (props.kind === "equipFailure") {
    return (
      <div className="companion-detail-dialog">
        <p className="companion-detail-dialog__intro">{props.message}</p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    );
  }

  if (props.kind === "locked") {
    return (
      <div className="companion-detail-dialog">
        <p className="companion-detail-dialog__intro">
          <strong>{props.name}</strong> is locked.
        </p>
        <p className="companion-detail-dialog__description">{props.description}</p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    );
  }

  if (props.kind === "upgrade") {
    return (
      <div className="companion-detail-dialog">
        <p className="companion-detail-dialog__title">Companion Upgrade</p>
        <p className="companion-detail-dialog__intro">Coming in the next progression phase.</p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    );
  }

  if (props.kind === "rankUp") {
    return (
      <div className="companion-detail-dialog">
        <p className="companion-detail-dialog__title">Rank Up</p>
        <p className="companion-detail-dialog__intro">Rank Up is coming in a future progression phase.</p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    );
  }

  if (props.kind === "rankInfo") {
    return (
      <div className="companion-detail-dialog">
        <p className="companion-detail-dialog__intro">
          Rank reflects a companion's growth through repeated acquisition. Higher ranks improve the
          companion's core behavior. Rank Up is not yet available in this build.
        </p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    );
  }

  // draftConflict
  return (
    <div className="companion-detail-dialog">
      <p className="companion-detail-dialog__title">Unsaved Loadout Changes</p>
      <p className="companion-detail-dialog__intro">
        You have unsaved module changes in Loadout Manager. Equipping this companion now will save
        it immediately, but your unsaved module changes will stay untouched in the draft. Continue?
      </p>
      <div className="companion-detail-dialog__row">
        <button type="button" className="companion-detail-dialog__secondary press-scale" onClick={props.onCancel}>
          Cancel
        </button>
        <PrimaryButton fullWidth onClick={props.onConfirm}>
          Equip Anyway
        </PrimaryButton>
      </div>
    </div>
  );
}
