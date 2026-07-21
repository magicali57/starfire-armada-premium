# Arsenal Main Completion Report

## Scope and reference

- Implemented only the Arsenal Main / Weapon Roster screen.
- Visual authority: `docs/references/generated_arsenal/01_Arsenal_Main.png` (941 × 1672).
- Asset authority: `docs/references/generated_arsenal/ARSENAL_ASSET_MANIFEST.md.txt` (the supplied file has a `.md.txt` suffix, although the brief names `.md`).
- Canonical route: `#/arsenal`.

## Implementation

- Registered all twelve approved 1024 × 1024 transparent weapon masters through `getWeaponMasterArt(weaponId)`.
- Added one typed weapon-definition source and pure roster helpers for filtering, sorting, counts, selection, and featured-weapon fallback.
- Prototype roster state exposes eight unlocked weapons and Homing Missiles as the initial equipped weapon. Equip changes are screen-local and deliberately do not change saves, ship combat, modules, companions, currencies, or loadouts.
- Added ALL, LASER, MISSILE, BEAM, KINETIC, and ENERGY filters plus Default, Power, Rarity, Level, and Name sorting.
- Cards show artwork, rarity, class, level, Power, locked/equipped/upgrade-ready presentation, and wrap essential names.
- Featured panel shows live selected artwork, identity, stats, description, equipped state, and Details/Equip/Upgrade actions.
- Details opens `WEAPON DETAIL — Coming in the next Arsenal phase.`
- Upgrade opens `WEAPON UPGRADE — Coming after Weapon Detail.`
- No Weapon Detail or Weapon Upgrade route was created.

## Fleet ownership and mobile audit

- Shared category navigation is now `SHIPS | COMPANIONS | MODULES | ARSENAL` and Arsenal uses the existing Fleet-aligned collection header.
- The selector is a contained horizontal scroller with readable 10px labels and automatically reveals the active category.
- Arsenal uses `HubScreenShell`, `HubHeader`, and `HubBottomNav active="fleet"`; AppShell suppresses its duplicate footer.
- Static audits covered 412 × 915, 390 × 844, and 360 × 800: contained widths, no new `100vw`, two-column readable card layout, wrapped weapon names, contained artwork, safe stacked featured content, and reachable actions/footer.

## Verification

- TypeScript: `npm run typecheck` passed.
- Production: `npm run build -- --outDir temp/arsenal-main-build` passed.
- Focused route inspection confirmed `#/arsenal`, `#/ships`, `#/inventory/companions`, and `#/inventory/modules`.
- All twelve weapon PNGs exist, load as 1024 × 1024 ARGB images, and were not modified.

## Known limitations

- Arsenal ownership/equip state is an explicit prototype fixture and is not persisted.
- Weapon Parts is registered but unused.
- Weapon Detail, Weapon Upgrade, upgrade economy, gameplay firing integration, screenshots, visual fixtures, and unrelated screens were not implemented.
