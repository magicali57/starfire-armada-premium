import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { RESOURCE_ICON } from "@/data/assetRegistry";
import type { CompanionUpgradeViewModel } from "@/data/companionUpgrade";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";

export function CompanionUpgradeHero({ companion }: { companion: CompanionUpgradeViewModel }) {
  const { quote } = companion;
  return (
    <section className={`companion-upgrade-hero${companion.owned ? "" : " companion-upgrade-hero--locked"}`}>
      <div className="companion-upgrade-hero__copy">
        <span className="companion-upgrade-hero__rarity" style={{ color: rarityColorVar(companion.rarity), borderColor: rarityColorVar(companion.rarity) }}>
          {RARITY_LABEL[companion.rarity].toUpperCase()}
        </span>
        <h2>{companion.name}</h2>
        <small>Role</small>
        <p className="companion-upgrade-hero__role"><BattleModeIcon variant={companion.role === "Support" ? "medicalCross" : companion.role === "Defense Support" ? "shield" : companion.role === "Utility Support" ? "wrench" : "swords"} size={20} /> {companion.roleLabel}</p>
        <small>Power</small>
        <p className="companion-upgrade-hero__power"><img src={RESOURCE_ICON.power} alt="" /> {quote.currentPower.toLocaleString()}</p>
      </div>
      <div className="companion-upgrade-hero__art-wrap">
        {companion.artwork ? <img src={companion.artwork} alt={`${companion.name} companion artwork`} /> : null}
        {!companion.owned ? <span className="companion-upgrade-hero__lock"><BattleModeIcon variant="lock" size={34} /> Locked</span> : null}
      </div>
      <div className="companion-upgrade-hero__progress">
        <span><small>Level</small><strong>{quote.currentLevel} / 20</strong></span>
        <span><small>Rank</small><strong>{companion.rank} / {companion.maxRank}</strong></span>
        {companion.equipped ? <em>Equipped</em> : null}
      </div>
    </section>
  );
}
