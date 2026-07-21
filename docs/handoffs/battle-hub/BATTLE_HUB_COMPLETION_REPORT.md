# Battle Hub — Completion Report

Scope: Battle Hub screen only, per approved plan + corrections. Nothing beyond
it was touched.

## Files created

- `src/screens/battle/BattleHubScreen.tsx` / `.css` — the screen itself.
- `src/components/layout/HubHeader.tsx` / `.css` — Home-matching top bar, reused on Battle Hub.
- `src/components/navigation/HubBottomNav.tsx` / `.css` — Home-matching 5-tab bottom nav, reused on Battle Hub.
- `src/components/cards/CampaignFeatureCard.tsx` / `.css` — large Campaign hero card.
- `src/components/cards/ModeCard.tsx` / `.css` — Daily Operations / Boss Raid / Training / Active Event card.
- `src/components/cards/LockedModeCard.tsx` / `.css` — Endless Survival locked card.
- `src/components/feedback/CardCornerBadge.tsx` / `.css` — corner badge (Claim Reward / event reward icon).
- `src/components/icons/BattleModeIcon.tsx` — coded SVG icon set (no emoji/Unicode, no icon library).
- `src/data/battleHub.ts` — centralized reference-matching mock data.

## Files modified

- `src/app/routes.tsx` — added `"battle"` route (`#/battle`).
- `src/app/App.tsx` — renders `BattleHubScreen` for the battle route.
- `src/components/layout/AppShell.tsx` — suppresses the shared `BottomNavigation` on the battle route (Battle Hub renders its own `HubBottomNav` instead), same as Home.
- `src/components/stats/StatRow.tsx` — widened `icon` prop from `string` to `ReactNode` (backward compatible; existing callers unaffected).

**`HomeScreen.tsx` and `HomeScreen.css` were not touched.** Confirmed by file mtime: both last modified 2026-07-16, before this implementation session (2026-07-17) began.

## Components reused as-is

`AppShell`, `ScreenHeader` (styled via scoped CSS in `BattleHubScreen.css`, not modified itself), `NeonPanel` (untouched — see deviation below), `PrimaryButton`, `SecondaryButton`, `LockedContentModal`, `NotificationBadge`, `usePlayerStore`, `useHashRoute`.

## Coded SVG icons (`BattleModeIcon`)

`calendar`, `skull`, `target`, `shield`, `mapPin`, `chevron`, `lock` (the 7 specified) plus `star`, `swords`, `energy` — added for the Campaign card's internal stat rows (chapter stars / recommended power / your power / energy cost) so those rows don't mix coded SVG with anything else. No emoji, Unicode glyphs, or icon-library dependency anywhere in Battle Hub.

## Assets used

`MODE_ILLUSTRATION.campaign` (substitution, see below), `.dailyOperations`, `.bossRaid`, `.training` (used twice — once at full strength for Training, once as the Endless Survival locked texture), `.events`; `HOME_TOPBAR_FINAL` and `HOME_BOTTOM_NAV_FINAL` (via `HubHeader`/`HubBottomNav`); `RESOURCE_ICON.crystals`; `UTILITY_ICON.timer`; `REWARD_CHEST.basic`. All referenced through `assetRegistry.ts` — no hard-coded paths.

## Route & navigation

- `#/battle` — new route, renders `BattleHubScreen`.
- Bottom nav: Home → `#/home`, Battle → `#/battle` (active here), Fleet → `#/ships` (existing ship-selection screen, temporary per instruction), Inventory/Shop → `LockedContentModal`.
- Campaign card's "Chapter Map" and "Continue" both route to `#/campaign` (temporary, per instruction — Chapter Map/Pre-Battle don't exist as separate screens yet).
- Daily Operations, Boss Raid, Training, Active Event, Endless Survival → `LockedContentModal` with mode-specific copy.
- Every mode card is a full-card button (`<button>` wrapping the whole card), not just the chevron.

## Reference comparison

Compared section-by-section against `01_Battle_Hub.png`: header → BATTLE title/subtitle → Campaign hero card → Daily Operations/Boss Raid row → Training/Active Event row → locked Endless Survival card → bottom nav. Order, card count, and two-column grouping all match.

