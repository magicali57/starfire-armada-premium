import type { ResolvedReward, RewardEntry, RewardRarity } from "@/types";
import { toRewardDisplayRows, type RewardDisplayRow } from "@/data/rewardDisplay";

// The ONE canonical Shop catalog. Every offer a player can see or buy is a
// row in SHOP_OFFERS below — never hard-coded inline in ShopScreen.tsx or
// its modals. Rewards reuse the existing RewardEntry model (same one
// stage/chest/level-up rewards use) so purchasing flows through the
// existing canonical applyRewardBundle with zero second reward catalog.
//
// Permanent launch catalog only — no rotating/timed/limited-time offers,
// no purchase-limit state, no real-money prices. See
// docs/handoffs/shop/COMPLETION_REPORT.md for the full pricing rationale
// against docs/economy/LAUNCH_ECONOMY_AUDIT.md.

export type ShopCategory = "resources" | "energy" | "chests";
export type ShopOfferStatus = "active" | "planned" | "future";
/** The only two currencies a Shop offer may charge — Energy and Player XP
 *  are never valid PAYMENT currencies here (Energy/XP are only ever
 *  Shop-granted REWARDS, matching the task's explicit ban). */
export type ShopCostCurrencyId = "coins" | "crystals";

export interface ShopOffer {
  id: string;
  category: ShopCategory;
  /** Cross-category highlight flag for the Featured tab. Deliberately NOT
   *  a fourth `category` value — an offer keeps its one real category (so
   *  Resources/Energy/Chests tabs are never missing an item just because
   *  it's also spotlighted), and Featured is simply the active, featured
   *  subset shown together, sorted the same way as everywhere else. */
  featured?: boolean;
  /** Permanent Shop hero (Commander Supply Bundle). Shown as the large
   *  featured panel on the Featured tab — never a dollar-priced IAP. */
  hero?: boolean;
  title: string;
  description: string;
  cost: { currencyId: ShopCostCurrencyId; amount: number };
  rewards: RewardEntry[];
  rarity?: RewardRarity;
  badge?: string;
  sortOrder: number;
  status: ShopOfferStatus;
}

// ---------------------------------------------------------------------------
// Pricing rationale (see COMPLETION_REPORT.md for the full audit-backed
// walkthrough) — short version:
// - Credits packs: ~100-140 Credits per Crystal (bulk discount on larger
//   packs), so Crystals stay premium and packs are a modest accelerant,
//   never an instant win.
// - Energy: Crystal offers at ~1.2-1.35 Crystals/Energy. The one Credits
//   Energy offer is priced at 50 Credits/Energy — comfortably above the
//   highest CURRENTLY EXISTING repeat-clear rate (chapter 1's hardest
//   stage/difficulty combination tops out under 27 Credits/Energy), so it
//   can never be a net-positive Credits loop against any stage that exists
//   today. Revisit this ceiling if/when later chapters or Hard/Nightmare
//   ship (see docs/economy/LAUNCH_ECONOMY_AUDIT.md's own "late-chapter
//   Credits scaling" open item).
// - Materials: common parts (Ship/Weapon/Module Parts, Companion Data)
//   priced as a cheap-per-unit Credits sink; Ability Cores and Universal
//   Shards priced far higher per unit (and Shards cost Crystals), keeping
//   them "more valuable than common parts" per the task's instruction.
// - Chests: Credits-priced, Basic << Rare << Epic (800 / 2,500 / 6,000 —
//   3x then 2.4x), each comfortably above what even a stage's one-time
//   first-clear bundle grants, so no single reward buys several chests.
// ---------------------------------------------------------------------------

