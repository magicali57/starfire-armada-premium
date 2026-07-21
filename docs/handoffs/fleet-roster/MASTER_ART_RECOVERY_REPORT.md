# Master Art Recovery Report — 6 Deferred Ships

No source files modified. Fleet Roster implementation remains paused.

## Search performed

Searched beyond `public/assets/ui-v2`:

- Whole project repo tree (`find` across every directory except `node_modules`/`.git`), by ship number, slug, "master," "hero," "roster," "cleaned."
- `asset-archive/2026-07-17_cleaned_batch1/` — an existing local archive folder with `bulk_90_assets/` (gameplay sprites + UI assets), `master_art_14/` (mirrors the 14 currently in production, nothing beyond that), and a zip `starfire_cleaned_assets_batch1_v2.zip`.
- That zip's full internal listing — contains only gameplay sprites for ships (all 20), no master art beyond the 14 already in production.
- Both uploaded reference zips (`STARFIRE_ARMADA_UI_HANDOFF.zip` and its `-0ac7152a` duplicate, identical contents) — full listing searched for each of the 6 ship slugs.
- `docs/audit/*.md` and `handoff/*` for any cleanup/classification report — the code comment in `assetRegistry.ts` cites `docs/audit/master_art_17_classification_report.md`, but **that file does not exist anywhere in the repo**. No separate cleanup report exists beyond the inline code comment itself and `docs/audit/batch_03_deliverable.md`'s cleaning-method writeup (which documents a different, earlier batch — the 5 small ship-selection "preview" images, not this master-art set).

## Result: found

All 6 original, uncleaned master artworks exist inside the uploaded zip, at:

`STARFIRE_ARMADA_UI_HANDOFF/new_assets/ships/master_art/{filename}`

This is the **same zip already used throughout this project** for reference images and documentation — not a new upload. Nothing was found in `asset-archive/`, `dist/`, or anywhere else in the live project; the zip is the sole surviving source.

## Per-ship findings

All 6 share the same profile: **1254×1254, RGB (no alpha channel), PNG, checkerboard baked into the pixels exactly like every other pre-cleanup source image in this project (the same failure mode `batch_03_deliverable.md` describes for the 5 preview images) — and the ship artwork itself is fully intact and undamaged in every case.**

| Ship ID | File found | Path | Dimensions | Format | Transparency | Art usable? | Repairable without regenerating? |
|---|---|---|---|---|---|---|---|
| ship-04-electric-shock | `04_electric_shock_master.png` | `new_assets/ships/master_art/` in the zip | 1254×1254 | PNG, RGB | Baked checkerboard, no real alpha | Yes — clean blue lightning-themed fighter, no corruption | Yes |
| ship-06-shield-generator | `06_shield_generator_master.png` | same | 1254×1254 | PNG, RGB | Baked checkerboard, no real alpha | Yes — white/blue ship inside a hex-patterned energy shield sphere | Yes |
| ship-11-gravity-pulse | `11_gravity_pulse_master.png` | same | 1254×1254 | PNG, RGB | Baked checkerboard, no real alpha | Yes — dark ship inside a purple gravity vortex with orbiting asteroids | Yes |
| ship-14-healing-support | `14_healing_support_master.png` | same | 1254×1254 | PNG, RGB | Baked checkerboard, no real alpha | Yes — white/green ship with a green cross/aura healing motif | Yes |
| ship-15-emp-burst | `15_emp_burst_master.png` | same | 1254×1254 | PNG, RGB | Baked checkerboard, no real alpha | Yes — dark ship inside a blue lightning ring | Yes |
| ship-18-orbital-cannons | `18_orbital_cannons_master.png` | same | 1254×1254 | PNG, RGB | Baked checkerboard, no real alpha | Yes — ship flanked by two orbiting satellite spheres, blue energy trail | Yes |

## Why these 6 specifically failed the earlier automated cleanup

Visually confirmed the root cause matches the `assetRegistry.ts` comment exactly: each of these 6 has extensive **pale, light-toned glow/effect regions** (electric-shock's white-blue lightning, shield-generator's near-white hex energy sphere, healing-support's pale green cross aura, emp-burst's light blue lightning ring, gravity-pulse's soft purple vortex edges, orbital-cannons' pale blue trail) whose brightness/tone sits very close to the checkerboard's own light-gray/white squares. The batch-cleaning method documented in `batch_03_deliverable.md` works by sampling border tones and thresholding by color distance — exactly the kind of method that would either eat into these ships' pale effects or leave visible checker residue in them, which is consistent with why they were deliberately deferred rather than pushed through with a result that risked damaging the art.

This is a **masking/cleanup difficulty, not a content problem** — no ship is cropped, corrupted, mislabeled, or missing any part of its design.

## Recovery workspace

Copied (not moved) all 6 originals, untouched, to a new local recovery folder — no production source files were overwritten, and nothing was touched in `public/assets/ui-v2/`:

`asset-archive/2026-07-18_recovery_deferred6/source_uncleaned/`
- `04_electric_shock_master.png`
- `06_shield_generator_master.png`
- `11_gravity_pulse_master.png`
- `14_healing_support_master.png`
- `15_emp_burst_master.png`
- `18_orbital_cannons_master.png`

These are exact copies of the zip originals — same bytes, not re-encoded or altered in any way.

## Proposed cleanup plan (not yet executed)

For each of the 6, a more careful, per-image treatment than the original blanket batch method:

1. Sample the checkerboard's two alternating tones **locally**, from a background-only region close to each image's edges, rather than one global threshold for the whole batch — this avoids misjudging tone based on a different image's checker exposure.
2. Build an alpha mask using **both** color-distance-from-checker-tone **and** local variance/edge detection — pixels inside a soft, low-variance gradient close to a checker tone (the actual checker) get high transparency; pixels that are part of a smooth glow but sit within a coherent lit shape (edge-connected to opaque ship pixels, not isolated in the checker grid) are protected from being erased.
3. Hand-verify each of the 6 individually after masking (not as a batch) given they were already flagged as the harder cases — spot-check the palest glow regions (electric-shock's lightning tips, shield-generator's hex sphere edge, healing-support's cross glow) specifically for checker residue or accidental transparency eating into real effect pixels.
4. Light Gaussian blur on the alpha channel only (same as the original method) to smooth any remaining per-block noise, without softening the ships' hard edges.
5. Output cleaned files as `NN_slug_master.png` (matching the existing 14's naming convention) into a new `asset-archive/2026-07-18_recovery_deferred6/cleaned_pending_review/` folder for your review, **before** anything is copied into `public/assets/ui-v2/ships/master_art/` or registered in `SHIP_MASTER_ART`.

No redrawing, recoloring, cropping, or redesigning — every ship keeps its exact original silhouette, colors, and effects; only the baked checkerboard background is removed.

## Ships requiring regeneration

None. All 6 originals were found, are intact, and are repairable by cleanup alone.

---

Stopping here per your instruction. Waiting for approval before performing any cleanup or touching production files.
