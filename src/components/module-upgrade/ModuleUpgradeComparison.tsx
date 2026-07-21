import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import type { ModuleUpgradeViewModel } from "@/data/moduleUpgrade";

export function ModuleUpgradeComparison({ module }: { module: ModuleUpgradeViewModel }) {
  const { quote } = module;
  return (
    <section className="module-upgrade-preview">
      <h2>Upgrade Preview</h2>
      {quote.atMaxLevel ? (
        <div className="module-upgrade-preview__max"><BattleModeIcon variant="star" size={26} /><strong>Maximum Level Reached</strong><span>This module is fully enhanced.</span></div>
      ) : (
        <div className="module-upgrade-preview__columns">
          <article>
            <small>Current · Lv. {quote.currentLevel}/80</small>
            <strong>{quote.currentPower.toLocaleString()} Power</strong>
            {quote.effects.map((effect) => <p key={effect.key}><img src={effect.icon} alt="" /><span>{effect.label}</span><b>{effect.currentFormatted}</b></p>)}
          </article>
          <BattleModeIcon variant="chevron" size={24} />
          <article>
            <small>Next · Lv. {quote.nextLevel}/80</small>
            <strong>{quote.nextPower?.toLocaleString()} Power <i>+{quote.powerIncrease}</i></strong>
            {quote.effects.map((effect) => <p key={effect.key}><img src={effect.icon} alt="" /><span>{effect.label}</span><b className="is-improved">{effect.nextFormatted} ↑</b></p>)}
          </article>
        </div>
      )}
      <p className="module-upgrade-preview__description">{module.description}</p>
    </section>
  );
}
