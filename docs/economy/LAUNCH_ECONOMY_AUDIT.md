# Launch Economy Audit

Status: launch baseline audit (2026-07-22). Companion piece to
STARFIRE_ARMADA_COMPLETE_ECONOMY_DOCUMENT.md. All values are typed data in
`src/data/stageRewards.ts`, `src/data/chestRewards.ts`,
`src/systems/playerProgression.ts`, `src/systems/rewards/applyRewards.ts`
(duplicate conversions), and the per-system cost helpers — nothing lives in
React components.

## Implemented resources — sources / sinks

| Resource (id) | Sources | Sinks | Status |
|---|---|---|---|
| Credits `coins` | stage guaranteed/first/repeat, level-up rewards, chests, starter 5,000 | every upgrade system (Ship Level, Star Rank, Abilities, Companion, Module, Weapon) | implemented |
| Crystals `crystals` | first-clear only, level-10 milestones, rare Epic-chest slot, starter 300 | future premium systems | implemented (premium; not repeat-farmable from stages) |
| Energy `energy` | **corrected:** +20 at every 5th Player Level; starter 100 | 10 per battle start | implemented; regeneration DEFERRED |
| Player XP | stage XP helpers (canonical), scaled by chapter/difficulty | account levels (max 50) | implemented |
| Ship Parts `shipAlloy` | repeat trickle, drops, first clears, level-ups, chests | Ship Level Up | implemented |
| Ship fragments (per ship) | **corrected:** deterministic piloted-ship award per victory (first clear 5 / boss first clear 10 / boss repeat 2; normal repeat 0), duplicate-ship conversion, starter 36 | Star Rank | implemented |
| Universal Shards `universalShards` | drops (boss-weighted), chests | Star Rank shortage fill only | implemented |
| Ability Cores `abilityCores` | level-5 milestones, stage-5 first clear, Rare/Epic chests | Ship Abilities | implemented |
| Companion Data `companionData` | **corrected:** repeat drop-table trickle (2–5, weight 10); stage-3 first clear; Rare chest | Companion Upgrade | implemented |
| Companion Shards `companionShards` | drops, chests, duplicate-companion conversion | none — Companion Rank Up postponed | accumulating; sink DEFERRED (documented) |
| Module Parts `moduleParts` | drops, level-ups, duplicate-module conversion | Module Upgrade | implemented |
| Weapon Parts `weaponParts` | drops, level-ups, duplicate-weapon conversion | Weapon Upgrade | implemented |
| Chests basic/rare/epic | drops (boss-weighted), boss first clear, level-10 milestones | opening UI DEFERRED (contents typed in chestRewards.ts) | implemented (inventory only) |
| Consumables (3 pre-battle ids) | drops, Epic chest | pre-battle use DEFERRED | implemented (inventory only) |

Battle power-ups stay session-temporary — never in inventory. No duplicate
canonical IDs exist (all ids are closed TypeScript unions).

## Corrections made in this audit

1. Ship-specific fragments had NO repeatable source → deterministic
   piloted-ship fragment award appended by `completeCampaignStage`
   (`getStageShipFragmentReward`). Bosses are the farm; universal shards
   remain shortage-fill only.
2. Companion Data had no repeatable source → small repeat drop added.
3. Energy had a sink but zero sources → +20 Energy at every 5th Player
   Level (regeneration remains the real future system).

## Representative progression estimates (normal difficulty, chapter 1)

- Early Ship Level: ~1 battle (repeat ≈ 270 Credits + alloy vs ~120–500/level).
- Mid Ship Level (L10+): several battles of Credits/alloy.
- Star Rank 1★→2★ (40 frags): starter+first-clears cover most; afterwards ~15–20 boss repeats per rank step (2 frags + universal fill).
- Ship Ability level: ~1–2 Player-Level milestones or ~19 battles of Credits (5,000) + cores from milestones/first clears.
- Companion Upgrade: few battles (Credits + Data trickle ≈ 0.35/battle avg 3.5 → modest).
- Module/Weapon Upgrade: ~1–3 battles each early (parts drop ≈ 0.2 × 2–6 per battle + level-ups).
- Player Level: ~34 battles L1→5 by repeats alone (much faster with first clears), ~41 L10→15 on boss repeats, ~138 L40→45 (nightmare bosses).
- Chest: boss repeats ≈ 14% chest chance; level-10 milestones guarantee one.

## Chest expected value (coarse valuation)

Basic < Rare < Epic verified numerically (seeded rolls; see focused
checks). Epic's premium slot (crystals, weight 8/100 per roll) is the only
chest-borne Crystal source — acceptable trickle, revisit when the opening
UI ships.

## Deferred systems (explicitly not implemented)

Shop offers · Daily Rewards · Energy regeneration · real-money purchases ·
event economy · PvP economy · Companion Rank Up · Ship Skins ·
chest-opening UI · server-side anti-cheat.

## Values needing future playtesting

Stage drop weights, chest tables, duplicate-conversion values, ability-core
income rate, Energy milestone amount, Star Rank fragment pacing beyond 3★,
late-chapter Credits scaling (only chapter 1 exists today).
