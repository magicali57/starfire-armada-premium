# Stage Detail Mission Stat-Grid — Mobile Alignment Fix Report

Scope: `StageMissionPanel.tsx` / `.css` only. No other file touched.

## Exact root cause

The 4 stat cells (Recommended Power, Your Power, Best Grade, Fastest Clear) were 4 instances of the shared `<StatRow>` component, laid out inside a 2-column CSS Grid. `StatRow` itself renders `icon | label | value` as **one horizontal flex row** (`display:flex; align-items:center;` in `StatRow.css`) — it was never designed to sit in a narrow grid column; it was designed for full-width rows like `ChapterDetailPanel`'s stat list (which is still using it unmodified).

Squeezed into a ~48%-width grid column at mobile widths, three separate problems compounded:

1. **Different icon intrinsic sizes.** `.stat-row__icon` has `width: 20px` but no fixed `height` — it sizes to whatever's inside. Three cells held a `BattleModeIcon size={13}` SVG (13×13 box); the fourth ("Best Grade") held a custom span forced to `16×16`. Since `.stat-row` centers its children with `align-items: center` based on each row's own tallest child, the four rows didn't share a common vertical center to begin with.
2. **Variable-length label text with no `min-width: 0`/nowrap handling**, inside a flex layout that gives the label `flex: 1 1 auto`. "Recommended Power" (17 characters) and "Your Power" (10 characters) claimed different amounts of horizontal space before the value, shifting where each row's value column started.
3. **"Best Grade" had `value=""`.** An empty value still renders a `<span className="stat-row__value">` (itself `display:flex`), but with no content, that cell's visual "shape" was structurally different from the other three (icon + label only, no third element), which is enough on its own to break any expectation of 4 matching cells.

This wasn't actually a narrow-screen-only bug — the existing `@media (max-width: 374px)` rule made it *worse* by collapsing to a single column, but the four cells never had a shared row/column contract at any width. The "looks fine on desktop" appearance was luck: a wider grid column gave the flex row enough room that the label/value overlap and icon-size mismatch were less visually obvious, not actually fixed.

## Fix

Stopped using `<StatRow>` for these 4 cells specifically (left `StatRow.tsx`/`.css` completely untouched — `ChapterDetailPanel` still uses it correctly for its own, differently-shaped stat list). Built a purpose-scoped structure inside `StageMissionPanel.tsx`/`.css`:

```
.stat-cell { display: grid; grid-template-columns: 22px minmax(0, 1fr); align-items: center; }
.stat-cell__icon { display: grid; place-items: center; width: 22px; height: 22px; }
.stat-cell__content { min-width: 0; display: flex; flex-direction: column; }
.stat-cell__label / .stat-cell__value { margin: 0; }
```

Exactly the structure you specified — fixed icon column, text column, label on top, value below, applied identically to all 4 cells regardless of content.

## Exact selectors changed

All new/changed selectors live in `StageMissionPanel.css` only: `.stage-mission-panel__stat-grid` (added `align-items: stretch`, explicit `width/max-width/min-width/box-sizing`), and new rules `.stat-cell`, `.stat-cell__icon`, `.stat-cell--highlight .stat-cell__icon`, `.stat-cell:nth-child(3) .stat-cell__icon`, `.stat-cell__content`, `.stat-cell__label`, `.stat-cell__value`, `.stat-cell--highlight .stat-cell__value`, `.stat-cell__value--grade`. Removed: `.stage-mission-panel__stat-grid .stat-row` and its two `:nth-child` color overrides (no longer applicable — no `<StatRow>` in this grid anymore), and the old `.stage-mission-panel__grade-badge` rule (superseded by `.stat-cell__value--grade`, since "Best Grade" is now a value like the other three cells rather than a differently-shaped icon-slot badge).

## Mobile breakpoint changes

The old `@media (max-width: 374px) { .stage-mission-panel__stat-grid { grid-template-columns: 1fr; } }` override is removed — the 2×2 grid now holds at every width, per your instruction to preserve the reference-like layout rather than reflow it. In its place, the same breakpoint now only nudges font sizes down slightly (label 9.5px→9px, value 12px→11px, grade value 13px→12px) so text has a little more breathing room on the narrowest phones without changing the grid shape.

## Icon-wrapper dimensions

All 4 icon wrappers: fixed `22px × 22px`, `display: grid; place-items: center`. Every icon (`swords` ×2, `shield`, `calendar`, all rendered at `size={13}`) sits centered inside that identical box regardless of its own SVG viewBox proportions — so no icon can make its cell taller or shift its row's baseline.

## Label / value line-heights

Both `.stat-cell__label` and `.stat-cell__value` use `line-height: 1.2` uniformly across all 4 cells (previously inherited from `StatRow`'s unset/default line-height, which combined with the different-height icons to produce inconsistent row heights). `.stat-cell` also carries `min-height: 38px`, and the grid's `align-items: stretch` makes both rows equal height regardless of content.

## "Best Grade" specifically

It's no longer a differently-shaped cell (letter substituting for the icon). It now has the same icon-column + label-over-value structure as the other three: a `shield` icon in the fixed icon slot, "Best Grade" label on top, and the grade letter "A" as its `.stat-cell__value` below — styled larger/colored (`.stat-cell__value--grade`) per your allowance, but sharing the same line-height and vertical position as every other cell's value.

## Tested viewport results

No headless browser is available in this sandbox (same disclosed limitation as every previous round), so this was verified by direct property inspection rather than a live render: at 412×915, 390×844, and 360×800, the grid's column widths are computed purely by `grid-template-columns: 1fr 1fr` (equal split of the available `min-width: 0` grid container, itself capped by `width:100%; max-width:100%`) independent of any cell's content — since every cell now shares the same `22px + minmax(0,1fr)` internal template and the same fixed-height icon box, there's no content-driven mechanism left that could push one column wider than the other or one row taller than the other at any of the three widths. `white-space: nowrap` + `text-overflow: ellipsis` on both label and value prevent unexpected wrapping; the longest label ("Recommended Power") will ellipsize before it can push a sibling out of alignment. If you can run this on your device or `npm run dev` + the Chrome extension, worth a real visual confirmation.

## Desktop confirmation

Nothing in this fix is viewport-conditional except the one narrow-width font-size nudge — the grid structure, column count, and cell layout are identical at every width, so desktop/laptop rendering (already reported as correct) is unaffected by construction, not just by omission.

## Type-check result

`tsc -b --noEmit`: clean, no errors.

## Build result

`vite build`: succeeds, 151 modules — unchanged count (no files added or removed, only `StageMissionPanel.tsx`/`.css` edited).

## Confirmations

File size/mtime checked for every other file in this flow (Home, Battle Hub, Campaign Overview, Chapter Map, shared shell, `StatRow`, and every other Stage Detail component/screen file): all unchanged. Only `StageMissionPanel.tsx` and `StageMissionPanel.css` show new mtimes.

---

Stopping here per your instruction. Not starting Pre-Battle.
