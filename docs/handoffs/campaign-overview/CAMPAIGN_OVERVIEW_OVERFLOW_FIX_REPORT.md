# Campaign Overview — Mobile Horizontal-Overflow Fix Report

Scope: Campaign Overview layout only, plus a global `html`/`body`/`#root` safety net. Chapter Map, Home, Battle Hub, `HubHeader`, `HubBottomNav`, and the approved header/footer measurements are untouched.

## 1. Root cause

`.chapter-carousel__track` (`ChapterCarousel.css`) is a `flex: 1` child of `.chapter-carousel`, holding all 5 fixed-width `ChapterCard`s in a row (`display: flex`). It had `overflow-x: auto` but no `min-width: 0`.

Flex items default to `min-width: auto`, which resolves to the item's own **content min-width** — here, the summed width of its 5 fixed-width children:

- 4 standard cards × 132px + 1 current card × 148px = 676px
- 4 gaps × `--space-2` (8px) = 32px
- track's own horizontal padding (`2px` each side) = 4px
- **≈ 712px minimum**, before the two 20px edge-scroll buttons are even added.

That 712px floor is larger than every tested viewport (412 / 390 / 360px). Because `min-width: auto` overrides `flex-shrink`, the track could never shrink down to its allotted space — so `overflow-x: auto` never got the chance to do anything (there was no "smaller box holding wider content" for it to scroll). The track just rendered at ~712px+, and every ancestor with `overflow: visible` between it and the page (`.chapter-carousel`, `.campaign-overview__content`) let that width bleed straight through.

The reason this reached the whole page rather than stopping at `body`'s existing `overflow-x: hidden`: `#root` uses `display: flex; justify-content: center;` to center `.app-shell` in the viewport. An oversized descendant inside a centered flex parent bleeds out **symmetrically** — part of it sits at a negative x-offset (clipped off on the left) and the rest doesn't reach the right edge of the now-wider layout box (rendering as blank space on the right). That matches the reported symptom exactly: content clipped on the left, blank dark area on the right, header/footer staying near the true viewport width because they don't have an oversized child forcing them wider.

## 2. Exact CSS changes

**`src/components/campaign/ChapterCarousel.css`**
- `.chapter-carousel`: added `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;`
- `.chapter-carousel__track`: added `min-width: 0; max-width: 100%; box-sizing: border-box;` — **this is the actual fix.** `overflow-y: visible` was deliberately left as-is (not switched to `hidden`) so the current chapter's card glow/box-shadow, which extends above the track via a negative top margin, isn't clipped — this card uses `margin`, not `transform: scale()`, so it was never the mechanism the horizontal bug came from.

**`src/screens/campaign/CampaignOverviewScreen.css`**
- `.campaign-overview__content`: added `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box; overflow-x: hidden;`
- `.campaign-overview__rewards-row`: changed `grid-template-columns: 1fr 118px` → `grid-template-columns: 1fr` (always stacked, not just under a 359px breakpoint) and added `width/max-width/min-width`. Removed the old `@media (max-width: 359px)` override since single-column is now the default. Added `min-width: 0; max-width: 100%` to its direct children.
  - Reason for always-stacked: 5 chest icons alone need ~260px, which doesn't fit in a `1fr` column once a 118px sidebar + gap are subtracted from any of the tested widths (360/390/412px) — the two-column layout could never have fit on a real phone, independent of the flex bug above.

**`src/components/campaign/ChapterDetailPanel.css`**
- `.chapter-detail-panel`: added `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;` (defensive; this element wasn't a flex/grid item so wasn't actually contributing to the bug, but now matches spec explicitly).

