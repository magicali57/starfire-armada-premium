import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { CompanionRosterItem } from "@/data/companionRoster";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import "./CompanionRosterDialog.css";

interface DetailDialogProps {
  kind: "detail";
  item: CompanionRosterItem;
  onClose: () => void;
}

interface LockedDialogProps {
  kind: "locked";
  item: CompanionRosterItem;
  onClose: () => void;
}

interface UpgradeComingSoonProps {
  kind: "upgrade";
  item: CompanionRosterItem;
  onClose: () => void;
}

interface EquipSuccessProps {
  kind: "equipSuccess";
  item: CompanionRosterItem;
  onClose: () => void;
}

interface InvalidProps {
  kind: "invalid";
  message: string;
  onClose: () => void;
}

type CompanionRosterDialogProps =
  | DetailDialogProps
  | LockedDialogProps
  | UpgradeComingSoonProps
  | EquipSuccessProps
  | InvalidProps;

/**
 * Body content rendered inside <ModalLayer> for every Companions Roster
 * dialog — same content-only pattern as LoadoutDialog (ModalLayer itself
 * owns the backdrop/Escape/close chrome). All states here are
 * informational only: no currency spend, no unlock transaction, no rank-up
 * — Equip itself is a real store transaction but its result is only ever
 * reported through the "equipSuccess" state here, never silently applied
 * without feedback.
 */
export function CompanionRosterDialog(props: CompanionRosterDialogProps) {
  if (props.kind === "detail") {
    const { item } = props;
    return (
      <div className="companion-roster-dialog">
        <div className="companion-roster-dialog__header">
          <span
            className="companion-roster-dialog__rarity"
            style={{ color: rarityColorVar(item.rarity), borderColor: rarityColorVar(item.rarity) }}
          >
            {RARITY_LABEL[item.rarity].toUpperCase()}
          </span>
          <span className="companion-roster-dialog__role">{item.roleDisplayLabel}</span>
        </div>
        <p className="companion-roster-dialog__intro">
          <strong>{item.name}</strong> — Level {item.level} / {item.maxLevel}
        </p>
        <p className="companion-roster-dialog__description">{item.description}</p>
        <div className="companion-roster-dialog__row">
          <span>
            <img src={RESOURCE_ICON.power} alt="" /> Power
          </span>
          <strong>{item.power.toLocaleString()}</strong>
        </div>
        <div className="companion-roster-dialog__row">
          <span>Rank</span>
          <strong>
            {item.rank} / {item.maxRank}
          </strong>
        </div>
        <p className="companion-roster-dialog__coming-soon">Full Companion Detail screen coming soon.</p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    );
  }

  if (props.kind === "locked") {
    const { item } = props;
    return (
      <div className="companion-roster-dialog">
        <div className="companion-roster-dialog__header">
          <span
            className="companion-roster-dialog__rarity"
            style={{ color: rarityColorVar(item.rarity), borderColor: rarityColorVar(item.rarity) }}
          >
            {RARITY_LABEL[item.rarity].toUpperCase()}
          </span>
          <span className="companion-roster-dialog__role">{item.roleDisplayLabel}</span>
        </div>
        <p className="companion-roster-dialog__intro">
          <strong>{item.name}</strong> is locked.
        </p>
        <p className="companion-roster-dialog__description">
          {item.acquisition?.unlockDescription ?? "Acquisition source not yet available in this build."}
        </p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    );
  }

  if (props.kind === "upgrade") {
    return (
      <div className="companion-roster-dialog">
        <p className="companion-roster-dialog__intro">
          <strong>{props.item.name}</strong> is ready for a rank upgrade.
        </p>
        <p className="companion-roster-dialog__coming-soon">Companion Upgrade is coming soon.</p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    );
  }

  if (props.kind === "equipSuccess") {
    return (
      <div className="companion-roster-dialog">
        <p className="companion-roster-dialog__intro">
          <strong>{props.item.name}</strong> is now your equipped companion.
        </p>
        <PrimaryButton fullWidth onClick={props.onClose}>
          Continue
        </PrimaryButton>
      </div>
    );
  }

  // invalid
  return (
    <div className="companion-roster-dialog">
      <p className="companion-roster-dialog__intro">{props.message}</p>
      <PrimaryButton fullWidth onClick={props.onClose}>
        Close
      </PrimaryButton>
    </div>
  );
}
