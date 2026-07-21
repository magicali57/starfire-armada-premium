# Ship Detail — Mobile Fix Report (resource-pill visibility + chevron overlap)

## Issue 1 — root cause

The top bar was one long flex row: back button (fixed 36px) + title block (`flex: 0 0 auto`, non-shrinking) + a `flex: 1` resources group containing 3 pills (`flex: 1 1 0`, no width floor) + 2 utility buttons (fixed 30px each). That's 8 competing items in one row.

At a 360–412px viewport minus padding, the fixed items (back, title, 2 utility buttons, gaps) consumed roughly 200px+ before the 3 pills got anything, leaving each pill only ~35–45px. Inside that, the pill's own `padding: 0 8px 0 22px` (22px reserved for an absolutely-positioned icon) and the plus sign (`flex: 0 0 auto`, protected from shrinking) left almost nothing for the value span, which was `flex: 1; min-width: 0; overflow: hidden` — exactly the combination that lets a flex child shrink to a sliver of its content width. The icon stayed visible (absolutely positioned, outside the flex flow, unaffected by the squeeze) and the plus sign stayed visible (protected), but the value text's rendered box collapsed to near-zero width and was clipped away — invisible, not just small.

No single property was "wrong" in isolation; the bug was too many non-shrinking neighbors sharing one row with a value column that had no protected minimum.

## Fix

**`ShipDetailTopBar.tsx`** — split the bar into two rows: `ship-detail-top-bar__row1` (back + title + mail/settings, wrapped in a new `ship-detail-top-bar__utility-group`) and `ship-detail-top-bar__row2` (the 3 resource pills, now alone in a full-width row). This is the "two logical rows" option you authorized — the reference's top-to-bottom hierarchy (back/title first, resources visually grouped) is preserved, just wrapped instead of squeezed into one line.

**`ShipDetailTopBar.css`**:
- `.ship-detail-top-bar`: `flex-direction: column` (was `row`), holding the two new row wrappers.
- `.ship-detail-top-bar__title`: `flex: 0 0 auto` → `flex: 1 1 auto` (now the only flexible item in row1, so it no longer needs to fight pills for space).
- `.ship-detail-top-bar__pill`: rebuilt from `display:flex` + an absolutely-positioned icon into `display: grid; grid-template-columns: 18px 1fr auto;`. Icon and plus now sit in their own fixed/auto grid columns and can never encroach on the value column; the value column is `1fr` with `min-width: 0` so it's guaranteed a share of the pill's width instead of being squeezed by neighbors that don't need it.
- `.ship-detail-top-bar__pill-value`: removed `overflow: hidden` and `text-overflow: ellipsis` (you asked not to ellipsis the amount unless the reference does — it doesn't), font raised from 9px to 11px since row2 now has the full bar width for just 3 pills.
- `@media (max-width: 374px)`: now reduces pill gap/padding/icon size first (16px icon, 7px padding, 4px gaps) and only drops the value font to 10px as a last step — not 8px like before.

## Mobile pill dimensions (computed, at 360px viewport)
Row2 width available: 360 − 24 (side padding) = 336px, minus 2×6px gaps = 324px → **~108px per pill** at ≥375px, **~106px per pill** under the 374px breakpoint (4px gaps). Fixed grid overhead per pill: icon 18px (16px narrow) + 2×5px gaps (4px narrow) + plus glyph (~10px) + 2×9px padding (7px narrow) ≈ 55px (50px narrow) → **~50–58px left for the value text**, comfortably fitting the widest value ("120/120", 7 characters) at 11px (10px narrow) font.

## Issue 2 — chevron overlap fix

`ShipDetailHeroPanel.css`'s `.ship-detail-hero__cycle` was `position: absolute; right: -2px; top: 50%; transform: translateY(-50%)`, pinned over the vertical center of the art frame — on real devices this sat visibly on top of the ship artwork.

Restructured to your preferred pattern: `.ship-detail-hero__art-col` is now `display: flex; flex-direction: column; align-items: center` (art frame, then the chevron, as normal stacked flow children — no TSX change needed, the button was already a sibling of the art div, only its CSS position was wrong). `.ship-detail-hero__cycle` is now `position: static`, centered horizontally below the art via `align-self: center`, with the existing 6px column gap providing the spacing. It can no longer overlap the artwork, and since it sits inside `.ship-detail-hero__art-col` (not the info column), it also can't reach Power/Level/Star Rank/Weapon Level or the Equip/Locked row, which live in the separate info column and the actions row below the whole grid.

## Ship cycling — confirmed still functional
No logic changed — `onCycleNext`, `getFleetRosterOrder`, the `currentShipId` state update, and the `window.location.hash` sync in `ShipDetailScreen.tsx` were not touched. Traced the flow again: button → `onCycleNext` → `handleCycleNext` in `ShipDetailScreen` → next index in Fleet Roster order (wraps at the end) → `setCurrentShipId` + hash update. Unaffected by this CSS-only fix.

## Tested viewports (reasoned by direct CSS/property inspection — no headless browser in this sandbox, disclosed as in every prior round)
412×915, 390×844, 360×800: resource row now gets the full bar width with only 3 pills in it at every one of these widths, so icon + full value + plus all fit without shrinking below the computed floor above. Hero art stays within its 42%-width column; the chevron sits in normal flow beneath it with no overlap. No `100vw`, no absolute positioning left in either changed area, no property that could reintroduce horizontal overflow.

At the wider ~520px shell max-width (desktop/laptop preview), row1 and row2 both have substantially more slack than the 360px case above, so nothing regresses there either.

## Scope confirmation
Only `ShipDetailTopBar.tsx`, `ShipDetailTopBar.css`, and `ShipDetailHeroPanel.css` changed (`ShipDetailHeroPanel.tsx` needed no changes — the button/art markup was already correctly structured; only its CSS position was wrong). Fleet Roster, the shared shell, Ship Upgrade, `shipDetail.ts`, routes, the ability cards, stat grid, fragments/skin panels, and the bottom action row were not opened.

## Type-check result
`tsc -b --noEmit`: clean, exit 0, zero output.

## Build result
`vite build` (temp dir): clean, 197 modules transformed, zero errors/warnings.

## Regression confirmation
mtime diff (last 10 minutes) across `src/` and `public/assets/` shows exactly the 3 files listed above and nothing else.
