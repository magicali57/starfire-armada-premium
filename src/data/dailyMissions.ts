import type {
  DailyActivityMilestoneDefinition,
  DailyMissionDefinition,
  DailyMissionProgress,
  DailyMissionState,
} from "@/types/dailyMissions";

// The ONE canonical Daily Missions catalog. Progress is persisted separately
// on PlayerState.dailyMissions — never invent missions in JSX.
//
// Only `status: "active"` rows appear in the launch UI. Future gameplay-engine
// kill/damage missions stay planned until the engine tracks them truthfully.

export const DAILY_MISSION_DEFINITIONS: readonly DailyMissionDefinition[] = [
  {
    id: "daily-complete-battle",
    title: "Complete a Battle",
    description: "Finish 1 campaign battle (win or lose).",
    iconKey: "battle",
    eventType: "battleCompleted",
    target: 1,
    activityPoints: 10,
    rewards: [{ kind: "currency", currencyId: "coins", amount: 800 }],
    goToRoute: "campaign",
    sortOrder: 10,
    status: "active",
  },
  {
    id: "daily-win-battle",
    title: "Win a Battle",
    description: "Win 1 campaign battle.",
    iconKey: "victory",
    eventType: "battleWon",
    target: 1,
    activityPoints: 15,
    rewards: [
      { kind: "currency", currencyId: "coins", amount: 1200 },
      { kind: "material", materialId: "shipAlloy", amount: 15 },
    ],
    goToRoute: "campaign",
    sortOrder: 20,
    status: "active",
  },
  {
    id: "daily-win-battles-3",
    title: "Win Three Battles",
    description: "Win 3 campaign battles today.",
    iconKey: "victory",
    eventType: "battleWon",
    target: 3,
    activityPoints: 20,
    rewards: [
      { kind: "currency", currencyId: "coins", amount: 2500 },
      { kind: "material", materialId: "weaponParts", amount: 20 },
    ],
    goToRoute: "campaign",
    sortOrder: 30,
    status: "active",
  },
  {
    id: "daily-spend-energy",
    title: "Spend Energy",
    description: "Spend 20 Energy starting battles.",
    iconKey: "energy",
    eventType: "energySpent",
    target: 20,
    activityPoints: 10,
    rewards: [{ kind: "material", materialId: "moduleParts", amount: 20 }],
    goToRoute: "campaign",
    sortOrder: 40,
    status: "active",
  },
  {
    id: "daily-upgrade-ship",
    title: "Upgrade a Ship",
    description: "Raise any ship level once.",
    iconKey: "ship",
    eventType: "shipUpgraded",
    target: 1,
    activityPoints: 10,
    rewards: [{ kind: "currency", currencyId: "coins", amount: 1000 }],
    goToRoute: "ship-selection",
    sortOrder: 50,
    status: "active",
  },
  {
    id: "daily-upgrade-weapon",
    title: "Upgrade a Weapon",
    description: "Raise any Arsenal weapon level once.",
    iconKey: "weapon",
    eventType: "weaponUpgraded",
    target: 1,
    activityPoints: 10,
    rewards: [{ kind: "material", materialId: "weaponParts", amount: 15 }],
    goToRoute: "arsenal",
    sortOrder: 60,
    status: "active",
  },
  {
    id: "daily-open-chest",
    title: "Open a Chest",
    description: "Open 1 chest from your Vault.",
    iconKey: "chest",
    eventType: "chestOpened",
    target: 1,
    activityPoints: 15,
    rewards: [
      { kind: "currency", currencyId: "coins", amount: 1500 },
      { kind: "material", materialId: "companionData", amount: 10 },
    ],
    goToRoute: "chest-opening",
    sortOrder: 70,
    status: "active",
  },
  {
    id: "daily-shop-purchase",
    title: "Shop Purchase",
    description: "Buy 1 offer from the Shop.",
    iconKey: "shop",
    eventType: "shopPurchaseCompleted",
    target: 1,
    activityPoints: 10,
    rewards: [{ kind: "currency", currencyId: "coins", amount: 900 }],
    goToRoute: "shop",
    sortOrder: 80,
    status: "active",
  },

  // Future — unsupported by current gameplay engine (hidden from UI).
  {
    id: "daily-destroy-enemies",
    title: "Destroy Enemies",
    description: "Destroy 500 enemies in battle.",
    iconKey: "battle",
    eventType: "battleWon",
    target: 500,
    activityPoints: 25,
    rewards: [{ kind: "currency", currencyId: "coins", amount: 5000 }],
    goToRoute: "campaign",
    sortOrder: 200,
    status: "future",
  },
] as const;

export const DAILY_ACTIVITY_MILESTONES: readonly DailyActivityMilestoneDefinition[] = [
  {
    id: "daily-activity-20",
    requiredPoints: 20,
    rewards: [{ kind: "currency", currencyId: "coins", amount: 1500 }],
    tier: "basic",
    sortOrder: 10,
  },
  {
    id: "daily-activity-40",
    requiredPoints: 40,
    rewards: [{ kind: "material", materialId: "shipAlloy", amount: 40 }],
    tier: "basic",
    sortOrder: 20,
  },
  {
    id: "daily-activity-60",
    requiredPoints: 60,
    rewards: [{ kind: "chest", chestId: "chestBasic", amount: 1 }],
    tier: "rare",
    sortOrder: 30,
  },
  {
    id: "daily-activity-80",
    requiredPoints: 80,
    rewards: [
      { kind: "currency", currencyId: "coins", amount: 3000 },
      { kind: "material", materialId: "weaponParts", amount: 25 },
    ],
    tier: "rare",
    sortOrder: 40,
  },
  {
    id: "daily-activity-100",
    requiredPoints: 100,
    rewards: [
      { kind: "chest", chestId: "chestRare", amount: 1 },
      { kind: "currency", currencyId: "crystals", amount: 25 },
    ],
    tier: "epic",
    sortOrder: 50,
  },
] as const;

export function getActiveDailyMissionDefinitions(): DailyMissionDefinition[] {
  return DAILY_MISSION_DEFINITIONS.filter((mission) => mission.status === "active")
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getDailyMissionDefinitionById(missionId: string): DailyMissionDefinition | null {
  return DAILY_MISSION_DEFINITIONS.find((mission) => mission.id === missionId) ?? null;
}

export function getDailyActivityMilestoneById(milestoneId: string): DailyActivityMilestoneDefinition | null {
  return DAILY_ACTIVITY_MILESTONES.find((milestone) => milestone.id === milestoneId) ?? null;
}

export function getOrderedDailyActivityMilestones(): DailyActivityMilestoneDefinition[] {
  return DAILY_ACTIVITY_MILESTONES.slice().sort((a, b) => a.sortOrder - b.sortOrder);
}

export function createEmptyMissionProgressMap(): Record<string, DailyMissionProgress> {
  const missions: Record<string, DailyMissionProgress> = {};
  for (const definition of getActiveDailyMissionDefinitions()) {
    missions[definition.id] = { progress: 0, claimed: false };
  }
  return missions;
}

export function createFreshDailyMissionState(dayKey: string): DailyMissionState {
  return {
    dayKey,
    lastObservedDayKey: dayKey,
    missions: createEmptyMissionProgressMap(),
    activityPoints: 0,
    claimedMilestoneIds: [],
  };
}
