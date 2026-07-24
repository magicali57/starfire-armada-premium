import type { BattlePerformance } from "@/systems/battleSession";
import { RAPID_FIRE_SLICE_ASSETS } from "@/data/gameplayRapidFire";
import { ENEMY_DEFS, type EnemyKind } from "./enemyConfig";
import {
  FIREPOWER_MAX,
  getFirepowerConfig,
  MAX_FIREPOWER,
  type FireLane,
} from "./firepowerConfig";
import { WAVE_COUNT, getSpawnsForPhase } from "./waveTable";
import {
  computeFormationPose,
  type FormationSpawnEvent,
  type FormationType,
} from "./formationConfig";
import { ANIM } from "./animationDefs";
import { VfxSystem } from "./spriteAnimation";
import { RapidFireAudioSystem, type AudioPrefs } from "./audioSystem";
import { PixiRenderer } from "./pixiRenderer";
import type {
  BgStar,
  Debris,
  Enemy,
  ExplosionFx,
  Pickup,
  Projectile,
  RenderState,
  Vec,
} from "./renderTypes";

export interface WaveAnnouncement {
  title: string;
  subtitle: string;
}

export interface EngineHudSnapshot {
  hull: number;
  hullMax: number;
  firepower: number;
  maxFirepowerActive: boolean;
  maxFirepowerRemainingMs: number;
  waveIndex: number;
  waveTotal: number;
  announcement: WaveAnnouncement | null;
  score: number;
  stageName: string;
  paused: boolean;
  outcome: "none" | "victory" | "defeat";
}

export interface RapidFireEngineOptions {
  canvas: HTMLCanvasElement;
  hullMax: number;
  defense: number;
  baseDamage: number;
  stageName: string;
  onHud?: (snap: EngineHudSnapshot) => void;
  onOutcome?: (outcome: "victory" | "defeat", performance: BattlePerformance) => void;
}

interface PlayerState {
  x: number;
  y: number;
  radius: number;
  w: number;
  h: number;
}

interface PendingLaneShot {
  fireAtMs: number;
  lane: FireLane;
  speed: number;
  dmgMul: number;
  glowBoost: number;
}

const LOGICAL_W = 390;
const LOGICAL_H = 700;
const MAX_DT = 50;
const MAX_PLAYER_SHOTS = 120;
const MAX_HOSTILE_SHOTS = 80;
const MAX_PICKUPS = 16;
const MAX_PENDING_SHOTS = 40;
const FINGER_OFFSET_Y = 56;
/** Post-hit invulnerability window (flicker). */
const INVULN_MS = 800;
/** Enemy sprite stays visible this long into the destruction sequence. */
const ENEMY_DEATH_SPRITE_MS = 200;
const ENEMY_DEATH_REMOVE_MS = 320;
/** Power Carrier Fire-Up appears once destruction has resolved. */
const CARRIER_DROP_DELAY_MS = 240;
const MAX_EXPLOSIONS = 20;

/** Wave-phase gap timing (mobile playtest requirement): after a phase's
 * enemies are fully resolved, wait, announce, wait, then begin the next
 * phase. Total gap ≈ 6s. */
