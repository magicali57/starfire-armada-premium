import { useEffect, useRef } from "react";
import { getShipById } from "@/data";
import { getStageById } from "@/data/campaign";
import { usePlayerStore } from "@/store/playerStore";
import { navigate } from "@/app/routes";
import "./GameplayScreen.css";

// Placeholder for the future GameCanvas component. The real Canvas engine
// (translated from legacy/current-prototype) will mount here in a later
// batch; this batch only proves the route/session-consumption and layout.
export function GameplayScreen() {
  const { battleSession, resetBattle, declareBattleVictory, declareBattleDefeat, completeBattle, enterBattleResults } =
    usePlayerStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gameplay REQUIRES an active battle session — it never creates one
  // itself (that is Pre-Battle Start's exclusive job) and never spends
  // Energy. A missing/invalid session (direct nav, reload mid-battle, a
  // stale completed/results session, or arriving here right after a
  // reload wiped the in-memory session) redirects safely away instead of
  // rendering a broken/empty screen. `resetBattle` here only clears
  // already-stale temporary state (a leftover completed/results session
  // from before a reload) — it never touches persisted progression and
  // never fabricates a result.
  const hasActiveSession = battleSession?.status === "active";
  useEffect(() => {
    if (!hasActiveSession) {
      if (battleSession) resetBattle();
      navigate("campaign");
    }
    // Only re-run when the session identity/status actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveSession, battleSession?.sessionId]);

  // Identity, difficulty, and loadout for this attempt come from the
  // active session itself (the canonical, immutable-per-attempt record),
  // never from the player's mutable "current" pointers — those can change
  // (e.g. via Loadout Manager) without affecting an attempt already in
  // progress.
  const ship = battleSession ? getShipById(battleSession.shipId) : undefined;
  const stage = battleSession ? getStageById(battleSession.stageId) : undefined;

  // Development-only integration test controls. Guarded by Vite's
  // standard `import.meta.env.DEV` (this project's only established
  // dev/prod flag) so they are stripped from production builds entirely
  // (dead-code-eliminated, not merely hidden) — see the `import.meta.env.DEV`
  // check wrapping the JSX below. They call the exact same canonical
  // victory/defeat → completion → results pipeline a real engine would;
  // they never grant rewards manually and never bypass completion rules
  // (declareBattleOutcome/completeBattleSession already enforce
  // first-outcome-wins and exactly-once completion regardless of caller).
  const endStage = (outcome: "victory" | "defeat") => {
    if (!hasActiveSession) return;
    const declared = outcome === "victory" ? declareBattleVictory() : declareBattleDefeat();
    if (declared.ok && declared.session) {
      const completed = completeBattle(declared.session.sessionId);
      if (completed.ok && completed.session) {
        enterBattleResults(completed.session.sessionId);
      }
    }
    navigate("results");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#0a0a18";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#22c9ee";
    ctx.font = "16px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("GameCanvas placeholder", canvas.width / 2, canvas.height / 2);
  }, []);

  if (!hasActiveSession) return null;

  return (
    <div className="gameplay-screen">
      <div className="gameplay-screen__hud">
        <span>{ship?.name ?? "No ship"}</span>
        <span>{stage?.name ?? "No stage"}</span>
      </div>
      <canvas ref={canvasRef} width={390} height={600} className="gameplay-screen__canvas" />
      {import.meta.env.DEV ? (
        <div className="gameplay-screen__debug-actions">
          <button type="button" className="gameplay-screen__end press-scale" onClick={() => endStage("victory")}>
            Win Stage (debug)
          </button>
          <button type="button" className="gameplay-screen__end press-scale" onClick={() => endStage("defeat")}>
            Lose Stage (debug)
          </button>
        </div>
      ) : null}
    </div>
  );
}