export const SHOP_OFFERS: readonly ShopOffer[] = [
  // --- Permanent Shop hero (adapts reference Starter Pack composition) ---
  {
    id: "shop-commander-supply-bundle",
    category: "resources",
    featured: true,
    hero: true,
    title: "Commander Supply Bundle",
    description: "A permanent premium supply drop — Credits, Energy, upgrade parts, and a Basic Chest.",
    cost: { currencyId: "crystals", amount: 200 },
    rewards: [
      { kind: "currency", currencyId: "coins", amount: 12000 },
      { kind: "currency", currencyId: "energy", amount: 50 },
      { kind: "material", materialId: "shipAlloy", amount: 80 },
      { kind: "material", materialId: "weaponParts", amount: 40 },
      { kind: "chest", chestId: "chestBasic", amount: 1 },
    ],
    rarity: "epic",
    badge: "Featured",
    sortOrder: 1,
    status: "active",
  },

  // --- Resources: Credits packs (Crystals → Credits) ------------------
  {
    id: "shop-credits-small",
    category: "resources",
    title: "Credits Pack — Small",
    description: "A small infusion of Credits for upgrades and Shop purchases.",
    cost: { currencyId: "crystals", amount: 50 },
    rewards: [{ kind: "currency", currencyId: "coins", amount: 5000 }],
    sortOrder: 10,
    status: "active",
  },
  {
    id: "shop-credits-medium",
    category: "resources",
    featured: true,
    title: "Credits Pack — Medium",
    description: "A solid Credits boost at a better exchange rate than the small pack.",
    cost: { currencyId: "crystals", amount: 150 },
    rewards: [{ kind: "currency", currencyId: "coins", amount: 18000 }],
    sortOrder: 11,
    status: "active",
  },
  {
    id: "shop-credits-large",
    category: "resources",
    title: "Credits Pack — Large",
    description: "The best Credits-per-Crystal rate in the Shop.",
    cost: { currencyId: "crystals", amount: 400 },
    rewards: [{ kind: "currency", currencyId: "coins", amount: 55000 }],
    rarity: "rare",
    badge: "Best Value",
    sortOrder: 12,
    status: "active",
  },

  // --- Resources: progression materials (Credits) --------------------
  {
    id: "shop-material-ship-alloy",
    category: "resources",
    title: "Ship Alloy Supply",
    description: "Ship Alloy for Ship Level Up.",
    cost: { currencyId: "coins", amount: 600 },
    rewards: [{ kind: "material", materialId: "shipAlloy", amount: 100 }],
    sortOrder: 20,
    status: "active",
  },
  {
    id: "shop-material-weapon-parts",
    category: "resources",
    title: "Weapon Parts Supply",
    description: "Weapon Parts for Arsenal upgrades.",
    cost: { currencyId: "coins", amount: 500 },
    rewards: [{ kind: "material", materialId: "weaponParts", amount: 60 }],
    sortOrder: 21,
    status: "active",
  },
  {
    id: "shop-material-module-parts",
    category: "resources",
    title: "Module Parts Supply",
    description: "Module Parts for Module upgrades.",
    cost: { currencyId: "coins", amount: 500 },
    rewards: [{ kind: "material", materialId: "moduleParts", amount: 60 }],
    sortOrder: 22,
    status: "active",
  },
  {
    id: "shop-material-companion-data",
    category: "resources",
    title: "Companion Data Supply",
    description: "Companion Data for Companion upgrades.",
    cost: { currencyId: "coins", amount: 550 },
    rewards: [{ kind: "material", materialId: "companionData", amount: 60 }],
    sortOrder: 23,
    status: "active",
  },
  {
    id: "shop-material-ability-cores",
    category: "resources",
    title: "Ability Cores Cache",
    description: "Ability Cores for Ship Abilities — priced above common parts.",
    cost: { currencyId: "coins", amount: 2500 },
    rewards: [{ kind: "material", materialId: "abilityCores", amount: 10 }],
    rarity: "rare",
    sortOrder: 24,
    status: "active",
  },
  {
    id: "shop-universal-shards",
    category: "resources",
    title: "Universal Ship Fragments",
    description: "Universal Shards — fills any ship's Star Rank shortage. A premium offer.",
    cost: { currencyId: "crystals", amount: 80 },
    rewards: [{ kind: "material", materialId: "universalShards", amount: 10 }],
    rarity: "rare",
    sortOrder: 25,
    status: "active",
  },

  // --- Energy ----------------------------------------------------------
  {
    id: "shop-energy-crystals-small",
    category: "energy",
    title: "Energy Cell — Small",
    description: "A quick top-up of Energy for more battles.",
    cost: { currencyId: "crystals", amount: 40 },
    rewards: [{ kind: "currency", currencyId: "energy", amount: 30 }],
    sortOrder: 30,
    status: "active",
  },
  {
    id: "shop-energy-crystals-large",
    category: "energy",
    featured: true,
    title: "Energy Cell — Large",
    description: "A bigger Energy refill at a better Crystal rate.",
    cost: { currencyId: "crystals", amount: 70 },
    rewards: [{ kind: "currency", currencyId: "energy", amount: 60 }],
    badge: "Best Value",
    sortOrder: 31,
    status: "active",
  },
  {
    id: "shop-energy-credits-small",
    category: "energy",
    title: "Energy Cell — Credits",
    description: "A modest Energy top-up paid in Credits.",
    // 120 Credits/Energy — deliberately priced ABOVE the highest
    // currently-existing repeat-clear rate (chapter 1's boss stage,
    // guaranteed + repeatClear combined, Nightmare-scaled: ~101.25
    // Credits/Energy — see shopVerification.ts's arbitrage check), so this
    // can never be a net-positive Credits loop against any stage that
    // exists today, even before Hard/Nightmare difficulty selection ships.
    cost: { currencyId: "coins", amount: 1200 },
    rewards: [{ kind: "currency", currencyId: "energy", amount: 10 }],
    sortOrder: 32,
    status: "active",
  },

  // --- Chests (Credits; Basic << Rare << Epic) --------------------------
  {
    id: "shop-chest-basic",
    category: "chests",
    title: "Basic Chest",
    description: "A Basic Chest — Credits, common materials, a small fragment chance.",
    cost: { currencyId: "coins", amount: 800 },
    rewards: [{ kind: "chest", chestId: "chestBasic", amount: 1 }],
    rarity: "common",
    sortOrder: 40,
    status: "active",
  },
  {
    id: "shop-chest-rare",
    category: "chests",
    featured: true,
    title: "Rare Chest",
    description: "A Rare Chest — bigger Credits and rarer materials.",
    cost: { currencyId: "coins", amount: 2500 },
    rewards: [{ kind: "chest", chestId: "chestRare", amount: 1 }],
    rarity: "rare",
    sortOrder: 41,
    status: "active",
  },
  {
    id: "shop-chest-epic",
    category: "chests",
    title: "Epic Chest",
    description: "An Epic Chest — the Shop's best Credits and materials, with a small Crystal chance.",
    cost: { currencyId: "coins", amount: 6000 },
    rewards: [{ kind: "chest", chestId: "chestEpic", amount: 1 }],
    rarity: "epic",
    sortOrder: 42,
    status: "active",
  },

  // --- Deferred (never rendered as purchasable — see PRIMARY RULE) -----
  {
    id: "shop-weekly-deal-bundle",
    category: "resources",
    title: "Weekly Deal Bundle",
    description: "A rotating timed bundle — future work (daily/weekly refresh system).",
    cost: { currencyId: "crystals", amount: 0 },
    rewards: [],
    sortOrder: 99,
    status: "planned",
  },
] as const;

