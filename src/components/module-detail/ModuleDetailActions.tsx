import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";

interface ModuleDetailActionsProps {
  owned: boolean;
  equipped: boolean;
  onEquip: () => void;
  onUpgrade: () => void;
}

export function ModuleDetailActions({ owned, equipped, onEquip, onUpgrade }: ModuleDetailActionsProps) {
  return (
    <section className="module-detail-actions" aria-label="Module actions">
      <PrimaryButton fullWidth disabled={!owned || equipped} onClick={onEquip}>
        {equipped ? "Equipped" : owned ? "Equip" : "Locked"}
      </PrimaryButton>
      <SecondaryButton fullWidth disabled={!owned} onClick={onUpgrade}>Upgrade</SecondaryButton>
    </section>
  );
}
