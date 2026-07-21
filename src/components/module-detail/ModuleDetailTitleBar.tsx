import { BattleModeIcon } from "@/components/icons/BattleModeIcon";

export function ModuleDetailTitleBar({ moduleName, backLabel = "Back to Loadout", onBack }: { moduleName?: string; backLabel?: string; onBack: () => void }) {
  return (
    <header className="module-detail-title">
      <button type="button" className="module-detail-title__back press-scale" onClick={onBack} aria-label={backLabel}>
        <BattleModeIcon variant="chevron" size={26} />
      </button>
      <div>
        <h1>Module Detail</h1>
        <p>{moduleName ?? "Module information"}</p>
      </div>
      <span aria-hidden="true" />
    </header>
  );
}
