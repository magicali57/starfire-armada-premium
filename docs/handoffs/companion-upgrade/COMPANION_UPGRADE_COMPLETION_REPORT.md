# Companion Upgrade Completion Report

Date: 2026-07-19
Branch: `companion-upgrade-work`

## 1. Implementation summary

Implemented the dynamic Companion Upgrade screen, a persisted Credits + Companion Data one-level economy, schema-v5 migration, shared quotes/effects/rank milestones, atomic store mutation, Companion Detail and Roster entry points, and Loadout-compatible Power updates. Rank Up, combat hookup, and later Inventory/Shop work remain intentionally out of scope.

## 2. Reference inspection

The approved bitmap presents a shared resource header; `COMPANION UPGRADE` title and `Enhance support unit performance` subtitle; Repair Drone hero at Epic, Level 8, Rank 4/5, and Power 1,980; Level and Rank preview panels; Repair Beam effects; 12,000 Credits + 20 Companion Data; Upgrade and Rank Up buttons; source/pairing cards; and a five-tab footer. The bitmap highlights Inventory, but the later approved navigation decision requires Fleet for Companion screens, so the implementation uses Fleet.

The reference has no multi-level purchase or confirmation control. The implemented transaction therefore upgrades exactly one level and remains on the screen.

## 3. Reference dimensions and hash

- Path: `docs/references/mobile_screens_selected/21_Companion_Upgrade.png`
- Dimensions: 941 x 1672
- SHA-256: `B7C96A3FD340A58828250550E107FE818163EA5F43BDFC9FE2403DE796478535`

## 4. Files created

- `src/systems/companionProgression.ts`
- `src/data/companionUpgrade.ts`
- `src/screens/companion-upgrade/CompanionUpgradeScreen.tsx`
- `src/screens/companion-upgrade/CompanionUpgradeScreen.css`
- `src/components/companion-upgrade/CompanionRankMilestones.tsx`
- `src/components/companion-upgrade/CompanionUpgradeComparison.tsx`
- `src/components/companion-upgrade/CompanionUpgradeCostPanel.tsx`
- `src/components/companion-upgrade/CompanionUpgradeDialog.tsx`
- `src/components/companion-upgrade/CompanionUpgradeHero.tsx`
- `src/components/companion-upgrade/CompanionUpgradeTitleBar.tsx`
- `scripts/verification/companionUpgradeVerification.ts`
- `docs/handoffs/companion-upgrade/screenshots/390x844-insufficient-credits.png`
- `docs/handoffs/companion-upgrade/screenshots/412x915-normal-assault-drone.png`
- `docs/handoffs/companion-upgrade/screenshots/412x915-upgrade-success-assault-drone.png`
- This report.

## 5. Files modified

- `src/app/App.tsx`
- `src/app/routes.tsx`
- `src/components/companion-detail/CompanionDetailProgress.tsx`
- `src/components/feedback/ModalLayer.tsx`
- `src/components/layout/AppShell.tsx`
- `src/data/companionDetail.ts`
- `src/data/companionRoster.ts`
- `src/data/companions.ts`
- `src/data/player.ts`
- `src/screens/companion-detail/CompanionDetailScreen.tsx`
- `src/screens/companions/CompanionsRosterScreen.tsx`
- `src/store/playerStore.tsx`
- `src/types/player.ts`

No production artwork was modified.

## 6. Route architecture

Added route ID `companion-upgrade` and `#/inventory/companions/<companionId>/upgrade`, plus typed origin/path helpers and a safe hash parser. Route resolution checks static routes first, then Companion Upgrade, then Companion Detail, so Detail cannot consume Upgrade URLs. Empty IDs, extra segments, and malformed encoding fail safely; unknown IDs are handled by the screen.

## 7. Entry and Back behavior

Owned Roster Upgrade Ready controls and Companion Detail Upgrade now navigate to the live screen. `origin=companions`, `origin=loadout`, and `origin=home` are retained. Back reconstructs the same companion Detail URL with the corresponding `return` value; missing/unknown origins default to Companions. Invalid companions return to `#/inventory/companions?return=fleet` without relying on browser history.

## 8. Shell and Fleet-active footer

