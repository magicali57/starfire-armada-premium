# Campaign Chapter Map — Pre-Implementation Plan

Planning only. No source files created or modified.

## 1–4. Authoritative reference

1. **Exact filename:** `06_Campaign_Chapter_Map.png`
2. **Exact location:** `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_1_Core_Hubs_and_Campaign/06_Campaign_Chapter_Map.png` (the same 53-screen handoff collection `05_Campaign_Overview.png` came from — sibling file in the same folder, confirmed side-by-side: `01_Battle_Hub.png`, `02_Fleet_Roster.png`, `03_Inventory_Hub.png`, `04_Shop_Hub.png`, `05_Campaign_Overview.png`, `06_Campaign_Chapter_Map.png`, `07_Campaign_Stage_Detail.png`).
3. Opened and inspected the full image at native resolution (941×1672) plus 4 cropped/zoomed regions (top header/title, description+chests panel, left stage column, right stage column) for pixel-level detail.
4. This is the sole visual target. Not substituted with Campaign Overview or Stage Detail. Not memory-based — every detail below was read directly off the image this session.

## Target portrait viewport

Same as every other hub screen: portrait-only, capped at `--shell-max-width: 520px`, tested at 412×915, 390×844, 360×800, and your own Android device width. No desktop/web layout considered (per project convention).

## 5. Full top-to-bottom layout breakdown

1. **Shared header** — `HubHeader` (profile block, 3 resource pills, mail, settings) — identical to Home/Battle Hub/Campaign Overview, unmodified.
2. **Back/title row** — back-arrow button (left) · "CHAPTER 2" title + "SHATTERED NEBULA" subtitle (centered) · info (`i`) icon button (right). New to this screen — Campaign Overview has no back button or per-chapter title row.
3. **Chapter intro panel** — flavor text (2 lines) · "— CHAPTER REWARDS —" label + 3 reward icons (gem/coin/chest with counts) on the left · chapter background art (nebula/ship-formation scene) bleeding in from the right, scrimmed · "🔍 VIEW REWARDS" button pinned bottom-right of the art.
4. **Chapter stars + chest-progress bar** — "⭐ CHAPTER STARS 17/30" (left) · a horizontal 3-chest milestone row (10 claimed / 20 claimable / 30 locked) with a connecting progress line (right). Same *pattern* as Campaign Overview's `ChapterStarRewardsTrack` but a different, chapter-scoped dataset (3 chests, not 5) — a sibling component, not a reused instance.
5. **Stage map** — two parallel vertical tracks of octagonal stage nodes (left: stages 1–5, right: stages 6–10), connected by straight vertical lines within each track and one rounded L-shaped connector bridging stage 5 to stage 6. Stage 10 is a large, ornate red/crimson "boss" crest instead of the standard octagon.
6. **Shared footer** — `HubBottomNav`, Battle tab active, identical to every other hub screen.

## 6. Exact chapter displayed

Chapter 2 — "Shattered Nebula" (matches Campaign Overview's current chapter exactly — the Chapter Map opens on the player's in-progress chapter, consistent with `CAMPAIGN_OVERVIEW_CHAPTERS`'s chapter-02 being `current`).

## 7. Exact number of visible stage nodes

10 (Stages 1–10, Stage 10 is the boss). Matches the navigation map doc's own B-03 spec: "Browse the chapter's 10 stages."

## 8. Exact stage-node order

Two parallel columns, not one long list: **left column** 1→2→3→4→5 top-to-bottom, **right column** 6→7→8→9→10 top-to-bottom. Reading/unlock order is 1 through 10 in sequence; the path visually snakes from the bottom of the left column up to the top of the right column via the connector, then straight down through 7/8/9/10 to the boss.

## 9. Exact completed/current/locked state per node

| Stage | State | Border/glow |
|---|---|---|
| 1–5 | completed | bright cyan glow octagon |
| 6 | completed | bright cyan glow octagon |
| 7 | **current** (tagged "CURRENT" below the node) | bright cyan glow octagon |
| 8 | locked* | dim/muted metallic border, no glow |
| 9 | locked* | dim/muted metallic border, no glow |
| 10 | locked*, boss | ornate red/crimson crest, distinct shape |

\* **Flagged for your confirmation:** the reference shows no explicit padlock badge on stage 8/9's nodes themselves (unlike Campaign Overview's `ChapterCard--locked`, which does show one) — only a duller border distinguishes them from 6/7. I'm reading them as "locked" because (a) only one stage is tagged "current" and a linear campaign typically locks everything after it, and (b) your own Navigation section requires a "locked stage → LockedContentModal" behavior somewhere on this screen. If you intended 8/9 to be freely browsable ("available", not locked), tell me and I'll adjust the data/behavior before building.

