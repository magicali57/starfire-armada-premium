import { useMemo, useState } from "react";
import { LockedContentModal } from "@/components/feedback/LockedContentModal";
import { usePlayerStore } from "@/store/playerStore";
import { CAMPAIGN_STAGES, getShipById } from "@/data";
import {
  HOME_BOTTOM_NAV_FINAL,
  HOME_BOTTOM_SHORTCUT_ICON,
  HOME_CHAPTER_NAV,
  HOME_FRAMES,
  HOME_LEFT_MENU_ICON,
  HOME_MISC_ICON,
  HOME_SCENE,
  HOME_SIDE_MENU_FINAL,
  HOME_TOPBAR_FINAL,
  HOME_TOPBAR_ICON,
} from "@/data/assetRegistry";
import { calculatePowerScore, calculateShipStats, createDefaultShipProgress } from "@/systems/shipStats";
import { navigate, pathFor } from "@/app/routes";
import type { PlayerState, ShipDefinition, ShipProgress } from "@/types";
import "./HomeScreen.css";

interface ComingSoonState {
  title: string;
  message: string;
}

type OpenPanel = (title: string, message: string) => void;

interface LeftMenuItem {
  id: string;
  label: string;
  asset: string;
}

interface RightMenuItem {
  id: string;
  label: string;
  asset: string;
}

const STAGE_ENERGY_COST_DISPLAY = 10;

const LEFT_MENU_ITEMS: LeftMenuItem[] = [
  { id: "season-pass", label: "Season Pass", asset: HOME_SIDE_MENU_FINAL.seasonPass },
  { id: "events", label: "Events", asset: HOME_SIDE_MENU_FINAL.events },
  { id: "achievements", label: "Achievements", asset: HOME_SIDE_MENU_FINAL.achievements },
  { id: "leaderboard", label: "Leaderboard", asset: HOME_SIDE_MENU_FINAL.leaderboard },
  { id: "limited-offer", label: "Limited Time Offer", asset: HOME_SIDE_MENU_FINAL.limitedTimeOffer },
];

const RIGHT_MENU_ITEMS: RightMenuItem[] = [
  { id: "galaxy-war", label: "Galaxy War", asset: HOME_SIDE_MENU_FINAL.galaxyWar },
  { id: "boss-raid", label: "Boss Raid", asset: HOME_SIDE_MENU_FINAL.bossRaid },
  { id: "guild", label: "Guild", asset: HOME_SIDE_MENU_FINAL.guild },
  { id: "multiplayer", label: "Multiplayer", asset: HOME_SIDE_MENU_FINAL.multiplayer },
];

const MISSIONS = [
  {
    id: "daily",
    title: "Daily Missions",
    art: HOME_LEFT_MENU_ICON.missions,
    status: "4/6",
    progress: 66,
    reward: "50K  +  100",
    action: "Go",
    tone: "blue",
  },
  {
    id: "weekly",
    title: "Weekly Missions",
    art: HOME_LEFT_MENU_ICON.achievements,
    status: "2/5",
    progress: 40,
    reward: "150K  +  250",
    action: "Go",
    tone: "purple",
  },
  {
    id: "campaign",
    title: "Campaign Progress",
    art: HOME_LEFT_MENU_ICON.events,
    status: "Chapter 15 · 8/10",
    progress: 80,
    reward: "Void Nexus",
    action: "View",
    tone: "blue",
  },
] as const;

