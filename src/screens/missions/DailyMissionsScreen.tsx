import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { navigate, type RouteId } from "@/app/routes";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { InlineAlert } from "@/components/feedback/InlineAlert";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ProgressFill } from "@/components/motion/ProgressFill";
import {
  HOME_SCENE,
  REWARD_CHEST,
  RESOURCE_ICON,
  UTILITY_ICON,
  getShipMasterArt,
} from "@/data/assetRegistry";
import {
  getDailyMissionsScreenView,
  type DailyActivityMilestoneViewItem,
  type DailyMissionViewItem,
} from "@/systems/dailyMissions/dailyMissionView";
import type { DailyActivityClaimResult, DailyMissionClaimResult } from "@/types/dailyMissions";
import { usePlayerStore } from "@/store/playerStore";
import "./DailyMissionsScreen.css";

/**
 * Daily Missions — visual composition follows 31_Daily_Missions.png.
 * Progress/claims only via store claimDailyMission / claimDailyActivityMilestone
 * and upstream mission events. Visiting this screen never grants progress.
 */

const MISSION_ICON: Record<string, string> = {
  battle: UTILITY_ICON.missions,
  victory: UTILITY_ICON.achievements,
  energy: RESOURCE_ICON.energy,
  ship: getShipMasterArt("ship-01-rapid-fire") ?? UTILITY_ICON.upgrade,
  weapon: UTILITY_ICON.upgrade,
  chest: REWARD_CHEST.basic,
  shop: RESOURCE_ICON.crystals,
};

const MILESTONE_CHEST: Record<"basic" | "rare" | "epic", string> = {
  basic: REWARD_CHEST.basic,
  rare: REWARD_CHEST.rare,
  epic: REWARD_CHEST.epic,
};

const KNOWN_GO_ROUTES = new Set<RouteId>([
  "campaign",
  "ship-selection",
  "arsenal",
  "chest-opening",
  "shop",
  "companions",
  "modules",
]);

function describeMissionClaimError(code?: DailyMissionClaimResult["errorCode"]): string {
  switch (code) {
    case "incomplete":
      return "Finish this mission before claiming.";
    case "already-claimed":
      return "Already claimed today.";
    case "invalid-mission-id":
    case "inactive-mission":
      return "That mission isn't available.";
    case "invalid-reward-entry":
      return "Reward couldn't be applied. Nothing was granted.";
    case "persistence-failure":
      return "Save write failed — nothing was granted. Try again.";
    case "claim-in-progress":
      return "A claim is already processing.";
    default:
      return "Claim failed. Nothing was granted.";
  }
}

function describeActivityClaimError(code?: DailyActivityClaimResult["errorCode"]): string {
  switch (code) {
    case "insufficient-activity":
      return "Earn more activity points first.";
    case "already-claimed":
      return "That milestone is already claimed.";
    case "invalid-milestone-id":
      return "That milestone isn't available.";
    case "invalid-reward-entry":
      return "Milestone reward couldn't be applied. Nothing was granted.";
    case "persistence-failure":
      return "Save write failed — nothing was granted. Try again.";
    case "claim-in-progress":
      return "A claim is already processing.";
    default:
      return "Milestone claim failed. Nothing was granted.";
  }
}

function formatRewardAmount(amount: number | null): string {
  if (amount === null) return "";
  if (amount >= 1000) {
    const compact = amount / 1000;
    return compact % 1 === 0 ? `${compact}K` : `${compact.toFixed(1)}K`;
  }
  return String(amount);
}

