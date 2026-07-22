# Starfire Armada — Agent Instructions

## Project

- Starfire Armada: mobile-first, portrait arcade space shooter.
- Stack: React 18, TypeScript, Vite.
- Primary target: Android/mobile.
- Preserve usability at approximately 412×915, 390×844, and 360×800.

## FUNCTIONAL TRUTH

1. Current source code and canonical stores
2. Current Git history
3. `docs/PROJECT_STATUS.md`
4. Economy and progression documents

Historical `docs/handoffs/` and `docs/blueprint/` are reference only and may be outdated.

## VISUAL TRUTH

1. Matching images in `STARFIRE_ARMADA_UI_HANDOFF/`
2. Existing approved shared UI patterns
3. Current screen styling only when no reference exists

See `docs/UI_REFERENCE_INDEX.md` for the full filename → screen map.

## VISUAL REFERENCE RULES

- Approved UI references are stored under `STARFIRE_ARMADA_UI_HANDOFF/`.
- Before creating or redesigning any screen, inspect the corresponding reference image or images.
- The reference image is the primary source of truth for visual composition, hierarchy, framing, typography scale, spacing, card shape, glow treatment, color balance, artwork emphasis, button hierarchy, and animation mood.
- Current source code, stores, economy data, routes, and transaction systems remain authoritative for functionality and real values.
- Do not copy placeholder values from references, including fake prices, XP values, currency quantities, timers, stage names, player levels, rewards, or unsupported features.
- Do not copy real-money offers, ads, revive systems, event timers, or other unsupported features merely because they appear in a reference.
- Preserve mobile usability at 412×915, 390×844, and 360×800.
- Existing screens that differ significantly from their approved references should receive a focused visual-redesign task without replacing their canonical logic.
- Never redesign a referenced screen from written description alone when its reference image is available.
- Mention the exact reference image paths used in every visual feature completion report.

## Working rules

- Inspect only files relevant to the requested task.
- Do not perform repository-wide audits unless explicitly requested.
- Do not broadly refactor unrelated systems.
- Preserve approved screens and existing behavior.
- Reuse existing layouts, shell, navigation, dialogs, stores, types, and the asset registry.
- Avoid duplicate routes, duplicate state ownership, duplicate economy IDs, and duplicate transaction systems.
- Permanent player progression belongs in the canonical player store.
- Temporary battle-session state remains in memory and must not be persisted.
- Arsenal is the only external weapon-management system.
- Ship abilities are separate from Arsenal weapons.
- Companion Rank Up and Ship Skins are postponed.
- Do not reset or damage existing save data.
  - Current save key: `starfire-armada-v2:save`
  - Current save schema: version 11
- Use focused verification: TypeScript type-check, one production build, and task-specific checks.
- Do not run browser automation or capture screenshots unless explicitly requested.
- Keep completion reports brief.
- Create focused local commits and do not push unless explicitly requested.

## Mobile UI rules

- No page-level horizontal overflow.
- Do not use fixed desktop-width layouts.
- Keep touch targets readable and usable.
- Ensure footer/navigation does not cover content.
- Reuse established mobile visual patterns.
