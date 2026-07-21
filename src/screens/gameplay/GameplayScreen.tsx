import { useEffect, useRef } from "react";
import { getShipById, getStageById } from "@/data";
import { usePlayerStore } from "@/store/playerStore";
import { navigate } from "@/app/routes";
import "./GameplayScreen.css";

// Placeholder for the future GameCanvas component. The real Canvas engine
// (translated from legacy/current-prototype) will mount here in a later
// batch; this batch only proves the route and layout.
export function GameplayScreen() {
  const { player, battleSession, declareBattleVictory, completeBattle, enterBattleResults } =
    usePlayerStore();
  const ship = getShipById(player.selectedShipId);
  const stage = getStageById(player.currentStageId);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      <button
        type="button"
        className="gameplay-screen__end press-scale"
        onClick={() => {
          // Debug path only — the future real engine will declare victory/
          // defeat from actual combat conditions. When a canonical battle
          // session is active this flows through the exactly-once
          // completion pipeline; without one, Results redirects safely and
          // grants nothing (the old direct-to-results prototype behavior).
          if (battleSession?.status === "active") {
            const declared = declareBattleVictory();
            if (declared.ok && declared.session) {
              const completed = completeBattle(declared.session.sessionId);
              if (completed.ok && completed.session) {
                enterBattleResults(completed.session.sessionId);
              }
            }
          }
          navigate("results");
        }}
      >
        End Stage (debug)
      </button>
    </div>
  );
}
