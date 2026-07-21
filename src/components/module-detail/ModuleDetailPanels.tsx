import type { ModuleDetailViewModel } from "@/data/moduleDetail";

export function ModuleDetailPanels({ module, onSourceInfo }: { module: ModuleDetailViewModel; onSourceInfo: () => void }) {
  return (
    <div className="module-detail-panels">
      <section className="module-detail-panel module-detail-panel--progression">
        <h2>Level Progression</h2>
        <div className="module-detail-panel__current">
          <span><small>Current Level</small><strong>{module.level.toLocaleString()}</strong></span>
          <span><small>Current Power</small><strong>{module.power.toLocaleString()}</strong></span>
        </div>
        <p>Current values use the shared module progression system. Open Upgrade to preview the next level and its resource cost.</p>
      </section>

      <section className="module-detail-panel module-detail-panel--source">
        <h2>Acquisition Source</h2>
        <strong>{module.acquisitionTitle}</strong>
        <p>{module.acquisitionDescription}</p>
        <button type="button" className="press-scale" onClick={onSourceInfo}>Source Guide</button>
      </section>
    </div>
  );
}
