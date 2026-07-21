import { BattleModeIcon } from "@/components/icons/BattleModeIcon";

export function CompanionUpgradeTitleBar({ onBack }: { onBack: () => void }) {
  return (
    <header className="companion-upgrade-title">
      <button type="button" className="companion-upgrade-title__back press-scale" onClick={onBack} aria-label="Back to Companion Detail">
        <BattleModeIcon variant="chevron" size={26} />
      </button>
      <div>
        <h1>Companion Upgrade</h1>
        <p>Enhance support unit performance</p>
      </div>
      <span aria-hidden="true" />
    </header>
  );
}