function MissionCard({
  mission,
  index,
  onClaim,
  onGo,
}: {
  mission: DailyMissionViewItem;
  index: number;
  onClaim: (id: string) => void;
  onGo: (route: string) => void;
}) {
  const icon = MISSION_ICON[mission.definition.iconKey] ?? UTILITY_ICON.missions;
  const tone = mission.completed ? "primary" : "secondary";

  return (
    <article
      className={`daily-missions__card motion-stagger-item${mission.claimable ? " daily-missions__card--claimable" : ""}${mission.claimed ? " daily-missions__card--claimed" : ""}`}
      style={{ "--motion-index": index } as CSSProperties}
    >
      <div className="daily-missions__card-icon" aria-hidden="true">
        <img src={icon} alt="" />
      </div>
      <div className="daily-missions__card-body">
        <div className="daily-missions__card-top">
          <div className="daily-missions__card-copy">
            <h2>{mission.definition.title}</h2>
            <p>{mission.definition.description}</p>
          </div>
          <ul className="daily-missions__card-rewards" aria-label="Mission rewards">
            {mission.rewardRows.slice(0, 2).map((row) => (
              <li key={row.key}>
                <img src={row.icon} alt="" />
                <span>{formatRewardAmount(row.amount)}</span>
              </li>
            ))}
          </ul>
          {mission.action === "claim" ? (
            <button
              type="button"
              className="daily-missions__action daily-missions__action--claim press-scale"
              onClick={() => onClaim(mission.definition.id)}
            >
              CLAIM
              <b aria-hidden="true" />
            </button>
          ) : mission.action === "completed" ? (
            <button type="button" className="daily-missions__action daily-missions__action--done" disabled>
              <span aria-hidden="true">✓</span>
              DONE
            </button>
          ) : (
            <button
              type="button"
              className="daily-missions__action daily-missions__action--go press-scale"
              onClick={() => onGo(mission.definition.goToRoute)}
            >
              GO
            </button>
          )}
        </div>
        <div className="daily-missions__card-progress">
          <ProgressFill
            percent={mission.progressPercent}
            tone={tone}
            label={`${mission.progress}/${mission.target}`}
          />
        </div>
      </div>
    </article>
  );
}