function HomeTopBar({ player, xpPct, onOpen }: { player: PlayerState; xpPct: number; onOpen: OpenPanel }) {
  const mailBadgeCount = 2;
  const resources = [
    { id: "energy", icon: HOME_TOPBAR_FINAL.energy, value: `${player.currencies.energy}/120` },
    { id: "coins", icon: HOME_TOPBAR_FINAL.coin, value: player.currencies.coins.toLocaleString() },
    { id: "crystals", icon: HOME_TOPBAR_FINAL.gem, value: player.currencies.crystals.toLocaleString() },
  ] as const;

  return (
    <header className="home-final__topbar">
      <button className="home-final__profile press-scale" type="button" onClick={() => navigate("profile")}>
        <img className="home-final__profile-panel-frame" src={HOME_TOPBAR_FINAL.profileFrame} alt="" />
        <span className="home-final__avatar-wrap">
          <img className="home-final__avatar" src={HOME_TOPBAR_FINAL.avatar} alt="Player avatar" />
        </span>
        <span className="home-final__profile-copy">
          <strong>{player.displayName}</strong>
          <span className="home-final__level">Lv. {player.level}</span>
          <span className="home-final__xp"><i style={{ width: `${xpPct}%` }} /></span>
          <small>{player.xp.toLocaleString()} / {player.xpToNextLevel.toLocaleString()}</small>
        </span>
      </button>

      <div className="home-final__resource-list" aria-label="Player resources">
        {resources.map((resource) => (
          <button key={resource.id} className="home-final__resource press-scale" type="button" onClick={() => onOpen(resource.id, "Resource details are coming soon.")}>
            <img className="home-final__resource-frame" src={HOME_TOPBAR_FINAL.resourceFrame} alt="" />
            <img className="home-final__resource-icon" src={resource.icon} alt="" />
            <span>{resource.value}</span>
            <b className="home-final__resource-plus" aria-hidden="true">+</b>
          </button>
        ))}
        <button className="home-final__top-action press-scale" type="button" aria-label="Inbox" onClick={() => onOpen("Inbox", "Inbox is coming soon.")}>
          <img src={HOME_TOPBAR_FINAL.utilityFrame} alt="" />
          <img src={HOME_TOPBAR_FINAL.mail} alt="" />
          {mailBadgeCount > 0 ? <b>{mailBadgeCount}</b> : null}
        </button>
        <button className="home-final__top-action press-scale" type="button" aria-label="Settings" onClick={() => onOpen("Settings", "Settings are coming soon.")}>
          <img src={HOME_TOPBAR_FINAL.utilityFrame} alt="" />
          <img src={HOME_TOPBAR_FINAL.settings} alt="" />
        </button>
      </div>
    </header>
  );
}

function HomeLeftMenu({ onOpen }: { onOpen: OpenPanel }) {
  return (
    <aside className="home-final__left-menu" aria-label="Progress and events">
      {LEFT_MENU_ITEMS.map((item) => (
        <button key={item.id} className="home-final__side-card press-scale" type="button" aria-label={item.label} onClick={() => onOpen(item.label, `${item.label} is coming soon.`)}>
          <img className="home-final__side-card-image" src={item.asset} alt="" />
          {item.id === "events" ? <span className="home-final__alert">!</span> : null}
        </button>
      ))}
    </aside>
  );
}

function HomeRightMenu({ onOpen }: { onOpen: OpenPanel }) {
  return (
    <aside className="home-final__right-menu" aria-label="Game modes">
      {RIGHT_MENU_ITEMS.map((item) => (
        <button key={item.id} className="home-final__side-card press-scale" type="button" aria-label={item.label} onClick={() => onOpen(item.label, `${item.label} is coming soon.`)}>
          <img className="home-final__side-card-image" src={item.asset} alt="" />
        </button>
      ))}
    </aside>
  );
}

function SelectedShip({ ship }: { ship: ShipDefinition }) {
  const [failed, setFailed] = useState(false);
  const src = ship.artwork.hangarSprite ?? ship.artwork.rosterIcon;

  return (
    <div className="home-final__ship-zone" style={{ ["--ship-color" as string]: ship.themeColor }}>
      {src && !failed ? (
        <img className="home-final__selected-ship" src={src} alt={ship.name} onError={() => setFailed(true)} />
      ) : (
        <span className="home-final__ship-placeholder" aria-label={ship.name}>{ship.artwork.icon}</span>
      )}
    </div>
  );
}

