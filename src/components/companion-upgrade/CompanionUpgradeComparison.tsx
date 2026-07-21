import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { SLOT_ICON } from "@/data/assetRegistry";
import { formatCompanionUpgradeEffect, type CompanionUpgradeViewModel } from "@/data/companionUpgrade";

export function CompanionUpgradeComparison({ companion }: { companion: CompanionUpgradeViewModel }) {
  const { quote } = companion;
  return (
    <>
      <div className="companion-upgrade-comparison-row">
        <section className="companion-upgrade-preview companion-upgrade-preview--level">
          <h2>Level Upgrade Preview</h2>
          {quote.atMaxLevel ? (
            <div className="companion-upgrade-preview__max"><BattleModeIcon variant="star" size={24} /> Maximum Level Reached</div>
          ) : (
            <div className="companion-upgrade-preview__columns">
              <div><small>Current (Lv. {quote.currentLevel}/20)</small><strong>{quote.currentPower.toLocaleString()} Power</strong>
                {quote.currentEffects.map((effect) => <p key={effect.key}><span>{effect.label}</span><b>{formatCompanionUpgradeEffect(effect)}</b></p>)}
              </div>
              <BattleModeIcon variant="chevron" size={22} />
              <div><small>Next Level (Lv. {quote.nextLevel}/20)</small><strong>{quote.nextPower?.toLocaleString()} Power <i>+{quote.powerIncrease}</i></strong>
                {quote.nextEffects.map((effect, index) => {
                  const current = quote.currentEffects[index];
                  const improved = current ? effect.value > current.value : false;
                  return <p key={effect.key}><span>{effect.label}</span><b className={improved ? "is-improved" : undefined}>{formatCompanionUpgradeEffect(effect)}{improved ? " ↑" : ""}</b></p>;
                })}
              </div>
            </div>
          )}
        </section>

        <section className="companion-upgrade-preview companion-upgrade-preview--rank">
          <h2>Rank Up Preview</h2>
          <div className="companion-upgrade-preview__columns">
            <div><small>Current Rank</small><strong>{companion.rank} / {companion.maxRank}</strong><p><span>Status</span><b>{companion.rank === 0 ? "Base" : "Unlocked"}</b></p></div>
            <BattleModeIcon variant="chevron" size={22} />
            <div><small>Next Rank</small><strong>{Math.min(companion.maxRank, companion.rank + 1)} / {companion.maxRank}</strong><p><span>Milestone</span><b className="is-improved">Preview Only</b></p></div>
          </div>
        </section>
      </div>

      <section className="companion-upgrade-skill">
        <h2>Skill &amp; Effects</h2>
        <img src={SLOT_ICON.companion} alt="" />
        <div><h3>{companion.primaryEffectName}</h3><small>Companion Ability</small><p>{companion.behaviorSummary}</p></div>
        <dl>
          {quote.currentEffects.map((effect) => <div key={effect.key}><dt>{effect.label}</dt><dd>{formatCompanionUpgradeEffect(effect)}</dd></div>)}
          <div><dt>Targeting</dt><dd>{companion.targeting}</dd></div>
        </dl>
      </section>
    </>
  );
}
