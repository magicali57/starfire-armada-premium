# Companion Detail — Completion Report

## 1. Implementation summary

Built the real Companion Detail screen at the dynamic route `#/inventory/companions/:companionId`, reproducing `18_Companion_Detail.png`. The screen is fully data-driven from `player`/`data/companions.ts`/`data/loadout.ts` — no companion is hard-coded, no reference bitmap is used as a background image. Entry points from Companions Roster (owned and locked cards) and from Loadout Manager's companion Info button now navigate to this real screen instead of opening the old "Companion Detail Coming Soon" temporary modal.

## 2. Reference inspected

`docs/references/mobile_screens_selected/18_Companion_Detail.png` — **941×1672px**, RGB. Extracted from `STARFIRE_ARMADA_UI_HANDOFF/references/mobile_screens/Batch_2_Fleet_Companions_and_Modules/18_Companion_Detail.png`. Inspected via 11 labeled crops in `docs/references/crops_companion_detail/` (header, title, hero, progress, behavior, stats, pairing/acquire, actions/footer, plus refined tight crops).

Recorded content:
- Standard shared header (profile pill/currencies), Back chevron + "Companion Detail" title + companion name subtitle below it.
- One bordered hero panel: "COMPANION" pill, name, rarity text, a 5-star row, companion art, role row, Power row, Level (with progress bar) and Rank (with info icon) row, primary action button (Equip/Equipped/How to Acquire depending on state).
- "Skill & Effects" panel: hex ability icon, ability title/activation/summary, a 2×2 effect-stat grid (Cooldown/Heal Per Second/Duration/Targeting for Repair Drone), and a "Utility Benefits" bullet list.
- "Progression" section: Level Upgrade Preview and Rank Up Preview panels side by side, Upgrade Cost row.
- Secondary action row: Upgrade / Rank Up buttons.
- "BEST PAIRINGS" section (3 static fabricated ship-synergy cards — **not reproduced literally**, see §4 below).
- "Obtained from: Companion Crate" source panel with a "Go to Inventory" link.
- Standard 5-tab bottom nav with Inventory highlighted, same footer Companions Roster and Fleet Roster already use.

Bitmap took priority over prompt assumptions for layout/wording throughout.

## 3. Files created