**`src/components/campaign/ChapterStarRewardsTrack.css`**
- `.star-rewards-track`: added `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;`
- `.star-rewards-track__item`: added `min-width: 0;` (flex:1 item; icons are small enough this wasn't the actual culprit, but closes the same class of bug defensively).

**`src/components/campaign/ComingSoonChapterStrip.css`**
- `.coming-soon-strip`: added `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box;`
- `.coming-soon-strip__row`: added same four properties. (This row isn't itself a flex item competing for space with siblings, so it wasn't actually contributing to the bug — added for consistency/defense only.)

**`src/styles/reset.css`** (shared, global — not a Campaign-only file, added per your explicit "global mobile safety" requirement)
- New `html { width: 100%; max-width: 100%; overflow-x: hidden; }` rule. `body` already had `overflow-x: hidden` (in `globals.css`), but `html` didn't — some mobile browsers attribute the scrollable viewport to `html` rather than `body`, so this closes that gap. Also added `width: 100%; max-width: 100%;` to the existing `body` rule.

**`src/styles/globals.css`**
- `#root`: added `width: 100%; max-width: 100%; overflow-x: hidden;` alongside its existing `min-height: 100dvh; display: flex; justify-content: center;`.

None of these global/safety-net additions change any visual rendering when content already fits its box (which is true everywhere except the bug itself) — they only change behavior in the overflow scenario, so Home and Battle Hub are unaffected.

## 3. Before/after scrollWidth / clientWidth

No headless browser is available in this sandbox (confirmed again this round — same limitation as every previous verification round: no root access, Chromium download blocked by the network allowlist). I can't print literal `document.documentElement.scrollWidth`/`clientWidth` numbers. Reasoned from the CSS mechanism instead:

- **Before:** `.chapter-carousel__track`'s rendered width ≈ 712px+ (content-forced floor) at every tested viewport, regardless of `clientWidth`. `scrollWidth` of the document would track that ~712px+ figure (plus any additional margin from the centered-flex bleed), while `clientWidth` stays at the true device width (412 / 390 / 360) — the gap between the two is the bug.
- **After:** `.chapter-carousel__track` has `min-width: 0`, so it now shrinks to its actual flex-allotted width (viewport width minus the two 20px edge buttons and gaps — e.g. ~360px at a 412px device). Its content (~712px+) now overflows *inside* that correctly-sized box, which is exactly what `overflow-x: auto` is for — it scrolls internally instead of pushing its own box wider. Document `scrollWidth` should now equal `clientWidth` at all three tested widths.

If you can run `npm run dev` locally and share a URL, I can get you real numbers via the Chrome-extension path — that offer's still open.

## 4. Mobile viewport results (412×915, 390×844, 360×800, plus your own Android device width)

Same reasoning-based confirmation at all four: the only element with a content-driven width larger than viewport was the carousel track, and it's now uniformly constrained by `min-width: 0` regardless of viewport width — the fix isn't width-specific, so it should hold at 360px through 412px+ identically. The rewards-row stacking change is likewise width-independent now (always single-column).

## 5. Carousel still scrolls internally — confirmed

`.chapter-carousel__track` still has `overflow-x: auto`, `scroll-snap-type: x proximity`, and a hidden scrollbar; nothing about its internal scroll behavior changed — `min-width: 0` is what *enables* that scrolling to actually engage instead of being bypassed by the content-forced floor. `ChapterCarousel.tsx`'s scroll-into-view-on-mount and chevron scroll-by-one-card logic are unchanged.

## 6. Page no longer scrolls horizontally — confirmed (by construction)

With `min-width: 0` removing the only element with a wider-than-viewport content floor, and the `html`/`body`/`#root` safety net added on top, there is no remaining path for document-level horizontal overflow in this screen's current CSS.

## 7. Typecheck

`tsc -b --noEmit`: clean, no errors.

## 8. Build

`vite build`: succeeds, 121 modules (unchanged count — no files added/removed this round, only edited).

## Regression check

`HomeScreen.tsx`/`.css`, `BattleHubScreen.tsx`/`.css`, `HubHeader.tsx`/`.css`, `HubBottomNav.tsx`/`.css`, `HubScreenShell.tsx`/`.css`, and `AppShell.tsx` all confirmed unchanged (file size/mtime all predate this fix session).

## Known limitation

Same disclosed sandbox constraint as every prior round: this fix is validated by CSS-mechanism analysis, not a rendered screenshot or live DOM measurement. The `npm run dev` + Chrome-extension path remains open if you want literal runtime numbers.

---

Stopping here per your instruction. Not starting Campaign Chapter Map.
