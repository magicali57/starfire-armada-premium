import { useMemo, useState } from "react";
import { usePlayerStore } from "@/store/playerStore";
import { navigate, pathFor } from "@/app/routes";
import { SHIPS, getShipById } from "@/data";
import { getFleetRosterOrder } from "@/data/fleetRoster";
import { getShipDetailContent } from "@/data/shipDetail";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { ShipDetailTopBar } from "@/components/ship-detail/ShipDetailTopBar";
import { ShipDetailHeroPanel } from "@/components/ship-detail/ShipDetailHeroPanel";
import { ShipDetailStatGrid } from "@/components/ship-detail/ShipDetailStatGrid";
import { ShipDetailAbilityCard } from "@/components/ship-detail/ShipDetailAbilityCard";
import { ShipDetailFragmentsSkinRow } from "@/components/ship-detail/ShipDetailFragmentsSkinRow";
import { ShipProgressionTabs, type ShipProgressionTab } from "@/components/navigation/ShipProgressionTabs";
import { getResourceState } from "@/data/shipUpgrade";
import { calculateShipLevelUpgradeQuote, createDefaultShipProgress, isMaxLevel } from "@/systems/shipStats";
import "./ShipDetailScreen.css";

interface ModalState {
  title: string;
  message: string;
}

function readShipIdFromHash(): string | undefined {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return undefined;
  return new URLSearchParams(hash.slice(queryIndex + 1)).get("id") ?? undefined;
}

/**
 * Real Ship Detail screen, reproducing 09_Ship_Detail_Overview.png.
 * Full-screen shell (no HubScreenShell/HubHeader/HubBottomNav — see
 * SHIP_DETAIL_PLAN.md §3): its own ShipDetailTopBar, a scrollable content
 * region, and the shared four-tab ship progression navigation
 * (ShipProgressionTabs: LEVEL UP | STAR RANK | ABILITIES | SKINS) in place
 * of a shared footer. The old five-button row's Weapon action was removed —
 * external weapons are managed exclusively in the Arsenal.
 *
 * Ship id travels via the existing "?id=" hash convention. The initial id
 * is read once on mount (same pattern as Stage Detail/Pre-Battle); the
 * next-ship chevron then updates a local `currentShipId` state directly
 * (not by re-reading the hash) since changing only the "?id=" suffix does
 * not change the route id and therefore does not remount this screen —
 * `window.location.hash` is still kept in sync so the URL reflects the
 * currently viewed ship, but the on-screen ship is driven by state, not by
 * a hashchange listener.
 */
