import { StatRow } from "@/components/stats/StatRow";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { BattleModeIcon } from "@/components/icons/BattleModeIcon";
import { MODE_ILLUSTRATION } from "@/data/assetRegistry";
import type { BattleHubCampaignPreview } from "@/data/battleHub";
import "./CampaignFeatureCard.css";

interface CampaignFeatureCardProps {
  data: BattleHubCampaignPreview;
  onChapterMap: () => void;
  onContinue: () => void;
}

/**
 * The Battle Hub's large Campaign feature card. Uses `MODE_ILLUSTRATION.
 * campaign` as the closest approved substitute for the reference's exact
 * "Shattered Nebula" ship-and-planet scene (see BATTLE_HUB_PLAN.md §30 —
 * known, reported substitution), kept to the right side of the card at
 * roughly the reference's scale, with a left-to-right gradient so the text
 * column stays readable over it.
 */
export function CampaignFeatureCard({ data, onChapterMap, onContinue }: CampaignFeatureCardProps) {
  return (
    <div className="campaign-feature-card">
      <img className="campaign-feature-card__art" src={MODE_ILLUSTRATION.campaign} alt="" />
      <span className="campaign-feature-card__scrim" aria-hidden="true" />

      <div className="campaign-feature-card__body">
        <span className="campaign-feature-card__tag">{data.tag}</span>
        <span className="campaign-feature-card__chapter-label">{data.chapterLabel}</span>
        <h2 className="campaign-feature-card__chapter-name">{data.chapterName}</h2>
        <span className="campaign-feature-card__stage-label">{data.stageLabel}</span>

        <div className="campaign-feature-card__stats">
          <div className="campaign-feature-card__stars-row">
            <StatRow
              icon={<BattleModeIcon variant="star" size={14} />}
              label="Chapter Stars"
              value={`${data.chapterStars.current}/${data.chapterStars.max}`}
            />
          </div>
          <div className="campaign-feature-card__power-row">
            <div className="campaign-feature-card__power-cell campaign-feature-card__power-cell--recommended">
              <StatRow
                icon={<BattleModeIcon variant="swords" size={14} />}
                label="Recommended Power"
                value={data.recommendedPower.toLocaleString()}
              />
            </div>
            <div className="campaign-feature-card__power-cell campaign-feature-card__power-cell--yours">
              <StatRow
                icon={<BattleModeIcon variant="swords" size={14} />}
                label="Your Power"
                value={data.yourPower.toLocaleString()}
              />
            </div>
          </div>
          <div className="campaign-feature-card__energy-row">
            <StatRow
              icon={<BattleModeIcon variant="energy" size={14} />}
              label="Energy Cost"
              value={String(data.energyCost)}
            />
          </div>
        </div>

        <div className="campaign-feature-card__actions">
          <SecondaryButton onClick={onChapterMap} className="campaign-feature-card__map-btn">
            <BattleModeIcon variant="mapPin" size={16} />
            Chapter Map
          </SecondaryButton>
          <PrimaryButton onClick={onContinue} fullWidth className="campaign-feature-card__continue-btn">
            Continue
            <BattleModeIcon variant="chevron" size={16} />
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