During this pass I caught and fixed three color mismatches against the reference that a first pass had missed:
- Campaign card's "Recommended Power" row now reads in magenta (was inheriting a neutral color); "Chapter Stars" and "Energy Cost" rows now read in gold (were inheriting cyan/neutral) — matching the reference's per-row tinting.
- Boss Raid's "Claim Reward" corner badge now uses a new purple tone (was defaulting to gold) to match the reference's purple hexagon badge and the card's own purple accent.

These were fixed by adding scoped CSS overrides in `CampaignFeatureCard.css` and a new `purple` tone on `CardCornerBadge` — no changes to the shared `StatRow` component's default styling.

**Known, disclosed substitutions (not defects):**
- Campaign card art is `MODE_ILLUSTRATION.campaign`, the closest approved asset — not a pixel match for the reference's exact Shattered Nebula scene. Kept right-aligned at a comparable scale with a left-to-right scrim for text readability.
- Endless Survival has no dedicated art; it reuses the Training illustration as a heavily desaturated/darkened background texture only (grayscale + brightness reduction + opacity + dark overlay), matching the reference's mostly-black locked treatment.
- Boss Raid's "3/6 tickets" is plain text with no ticket glyph in the footer (the reference has a small ticket icon before the text) — the corrections' content spec for Boss Raid didn't call out a footer icon, so this was left as text to avoid adding an icon slot the other three standard mode cards don't have.

## Header / bottom nav vs. Home

`HubHeader` and `HubBottomNav` are new components, not a refactor of Home — built as separate, pixel-for-pixel reproductions of Home's private inline `HomeTopBar`/`HomeBottomNav`, using the exact same `HOME_TOPBAR_FINAL`/`HOME_BOTTOM_NAV_FINAL` assets and the same CSS values (avatar, profile frame, name, level, XP bar/numbers, energy/coins/crystals + plus buttons, mail badge, settings icon; nav item shapes, icon art, labels, spacing, glow). This was the deliberate choice given your escape-hatch instruction — safer than extracting/refactoring Home itself.

One necessary, disclosed adaptation: `HubBottomNav` is `position: fixed` (Home's own nav is a static grid row, since Home never scrolls; Battle Hub's content is taller than one viewport and must scroll, so its nav has to stay pinned). Height still uses the project's existing `--bottom-nav-height` token. The only other difference is which tab is active — everything else is identical.

## Responsive behavior

Layout uses `clamp()`-based type sizes, a 2-column CSS grid for the four standard mode cards, and vertical scrolling (no viewport-height stretching). `AppShell`'s existing 520px-max-width cap applies, same as every other non-Home screen. A small grid-gap reduction kicks in under 360px width.

## Verification

- `tsc -b --noEmit`: clean, no errors.
- `vite build`: succeeds (102 modules, no errors). Note: builds were run with `--outDir` pointed outside the OneDrive-synced project folder — the project's own `dist/` directory is currently locked by stale files from a prior session that this sandbox can't unlink; this doesn't affect the source code or the real build process, just this verification run. Happy to clear it with your permission if you want `dist/` cleaned up.
- Confirmed via file modification time that `HomeScreen.tsx`/`.css` are untouched (last modified 2026-07-16, before this session).

## What I could not do: rendered screenshots

I was not able to produce actual rendered screenshots at 412×732 / 412×915 / 390×844 / 360×800 to diff against the reference pixel-by-pixel. This sandbox has no headless browser installed, no root access to install one (`apt-get` and `sudo` are both blocked), and Playwright's own Chromium download is blocked by the sandbox's network allowlist. In place of that, I did a manual, section-by-section structural and color comparison against `01_Battle_Hub.png` (documented above), which is how I caught the three color issues.

If you'd like true pixel screenshots, the most reliable option is for you to run `npm run dev` locally and open `#/battle` yourself — I'm glad to walk through anything that looks off once you've seen it rendered.

## Stopping here

Per your instruction, I'm stopping after Battle Hub. Not starting Campaign Overview or any other screen until you've reviewed this.