- `src/data/companionDetail.ts` — pure view-model layer (`getCompanionDetailViewModel`, `getCompanionDetailReturnTarget`, `getCompanionPairing`, `getCompanionAcquisitionInfo`, `getNextCompanionId`/`getPreviousCompanionId`, behavior/progression-preview types and data).
- `src/data/loadoutDraftSession.ts` — shared, non-persistent, in-memory Loadout draft session (extracted from Loadout Manager's former private module variable).
- `src/components/companion-detail/*` — 9 components + matching CSS: `CompanionDetailTitleBar`, `CompanionDetailHero`, `CompanionBehaviorPanel`, `CompanionEffectList`, `CompanionDetailProgress`, `CompanionDetailActions`, `CompanionPairingPanel`, `CompanionAcquisitionPanel`, `CompanionDetailDialog`.
- `src/screens/companion-detail/CompanionDetailScreen.tsx` + `.css` — the real screen, composing all 9 components.
- This report.

## 4. Files modified

- `src/app/routes.tsx` — added `"companion-detail"` to `RouteId`, a documentation-only `ROUTES` entry, `COMPANION_DETAIL_PREFIX`/`CompanionDetailReturnTarget`/`getCompanionIdFromHash`/`pathForCompanionDetail`, and extended `resolveRoute` to try the static table first, then the dynamic companion-id shape, before defaulting to `"home"`. Every existing static route still resolves via the unchanged `HASH_TO_ROUTE` exact-match path (verified — see §11).
- `src/app/App.tsx` — added `case "companion-detail": return <CompanionDetailScreen />;`. No companion id is hard-coded — the screen parses it itself from `window.location.hash`.
- `src/components/layout/AppShell.tsx` — added `route !== "companion-detail"` to the `showBottomNav` exclusion list (the screen renders its own `HubBottomNav`, same as Companions Roster/Fleet Roster).
- `src/screens/companions/CompanionsRosterScreen.tsx` — `handleInfo` now navigates to `pathForCompanionDetail(item.id, "companions")` for both owned and locked cards, instead of opening `CompanionRosterDialog`'s `"detail"`/`"locked"` kinds. Those dialog kinds are no longer invoked from this screen (the shared `CompanionRosterDialog.tsx` component itself was left unmodified — its `"detail"`/`"locked"` branches are now unreachable dead code, not deleted, to keep the diff minimal on an already-approved screen). No other part of Companions Roster changed — filter/sort/hero panel/grid are untouched.
- `src/screens/loadout/LoadoutManagerScreen.tsx` — (completed earlier this same work session, re-verified here) the companion slot's Info action now calls `pathForCompanionDetail(draftLoadout.companionId, "loadout")` instead of the old `pathFor("companions")+"?return=loadout"`; the private `inMemoryDraftCache` variable was replaced with calls into the new shared `loadoutDraftSession.ts` module (`getLoadoutDraftSession`/`setLoadoutDraftSession`/`clearLoadoutDraftSession`). This is a behavior-preserving refactor — Loadout Manager's own visible behavior is unchanged.

No changes to `SAVE_SCHEMA_VERSION`, `data/companions.ts`, `types/companion.ts`, or any other approved screen's CSS/visuals.

## 5. Dynamic route architecture

- Route id: `"companion-detail"`. Path shape: `#/inventory/companions/<companionId>` (optionally `?return=companions|loadout|home`).
- `getCompanionIdFromHash(hash)`: strips a `?...` suffix, requires the `#/inventory/companions/` prefix, rejects an empty id, rejects an id segment containing a further `/` (so a future `.../upgrade` sub-route can never be mistaken for this route), and safely rejects malformed percent-encoding (catches `decodeURIComponent` failures) — returns `string | null`, never throws.
- `pathForCompanionDetail(companionId, returnTarget?)` is the single supported way to build a real URL for this route; it percent-encodes the id via `encodeURIComponent`. `pathFor("companion-detail")` is never called anywhere in the codebase (confirmed by grep) — the `ROUTES` entry for it is documentation-only.
- `resolveRoute(hash)` tries the existing static `HASH_TO_ROUTE` exact-match table first; only if that misses does it check `getCompanionIdFromHash(hash) !== null` and return `"companion-detail"`; otherwise falls back to `"home"`. This ordering guarantees the dynamic route can never shadow a static route.
- Verified via a standalone script (see §26): every existing static route (`home`, `battle`, `ship-selection`, `stage-detail`, `loadout`, `companions`, etc.) still resolves correctly; `#/inventory/companions/companion-repair-drone` (with and without `?return=...`) resolves to `"companion-detail"`; `#/inventory/companions/` (empty id), `#/inventory/companions/foo/bar` (extra segment), and `#/inventory/companions/%` (malformed encoding) all safely resolve to `"home"`, never to `"companion-detail"` and never throw.

## 6. Direct-route / reload behavior

`companionId` and `returnTarget` are both parsed once on mount directly from `window.location.hash` via `useMemo(() => ..., [])` — the same "parse once on mount" convention every other dynamic-entry screen in this project uses. A hard reload or a pasted direct link into `#/inventory/companions/<id>?return=...` reconstructs the correct screen state without depending on browser navigation history.

## 7. Shell / header / footer choice

Standard hub shell: `<HubScreenShell>` + `<HubHeader>` + `<HubBottomNav active="inventory">` — same pattern as Companions Roster and Fleet Roster. The reference's footer crop (`7_actions_footer.png`) shows the normal 5-tab bottom navigation with Inventory highlighted, not a footerless action-row shell like Loadout Manager or Ship Detail. `HubScreenShell`/`HubHeader`/`HubBottomNav` were not modified. The Back chevron is rendered as a separate title row directly below `<HubHeader>` (not literally merged into the header's own row) — the same precedented compromise Companions Roster and Loadout Manager already use, since `HubHeader` is frozen and has no back-button prop.

## 8. Roster entry behavior

