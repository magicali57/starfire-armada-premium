import type { BattleResultsView } from "@/systems/battleSession";
import type { ChestId, ResolvedReward, RewardEntry } from "@/types";
import { toRewardDisplayRows } from "@/data/rewardDisplay";
import { getShipById } from "@/data/ships";
import { getCompanionById } from "@/data/companions";
import { getModuleById } from "@/data/modules";
import { getWeaponById } from "@/data/weapons";

// Canonical Reward Reveal presentation helper. Builds a reveal queue
// PURELY from an already-completed BattleResultsView — every entry here
// was already applied by the canonical reward transaction before Results
// (and therefore before Reward Reveal) ever rendered. This module never
// grants, resolves, opens, or converts anything; it only decides which
// already-applied entries are special enough to get a dedicated reveal,
// and formats them via the existing rewardDisplay.ts helper (no second
// reward catalog).

export interface RewardRevealItem {
  key: string;
  rewardId: string;
  kind: "collectible" | "chest" | "rare-item";
  displayName: string;
  quantity: number;
  rarity?: string;
  imageSrc?: string;
  subtitle?: string;
  isNew: boolean;
}

const HIGH_VALUE_CHESTS: ReadonlySet<ChestId> = new Set(["chestRare", "chestEpic"]);
// Reward Reveal's own "special enough" bar for anything that isn't a
// collectible or a high-value chest — deliberately narrower than "any
// rare drop" so Credits/XP/Energy/common materials/ordinary fragments/
// Basic Chests/duplicate conversions/routine repeat-clear rewards are
// never revealed (they still render normally in BattleRewardSummary).
const SPECIAL_RARITIES: ReadonlySet<string> = new Set(["epic", "legendary"]);

/** The item's OWN canonical rarity (ship/companion/module/weapon
 *  definition) — more meaningful for the reveal's glow treatment than the
 *  roll rarity a drop table happened to tag the grant with. Falls back to
 *  the resolved reward's rarity when the collectible id can't be found
 *  (defensive only; validateEntry already rejects unknown ids upstream). */
function collectibleDefinitionRarity(entry: Extract<RewardEntry, { kind: "collectible" }>): string | undefined {
  switch (entry.collectibleType) {
    case "ship":
      return getShipById(entry.collectibleId)?.rarity;
    case "companion":
      return getCompanionById(entry.collectibleId)?.rarity;
    case "module":
      return getModuleById(entry.collectibleId)?.rarity;
    case "weapon":
      return getWeaponById(entry.collectibleId)?.rarity;
  }
}

function collectibleSubtitle(collectibleType: Extract<RewardEntry, { kind: "collectible" }>["collectibleType"]): string {
  switch (collectibleType) {
    case "ship":
      return "New Ship";
    case "companion":
      return "New Companion";
    case "module":
      return "New Module";
    case "weapon":
      return "New Weapon";
  }
}

function subtitleFor(entry: RewardEntry): string {
  if (entry.kind === "collectible") return collectibleSubtitle(entry.collectibleType);
  if (entry.kind === "chest") return "Unopened Chest";
  return "Rare Reward";
}

function toRevealItem(
  reward: ResolvedReward,
  kind: RewardRevealItem["kind"],
  isNew: boolean,
): RewardRevealItem {
  // Reuses the ONE canonical presentation helper for icon/label/quantity —
  // never re-derives a display name or icon path here.
  const [row] = toRewardDisplayRows([reward]);
  const rarity = reward.entry.kind === "collectible" ? collectibleDefinitionRarity(reward.entry) ?? row?.rarity : row?.rarity;
  return {
    key: `${kind}-${reward.entry.kind}-${row?.itemId ?? "unknown"}-${isNew ? "new" : "grant"}`,
    rewardId: row?.itemId ?? "unknown",
    kind,
    displayName: row?.displayName ?? "Reward",
    quantity: row?.amount ?? 1,
    rarity,
    imageSrc: row?.icon,
    subtitle: subtitleFor(reward.entry),
    isNew,
  };
}

/**
 * Builds the ordered Reward Reveal queue for a completed victory:
 * 1. Newly acquired collectibles (ship/companion/module/weapon) — always
 *    genuinely new, never a duplicate (view.newCollectibles already
 *    excludes duplicate conversions upstream in getBattleResultsView).
 * 2. Unopened Rare/Epic chests among the entries this completion actually
 *    granted (Basic Chests are never special enough to reveal).
 * 3. Any other granted entry whose canonical rarity is Epic or Legendary.
 *
 * Defeat never produces a queue. An empty return means "no eligible
 * rewards" — the caller must render nothing, never a fabricated item.
 */
export function getRewardRevealQueue(view: BattleResultsView): RewardRevealItem[] {
  if (view.outcome !== "victory") return [];

  const items: RewardRevealItem[] = [];

  for (const reward of view.newCollectibles) {
    items.push(toRevealItem(reward, "collectible", true));
  }

  // Only entries this completion actually granted — firstClearRewards/
  // baseRewards/levelUpRewards already exclude collectibles and
  // duplicate-converted entries (see getBattleResultsView), so nothing
  // here can double-count a collectible or a "duplicate converted to
  // materials" grant as a rare-item reveal.
  const grantedNonCollectible = [...view.firstClearRewards, ...view.baseRewards, ...view.levelUpRewards];

  for (const reward of grantedNonCollectible) {
    if (reward.entry.kind === "chest" && HIGH_VALUE_CHESTS.has(reward.entry.chestId)) {
      items.push(toRevealItem(reward, "chest", false));
    }
  }
  for (const reward of grantedNonCollectible) {
    if (reward.entry.kind !== "chest" && SPECIAL_RARITIES.has(reward.rarity)) {
      items.push(toRevealItem(reward, "rare-item", false));
    }
  }

  return items;
}
