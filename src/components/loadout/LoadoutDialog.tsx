import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { LoadoutStatContributionRow } from "@/data/loadout";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import type { LoadoutFailureReason, ShipRarity } from "@/types";
import "./LoadoutDialog.css";

interface UnsavedChangesDialogProps {
  kind: "unsavedChanges";
  onDiscard: () => void;
  onContinueEditing: () => void;
}

interface SavedDialogProps {
  kind: "saved";
  totalPower: number;
  onContinue: () => void;
}

interface InvalidSelectionDialogProps {
  kind: "invalidSelection";
  reason: LoadoutFailureReason | undefined;
  onClose: () => void;
}

interface ItemInfoDialogProps {
  kind: "itemInfo";
  name: string;
  rarity: ShipRarity;
  level: number;
  power: number;
  description: string;
  slotLabel: string;
  statRows: LoadoutStatContributionRow[];
  onClose: () => void;
}

type LoadoutDialogProps =
  | UnsavedChangesDialogProps
  | SavedDialogProps
  | InvalidSelectionDialogProps
  | ItemInfoDialogProps;

function invalidSelectionMessage(reason: LoadoutFailureReason | undefined): string {
  switch (reason) {
    case "invalid-companion":
    case "invalid-core-module":
    case "invalid-plating-module":
    case "invalid-system-module":
      return "That item no longer exists.";
    case "companion-not-owned":
    case "core-module-not-owned":
    case "plating-module-not-owned":
    case "system-module-not-owned":
      return "You don't own that item yet.";
    case "invalid-slot":
      return "That item can't be equipped in this slot.";
    case "busy":
      return "Still processing the previous save — try again in a moment.";
    default:
      return "This loadout could not be saved.";
  }
}

/**
 * Body content rendered inside <ModalLayer> for every Loadout Manager
 * dialog that isn't already covered by an existing shared component
 * (LockedContentModal already handles the informational "Locked Content"
 * case, so it isn't reimplemented here). Same content-only pattern as
 * ShipUpgradeDialog — ModalLayer itself owns the backdrop/Escape/close
 * chrome.
 */
export function LoadoutDialog(props: LoadoutDialogProps) {
  if (props.kind === "unsavedChanges") {
    return (
      <div className="loadout-dialog">
        <p className="loadout-dialog__intro">
          You have unsaved loadout changes. Leaving now will discard them.
        </p>
        <div className="loadout-dialog__actions">
          <SecondaryButton fullWidth onClick={props.onContinueEditing}>
            Continue Editing
          </SecondaryButton>
          <PrimaryButton fullWidth onClick={props.onDiscard}>
            Discard Changes
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (props.kind === "saved") {
    return (
      <div className="loadout-dialog">
        <p className="loadout-dialog__intro">Your loadout has been saved.</p>
        <div className="loadout-dialog__row">
          <span>
            <img src={RESOURCE_ICON.power} alt="" /> Total Power
          </span>
          <strong>{props.totalPower.toLocaleString()}</strong>
        </div>
        <div className="loadout-dialog__actions">
          <PrimaryButton fullWidth onClick={props.onContinue}>
            Continue
          </PrimaryButton>
        </div>
      </div>
    );
  }

  if (props.kind === "invalidSelection") {
    return (
      <div className="loadout-dialog">
        <p className="loadout-dialog__intro">{invalidSelectionMessage(props.reason)}</p>
        <div className="loadout-dialog__actions">
          <PrimaryButton fullWidth onClick={props.onClose}>
            Close
          </PrimaryButton>
        </div>
      </div>
    );
  }

  // itemInfo
  return (
    <div className="loadout-dialog">
      <div className="loadout-dialog__item-header">
        <span
          className="loadout-dialog__rarity"
          style={{ color: rarityColorVar(props.rarity), borderColor: rarityColorVar(props.rarity) }}
        >
          {RARITY_LABEL[props.rarity].toUpperCase()}
        </span>
        <span className="loadout-dialog__slot">{props.slotLabel}</span>
      </div>
      <p className="loadout-dialog__intro">
        <strong>{props.name}</strong> — Level {props.level}
      </p>
      <p className="loadout-dialog__description">{props.description}</p>

      <div className="loadout-dialog__row">
        <span>
          <img src={RESOURCE_ICON.power} alt="" /> Power
        </span>
        <strong>{props.power.toLocaleString()}</strong>
      </div>

      {props.statRows.length > 0 ? (
        <div className="loadout-dialog__stat-list">
          {props.statRows.map((row) => (
            <div className="loadout-dialog__stat-row" key={row.key}>
              <img src={row.icon} alt="" />
              <span className="loadout-dialog__stat-label">{row.label}</span>
              <span className="loadout-dialog__stat-value">{row.formattedValue}</span>
            </div>
          ))}
        </div>
      ) : null}

      <p className="loadout-dialog__coming-soon">Detail screen coming soon.</p>

      <div className="loadout-dialog__actions">
        <PrimaryButton fullWidth onClick={props.onClose}>
          Close
        </PrimaryButton>
      </div>
    </div>
  );
}
