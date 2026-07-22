import { useMemo, useState, type CSSProperties } from "react";
import { navigate } from "@/app/routes";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { InlineAlert } from "@/components/feedback/InlineAlert";
import { CardCornerBadge } from "@/components/feedback/CardCornerBadge";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import {
  getShipMasterArt,
  HOME_SCENE,
  MATERIAL_ICON,
  RESOURCE_ICON,
  REWARD_CHEST,
} from "@/data/assetRegistry";
import {
  getActiveShopOffersByCategory,
  getFeaturedShopOffers,
  getShopHeroOffer,
  getShopOfferRewardRows,
  type ShopCategory,
  type ShopOffer,
} from "@/data/shopOffers";
import type { ShopPurchaseErrorCode, ShopPurchaseResult } from "@/systems/rewards/purchaseShopOffer";
import { usePlayerStore } from "@/store/playerStore";
import "./ShopScreen.css";

/**
 * Shop Hub — visual composition follows 04_Shop_Hub.png.
 * Purchases only via store `purchaseShopOffer` → purchaseShopOfferTransaction.
 */

type ShopTab = "featured" | ShopCategory;

const SHOP_TABS: {
  id: ShopTab;
  label: string;
  blurb: string;
  icon: string;
}[] = [
  {
    id: "featured",
    label: "Featured",
    blurb: "Premium highlights",
    icon: REWARD_CHEST.rare,
  },
  {
    id: "resources",
    label: "Resources",
    blurb: "Credits & parts",
    icon: RESOURCE_ICON.credits,
  },
  {
    id: "energy",
    label: "Energy",
    blurb: "Battle fuel",
    icon: RESOURCE_ICON.energy,
  },
  {
    id: "chests",
    label: "Chests",
    blurb: "Unopened loot",
    icon: REWARD_CHEST.epic,
  },
];

const COST_ICON: Record<"coins" | "crystals", string> = {
  coins: RESOURCE_ICON.credits,
  crystals: RESOURCE_ICON.crystals,
};

const COST_LABEL: Record<"coins" | "crystals", string> = {
  coins: "Credits",
  crystals: "Crystals",
};

const RARITY_GLOW_CLASS: Partial<Record<NonNullable<ShopOffer["rarity"]>, string>> = {
  rare: "motion-glow-rare",
  epic: "motion-glow-epic",
  legendary: "motion-glow-legendary",
};

const HERO_SHIP_ART =
  getShipMasterArt("ship-01-rapid-fire") ??
  getShipMasterArt("ship-03-homing-missiles") ??
  MATERIAL_ICON.shipAlloy;

function describeShopPurchaseError(code?: ShopPurchaseErrorCode): string {
  switch (code) {
    case "invalid-offer-id":
      return "That offer isn't recognized. Nothing was charged.";
    case "inactive-offer":
      return "That offer isn't available right now. Nothing was charged.";
    case "invalid-price":
    case "invalid-reward-entry":
      return "That offer couldn't be processed. Nothing was charged.";
    case "insufficient-coins":
      return "Not enough Credits for this purchase.";
    case "insufficient-crystals":
      return "Not enough Crystals for this purchase.";
    case "persistence-failure":
      return "Your save couldn't be written, so nothing was charged. Please try again.";
    case "purchase-in-progress":
      return "A purchase is already processing — please wait.";
    default:
      return "This purchase couldn't be completed. Nothing was charged.";
  }
}

