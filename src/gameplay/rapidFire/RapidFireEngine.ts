import type { BattlePerformance } from "@/systems/battleSession";
import { RAPID_FIRE_SLICE_ASSETS } from "@/data/gameplayRapidFire";
import { ENEMY_DEFS, type EnemyKind } from "./enemyConfig";
import {
  FIREPOWER_MAX,
  getFirepowerConfig,
  MAX_FIREPOWER,
  type BoltKind,
  type FireLane,
} from "./firepowerConfig";
import { WAVE_COUNT, getOrderedSpawns, getWaveIndexAt } from "./waveTable";
import { computeFormationPose, type FormationPhase, type FormationType } from "./formationConfig";
import { ANIM } from "./animationDefs";
import { VfxSystem, type SpriteAnimationInstance } from "./spriteAnimation";
import { RapidFireAudioSystem, type AudioPrefs } from "./audioSystem";

export interface EngineHudSnapshot {
  hull: number;
  hullMax: number;
  firepower: number;
  maxFirepowerActive: boolean;
  maxFirepowerRemainingMs: number;
  waveIndex: number;
  waveTotal: number;
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

interface Vec {
  x: number;
  y: number;
}

interface PlayerState {
  x: number;
  y: number;
  radius: number;
  w: number;
  h: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  scale: number;
  glow: number;
  kind: BoltKind;
  hostile: boolean;
  /** Hostile art variant. */
  hostileKind?: "small" | "aimed";
  rotation: number;
  alive: boolean;
}

interface PendingLaneShot {
  fireAtMs: number;
  lane: FireLane;
  speed: number;
  dmgMul: number;
  glowBoost: number;
}

interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hull: number;
  radius: number;
  w: number;
  h: number;
  shootCd: number;
  shotIndex: number;
  /** Presentation state. */
  swayPhase: number;
  entryMs: number;
  flashMs: number;
  recoilMs: number;
  dying: boolean;
  dyingMs: number;
  alive: boolean;
  dropped: boolean;
  /** Formation choreography (every enemy belongs to a formation group). */
  formation: FormationType;
  slot: number;
  slotCount: number;
  formationSpawnedAtMs: number;
  formationPhase: FormationPhase;
  canFire: boolean;
}

interface Pickup {
  x: number;
  y: number;
  vy: number;
  radius: number;
  phase: number;
  alive: boolean;
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
  private ctx: CanvasRenderingContext2D;
  private opts: RapidFireEngineOptions;
  private images: Record<string, HTMLImageElement> = {};
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

  private spawnQueue = getOrderedSpawns();
  private spawnCursor = 0;
  private nextEnemyId = 1;
  private score = 0;
  private enemiesDestroyed = 0;
  private damageTaken = 0;
  private bgScroll = 0;
  private streakScroll = 0;

  // Presentation state (never persisted; cleared with the engine instance).
  private vfx: VfxSystem | null = null;
  private thruster: SpriteAnimationInstance | null = null;
  private bank = 0;
  private prevPlayerX = LOGICAL_W / 2;
  private recoil = 0;
  private playerFlashMs = 0;
  private invulnMs = 0;
  private shakeMs = 0;
  private shakeMag = 0;

  // Audio (never persisted; a dedicated localStorage key holds volume prefs
  // only — schema v12 / the versioned save are never touched).
  private audio: RapidFireAudioSystem;
  private audioUnlocked = false;
  private lastWaveIndexForAudio = 0;
  private lowHullWarned = false;
  private musicStarted = false;

