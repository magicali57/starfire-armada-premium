# Manual Repair Report — 3 Rejected Ships

Review package only. Nothing copied to `public/assets/ui-v2`. `assetRegistry.ts` not touched. Fleet Roster implementation not started. Sources in `source_uncleaned/` and the 3 already-approved cleaned files are unchanged (verified below).

## Method

Per your instruction, none of these three received another pass of the generic threshold cleanup. Each was treated as its own reconstruction problem, working from the `cleaned_pending_review/` output as a starting point, and cross-checked against the original uncleaned source. Every repair combines the same two building blocks, tuned per image:

1. **Boundary reconstruction (shape-domain, not pixel-domain).** The ragged/bitten edges and, for Healing Support, one fully-enclosed torn hole, were fixed by smoothing the *shape* of the alpha silhouette itself — a large-radius blur of the binary opaque/transparent mask, re-thresholded, then given a small anti-aliased feather to match the rest of the image's edge softness. This removes jagged small-scale bites and closes small enclosed holes while preserving the genuine large-scale silhouette (the dip near Shield Generator's and Healing Support's engine flames is real and intentional — confirmed by inspecting the original uncleaned source, which shows the glow legitimately thinning out there — so it survives the smoothing; only the ragged small-scale noise on top of it is removed). Gravity Pulse's edges were already confirmed clean in the automated review, so this step was skipped for it.
2. **Checkerboard-in-color reconstruction (frequency-domain, ship-protected).** The residual grid pattern lives in the RGB channels of pixels that are already fully opaque (confirmed by inspecting the alpha channel directly — it's solid in the affected regions), which means it was baked in by the original tool's own alpha-blend-then-flatten step, not by the transparency cleanup. Each image was denoised with a checkerboard-period-matched median filter (period measured directly per image: 32px for Shield Generator, 29px for Gravity Pulse, 22px for Healing Support), then blended back against the original pixels using a local-saturation gate: the checkerboard is consistently near-neutral (low saturation) while every intended effect in these images — hex-grid lines, lightning arcs, cross symbols, sparkle particles — carries real color, so the gate keeps those regions untouched and only smooths the low-saturation checker-contaminated areas. Ship hulls (and, for Gravity Pulse, the asteroids) were additionally protected by an explicit mask built from dark-pixel connectivity, since their own bright metal-panel highlights can dip into low-saturation territory the same way the checker does; inside that mask the original pixels are kept exactly as-is, unfiltered.

This is a best-effort reconstruction, not pixel-perfect recovery. As reported in the cleanup review, the checker is mathematically inseparable from the palest parts of these glows in the flattened source — recovering the *exact* original unblended values isn't possible. What's reconstructed here is a visually clean, naturally-graded result consistent with the surrounding art, matching the spirit of "match the original glow color, shape, and intensity" rather than a literal pixel restoration.

## Per-ship results

### ship-06-shield-generator
- **Boundary:** The ragged black bites at the lower-left and lower-right (visible in the BEFORE crop) are gone. The smoothed boundary keeps the legitimate dip around the engine flames — confirmed against the original source, which shows the glow genuinely thinning there, so this isn't a fabricated addition of sphere that was never there.
- **Interior:** The blue hex-grid shield texture is fully intact and undimmed; the faint grid contamination that was visible in the pale sphere on both dark and light backgrounds is gone.
- **Ship:** Completely unchanged — the saturation gate and the median filter's edge-preserving property both apply zero denoising to the ship's own high-contrast paneling.

### ship-11-gravity-pulse
- **Boundary:** Untouched, per the automated review's own finding that the edges were already clean — no risk introduced by touching something that wasn't broken.
- **Interior:** The fine grid contamination across the pale purple/white swirl bands is removed. The vortex still reads as one continuous, naturally-graded swirl (not flattened to a single solid color) on both dark and light backgrounds.
- **Ship + asteroids:** Both are explicitly protected by the dark-seed connectivity mask; an earlier attempt without this mask blurred the ship's white wing panels badly (visually confirmed and rejected before settling on this final version), which is why the mask exists.

### ship-14-healing-support
- **Boundary:** The single largest defect of the three — a fully-enclosed torn hole in the upper-left of the aura — is completely closed. The ragged intrusions at the aura's left/right sides are smoothed into a natural scalloped edge that follows the six engine-flame notches at the bottom, rather than erasing that scalloping into one plain circle.
- **Interior:** The residual grid pattern inside the pale green aura is removed. All four green cross symbols and the sparkle particles are fully preserved with no softening.
- **Ship:** Unchanged, protected by the same dark-seed mask technique used for Gravity Pulse.

## Source and prior-approval integrity

| File | Source SHA-256 (unchanged, verified again) | Repaired-output SHA-256 |
|---|---|---|
| 06_shield_generator_master.png | `f08d86ce...be9162a` | `e448e92d...747efd` |
| 11_gravity_pulse_master.png | `32808dbf...a7a5755` | `7c1b2b00...5636a5` |
| 14_healing_support_master.png | `77160255...9aa88b` | `6b9d836d...756c2` |

(Full untruncated hashes in `hashes_repaired.txt`.) The three already-approved cleaned files (electric-shock, emp-burst, orbital-cannons) were not opened or modified in this pass.

## Deliverables in this package

- Repaired PNGs: `06_shield_generator_master.png`, `11_gravity_pulse_master.png`, `14_healing_support_master.png` — all 1254×1254 RGBA, exact original filenames, written only to `manual_repair_pending_review/`.
- Per-ship `_transparent_preview.png`, `_dark.png`, `_light.png`.
- Per-ship `_before_after.png` — a direct side-by-side crop of the specific defect region, BEFORE (rejected automated cleanup) vs. AFTER (this manual repair).
- `contact_sheet_manual_repair_3.png` — only the 3 rejected ships, ×3 backgrounds.
- `hashes_repaired.txt` and this report.

## What's still not done (by design, per your stop instruction)

Nothing has been copied into `public/assets/ui-v2/ships/master_art/`, `assetRegistry.ts` is unchanged, and Fleet Roster implementation has not started. All 6 ships (3 approved, 3 now repaired) remain in review-only folders pending your go-ahead.

---

Stopping here per your instruction, with all three manual-repair candidates presented for review.
