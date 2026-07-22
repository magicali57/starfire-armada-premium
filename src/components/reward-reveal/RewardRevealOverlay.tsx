import { ModalLayer } from "@/components/feedback/ModalLayer";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { UTILITY_ICON } from "@/data/assetRegistry";
import type { RewardRevealItem } from "@/data/rewardReveal";
import "./RewardRevealOverlay.css";

export interface RewardRevealOverlayProps {
  isOpen: boolean;
  items: readonly RewardRevealItem[];
  currentIndex: number;
  /** Advances to the next queued item — never grants/re-grants anything. */
  onNext: () => void;
  /** Fully dismisses the overlay (also reachable via the modal's own
   *  Escape/backdrop/close affordances) — the reward stays exactly as
   *  already applied either way. */
  onClose: () => void;
}

/**
 * Reusable, informational-only Reward Reveal overlay. Every item it shows
 * was already awarded by the canonical completion transaction before this
 * component ever mounted — it never grants a reward, opens a chest,
 * resolves a drop, adds a collectible, or converts a duplicate. Supports
 * one item (single CONTINUE) or a queue (position counter + NEXT, DONE on
 * the last item). Wording never implies the button itself grants
 * anything.
 */
export function RewardRevealOverlay({ isOpen, items, currentIndex, onNext, onClose }: RewardRevealOverlayProps) {
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
    <ModalLayer open={isOpen} title="Reward" onClose={onClose}>
      <div className="reward-reveal">
        {items.length > 1 ? (
          <p className="reward-reveal__counter">
            {safeIndex + 1} / {items.length}
          </p>
        ) : null}

        <div className={`reward-reveal__art reward-reveal__art--${item.rarity ?? "common"}`}>
          {item.isNew ? <span className="reward-reveal__new-badge">NEW</span> : null}
          <img
            src={item.imageSrc || UTILITY_ICON.emptySlot}
            alt=""
            className="reward-reveal__art-image"
            onError={(event) => {
              // Missing/broken artwork never crashes the reveal — falls
              // back to the same safe empty-slot icon used everywhere
              // else in the app.
              event.currentTarget.src = UTILITY_ICON.emptySlot;
            }}
          />
        </div>

        <p className="reward-reveal__name">{item.displayName}</p>
        {item.quantity > 1 ? <p className="reward-reveal__quantity">×{item.quantity.toLocaleString()}</p> : null}
        {item.subtitle ? <p className="reward-reveal__subtitle">{item.subtitle}</p> : null}

        <PrimaryButton fullWidth onClick={handlePress}>
          {buttonLabel}
        </PrimaryButton>
      </div>
    </ModalLayer>
  );
}
