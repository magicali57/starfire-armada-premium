import { useEffect, useRef } from "react";
import { getShipById, getStageById } from "@/data";
import { usePlayerStore } from "@/store/playerStore";
import { navigate } from "@/app/routes";
import "./GameplayScreen.css";

// Placeholder for the future GameCanvas component. The real Canvas engine
// (translated from legacy/current-prototype) will mount here in a later
// batch; this batch only proves the route and layout.
export function GameplayScreen() {
  const {
    player,
    battleSession,
    startBattle,
    declareBattleVictory,
    declareBattleDefeat,
    completeBattle,
    enterBattleResults,
  } = usePlayerStore();
  const ship = getShipById(player.selectedShipId);
  const stage = getStageById(player.currentStageId);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Debug-only helper: the real gameplay engine will one day create the
  // session itself (Pre-Battle → Battle Launch → real combat). Until then,
  // this screen is the only way to exercise the canonical battle-session
  // pipeline end-to-end, so the debug buttons below self-start a session
  // for the player's current stage when none is already active, instead
  // of silently no-op'ing (the previous behavior when reached with no
  // active session). Still never fabricates a result — it runs the exact
  // same startBattle/declare/complete/enterResults sequence a real engine
  // would.
  const ensureActiveSession = () => {
    if (battleSession?.status === "active") return battleSession;
    const started = startBattle({ stageId: player.currentStageId });
    return started.ok ? started.session : null;
  };

  const endStage = (outcome: "victory" | "defeat") => {
    const active = ensureActiveSession();
    if (active) {
      const declared = outcome === "victory" ? declareBattleVictory() : declareBattleDefeat();
      if (declared.ok && declared.session) {
        const completed = completeBattle(declared.session.sessionId);
        if (completed.ok && completed.session) {
          enterBattleResults(completed.session.sessionId);
        }
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

  return (
    <div className="gameplay-screen">
      <div className="gameplay-screen__hud">
        <span>{ship?.name ?? "No ship"}</span>
        <span>{stage?.name ?? "No stage"}</span>
      </div>
      <canvas ref={canvasRef} width={390} height={600} className="gameplay-screen__canvas" />
      <div className="gameplay-screen__debug-actions">
        <button type="button" className="gameplay-screen__end press-scale" onClick={() => endStage("victory")}>
          Win Stage (debug)
        </button>
        <button type="button" className="gameplay-screen__end press-scale" onClick={() => endStage("defeat")}>
          Lose Stage (debug)
        </button>
      </div>
    </div>
  );
}
