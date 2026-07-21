import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { MATERIAL_ICON, RESOURCE_ICON } from "@/data/assetRegistry";
import type { CompanionDetailViewModel } from "@/data/companionDetail";
import "./CompanionDetailProgress.css";

interface CompanionDetailProgressProps {
  companion: CompanionDetailViewModel;
}

/**
 * "PROGRESSION" section (18_Companion_Detail.png): Level Upgrade Preview
 * and Rank Up Preview side by side, plus an Upgrade Cost row. Presentation
 * only — nothing here is spent or persisted (see CompanionDetailScreen's
 * Upgrade/Rank Up handlers, which only ever open an informational modal).
 *
 * Disclosed deviation from the reference's literal preview numbers: the
 * reference shows per-ability combat stats ("Heal Per Second 2,450 →
 * 2,700", "Healing Bonus +12% → +15%") that have no real formula anywhere
 * in this codebase. Reproducing those exact numbers for every companion
 * would fabricate a fake combat-balance system. Instead, both preview
 * panels here show Power — the one real, already-reused figure
 * (calculateCompanionPower, identical to Loadout Manager/Companions
 * Roster) — compared Current vs Next, which is honest and traceable to
 * real code while preserving the reference's Current/Next-with-arrow
 * layout. The Upgrade Cost figures are a disclosed, deterministic,
 * non-transactional placeholder formula (see getUpgradeCostPreview in
 * data/companionDetail.ts) — not the reference's own static numbers,
 * which are specific to one companion at one level/rank and would
 * misrepresent every other companion/level/rank combination if reused
 * verbatim.
 */
export function CompanionDetailProgress({ companion }: CompanionDetailProgressProps) {
  const { levelPreview, rankPreview, upgradeCost } = companion;

  return (
    <div className="companion-detail-progress">
      <h2 className="companion-detail-progress__heading">
        Progression <i />
      </h2>

      <div className="companion-detail-progress__panels">
        <div className="companion-detail-progress__panel companion-detail-progress__panel--level">
          <h3>Level Upgrade Preview</h3>
          {levelPreview.atCap ? (
            <p className="companion-detail-progress__cap-note">
              Level {levelPreview.currentLevel} — at or above this screen's Level {levelPreview.maxLevel}{" "}
              presentation cap. No preview available.
            </p>
          ) : (
            <div className="companion-detail-progress__compare">
              <div>
                <small>Current</small>
                <strong>Lv. {levelPreview.currentLevel}</strong>
                <span>{levelPreview.currentPower.toLocaleString()} Power</span>
              </div>
              <BattleModeIcon variant="chevron" size={16} />
              <div>
                <small>Next Level</small>
                <strong>Lv. {levelPreview.nextLevel}</strong>
                <span className="companion-detail-progress__up">
                  {levelPreview.nextPower?.toLocaleString()} Power
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="companion-detail-progress__panel companion-detail-progress__panel--rank">
          <h3>Rank Up Preview</h3>
          {rankPreview.atMaxRank ? (
            <p className="companion-detail-progress__cap-note">Max Rank reached ({rankPreview.maxRank}/{rankPreview.maxRank}).</p>
          ) : (
            <div className="companion-detail-progress__compare">
              <div>
                <small>Current</small>
                <strong>
                  {rankPreview.currentRank} / {rankPreview.maxRank}
                </strong>
              </div>
              <BattleModeIcon variant="chevron" size={16} />
              <div>
                <small>Next Rank</small>
                <strong>
                  {rankPreview.nextRank} / {rankPreview.maxRank}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="companion-detail-progress__cost">
        <span className="companion-detail-progress__cost-label">Upgrade Cost</span>
        {upgradeCost.credits === null || upgradeCost.companionData === null ? (
          <strong>MAX LEVEL</strong>
        ) : (
          <>
            <span className="companion-detail-progress__cost-value">
              <img src={RESOURCE_ICON.credits} alt="" />
              {upgradeCost.credits.toLocaleString()}
            </span>
            <span className="companion-detail-progress__cost-plus">+</span>
            <span className="companion-detail-progress__cost-value">
              <img src={MATERIAL_ICON.companionData} alt="" />
              {upgradeCost.companionData.toLocaleString()}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