function ChapterSelector({ dotCount }: { dotCount: number }) {
  return (
    <button className="home-final__chapter press-scale" type="button" onClick={() => navigate("campaign")}>
      <img className="home-final__chapter-frame" src={HOME_FRAMES.chapterPanelFrame} alt="" />
      <img className="home-final__chapter-arrow" src={HOME_CHAPTER_NAV.arrowLeft} alt="Previous chapter" />
      <span>
        <small>Chapter 15</small>
        <strong>Void Nexus</strong>
        <i>{Array.from({ length: Math.max(5, dotCount) }, (_, index) => <img key={index} src={index === 0 ? HOME_CHAPTER_NAV.dotActive : HOME_CHAPTER_NAV.dotInactive} alt="" />)}</i>
      </span>
      <img className="home-final__chapter-arrow" src={HOME_CHAPTER_NAV.arrowRight} alt="Next chapter" />
    </button>
  );
}

function HomeHeroScene({ ship, chapterDotCount, onOpen }: { ship: ShipDefinition; chapterDotCount: number; onOpen: OpenPanel }) {
  return (
    <section className="home-final__hero">
      <img className="home-final__cosmos" src={HOME_SCENE.background} alt="" />
      <span className="home-final__beam" aria-hidden="true" />
      {HOME_SCENE.escortShips.map((src, index) => <img key={src} className={`home-final__escort home-final__escort--${index + 1}`} src={src} alt="" />)}
      <HomeLeftMenu onOpen={onOpen} />
      <div className="home-final__hero-center">
        <SelectedShip ship={ship} />
        <span className="home-final__platform" aria-hidden="true" />
        <ChapterSelector dotCount={chapterDotCount} />
      </div>
      <HomeRightMenu onOpen={onOpen} />
    </section>
  );
}

function PowerPanel({ power, onOpen }: { power: number; onOpen: OpenPanel }) {
  return (
    <button className="home-final__power press-scale" type="button" onClick={() => onOpen("Your Power", "A detailed power breakdown is coming soon.")}>
      <img className="home-final__panel-frame" src={HOME_FRAMES.powerPanelFrame} alt="" />
      <span>Your Power</span>
      <strong>{power.toLocaleString()}</strong>
      <img className="home-final__power-art" src={HOME_MISC_ICON.powerCrossedSwords} alt="" />
    </button>
  );
}

function PlayButton() {
  return (
    <button className="home-final__play press-scale" type="button" onClick={() => navigate("gameplay")}>
      <img src={HOME_FRAMES.playButtonFrame} alt="" />
      <strong>Play</strong>
      <span><img src={HOME_TOPBAR_ICON.energy} alt="Energy" />{STAGE_ENERGY_COST_DISPLAY}</span>
    </button>
  );
}

function ActiveLoadoutPanel({ ship, progress }: { ship: ShipDefinition; progress: ShipProgress }) {
  const weapon = ship.weaponLevels.find((item) => item.level === progress.weaponLevel);
  const rarity = ship.rarity.toUpperCase();
  const entries = [
    { label: "Companion", name: "Rapid Drone", art: HOME_SCENE.escortShips[0], level: progress.level },
    { label: "Primary Weapon", name: weapon?.name ?? `${ship.name} Cannon`, art: HOME_BOTTOM_SHORTCUT_ICON.arsenal, level: progress.level },
  ];

  return (
    <button
      className="home-final__loadout press-scale"
      type="button"
      onClick={() => {
        window.location.hash = `${pathFor("loadout")}?return=home`;
      }}
    >
      <span className="home-final__loadout-title">Active Loadout</span>
      {entries.map((entry) => (
        <span className="home-final__loadout-row" key={entry.label}>
          <img src={entry.art} alt="" />
          <span><small>{entry.label}</small><strong>{entry.name}</strong><i>Lv. {entry.level}</i></span>
          <b>{rarity}</b>
        </span>
      ))}
    </button>
  );
}

