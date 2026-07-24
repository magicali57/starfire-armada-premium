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
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<RapidFireEngine | null>(null);
  const onHudRef = useRef(onHud);
  const onOutcomeRef = useRef(onOutcome);
  const onEngineReadyRef = useRef(onEngineReady);
  onHudRef.current = onHud;
  onOutcomeRef.current = onOutcome;
  onEngineReadyRef.current = onEngineReady;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const engine = new RapidFireEngine({
      host,
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
    void engine
      .start()
      .then(() => {
        if (cancelled) engine.destroy();
      })
      .catch((err) => {
        // Never fail silently: if renderer/asset startup throws, the canvas
        // would stay blank with no explanation.
        console.error("[RapidFire] Engine failed to start:", err);
      });
    // Resizing is handled by the renderer's ResizeObserver on the host.
    return () => {
      cancelled = true;
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

  // Host element only — the renderer creates and owns the <canvas> inside it,
  // so every engine instance gets a fresh WebGL context.
  return (
    <div
      ref={hostRef}
      className="gameplay-screen__canvas"
      role="img"
      aria-label="Rapid-Fire combat playfield"
    />
  );
}