Companions Roster's card Info action (`handleInfo`, wired to both the grid's per-card Info button and the hero panel's Details button) now navigates to `pathForCompanionDetail(item.id, "companions")` for **both** owned and locked companions, replacing the old temporary "Companion Detail Coming Soon" modal for owned cards and the plain "locked" modal for locked cards. Filter/sort/scroll state is not preserved across this navigation — pressing Back returns to Companions Roster with its default filter (`"all"`) and sort (`"roster"`). This is an explicitly accepted trade-off (no save-schema field exists for roster filter/sort state, and the task explicitly said a simple return-to-default is acceptable). Companions Roster's own visuals, grid, hero panel, and Equip button were not changed.

## 9. Loadout entry behavior

Loadout Manager's companion slot Info button navigates to `pathForCompanionDetail(draftLoadout.companionId, "loadout")`. Opening Companion Detail this way does not save, reset, or discard any part of the in-progress Loadout draft (core/plating/system module selections, or the selected ship) — see §10 for the draft-session mechanism.

## 10. Return-target behavior

Priority, per the task's explicit rule (deliberately different from Companions Roster's own fallback, which resolves to Home):
1. `?return=loadout` → Back navigates to Loadout Manager.
2. `?return=companions` → Back navigates to Companions Roster.
3. `?return=home` → Back navigates to Home.
4. Missing/unrecognized `return` value → defaults to Companions Roster (`getCompanionDetailReturnTarget` resolves this itself, verified via standalone script).

For an **invalid/missing companion id**, Back always defaults to Companions Roster regardless of any parsed `return` value — a deliberately simpler, separate rule for that specific safe state, per the task's own instruction.

## 11. Loadout draft-preservation behavior (task §23)

- The previously private `inMemoryDraftCache` variable inside `LoadoutManagerScreen.tsx` was extracted into a new shared module, `src/data/loadoutDraftSession.ts` (in-memory only, not `PlayerState`, not `localStorage`/`sessionStorage`), exposing `getLoadoutDraftSession`, `setLoadoutDraftSession`, `updateLoadoutDraftCompanion(companionId, fallback)`, and `clearLoadoutDraftSession`.
- **Equip from Companion Detail when opened with `?return=loadout`**: calls `updateLoadoutDraftCompanion(companion.id, player.activeLoadout)`, which updates *only* the draft's `companionId` field, leaving `coreModuleId`/`platingModuleId`/`systemModuleId` completely untouched, then navigates back to Loadout Manager. Nothing is auto-saved. If no draft session exists yet (e.g. a direct reload straight into `?return=loadout` before Loadout Manager ever mounted in this tab), a new session is seeded from the real, currently-saved `player.activeLoadout` so the change still has a safe place to live.
- **Equip from Companion Detail when opened from Companions Roster/direct route** (`returnTarget !== "loadout"`): commits immediately via the real `saveActiveLoadout({...player.activeLoadout, companionId})` transaction — the same immediate-equip behavior Companions Roster's own hero panel already uses. Before committing, the screen checks whether an **unresolved Loadout draft conflict** exists (`getLoadoutDraftSession()` is non-null and differs from the currently-saved `activeLoadout` in companion or any module slot); if so, an in-app confirmation dialog ("Unsaved Loadout Changes") is shown before proceeding, rather than silently overwriting the saved loadout out from under an in-progress, unsaved Loadout Manager draft. This satisfies the task's explicit "when an unresolved draft conflict exists, show an in-app confirmation" instruction.
- Verified via a standalone script (§26): `updateLoadoutDraftCompanion` preserves an existing draft's module selections while changing only `companionId`; a fresh call with no prior session correctly seeds from the supplied fallback; `clearLoadoutDraftSession` correctly clears the session.

## 12. Companion data reused

All companion identity/role/rarity/description/art-key/base-Power/stat-contribution data comes from the existing `data/companions.ts` (`COMPANIONS`, `getCompanionById`) — no duplicate database. Ownership via `player.ownedCompanionIds.includes(id)`, progress via the existing `getCompanionProgressOrDefault`, equipped state via `player.activeLoadout.companionId === id` — all identical to Loadout Manager/Companions Roster.