function OfferCard({
  offer,
  index,
  onBuy,
}: {
  offer: ShopOffer;
  index: number;
  onBuy: (offer: ShopOffer) => void;
}) {
  const rewardRows = getShopOfferRewardRows(offer);
  const primaryArt = rewardRows[0]?.icon ?? RESOURCE_ICON.credits;
  const glowClass = offer.rarity ? RARITY_GLOW_CLASS[offer.rarity] : undefined;

  return (
    <article
      className={`shop-offer-card shop-offer-card--${offer.rarity ?? "common"} motion-stagger-item`}
      style={{ "--motion-index": index } as CSSProperties}
    >
      {offer.badge ? (
        <CardCornerBadge icon={<span aria-hidden="true">★</span>} label={offer.badge} tone="gold" />
      ) : null}
      <h2 className="shop-offer-card__name">{offer.title}</h2>
      <div className={`shop-offer-card__art-wrap${glowClass ? ` ${glowClass}` : ""}`}>
        <img src={primaryArt} alt="" className="shop-offer-card__art" />
      </div>
      <p className="shop-offer-card__description">{offer.description}</p>
      {rewardRows.length > 1 ? (
        <ul className="shop-offer-card__grants" aria-label="Included rewards">
          {rewardRows.map((row) => (
            <li key={row.key}>
              <img src={row.icon} alt="" />
              <span>
                {row.displayName}
                {row.amount !== null ? ` ×${row.amount.toLocaleString()}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : rewardRows[0]?.amount !== null ? (
        <p className="shop-offer-card__qty">×{rewardRows[0].amount.toLocaleString()}</p>
      ) : null}
      <div className="shop-offer-card__price">
        <img src={COST_ICON[offer.cost.currencyId]} alt="" />
        <strong>{offer.cost.amount.toLocaleString()}</strong>
      </div>
      <PrimaryButton className="shop-offer-card__buy" onClick={() => onBuy(offer)}>
        Buy
      </PrimaryButton>
    </article>
  );
}

export function ShopScreen() {
  const { player, purchaseShopOffer } = usePlayerStore();
  const xpPct = player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const [tab, setTab] = useState<ShopTab>("featured");
  const [confirmOffer, setConfirmOffer] = useState<ShopOffer | null>(null);
  const [successState, setSuccessState] = useState<{ offer: ShopOffer; result: ShopPurchaseResult } | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const heroOffer = useMemo(() => getShopHeroOffer(), []);
  const offers = useMemo(
    () => (tab === "featured" ? getFeaturedShopOffers() : getActiveShopOffersByCategory(tab)),
    [tab],
  );
  const heroRewardRows = heroOffer ? getShopOfferRewardRows(heroOffer) : [];

  const openNotice = (title: string, message: string) => setNotice({ title, message });

  const handleBuyClick = (offer: ShopOffer) => {
    setFeedback(null);
    setConfirmOffer(offer);
  };

  const handleCancelConfirm = () => setConfirmOffer(null);

  const handleConfirmPurchase = () => {
    if (!confirmOffer || isPurchasing) return;
    const affordable = player.currencies[confirmOffer.cost.currencyId] >= confirmOffer.cost.amount;
    if (!affordable) return;
    setIsPurchasing(true);
    const offer = confirmOffer;
    const result = purchaseShopOffer(offer.id);
    setIsPurchasing(false);
    if (!result.success) {
      setFeedback(describeShopPurchaseError(result.errorCode));
      return;
    }
    setConfirmOffer(null);
    setSuccessState({ offer, result });
  };

  const handleCloseSuccess = () => setSuccessState(null);

  const confirmCostIcon = confirmOffer ? COST_ICON[confirmOffer.cost.currencyId] : null;
  const confirmBalance = confirmOffer ? player.currencies[confirmOffer.cost.currencyId] : 0;
  const confirmAffordable = confirmOffer ? confirmBalance >= confirmOffer.cost.amount : false;
  const confirmBalanceAfter = confirmOffer ? Math.max(0, confirmBalance - confirmOffer.cost.amount) : 0;
  const confirmRewardRows = confirmOffer ? getShopOfferRewardRows(confirmOffer) : [];
  const successRewardRows = successState ? getShopOfferRewardRows(successState.offer) : [];

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={openNotice} />}
        footer={<HubBottomNav active="shop" onComingSoon={openNotice} />}
      >
        <main
          className="shop-screen motion-fade-in"
          style={{ ["--shop-backdrop" as string]: `url(${HOME_SCENE.background})` }}
        >
          <div className="shop-screen__topline">
            <SecondaryButton onClick={() => navigate("home")}>Back to Home</SecondaryButton>
          </div>

          <header className="shop-screen__title">
            <h1>Shop</h1>
            <p>Premium supplies for your fleet — Credits and Crystals only.</p>
          </header>

          {feedback ? <InlineAlert tone="danger" message={feedback} onDismiss={() => setFeedback(null)} /> : null}

          {tab === "featured" && heroOffer ? (
            <section className={`shop-hero shop-hero--${heroOffer.rarity ?? "epic"} motion-scale-in`}>
              <div className="shop-hero__art-stage" aria-hidden="true">
                <img src={HERO_SHIP_ART} alt="" className="shop-hero__ship" />
                <img src={RESOURCE_ICON.crystals} alt="" className="shop-hero__crystal" />
                <img src={REWARD_CHEST.basic} alt="" className="shop-hero__chest" />
              </div>
              <div className="shop-hero__body">
                {heroOffer.badge ? <span className="shop-hero__badge">{heroOffer.badge}</span> : null}
                <h2 className="shop-hero__title">{heroOffer.title}</h2>
                <p className="shop-hero__description">{heroOffer.description}</p>
                <ul className="shop-hero__rewards">
                  {heroRewardRows.map((row) => (
                    <li key={row.key}>
                      <img src={row.icon} alt="" />
                      <span>
                        {row.displayName}
                        {row.amount !== null ? ` ×${row.amount.toLocaleString()}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
                <PrimaryButton
                  className="shop-hero__buy"
                  onClick={() => handleBuyClick(heroOffer)}
                >
                  <img src={COST_ICON[heroOffer.cost.currencyId]} alt="" />
                  {heroOffer.cost.amount.toLocaleString()} {COST_LABEL[heroOffer.cost.currencyId]}
                </PrimaryButton>
              </div>
            </section>
          ) : null}

          <nav className="shop-categories" aria-label="Shop categories">
            {SHOP_TABS.map((entry, index) => (
              <button
                key={entry.id}
                type="button"
                className={`shop-category motion-stagger-item${tab === entry.id ? " is-active" : ""}`}
                style={{ "--motion-index": index } as CSSProperties}
                onClick={() => setTab(entry.id)}
              >
                <img src={entry.icon} alt="" className="shop-category__icon" />
                <span className="shop-category__text">
                  <strong>{entry.label}</strong>
                  <small>{entry.blurb}</small>
                </span>
              </button>
            ))}
          </nav>

          <section className="shop-screen__offers" aria-label={tab === "featured" ? "Featured offers" : "Offers"}>
            <h3 className="shop-screen__section-label">
              {tab === "featured" ? "Featured Offers" : `${SHOP_TABS.find((t) => t.id === tab)?.label ?? ""} Offers`}
            </h3>
            {offers.length === 0 ? (
              <div className="shop-screen__empty">
                <p>No offers in this category yet. Check back soon.</p>
              </div>
            ) : (
              <div className="shop-screen__grid">
                {offers.map((offer, index) => (
                  <OfferCard key={offer.id} offer={offer} index={index} onBuy={handleBuyClick} />
                ))}
              </div>
            )}
          </section>
        </main>
      </HubScreenShell>

      <ModalLayer
        open={confirmOffer !== null}
        title={confirmOffer?.title ?? "Confirm Purchase"}
        onClose={handleCancelConfirm}
      >
        {confirmOffer ? (
          <div className="shop-confirm">
            <p className="shop-confirm__description">{confirmOffer.description}</p>

            <div className="shop-confirm__section">
              <h3>You receive</h3>
              <ul className="shop-confirm__reward-list">
                {confirmRewardRows.map((row) => (
                  <li key={row.key}>
                    <img src={row.icon} alt="" />
                    <span>{row.displayName}</span>
                    {row.amount !== null ? <strong>×{row.amount.toLocaleString()}</strong> : null}
                  </li>
                ))}
              </ul>
            </div>

            <div className="shop-confirm__section shop-confirm__balances">
              <div className="shop-confirm__row">
                <span>Cost</span>
                <span className="shop-confirm__value">
                  {confirmCostIcon ? <img src={confirmCostIcon} alt="" /> : null}
                  {confirmOffer.cost.amount.toLocaleString()} {COST_LABEL[confirmOffer.cost.currencyId]}
                </span>
              </div>
              <div className="shop-confirm__row">
                <span>Current balance</span>
                <span className="shop-confirm__value">
                  <AnimatedNumber value={confirmBalance} /> {COST_LABEL[confirmOffer.cost.currencyId]}
                </span>
              </div>
              <div className="shop-confirm__row">
                <span>Balance after</span>
                <span className="shop-confirm__value">
                  {confirmAffordable ? confirmBalanceAfter.toLocaleString() : "—"}{" "}
                  {COST_LABEL[confirmOffer.cost.currencyId]}
                </span>
              </div>
            </div>

            {!confirmAffordable ? (
              <InlineAlert
                tone="danger"
                message={`Not enough ${COST_LABEL[confirmOffer.cost.currencyId]}. You need ${(
                  confirmOffer.cost.amount - confirmBalance
                ).toLocaleString()} more.`}
              />
            ) : null}

            <div className="shop-confirm__actions">
              <SecondaryButton onClick={handleCancelConfirm}>Cancel</SecondaryButton>
              <PrimaryButton disabled={!confirmAffordable || isPurchasing} onClick={handleConfirmPurchase}>
                Confirm Purchase
              </PrimaryButton>
            </div>
          </div>
        ) : null}
      </ModalLayer>

      <ModalLayer open={successState !== null} title="Purchase Complete" onClose={handleCloseSuccess}>
        {successState ? (
          <div className="shop-success motion-scale-in">
            <p className="shop-success__title">{successState.offer.title}</p>
            <ul className="shop-success__reward-list">
              {successRewardRows.map((row) => (
                <li key={row.key} className={`shop-success__reward shop-success__reward--${row.rarity}`}>
                  <img src={row.icon} alt="" />
                  <span>{row.displayName}</span>
                  {row.amount !== null ? (
                    <strong>
                      ×<AnimatedNumber value={row.amount} />
                    </strong>
                  ) : null}
                </li>
              ))}
            </ul>
            {successState.offer.rewards.some((reward) => reward.kind === "chest") ? (
              <p className="shop-success__note">Chests added to your Vault, unopened.</p>
            ) : null}
            <PrimaryButton fullWidth onClick={handleCloseSuccess}>
              Continue
            </PrimaryButton>
          </div>
        ) : null}
      </ModalLayer>

      <ModalLayer open={notice !== null} title={notice?.title ?? ""} onClose={() => setNotice(null)}>
        <div className="shop-screen__dialog">
          <p>{notice?.message}</p>
          <PrimaryButton fullWidth onClick={() => setNotice(null)}>
            Continue
          </PrimaryButton>
        </div>
      </ModalLayer>
    </>
  );
}
