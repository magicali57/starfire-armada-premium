import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import "./LoadoutActions.css";

interface LoadoutActionsProps {
  canSave: boolean;
  canReset: boolean;
  saving: boolean;
  onSave: () => void;
  onReset: () => void;
}

/**
 * Save / Reset action row — gold Save (primary), blue Reset (secondary),
 * reproducing 10_Loadout_Manager.png. Button-enabled state is decided
 * entirely by the caller (LoadoutManagerScreen), matching the state table
 * from the task spec: no changes -> both disabled; valid changes -> both
 * enabled; invalid draft -> Save disabled, Reset enabled; saving -> both
 * disabled.
 */
export function LoadoutActions({ canSave, canReset, saving, onSave, onReset }: LoadoutActionsProps) {
  return (
    <div className="loadout-actions">
      <SecondaryButton fullWidth onClick={onReset} disabled={!canReset || saving}>
        Reset Changes
      </SecondaryButton>
      <PrimaryButton fullWidth onClick={onSave} disabled={!canSave || saving}>
        {saving ? "Saving…" : "Save Loadout"}
      </PrimaryButton>
    </div>
  );
}
