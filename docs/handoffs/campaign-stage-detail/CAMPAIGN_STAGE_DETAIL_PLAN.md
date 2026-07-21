# Campaign Stage Detail — Pre-Implementation Plan

Planning only. No source files created or modified.

## 1–4. Authoritative reference

1. **Exact filename:** `07_Campaign_Stage_Detail.png`
2. **Exact location:** `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_1_Core_Hubs_and_Campaign/07_Campaign_Stage_Detail.png` — same folder as the prior two screens (`05_Campaign_Overview.png`, `06_Campaign_Chapter_Map.png`), confirmed by directory listing.
3. Opened and inspected the full image (941×1672) plus 4 zoomed crops (header/title, objectives, rewards row, loadout row, action buttons) for pixel-level detail.
4. This is the sole visual target — not Chapter Map, Pre-Battle, or Results. Not memory-based; every detail below was read directly off the image this session.

## Target portrait viewport

Same as every hub screen: portrait-only, `--shell-max-width: 520px` cap, tested at 412×915, 390×844, 360×800, plus your device width.

## 5. Full top-to-bottom layout breakdown

1. **Shared header** — `HubHeader`, unchanged.
2. **Back button** — separate square icon button, top-left, own row (not merged into the title row like Chapter Map's back/title/info row).
3. **Title block** — "STAGE DETAIL" (large italic bold, cyan decorative flourish lines either side) + "Chapter 2 · Stage 7" (cyan subtitle) — centered, no trailing control.
4. **Mission panel** — chapter label ("CHAPTER 2"), stage name ("NEBULA BREACH"), description (2 lines), Energy Cost row, a 2×2 stat grid (Recommended Power / Your Power, Best Grade / Fastest Clear), background art bleeding in from the right behind a text scrim.
5. **Objectives panel** — "OBJECTIVES" heading, 3 rows (star icon + description each).
6. **Rewards row** — "FIRST CLEAR REWARDS" (4 items) and "REPEAT REWARDS" (3 items), side by side, divided by a vertical rule.
7. **Current Loadout panel** — ship portrait + name/level/stars, companion portrait + name/level/rarity, Total Power stat.
8. **Action row** — "VIEW REWARDS" (secondary, gift icon) + "PREPARE" (large primary CTA, energy cost badge).
9. **"CHANGE LOADOUT"** — small centered text link with a refresh icon, beneath the action row.
10. **Shared footer** — `HubBottomNav`, Battle active.

## 6–10. Stage identity shown in the reference

6. **Exact stage:** Chapter 2, Stage 7 — same stage the Chapter Map marks "Current."
7. **Stage number:** 7.
8. **Stage name:** "Nebula Breach" (a per-stage name distinct from the chapter name — new data point not present in `campaignChapterMap.ts`, which only stored "Stage N" labels).
9. **Stage type:** not explicitly labeled with a "kind" tag in this reference (unlike the legacy `CampaignScreen`'s Standard/Elite/Survival/Boss badges) — the mission panel just shows the name and description directly. I'm not inventing a kind badge that isn't there.
10. **Mission description (verbatim):** "Enemy forces have breached the outer defenses. Push through the nebula and secure the sector."

## 11–12. Star objectives and completion state

11. Three objectives, each with a filled gold star icon:
    - "Clear the stage"
    - "Clear with at least 50% HP"
    - "Clear without revive"
12. **Completion state:** the reference shows no visual distinction between the 3 rows — no checkmark, no dimming, no per-objective indicator separate from the (identically-styled) star icon. **Flagged:** this looks like a static list of *what the objectives are*, not a per-objective completion tracker — even though Stage 7 is "current"/in-progress. I'm proposing `StageObjectiveRow` still accept an optional `completed` prop (dimmed + check overlay) for future use, but the Stage 7 prototype data will use the reference's plain, undifferentiated presentation for all 3 rows rather than inventing a completion state the reference doesn't show.

## 13. Enemy information

No separate enemy-portrait/role-icon/count row exists in this reference. The mission panel's background illustration (a large ship-formation/fleet battle scene) is the only "enemy or boss preview" shown — it does double duty as mood art and enemy depiction. I'm not adding a fabricated enemy-roster section that isn't in the reference; per the navigation-map doc's B-04 spec ("Enemy or boss preview"), the background art satisfies this requirement as-is.

## 14–16. Power and energy

14. **Recommended Power:** 11,900 (matches Campaign Overview's own Chapter 2 detail panel value exactly — consistent figure reused, not re-derived).
15. **Your Power:** 12,480 (also reused as the loadout panel's "Total Power" — same figure shown twice in the reference, not two different numbers).
16. **Energy Cost:** 10.

## 17–18. Rewards

17. **Possible/First Clear Rewards** (4 items): 250 crystals, 75K credits, 1 chest, 20 of a purple/gold faceted material.
18. **First-clear vs. repeat, exact split:**
    - First Clear: 250 crystals · 75K credits · 1 chest · 20 material.
    - Repeat: 30K credits · 100 crystals · 5 of a red/orange cylindrical material.

## 19. Exact buttons

"VIEW REWARDS" (secondary, gift icon) · "PREPARE" (primary, bolt icon + "10") · "CHANGE LOADOUT" (small text link, refresh icon) · back icon button.

## 20. Locked/completed/available states

This reference only shows the "available/current" state (Stage 7). Per the navigation map's own B-04 spec, other states exist (locked, cleared, all-objectives-complete, insufficient Energy) but aren't pictured here, so I'm not inventing their exact visuals. Scope for this build: render Stage 7's reference-matched "available" presentation faithfully; note (but don't visually design) that a `cleared` stage would presumably show its earned stars/grade instead of dashes — deferred, since only one reference state exists to match.

## 21–22. Navigation behavior

21. **Back button** → `navigate("campaign-chapter-map")`.
22. **Primary action ("PREPARE")** → see the Pre-Battle recommendation below.

## 23–25. Components

**Reused as-is:** `HubScreenShell`, `HubHeader`, `HubBottomNav`, `ScreenHeader` (for the "STAGE DETAIL / Chapter 2 · Stage 7" title block — same decorative-flourish CSS pattern already scoped for Campaign Overview's own title, reproduced the same way here rather than modifying `ScreenHeader` itself), `IconButton` (back button), `SecondaryButton`, `PrimaryButton`, `StatRow`, `LockedContentModal`, `navigate`/`pathFor`.

**Small extensions:** `BattleModeIcon` gets 2 new coded SVG variants — `gift` (View Rewards) and `refresh` (Change Loadout) — same pattern as the existing 13.

**New components (`src/components/stage-detail/`):**
- `StageMissionPanel` — chapter/stage name, description, energy cost, 2×2 stat grid, background art.
- `StageObjectiveRow` — one objective line (star icon + text + optional completion prop, see #12).
- `StageRewardsRow` — the First Clear / Repeat two-column reward layout.
- `StageRewardItem` — one reward icon + amount (shared by both columns).
- `StageLoadoutPanel` — ship + companion + total power.

## 26–28. Assets

**Approved assets to use:**
- `RESOURCE_ICON.crystals` / `.credits` (reward + stat icons), `BattleModeIcon` `energy` (bolt, energy cost + Prepare badge), `swords` (power stat icon, matches `RESOURCE_ICON.power`'s crossed-swords motif already used for "Total Power" elsewhere), `star` (objectives), `chevron` (back button, rotated), `check`/`lock` if needed for future states.
- `REWARD_CHEST.epic` — the purple ornate chest in "First Clear Rewards" (visually matched against all 4 tiers; epic is the closest color/ornamentation match).
- `MATERIAL_ICON.universalFragment` — closest match for the purple/gold faceted "20" reward (diamond-gem shape vs. the reference's rounded-triangle shape; color/palette match is close, silhouette isn't exact — disclosed substitution).
- `MATERIAL_ICON.reviveToken` — closest match for the red/orange cylindrical "5" repeat reward (thematic match — a consumable/support material fits "repeat reward" — but visually it's a blue circular cross badge, not a red cylinder. This is the weakest substitution on the screen, flagged clearly).
- `SHIP_ROSTER_ART["ship-01-rapid-fire"]` — closest existing ship art for the loadout panel's "Void Reaper" portrait (white/red/purple multi-winged silhouette is the closest visual match among the 5 available roster images; the name "Void Reaper" doesn't exist in the real 20-ship roster at all — reference-matched prototype name, not a real ship).
- `COMPANION_ART.missileDrone` — closest existing companion art for "Rapid Drone" (dark body, red/orange accents — closest palette match among the 6 companions; the name "Rapid Drone" isn't one of the 6 real companion names either).
- Mission panel background art: recommending `CHAPTER_BACKGROUND_IMAGE["chapter-01"]` (the wide-format moody purple hero image already used for the legacy Chapter 1 screen) over `MODE_ILLUSTRATION.campaign` — I opened both: `MODE_ILLUSTRATION.campaign` turned out to be a small **circular emblem/badge** (a constellation-map icon), not a wide battle scene, so blowing it up via `object-fit: cover` to fill this panel's large art area would look zoomed-in and low-detail, unlike its earlier, smaller uses on Battle Hub/Campaign Overview/Chapter Map. `chapter_01_void_frontier` is genuinely wide-format hero art, a better structural fit even though its filename says "chapter-01." Flagging for your call — happy to use `MODE_ILLUSTRATION.campaign` anyway if you'd rather keep visual consistency with the other 3 screens over resolution/composition fit.

**Unavailable reference assets and substitutes:** covered inline above (chest tier, 2 material icons, ship art, companion art, background art). No enemy portraits needed (see #13). No new artwork generated — all substitutions are existing approved assets.

## 29–31. Routing

29. **Current route to take over:** `#/campaign/stage-detail` (currently `StageDetailPlaceholderScreen`).
30. **Selected stage ID:** same mechanism already built for the placeholder — rides as a `?id=<stageId>` suffix on the hash, stripped by `resolveRoute` before its exact-match lookup, read via `URLSearchParams` in the screen itself (no router changes needed beyond what already exists).
31. **Temporary Pre-Battle routing — recommendation:** build a **temporary Pre-Battle placeholder route** (`#/campaign/pre-battle`, carrying the same `?id=` stage suffix), not a `LockedContentModal`. Reasoning: "PREPARE" is the single largest, most prominent control on this screen — routing it into a modal would make the screen's main purpose feel like a dead end, and this project has already established the "placeholder screen, not a modal" pattern for exactly this situation (Stage Detail itself was built this way one step ago). A placeholder screen also naturally carries the selected stage's name/number forward, which a generic modal can't do as cleanly. This does **not** implement real Pre-Battle — same bare treatment as the current Stage Detail placeholder (stage info + "temporary" label + Back button).

## Placeholder relocation

Per your instruction, the *existing* `StageDetailPlaceholderScreen` is not deleted. Proposed: relocate it to an internal comparison-only route `#/campaign/stage-detail/legacy-placeholder` (mirroring the Chapter Map legacy relocation pattern), unlinked from any button, and repoint `#/campaign/stage-detail` to the new real `CampaignStageDetailScreen`.

## 32. Scroll behavior

Same convention as Campaign Overview/Chapter Map: content scrolls inside `HubScreenShell`'s hidden-scrollbar middle row. No new horizontally-scrolling region — the rewards row and loadout row both need to fit within the portrait width without their own horizontal scroll (see mobile safety below).

## 33. Safe-area handling

Unchanged — inherited from `HubScreenShell`, not touched.

## 34. Responsive behavior

The rewards row (4 items + divider + 3 items) and the 2×2 mission stat grid are the two sections most likely to need narrow-width adjustments — planning a `max-width: 359px` breakpoint that shrinks reward-icon size and tightens gaps, same pattern as every prior screen's narrow-phone breakpoint, rather than letting either section force horizontal scroll.

## 35. Touch targets

Back button, both action buttons, "Change Loadout" link, and each reward item (if reward taps open a modal) are real `<button>` elements.

## 36. Exact files to create

```
src/data/campaignStageDetail.ts
src/components/stage-detail/StageMissionPanel.tsx / .css
src/components/stage-detail/StageObjectiveRow.tsx / .css
src/components/stage-detail/StageRewardsRow.tsx / .css
src/components/stage-detail/StageRewardItem.tsx / .css
src/components/stage-detail/StageLoadoutPanel.tsx / .css
src/screens/campaign/CampaignStageDetailScreen.tsx / .css
src/screens/campaign/PreBattlePlaceholderScreen.tsx / .css
```

## 37. Exact files to modify

- `src/app/routes.tsx` — repoint `#/campaign/stage-detail` to the new real screen; add `"stage-detail-legacy-placeholder"` (`#/campaign/stage-detail/legacy-placeholder`) for the relocated old placeholder; add `"pre-battle-placeholder"` (`#/campaign/pre-battle`).
- `src/app/App.tsx` — render `CampaignStageDetailScreen` for `"stage-detail"`-equivalent route id, `StageDetailPlaceholderScreen` for the relocated legacy id, `PreBattlePlaceholderScreen` for the new Pre-Battle placeholder route.
- `src/components/layout/AppShell.tsx` — add the new real Stage Detail route and the Pre-Battle placeholder route to the shared-`BottomNavigation` suppression list (both render their own `HubBottomNav`).
- `src/components/icons/BattleModeIcon.tsx` — add `gift` and `refresh` variants.
- `src/components/campaign-map/CampaignChapterMapScreen.tsx` — **no logic change expected**, just confirming its existing `pathFor("stage-detail-placeholder")` call still resolves correctly once that route id is renamed/repointed (likely just needs the route-id constant it references updated to match whatever the real screen's route id ends up being named).

Not touched: `HomeScreen`, `BattleHubScreen`, `CampaignOverviewScreen`, `CampaignChapterMapScreen` (structurally — only the one constant reference above), `HubHeader`, `HubBottomNav`, `HubScreenShell`, real campaign/gameplay data.

## 38. Exact route changes

- `#/campaign/stage-detail` → now `CampaignStageDetailScreen` (was the placeholder).
- `#/campaign/stage-detail/legacy-placeholder` (new) → relocated old placeholder, comparison-only.
- `#/campaign/pre-battle` (new) → `PreBattlePlaceholderScreen`.

## Behavior for stage-id edge cases

- **Valid completed stage** (e.g., Stage 3): render the mission panel/objectives/rewards with that stage's own prototype data if defined, otherwise fall back to Stage 7's data shape with that stage's number/name substituted — to be finalized once I know how many of the 10 stages need their own prototype entries (recommending just Stage 7 gets full reference-matched data since it's the only one pictured; Stages 1–6 reuse a generic "cleared stage" shape, flagged as approximation).
- **Current Stage 7:** the fully reference-matched case.
- **Unknown stage ID:** render an inline "Stage not found" state within the same screen shell (title area + a short message + Back button) — not a crash, not a separate error screen.
- **No stage ID supplied:** same "Stage not found" treatment (visiting the route directly without the query suffix).

## 39. Registry exports used

`RESOURCE_ICON.crystals/.credits`, `REWARD_CHEST.epic`, `MATERIAL_ICON.universalFragment/.reviveToken`, `SHIP_ROSTER_ART["ship-01-rapid-fire"]`, `COMPANION_ART.missileDrone`, `CHAPTER_BACKGROUND_IMAGE["chapter-01"]` (pending your call vs. `MODE_ILLUSTRATION.campaign`, see #26–28).

## 40. Shared header/footer

Unchanged — `CampaignStageDetailScreen` wraps content in `<HubScreenShell header={<HubHeader.../>} footer={<HubBottomNav active="battle" .../>}>`, identical to every prior hub screen.

## 41. Build and regression checks

`tsc -b --noEmit`, `vite build --outDir /tmp/<name> --emptyOutDir`, plus the established file-size/mtime check against Home, Battle Hub, Campaign Overview, Chapter Map, and the shared shell files.

## 42. Screenshot-comparison process

Same disclosed sandbox limitation as every prior screen: no headless browser here, so verification is a static section-by-section property comparison against the reference crops from this session, not a rendered pixel diff.

## 43. Visual acceptance checklist

- Portrait orientation, shared header/footer pixel-aligned with Home/Battle Hub/Campaign Overview/Chapter Map, Battle tab active.
- Back button separate from the title row, top-left.
- "STAGE DETAIL" title + "Chapter 2 · Stage 7" subtitle with decorative flourish.
- Mission panel: chapter label, "Nebula Breach" name, description, Energy Cost (10), Recommended Power (11,900) / Your Power (12,480), Best Grade / Fastest Clear, background art clipped inside the panel.
- Objectives panel: 3 star-icon rows, exact copy.
- Rewards row: First Clear (250/75K/1/20) and Repeat (30K/100/5) in that order, divided.
- Loadout panel: ship + companion + Total Power (12,480, matching Your Power).
- "View Rewards" (secondary) + "Prepare" (primary, energy badge) + "Change Loadout" (small link).
- No document-level horizontal overflow at 412×915 / 390×844 / 360×800 / your device width.
- No generic mission form, no web-dashboard appearance, no full-reference-image background.
- Every control is a real coded button, no emoji/Unicode.
- Vertical scroll works; content isn't hidden behind the footer; Prepare button is always reachable.
- Safe-area respected.
- Home, Battle Hub, Campaign Overview, Chapter Map unchanged.

---

## Open items for your call before I start building

1. **Mission panel background art** — `CHAPTER_BACKGROUND_IMAGE["chapter-01"]` (better resolution/composition fit, but reused from the legacy screen) vs. `MODE_ILLUSTRATION.campaign` (visually consistent with the other 3 Chapter 2 screens, but a small badge blown up large). I lean toward the former; say so if you'd rather I keep consistency instead.
2. **Repeat-reward "5" material** — `reviveToken` is the weakest substitution on this screen (wrong color/shape, right theme). Flagging in case you'd rather I use a plainer generic material or a different existing icon.
3. **Objective completion state** — building `StageObjectiveRow` with an optional `completed` prop for future use, but Stage 7's own data won't exercise it (matches the reference's undifferentiated 3 rows). Confirm that's fine.
4. **Stages other than 7** — only Stage 7 has real reference-matched content; tapping a different completed stage will reuse Stage 7's shape with substituted number/name unless you'd rather each of the 10 stages get distinct prototype copy (more upfront data-writing, no reference to match it against).

Stopping here. Not creating or modifying any source files. Waiting for approval and answers to the 4 items above (or I'll proceed with the stated leanings/defaults if you'd rather not weigh in on each).