The screen uses `HubScreenShell`, `HubHeader`, and one `HubBottomNav active="fleet"`. `AppShell` suppresses its generic footer on this route, preventing duplicate navigation. Shared shell/header/footer components were not visually changed.

## 9. Companion Data material

`MaterialId` now includes `companionData`; player state persists it in `materials`; the prototype fresh-save balance is 120. Upgrade cost UI uses `MATERIAL_ICON.companionData` and reads the owned balance from player state. Companion Data was not added to `HubHeader`.

## 10. Schema v4-to-v5 migration

`SAVE_SCHEMA_VERSION` is 5. The narrow loader migrates valid v4 saves while preserving currencies, energy, Ship Alloy, ownership, ship/companion/module progress, selected ship, active loadout, campaign progress, rank, XP, and valid fields. Missing Companion Data is added. Valid v5 data is preserved. Malformed JSON and unsupported schemas safely fall back to defaults, and migration results request v5 re-persistence.

## 11. Level 60-to-Level 8 normalization

The exact legacy Repair Drone Level 60 fixture becomes Level 8. Other levels above 20 clamp to 20, values below 1 clamp to 1, and valid 1-20 levels remain unchanged. Rank and XP are preserved.

## 12. Repair Drone Power recalibration

Repair Drone shared base contributions were recalibrated from the old Level-60 prototype so the shared existing Power formula yields Power 1,980 at Level 8. This is definition-level calibration, not a screen exception. Roster, Detail, Upgrade, and Loadout all consume the same Power calculation.

## 13. Progression constants

- Minimum level: 1
- Maximum level: 20
- Maximum rank: 5

All normalization, maximum-level checks, explicit-level Power, effects, quotes, costs, and milestones live in `src/systems/companionProgression.ts`.

## 14. Credits cost curve

For a current level below 20:

`round(1000 * currentLevel * rarityMultiplier)`

Multipliers are Common 1.0, Rare 1.2, Epic 1.5, Legendary 2.0, Mythic 2.5. An Epic Level 8 upgrade therefore costs 12,000 Credits. Level 20 returns no cost. The tuning is provisional.

## 15. Companion Data cost curve

For a current level below 20:

`round((currentLevel + 2) * rarityMultiplier)`

Multipliers are Common 1.0, Rare 1.5, Epic 2.0, Legendary 2.5, Mythic 3.0. An Epic Level 8 upgrade therefore costs 20 Companion Data. Level 20 returns no cost. The tuning is provisional.

## 16. Upgrade quote

`calculateCompanionUpgradeQuote` is the single pure source for current/next level, current/next Power, increase, both costs, current/next effects, and maximum-level state. Upgrade, Detail, Roster affordability, and store validation share it.

## 17. Effect progression profiles

Typed provisional profiles cover all six companions: Assault damage support, Beam support, Missile support, Repair output, Shield strength, and Utility/energy support. Repair Drone reproduces 2,450/s to 2,700/s for Level 8 to 9. Values drive progression UI only; they are not connected to combat and are not final balance.

## 18. Rank milestones

Five typed informational milestones expose rank, required level, title, description, unlocked state, and current state. No Rank Up spending, fragments, claiming, automatic rank changes, or invented level gates were added.

## 19. Atomic store transaction

`upgradeCompanionLevel` validates existence, ownership, current progress, maximum level, authoritative quote, Credits, and Companion Data against fresh state; atomically deducts both; raises the level by exactly one; preserves rank, XP, selected ship, active companion, modules, and unrelated resources; and persists the complete state once. Failure returns the original state object. A synchronous per-companion guard remains held through a 300 ms double-tap window.

## 20. Failure states

Typed results and in-app feedback cover missing, locked, maximum level, insufficient Credits, insufficient Companion Data, both insufficient, busy, and an unexpected safe fallback. No browser alerts, confirms, or prompts are used. Locked and invalid screens preserve identity/back behavior and cannot spend.

## 21. Maximum-level behavior

Level 20 shows `MAX LEVEL`; next level, spendable costs, and Level 21 are omitted. Upgrade is disabled and a maximum-level informational message is available.

## 22. Roster integration