## 10. Exact star count/progress per node

Recorded exactly as shown, not adjusted for logical consistency:

- Stages 1–6: 3/3 gold stars.
- Stage 7 (current): 3/3 gold stars shown (this is unusual for an in-progress stage but is what the reference displays — flagged, not corrected).
- Stage 8: 2 gold + 1 gray star.
- Stage 9: 1 gold + 2 gray stars.
- Stage 10 (boss): 1 gold + 2 gray stars.

**Flagged:** stages 8/9/10 showing partial stars despite not being reachable yet (if "locked" per #9) is internally inconsistent with typical campaign logic. I'll store these values exactly as reference-matching prototype data (same convention as Campaign Overview's own disclosed data quirks) rather than silently zeroing them out — call it out if you'd rather I use 0/3 for genuinely locked/unplayed stages.

## 11. Reward/milestone nodes

Chapter-level chest row only (10★ / 20★ / 30★ thresholds — matches the navigation map doc's B-03 spec verbatim: "Chapter chest thresholds: 10/20/30"). No separate reward nodes embedded in the stage path itself.

Chest → tier mapping, matched by opening the actual `REWARD_CHEST` art and comparing colors/ornamentation against the reference's 3 chests:

| Threshold | Reference chest color | Closest registry tier | State |
|---|---|---|---|
| 10★ | gold/orange, ornate | `legendary` | claimed (green check) |
| 20★ | purple/magenta, ornate | `epic` | claimable ("CLAIM", cyan) |
| 30★ | blue/cyan, plain | `basic` | locked (gray "LOCKED") |

This is a reversed tier order from what "10 < 20 < 30" might suggest (the reference uses its most ornate/gold chest for the lowest threshold), but it's what's shown — reference-matched, not logic-corrected, same as Campaign Overview's own disclosed 30★-highlight quirk.

## 12. Boss-stage presentation

Stage 10 uses a completely different node shape from stages 1–9: a red/crimson ornate crest (spiked border, small diamond/gem accent at the top, a laurel-like flourish at the base) rather than the octagon badge. Labeled "BOSS" in red above "STAGE 10" in white — the only node with a two-line label instead of one.

## 13. Connecting-path behavior

Straight vertical line segments connect adjacent nodes within each column (1-2-3-4-5, 6-7-8-9-10). One rounded-corner connector (two 90° turns) bridges the bottom of the left column (stage 5's row) up to the top of the right column (stage 6's row) — a right-then-up route through the gap between the two columns. This is a static decorative path (CSS/SVG lines), not a scroll-driven or animated one. Exact pixel routing (which row-height stage 6 sits at relative to stage 1) will be measured directly from the reference image during implementation rather than guessed here — treated as an approximation, same disclosed approach as `ChapterProgressRail`'s connector.

## 14. Exact labels and buttons shown

"CHAPTER 2" / "SHATTERED NEBULA" · back button (icon only) · info button (icon only) · flavor text (2 lines) · "— CHAPTER REWARDS —" · 3 reward amounts (500 / 250K / 5) · "VIEW REWARDS" button (with a search/magnifying-glass icon) · "CHAPTER STARS" + "17/30" · "10"/"20"/"30" chest labels + "CLAIM"/"LOCKED" state labels · "STAGE 1"–"STAGE 10" labels · "CURRENT" tag (stage 7 only) · "BOSS" label (stage 10 only).

## 15. Back-navigation behavior

Back button → `navigate("campaign")` (returns to Campaign Overview, matching the approved flow: Battle Hub → Campaign Overview → Campaign Chapter Map → Stage Detail → Pre-Battle).

## 16–18. Components: reuse / small extensions / new

**Reused as-is (no modification):** `HubScreenShell`, `HubHeader`, `HubBottomNav`, `ScreenHeader` (not used here — this screen's title row is bespoke, see #33), `IconButton`, `SecondaryButton`, `LockedContentModal`, `navigate`/routing helpers, `usePlayerStore`.

**Small extensions:** `BattleModeIcon` gets 2 new coded SVG variants — `search` (magnifying glass, for "VIEW REWARDS") and `info` (circled "i", for the info button) — following the exact same pattern as the existing 11 variants (`currentColor`, no emoji/Unicode). `skull` (already exists) is available if a boss marker needs a small inline icon in addition to the crest artwork, though the crest is expected to carry the boss identity visually on its own.

**New components (`src/components/campaign-map/`):**
- `ChapterMapHeaderBar` — back button + title/subtitle + info button.
- `ChapterMapIntroPanel` — flavor text, chapter rewards row, background art, "VIEW REWARDS" button.
- `ChapterStarChestTrack` — the 3-chest chapter-progress row (sibling to Campaign Overview's `ChapterStarRewardsTrack`, not a shared instance — different data shape: 3 chests vs. 5, different labels "CLAIM"/"LOCKED" vs. plain star-count).
- `StageMapPath` — the two-column node layout + connector lines + boss crest, the core new piece.
- `StageNode` — one coded stage button (octagon variant + boss-crest variant via a prop), used inside `StageMapPath`.

## 19–21. Assets

**Approved assets to use:**
- `MODE_ILLUSTRATION.campaign` — Chapter 2's nebula/ship-formation art, for the intro panel (same asset already approved for this exact scene in Battle Hub and Campaign Overview's Chapter 2 card — reused, not the reference screenshot itself).
- `REWARD_CHEST.legendary` / `.epic` / `.basic` — the 3 chapter-chest images (see #11).
- `BattleModeIcon` variants: `chevron` (back button, rotated 180°, same technique as `ChapterCarousel`'s edge buttons), `check` (10★ claimed badge), `lock` (if a locked-stage badge is added to nodes), `star` (per-node star pips), plus the 2 new `search`/`info` variants above.

**Unavailable reference assets and substitutes:**
- No dedicated "stage node" or "boss crest" artwork exists in the approved asset pack — both will be coded (CSS clip-path/border/glow + inline SVG), following the same substitution precedent as `ChapterCard`'s clip-path polygon badge and `ChapterProgressRail`'s coded nodes. This is the single biggest fidelity gap on this screen, same category of disclosed gap as Campaign Overview's chapter-art reuse.
- No dedicated "connector path" art — coded as CSS lines/borders (or a small inline SVG), same as `ChapterProgressRail`.
- No magnifying-glass or info icon in the current asset pack or `BattleModeIcon` — added as 2 new coded SVG variants (#16–18).

## 22. Navigation destination per stage node

- Stages 1–7 (completed/current): → Stage Detail. Stage Detail doesn't exist yet — temporary destination is a placeholder route (`#/campaign/stage-detail/:stageId` or a simpler `#/campaign/stage-detail` with the tapped stage id kept in local state/store) that renders a minimal placeholder screen, not a dead link and not `LockedContentModal`. Exact placeholder behavior proposed in #26 below.
- Stages 8–9 (locked, pending your confirmation on #9): → `LockedContentModal` ("Clear Stage 7 to unlock Stage 8", etc.).
- Stage 10 (boss, locked): → `LockedContentModal` with boss-specific copy, until unlocked.
- Reward chests (10/20/30 row): claimed chest → informational modal ("already claimed"); claimable chest → `LockedContentModal`-style modal saying reward claiming isn't wired up yet; locked chest → `LockedContentModal`.
- "VIEW REWARDS" button → `LockedContentModal` (no rewards-detail screen exists yet, same pattern as Campaign Overview's reward taps).
- Info button → a small informational modal (reuse `LockedContentModal`'s shell/`ModalLayer` with different copy, or a lightweight tooltip — proposing `LockedContentModal`'s underlying `ModalLayer` directly for consistency, not a new modal type).

## 23–24. Routing

- Current route: `#/campaign/chapter-map` (`"campaign-chapter-map"` in `RouteId`) — currently renders the legacy `CampaignScreen`. This plan proposes the new `CampaignChapterMapScreen` take over that exact route.
- Legacy `CampaignScreen` is **not deleted**. Proposed relocation: a new internal/debug route, e.g. `"campaign-chapter-map-legacy"` → `#/campaign/chapter-map/legacy`, added to `RouteId`/`ROUTES`/`HASH_TO_ROUTE` purely for comparison access — not linked from any button, reachable only by typing the hash. `AppShell`'s nav-suppression list is unaffected by this (legacy screen keeps the old shared header/nav as it always has, per your original instruction).
- Temporary routing for Stage Detail (not built yet): a placeholder route + minimal placeholder screen (see #26), so tapping a playable stage doesn't dead-end or wrongly show a locked modal.

## 25. Scroll behavior

Same convention as Campaign Overview: the screen's content scrolls inside `HubScreenShell`'s hidden-scrollbar middle row (vertical only). The stage map itself does not scroll horizontally — both columns fit within the portrait width without needing internal horizontal scroll (unlike Campaign Overview's chapter carousel). No new horizontally-scrolling region is introduced by this screen, which sidesteps the exact bug class just fixed on Campaign Overview, but every new container still gets `width:100%; max-width:100%; min-width:0; box-sizing:border-box;` defensively, and nothing will use `width:100vw`.

## 26. Safe-area handling

Unchanged from every other hub screen — `HubScreenShell` already applies `padding-top: env(safe-area-inset-top)` and owns the header/footer rows; this screen doesn't touch that.

## 27. Responsive behavior

Two-column stage layout must hold at 412/390/360px without triggering horizontal overflow — node size (octagon diameter) will shrink slightly under a narrow-width media query (same pattern as `ChapterCard`'s existing 359px breakpoint) rather than letting either column compress unpredictably. Boss crest at Stage 10 also shrinks proportionally at the same breakpoint.

## 28. Touch-target requirements

Every stage node, the back button, info button, "VIEW REWARDS" button, and each chest in the chest row are real `<button>` elements sized for touch (matching the ≥40px-ish targets already established by `ChapterCarousel`'s edge buttons and `ChapterCard`'s tap area) — no bare `<img>` or `<div onClick>` taps.

## 29. Exact files to create

```
src/data/campaignChapterMap.ts
src/components/campaign-map/ChapterMapHeaderBar.tsx / .css
src/components/campaign-map/ChapterMapIntroPanel.tsx / .css
src/components/campaign-map/ChapterStarChestTrack.tsx / .css
src/components/campaign-map/StageMapPath.tsx / .css
src/components/campaign-map/StageNode.tsx / .css
src/screens/campaign/CampaignChapterMapScreen.tsx / .css
```

Placeholder Stage Detail (temporary, minimal, explicitly NOT the real Stage Detail build):
```
src/screens/campaign/StageDetailPlaceholderScreen.tsx / .css
```

## 30. Exact files to modify

- `src/app/routes.tsx` — add `"campaign-chapter-map-legacy"` and a temporary `"stage-detail-placeholder"` (or similar) to `RouteId`/`ROUTES`/`HASH_TO_ROUTE`; repoint `"campaign-chapter-map"`'s meaning (still `#/campaign/chapter-map`) to the new screen.
- `src/app/App.tsx` — render `CampaignChapterMapScreen` for `"campaign-chapter-map"`, `CampaignScreen` for the new `"campaign-chapter-map-legacy"`, `StageDetailPlaceholderScreen` for the temporary stage-detail route.
- `src/components/icons/BattleModeIcon.tsx` — add `search` and `info` variants.
- `src/components/layout/AppShell.tsx` — add `"campaign-chapter-map"` to the shared-`BottomNavigation` suppression list (this screen renders its own `HubBottomNav`, same reason as Battle Hub/Campaign Overview). `"campaign-chapter-map-legacy"` stays out of that list, unchanged.

Nothing else. `HomeScreen`, `BattleHubScreen`, `CampaignOverviewScreen`, `HubHeader`, `HubBottomNav`, `HubScreenShell` are not touched.

## 31. Exact route changes

- `#/campaign/chapter-map` → now `CampaignChapterMapScreen` (was legacy `CampaignScreen`).
- `#/campaign/chapter-map/legacy` (new) → legacy `CampaignScreen`, for comparison only.
- A temporary Stage Detail placeholder route (exact hash TBD, proposing `#/campaign/stage-detail`) → `StageDetailPlaceholderScreen`.

## 32. Registry exports used

`MODE_ILLUSTRATION.campaign`, `REWARD_CHEST.legendary/.epic/.basic`. No new registry entries required — everything else is coded (icons, nodes, connectors).

## 33. Shared header/footer — unchanged

`HubScreenShell`/`HubHeader`/`HubBottomNav` TSX and CSS are not modified. `CampaignChapterMapScreen` wraps its content in `<HubScreenShell header={<HubHeader .../>} footer={<HubBottomNav active="battle" .../>}>`, identical to `BattleHubScreen` and `CampaignOverviewScreen`. Battle stays the active tab (matches your instruction: "Battle should remain the active tab unless the approved reference and navigation map say otherwise" — neither says otherwise here).

## 34. Build checks

`tsc -b --noEmit` and `vite build --outDir /tmp/<name> --emptyOutDir` (OneDrive-lock workaround, same as every prior round), plus the established file-size/mtime regression check against `HomeScreen`, `BattleHubScreen`, `CampaignOverviewScreen`, `HubHeader`, `HubBottomNav`, `HubScreenShell`.

## 35. Screenshot-comparison process

Same disclosed sandbox limitation as every prior screen: no headless browser available here, so verification is a section-by-section static CSS/property comparison against the reference crops captured this session, not a rendered pixel diff. `npm run dev` + Chrome-extension path remains open if you want a live check.

## 36. Visual acceptance checklist

- Portrait orientation, capped shell width.
- Shared header/footer pixel-aligned with Home/Battle Hub/Campaign Overview, Battle tab active.
- Back button returns to Campaign Overview.
- "CHAPTER 2 / SHATTERED NEBULA" title/subtitle correct.
- Chapter intro panel: flavor text, 3 reward amounts (500/250K/5), background art, "VIEW REWARDS" button.
- "CHAPTER STARS 17/30" + 3-chest row (10 legendary/claimed, 20 epic/claimable, 30 basic/locked) in that exact tier order.
- 10 stage nodes, correct order (two columns, 1–5 then 6–10), correct completed/current/locked states, correct star fill per node.
- Stage 7 shows "CURRENT" tag.
- Stage 10 renders as a distinct red/crimson boss crest, not a standard octagon.
- Rounded L-shaped connector bridges column 1 (stage 5) to column 2 (stage 6); straight lines within each column.
- No document-level horizontal overflow at 412×915 / 390×844 / 360×800 / your device width.
- No generic vertical stage list — two-column path shape preserved.
- No web-dashboard appearance, no full-reference-image used as a background.
- Every node/button is a real coded control (no bare divs, no emoji/Unicode).
- Vertical scroll works inside `HubScreenShell`; content isn't hidden behind the footer.
- Safe-area top inset respected.
- Home, Battle Hub, Campaign Overview visually and functionally unchanged.

---

## Open questions before I start building

1. **Stage 8/9 state** — treat as `locked` (opens `LockedContentModal`) or `available` (freely browsable, no lock)? (#9)
2. **Stage 8/9/10 star values** — keep the reference's exact (if illogical) partial-star display, or zero them out as genuinely-unplayed stages? (#10)
3. **Legacy screen relocation hash** — `#/campaign/chapter-map/legacy` acceptable, or do you want a different internal path?
4. **Stage Detail placeholder** — OK to build a minimal placeholder screen (stage name + a "Stage Detail coming soon" message + a way back) so stage taps aren't dead ends, without this counting as "implementing Stage Detail"?

Stopping here per your instruction. Not creating or modifying any source files. Waiting for approval (and answers to the 4 questions above, if you'd like to weigh in before I proceed — otherwise I'll make the reference-literal, most-conservative call on each and note it in the completion report).