  // Parallax background (three layers: far source art, procedural middle
  // starfield, near speed streaks). Star positions are generated once so the
  // middle layer never re-randomizes mid-frame.
  private midStars: { x: number; y: number; r: number; speedMul: number; a: number }[] = [];

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
    const ctx = opts.canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    this.ctx = ctx;
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
  }

  async start(): Promise<void> {
    const assets = RAPID_FIRE_SLICE_ASSETS;
    const entries = await Promise.all(
      Object.entries(assets).map(async ([key, src]) => [key, await loadImage(src)] as const),
    );
    this.images = Object.fromEntries(entries);
    this.vfx = new VfxSystem(this.images, 48);
    // Persistent looping thruster attached to the ship tail; banks with it.
    this.thruster = this.vfx.spawn(
      ANIM.thruster,
      {
        follow: () => ({
          x: this.player.x + Math.sin(this.bank) * this.player.h * 0.3,
          y: this.player.y + this.player.h * 0.34,
          rotation: this.bank,
        }),
        scale: 0.3,
        opacity: 0.95,
        boost: 0.1,
      },
      "world",
    );
    this.ready = true;
    this.resize();
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
    this.thruster = null;
    this.pendingShots = [];
    this.audio.destroy();
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
      waveIndex: getWaveIndexAt(this.elapsedMs),
      waveTotal: WAVE_COUNT,
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
    this.spawnCursor = this.spawnQueue.length;
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

  private resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = this.canvas.clientWidth || LOGICAL_W;
    const cssH = this.canvas.clientHeight || Math.round((cssW * LOGICAL_H) / LOGICAL_W);
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

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
    this.draw();
    this.hudAcc += rawDt;
    if (this.hudAcc >= 100) {
      this.hudAcc = 0;
      this.emitHud(false);
    }
  };

  private update(dt: number): void {
    this.elapsedMs += dt;
    this.combatTimeMs += dt;
    this.bgScroll = (this.bgScroll + dt * 0.035) % LOGICAL_H;
    this.streakScroll = (this.streakScroll + dt * 0.22) % LOGICAL_H;

    if (this.maxFpRemaining > 0) {
      this.maxFpRemaining = Math.max(0, this.maxFpRemaining - dt);
    }

    const waveNow = getWaveIndexAt(this.elapsedMs);
    if (waveNow !== this.lastWaveIndexForAudio) {
      this.lastWaveIndexForAudio = waveNow;
      this.audio.waveStart();
    }

    this.updatePresentation(dt);
    this.spawnEnemies();
    this.updatePlayerFire(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
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
    this.playerFlashMs = Math.max(0, this.playerFlashMs - dt);
    this.invulnMs = Math.max(0, this.invulnMs - dt);
    this.shakeMs = Math.max(0, this.shakeMs - dt);

    if (this.thruster) {
      const maxActive = this.maxFpRemaining > 0;
      this.thruster.boost = maxActive ? 0.55 : 0.1;
      this.thruster.opacity = maxActive ? 1 : 0.95;
    }
  }

  private spawnEnemies(): void {
    while (this.spawnCursor < this.spawnQueue.length) {
      const next = this.spawnQueue[this.spawnCursor];
      if (next.atMs > this.elapsedMs) break;
      this.spawnCursor += 1;
      this.enemies.push(this.makeEnemy(next.kind, next.formation, next.slot, next.slotCount));
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
      this.spawnMuzzleFlash(cfg.muzzle, cfg.glowIntensity + glowBoost);
      this.recoil = 1;
      this.volleyIndex += 1;
      this.audio.playerShot(this.firepower >= 5);
    }

    if (cfg.heavyBurstMs && cfg.heavyBurstLanes && this.heavyCd <= 0) {
      this.heavyCd = cfg.heavyBurstMs;
      this.fireVolley(cfg.heavyBurstLanes, cfg.projectileSpeed * 1.05, dmgMul * 1.1, glowBoost + 0.2);
      this.spawnMuzzleFlash("wide", 1);
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

  private spawnMuzzleFlash(kind: "small" | "wide", intensity: number): void {
    if (!this.vfx) return;
    const noseY = -this.player.h * 0.42;
    if (kind === "small") {
      // One compact flash per side emitter pair at low Firepower.
      const offsets = this.firepower <= 0 ? [-8, 8] : [-13, 0, 13];
      for (const ox of offsets) {
        this.vfx.spawn(
          ANIM.muzzleSmall,
          {
            follow: () => ({ x: this.player.x + ox, y: this.player.y + noseY, rotation: this.bank }),
            scale: 0.18,
            opacity: Math.min(1, 0.7 + intensity * 0.3),
          },
          "top",
        );
      }
      return;
    }
    // Wide premium flash — one instance spanning the emitter row. Kept at a
    // fixed readable scale (never stretched full-width) and clamped so the
    // whole flash stays on-screen without clipping.
    const scale = 0.22;
    const halfW = (ANIM.muzzleWide.frameWidth * scale) / 2;
    this.vfx.spawn(
      ANIM.muzzleWide,
      {
        follow: () => ({
          x: clamp(this.player.x, halfW, LOGICAL_W - halfW),
          y: this.player.y + noseY,
          rotation: this.bank * 0.5,
        }),
        scale,
        opacity: Math.min(1, 0.65 + intensity * 0.35),
        boost: intensity > 0.7 ? 0.35 : 0,
      },
      "top",
    );
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
    if (enemy.kind === "basic") {
      this.audio.explosion("small");
    } else {
      this.audio.explosion("medium");
    }
    if (!this.vfx) return;
    if (enemy.kind === "basic") {
      this.vfx.spawn(ANIM.explosionSmall, { x: enemy.x, y: enemy.y, scale: 0.34, opacity: 1 }, "world");
    } else {
      // Shooter / Power Carrier — medium explosion with shockwave + debris.
      this.vfx.spawn(ANIM.explosionMedium, { x: enemy.x, y: enemy.y, scale: 0.34, opacity: 1, boost: 0.15 }, "world");
    }
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

    // Damage feedback fires only when hull was actually removed.
    this.playerFlashMs = 140;
    this.invulnMs = INVULN_MS;
    this.shakeMs = 220;
    this.shakeMag = 5;
    this.audio.playerDamage();
    if (!this.lowHullWarned && this.hull > 0 && this.hull / this.hullMax <= 0.25) {
      this.lowHullWarned = true;
      this.audio.warning();
    }
    this.vfx?.spawn(
      ANIM.playerDamageRing,
      {
        follow: () => ({ x: this.player.x, y: this.player.y }),
        scale: 0.3,
        opacity: 0.95,
      },
      "top",
    );
    if (at) {
      this.vfx?.spawn(ANIM.hitSparkSmall, { x: at.x, y: at.y, scale: 0.14, opacity: 0.9 }, "top");
    }

    if (this.hull <= 0) {
      this.lockOutcome("defeat");
    }
  }

  private checkVictory(): void {
    if (this.outcomeLocked !== "none") return;
    const allSpawned = this.spawnCursor >= this.spawnQueue.length;
    if (!allSpawned) return;
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

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  private draw(): void {
    const ctx = this.ctx;
    const cssW = this.canvas.clientWidth || LOGICAL_W;
    const cssH = this.canvas.clientHeight || Math.round((cssW * LOGICAL_H) / LOGICAL_W);
    const scaleX = cssW / LOGICAL_W;
    const scaleY = cssH / LOGICAL_H;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const dpr = this.canvas.width / cssW;
    ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);

    // Screen shake (presentation only).
    if (this.shakeMs > 0) {
      const k = this.shakeMs / 220;
      const ox = (Math.random() * 2 - 1) * this.shakeMag * k;
      const oy = (Math.random() * 2 - 1) * this.shakeMag * k;
      ctx.translate(ox, oy);
    }

    this.drawBackground(ctx);
    this.drawPickups(ctx);
    this.drawEnemies(ctx);
    this.drawHostileShots(ctx);
    this.drawPlayerShots(ctx);
    this.vfx?.draw(ctx, "world");
    this.drawPlayer(ctx);
    this.vfx?.draw(ctx, "top");
  }

  /**
   * Three-layer parallax background:
   *  1. Far — the source chapter art, seamlessly scrolled/wrapped vertically
   *     (two stacked copies offset by one viewport height) instead of drawn
   *     statically.
   *  2. Middle — a procedural drifting starfield (no extra art required),
   *     moving faster than the far layer for real depth.
   *  3. Near — the existing speed-streak instances, fastest and sparsest.
   * All three freeze together whenever gameplay pauses because bgScroll /
   * streakScroll only advance inside `update()`.
   */
  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const bg = this.images.background;
    if (bg) {
      const imgAspect = bg.width / bg.height;
      const viewAspect = LOGICAL_W / LOGICAL_H;
      let sx = 0;
      let sy = 0;
      let sw = bg.width;
      let sh = bg.height;
      if (imgAspect > viewAspect) {
        sw = bg.height * viewAspect;
        sx = (bg.width - sw) / 2;
      } else {
        sh = bg.width / viewAspect;
        sy = (bg.height - sh) * 0.35;
      }
      // Seamless vertical wrap: draw the crop twice, offset by one viewport
      // height and by the current scroll position, so there is never a gap.
      const offset = this.bgScroll % LOGICAL_H;
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bg, sx, sy, sw, sh, 0, offset - LOGICAL_H, LOGICAL_W, LOGICAL_H);
      ctx.drawImage(bg, sx, sy, sw, sh, 0, offset, LOGICAL_W, LOGICAL_H);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#070816";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }
    ctx.fillStyle = "rgba(4,6,18,0.35)";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Middle layer — procedural drifting starfield, wraps seamlessly per star.
    ctx.save();
    for (const star of this.midStars) {
      const y = ((star.y + this.bgScroll * star.speedMul) % (LOGICAL_H + 6)) - 3;
      ctx.globalAlpha = star.a;
      ctx.fillStyle = "#bcd8ff";
      ctx.beginPath();
      ctx.arc(star.x, y, star.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Near layer — subtle scrolling speed streaks for a sense of forward
    // motion, a few slender instances, never a full-width stretch of art.
    const streak = this.images.backgroundSpeedStreak;
    if (streak) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const sw = 26;
      const sh = 180;
      const cols = [0.14, 0.42, 0.66, 0.9];
      for (let i = 0; i < cols.length; i += 1) {
        const x = cols[i] * LOGICAL_W - sw / 2;
        const speedMul = 0.7 + (i % 3) * 0.35;
        const y = ((this.streakScroll * speedMul + i * 240) % (LOGICAL_H + sh)) - sh;
        ctx.globalAlpha = 0.1 + (i % 2) * 0.05;
        ctx.drawImage(streak, x, y, sw, sh);
      }
      ctx.restore();
    }
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const img = this.images.shipSprite;
    const { x, w, h } = this.player;
    // Subtle idle hover + firing recoil (presentation offsets only —
    // collision uses the true player position).
    const hover = Math.sin(this.elapsedMs / 480) * 2.2;
    const recoilY = this.recoil * 3.2;
    const y = this.player.y + hover + recoilY;
    const maxActive = this.maxFpRemaining > 0;
    const atMax = this.firepower >= FIREPOWER_MAX;

    // Invulnerability flicker.
    if (this.invulnMs > 0 && Math.floor(this.invulnMs / 70) % 2 === 0) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(this.bank);

    // Under-ship glow.
    const glowR = w * 0.62;
    const grad = ctx.createRadialGradient(0, h * 0.1, 4, 0, h * 0.1, glowR);
    const glowA = maxActive ? 0.5 : 0.28;
    grad.addColorStop(0, `rgba(90, 205, 255, ${glowA})`);
    grad.addColorStop(1, "rgba(90, 205, 255, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, h * 0.1, glowR, 0, Math.PI * 2);
    ctx.fill();

    // MAX FIREPOWER aura — subtle loop at FP10, intensified while the
    // Max Firepower buff timer is running.
    const aura = this.images.maxAura;
    if (aura && atMax) {
      const pulse = 0.82 + 0.12 * Math.sin(this.elapsedMs / 160);
      const size = h * 2.1 * pulse;
      ctx.save();
      ctx.rotate(this.elapsedMs / 900);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = maxActive ? 0.85 : 0.35;
      ctx.drawImage(aura, -size / 2, -size / 2, size, size);
      ctx.restore();
    }

    // Ship (500×500 square source — draw square to preserve aspect).
    const side = h;
    if (img) {
      ctx.drawImage(img, -side / 2, -side / 2, side, side);
      // Brief white damage flash — brighten with an additive re-draw.
      if (this.playerFlashMs > 0) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.min(1, this.playerFlashMs / 140) * 0.9;
        ctx.drawImage(img, -side / 2, -side / 2, side, side);
      }
    } else {
      ctx.fillStyle = "#7ef";
      ctx.fillRect(-w / 2, -h / 2, w, h);
    }
    ctx.restore();
  }

  private drawPlayerShots(ctx: CanvasRenderingContext2D): void {
    const primary = this.images.primaryBolt;
    const heavy = this.images.heavyBolt;
    const trail = this.images.projectileTrail;
    for (const shot of this.playerShots) {
      if (!shot.alive) continue;
      const img = shot.kind === "heavy" ? heavy : primary;
      const side = (shot.kind === "heavy" ? 42 : 26) * shot.scale;
      ctx.save();
      ctx.translate(shot.x, shot.y);
      if (shot.rotation !== 0) ctx.rotate(shot.rotation);
      // Trail behind the bolt (additive, glow-scaled).
      if (trail) {
        const tw = side * 0.6;
        const th = side * 1.5;
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.3 + shot.glow * 0.4;
        ctx.drawImage(trail, -tw / 2, side * 0.18, tw, th);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }
      if (img) {
        ctx.drawImage(img, -side / 2, -side / 2, side, side);
        if (shot.glow > 0.45) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = (shot.glow - 0.45) * 0.9;
          ctx.drawImage(img, -side / 2, -side / 2, side, side);
        }
      } else {
        ctx.fillStyle = "#6ef";
        ctx.fillRect(-2, -10, 4, 16);
      }
      ctx.restore();
    }
  }

  private drawHostileShots(ctx: CanvasRenderingContext2D): void {
    const small = this.images.enemyBulletSmall;
    const aimed = this.images.enemyBulletAimed;
    for (const shot of this.hostileShots) {
      if (!shot.alive) continue;
      const img = shot.hostileKind === "aimed" ? aimed : small;
      const side = shot.hostileKind === "aimed" ? 22 : 18;
      if (img) {
        ctx.save();
        ctx.translate(shot.x, shot.y);
        // Sprite art points downward; rotate aimed shots along velocity.
        if (shot.hostileKind === "aimed") ctx.rotate(-shot.rotation);
        ctx.drawImage(img, -side / 2, -side / 2, side, side);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.fillStyle = "#ff8a3a";
        ctx.arc(shot.x, shot.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (enemy.dying && enemy.dyingMs >= ENEMY_DEATH_SPRITE_MS) continue;
      const key =
        enemy.kind === "basic"
          ? "enemyBasic"
          : enemy.kind === "shooter"
            ? "enemyShooter"
            : "enemyPowerCarrier";
      const img = this.images[key];
      // Subtle sway + banking (visual only; collision stays at enemy.x/y).
      const sway = Math.sin(this.elapsedMs / 620 + enemy.swayPhase) * 3;
      const bank = clamp(enemy.vx * 0.006, -0.22, 0.22) + Math.sin(this.elapsedMs / 900 + enemy.swayPhase) * 0.05;
      const recoil = enemy.recoilMs > 0 ? -(enemy.recoilMs / 130) * 3 : 0;
      const side = enemy.h; // 500×500 square sources — keep aspect
      ctx.save();
      ctx.translate(enemy.x + sway, enemy.y + recoil);
      ctx.rotate(bank);
      if (enemy.dying) {
        ctx.globalAlpha = Math.max(0, 1 - enemy.dyingMs / ENEMY_DEATH_SPRITE_MS);
      }
      if (img) {
        ctx.drawImage(img, -side / 2, -side / 2, side, side);
        // Short white/orange damage flash via additive re-draw.
        if (enemy.flashMs > 0) {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = Math.min(1, enemy.flashMs / 90) * 0.85 * (enemy.dying ? Math.max(0, 1 - enemy.dyingMs / ENEMY_DEATH_SPRITE_MS) : 1);
          ctx.drawImage(img, -side / 2, -side / 2, side, side);
        }
      } else {
        ctx.fillStyle = "#f55";
        ctx.fillRect(-enemy.w / 2, -enemy.h / 2, enemy.w, enemy.h);
      }
      ctx.restore();
    }
  }

  private drawPickups(ctx: CanvasRenderingContext2D): void {
    const img = this.images.fireUpPickup;
    const glow = this.images.pickupMagnetGlow;
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue;
      const pulse = 1 + 0.08 * Math.sin(this.elapsedMs / 220 + pickup.phase);
      const bobX = Math.sin(this.elapsedMs / 500 + pickup.phase) * 4;
      const s = 36 * pulse;
      const x = pickup.x + bobX;
      if (glow) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.55 + 0.2 * Math.sin(this.elapsedMs / 260 + pickup.phase);
        const gs = s * 1.9;
        ctx.drawImage(glow, x - gs / 2, pickup.y - gs / 2, gs, gs);
        ctx.restore();
      }
      if (img) {
        ctx.drawImage(img, x - s / 2, pickup.y - s / 2, s, s);
      } else {
        ctx.fillStyle = "#fd4";
        ctx.beginPath();
        ctx.arc(x, pickup.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