Roster Power continues to use shared Power. Upgrade Ready now requires owned, below Level 20, and sufficient Credits plus Companion Data. Activating an eligible control opens the real upgrade route; locked companions remain non-transactional. Existing card/hero visuals were not redesigned.

## 23. Detail integration

Companion Detail now derives level, Power, next Power, effects, and both costs from the shared quote. Upgrade navigates to the live screen with origin context. Rank Up remains informational, and the existing Detail structure was retained.

## 24. Loadout Power regression

The 116-assertion verification confirms that upgrading the equipped companion changes Loadout Total Power while ship/module contributions and active IDs remain unchanged. Upgrading an unequipped companion leaves the active Loadout total unchanged. The pre-existing roster-equip/loadout-draft conflict edge case was not expanded or changed.

## 25. Asset substitutions

There is no dedicated Repair Beam thumbnail, so the existing registered companion ability/role presentation is reused. There is no dedicated Companion Crate illustration, so source information is presented through registered Companion Data art and text instead of invented production art. No random or generated replacement artwork was added.

## 26. Mobile screenshot verification

Actual in-app-browser captures were opened and inspected:

- 390 x 844, Repair Drone, insufficient Credits: responsive stack, readable panels, contained artwork, and Fleet footer verified.
- 412 x 915, Assault Drone normal upgradeable state: non-Repair silhouette, level preview, costs, and footer verified.
- 412 x 915, Assault Drone upgrade success: Level 1 to 2, Credits 5,000 to 3,800, Companion Data 120 to 115, Power 364 to 367, and success dialog verified.

The rendered documents showed no horizontal overflow at the inspected 390 and 412 widths. During the remaining state/360 capture batch, the in-app browser discarded its tab and then rejected reconnection to the already-approved local preview URL. Therefore no 360 x 800, insufficient-Companion-Data, maximum-level, or locked-state screenshot is claimed. Their logic is covered by automated assertions, but that is not a substitute for the missing visual captures.

## 27. Browser-console result

The in-app browser did not expose a console-log collection method in this run. On the valid rendered captures there was no runtime error overlay or missing-image state. After the browser session was discarded, the remaining console verification could not be completed and is not claimed.

## 28. Type-check result

`npm run typecheck` passed (`tsc -b --noEmit`). It was rerun after removing all temporary screenshot fixture code.

## 29. Build result

`npm run build -- --outDir %TEMP%/starfire-companion-upgrade-build --emptyOutDir` passed. Vite transformed 293 modules and emitted the production build only to the Windows temporary directory, not `public/`.

## 30. Tests

`scripts/verification/companionUpgradeVerification.ts` passed 116 assertions. Coverage includes route parsing/resolution; v4-to-v5 migration and corrupt fallback; cost/quote/effect rules; success and all resource/ownership/max/missing failures; preservation of rank, XP, selected ship, active companion, modules, and unrelated resources; Roster/Detail/Upgrade/Loadout parity; and equipped versus unequipped Loadout Power.

## 31. Asset preflight/postflight

The approved reference hash remained unchanged. All six companion artwork files and the Companion Data icon retained their recorded byte sizes and SHA-256 hashes. `public/` still contains exactly 253 files. A runtime registry traversal found 211 unique exported `/assets/` URLs (a superset of the 88 literal paths called out in the task), and every resolved file exists; none are missing.

## 32. Known limitations

- Progression-effect values are UI/progression data only and are not connected to gameplay.
- Economy tuning is provisional.
- Rank Up, Companion Data acquisition, Materials Inventory, Shop, and source navigation remain informational.
- Dedicated Repair Beam thumbnail and Companion Crate art do not exist, so registered substitutions are used.
- The final in-app-browser reconnect failure prevented the remaining four requested visual-state captures and direct browser-console collection; see sections 26-27.
- The known existing roster-equip/loadout-draft conflict edge case remains unchanged.

## 33. Scope confirmation

Companion Rank Up, Module screens, Materials Inventory, Inventory Hub, Shop, gameplay integration, and unrelated approved screens were not implemented or visually changed. Ship upgrade formulas, Ship Alloy economy, module definitions/progression, production artwork, and the frozen shared Fleet/Hub components were not modified.
