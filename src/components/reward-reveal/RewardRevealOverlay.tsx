import { ModalLayer } from "@/components/feedback/ModalLayer";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { UTILITY_ICON } from "@/data/assetRegistry";
import type { RewardRevealItem } from "@/data/rewardReveal";
import "./RewardRevealOverlay.css";

const RARITY_GLOW_CLASS: Partial<Record<string, string>> = {
  rare: "motion-glow-rare",
  epic: "motion-glow-epic",
  legendary: "motion-glow-legendary",
};

export interface RewardRevealOverlayProps {
  isOpen: boolean;
  items: readonly RewardRevealItem[];
  currentIndex: number;
  /** Stage / chapter context — display only, never invents values. */
  stageName?: string | null;
  stageIdentity?: string | null;
  firstClear?: boolean;
  onNext: () => void;
  onClose: () => void;
}

/**
 * Informational-only Reward Reveal — composition follows
 * 49_Rewards_Acquired.png. Never grants, opens chests, or resolves drops.
 */
export function RewardRevealOverlay({
  isOpen,
  items,
  currentIndex,
  stageName,
  stageIdentity,
  firstClear = false,
  onNext,
  onClose,
}: RewardRevealOverlayProps) {
  if (!isOpen || items.length === 0) return null;

  const safeIndex = Math.min(Math.max(currentIndex, 0), items.length - 1);
  const item = items[safeIndex];
  if (!item) return null;

  const isLast = safeIndex >= items.length - 1;
  const buttonLabel = items.length === 1 ? "Continue" : isLast ? "Done" : "Next";
  const handlePress = () => {
    if (isLast) onClose();
    else onNext();
  };

  return (
    <ModalLayer open={isOpen} title="Rewards Acquired" onClose={onClose}>
      <div className="reward-reveal" key={item.key}>
        <header className="reward-reveal__header">
          <span className="reward-reveal__emblem" aria-hidden="true">
            ★
          </span>
          <h2 className="reward-reveal__title">Rewards Acquired</h2>
          {stageIdentity ? <p className="reward-reveal__identity">{stageIdentity}</p> : null}
          {stageName ? <p className="reward-reveal__stage">{stageName}</p> : null}
          {firstClear ? (
            <p className="reward-reveal__first-clear">
              <span aria-hidden="true">★</span> First Clear
            </p>
          ) : null}
        </header>

        {items.length > 1 ? (
          <p className="reward-reveal__counter">
            {safeIndex + 1} / {items.length}
          </p>
        ) : null}

        <div
          className={[
            "reward-reveal__art",
            `reward-reveal__art--${item.rarity ?? "common"}`,
            item.rarity ? RARITY_GLOW_CLASS[item.rarity] : undefined,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {item.isNew ? <span className="reward-reveal__new-badge">NEW</span> : null}
          <img
            src={item.imageSrc || UTILITY_ICON.emptySlot}
            alt=""
            className="reward-reveal__art-image"
            onError={(event) => {
              event.currentTarget.src = UTILITY_ICON.emptySlot;
            }}
          />
        </div>

        <p className="reward-reveal__name">{item.displayName}</p>
        {item.quantity > 1 ? <p className="reward-reveal__quantity">×{item.quantity.toLocaleString()}</p> : null}
        {item.subtitle ? <p className="reward-reveal__subtitle">{item.subtitle}</p> : null}

        {isLast && items.length > 1 ? (
          <ul className="reward-reveal__summary" aria-label="All special rewards">
            {items.map((summaryItem) => (
              <li key={`summary-${summaryItem.key}`} className={`reward-reveal__summary-card reward-reveal__summary-card--${summaryItem.rarity ?? "common"}`}>
                <img src={summaryItem.imageSrc || UTILITY_ICON.emptySlot} alt="" />
                <span>{summaryItem.displayName}</span>
                {summaryItem.quantity > 1 ? <strong>×{summaryItem.quantity.toLocaleString()}</strong> : null}
              </li>
            ))}
          </ul>
        ) : null}

        <PrimaryButton fullWidth className="reward-reveal__continue" onClick={handlePress}>
          {buttonLabel}
        </PrimaryButton>
      </div>
    </ModalLayer>
  );
}