function MainActionRow({ ship, progress, power, onOpen }: { ship: ShipDefinition; progress: ShipProgress; power: number; onOpen: OpenPanel }) {
  return (
    <section className="home-final__actions" aria-label="Main actions">
      <PowerPanel power={power} onOpen={onOpen} />
      <PlayButton />
      <ActiveLoadoutPanel ship={ship} progress={progress} />
    </section>
  );
}

function MissionsProgressSection({ onOpen }: { onOpen: OpenPanel }) {
  return (
    <section className="home-final__missions" aria-labelledby="home-missions-title">
      <h2 id="home-missions-title">Missions &amp; Progress</h2>
      <div className="home-final__mission-grid">
        {MISSIONS.map((mission) => (
          <article key={mission.id} className={`home-final__mission home-final__mission--${mission.tone}`}>
            <h3>{mission.title}</h3>
            <img className="home-final__mission-art" src={mission.art} alt="" />
            <span className="home-final__mission-status">{mission.status}</span>
            <span className="home-final__progress"><i style={{ width: `${mission.progress}%` }} /></span>
            <small>{mission.reward}</small>
            <button className="press-scale" type="button" onClick={() => mission.id === "campaign" ? navigate("campaign") : onOpen(mission.title, `${mission.title} are coming soon.`)}>{mission.action}</button>
          </article>
        ))}
      </div>
    </section>
  );
}

function HomeBottomNav({ onOpen: _onOpen }: { onOpen: OpenPanel }) {
  const items = [
    { id: "home", label: "HOME", icon: HOME_BOTTOM_NAV_FINAL.home, action: () => navigate("home") },
    { id: "battle", label: "BATTLE", icon: HOME_BOTTOM_NAV_FINAL.battle, action: () => navigate("battle") },
    { id: "fleet", label: "FLEET", icon: HOME_BOTTOM_NAV_FINAL.fleet, action: () => navigate("ship-selection") },
    { id: "inventory", label: "INVENTORY", icon: HOME_BOTTOM_NAV_FINAL.inventory, action: () => navigate("inventory") },
    { id: "shop", label: "SHOP", icon: HOME_BOTTOM_NAV_FINAL.shop, action: () => navigate("shop") },
  ];

  return (
    <nav className="home-final__bottom-nav" aria-label="Primary">
      {items.map((item) => (
        <button key={item.id} className={`home-final__nav-item${item.id === "home" ? " home-final__nav-item--active" : ""} press-scale`} type="button" onClick={item.action} aria-current={item.id === "home" ? "page" : undefined}>
          <img src={item.icon} alt="" />
          <strong>{item.label}</strong>
        </button>
      ))}
    </nav>
  );
}

export function HomeScreen() {
  const { player } = usePlayerStore();
  const [comingSoon, setComingSoon] = useState<ComingSoonState | null>(null);
  const ship = getShipById(player.selectedShipId) ?? getShipById("ship-01-rapid-fire");
  const progress = ship ? player.shipProgress[ship.id] ?? createDefaultShipProgress(ship.id) : null;
  const stats = ship && progress ? calculateShipStats(ship, progress.level) : null;
  const power = stats ? calculatePowerScore(stats) : 0;
  const xpPct = player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;
  const chapterDotCount = useMemo(() => CAMPAIGN_STAGES.filter((stage) => stage.chapterId === player.currentChapterId).length, [player.currentChapterId]);
  const openPanel: OpenPanel = (title, message) => setComingSoon({ title, message });

  if (!ship || !progress) return null;

  return (
    <div className="home-final">
      <HomeTopBar player={player} xpPct={xpPct} onOpen={openPanel} />
      <HomeHeroScene ship={ship} chapterDotCount={chapterDotCount} onOpen={openPanel} />
      <MainActionRow ship={ship} progress={progress} power={power} onOpen={openPanel} />
      <MissionsProgressSection onOpen={openPanel} />
      <HomeBottomNav onOpen={openPanel} />
      <LockedContentModal open={comingSoon !== null} title={comingSoon?.title ?? ""} unlockRequirement={comingSoon?.message ?? "Coming soon."} onClose={() => setComingSoon(null)} />
    </div>
  );
}
