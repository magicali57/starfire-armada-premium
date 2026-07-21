import { BattleModeIcon } from "@/components/icons/BattleModeIcon";

export function ModuleUpgradeTitleBar({ onBack }: { onBack: () => void }) {
  return (
    <header className="module-upgrade-title">
      <button type="button" className="module-upgrade-title__back press-scale" onClick={onBack} aria-label="Back to Module Detail">
        <BattleModeIcon variant="chevron" size={26} />
      </button>
      <div><h1>Module Upgrade</h1><p>Enhance installed technology</p></div>
      <span aria-hidden="true" />
    </header>
  );
}
