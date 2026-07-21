# Deferred 6 Master Art — Cleanup Report

Review package only. Nothing copied to `public/assets/ui-v2`. `assetRegistry.ts` not touched. Fleet Roster implementation not started.

## Method used

Per-image, not one blanket threshold. A first pass (nearest-of-two-global-checker-tones + border flood-fill) left visible defects on inspection — thin residual grid-line seams and an isolated un-filled checker square — so it was replaced with a saturation/lightness classifier instead of exact checkerboard-phase detection (phase detection proved unreliable: autocorrelation returned a different, sometimes-wrong period per image on the first attempt). The final method:

1. **Local sampling** of each image's own border ring (8px deep) to measure that image's actual checker tone range — done per image, not a shared constant.
2. **Color-distance masking**: every checker sample across all 6 images measured as near-perfectly neutral (max channel − min channel ≤ 1–2) at high lightness (~240–255). Every glow/effect in these 6 images is distinctly chromatic even at its palest (blue lightning, purple vortex, green aura). A pixel's saturation and lightness, compared against that image's own measured border range, separates checker from art far more reliably than trying to match two fixed average tones.
3. **Structure/edge awareness**: the resulting background-likelihood score is spatially smoothed before thresholding, so the background/art boundary follows the true gradient shape of a fading glow rather than per-pixel noise.
4. **Connectivity to the real background region**: the loose background mask is flood-filled starting only from pixels touching the four image edges. A pixel is only ever made transparent if it's reachable from the outside through other background-like pixels — this is what protects legitimate pale ship content (white hull plating, silver metal) sitting deep inside the art from ever being erased, since such regions aren't connected to the outer border.
5. Semi-transparent boundary pixels have the local background tone **unmixed** out of their stored color, so no pale halo remains against a new background.
6. **Alpha-channel-only** Gaussian smoothing removes residual per-pixel noise; color is never blurred, cropped, resized, or repositioned at any step.

## Result: 3 of 6 meet the acceptance standard, 3 do not

Confirmed by direct visual inspection against dark, light, and checker-preview backgrounds for every ship (not inferred from statistics).

### Pass — ready for your review as production-quality cleanup

| Ship | Verdict |
|---|---|
| ship-04-electric-shock | **Pass.** Lightning and glow cloud fully preserved, clean natural edges on both dark and light backgrounds, no checker residue found anywhere. |
| ship-15-emp-burst | **Pass.** Lightning ring fully preserved, clean edges, no checker residue found. |
| ship-18-orbital-cannons | **Pass.** Trail and orbiting spheres preserved, smooth ring boundary, only negligible/non-visible checker trace. |

### Fail — do not use in production, needs manual cleanup

| Ship | Verdict |
|---|---|
| ship-06-shield-generator | **Fail.** A faint grid/mesh pattern remains visible inside the large pale energy-sphere effect, and the sphere's outer boundary shows a ragged, bitten-looking edge rather than a smooth circular fade. |
| ship-14-healing-support | **Fail.** Same defect class as shield-generator: visible residual grid pattern inside the pale aura, and ragged/torn-looking edge intrusions at the aura's boundary (most visible at left and right). |
| ship-11-gravity-pulse | **Fail.** Asteroids and lightning arcs are crisp and clean, but a faint checker mesh is visible across the pale purple/white swirl bands that make up a large fraction of the composition. |

**Root cause, confirmed by comparing against the original source pixels directly (not assumed):** all 3 failing ships have one large, gradually-fading, near-white translucent effect (energy sphere / aura / vortex swirl) that dominates the composition. Cropping into the *original, uncleaned* source at full resolution shows the checkerboard already showing through this exact kind of soft, low-opacity region — meaning the original generation tool rendered these glow effects at partial opacity blended over the checkerboard, then flattened everything to plain RGB (the same "no alpha channel" finding from the recovery report), baking an approximation of the checker permanently into the faintest parts of the glow itself. Recovering a fully clean result from a flattened blend like this is fundamentally harder than removing a checkerboard sitting *behind* fully-opaque or empty regions (which is what worked cleanly for electric-shock, emp-burst, and orbital-cannons, whose glow/lightning effects are more contained and less dominated by one huge, very gradual pale field). I did not force a lower-confidence result through — per your instruction, these 3 are flagged for manual cleanup rather than approved.

## Per-ship deliverables (all 6, pass and fail alike, for your review)

For each ship: cleaned PNG, transparent-checker preview, dark-background preview, light-background preview — all in the attached zip and contact sheet.

### ship-04-electric-shock (PASS)
- Preserved: lightning tendrils (both arms), the soft glow cloud around them, engine flame, all hull panel colors/gradients.
- Checker residue: none found.
- Uncertain edges: none.
- Alpha boundary: smooth, natural falloff at the glow cloud's outer edge on both dark and light backgrounds.
- Dimensions confirmed: 1254×1254. Source not overwritten (hash below unchanged from original extraction).

