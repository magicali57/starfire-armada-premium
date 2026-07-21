# Weapon Upgrade Completion Report

## Scope

Implemented the focused Weapon Upgrade phase on `weapon-upgrade-work`, using `03_Weapon_Upgrade.png` as the structural authority and the approved Arsenal weapon masters plus `weapon_parts.png` as production artwork.

## Implementation

- Added canonical `#/arsenal/weapon/:weaponId/upgrade` routing and strict ID parsing.
- Added the responsive Weapon Upgrade screen with Fleet-active hub navigation, weapon identity artwork, current/next level and Power, numeric stat comparison, Credits and Weapon Parts costs, milestones, locked/insufficient/max states, and modal success/error feedback.
- Connected Arsenal Main and Weapon Detail to one persistent weapon progression/equipment source. The old session-only equip module was removed.
- Weapon Detail's Upgrade action now opens the canonical upgrade route.
- Added atomic one-level weapon upgrades: validation precedes a single state change that deducts Credits and Weapon Parts and increments progression together.
- Added save schema v7 migration fields: `weaponParts`, `ownedWeaponIds`, `equippedWeaponId`, and `weaponProgress`. Existing saves receive 71 Weapon Parts and the approved Homing Missiles presentation defaults without altering unrelated progress.
- Preserved Homing Missiles at Lv. 70 / Power 1,920. Its next quote is Lv. 71 / Power 1,948, Seeker Damage 14.8%, Tracking Speed 8.4%, Lock Capacity 6, Reload 5.4s, costing 18,000 Credits and 24 Weapon Parts.
- Added Homing milestones at levels 72, 75, and 80.

## Verification

- `npm.cmd run typecheck`: passed.
- `npm.cmd run build -- --outDir temp/weapon-upgrade-build`: passed; 328 modules transformed.
- Static route/CSS audit: canonical upgrade route is resolved before detail, AppShell suppresses the duplicate footer, Fleet remains active, unknown IDs render Weapon Not Found, and the screen has a 360px compact breakpoint.
- Focused executable assertions were prepared in ignored `temp/weapon-upgrade-check.ts`; their bundle execution was blocked by the environment's exhausted escalation allowance after the production build succeeded.
- Browser automation and screenshots were intentionally not used, per task constraints.

## Boundaries Preserved

No gameplay/projectile behavior, loadout integration, ship/module/companion progression, or unrelated screen implementation was changed. Arsenal Main and Weapon Detail received only the integration necessary to consume canonical progression and reach Weapon Upgrade.
