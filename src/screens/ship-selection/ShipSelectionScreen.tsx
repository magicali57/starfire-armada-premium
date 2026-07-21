import { useMemo, useState } from "react";
import { ShipArt } from "@/components/cards/ShipArt";
import { IconButton } from "@/components/controls/IconButton";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { NeonPanel } from "@/components/cards/NeonPanel";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { StatRow } from "@/components/stats/StatRow";
import { SHIPS, getShipById } from "@/data";
import { usePlayerStore } from "@/store/playerStore";
import { calculatePowerScore, calculateShipStats, createDefaultShipProgress } from "@/systems/shipStats";
import { RARITY_LABEL, rarityColorVar } from "@/utils/rarity";
import { RARITY_EMBLEM } from "@/data/assetRegistry";
import { navigate } from "@/app/routes";
import type { ShipRole } from "@/types";
import { ShipRosterCard } from "./ShipRosterCard";
import "./ShipSelectionScreen.css";

type RoleFilter = ShipRole | "All";
type SortMode = "roster" | "rarity" | "name";

const ROLE_FILTERS: RoleFilter[] = ["All", "Attack", "Support", "Control", "Heavy"];
const RARITY_RANK: Record<string, number> = { mythic: 5, legendary: 4, epic: 3, rare: 2, common: 1 };

export function ShipSelectionScreen() {
  const { player, selectOwnedShip, attemptSelectLockedShip } = usePlayerStore();
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("All");
  const [sortMode, setSortMode] = useState<SortMode>("roster");
  const [lockedInfo, setLockedInfo] = useState<{ name: string; requirement: string } | null>(null);

  const visibleShips = useMemo(() => {
    const filtered =
      roleFilter === "All" ? SHIPS : SHIPS.filter((ship) => ship.role === roleFilter);
    const sorted = [...filtered];
    if (sortMode === "rarity") {
      sorted.sort((a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity]);
    } else if (sortMode === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [roleFilter, sortMode]);

  const selectedShip = getShipById(player.selectedShipId);
  const selectedProgress = selectedShip
    ? player.shipProgress[selectedShip.id] ?? createDefaultShipProgress(selectedShip.id)
    : null;
  const selectedStats =
    selectedShip && selectedProgress ? calculateShipStats(selectedShip, selectedProgress.level) : null;
  const selectedPower = selectedStats ? calculatePowerScore(selectedStats) : 0;

  const handleCardClick = (shipId: string) => {
    const owned = player.ownedShipIds.includes(shipId);
    if (owned) {
      selectOwnedShip(shipId);
      return;
    }
    const info = attemptSelectLockedShip(shipId);
    const ship = getShipById(shipId);
    if (info && ship) {
      setLockedInfo({ name: ship.name, requirement: info.unlockRequirement });
    }
  };

  return (
    <div className="ship-selection-screen">
      <div className="ship-selection-screen__header">
        <IconButton
          icon={<span aria-hidden="true">←</span>}
          label="Back to Home"
          onClick={() => navigate("home")}
        />
        <div>
          <h1 className="ship-selection-screen__title neon-text-primary">Ship Selection</h1>
          <span className="ship-selection-screen__count">
            {player.ownedShipIds.length} / {SHIPS.length} Unlocked
          </span>
        </div>
      </div>

      <div className="ship-selection-screen__filters">
        {ROLE_FILTERS.map((role) => (
          <button
            key={role}
            type="button"
            className={`ship-selection-screen__filter${
              roleFilter === role ? " ship-selection-screen__filter--active" : ""
            }`}
            onClick={() => setRoleFilter(role)}
            aria-pressed={roleFilter === role}
          >
            {role}
          </button>
        ))}
        <label className="ship-selection-screen__sort">
          <span className="visually-hidden">Sort ships</span>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
            <option value="roster">Roster Order</option>
            <option value="rarity">Rarity</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {selectedShip && selectedStats && selectedProgress ? (
        <div className="ship-selection-screen__detail">
          <NeonPanel tone="primary">
            <div className="ship-selection-screen__detail-top">
              <div className="ship-selection-screen__detail-art">
                <ShipArt ship={selectedShip} size="sm" variant="hero" />
              </div>
              <div>
                <span className="ship-selection-screen__detail-rarity-row">
                  <img
                    src={RARITY_EMBLEM[selectedShip.rarity]}
                    alt=""
                    className="ship-selection-screen__detail-rarity-emblem"
                  />
                  <span
                    className="ship-selection-screen__detail-rarity"
                    style={{ color: rarityColorVar(selectedShip.rarity) }}
                  >
                    {RARITY_LABEL[selectedShip.rarity]}
                  </span>
                </span>
                <h2 className="ship-selection-screen__detail-name">{selectedShip.name}</h2>
                <span className="ship-selection-screen__detail-role">
                  {selectedShip.role} · Lv. {selectedProgress.level} · {selectedPower.toLocaleString()} PWR
                </span>
              </div>
            </div>

            <p className="ship-selection-screen__detail-description">
              {selectedShip.shortDescription}
            </p>

            <div className="ship-selection-screen__detail-stats">
              <StatRow icon="♥" label="HP" value={selectedStats.hp.toLocaleString()} />
              <StatRow icon="⚔" label="Damage" value={selectedStats.damage.toLocaleString()} />
              <StatRow icon="⏱" label="Fire Rate" value={`${selectedStats.fireRate.toFixed(2)}/s`} />
              <StatRow icon="✧" label="Crit Rate" value={`${selectedStats.critRate.toFixed(1)}%`} />
            </div>

            <PrimaryButton fullWidth onClick={() => navigate("ship-upgrade")}>
              Upgrade
            </PrimaryButton>
          </NeonPanel>
        </div>
      ) : null}

      <div className="ship-selection-screen__grid">
        {visibleShips.map((ship) => (
          <ShipRosterCard
            key={ship.id}
            ship={ship}
            level={player.shipProgress[ship.id]?.level ?? 1}
            owned={player.ownedShipIds.includes(ship.id)}
            selected={ship.id === player.selectedShipId}
            onSelect={() => handleCardClick(ship.id)}
          />
        ))}
      </div>

      <LockedContentModal
        open={lockedInfo !== null}
        title={lockedInfo?.name ?? ""}
        unlockRequirement={lockedInfo?.requirement ?? ""}
        onClose={() => setLockedInfo(null)}
      />
    </div>
  );
}
