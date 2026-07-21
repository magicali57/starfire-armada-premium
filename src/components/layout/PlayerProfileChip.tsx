import "./PlayerProfileChip.css";

interface PlayerProfileChipProps {
  displayName: string;
  level: number;
}

export function PlayerProfileChip({ displayName, level }: PlayerProfileChipProps) {
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="player-profile-chip">
      <div className="player-profile-chip__avatar" aria-hidden="true">
        {initial}
      </div>
      <div className="player-profile-chip__meta">
        <span className="player-profile-chip__name">{displayName}</span>
        <span className="player-profile-chip__level">Lv. {level}</span>
      </div>
    </div>
  );
}
