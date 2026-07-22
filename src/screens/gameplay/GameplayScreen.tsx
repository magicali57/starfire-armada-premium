import { useCallback, useEffect, useRef, useState } from "react";
import { getShipById } from "@/data";
import { getStageById } from "@/data/campaign";
import { RAPID_FIRE_SHIP_ID } from "@/data/gameplayRapidFire";
import { GameCanvas } from "@/gameplay/rapidFire/GameCanvas";
import type { EngineHudSnapshot } from "@/gameplay/rapidFire/RapidFireEngine";
import { calculateShipStatsWithRank } from "@/systems/shipStarRank";
import { createDefaultShipProgress } from "@/systems/shipStats";
import type { BattlePerformance } from "@/systems/battleSession";
import { usePlayerStore } from "@/store/playerStore";
import { navigate } from "@/app/routes";
import "./GameplayScreen.css";

/**
 * Rapid-Fire vertical-slice gameplay shell.
 * React owns session validation, HUD presentation, pause commands, and
 * outcome navigation. Temporary combat state lives in RapidFireEngine only.
 */
export function GameplayScreen() {
  const {
    player,
    battleSession,
    resetBattle,
    pauseBattle,
    resumeBattle,
    declareBattleVictory,
    declareBattleDefeat,
    completeBattle,
    enterBattleResults,
  } = usePlayerStore();

  const [hud, setHud] = useState<EngineHudSnapshot | null>(null);
  const [pausedUi, setPausedUi] = useState(false);
  const outcomeSent = useRef(false);

  useEffect(() => {
    outcomeSent.current = false;
    setPausedUi(false);
    setHud(null);
  }, [battleSession?.sessionId]);

  const hasActiveSession =
    battleSession?.status === "active" || battleSession?.status === "paused";
  const shipId = battleSession?.shipId;
  const isRapidFire = shipId === RAPID_FIRE_SHIP_ID;

  useEffect(() => {
    if (hasActiveSession) return;
    const status = battleSession?.status;
    if (
      status === "paused" ||
      status === "victory" ||
      status === "defeat" ||
      status === "completing" ||
      status === "completed" ||
      status === "results"
    ) {
      return;
    }
    if (battleSession) resetBattle();
    navigate("campaign");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveSession, battleSession?.sessionId, battleSession?.status]);

  // First slice supports Rapid-Fire only — do not silently remap other ships.
  useEffect(() => {
    if (!hasActiveSession) return;
    if (isRapidFire) return;
    resetBattle();
    navigate("campaign");
  }, [hasActiveSession, isRapidFire, resetBattle]);

  const ship = battleSession ? getShipById(battleSession.shipId) : undefined;
  const stage = battleSession ? getStageById(battleSession.stageId) : undefined;
  const progress =
    ship && battleSession
      ? player.shipProgress[battleSession.shipId] ?? createDefaultShipProgress(battleSession.shipId)
      : null;
  const stats =
    ship && progress ? calculateShipStatsWithRank(ship, progress.level, progress.stars) : null;

  const finish = useCallback(
    (outcome: "victory" | "defeat", performance: BattlePerformance) => {
      if (outcomeSent.current) return;
      outcomeSent.current = true;
      const declared =
        outcome === "victory"
          ? declareBattleVictory(performance)
          : declareBattleDefeat(performance);
      if (declared.ok && declared.session) {
        const completed = completeBattle(declared.session.sessionId);
        if (completed.ok && completed.session) {
          enterBattleResults(completed.session.sessionId);
        }
      }
      navigate("results");
    },
    [completeBattle, declareBattleDefeat, declareBattleVictory, enterBattleResults],
  );

  const handlePause = () => {
    if (!hasActiveSession || outcomeSent.current) return;
    pauseBattle();
    setPausedUi(true);
  };

  const handleResume = () => {
    if (!hasActiveSession) return;
    resumeBattle();
    setPausedUi(false);
  };

  const handleAbandon = () => {
    // No rewards — clear temporary session and return to Campaign.
    resetBattle();
    navigate("campaign");
  };

  // DEV-only forced outcomes still use the canonical pipeline.
  const endStageDebug = (outcome: "victory" | "defeat") => {
    if (!hasActiveSession || outcomeSent.current) return;
    const performance: BattlePerformance = {
      score: hud?.score ?? 0,
      enemiesDestroyed: 0,
      bossesDestroyed: 0,
      remainingHp: hud?.hull ?? 0,
      remainingHpPercent: hud && hud.hullMax > 0 ? Math.round((hud.hull / hud.hullMax) * 100) : 0,
      completionTimeMs: 0,
      damageTaken: 0,
      noDamage: true,
    };
    finish(outcome, performance);
  };

  if (!hasActiveSession || !isRapidFire || !ship || !stage || !stats) return null;

  const hullPct = hud && hud.hullMax > 0 ? Math.max(0, Math.min(100, (hud.hull / hud.hullMax) * 100)) : 100;
  const fp = hud?.firepower ?? 0;

  return (
    <div className="gameplay-screen">
      <div className="gameplay-hud" aria-live="polite">
        <div className="gameplay-hud__top">
          <div className="gameplay-hud__hull">
            <span className="gameplay-hud__label">Hull</span>
            <div className="gameplay-hud__bar" role="progressbar" aria-valuenow={Math.round(hullPct)} aria-valuemin={0} aria-valuemax={100}>
              <i style={{ width: `${hullPct}%` }} />
            </div>
            <span className="gameplay-hud__value">
              {Math.round(hud?.hull ?? stats.hp)}/{Math.round(hud?.hullMax ?? stats.hp)}
            </span>
          </div>
          <div className="gameplay-hud__center">
            <span className="gameplay-hud__wave">
              WAVE {hud?.waveIndex ?? 1}/{hud?.waveTotal ?? 5}
            </span>
            <span className="gameplay-hud__stage">{stage.name}</span>
          </div>
          <div className="gameplay-hud__right">
            <span className="gameplay-hud__score">{(hud?.score ?? 0).toLocaleString()}</span>
            <button type="button" className="gameplay-hud__pause press-scale" onClick={handlePause} aria-label="Pause">
              ❚❚
            </button>
          </div>
        </div>

        <div className="gameplay-hud__firepower">
          <span className="gameplay-hud__label">Firepower {fp}/10</span>
          <div className="gameplay-hud__fp-track" aria-hidden="true">
            {Array.from({ length: 11 }, (_, i) => (
              <b key={i} className={i <= fp ? "is-on" : undefined} />
            ))}
          </div>
          {hud?.maxFirepowerActive ? (
            <span className="gameplay-hud__overdrive">
              MAX FIREPOWER {Math.ceil((hud.maxFirepowerRemainingMs || 0) / 1000)}s
            </span>
          ) : null}
        </div>
      </div>

      <div className="gameplay-screen__playfield">
        <GameCanvas
          hullMax={stats.hp}
          defense={stats.defense}
          baseDamage={Math.max(8, Math.round(stats.damage * 0.35))}
          stageName={stage.name}
          paused={pausedUi}
          onHud={setHud}
          onOutcome={finish}
        />
      </div>

      {pausedUi ? (
        <div className="gameplay-pause" role="dialog" aria-modal="true" aria-label="Paused">
          <div className="gameplay-pause__panel">
            <h2>Paused</h2>
            <p>
              {stage.name} · Wave {hud?.waveIndex ?? 1}/{hud?.waveTotal ?? 5}
            </p>
            <button type="button" className="gameplay-pause__resume press-scale" onClick={handleResume}>
              Resume
            </button>
            <button type="button" className="gameplay-pause__abandon press-scale" onClick={handleAbandon}>
              Return to Campaign
            </button>
            <small>Abandoning grants no rewards.</small>
          </div>
        </div>
      ) : null}

      {import.meta.env.DEV ? (
        <div className="gameplay-screen__debug-actions">
          <button type="button" className="gameplay-screen__end press-scale" onClick={() => endStageDebug("victory")}>
            Win Stage (debug)
          </button>
          <button type="button" className="gameplay-screen__end press-scale" onClick={() => endStageDebug("defeat")}>
            Lose Stage (debug)
          </button>
        </div>
      ) : null}
    </div>
  );
}