### ship-06-shield-generator (FAIL — manual cleanup needed)
- Preserved: ship hull, thruster flames, the hex-mesh texture that is part of the sphere's own intended design.
- Checker residue: **yes** — faint but visible grid pattern remains inside the pale sphere.
- Uncertain edges: **yes** — the sphere's outer boundary is ragged/bitten rather than a smooth circle; this looks like a genuine defect, not an intentional torn-edge design (compare the smooth circular silhouette elsewhere in the same sphere).
- Alpha boundary: inconsistent — clean in the upper portion, ragged at the lower-left and lower-right.
- Dimensions confirmed: 1254×1254. Source not overwritten.

### ship-11-gravity-pulse (FAIL — manual cleanup needed)
- Preserved: asteroids (all of them, full detail), lightning arcs, ship hull, engine flame.
- Checker residue: **yes** — visible fine grid across the pale purple/white swirl bands.
- Uncertain edges: none of the hard silhouette edges (asteroids/ship) are affected — only the internal texture of the pale swirl itself.
- Alpha boundary: outer boundary against the dark/light backgrounds is smooth; the residue is internal, not edge-related.
- Dimensions confirmed: 1254×1254. Source not overwritten.

### ship-14-healing-support (FAIL — manual cleanup needed)
- Preserved: ship hull, cross/aura motif shape, sparkle particles, engine flame.
- Checker residue: **yes** — visible grid pattern inside the pale green aura.
- Uncertain edges: **yes** — ragged black intrusions cut into the aura at the left and right sides, same defect class as shield-generator.
- Alpha boundary: inconsistent, same pattern as shield-generator.
- Dimensions confirmed: 1254×1254. Source not overwritten.

### ship-15-emp-burst (PASS)
- Preserved: full lightning ring, all sparks/nodes along it, hull, engine flame.
- Checker residue: none found.
- Uncertain edges: none.
- Alpha boundary: smooth, natural falloff.
- Dimensions confirmed: 1254×1254. Source not overwritten.

### ship-18-orbital-cannons (PASS)
- Preserved: both orbiting satellite spheres, connecting trail, hull, engine flames.
- Checker residue: negligible — not visible at normal viewing size on either background.
- Uncertain edges: none significant.
- Alpha boundary: smooth oval ring boundary.
- Dimensions confirmed: 1254×1254. Source not overwritten.

## Source integrity confirmation

Every file in `asset-archive/2026-07-18_recovery_deferred6/source_uncleaned/` has the exact same SHA-256 hash and byte size as when it was first extracted from the zip during the recovery step — none were overwritten or modified by this cleanup pass. Cleaned outputs were written only to `asset-archive/2026-07-18_recovery_deferred6/cleaned_pending_review/`, a separate folder; nothing in `public/assets/ui-v2` was touched.

| File | Source SHA-256 (unchanged) | Cleaned-output SHA-256 |
|---|---|---|
| 04_electric_shock_master.png | `43e133e6...6fd62` | `c102ce2c...b09f65` |
| 06_shield_generator_master.png | `f08d86ce...be9162a` | `fe5d92c1...6cfd9a8` |
| 11_gravity_pulse_master.png | `32808dbf...a7a5755` | `cacc0493...30025c4` |
| 14_healing_support_master.png | `77160255...9aa88b` | `c660ceac...b7d8cf` |
| 15_emp_burst_master.png | `85d610fd...6164a` | `698716b5...4e536fd0` |
| 18_orbital_cannons_master.png | `ef1df830...398978` | `e8f39383...6ae5671` |

(Full untruncated hashes are in `hashes.txt` alongside this report.)

## Deliverables in this package

- `deferred6_cleaned_review.zip` — all 6 cleaned PNGs (pass and fail alike, for inspection), 1254×1254, RGBA, exact original filenames.
- `contact_sheet.png` — all 6 ships × 3 backgrounds (checker/dark/light) in one sheet.
- Individual `_dark.png` / `_light.png` / `_transparent_preview.png` per ship.
- `hashes.txt` — full SHA-256 for every source and cleaned file.
- This report.

## Recommendation

Proceed with the 3 passing ships (electric-shock, emp-burst, orbital-cannons) whenever you're ready to move them toward production — still pending your explicit go-ahead, since you asked me to stop after this package. The 3 failing ships (shield-generator, gravity-pulse, healing-support) need manual cleanup — likely hand-painting/masking the pale sphere/aura/swirl regions in an image editor rather than a further automated pass, since the underlying defect is baked into the source's own flattened blend, not a threshold-tuning problem.

---

Stopping here per your instruction. Not beginning Fleet Roster.