const PHASE_GAP_PAUSE_MS = 2000;
const PHASE_GAP_ANNOUNCE_MS = 2000;
const PHASE_GAP_TRANSITION_MS = 2000;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function circleHit(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

export class RapidFireEngine {
  private canvas: HTMLCanvasElement;
  private opts: RapidFireEngineOptions;
  private images: Record<string, HTMLImageElement> = {};
  private renderer: PixiRenderer | null = null;
  private renderState: RenderState;
  private ready = false;
  private destroyed = false;
  private paused = false;
  private outcomeLocked: "none" | "victory" | "defeat" = "none";
  private raf = 0;
  private lastTs = 0;
  private elapsedMs = 0;
  private combatTimeMs = 0;

  private player: PlayerState;
  private hull: number;
  private hullMax: number;
  private defense: number;
  private baseDamage: number;

  private firepower = 0;
  private fireCd = 0;
  private heavyCd = 0;
  private volleyIndex = 0;
  private maxFpRemaining = 0;
  private maxFpBurstPlayed = false;

  private playerShots: Projectile[] = [];
  private hostileShots: Projectile[] = [];
  private pendingShots: PendingLaneShot[] = [];
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];

  // Wave-phase flow: enemy-clear-gated (not a flat absolute-time schedule).
  // See PHASE_GAP_* constants and updatePhaseFlow().
  private currentPhase = 1;
  private phaseSpawnQueue: FormationSpawnEvent[] = getSpawnsForPhase(1);
  private phaseSpawnCursor = 0;
  private phaseActiveSinceMs = 0;
  private phaseState: "spawning" | "gap-pause" | "gap-announce" | "gap-transition" = "spawning";
  private phaseGapTimerMs = 0;
  private announcement: WaveAnnouncement | null = null;

  private nextEnemyId = 1;
  private score = 0;
  private enemiesDestroyed = 0;
  private damageTaken = 0;
  private bgScroll = 0;
  private streakScroll = 0;

  // Presentation state (never persisted; cleared with the engine instance).
  private vfx: VfxSystem | null = null;
  private explosions: ExplosionFx[] = [];
  private bank = 0;
  private prevPlayerX = LOGICAL_W / 2;
  private recoil = 0;
  /** Set on player damage only — rendered as a brief red tint on the ship. */
  private damageFlashMs = 0;
  private invulnMs = 0;
  private shakeMs = 0;
  private shakeMag = 0;

  // Audio (never persisted; a dedicated localStorage key holds volume prefs
  // only — schema v12 / the versioned save are never touched).
  private audio: RapidFireAudioSystem;
  private audioUnlocked = false;
  private lowHullWarned = false;
  private musicStarted = false;

  // Parallax background starfield (rendered by PixiRenderer). Star positions
  // are generated once so the middle layer never re-randomizes mid-frame.
  private midStars: BgStar[] = [];

  private pointerId: number | null = null;
  private pointerActive = false;

  private hudAcc = 0;
  private visibilityHandler: () => void;
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: (e: PointerEvent) => void;
  private boundTouchMove: (e: TouchEvent) => void;

  constructor(opts: RapidFireEngineOptions) {
    this.opts = opts;
    this.canvas = opts.canvas;
    // The canvas is handed to the Pixi WebGL renderer in start(); the engine
    // never acquires a 2D context on it (a canvas supports only one context
    // type — this guarantees Canvas2D and Pixi never run simultaneously).
    this.hullMax = Math.max(1, Math.trunc(opts.hullMax));
    this.hull = this.hullMax;
    this.defense = Math.max(0, opts.defense);
    this.baseDamage = Math.max(1, opts.baseDamage);
    this.player = {
      x: LOGICAL_W / 2,
      y: LOGICAL_H - 110,
      radius: 16,
      w: 52,
      h: 64,
    };

    this.visibilityHandler = () => {
      if (document.hidden) this.setPaused(true);
    };
    this.boundPointerDown = (e) => this.onPointerDown(e);
    this.boundPointerMove = (e) => this.onPointerMove(e);
    this.boundPointerUp = (e) => this.onPointerUp(e);
    this.boundTouchMove = (e) => {
      if (this.pointerActive) e.preventDefault();
    };
    this.audio = new RapidFireAudioSystem();
    this.midStars = Array.from({ length: 26 }, () => ({
      x: Math.random() * LOGICAL_W,
      y: Math.random() * LOGICAL_H,
      r: 0.6 + Math.random() * 1.4,
      speedMul: 0.55 + Math.random() * 0.5,
      a: 0.15 + Math.random() * 0.35,
    }));

    // One persistent render-state object; scalar fields are mutated and array
    // fields are re-pointed at the live entity arrays each frame, so handing
    // it to the renderer allocates nothing per frame.
    this.renderState = {
      elapsedMs: 0,
      bank: 0,
      recoil: 0,
      damageFlashMs: 0,
      invulnMs: 0,
      shakeMs: 0,
      shakeMag: 0,
      firepower: 0,
      maxActive: false,
      atMax: false,
      playerX: this.player.x,
      playerY: this.player.y,
      playerW: this.player.w,
      playerH: this.player.h,
      bgScroll: 0,
      streakScroll: 0,
      stars: this.midStars,
      playerShots: this.playerShots,
      hostileShots: this.hostileShots,
      enemies: this.enemies,
      pickups: this.pickups,
      explosions: this.explosions,
      vfx: null,
    };
  }

  async start(): Promise<void> {
    const assets = RAPID_FIRE_SLICE_ASSETS;
    const entries = await Promise.all(
      Object.entries(assets).map(async ([key, src]) => [key, await loadImage(src)] as const),
    );
    this.images = Object.fromEntries(entries);
    this.vfx = new VfxSystem(this.images, 48);
    this.renderState.vfx = this.vfx;
    // The player ship's own art carries its engine glow; PixiRenderer adds a
    // tight additive under-ship glow tied to Firepower/Max Firepower (no
    // detached thruster VFX).
    const renderer = new PixiRenderer(this.canvas);
    await renderer.init(this.images);
    if (this.destroyed) {
      renderer.destroy();
      return;
    }
    this.renderer = renderer;

    this.ready = true;
    this.bindInput();
    document.addEventListener("visibilitychange", this.visibilityHandler);
    this.lastTs = performance.now();
    this.loop(this.lastTs);
    this.emitHud(true);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.unbindInput();
    document.removeEventListener("visibilitychange", this.visibilityHandler);
    this.vfx?.clear();
    this.explosions = [];
    this.pendingShots = [];
    this.audio.destroy();
    this.renderer?.destroy();
    this.renderer = null;
  }

  setPaused(paused: boolean): void {
    if (this.outcomeLocked !== "none") return;
    if (paused === this.paused) return;
    this.paused = paused;
    if (!paused) this.lastTs = performance.now();
    if (paused) this.audio.pauseCue();
    else this.audio.resumeCue();
    this.emitHud(true);
  }

  isPaused(): boolean {
    return this.paused;
  }

  getAudioPrefs(): AudioPrefs {
    return this.audio.getPrefs();
  }

  setAudioPrefs(prefs: Partial<AudioPrefs>): void {
    this.audio.setPrefs(prefs);
  }

  getSnapshot(): EngineHudSnapshot {
    return {
      hull: this.hull,
      hullMax: this.hullMax,
      firepower: this.firepower,
      maxFirepowerActive: this.maxFpRemaining > 0,
      maxFirepowerRemainingMs: Math.max(0, this.maxFpRemaining),
      waveIndex: this.currentPhase,
      waveTotal: WAVE_COUNT,
      announcement: this.announcement,
      score: this.score,
      stageName: this.opts.stageName,
      paused: this.paused,
      outcome: this.outcomeLocked,
    };
  }

  /** Test / screenshot helpers — not used by production combat path. */
  __debugApplyFireUp(): void {
    this.collectFireUp();
  }
  __debugGetFirepower(): number {
    return this.firepower;
  }
  __debugGetMaxFpRemaining(): number {
    return this.maxFpRemaining;
  }
  __debugDamagePlayer(amount: number): void {
    this.invulnMs = 0;
    this.applyPlayerDamage(amount);
  }
  __debugGetHull(): number {
    return this.hull;
  }
  /** Set firepower level for visual verification (clamped 0–10). */
  __debugSetFirepower(level: number): void {
    this.firepower = Math.max(0, Math.min(FIREPOWER_MAX, Math.trunc(level)));
    if (this.firepower >= FIREPOWER_MAX) this.maxFpBurstPlayed = true;
    this.emitHud(true);
  }
  /** Activate MAX FIREPOWER duration for visual verification. */
  __debugActivateMaxFirepower(ms = MAX_FIREPOWER.durationMs): void {
    this.firepower = FIREPOWER_MAX;
    this.maxFpBurstPlayed = true;
    this.maxFpRemaining = Math.min(MAX_FIREPOWER.refreshCapMs, Math.max(0, ms));
    this.emitHud(true);
  }
  __debugSpawnEnemy(kind: EnemyKind, x = LOGICAL_W / 2, y = 140): void {
    const enemy = this.makeEnemy(kind, "vFormationTop", 0, 1);
    enemy.x = x;
    enemy.y = y;
    this.enemies.push(enemy);
  }
  __debugSpawnFireUpPickup(x = LOGICAL_W / 2, y = LOGICAL_H * 0.55): void {
    this.spawnFireUp(x, y);
  }
  __debugClearPickups(): void {
    this.pickups = [];
  }
  __debugClearEnemies(): void {
    this.enemies = [];
  }
  __debugClearProjectiles(): void {
    this.playerShots = [];
    this.hostileShots = [];
    this.pendingShots = [];
  }
  /** Stop further wave spawns (screenshot / test isolation). */
  __debugStopSpawns(): void {
    this.phaseSpawnCursor = this.phaseSpawnQueue.length;
  }
  __debugGetVfxCount(): number {
    return this.vfx?.activeCount ?? 0;
  }

  private makeEnemy(kind: EnemyKind, formation: FormationType, slot: number, slotCount: number): Enemy {
    const def = ENEMY_DEFS[kind];
    const pose = computeFormationPose(formation, slot, slotCount, 0);
    return {
      id: this.nextEnemyId++,
      kind,
      x: pose.xNorm * LOGICAL_W,
      y: pose.yNorm * LOGICAL_H,
      vx: 0,
      vy: 0,
      hull: def.hull,
      radius: def.radius,
      w: def.drawWidth,
      h: def.drawHeight,
      shootCd: def.shootIntervalMs ? def.shootIntervalMs * 0.5 : 999999,
      shotIndex: 0,
      swayPhase: Math.random() * Math.PI * 2,
      entryMs: 0,
      flashMs: 0,
      recoilMs: 0,
      dying: false,
      dyingMs: 0,
      alive: true,
      dropped: false,
      formation,
      slot,
      slotCount,
      formationSpawnedAtMs: this.elapsedMs,
      formationPhase: pose.phase,
      canFire: pose.canFire,
    };
  }

  private bindInput(): void {
    this.canvas.addEventListener("pointerdown", this.boundPointerDown);
    this.canvas.addEventListener("pointermove", this.boundPointerMove);
    this.canvas.addEventListener("pointerup", this.boundPointerUp);
    this.canvas.addEventListener("pointercancel", this.boundPointerUp);
    this.canvas.addEventListener("touchmove", this.boundTouchMove, { passive: false });
  }

  private unbindInput(): void {
    this.canvas.removeEventListener("pointerdown", this.boundPointerDown);
    this.canvas.removeEventListener("pointermove", this.boundPointerMove);
    this.canvas.removeEventListener("pointerup", this.boundPointerUp);
    this.canvas.removeEventListener("pointercancel", this.boundPointerUp);
    this.canvas.removeEventListener("touchmove", this.boundTouchMove);
  }

  private toLogical(clientX: number, clientY: number): Vec {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * LOGICAL_W;
    const y = ((clientY - rect.top) / rect.height) * LOGICAL_H;
    return { x, y };
  }

  private onPointerDown(e: PointerEvent): void {
    // Mobile autoplay policy: the AudioContext may only start from a real
    // user gesture. This is the first guaranteed gesture in the combat loop.
    if (!this.audioUnlocked) {
      this.audioUnlocked = true;
      this.audio.unlock();
      if (!this.musicStarted && this.outcomeLocked === "none") {
        this.musicStarted = true;
        this.audio.startMusic();
      }
    }
    if (this.paused || this.outcomeLocked !== "none") return;
    this.pointerId = e.pointerId;
    this.pointerActive = true;
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    this.movePlayerTo(this.toLogical(e.clientX, e.clientY));
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.pointerActive || e.pointerId !== this.pointerId) return;
    if (this.paused || this.outcomeLocked !== "none") return;
    this.movePlayerTo(this.toLogical(e.clientX, e.clientY));
  }

  private onPointerUp(e: PointerEvent): void {
    if (e.pointerId !== this.pointerId) return;
    this.pointerActive = false;
    this.pointerId = null;
  }

  private movePlayerTo(pos: Vec): void {
    const targetY = pos.y - FINGER_OFFSET_Y;
    this.player.x = clamp(pos.x, this.player.w * 0.4, LOGICAL_W - this.player.w * 0.4);
    this.player.y = clamp(targetY, this.player.h * 0.5 + 40, LOGICAL_H - this.player.h * 0.45);
  }

  // Canvas sizing/DPR is owned by PixiRenderer (it observes the canvas and
  // resizes its WebGL buffer), so the engine no longer manages the backing
  // store directly.

  private loop = (ts: number): void => {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop);
    if (!this.ready) return;

    const rawDt = ts - this.lastTs;
    this.lastTs = ts;
    const dt = clamp(rawDt, 0, MAX_DT);

    if (!this.paused && this.outcomeLocked === "none") {
      this.update(dt);
    }
    // Single loop: simulation (above, only when running) then render (always,
    // so a paused frame shows the frozen scene). Pixi's own ticker is stopped.
    this.renderFrame();
    this.hudAcc += rawDt;
    if (this.hudAcc >= 100) {
      this.hudAcc = 0;
      this.emitHud(false);
    }
  };

  /** Sync the persistent render-state to current sim values and draw. */
  private renderFrame(): void {
    if (!this.renderer) return;
    const rs = this.renderState;
    rs.elapsedMs = this.elapsedMs;
    rs.bank = this.bank;
    rs.recoil = this.recoil;
    rs.damageFlashMs = this.damageFlashMs;
    rs.invulnMs = this.invulnMs;
    rs.shakeMs = this.shakeMs;
    rs.shakeMag = this.shakeMag;
    rs.firepower = this.firepower;
    rs.maxActive = this.maxFpRemaining > 0;
    rs.atMax = this.firepower >= FIREPOWER_MAX;
    rs.playerX = this.player.x;
    rs.playerY = this.player.y;
    rs.playerW = this.player.w;
    rs.playerH = this.player.h;
    rs.bgScroll = this.bgScroll;
    rs.streakScroll = this.streakScroll;
    // Array fields are re-pointed because the sim reassigns them via filter().
    rs.playerShots = this.playerShots;
    rs.hostileShots = this.hostileShots;
    rs.enemies = this.enemies;
    rs.pickups = this.pickups;
    rs.explosions = this.explosions;
    this.renderer.render(rs);
  }

  private update(dt: number): void {
    this.elapsedMs += dt;
    this.combatTimeMs += dt;
    this.bgScroll = (this.bgScroll + dt * 0.06) % LOGICAL_H;
    this.streakScroll = (this.streakScroll + dt * 0.26) % LOGICAL_H;

    if (this.maxFpRemaining > 0) {
      this.maxFpRemaining = Math.max(0, this.maxFpRemaining - dt);
    }

    this.updatePresentation(dt);
    this.updatePhaseFlow(dt);
    this.updatePlayerFire(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.updateExplosions(dt);
    this.resolveCollisions();
    // Animation time advances with (and only with) simulation time, so
    // pausing the game freezes every effect.
    this.vfx?.update(dt);
    this.checkVictory();
  }

  private updatePresentation(dt: number): void {
    // Banking toward horizontal movement, smoothed.
    const dx = this.player.x - this.prevPlayerX;
    this.prevPlayerX = this.player.x;
    const targetBank = clamp(dx * 0.045, -0.32, 0.32);
    const blend = Math.min(1, dt / 90);
    this.bank += (targetBank - this.bank) * blend;

    this.recoil = Math.max(0, this.recoil - dt / 90);
    this.damageFlashMs = Math.max(0, this.damageFlashMs - dt);
    this.invulnMs = Math.max(0, this.invulnMs - dt);
    this.shakeMs = Math.max(0, this.shakeMs - dt);
  }

  /**
   * Wave-phase state machine. A phase spawns its groups (staggered by their
   * own `delayMs`), and only once every one of its enemies has been
   * destroyed or has exited (formations always eventually leave the
   * playfield on their own timer, so this can never soft-lock) does the
   * engine run the announcement gap — 2s pause, 2s center-screen "WAVE
   * N/12" banner, 2s transition (~6s total) — before releasing the next
   * phase. The final phase skips the gap entirely; `checkVictory()` fires
   * as soon as it resolves.
   */
  private updatePhaseFlow(dt: number): void {
    if (this.phaseState === "spawning") {
      const sincePhaseStart = this.elapsedMs - this.phaseActiveSinceMs;
      while (this.phaseSpawnCursor < this.phaseSpawnQueue.length) {
        const next = this.phaseSpawnQueue[this.phaseSpawnCursor];
        if (next.delayMs > sincePhaseStart) break;
        this.phaseSpawnCursor += 1;
        this.enemies.push(this.makeEnemy(next.kind, next.formation, next.slot, next.slotCount));
      }
      const allSpawned = this.phaseSpawnCursor >= this.phaseSpawnQueue.length;
      const allResolved = this.enemies.length === 0;
      if (allSpawned && allResolved) {
        if (this.currentPhase >= WAVE_COUNT) return; // checkVictory() handles the finish
        this.phaseState = "gap-pause";
        this.phaseGapTimerMs = 0;
        this.announcement = null;
      }
      return;
    }

    this.phaseGapTimerMs += dt;
    if (this.phaseState === "gap-pause") {
      if (this.phaseGapTimerMs >= PHASE_GAP_PAUSE_MS) {
        this.phaseState = "gap-announce";
        this.phaseGapTimerMs = 0;
        const nextPhase = this.currentPhase + 1;
        this.announcement = { title: "WARNING", subtitle: `WAVE ${nextPhase}/${WAVE_COUNT}` };
        this.audio.waveStart();
      }
      return;
    }
    if (this.phaseState === "gap-announce") {
      if (this.phaseGapTimerMs >= PHASE_GAP_ANNOUNCE_MS) {
        this.phaseState = "gap-transition";
        this.phaseGapTimerMs = 0;
        this.announcement = null;
      }
      return;
    }
    // gap-transition
    if (this.phaseGapTimerMs >= PHASE_GAP_TRANSITION_MS) {
      this.currentPhase += 1;
      this.phaseSpawnQueue = getSpawnsForPhase(this.currentPhase);
      this.phaseSpawnCursor = 0;
      this.phaseActiveSinceMs = this.elapsedMs;
      this.phaseState = "spawning";
    }
  }

  private updatePlayerFire(dt: number): void {
    const cfg = getFirepowerConfig(this.firepower);
    const maxActive = this.maxFpRemaining > 0;
    const rateMul = maxActive ? 1 + MAX_FIREPOWER.fireRateBonus : 1;
    const dmgMul = maxActive ? 1 + MAX_FIREPOWER.damageBonus : 1;
    const glowBoost = maxActive ? 0.25 : 0;
    this.fireCd -= dt;
    this.heavyCd -= dt;

    if (this.fireCd <= 0) {
      this.fireCd = cfg.intervalMs / rateMul;
      this.fireVolley(cfg.lanes, cfg.projectileSpeed, dmgMul, glowBoost);
      // No muzzle-flash sprite spawn — firing feel now comes entirely from
      // clean projectile timing/spacing/trails plus recoil (mobile playtest
      // correction: the old muzzle splash read as noisy/fake).
      this.recoil = 1;
      this.volleyIndex += 1;
      this.audio.playerShot(this.firepower >= 5);
    }

    if (cfg.heavyBurstMs && cfg.heavyBurstLanes && this.heavyCd <= 0) {
      this.heavyCd = cfg.heavyBurstMs;
      this.fireVolley(cfg.heavyBurstLanes, cfg.projectileSpeed * 1.05, dmgMul * 1.1, glowBoost + 0.2);
      this.recoil = 1.4;
      this.audio.playerShot(true);
    }

    // Release lane shots whose stagger delay elapsed.
    if (this.pendingShots.length > 0) {
      const due = this.pendingShots.filter((p) => p.fireAtMs <= this.elapsedMs);
      if (due.length > 0) {
        this.pendingShots = this.pendingShots.filter((p) => p.fireAtMs > this.elapsedMs);
        for (const p of due) this.emitLaneShot(p.lane, p.speed, p.dmgMul, p.glowBoost);
      }
    }
  }

  private fireVolley(lanes: readonly FireLane[], speed: number, dmgMul: number, glowBoost: number): void {
    for (const lane of lanes) {
      if (lane.every != null && lane.phase != null) {
        if (this.volleyIndex % lane.every !== lane.phase) continue;
      }
      if (lane.staggerMs > 0) {
        if (this.pendingShots.length < MAX_PENDING_SHOTS) {
          this.pendingShots.push({
            fireAtMs: this.elapsedMs + lane.staggerMs,
            lane,
            speed,
            dmgMul,
            glowBoost,
          });
        }
        continue;
      }
      this.emitLaneShot(lane, speed, dmgMul, glowBoost);
    }
  }

  private emitLaneShot(lane: FireLane, speed: number, dmgMul: number, glowBoost: number): void {
    if (this.playerShots.length >= MAX_PLAYER_SHOTS) return;
    const angle = (lane.angleDeg * Math.PI) / 180;
    this.playerShots.push({
      x: this.player.x + lane.xOffset,
      y: this.player.y - this.player.h * 0.35,
      vx: Math.sin(angle) * speed,
      vy: -Math.cos(angle) * speed,
      damage: this.baseDamage * lane.damageMul * dmgMul,
      radius: 4 * lane.scale,
      scale: lane.scale,
      glow: Math.min(1, lane.glow + glowBoost),
      kind: lane.kind,
      hostile: false,
      rotation: angle,
      alive: true,
    });
  }

  private updateEnemies(dt: number): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;

      if (enemy.dying) {
        enemy.dyingMs += dt;
        if (
          enemy.kind === "powerCarrier" &&
          !enemy.dropped &&
          enemy.dyingMs >= CARRIER_DROP_DELAY_MS
        ) {
          enemy.dropped = true;
          this.spawnFireUp(enemy.x, enemy.y);
        }
        if (enemy.dyingMs >= ENEMY_DEATH_REMOVE_MS) enemy.alive = false;
        continue;
      }

      enemy.entryMs += dt;
      enemy.flashMs = Math.max(0, enemy.flashMs - dt);
      enemy.recoilMs = Math.max(0, enemy.recoilMs - dt);

      // Formation choreography drives position directly (enter → form/hold →
      // attack/dive → exit) instead of simple downward velocity.
      const tMs = this.elapsedMs - enemy.formationSpawnedAtMs;
      const pose = computeFormationPose(enemy.formation, enemy.slot, enemy.slotCount, tMs);
      enemy.x = pose.xNorm * LOGICAL_W;
      enemy.y = pose.yNorm * LOGICAL_H;
      enemy.formationPhase = pose.phase;
      enemy.canFire = pose.canFire;
      enemy.vx = pose.bank * 40; // presentation-only bank hint, no longer drives real movement

      const def = ENEMY_DEFS[enemy.kind];
      if (
        enemy.canFire &&
        def.shootIntervalMs &&
        def.shotSpeed &&
        def.shotDamage
      ) {
        enemy.shootCd -= dt;
        if (enemy.shootCd <= 0 && this.hostileShots.length < MAX_HOSTILE_SHOTS) {
          enemy.shootCd = def.shootIntervalMs;
          this.fireEnemyShot(enemy, def.shotSpeed, def.shotDamage);
        }
      }

      // General offscreen resolution — formations may exit downward, upward,
      // or sideways depending on type, so bound on every axis.
      if (
        enemy.y > LOGICAL_H + enemy.h ||
        enemy.x < -enemy.w * 2 ||
        enemy.x > LOGICAL_W + enemy.w * 2
      ) {
        enemy.alive = false;
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);
  }

  private fireEnemyShot(enemy: Enemy, shotSpeed: number, shotDamage: number): void {
    const emitterX = enemy.x;
    const emitterY = enemy.y + enemy.h * 0.3;
    enemy.shotIndex += 1;
    enemy.recoilMs = 130;

    // Alternate straight small bullets and aimed bullets so both premium
    // hostile bullet assets stay in play and shots remain readable.
    const aimed = enemy.shotIndex % 2 === 0;
    let vx = 0;
    let vy = shotSpeed;
    if (aimed) {
      const dx = this.player.x - emitterX;
      const dy = this.player.y - emitterY;
      const len = Math.max(1, Math.hypot(dx, dy));
      const speed = shotSpeed * 1.08;
      vx = (dx / len) * speed;
      vy = Math.max(speed * 0.35, (dy / len) * speed);
    }
    this.hostileShots.push({
      x: emitterX,
      y: emitterY,
      vx,
      vy,
      damage: shotDamage,
      radius: 5,
      scale: 1,
      glow: 0.4,
      kind: "primary",
      hostile: true,
      hostileKind: aimed ? "aimed" : "small",
      rotation: Math.atan2(vx, vy),
      alive: true,
    });
    // Muzzle flash exactly at the hostile emitter, synced with the shot.
    this.vfx?.spawn(ANIM.enemyMuzzle, { x: emitterX, y: emitterY, scale: 0.16, opacity: 0.9 }, "world");
    this.audio.enemyShot();
  }

  private updateProjectiles(dt: number): void {
    const sec = dt / 1000;
    for (const shot of this.playerShots) {
      if (!shot.alive) continue;
      shot.x += shot.vx * sec;
      shot.y += shot.vy * sec;
      if (shot.y < -40 || shot.y > LOGICAL_H + 40 || shot.x < -40 || shot.x > LOGICAL_W + 40) {
        shot.alive = false;
      }
    }
    for (const shot of this.hostileShots) {
      if (!shot.alive) continue;
      shot.x += shot.vx * sec;
      shot.y += shot.vy * sec;
      if (shot.y < -40 || shot.y > LOGICAL_H + 40 || shot.x < -60 || shot.x > LOGICAL_W + 60) {
        shot.alive = false;
      }
    }
    this.playerShots = this.playerShots.filter((s) => s.alive);
    this.hostileShots = this.hostileShots.filter((s) => s.alive);
  }

  private updatePickups(dt: number): void {
    const sec = dt / 1000;
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue;
      pickup.phase += dt / 1000;
      pickup.y += pickup.vy * sec;
      if (pickup.y > LOGICAL_H + 40) pickup.alive = false;
    }
    this.pickups = this.pickups.filter((p) => p.alive);
  }

  private resolveCollisions(): void {
    // Player shots → enemies (dying enemies are no longer targets)
    for (const shot of this.playerShots) {
      if (!shot.alive) continue;
      for (const enemy of this.enemies) {
        if (!enemy.alive || enemy.dying) continue;
        if (!circleHit(shot.x, shot.y, shot.radius, enemy.x, enemy.y, enemy.radius)) continue;
        shot.alive = false;
        enemy.hull -= shot.damage;
        enemy.flashMs = 90;
        // Frequent compact impact ring at the actual collision point.
        this.vfx?.spawn(ANIM.impactRing, { x: shot.x, y: shot.y - 4, scale: 0.16, opacity: 0.85 }, "world");
        // Heavier hits additionally get the enemy hit spark.
        const heavyHit = shot.kind === "heavy" || shot.damage >= this.baseDamage * 1.3;
        if (heavyHit) {
          this.vfx?.spawn(ANIM.enemyHitSpark, { x: shot.x, y: shot.y - 4, scale: 0.24, opacity: 0.95 }, "world");
        }
        this.audio.impact(heavyHit);
        if (enemy.hull <= 0) {
          this.killEnemy(enemy);
        }
        break;
      }
    }

    // Hostile shots → player
    for (const shot of this.hostileShots) {
      if (!shot.alive) continue;
      if (!circleHit(shot.x, shot.y, shot.radius, this.player.x, this.player.y, this.player.radius)) continue;
      shot.alive = false;
      if (this.invulnMs > 0) continue; // blocked — no damage feedback
      this.applyPlayerDamage(shot.damage, { x: shot.x, y: shot.y });
      if (this.outcomeLocked !== "none") return;
    }

    // Enemy body → player
    for (const enemy of this.enemies) {
      if (!enemy.alive || enemy.dying) continue;
      if (!circleHit(enemy.x, enemy.y, enemy.radius, this.player.x, this.player.y, this.player.radius)) continue;
      const def = ENEMY_DEFS[enemy.kind];
      const contactPoint = {
        x: (enemy.x + this.player.x) / 2,
        y: (enemy.y + this.player.y) / 2,
      };
      // The rammer dies with a real destruction sequence either way.
      this.killEnemy(enemy, false);
      if (this.invulnMs > 0) continue;
      this.applyPlayerDamage(def.contactDamage, contactPoint);
      if (this.outcomeLocked !== "none") return;
    }

    // Player → Fire-Up
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue;
      if (!circleHit(pickup.x, pickup.y, pickup.radius, this.player.x, this.player.y, this.player.radius + 6)) continue;
      pickup.alive = false; // removed from collision processing immediately
      this.collectFireUp();
      this.audio.pickupCollect();
      // Collect burst at the player position, synced with the HUD segment.
      this.vfx?.spawn(
        ANIM.pickupBurst,
        {
          follow: () => ({ x: this.player.x, y: this.player.y }),
          scale: 0.3,
          opacity: 0.95,
        },
        "top",
      );
    }
  }

  private killEnemy(enemy: Enemy, scored = true): void {
    if (!enemy.alive || enemy.dying) return;
    // Enter the destruction sequence — the sprite fades under the explosion
    // and the entity is removed only after the sequence resolves.
    enemy.dying = true;
    enemy.dyingMs = 0;
    if (scored) {
      this.enemiesDestroyed += 1;
      this.score += ENEMY_DEFS[enemy.kind].scoreValue;
    } else {
      // Contact deaths keep the pre-existing rules: no score, no destroy
      // credit, and no Fire-Up drop — only the destruction presentation.
      enemy.dropped = true;
    }
    const tier = enemy.kind === "basic" ? "small" : enemy.kind === "powerCarrier" ? "large" : "medium";
    this.audio.explosion(tier === "small" ? "small" : "medium");
    this.spawnExplosion(enemy.x, enemy.y, tier);
  }

  /**
   * Procedural destruction burst — replaces the old spritesheet explosion
   * VFX (mobile playtest correction: the sprite-based bursts read as fake).
   * A hot flash, an expanding shockwave ring, and flying debris streaks,
   * scaled by enemy tier so Power Carriers feel like a real kill and basic
   * fighters stay light.
   */
  private spawnExplosion(x: number, y: number, tier: "small" | "medium" | "large"): void {
    const scale = tier === "small" ? 0.7 : tier === "medium" ? 1 : 1.5;
    const durationMs = tier === "small" ? 380 : tier === "medium" ? 480 : 620;
    const debrisCount = tier === "small" ? 6 : tier === "medium" ? 9 : 13;
    const color = tier === "large" ? 0xff963c : tier === "medium" ? 0xffaa46 : 0xffc86e;
    const debris: Debris[] = Array.from({ length: debrisCount }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 0,
      speed: (0.4 + Math.random() * 0.6) * (18 + scale * 10),
      len: 3 + Math.random() * 5 * scale,
    }));
    if (this.explosions.length >= MAX_EXPLOSIONS) this.explosions.shift();
    this.explosions.push({ x, y, ageMs: 0, durationMs, scale, color, debris });
  }

  private updateExplosions(dt: number): void {
    if (this.explosions.length === 0) return;
    for (const ex of this.explosions) {
      ex.ageMs += dt;
      for (const d of ex.debris) d.dist += d.speed * (dt / 1000);
    }
    this.explosions = this.explosions.filter((ex) => ex.ageMs < ex.durationMs);
  }

  private spawnFireUp(x: number, y: number): void {
    if (this.pickups.length >= MAX_PICKUPS) return;
    this.pickups.push({
      x: clamp(x, 24, LOGICAL_W - 24),
      y,
      vy: 90,
      radius: 16,
      phase: Math.random() * Math.PI * 2,
      alive: true,
    });
  }

  private collectFireUp(): void {
    if (this.firepower < FIREPOWER_MAX) {
      this.firepower += 1;
      if (this.firepower === FIREPOWER_MAX && !this.maxFpBurstPlayed) {
        this.maxFpBurstPlayed = true;
        this.audio.maxFirepowerActivate();
        // One-shot activation burst; the looping aura takes over afterwards.
        this.vfx?.spawn(
          ANIM.maxFpBurst,
          {
            follow: () => ({ x: this.player.x, y: this.player.y }),
            scale: 0.42,
            opacity: 1,
            boost: 0.2,
          },
          "top",
        );
      }
      return;
    }
    // Already at 10 — Max Firepower
    if (this.maxFpRemaining <= 0) {
      this.maxFpRemaining = MAX_FIREPOWER.durationMs;
    } else {
      this.maxFpRemaining = Math.min(MAX_FIREPOWER.refreshCapMs, this.maxFpRemaining + MAX_FIREPOWER.durationMs);
    }
  }

  private applyPlayerDamage(raw: number, at?: Vec): void {
    if (this.outcomeLocked !== "none") return;
    const mitigated = Math.max(1, Math.round(raw * (100 / (100 + this.defense))));
    const applied = Math.min(this.hull, mitigated);
    if (applied <= 0) return;
    this.damageTaken += applied;
    this.hull = Math.max(0, this.hull - applied);

    // Damage feedback fires only when hull was actually removed. Presentation
    // is now a brief red tint flash directly on the ship sprite (see
    // drawPlayer) instead of a separate ring/spark VFX (mobile playtest
    // correction: the old effect read as ugly/disconnected circles).
    this.damageFlashMs = 260;
    this.invulnMs = INVULN_MS;
    this.shakeMs = 220;
    this.shakeMag = 5;
    this.audio.playerDamage();
    if (!this.lowHullWarned && this.hull > 0 && this.hull / this.hullMax <= 0.25) {
      this.lowHullWarned = true;
      this.audio.warning();
    }
    void at; // collision point no longer used for a spawned VFX

    if (this.hull <= 0) {
      this.lockOutcome("defeat");
    }
  }

  private checkVictory(): void {
    if (this.outcomeLocked !== "none") return;
    if (this.currentPhase < WAVE_COUNT) return;
    if (this.phaseSpawnCursor < this.phaseSpawnQueue.length) return;
    if (this.enemies.some((e) => e.alive)) return;
    this.lockOutcome("victory");
  }

  private lockOutcome(outcome: "victory" | "defeat"): void {
    if (this.outcomeLocked !== "none") return;
    this.outcomeLocked = outcome;
    this.paused = true;
    if (outcome === "victory") this.audio.victory();
    else this.audio.defeat();
    const performance = this.buildPerformance();
    this.emitHud(true);
    this.opts.onOutcome?.(outcome, performance);
  }

  private buildPerformance(): BattlePerformance {
    const remainingHp = Math.max(0, this.hull);
    const remainingHpPercent =
      this.hullMax > 0 ? Math.round((remainingHp / this.hullMax) * 1000) / 10 : 0;
    return {
      score: this.score,
      enemiesDestroyed: this.enemiesDestroyed,
      bossesDestroyed: 0,
      remainingHp,
      remainingHpPercent,
      completionTimeMs: Math.round(this.combatTimeMs),
      damageTaken: this.damageTaken,
      noDamage: this.damageTaken === 0,
    };
  }

  private emitHud(force: boolean): void {
    if (!force && this.destroyed) return;
    this.opts.onHud?.(this.getSnapshot());
  }

}
