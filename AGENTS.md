# Starfire Armada — Agent Instructions

## Project

- Starfire Armada: mobile-first, portrait arcade space shooter.
- Stack: React 18, TypeScript, Vite.
- Primary target: Android/mobile.
- Preserve usability at approximately 412×915, 390×844, and 360×800.

## Source-of-truth priority

1. Current source code
2. Current Git history and recent commits
3. `docs/PROJECT_STATUS.md`
4. Canonical economy documents
5. Historical `docs/handoffs/` and `docs/blueprint/` — reference only, may be outdated

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
