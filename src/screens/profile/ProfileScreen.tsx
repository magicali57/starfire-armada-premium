import { useMemo, useState } from "react";
import { navigate } from "@/app/routes";
import { HubHeader } from "@/components/layout/HubHeader";
import { HubScreenShell } from "@/components/layout/HubScreenShell";
import { HubBottomNav } from "@/components/navigation/HubBottomNav";
import { ModalLayer } from "@/components/feedback/ModalLayer";
import { NeonPanel } from "@/components/cards/NeonPanel";
import { PrimaryButton } from "@/components/controls/PrimaryButton";
import { SecondaryButton } from "@/components/controls/SecondaryButton";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { ProgressFill } from "@/components/motion/ProgressFill";
import { MotionStaggerGroup } from "@/components/motion/MotionStaggerGroup";
import { formatRewardEntry, getPlayerProfileSummary, getProfileAvatar } from "@/data/playerProfile";
import { usePlayerStore } from "@/store/playerStore";
import "./ProfileScreen.css";

type NoticeState = { title: string; message: string } | null;

/**
 * Player Profile — commander identity + account-progression overview.
 * Every number here is read from getPlayerProfileSummary (data/
 * playerProfile.ts), which itself composes the existing canonical
 * getPlayerProgressionSummary (account XP/level) and
 * calculateLoadoutTotalPower (the one canonical Power figure already used
 * by Loadout Manager/Inventory Hub) — nothing here recomputes either.
 */
export function ProfileScreen() {
  const { player, updatePlayerProfile } = usePlayerStore();
  const summary = useMemo(() => getPlayerProfileSummary(player), [player]);
  const avatar = getProfileAvatar(summary.avatarId);

  const [notice, setNotice] = useState<NoticeState>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openNotice = (title: string, message: string) => setNotice({ title, message });

  return (
    <>
      <HubScreenShell
        header={<HubHeader player={player} xpPct={summary.progressPercent} onOpen={openNotice} />}
        footer={<HubBottomNav active="home" onComingSoon={openNotice} />}
      >
        <main className="player-profile">
          <div className="player-profile__topline">
            <SecondaryButton onClick={() => navigate("home")}>Back to Home</SecondaryButton>
          </div>

          <MotionStaggerGroup>
          <section className="player-profile__hero glass-panel">
            <span className={`player-profile__avatar player-profile__avatar--${avatar.accent}`} aria-hidden="true">
              {avatar.glyph}
            </span>
            <div className="player-profile__hero-copy">
              <h1 className="player-profile__name">{summary.displayName}</h1>
              <p className="player-profile__level">
                Commander Level {summary.currentLevel}
                {summary.isMaxLevel ? <span className="player-profile__max-badge">MAX LEVEL</span> : null}
              </p>
              {summary.isMaxLevel ? (
                <div className="player-profile__xp player-profile__xp--max">
                  <small>Maximum level reached</small>
                </div>
              ) : (
                <div className="player-profile__xp">
                  <ProgressFill percent={summary.progressPercent} tone="secondary" className="player-profile__xp-fill" />
                  <small>
                    {summary.xpWithinCurrentLevel.toLocaleString()} / {summary.xpRequiredWithinCurrentLevel.toLocaleString()} XP
                  </small>
                </div>
              )}
            </div>
            <PrimaryButton className="player-profile__edit-button" onClick={() => setEditOpen(true)}>
              Edit Profile
            </PrimaryButton>
          </section>

          <NeonPanel tone="primary" className="player-profile__section">
            <h2>Player Progression</h2>
            <dl className="player-profile__stat-list">
              <div>
                <dt>Current Level</dt>
                <dd>{summary.currentLevel}</dd>
              </div>
              <div>
                <dt>Next Level</dt>
                <dd>{summary.isMaxLevel ? "—" : summary.currentLevel + 1}</dd>
              </div>
              <div>
                <dt>Energy Cap</dt>
                <dd>{summary.currentEnergyCap.toLocaleString()}</dd>
              </div>
            </dl>
            {!summary.isMaxLevel && summary.nextLevelRewards.length > 0 ? (
              <div className="player-profile__rewards">
                <small>Next Level Rewards</small>
                <ul>
                  {summary.nextLevelRewards.map((reward, index) => (
                    <li key={`${reward.kind}-${index}`}>{formatRewardEntry(reward)}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {summary.upcomingUnlock ? (
              <p className="player-profile__unlock">
                Unlocks <strong>{summary.upcomingUnlock.label}</strong> at Level {summary.upcomingUnlock.level}.
              </p>
            ) : summary.isMaxLevel ? (
              <p className="player-profile__unlock">All account-level features are unlocked.</p>
            ) : null}
          </NeonPanel>

          <NeonPanel tone="secondary" className="player-profile__section">
            <h2>Account Overview</h2>
            <div className="player-profile__overview-grid">
              <div>
                <small>Total Power</small>
                <strong>
                  <AnimatedNumber value={summary.totalFleetPower} />
                </strong>
              </div>
              <div>
                <small>Campaign</small>
                <strong>
                  {summary.campaign.stagesCleared}/{summary.campaign.totalStages} Stages
                </strong>
              </div>
              <div>
                <small>Ships</small>
                <strong>
                  {summary.collection.shipsOwned}/{summary.collection.shipsTotal}
                </strong>
              </div>
              <div>
                <small>Companions</small>
                <strong>
                  {summary.collection.companionsOwned}/{summary.collection.companionsTotal}
                </strong>
              </div>
              <div>
                <small>Modules</small>
                <strong>
                  {summary.collection.modulesOwned}/{summary.collection.modulesTotal}
                </strong>
              </div>
              <div>
                <small>Arsenal</small>
                <strong>
                  {summary.collection.weaponsOwned}/{summary.collection.weaponsTotal}
                </strong>
              </div>
            </div>
          </NeonPanel>

          {summary.battleStatistics.length > 0 ? (
            <NeonPanel tone="gold" className="player-profile__section">
              <h2>Battle Statistics</h2>
              <div className="player-profile__stats-grid">
                {summary.battleStatistics.map((stat) => (
                  <div key={stat.id}>
                    <small>{stat.label}</small>
                    <strong>{stat.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </NeonPanel>
          ) : null}

          <NeonPanel tone="neutral" className="player-profile__section">
            <h2>Milestones</h2>
            <ul className="player-profile__milestones">
              <li>
                {summary.isMaxLevel
                  ? "Maximum Player Level reached."
                  : `Next Player Level reward at Level ${summary.currentLevel + 1}.`}
              </li>
              {summary.upcomingUnlock ? (
                <li>
                  {summary.upcomingUnlock.label} unlocks at Level {summary.upcomingUnlock.level}.
                </li>
              ) : (
                <li>All account-level unlocks are currently available.</li>
              )}
            </ul>
          </NeonPanel>
          </MotionStaggerGroup>
        </main>
      </HubScreenShell>

      <EditProfileModal
        open={editOpen}
        initialName={player.displayName}
        initialAvatarId={player.avatarId}
        onCancel={() => setEditOpen(false)}
        onSave={(input) => {
          const result = updatePlayerProfile(input);
          if (result.success) setEditOpen(false);
          return result;
        }}
      />

      <ModalLayer open={notice !== null} title={notice?.title ?? ""} onClose={() => setNotice(null)}>
        <div className="player-profile__notice">
          <p>{notice?.message}</p>
          <PrimaryButton fullWidth onClick={() => setNotice(null)}>
            Continue
          </PrimaryButton>
        </div>
      </ModalLayer>
    </>
  );
}
