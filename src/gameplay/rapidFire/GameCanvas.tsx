import { useEffect, useRef } from "react";
import type { BattlePerformance } from "@/systems/battleSession";
import { RapidFireEngine, type EngineHudSnapshot } from "./RapidFireEngine";

export interface GameCanvasProps {
  hullMax: number;
  defense: number;
  baseDamage: number;
  stageName: string;
  paused: boolean;
  onHud: (snap: EngineHudSnapshot) => void;
  onOutcome: (outcome: "victory" | "defeat", performance: BattlePerformance) => void;
  /** Exposes the live engine instance for pause-menu audio controls. */
  onEngineReady?: (engine: RapidFireEngine | null) => void;
}

/**
 * React mount point for the Rapid-Fire canvas engine.
 * Frame state lives entirely inside RapidFireEngine — this component only
 * syncs pause/resume and lifecycle.
 */
export function GameCanvas({
  hullMax,
  defense,
  baseDamage,
  stageName,
  paused,
  onHud,
  onOutcome,
  onEngineReady,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RapidFireEngine | null>(null);
  const onHudRef = useRef(onHud);
  const onOutcomeRef = useRef(onOutcome);
  const onEngineReadyRef = useRef(onEngineReady);
  onHudRef.current = onHud;
  onOutcomeRef.current = onOutcome;
  onEngineReadyRef.current = onEngineReady;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    const engine = new RapidFireEngine({
      canvas,
      hullMax,
      defense,
      baseDamage,
      stageName,
      onHud: (snap) => onHudRef.current(snap),
      onOutcome: (outcome, performance) => onOutcomeRef.current(outcome, performance),
    });
    engineRef.current = engine;
    if (import.meta.env.DEV) {
      (window as unknown as { __rapidFireEngine?: RapidFireEngine }).__rapidFireEngine = engine;
    }
    onEngineReadyRef.current?.(engine);
    void engine.start().then(() => {
      if (cancelled) engine.destroy();
    });
    const onResize = () => {
      // Trigger redraw path via CSS size change; engine reads clientWidth each frame.
      canvas.style.width = "100%";
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      engine.destroy();
      engineRef.current = null;
      onEngineReadyRef.current?.(null);
      if (import.meta.env.DEV) {
        const w = window as unknown as { __rapidFireEngine?: RapidFireEngine };
        if (w.__rapidFireEngine === engine) delete w.__rapidFireEngine;
      }
    };
    // Engine is created once per mount / battle attempt.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hullMax, defense, baseDamage, stageName]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className="gameplay-screen__canvas"
      width={390}
      height={700}
      aria-label="Rapid-Fire combat playfield"
    />
  );
}