function ActivityTrack({
  activityPoints,
  maxActivityPoints,
  activityPercent,
  milestones,
  onClaim,
}: {
  activityPoints: number;
  maxActivityPoints: number;
  activityPercent: number;
  milestones: DailyActivityMilestoneViewItem[];
  onClaim: (id: string) => void;
}) {
  return (
    <section className="daily-missions__activity" aria-label="Daily activity progress">
      <div className="daily-missions__activity-head">
        <h2>Activity Progress</h2>
        <p>
          Activity today: <strong>{activityPoints}</strong>
          <span aria-hidden="true"> ★</span>
        </p>
      </div>
      <div className="daily-missions__activity-track">
        <div className="daily-missions__activity-bar" aria-hidden="true">
          <i style={{ width: `${activityPercent}%` }} />
        </div>
        <ul className="daily-missions__milestones">
          {milestones.map((milestone) => {
            const left = maxActivityPoints > 0
              ? Math.min(100, (milestone.definition.requiredPoints / maxActivityPoints) * 100)
              : 0;
            return (
              <li
                key={milestone.definition.id}
                className={`daily-missions__milestone${milestone.claimed ? " is-claimed" : ""}${milestone.claimable ? " is-claimable motion-glow-rare" : ""}${!milestone.reached ? " is-locked" : ""}`}
                style={{ left: `${left}%` }}
              >
                <button
                  type="button"
                  className="daily-missions__milestone-btn press-scale"
                  disabled={!milestone.claimable}
                  aria-label={
                    milestone.claimed
                      ? `Milestone ${milestone.definition.requiredPoints} claimed`
                      : milestone.claimable
                        ? `Claim milestone ${milestone.definition.requiredPoints}`
                        : `Milestone ${milestone.definition.requiredPoints} locked`
                  }
                  onClick={() => onClaim(milestone.definition.id)}
                >
                  <img src={MILESTONE_CHEST[milestone.definition.tier]} alt="" />
                </button>
                <span className="daily-missions__milestone-check" aria-hidden="true">
                  {milestone.claimed ? "✓" : ""}
                </span>
                <span className="daily-missions__milestone-pts">{milestone.definition.requiredPoints}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export function DailyMissionsScreen() {
  const { player, claimDailyMission, claimDailyActivityMilestone, ensureDailyMissions } = usePlayerStore();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    title: string;
    rewards: { icon: string; label: string }[];
    activityPoints?: number;
  } | null>(null);
  const [notice, setNotice] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    // Reset validation only — never grants progress or rewards.
    ensureDailyMissions();
  }, [ensureDailyMissions]);

  const view = useMemo(() => getDailyMissionsScreenView(player), [player]);
  const xpPct = player.xpToNextLevel > 0 ? Math.min(100, Math.round((player.xp / player.xpToNextLevel) * 100)) : 0;

  const handleGo = (route: string) => {
    if (KNOWN_GO_ROUTES.has(route as RouteId)) {
      navigate(route as RouteId);
      return;
    }
    setFeedback("That destination isn't available yet.");
  };

  const handleClaimMission = (missionId: string) => {
    const result = claimDailyMission(missionId);
    if (!result.success) {
      setFeedback(describeMissionClaimError(result.errorCode));
      return;
    }
    const mission = view.missions.find((row) => row.definition.id === missionId);
    setSuccess({
      title: result.missionTitle,
      activityPoints: result.activityPointsAwarded,
      rewards: (mission?.rewardRows ?? []).map((row) => ({
        icon: row.icon,
        label: `${row.displayName}${row.amount !== null ? ` ×${row.amount.toLocaleString()}` : ""}`,
      })),
    });
  };

  const handleClaimMilestone = (milestoneId: string) => {
    const result = claimDailyActivityMilestone(milestoneId);
    if (!result.success) {
      setFeedback(describeActivityClaimError(result.errorCode));
      return;
    }
    const milestone = view.milestones.find((row) => row.definition.id === milestoneId);
    setSuccess({
      title: `${result.requiredPoints} Activity Milestone`,
      rewards: (milestone?.rewardRows ?? []).map((row) => ({
        icon: row.icon,
        label: `${row.displayName}${row.amount !== null ? ` ×${row.amount.toLocaleString()}` : ""}`,
      })),
    });
  };

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={xpPct} onOpen={(title, message) => setNotice({ title, message })} />}
        footer={<HubBottomNav active="home" onComingSoon={(title, message) => setNotice({ title, message })} />}
      >
        <main
          className="daily-missions motion-fade-in"
          style={{ ["--daily-missions-backdrop" as string]: `url(${HOME_SCENE.background})` }}
        >
          <div className="daily-missions__topline">
            <SecondaryButton onClick={() => navigate("home")}>Back</SecondaryButton>
          </div>

          <header className="daily-missions__title">
            <h1 className="neon-text-primary">Daily Missions</h1>
            <p>Complete tasks and earn rewards.</p>
            <div className="daily-missions__reset">Resets daily</div>
          </header>

          {feedback ? (
            <InlineAlert tone="danger" message={feedback} onDismiss={() => setFeedback(null)} />
          ) : null}

          <div className="daily-missions__list" role="list">
            {view.missions.map((mission, index) => (
              <MissionCard
                key={mission.definition.id}
                mission={mission}
                index={index}
                onClaim={handleClaimMission}
                onGo={handleGo}
              />
            ))}
          </div>

          {view.allMissionsClaimed ? (
            <p className="daily-missions__complete motion-scale-in">All daily missions claimed. Great work, Commander.</p>
          ) : null}

          <ActivityTrack
            activityPoints={view.activityPoints}
            maxActivityPoints={view.maxActivityPoints}
            activityPercent={view.activityPercent}
            milestones={view.milestones}
            onClaim={handleClaimMilestone}
          />
        </main>
      </HubScreenShell>

      {success ? (
        <ModalLayer open title="Rewards Claimed" onClose={() => setSuccess(null)}>
          <div className="daily-missions__success motion-scale-in">
            <h3>{success.title}</h3>
            {typeof success.activityPoints === "number" && success.activityPoints > 0 ? (
              <p className="daily-missions__success-activity">+{success.activityPoints} Activity</p>
            ) : null}
            <ul className="daily-missions__success-rewards">
              {success.rewards.map((row) => (
                <li key={row.label} className="motion-stagger-item">
                  <img src={row.icon} alt="" />
                  <span>{row.label}</span>
                </li>
              ))}
            </ul>
            <SecondaryButton onClick={() => setSuccess(null)}>Continue</SecondaryButton>
          </div>
        </ModalLayer>
      ) : null}

      <ModalLayer open={notice !== null} title={notice?.title ?? ""} onClose={() => setNotice(null)}>
        <div className="daily-missions__success">
          <p>{notice?.message}</p>
          <SecondaryButton onClick={() => setNotice(null)}>Close</SecondaryButton>
        </div>
      </ModalLayer>
    </>
  );
}