## 13. Detail view-model structure

`src/data/companionDetail.ts` exports `CompanionDetailViewModel` (id/name/role/roleLabel/roleFilterKey/rarity/description/artwork/owned/equipped/level/maxLevel/rank/maxRank/power/behavior/statRows/levelPreview/rankPreview/upgradeCost/pairedShip/acquisition/upgradeReady/rosterIndex) built by `getCompanionDetailViewModel(companionId, player, companionArtResolver, shipArtResolver)`, which returns `null` for an unknown id. All display math (level/rank previews, upgrade cost, pairing) lives in this file, not in JSX.

## 14. Level handling

Displays the real stored level as-is. Repair Drone's calibrated Level 60 (set during the Loadout Manager phase) is shown unmodified — **not** clamped to this screen's 20-level presentation cap. The Level Upgrade Preview panel instead shows an "at cap" message when `progress.level >= COMPANION_MAX_LEVEL (20)`, rather than fabricating a Level 61 comparison. No migration, reset, or invented cap was introduced. This discrepancy (blueprint's 1–20 range vs. the approved Level 60 default) is disclosed, not solved, per the task's own instruction that the real upgrade economy is a future phase.

## 15. Rank handling

`progress.rank ?? 0`, capped for display purposes at `COMPANION_MAX_RANK` (5, reused from `companionRoster.ts`, matching the reference's "4/5" style readout). Shown twice, matching the reference: as a 5-star row near the portrait, and as a numeric "RANK x/5" readout with its own info button — both are the *same* real `rank` value, not two separate data fields. No rank-up transaction, no resource spend, no invented rank requirements. The Rank Up action and the rank info button both open informational modals only.

## 16. Power calculation reuse

Power is computed via the exact same `calculateCompanionPower` (from `data/loadout.ts`) used by Loadout Manager and Companions Roster — no second formula. Verified via a standalone script (§26) that computes Power for all 6 companions through the real `getCompanionDetailViewModel` and confirms finite, positive, non-degenerate values consistent with each companion's real stored level (e.g. Repair Drone at Level 60 → Power 1,980; the 5 Level-1 companions → Power in the 339–1,131 range, reflecting rarity/base-stat differences). Because Companion Detail calls the identical shared function Loadout Manager/Companions Roster already call (not a re-derivation), numeric parity across all three screens is guaranteed by construction.

## 17. Behavior / effect metadata

`COMPANION_BEHAVIOR_INFO` in `companionDetail.ts` provides descriptive-only prototype content per companion (title/activation/summary/targeting/effect stats/utility benefits). Only Repair Drone's entry is reference-matched (transcribed verbatim from the bitmap's "Skill & Effects" crop — title "Repair Beam," all 4 effect-stat values, all 3 utility-benefit lines). The other 5 companions' entries are original prototype content written to match each companion's real role/description, **not** reference-verified (disclosed in the file's own doc comment). None of this is wired to any real combat/targeting/cooldown/healing logic — purely descriptive flavor text for this screen.

## 18. Stat contribution presentation

`CompanionEffectList` renders a "Loadout Contribution" block from the companion's real `statContributions`, using the exact same `calculateCompanionStatContributions`/`buildStatContributionRows` helpers and formatting conventions (flat values for Attack/Health/Armor, percentages for CritRate/CritDamage/EnergyRegen) that Loadout Manager already uses — only non-zero rows render. This block is an intentional *addition* beyond the bitmap's literal "Skill & Effects" grid (which shows generic combat-flavor stats, not `statContributions`), added because the task's §18 explicitly requires surfacing real `companion.statContributions` data. Disclosed here as a deviation from the bitmap's literal content, not a fabrication — the numbers themselves are 100% real.

## 19. Current ship pairing

Shows the real currently-selected ship (`player.selectedShipId`, resolved via the existing `getShipById`), with its master art (via `getShipMasterArt`, never a gameplay sprite), rarity, role, and real Power (`calculateLoadoutShipContribution`). "EQUIPPED WITH" is shown when this companion is the currently-equipped one; otherwise "NOT CURRENTLY EQUIPPED," still previewing the current ship as the Equip target. **Deliberate deviation from the reference's literal "BEST PAIRINGS"** section (3 static ship cards with fabricated synergy percentages, e.g. "+15% Healing Output") — reproducing that literally would require inventing a full 20-ship × 6-companion synergy matrix with no real data source anywhere in the codebase, which directly conflicts with the task's own repeated "do not fabricate" instructions and its own separate, explicit §19 requirement to use real player data. The task's explicit real-data requirement was prioritized over the bitmap's literal wording/content.

## 20. Acquisition information

Reuses `CompanionAcquisitionInfo`'s shape from `companionRoster.ts` (imported, not redeclared). Owned companions show the source as visible collection context (never presented as locked); unowned companions show the locked treatment plus the same source label and an "unlock not yet available" description. The "Go to Inventory" link opens the existing "Inventory is coming soon" modal (Inventory Hub doesn't exist yet, same convention `HubBottomNav`'s own Inventory tab uses elsewhere). No unlock, no currency deduction, no fabricated transaction.

## 21. Equipped-state derivation

`equipped: owned && companion.id === player.activeLoadout.companionId` — derived from the same single source of truth Loadout Manager/Companions Roster use. An invalid/unset `activeLoadout.companionId` can never cause a false-positive equipped state (the `owned &&` guard combined with exact-id comparison against a real value handles this).

## 22. Equip transaction

For owned, not-yet-equipped companions opened from Companions Roster/direct route, Equip calls the existing `saveActiveLoadout({ ...player.activeLoadout, companionId: companion.id })` transaction — identical call shape to Companions Roster's own already-verified Equip button. No currency/material spend, no level/rank change, no module changes, no ship change. Already-equipped shows a disabled "Equipped" button (no redundant save). Locked companions show "How to Acquire" instead of Equip. Success/failure is reported via an in-app modal (`equipSuccess`/`equipFailure`), never silently applied.

## 23. Equip behavior when opened from Loadout

See §11 above — full detail on the draft-session update path and the draft-conflict confirmation dialog.

## 24. Action buttons

Matches the bitmap's layout/wording: primary action inside the hero panel switches between **Equip** (owned, not equipped) / **Equipped** (disabled) / **How to Acquire** (locked); a secondary row below Progression has **Upgrade** and **Rank Up**, both disabled for locked companions. Upgrade and Rank Up are non-transactional in this phase — both only open an informational "coming soon" modal (no level/rank change, no spend, no invented costs). Acquire opens the acquisition-info modal without unlocking anything.

## 25. Upgrade-ready presentation

`upgradeReady` (from the view model, `owned && rank === COMPANION_MAX_RANK - 1`) is computed but not currently surfaced as a separate visible badge anywhere on this screen — the reference's own Companion Detail crop doesn't show a distinct "ready to upgrade" badge separate from the Progression panels themselves, so none was invented. The field is exported for a future phase to use if needed. No Companion Data currency exists yet; the Upgrade Cost row shown is a disclosed, deterministic, non-transactional placeholder (`credits = 1000×(level+1)`, `companionData = 5×(rank+1)`), never spent.

## 26. Locked and invalid states

- **Locked companion**: renders the full informational detail screen (art with a grayscale/lock-overlay treatment, name, role, rarity, behavior, acquisition info) with Equip/Upgrade/Rank Up all disabled or replaced with "How to Acquire." Verified via a standalone script: a simulated zero-ownership player correctly produces `owned: false, equipped: false` for Repair Drone through the real `getCompanionDetailViewModel`.
- **Invalid/missing companion id**: `getCompanionDetailViewModel` returns `null`; the screen renders a dedicated "Companion Not Found" panel (no crash, no undefined labels, no store mutation, no silently displaying a different companion) with a working Back button that defaults to Companions Roster. Verified via a standalone script: `getCompanionDetailViewModel("companion-does-not-exist", ...)` returns `null`.

## 27. Modals and feedback

All feedback goes through `<ModalLayer>` + `<CompanionDetailDialog>` (content-only, same pattern as `LoadoutDialog`/`CompanionRosterDialog`) or `<LockedContentModal>` for header/footer/"Go to Inventory" coming-soon actions. No `alert`/`confirm`/`prompt` anywhere. Dialog kinds implemented: `equipSuccess`, `equipFailure`, `locked` (acquisition info), `upgrade`, `rankUp`, `rankInfo`, and a new `draftConflict` confirmation (Cancel / Equip Anyway) for the unresolved-draft-conflict case described in §11.

## 28. Save-schema confirmation

`SAVE_SCHEMA_VERSION` was **not** changed. Nothing added by this phase (detail view-model, behavior/acquisition metadata, route parsing, modal state, the draft-session module) is persistent `PlayerState` — all of it is either pure derivation from existing state or in-memory-only session state.

## 29. Mobile responsiveness — static audit results

No headless browser is available in this sandbox (confirmed again this phase — `playwright` package not installed, browser binaries not downloadable; same disclosed limitation as every prior screen in this project). Verification here is a **static CSS/structure audit**, not a rendered-screenshot audit:
- Grepped all new CSS for `100vw` and any fixed pixel width ≥900px inside padded containers — none found.
- Every new top-level panel CSS class sets `width: 100%; max-width: 100%; min-width: 0; box-sizing: border-box` (confirmed present in `CompanionDetailScreen.css`, `CompanionDetailHero.css`, `CompanionAcquisitionPanel.css`, `CompanionPairingPanel.css`, `CompanionDetailActions.css`, and the rest of the `companion-detail/` component CSS files — one exception, `CompanionDetailDialog.css`, intentionally omits its own `box-sizing`/padding because it renders inside `ModalLayer`'s own padded container, matching `LoadoutDialog.css`'s identical pattern).
- Flex rows that could overflow at 360px (`companion-detail-hero__level-rank-row`, `companion-detail-hero__top`) use `flex-wrap: wrap` and `min-width: 0`/`min-width: 90px` sizing rather than fixed widths; text elements (`companion-detail-hero__name`, dialog copy, acquisition description) use `overflow-wrap: break-word`.
- `CompanionDetailActions` uses a `1fr 1fr` grid for the two secondary buttons, which naturally stacks content within available width without overflow at any of the three target viewports (412×915, 390×844, 360×800).
- No inline styles setting fixed unresponsive widths were introduced anywhere in this phase's components.

This is disclosed honestly as a static, not rendered, verification — no screenshot files exist for this phase, and none are claimed.

## 30. Type-check result

`npx tsc --noEmit -p .` — **clean, zero errors** (confirmed after fixing one self-caught import bug, see §32).

## 31. Build result

`npx vite build --outDir /tmp/starfire-companion-detail-build` — **succeeded** (281 modules transformed, built in 38.22s). Build was directed to a temp outDir outside the project, per this project's established OneDrive-mount build-hang workaround; the project's own `dist/`/`public/` were never touched by this build.

## 32. Verification scripts

- **tsc**: clean (§30).
- **Production build**: clean (§31).
- **Dynamic route tests** (esbuild-bundled, real code executed via Node, not hand-transcribed): confirmed all 10 pre-existing static routes still resolve correctly (`home`, `battle`, `ship-selection`, `loadout`, `companions`, `stage-detail`, etc.); confirmed `#/inventory/companions/companion-repair-drone` (with and without `?return=...`) resolves to `"companion-detail"`; confirmed empty-id, extra-segment, and malformed-encoding hashes all safely resolve to `"home"`; confirmed `pathForCompanionDetail` → `getCompanionIdFromHash` round-trips correctly, including for an id containing reserved characters (`/`, `?`, space).
- **Return-target parsing**: confirmed all 4 cases (`loadout`/`home`/explicit `companions`/missing-or-unknown → `companions`).
- **All-six-companion detail verification**: confirmed `getCompanionDetailViewModel` returns a valid, non-null view model with a finite positive Power for all 6 companions.
- **Companion Power regression**: confirmed real Power values for all 6 companions via the real shared formula (§16) — Repair Drone (Level 60, owned+equipped) → 1,980 Power; the other 5 (Level 1, owned, unequipped) → 339–1,131 Power depending on rarity/base stats.
- **Equip transaction**: not re-executed against the live store in this pass (would require a mounted React provider); verified instead by direct code inspection — `CompanionDetailScreen`'s non-loadout Equip path calls `saveActiveLoadout({...player.activeLoadout, companionId})`, structurally identical to Companions Roster's own already-store-tested Equip call from the prior phase.
- **Loadout-draft round-trip**: confirmed `updateLoadoutDraftCompanion` preserves an existing draft's `coreModuleId` while updating only `companionId`; confirmed a fresh draft session seeds correctly from the supplied fallback when none exists; confirmed `clearLoadoutDraftSession` clears the session.
- **Locked-state verification**: confirmed a simulated zero-ownership player produces `owned: false, equipped: false` for a real companion through the real view-model function.
- **Invalid-ID verification**: confirmed `getCompanionDetailViewModel("companion-does-not-exist", ...)` returns `null`.
- **Regression/no-stray-edits check**: no git repository is available in this sandbox (confirmed), so an mtime-based check was used instead — files modified in the last 25 minutes of this work session were listed and match exactly the expected Companion Detail file set (9 components + CSS, `companionDetail.ts`, `loadoutDraftSession.ts`, the new screen + CSS, `App.tsx`, `AppShell.tsx`, `CompanionsRosterScreen.tsx`, `LoadoutManagerScreen.tsx`, `BattleModeIcon.tsx`) — no unrelated file was touched by this phase.
- **Asset preflight/postflight**: all 6 `COMPANION_ART` files under `public/assets/ui-v2/companions/` (`assault_drone.png`, `beam_drone.png`, `missile_drone.png`, `repair_drone.png`, `shield_drone.png`, `utility_drone.png`) confirmed present and non-empty both before and after this phase's edits; `public/` was never written to by this phase (build output went to `/tmp/starfire-companion-detail-build`, never `dist/`/`public/`).

## 33. Screenshots

**Not available.** No headless browser could be run in this sandbox (same disclosed, previously-established limitation — `playwright` package not installed as a project dependency, browser binaries not downloadable, confirmed again this phase). No screenshot files were generated or are claimed for any of the 3 target viewports (412×915, 390×844, 360×800) or any of the 7 states requested (equipped-owned, owned-unequipped, locked, acquisition modal, upgrade modal, invalid state, loadout-return flow). Verification for mobile layout and all interactive states relied on the static CSS/structure audit (§29) and the standalone functional-logic scripts (§32) instead.

## 34. Remaining limitations / confirmations

- Reference bitmap's "BEST PAIRINGS" 3-ship synergy content was not reproduced literally (§19) — real current-ship-pairing data shown instead, per the task's own explicit real-data requirement.
- Reference bitmap's per-ability combat numbers (Heal Per Second, Healing Bonus %) are not backed by any real formula in this codebase; the Progression preview panels show real Power comparisons instead (§14, §16).
- Only Repair Drone's behavior/effect metadata is reference-verified; the other 5 companions' entries are original, undisclosed-as-final prototype content (§17).
- Upgrade cost figures are a disclosed placeholder formula, never spent (§25).
- `upgradeReady` is computed but not visibly surfaced as its own badge on this screen (§25).
- No rendered screenshots exist for this phase (§33) — mobile verification is static-only.
- **Confirmed unrelated approved screens were not visually changed**: Companions Roster's CSS/visuals/grid/hero-panel/filters/sort are untouched (only `handleInfo`'s navigation target changed, a behavior-only edit); Loadout Manager's CSS/visuals are untouched (only its companion-slot Info handler's navigation target and its internal draft-storage mechanism changed, both behavior-preserving refactors); Home, Battle Hub, Campaign screens, Pre-Battle, Fleet Roster, Ship Detail, Ship Level Up, and all shared hub components (`HubScreenShell`, `HubHeader`, `HubBottomNav`) were not modified at all in this phase.