export function ShipDetailScreen() {
  const { player, selectOwnedShip, attemptSelectLockedShip } = usePlayerStore();
  const [modal, setModal] = useState<ModalState | null>(null);
  const [lockedInfo, setLockedInfo] = useState<{ name: string; requirement: string } | null>(null);
  const openModal = (title: string, message: string) => setModal({ title, message });

  const initialShipId = useMemo(() => readShipIdFromHash(), []);
  const [currentShipId, setCurrentShipId] = useState<string | undefined>(initialShipId);

  const rosterOrder = useMemo(() => getFleetRosterOrder(SHIPS.map((s) => s.id)), []);

  const ship = currentShipId ? getShipById(currentShipId) : undefined;
  const content = currentShipId ? getShipDetailContent(currentShipId, player) : null;
  const owned = ship ? player.ownedShipIds.includes(ship.id) : false;
  const equipped = ship ? player.selectedShipId === ship.id : false;

  const handleBack = () => navigate("ship-selection");

  const handleCycleNext = () => {
    if (rosterOrder.length === 0) return;
    const currentIndex = currentShipId ? rosterOrder.indexOf(currentShipId) : -1;
    const nextId = rosterOrder[(currentIndex + 1) % rosterOrder.length];
    if (!nextId) return;
    setCurrentShipId(nextId);
    window.location.hash = `${pathFor("ship-detail-placeholder")}?id=${nextId}`;
  };

  const handleEquip = () => {
    if (!ship) return;
    // Safe no-op guard already lives in the store — mirrors Fleet Roster's
    // own Equip behavior exactly.
    selectOwnedShip(ship.id);
  };

  const openLockedModal = () => {
    if (!ship) return;
    const info = attemptSelectLockedShip(ship.id);
    setLockedInfo({
      name: ship.name,
      requirement: info?.unlockRequirement ?? ship.unlockRequirement,
    });
  };

  const handleAbilityUpgrade = () => {
    if (!ship) return;
    if (!owned) {
      openLockedModal();
      return;
    }
    openModal("Upgrade", "Ability upgrading isn't wired up yet — coming soon.");
  };

  const handleLevelUp = () => {
    if (!ship) return;
    if (!owned) {
      openLockedModal();
      return;
    }
    // ShipUpgradeScreen reads its ship from player.selectedShipId, not a
    // query param — selecting first is required for it to show the right
    // ship, not optional. Untouched otherwise, per instruction.
    selectOwnedShip(ship.id);
    navigate("ship-upgrade");
  };

  const handleProgressionTab = (tab: ShipProgressionTab) => {
    switch (tab) {
      case "level-up":
        handleLevelUp();
        break;
      case "star-rank":
        openModal("Star Rank", "The Star Rank screen isn't built yet — coming soon.");
        break;
      case "abilities":
        openModal("Abilities", "The Abilities screen isn't built yet — coming soon.");
        break;
      case "skins":
        openModal("Skins", "The Skins screen isn't built yet — coming soon.");
        break;
    }
  };

  // Truthful Level Up badge: owned, not max level, and the player can
  // actually afford the next single-level upgrade right now — computed
  // through the exact same quote/resource helpers the Level Up screen uses.
  const levelUpActionable = useMemo(() => {
    if (!ship || !owned) return false;
    const progress = player.shipProgress[ship.id] ?? createDefaultShipProgress(ship.id);
    if (isMaxLevel(progress.level)) return false;
    const quote = calculateShipLevelUpgradeQuote(ship, progress.level, 1);
    return getResourceState(quote, player).canAfford;
  }, [ship, owned, player]);

  if (!ship || !content) {
    return (
      <div className="ship-detail-screen">
        <ShipDetailTopBar player={player} onBack={handleBack} onOpen={openModal} />
        <div className="ship-detail-screen__not-found">
          <p>Ship not found.</p>
          <SecondaryButton onClick={handleBack}>Back to Fleet</SecondaryButton>
        </div>
      </div>
    );
  }

  return (
    <div className="ship-detail-screen">
      <ShipDetailTopBar player={player} onBack={handleBack} onOpen={openModal} />

      <div className="ship-detail-screen__scroll">
        <div className="ship-detail-screen__content">
          <ShipDetailHeroPanel
            ship={ship}
            content={content}
            owned={owned}
            equipped={equipped}
            onEquip={handleEquip}
            onLockedAction={openLockedModal}
            onCycleNext={handleCycleNext}
          />

          <ShipDetailStatGrid stats={content.coreStats} />

          <ShipDetailAbilityCard
            variant="signature"
            name={content.signatureAttack.name}
            description={content.signatureAttack.description}
            locked={!owned}
          />
          <ShipDetailAbilityCard
            variant="passive"
            name={content.passive.name}
            description={content.passive.description}
            levelCurrent={content.passive.levelCurrent}
            levelMax={content.passive.levelMax}
            locked={!owned}
            onUpgrade={handleAbilityUpgrade}
          />
          <ShipDetailAbilityCard
            variant="calamity"
            name={content.calamity.name}
            description={content.calamity.description}
            levelCurrent={content.calamity.levelCurrent}
            levelMax={content.calamity.levelMax}
            locked={!owned}
            onUpgrade={handleAbilityUpgrade}
          />

          <ShipDetailFragmentsSkinRow
            shipId={ship.id}
            fragments={content.fragments}
            skin={content.skin}
            onFindFragments={() => openModal("Find Fragments", "Fragment sources aren't wired up yet — coming soon.")}
            onChangeSkin={() => openModal("Change Skin", "The Skins screen isn't built yet — coming soon.")}
          />
        </div>
      </div>

      <ShipProgressionTabs
        shipId={ship.id}
        activeTab={null}
        badges={{ "level-up": levelUpActionable }}
        onSelect={handleProgressionTab}
      />

      <LockedContentModal
        open={lockedInfo !== null}
        title={lockedInfo?.name ?? ""}
        unlockRequirement={lockedInfo?.requirement ?? ""}
        onClose={() => setLockedInfo(null)}
      />
      <LockedContentModal
        open={modal !== null}
        title={modal?.title ?? ""}
        unlockRequirement={modal?.message ?? "Coming soon."}
        onClose={() => setModal(null)}
      />
    </div>
  );
}
