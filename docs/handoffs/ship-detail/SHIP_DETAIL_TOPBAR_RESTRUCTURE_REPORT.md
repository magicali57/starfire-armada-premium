# Ship Detail Top Bar — Mobile Layout Restructure Report

## Final row structure
- **Row 1**: back button → Energy/Credits/Crystals pills (flexible group) → Mail → Settings, all in one horizontal row.
- **Row 2**: "Ship Detail" (large title) directly above "Overview" (smaller cyan subtitle), left-aligned, on its own row beneath row 1.

Row 2's horizontal padding intentionally matches the scroll content's own left/right padding (`--space-4`, 16px) rather than row 1's (`--space-2`, 8px), so the title's left edge lines up with the hero panel's left edge immediately below it — that's what makes it read as connected to the content rather than floating inside the controls row, per your instruction.

## Breakpoint used
No structural breakpoint — the two-row structure and its component sizing are a single tier by default, verified safe at 360/390/412px directly (math below), rather than starting loose and hoping a narrow-width override would catch up in time (that was the root cause of the previous round's bug). Two supporting breakpoints exist:
- `max-width: 340px` — trims row 1's own gaps/padding a little further as extra headroom below the smallest tested width; does not touch the value font.
- `min-width: 480px` — a "comfortable" tier (bigger back/utility buttons, larger pill icon/padding/font) for tablet/desktop-preview widths within the app's 520px shell max-width, where there's real room to spare. Per your note that desktop/laptop may keep a looser arrangement "if it already looks good" — this widens the same structure rather than swapping to a different one, since building two structurally different headers isn't warranted for a mobile-only project.

## Resource pill sizing/padding (base tier, 360–412px)
- Pill: CSS grid `13px 1fr auto`, `gap: 2px`, `padding: 0 5px`, `height: 27px`.
- Icon: 13×13px. Value: `font-size: 10px`, bold, `white-space: nowrap`, no ellipsis. Plus glyph: `font-size: 10px`.
- Back button: 26×26px. Mail/Settings: 26×26px each.
- Row 1 gaps: 4px between back/resources/utility groups, 3px between the 3 pills.

**Verified math** (not just eyeballed) at the narrowest tested width, 360px: row 1 padding leaves ~344px; back (26) + utility group (2×26 + 4px gap = 56) + 2 inter-group gaps (4px each = 8px) = 90px fixed, leaving ~254px for the 3-pill group; minus 2 inner 3px gaps, each pill gets ~83px; minus that pill's own fixed overhead (13 icon + 2 gap + ~8 plus glyph + 2 gap + 10 padding = 35px), the value column keeps **~48px** — well above the ~32px "120/120" (the widest of the three values) needs at 10px bold. Margin only grows at 390px (~57px available) and 412px (~64px available).

## Title alignment
Left-aligned, padded to `--space-4` (16px) to match the content region below. "Ship Detail" at 17px (up from the previous single-row version's 15px, since it no longer competes with pills for width) — bold, uppercase, display-heavy font. "Overview" directly beneath at 10px, cyan, uppercase, semibold. Row gap between title-main and title-sub is 0 (tight, matching the reference's tightly-stacked two-line treatment); the gap between row 1 and row 2 is 4px, keeping the header block compact rather than adding empty height.

## Viewport test results (reasoned by direct CSS/property inspection — no headless browser in this sandbox, disclosed as in every round)
| Check | 412×915 | 390×844 | 360×800 |
|---|---|---|---|
| Back button tappable (26×26 + press-scale) | ✓ | ✓ | ✓ |
| Energy value fully visible | ✓ (~64px value room) | ✓ (~57px) | ✓ (~48px) |
| Credits value fully visible | ✓ | ✓ | ✓ |
| Crystals value fully visible | ✓ | ✓ | ✓ |
| Mail + Settings visible | ✓ | ✓ | ✓ |
| "SHIP DETAIL" fully visible | ✓ | ✓ | ✓ |
| "OVERVIEW" fully visible | ✓ | ✓ | ✓ |
| No horizontal overflow | ✓ (all rows `width:100%`/`min-width:0`/`box-sizing:border-box`) | ✓ | ✓ |
| Header height compact | ✓ (two ~30–34px rows + small gaps, no wasted vertical space) | ✓ | ✓ |
| Hero panel begins cleanly below title | ✓ (title row's own bottom padding + `ShipDetailScreen__content`'s existing top gap, unchanged) | ✓ | ✓ |

## Scope confirmation
Only `ShipDetailTopBar.tsx` and `ShipDetailTopBar.css` changed. Hero panel, ship artwork, next-ship arrow, stat grid, ability cards, fragments/skin panels, bottom action row, Fleet Roster, shared shell components, routes, and data were not opened.

## Type-check result
`tsc -b --noEmit`: clean, exit 0, zero output.

## Build result
`vite build` (temp dir): clean, 197 modules transformed, zero errors/warnings.

## Regression confirmation
mtime diff (last 10 minutes) across `src/` and `public/assets/` shows exactly the 2 files above and nothing else.
