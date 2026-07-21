# Player Profile Completion Report

## Status

Complete. Player Profile screen + Edit Profile modal implemented at route `#/profile`, reusing the existing hub shell, header, bottom nav, cards, buttons, and modal layer. No new artwork was added.

## Implementation

- New route `#/profile` (static, `ROUTES`/`HASH_TO_ROUTE` in `src/app/routes.tsx`), rendered by `ProfileScreen` via `App.tsx`. Direct reload resolves correctly (`resolveRoute("#/profile")`), and there is exactly one Profile route entry.
- `HubHeader`'s and Home's own top-bar avatar buttons now `navigate("profile")` instead of opening a "coming soon" dialog — this is the single existing entry point into Profile from every hub screen.
- `AppShell` excludes `"profile"` from the generic `<BottomNavigation>` (Profile renders its own `HubScreenShell`/`HubHeader`/`HubBottomNav active="home"`, same pattern as Arsenal/Companions/Modules) — no doubled footer.
- Back button navigates to Home Dashboard (always a safe destination).
- New `src/data/playerProfile.ts` — the Profile summary contract. `getPlayerProfileSummary(player)` composes the existing canonical `getPlayerProgressionSummary` (XP/level/rewards/unlocks/Energy cap) and `calculateLoadoutTotalPower` (the one canonical Power figure already shown on Loadout Manager/Inventory Hub) — no XP, level, Power, or unlock math is duplicated. Also owns the built-in avatar catalog, `validateDisplayName`, and `formatRewardEntry` (display text only).
- Avatars are coded badges (6 built-in options, glyph + accent color), not artwork — no dedicated multi-choice avatar art exists in the registry (only one fixed HUD portrait used for top-bar chrome everywhere), so this follows the project's existing disclosed-substitution convention rather than generating new images.
- Battle Statistics only shows what the save genuinely tracks: stages cleared and highest stage reached, both derived from `highestClearedStageId` (nothing stored redundantly). The section is omitted entirely before any stage is cleared. Battles-completed/victories/bosses-defeated are not persisted anywhere in `PlayerState` today, so they are intentionally absent rather than shown as invented zeros.
- New `EditProfileModal` (small `ModalLayer`-based dialog): display name input + 6 avatar badges + Save/Cancel. No browser alert/prompt/confirm. Validation (trim, 2-16 visible characters, reject empty/control characters) is inline; on failure the previously saved name/avatar are left untouched in the store — only the modal's own draft/error text changes.
- New store transaction `applyUpdatePlayerProfileState` / `updatePlayerProfile` (`src/store/playerStore.tsx`) — validates name + avatar id before touching state; atomic, no partial writes.

## Persistence / save schema

- `displayName` already existed on `PlayerState` (schema v1+) and is reused as-is — not duplicated into a new nested object.
- Added the one missing field: `avatarId: string` (must be a real `PROFILE_AVATARS` id).
- **Save schema advanced from v10 to v11.**
- Migration (`src/data/player.ts`): a missing/invalid/unknown `avatarId` backfills to the default (`avatar-vanguard`) with a reported repair; every v10 field (currencies, Energy, Player XP/level, campaign progress, ship levels/Star Rank/abilities/fragments, companions, modules, Arsenal progression, materials, chests, consumables, equipped selections) passes through untouched.
- No derived Profile statistic (Power, campaign %, collection counts) is stored — all computed live by `getPlayerProfileSummary`.

## Files changed

### New
- `src/data/playerProfile.ts`
- `src/screens/profile/ProfileScreen.tsx`
- `src/screens/profile/ProfileScreen.css`
- `src/components/profile/EditProfileModal.tsx`
- `src/components/profile/EditProfileModal.css`
- `scripts/verification/playerProfileVerification.ts`
- `scripts/verification/ts-alias-hooks.mjs` (verification-only Node loader shim; not used by the app)
- `docs/handoffs/player-profile/COMPLETION_REPORT.md`

### Updated
- `src/types/player.ts` (added `avatarId`; `SAVE_SCHEMA_VERSION` 10 → 11)
- `src/data/player.ts` (default avatar, v10→v11 migration/backfill, `avatarId` normalization)
- `src/store/playerStore.tsx` (`applyUpdatePlayerProfileState`, `updatePlayerProfile` action)
- `src/app/routes.tsx` (`"profile"` route)
- `src/app/App.tsx` (`ProfileScreen` case)
- `src/components/layout/AppShell.tsx` (exclude `"profile"` from generic bottom nav)
- `src/components/layout/HubHeader.tsx` (profile button navigates to `"profile"`)
- `src/screens/home/HomeScreen.tsx` (profile button navigates to `"profile"`)
- `AGENTS.md` (save schema fact: v10 → v11)
- `docs/PROJECT_STATUS.md`

No gameplay, Results, Shop, Daily Rewards, Chest Opening, Reward Reveal, or Player Level-Up modal code was touched.

## Verification

- `npx tsc -b --noEmit`: passed.
- `npm run build`: passed (347 modules transformed).
- `scripts/verification/playerProfileVerification.ts`: **63/63 assertions passed** — Profile route (single entry, direct-reload resolution, query-string tolerance), avatar catalog (count, uniqueness, safe fallback), display-name validation (trim, empty/whitespace-only, 2/16-char boundaries, control characters), reward-label formatting, v10→v11 migration (avatar backfill + every other v10 field preserved), unknown-avatar repair, clean-v11 idempotence, the Edit Profile transaction (success, invalid name rejected with state unchanged, invalid avatar rejected with state unchanged), and the summary contract (normal progress, MAX LEVEL, collection counts, battle-statistics omission before any clear).
  - Run via a small verification-only Node ESM loader (`ts-alias-hooks.mjs`) since this sandbox has no working `tsx`/`ts-node` install (matches the documented `npx tsx`-hangs limitation from prior handoffs) — it resolves this project's `@/` bundler alias and extensionless relative specifiers under Node's built-in `--experimental-strip-types`.
  - `applyUpdatePlayerProfileState`'s two validation primitives (`validateDisplayName`, `PROFILE_AVATAR_IDS`) are imported and exercised directly from the real, non-JSX `src/data/playerProfile.ts`. The store's own `.tsx` wrapper around them (`playerStore.tsx`, which renders JSX in its Provider) could not be executed under the same plain-Node runner, so its logic is reproduced verbatim (not re-derived) in the script and additionally covered by the passing type-check + build.
- Static mobile CSS inspection at 412×915 / 390×844 / 360×800: no fixed desktop widths; hero/avatar/name/XP bar and all grids reflow via `minmax(0, 1fr)` + `min-width: 0` + `overflow-wrap: anywhere`; dedicated breakpoints at 390px/360px stack the hero and grids to 1-2 columns; `HubScreenShell`'s scroll region keeps `HubBottomNav` from covering content (same shell every other hub screen already uses); `ModalLayer` caps the Edit Profile modal at `max-height: 80dvh` with internal scrolling.

## Unresolved / disclosed limitations

- Battle statistics are limited to stages cleared / highest stage reached; no browser/screenshot verification was performed (per instructions), so real-device rendering of the coded avatar badges has not been visually confirmed beyond static CSS review.
