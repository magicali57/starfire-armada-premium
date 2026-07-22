import { useHashRoute } from "./useHashRoute";
import { AppShell } from "@/components/layout/AppShell";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { BattleHubScreen } from "@/screens/battle/BattleHubScreen";
import { ShipSelectionScreen } from "@/screens/ship-selection/ShipSelectionScreen";
import { FleetRosterScreen } from "@/screens/fleet/FleetRosterScreen";
import { ShipDetailPlaceholderScreen } from "@/screens/fleet/ShipDetailPlaceholderScreen";
import { ShipDetailScreen } from "@/screens/ship-detail/ShipDetailScreen";
import { ShipUpgradeScreen } from "@/screens/ship-upgrade/ShipUpgradeScreen";
import { ShipStarRankScreen } from "@/screens/ship-star-rank/ShipStarRankScreen";
import { ShipAbilitiesScreen } from "@/screens/ship-abilities/ShipAbilitiesScreen";
import { CampaignScreen } from "@/screens/campaign/CampaignScreen";
import { CampaignOverviewScreen } from "@/screens/campaign/CampaignOverviewScreen";
import { CampaignChapterMapScreen } from "@/screens/campaign/CampaignChapterMapScreen";
import { StageDetailPlaceholderScreen } from "@/screens/campaign/StageDetailPlaceholderScreen";
import { CampaignStageDetailScreen } from "@/screens/campaign/CampaignStageDetailScreen";
import { PreBattlePlaceholderScreen } from "@/screens/campaign/PreBattlePlaceholderScreen";
import { PreBattleScreen } from "@/screens/campaign/PreBattleScreen";
import { GameplayLaunchPlaceholderScreen } from "@/screens/campaign/GameplayLaunchPlaceholderScreen";
import { GameplayScreen } from "@/screens/gameplay/GameplayScreen";
import { ResultsScreen } from "@/screens/results/ResultsScreen";
import { InventoryHubScreen } from "@/screens/inventory/InventoryHubScreen";
import { LoadoutManagerScreen } from "@/screens/loadout/LoadoutManagerScreen";
import { ChestOpeningScreen } from "@/screens/chest-opening/ChestOpeningScreen";
import { CompanionsRosterScreen } from "@/screens/companions/CompanionsRosterScreen";
import { CompanionDetailScreen } from "@/screens/companion-detail/CompanionDetailScreen";
import { CompanionUpgradeScreen } from "@/screens/companion-upgrade/CompanionUpgradeScreen";
import { ModuleDetailScreen } from "@/screens/module-detail/ModuleDetailScreen";
import { ModuleUpgradeScreen } from "@/screens/module-upgrade/ModuleUpgradeScreen";
import { ModulesInventoryScreen } from "@/screens/modules/ModulesInventoryScreen";
import { ArsenalScreen } from "@/screens/arsenal/ArsenalScreen";
import { WeaponDetailScreen } from "@/screens/arsenal/WeaponDetailScreen";
import { WeaponUpgradeScreen } from "@/screens/arsenal/WeaponUpgradeScreen";
import { ProfileScreen } from "@/screens/profile/ProfileScreen";
import { PlayerStoreProvider } from "@/store/playerStore";

function ActiveScreen() {
  const route = useHashRoute();

  switch (route) {
    case "home":
      return <HomeScreen />;
    case "battle":
      return <BattleHubScreen />;
    case "ship-selection":
      return <FleetRosterScreen />;
    case "ship-selection-legacy":
      return <ShipSelectionScreen />;
    case "ship-detail-placeholder":
      return <ShipDetailScreen />;
    case "ship-detail-legacy-placeholder":
      return <ShipDetailPlaceholderScreen />;
    case "ship-upgrade":
      return <ShipUpgradeScreen />;
    case "ship-star-rank":
      // Dynamic route — shipId is parsed from window.location.hash inside
      // the screen itself (see getShipStarRankIdFromHash in app/routes.tsx).
      return <ShipStarRankScreen />;
    case "ship-abilities":
      // Dynamic route — same pattern (getShipAbilitiesIdFromHash).
      return <ShipAbilitiesScreen />;
    case "campaign":
      return <CampaignOverviewScreen />;
    case "campaign-chapter-map":
      return <CampaignChapterMapScreen />;
    case "campaign-chapter-map-legacy":
      return <CampaignScreen />;
    case "stage-detail":
      return <CampaignStageDetailScreen />;
    case "stage-detail-legacy-placeholder":
      return <StageDetailPlaceholderScreen />;
    case "pre-battle-placeholder":
      return <PreBattleScreen />;
    case "pre-battle-legacy-placeholder":
      return <PreBattlePlaceholderScreen />;
    case "battle-launch":
      return <GameplayLaunchPlaceholderScreen />;
    case "gameplay":
      return <GameplayScreen />;
    case "results":
      return <ResultsScreen />;
    case "inventory":
      return <InventoryHubScreen />;
    case "loadout":
      return <LoadoutManagerScreen />;
    case "chest-opening":
      return <ChestOpeningScreen />;
    case "companions":
      return <CompanionsRosterScreen />;
    case "companion-detail":
      // Dynamic route — companionId is parsed from window.location.hash
      // inside the screen itself (see getCompanionIdFromHash in
      // app/routes.tsx). No companion id is ever hard-coded here.
      return <CompanionDetailScreen />;
    case "companion-upgrade":
      return <CompanionUpgradeScreen />;
    case "module-detail":
      return <ModuleDetailScreen />;
    case "module-upgrade":
      return <ModuleUpgradeScreen />;
    case "modules":
      return <ModulesInventoryScreen />;
    case "arsenal":
      return <ArsenalScreen />;
    case "weapon-detail":
      return <WeaponDetailScreen />;
    case "weapon-upgrade":
      return <WeaponUpgradeScreen />;
    case "profile":
      return <ProfileScreen />;
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <PlayerStoreProvider>
      <AppShell>
        <ActiveScreen />
      </AppShell>
    </PlayerStoreProvider>
  );
}