/** Only offers the Shop screen may ever render as purchasable. */
export function getActiveShopOffers(): ShopOffer[] {
  return SHOP_OFFERS.filter((offer) => offer.status === "active").slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getActiveShopOffersByCategory(category: ShopCategory): ShopOffer[] {
  return getActiveShopOffers().filter((offer) => offer.category === category);
}

export function getFeaturedShopOffers(): ShopOffer[] {
  // Hero is rendered by its own panel — keep the Featured grid free of a
  // duplicate card for the same offer.
  return getActiveShopOffers().filter((offer) => offer.featured === true && !offer.hero);
}

export function getShopHeroOffer(): ShopOffer | null {
  return getActiveShopOffers().find((offer) => offer.hero === true) ?? null;
}

export function getShopOfferById(offerId: string): ShopOffer | null {
  return SHOP_OFFERS.find((offer) => offer.id === offerId) ?? null;
}

/** The one presentation helper every Shop card/confirmation/success view
 *  uses to render what an offer grants — reuses the same
 *  toRewardDisplayRows every other reward-facing screen already uses, so
 *  Shop never grows a second icon/label lookup. */
export function getShopOfferRewardRows(offer: ShopOffer): RewardDisplayRow[] {
  const resolved: ResolvedReward[] = offer.rewards.map((entry) => ({
    entry,
    source: "shop",
    rarity: offer.rarity ?? "common",
  }));
  return toRewardDisplayRows(resolved);
}
