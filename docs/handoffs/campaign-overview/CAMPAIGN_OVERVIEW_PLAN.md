# Campaign Overview — Pre-Implementation Plan

Status: **planning only — no source files created or modified.** Awaiting approval before any coding begins.

## 1–3. Reference identification

- **Exact filename:** `05_Campaign_Overview.png`
- **Exact location in the handoff archive:** `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_1_Core_Hubs_and_Campaign/05_Campaign_Overview.png` (from `STARFIRE_ARMADA_UI_HANDOFF.zip`, freshly re-extracted this session to confirm — the full archive contains 53 reference screens across 6 batches plus one pre-batch file; `05_Campaign_Overview.png` is the only Campaign-Overview-labeled image in the set, so there is no ambiguity about which file is authoritative).
- **Image dimensions:** 941×1672 (portrait), same aspect family as the Battle Hub reference.
- This is the only reference opened or used for this plan. No other Campaign-related image (Chapter Map, Stage Detail) was substituted in its place.

## Target viewport

Primary comparison viewport: 412×732 (matches Battle Hub's primary check). Additional checks: 412×915, 390×844, 360×800 — same four viewports used for Battle Hub, per the mobile-only project convention.

## 4–5. Full top-to-bottom layout breakdown and reference mapping

| # | Reference section | Coded implementation |
|---|---|---|
| 1 | Shared top header (profile, XP, energy/credits/crystals, mail, settings) | `HubHeader` inside `HubScreenShell`, unchanged, reused exactly as Battle Hub uses it |
| 2 | "CAMPAIGN" title + "Explore the war sectors" subtitle, cyan flourish lines either side | `ScreenHeader`, styled via a new screen-scoped CSS block (same technique as `BattleHubScreen.css`'s flourish rules — no shared-component edits) |
| 3 | "CHAPTER MAP" button, top-right of the title row | New small button reusing `SecondaryButton` + `BattleModeIcon variant="mapPin"`, positioned via the screen's own header row (see §11) |
| 4 | Horizontal chapter carousel: 5 chapter cards (1 cleared, 1 active/current, 3 locked) with a connecting progress rail underneath (checkmark / active dot / lock nodes) | New `ChapterCarousel` + `ChapterCard` components (horizontally scrollable row) + new `ChapterProgressRail` component underneath |
| 5 | Large "Chapter Detail" feature panel for the currently-selected chapter: tag, chapter label, name, description paragraph, three stat rows, large illustration, "OPEN CHAPTER" button | New `ChapterDetailPanel` component — structurally similar to Battle Hub's `CampaignFeatureCard` but with a description paragraph and a single full-width CTA instead of two buttons |
| 6 | "CHAPTER STAR REWARDS" panel: 5 chest milestones (10/20/30/40/50) with a connecting progress line, claimed/next/locked states | New `ChapterStarRewardsTrack` component |
| 7 | "TOTAL CHAPTER STARS" side panel: large star + count/total, "STAR REWARDS" button | New `TotalStarsPanel` component (small, reuses `PrimaryButton`/`SecondaryButton` styling conventions) |
| 8 | "COMING SOON" strip: small locked-chapter chips (6, 7, 8 … 15) with pagination dots | New `ComingSoonChapterStrip` component |
| 9 | Shared bottom nav, **Battle** tab active | `HubBottomNav active="battle"` inside `HubScreenShell`, unchanged |

## 6–7. Every visible chapter card/section and exact order

Chapter carousel, left to right, exactly as shown:

1. **Chapter 1 — Veil Sector** — cleared (green "CLEARED" label, green checkmark badge, star count `30/30`)
2. **Chapter 2 — Shattered Nebula** — current/active (purple glow border/frame, gold star icon, `17/30`, "Stage 7 of 10")
3. **Chapter 3 — Iron Reach** — locked (`0/30`, lock icon)
4. **Chapter 4 — Void Frontier** — locked (`0/30`, lock icon)
5. **Chapter 5 — Dread Regime** — locked (`0/30`, lock icon)

Progress rail beneath, same order: check (green, chapter 1) → filled/active dot (purple glow, chapter 2) → lock → lock → lock, connected by a thin line, matching the reference exactly.

Below the main carousel, the "COMING SOON" strip shows, in order: Chapter 6, Chapter 7, Chapter 8, a pagination-dots indicator, then Chapter 15 — all labeled "UNKNOWN SECTOR" with a lock icon, implying chapters 9–14 exist but are paged/hidden behind the dots (not individually rendered). This matches "15 planned chapter positions" and "Chapters 1–5 available at public launch" from `SCREEN_NAVIGATION_MAP.md` (B-02) and `GAME_DESIGN_SYSTEMS_BLUEPRINT.md` §13.1 ("complete planned Campaign has 15 chapters … first public release contains Chapters 1–5") exactly.

## 8. Locked/unlocked state behavior

- **Cleared** (Chapter 1): full-color art, green "CLEARED" label, green checkmark badge in place of a lock, full star count shown, tappable (re-selects it into the detail panel below, does not restart it).
- **Current/active** (Chapter 2): full-color art, purple glow border on the card, gold star icon + partial star count, "Stage X of 10" label, tappable (already selected — reference shows it pre-selected on screen load).
- **Locked** (Chapters 3–5 and the "coming soon" strip): art shown but visually muted (the reference keeps these fully visible, not blacked out like Battle Hub's Endless Survival — a lighter desaturation is closer to the reference than a heavy grayscale treatment), `0/30`, gray lock icon instead of a checkmark/star-progress row, tapping opens `LockedContentModal` ("Chapter N unlocks after clearing Chapter N-1" or similar) rather than navigating anywhere.

## 9. Star/progress presentation

Two independent star systems appear on this screen, and they are **not the same number** — this is worth flagging explicitly so it isn't mistaken for a data inconsistency during implementation:

- **Per-chapter stars**: `17/30` for the active chapter (matches `GAME_DESIGN_SYSTEMS_BLUEPRINT.md` §13.3 — "each chapter has 30 total objective stars").
- **Account-wide "Total Chapter Stars"**: `17/150`, a separate cumulative milestone track with reward chests at 10/20/30/40/50 stars. This total-stars-with-150-cap reward track is not described anywhere in the governing docs (which only define the per-chapter 10/20/30 chest system) — it appears to be Overview-screen-specific account progression, so it will be implemented as its own reference-matching mock value, not derived from or reconciled with the per-chapter chest rules.

## 10. Reward presentation

- Chapter Star Rewards track: 5 chest icons (`REWARD_CHEST.basic/rare/epic/legendary` — only 4 tiers exist in the registry for 5 slots, see §16–18 for the substitution), each with a small badge (checkmark = claimed, star = available/next, lock = not yet reached), a milestone number + gold star icon underneath each (10★/20★/30★/40★/50★), and a thin progress line connecting them with a marker at the current position.
- Total Chapter Stars panel: large gold star icon, big number (17) over a smaller "/150", and a "STAR REWARDS" button below (outlined, matches `SecondaryButton` styling) — presumed to open the same rewards detail as the chest track, implemented as a `LockedContentModal` trigger ("Chapter Star Rewards detail is coming soon") since no rewards-detail screen exists yet.

## 11. Buttons and actions (every tap target)

| Element | Action |
|---|---|
| "CHAPTER MAP" (top-right of title row) | Navigate to Chapter Map — temporary target: existing `campaign` route (today's stage-list `CampaignScreen`), same temporary-routing pattern Battle Hub already uses, until Chapter Map (reference `06_Campaign_Chapter_Map.png`) is built as its own screen |
| Chapter card — cleared or current | Selects that chapter into the `ChapterDetailPanel` below (local state, no navigation) |
| Chapter card — locked | Opens `LockedContentModal` ("Chapter N is locked") |
| "OPEN CHAPTER" (detail panel CTA) | Navigate to Chapter Map for the selected chapter — same temporary `campaign` route target as "CHAPTER MAP" |
| "STAR REWARDS" button | Opens `LockedContentModal` ("Chapter Star Rewards coming soon") |
| Chest icons (star rewards track) | Opens `LockedContentModal` per chest, using its claimed/available/locked state in the message |
| "COMING SOON" chips (chapters 6+) | Opens `LockedContentModal` ("Chapter N unlocks in a future update") |
| Bottom nav | Same behavior as Battle Hub's `HubBottomNav` — Home/Battle/Fleet navigate, Inventory/Shop open `LockedContentModal`; **Battle stays the active tab** on this screen (confirmed both by the reference screenshot itself, which shows Battle highlighted, and by `STARFIRE_ARMADA_SCREEN_AND_NAVIGATION_MAP.md` line 149, "Campaign Stage Details keeps Battle active") |
| Header (profile/resources/mail/settings) | Unchanged from `HubHeader`'s existing behavior |

Entire chapter cards are tappable, not just an inner button, matching the Battle Hub convention.

## 12. Exact text shown in the reference

`CAMPAIGN` (title) · `Explore the war sectors` (subtitle) · `CHAPTER MAP` · `CHAPTER 1` / `VEIL SECTOR` / `CLEARED` / `30/30` · `CHAPTER 2` / `SHATTERED NEBULA` / `17/30` / `Stage 7 of 10` · `CHAPTER 3` / `IRON REACH` / `0/30` · `CHAPTER 4` / `VOID FRONTIER` / `0/30` · `CHAPTER 5` / `DREAD REGIME` / `0/30` · `CHAPTER 2` / `SHATTERED NEBULA` (detail panel repeat) / "The nebula hides ancient powers and scattered fleets. Push through the chaos and sever the enemy's supply routes." / `CHAPTER STARS 17/30` / `RECOMMENDED POWER 11,900` / `CURRENT STAGE 7/10` / `OPEN CHAPTER` · `CHAPTER STAR REWARDS` / `10★ 20★ 30★ 40★ 50★` · `TOTAL CHAPTER STARS` / `17` / `/150` / `STAR REWARDS` · `COMING SOON` / `CHAPTER 6/7/8/15` / `UNKNOWN SECTOR` (×4).

## 13–15. Components — reuse, extend, create

**Reuse as-is (no changes):** `HubScreenShell`, `HubHeader`, `HubBottomNav`, `ScreenHeader`, `SecondaryButton`, `PrimaryButton`, `BattleModeIcon` (variants: `star`, `swords`, `lock`, `chevron`, `mapPin`, plus a possible new `check` variant — see below), `CardCornerBadge`, `LockedContentModal`, `usePlayerStore`, `navigate`.

**Small extensions:**
- `BattleModeIcon` — add a `check` variant (a coded checkmark, matching the Battle Hub precedent of extending this icon set with a couple of extra variants beyond the original spec, documented the same way) for the cleared-chapter badge and the progress-rail's cleared node. No existing variant covers a plain checkmark.
- `CardCornerBadge` already supports `gold`/`success`/`purple` tones (the last added during Battle Hub's alignment fixes) — likely sufficient as-is for chest badges; will confirm during implementation rather than pre-emptively adding a 4th tone.

**New reusable components proposed** (all screen-owned, under `src/components/campaign/` and `src/components/cards/` following the existing folder convention):
- `ChapterCard` — single carousel card (art, tag/label, name, star row, cleared/active/locked treatment).
- `ChapterCarousel` — horizontally-scrollable row wrapper + the connecting progress rail beneath it.
- `ChapterDetailPanel` — the large feature panel for the selected chapter (tag, name, description, 3 stat rows, art, CTA).
- `ChapterStarRewardsTrack` — the 5-chest milestone strip with its progress line and badges.
- `TotalStarsPanel` — the small side panel (star count/total + button).
- `ComingSoonChapterStrip` — the small locked-chip row with pagination dots.

This is a larger new-component count than Battle Hub needed, because Campaign Overview has no single reusable analogue to `ModeCard` — the carousel card, detail panel, and reward track are each genuinely distinct layouts in the reference.

## 16–18. Assets — approved, and known substitutions

**Available and directly usable:**
- `MODE_ILLUSTRATION.campaign` — the "Shattered Nebula" scene already approved as Battle Hub's Campaign-card substitute; reused here for both Chapter 2's carousel thumbnail and its large detail-panel illustration (thematically correct — same chapter, same art).
- `CHAPTER_BACKGROUND_IMAGE["chapter-01"]` (`chapter_01_void_frontier.png`) — the only other chapter-scale illustration in the project.
- `REWARD_CHEST.basic/rare/epic/legendary` (4 tiers, for the 5-slot reward track — see substitution below).
- `RESOURCE_ICON.crystals`, `UTILITY_ICON.lock`, `UTILITY_ICON.timer` — already integrated.
- `BattleModeIcon` coded variants (`star`, `swords`, `lock`, `chevron`, `mapPin`).

**Known gap — chapter art:** the reference shows five fully distinct chapter illustrations (a planet/asteroid vista for Veil Sector, the nebula scene for Shattered Nebula, an industrial ruin for Iron Reach, a black-hole/portal scene for Void Frontier, a red fortress for Dread Regime). The project only has two chapter-scale illustrations available (`chapter_01_void_frontier.png` and `MODE_ILLUSTRATION.campaign`). Proposed substitution, to be disclosed in the completion report exactly like Battle Hub's Campaign-art substitution:
- Chapter 1 (Veil Sector, cleared): `chapter_01_void_frontier.png` (closest available "space vista," despite its filename mismatching the chapter name).
- Chapter 2 (Shattered Nebula, active): `MODE_ILLUSTRATION.campaign` (genuinely correct match).
- Chapters 3–5 (locked): reuse the same two illustrations (alternating or repeating) rather than pulling in thematically unrelated mode illustrations (Boss Raid/Training/Event art), since locked cards are visually de-emphasized anyway and a mismatched-but-plausible space scene reads better than a clearly-wrong one.
- This is the single biggest fidelity risk on this screen and is flagged here for a decision: proceed with the substitution as described, or commission/generate three additional distinct chapter illustrations first. Either is a reasonable choice; this plan does not assume new art generation without confirmation.

**Reward chest tiers (4 available, 5 needed):** propose basic → rare → rare/epic (visually emphasized as the "next" milestone, matching the reference's larger gold-toned 3rd chest) → epic → legendary, i.e. repeating `rare` once, since the reference's own chest artwork also doesn't strictly escalate rarity 1-for-1 with each milestone (the 3rd chest is simply drawn larger/gold-highlighted as the "current focus" chest, not necessarily a distinct 5th tier).

Not used: no new files needed outside existing `public/assets/ui-v2/` — no scattered paths, all through `assetRegistry.ts`.

## 19–21. Navigation and routes

**Current routes relevant here:** `home`, `battle`, `campaign` (`#/campaign`, today renders the legacy single-chapter stage-list `CampaignScreen`), `ship-selection`, `ship-upgrade`, `gameplay`, `results`.

**Proposed route change:** retarget the existing `"campaign"` RouteId to render the new `CampaignOverviewScreen` (this is the natural entry point of the campaign flow, matching `SCREEN_NAVIGATION_MAP.md`'s own `campaign` → Campaign Overview naming), and add one new RouteId (proposed: `"campaign-chapter-map"`, `#/campaign/chapter-map`) for the existing legacy stage-list screen so it isn't lost — it becomes the temporary stand-in for the not-yet-built Chapter Map (reference `06_Campaign_Chapter_Map.png`), and both "CHAPTER MAP" and "OPEN CHAPTER" on the new Overview screen target it.

Important consequence: because `BattleHubScreen.tsx`'s Campaign card already calls `navigate("campaign")` for both its "Chapter Map" and "Continue" buttons, **no change is needed in `BattleHubScreen.tsx` itself** — it will automatically start opening the new Campaign Overview screen once the route's target component changes, which is the correct, intended behavior (Battle Hub → Campaign Overview → Chapter Map, matching the approved flow).

Noted for the record but out of scope for this task: the handoff's long-term routing convention nests campaign under Battle (`#/battle/campaign`, `#/battle/campaign/:chapterId`, etc., per `STARFIRE_ARMADA_SCREEN_AND_NAVIGATION_MAP.md` lines 266–268 and 2070). This plan keeps the current flat `#/campaign` hash scheme, consistent with how Battle Hub's own routing was kept flat rather than pre-emptively restructured — a full URL-nesting migration is a separate, larger change this task doesn't attempt.

`INTEGRATION_PLAN.md`, named in the task instructions, was not found under that exact name anywhere in the handoff archive or the project's `docs/` tree; the equivalent integration-planning material lives in `docs/audit/` (the batch deliverables and code audit) and was reviewed as part of "existing code and assets" inspection instead.

## 22. Scroll behavior

Same pattern as Battle Hub: the screen's content sits in `HubScreenShell`'s scrollable middle row (hidden scrollbar, `overflow-y: auto`), header and footer fixed via the shared grid shell. The chapter carousel itself scrolls **horizontally** within that vertically-scrolling page — a nested `overflow-x: auto` row, also with its scrollbar hidden, touch/drag-scrollable, with the same "COMING SOON" pattern for its own horizontal strip.

## 23. Safe-area handling

Inherited entirely from `HubScreenShell` (top safe-area inset + the exact Home-derived grid) — nothing screen-specific needed, exactly like Battle Hub.

## 24–25. Responsive behavior and touch targets

Same four-viewport check as Battle Hub (412×732 primary, 412×915, 390×844, 360×800), no vertical stretching, portrait-only. Chapter cards and the coming-soon chips need a defined minimum width so they don't compress illegibly on 360px-wide screens (carousel scrolls instead of shrinking indefinitely). All tappable elements kept at or above the project's existing ~44px touch-target convention.

## 26–28. Exact files to create / modify / route changes

**Create:**
- `src/screens/campaign/CampaignOverviewScreen.tsx` / `.css` (new screen; the existing `CampaignScreen.tsx`/`.css` are left alone and re-routed, not edited)
- `src/components/campaign/ChapterCard.tsx` / `.css`
- `src/components/campaign/ChapterCarousel.tsx` / `.css`
- `src/components/campaign/ChapterDetailPanel.tsx` / `.css`
- `src/components/campaign/ChapterStarRewardsTrack.tsx` / `.css`
- `src/components/campaign/TotalStarsPanel.tsx` / `.css`
- `src/components/campaign/ComingSoonChapterStrip.tsx` / `.css`
- `src/data/campaignOverview.ts` — new, reference-matching mock data (chapter names/themes/stars/power/stage exactly as listed in §12), following the same "prototype data, connect to real state later" convention as `battleHub.ts`. Deliberately separate from the real `data/campaign.ts` (today's single "Fractured Frontier" chapter used by actual stage/gameplay logic) rather than extending that type, for the same reason Battle Hub's mock data was kept separate from real player/campaign state.

**Modify:**
- `src/app/routes.tsx` — retarget `"campaign"`, add `"campaign-chapter-map"`.
- `src/app/App.tsx` — render `CampaignOverviewScreen` for `"campaign"`, render the existing `CampaignScreen` for the new `"campaign-chapter-map"` route.
- `src/components/layout/AppShell.tsx` — extend `showBottomNav` suppression to include the new Campaign Overview route (same reason as Battle: it renders its own `HubScreenShell`/`HubBottomNav` and must not double up with the old shared `BottomNavigation`). The relocated legacy stage-list screen keeps using the old shared header/nav as it does today, so it's excluded from this suppression list.
- `src/components/icons/BattleModeIcon.tsx` — add the `check` variant (small, additive).

**Not modified:** `HomeScreen.tsx`/`.css`, `HubHeader`/`HubBottomNav`/`HubScreenShell` (any of their `.tsx`/`.css`), `BattleHubScreen.tsx` (its `navigate("campaign")` calls just start pointing somewhere more correct), `data/campaign.ts`, `data/ships.ts`.

## 29. Registry exports used

`MODE_ILLUSTRATION.campaign`, `CHAPTER_BACKGROUND_IMAGE`, `REWARD_CHEST.*`, `RESOURCE_ICON.crystals`, `UTILITY_ICON.lock`, `UTILITY_ICON.timer` — all existing exports, no new registry entries required unless the art-gap decision in §16–18 results in commissioning new chapter illustrations.

## 30. How the shared header/footer remain unchanged

Campaign Overview consumes `HubScreenShell`/`HubHeader`/`HubBottomNav` exactly as Battle Hub does — same props pattern (`header`, `footer`, children), same grid mechanics, only `active="battle"` passed to the nav (Battle stays highlighted, matching the reference and the navigation map). None of those three shared files are touched by this task. This is the direct benefit of last task's alignment fix: Campaign Overview inherits pixel-identical header/footer for free, with zero risk of re-introducing the sizing/padding/font-family bugs already found and fixed.

## 31. Build checks (planned for the implementation phase)

`tsc -b --noEmit`, `vite build`, confirm `HomeScreen.tsx`/`.css` and `BattleHubScreen.tsx`/`.css` byte-unchanged (mtime check, same method used for the last three Battle Hub fixes), confirm the old `CampaignScreen` still renders correctly at its new route, confirm no double bottom-nav on the Campaign Overview route.

## 32. Screenshot-comparison process

Same disclosed limitation as Battle Hub: this sandbox has no headless browser and cannot install one (no root, network allowlist blocks Chromium download). Verification will again be a manual, section-by-section structural/property comparison against `05_Campaign_Overview.png`, cross-checked property-by-property against `HomeScreen.css`/`BattleHubScreen.css` conventions rather than eyeballed — the same approach that caught the real specificity/padding/font-family bugs in the last two Battle Hub rounds. If a live check is wanted, the `npm run dev` + Chrome-extension path already offered still stands.

## 33. Visual acceptance checklist (for the implementation phase, not yet run)

- Portrait orientation only, no desktop/web-dashboard layout
- Header/footer pixel-aligned with Home and Battle (inherited automatically via `HubScreenShell`)
- Battle tab active in the bottom nav
- Section order matches §4–5 exactly
- All 5 launch chapters shown in the carousel, correct order, correct cleared/active/locked states
- Card proportions, spacing, and the progress rail match the reference's relative scale
- Per-chapter stars (17/30) and total stars (17/150) are visually distinct, not conflated
- Chest reward track shows correct claimed/next/locked badges in order
- Locked chapters and "coming soon" chips read as clearly locked without the heavy full-black treatment used for Endless Survival (reference keeps locked chapter art visible, just muted)
- Chapter/detail illustration scale and crop reasonably match the reference given the disclosed art substitutions
- Colors, metallic/neon borders, and glow strength match the established token palette (no new ad-hoc colors)
- No full reference image used as a background anywhere
- Every button/card/chip is a real coded control with a real tap handler, not a static image
- Vertical page scroll and horizontal carousel scroll both function, scrollbars hidden
- Safe-area behavior inherited correctly
- Home and Battle Hub remain completely unchanged

---

Stopping here per instruction — awaiting approval before creating or modifying any source files for Campaign Overview.
