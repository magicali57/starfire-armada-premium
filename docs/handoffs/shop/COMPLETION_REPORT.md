# Shop Hub — Completion Report

## Status

Complete. In-game Shop at `#/shop` with canonical catalog, atomic purchase transaction, confirmation/success UI, and visual alignment to `04_Shop_Hub.png`.

## Shop WIP disposition

Continued from existing uncommitted Shop WIP (catalog, transaction, store action, route/nav wiring, verification). Completed missing pieces: Commander Supply Bundle hero, reference-aligned layout (hero + category tiles + offer cards), AppShell double-footer exclusion for `#/shop`, docs, and screenshots. Did not amend `0b0b147`.

## Visual reference used

`STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_1_Core_Hubs_and_Campaign/04_Shop_Hub.png`

## Route and categories

- Route: `#/shop` (`RouteId` `"shop"`)
- Entry: Home bottom nav + `HubBottomNav` Shop tab
- Categories (local tab state, no route duplication): **Featured**, **Resources**, **Energy**, **Chests**

## Catalog owner

`src/data/shopOffers.ts` — `SHOP_OFFERS` + `getActiveShopOffers` / `getActiveShopOffersByCategory` / `getFeaturedShopOffers` / `getShopHeroOffer` / `getShopOfferRewardRows`

Permanent hero: **Commander Supply Bundle** (`shop-commander-supply-bundle`) — Credits, Energy, Ship Alloy, Weapon Parts, Basic Chest for 200 Crystals.

## Transaction owner

`src/systems/rewards/purchaseShopOffer.ts` → `purchaseShopOfferTransaction`  
Store wrapper: `playerStore.purchaseShopOffer` (in-flight guard + persist-before-commit)

Flow: validate offer/active/price/balance → deduct into draft → `applyRewardBundle` → persist once → commit. Any failure returns original state untouched.

## Pricing assumptions (vs LAUNCH_ECONOMY_AUDIT)

- Active offers never zero/negative cost; payment currencies Credits or Crystals only.
- Credits packs: ~100–140 Credits per Crystal.
- Credits→Energy at 120 Credits/Energy — above chapter-1 Nightmare repeat ceiling (~101) to block Credits arbitrage.
- Chests: Basic 800 / Rare 2500 / Epic 6000 Credits.
- Ability Cores and Universal Shards priced as premium vs common parts.
- No Credits↔Crystals loop; Shop accelerates progression, does not replace gameplay.

## Intentional differences from the reference

- No $9.99 Starter Pack / IAP — replaced by Crystal-priced Commander Supply Bundle.
- No daily refresh countdown, purchase history, Ships/Cosmetics/Events/Crystals IAP categories.
- Category tiles adapted to Featured / Resources / Energy / Chests (2×2).
- Offer values from `SHOP_OFFERS`, not reference placeholder numbers.
- Purchased chests remain unopened (no auto Chest Opening navigation).

## Screenshots

- `docs/handoffs/shop/screenshots/shop-featured-412x915.png`
- `docs/handoffs/shop/screenshots/shop-featured-360x800.png`
- `docs/handoffs/shop/screenshots/shop-resources-412x915.png`
- `docs/handoffs/shop/screenshots/shop-confirm-412x915.png`
- `docs/handoffs/shop/screenshots/shop-success-412x915.png`

## Verification

- `scripts/verification/shopVerification.ts` — **348 assertions** passed
- `npx tsc -b --noEmit` — pass
- `npm run build` — pass; production bundle has **0** “Win Stage” / “Lose Stage” matches
- Schema: **unchanged** (v11); RewardSource adds `"shop"` (type-only, no migration)

## Unresolved

- Reference’s horizontal 3-up “daily recommendations” density is approximated with a 2-column mobile grid.
- `featured_offer_frame.png` remains uncleaned in the asset registry — hero uses CSS framing instead.
