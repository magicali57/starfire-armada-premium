# Shared UI Motion Foundation — Completion Report

## What was built

**`src/styles/motion.css`** (imported once in `app/main.tsx`, after `effects.css`) — the shared token/keyframe/utility layer. Adds a second, purpose-named token scale alongside the existing `tokens.css` `--duration-*`/`--ease-standard` (left untouched, still used by `.press-scale`/`Buttons.css`/`controls/ProgressBar.css`):

- Durations: `--motion-duration-instant/fast/normal/slow/reveal`.
- Easing: `--motion-ease-standard/enter/exit/spring` (the last a restrained overshoot `cubic-bezier(0.34,1.56,0.64,1)`, used for Level-Up's level-number emphasis).
- Stagger: `--motion-stagger-step` (55ms).
- Utility classes: `.motion-fade-in`, `.motion-scale-in`, `.motion-rise-in`, `.motion-stagger-item` (bounded via `calc(min(var(--motion-index,0),8) * var(--motion-stagger-step))`), `.motion-glow-rare/epic/legendary` (restrained `filter: brightness` pulses only).
- Reduced motion: `styles/globals.css`'s existing global "zero every animation/transition **duration**" rule is kept as-is; `motion.css` adds a second rule zeroing `animation-delay`/`transition-delay` (a duration-only rule doesn't stop a delayed animation from still waiting) and force-disabling the three continuous `.motion-glow-*` loops. Nothing is ever hidden, only motion is removed.

**Reusable primitives** (`src/components/motion/`):
- `motionMath.ts` — pure, JSX-free math (`toFiniteNumber`, `clampPercent`, `easeOutCubic`, `computeAnimatedValue`, `boundedStaggerIndex`), directly unit-tested.
- `AnimatedNumber.tsx` — rAF count-up built on `computeAnimatedValue`; instant on first mount, instant under `prefers-reduced-motion`, always lands exactly on the real target, cancels its rAF on unmount and on every re-target, never touches PlayerState.
- `ProgressFill.tsx` (+`.css`) — same role as `controls/ProgressBar.tsx` (untouched, still used elsewhere) but fills via `transform: scaleX` (compositor-only) instead of `width`, and clamps via `clampPercent`.
- `MotionStaggerGroup.tsx` — wraps a short fixed list of sibling cards and tags each with `--motion-index`/`.motion-stagger-item`.

## Screens updated

- **Player Profile**: hero + all section panels wrapped in `MotionStaggerGroup` (short entrance stagger); XP bar now `ProgressFill`; Total Power now `AnimatedNumber`. Collection/campaign counts, Level number, and battle-statistic counters deliberately left as plain text (no repeated count-up on ordinary rerenders; Profile still reads plainly, not like a reward screen).
- **Battle Results**: `BattleResultHero`/`BattlePerformanceSummary`/`BattleRewardSummary` CSS re-pointed from hard-coded durations to `--motion-*` tokens; stagger delays now bounded via `min(...,8)`; stars now reveal with a bounded per-star stagger only when `starsEarned` is genuinely supplied; Player XP and currency (Credits/Crystals) reward-row amounts now use `AnimatedNumber` — material/chest/collectible amounts stay plain text.
- **Player Level-Up modal**: durations/easing re-pointed to shared tokens (level emphasis now uses `--motion-ease-spring`); reward/unlock stagger bounded; currency reward amounts use `AnimatedNumber`; Rare/Epic/Legendary reward rows get the matching `.motion-glow-*` class.
- **Reward Reveal overlay**: durations re-pointed to shared tokens; the bespoke legendary-only glow keyframe was removed in favor of the shared `.motion-glow-legendary` class, and Rare/Epic art now also gets the matching restrained glow (previously only Legendary pulsed).
- **`ModalLayer`** (the one shared wrapper behind every modal in the app, including Locked Content/Edit Profile/notices): added a backdrop fade (`.motion-fade-in`) and a panel rise-in (`.motion-rise-in`) — the "modal entrance/exit" foundation piece, added once instead of per-modal.
- Button feedback (`.btn`/`.press-scale`, `Buttons.css`) already had pressed-transform + disabled state and was left untouched — it already is the one shared owner of that behavior.

## Reduced-motion behavior

Global duration-zeroing rule unchanged; added delay-zeroing + explicit glow-loop disabling in `motion.css`. `AnimatedNumber` additionally checks `matchMedia("(prefers-reduced-motion: reduce)")` directly (a CSS rule alone can't stop a JS `requestAnimationFrame` loop) and renders the final value immediately when set. Content/functionality is never hidden under reduced motion — only motion is removed.

## Confirmation

No changes to `PlayerState`, save schema, reward/XP/economy values, battle-session logic, campaign routing, or any transaction. Every edit is either a new presentation-only file or a CSS/JSX display-value substitution (e.g. `{n.toLocaleString()}` → `<AnimatedNumber value={n} />`) inside already-existing components.

## Focused verification

- `scripts/verification/uiMotionFoundationVerification.ts` — 37 assertions on `motionMath.ts` (the exact logic `AnimatedNumber`/`ProgressFill` run): reaches correct final value, zero target, changed target mid-flight, NaN/Infinity `from`/`to`/duration/elapsed all handled safely, zero/negative duration treated as already-complete, negative target reached exactly, `clampPercent` clamps 0–100 and treats non-finite input as 0, `boundedStaggerIndex` caps at 8 regardless of how large the input is. Passed.
- The `.tsx` primitives themselves (`AnimatedNumber`/`ProgressFill`/`MotionStaggerGroup`) and their wiring into Profile/Results/Level-Up/Reward Reveal contain JSX and (for `AnimatedNumber`) depend on `requestAnimationFrame`/`matchMedia`, so — same disclosed limitation as every prior handoff — they cannot run under this sandbox's plain `node --experimental-strip-types` runner; verified by static code review instead (unmount/re-target cancellation via the `useEffect` cleanup, reduced-motion branch, once-per-session gating in `ResultsScreen` unchanged, no new store/state reads beyond existing props).
- `npx tsc -b --noEmit` — passed.
- `npm run build` — passed; grepped the built bundle for `"Win Stage"`/`"Lose Stage"` — still absent (dev-only debug controls still dead-code-eliminated; unaffected by this task).
- Static mobile CSS review at 412×915 / 390×844 / 360×800: all new/changed rules only ever animate `opacity`/`transform`/`filter` inside already-`min-width:0`/`overflow-x:hidden`-safe containers; no fixed widths introduced; `ProgressFill`/`AnimatedNumber` add no layout-affecting properties; stagger/glow never overlaps the footer or blocks a button; nothing depends on `:hover`.

## Deliberately deferred / not done

- No JS-driven number/progress animation was added to collection counts, campaign stage counters, or battle statistics on Profile — explicitly excluded by the task ("do not animate every small label"/"do not animate collection counts repeatedly").
- Continuous rarity glow (`.motion-glow-*`) was applied only to single large focal elements (Reward Reveal's one art piece, Level-Up's reward rows) — not to Battle Results' reward-row list, to avoid many simultaneous ambient loops on one screen; those rows keep their existing static rarity border-color coding only.
- `Buttons.css`/`.press-scale` were left untouched — they already own consistent press/disabled feedback and needed no changes.
- No animation library was added; everything is CSS + a small `requestAnimationFrame` loop already in the codebase's existing style.
