import type { BattlePerformance } from "@/systems/battleSession";
import { RAPID_FIRE_SLICE_ASSETS } from "@/data/gameplayRapidFire";
import { ENEMY_DEFS, type EnemyKind } from "./enemyConfig";
import { FIREPOWER_MAX, getFirepowerConfig, MAX_FIREPOWER, type FireLane } from "./firepowerConfig";
import { WAVE_COUNT, getOrderedSpawns, getWaveIndexAt } from "./waveTable";

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
  bright: number;
  hostile: boolean;
  alive: boolean;
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
  alive: boolean;
  dropped: boolean;
}

interface Pickup {
  x: number;
  y: number;
  vy: number;
  radius: number;
  alive: boolean;
}

const LOGICAL_W = 390;
const LOGICAL_H = 700;
const MAX_DT = 50;
const MAX_PLAYER_SHOTS = 120;
const MAX_HOSTILE_SHOTS = 80;
const MAX_PICKUPS = 16;
const FINGER_OFFSET_Y = 56;

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

  private playerShots: Projectile[] = [];
  private hostileShots: Projectile[] = [];
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];

  private spawnQueue = getOrderedSpawns();
  private spawnCursor = 0;
  private nextEnemyId = 1;
  private score = 0;
  private enemiesDestroyed = 0;
  private damageTaken = 0;
  private bgScroll = 0;

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
  }

  async start(): Promise<void> {
    const assets = RAPID_FIRE_SLICE_ASSETS;
    const entries = await Promise.all(
      Object.entries(assets).map(async ([key, src]) => [key, await loadImage(src)] as const),
    );
    this.images = Object.fromEntries(entries);
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
  }

  setPaused(paused: boolean): void {
    if (this.outcomeLocked !== "none") return;
    this.paused = paused;
    if (!paused) this.lastTs = performance.now();
    this.emitHud(true);
  }

  isPaused(): boolean {
    return this.paused;
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
    this.applyPlayerDamage(amount);
  }
  __debugGetHull(): number {
    return this.hull;
  }
  /** Set firepower level for visual verification (clamped 0–10). */
  __debugSetFirepower(level: number): void {
    this.firepower = Math.max(0, Math.min(FIREPOWER_MAX, Math.trunc(level)));
    this.emitHud(true);
  }
  /** Activate MAX FIREPOWER duration for visual verification. */
  __debugActivateMaxFirepower(ms = MAX_FIREPOWER.durationMs): void {
    this.firepower = FIREPOWER_MAX;
    this.maxFpRemaining = Math.min(MAX_FIREPOWER.refreshCapMs, Math.max(0, ms));
    this.emitHud(true);
  }
  __debugSpawnEnemy(kind: EnemyKind, x = LOGICAL_W / 2, y = 140): void {
    const def = ENEMY_DEFS[kind];
    this.enemies.push({
      id: this.nextEnemyId++,
      kind,
      x,
      y,
      vx: kind === "basic" ? 40 : 0,
      vy: def.speedY,
      hull: def.hull,
      radius: def.radius,
      w: def.drawWidth,
      h: def.drawHeight,
      shootCd: kind === "shooter" ? 200 : 999999,
      alive: true,
      dropped: false,
    });
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
  }
  /** Stop further wave spawns (screenshot / test isolation). */
  __debugStopSpawns(): void {
    this.spawnCursor = this.spawnQueue.length;
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

    if (this.maxFpRemaining > 0) {
      this.maxFpRemaining = Math.max(0, this.maxFpRemaining - dt);
    }

    this.spawnEnemies();
    this.updatePlayerFire(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updatePickups(dt);
    this.resolveCollisions();
    this.checkVictory();
  }

  private spawnEnemies(): void {
    while (this.spawnCursor < this.spawnQueue.length) {
      const next = this.spawnQueue[this.spawnCursor];
      if (next.atMs > this.elapsedMs) break;
      this.spawnCursor += 1;
      const def = ENEMY_DEFS[next.kind];
      this.enemies.push({
        id: this.nextEnemyId++,
        kind: next.kind,
        x: next.xNorm * LOGICAL_W,
        y: -def.drawHeight,
        vx: next.driftX ?? 0,
        vy: def.speedY,
        hull: def.hull,
        radius: def.radius,
        w: def.drawWidth,
        h: def.drawHeight,
        shootCd: def.shootIntervalMs ? def.shootIntervalMs * 0.5 : 0,
        alive: true,
        dropped: false,
      });
    }
  }

  private updatePlayerFire(dt: number): void {
    const cfg = getFirepowerConfig(this.firepower);
    const rateMul = this.maxFpRemaining > 0 ? 1 + MAX_FIREPOWER.fireRateBonus : 1;
    const dmgMul = this.maxFpRemaining > 0 ? 1 + MAX_FIREPOWER.damageBonus : 1;
    this.fireCd -= dt;
    this.heavyCd -= dt;

    if (this.fireCd <= 0) {
      this.fireCd = cfg.intervalMs / rateMul;
      this.fireVolley(cfg.lanes, cfg.projectileSpeed, dmgMul, this.maxFpRemaining > 0 ? 1.15 : 1);
      this.volleyIndex += 1;
    }

    if (cfg.heavyBurstMs && cfg.heavyBurstLanes && this.heavyCd <= 0) {
      this.heavyCd = cfg.heavyBurstMs;
      this.fireVolley(cfg.heavyBurstLanes, cfg.projectileSpeed * 1.05, dmgMul * 1.1, 1.35);
    }
  }

  private fireVolley(lanes: FireLane[], speed: number, dmgMul: number, bright: number): void {
    for (const lane of lanes) {
      if (lane.every != null && lane.phase != null) {
        if (this.volleyIndex % lane.every !== lane.phase) continue;
      }
      if (this.playerShots.length >= MAX_PLAYER_SHOTS) break;
      this.playerShots.push({
        x: this.player.x + lane.xOffset,
        y: this.player.y - this.player.h * 0.35,
        vx: 0,
        vy: -speed,
        damage: this.baseDamage * lane.damageMul * dmgMul,
        radius: 4 * lane.scale,
        scale: lane.scale,
        bright,
        hostile: false,
        alive: true,
      });
    }
  }

  private updateEnemies(dt: number): void {
    const sec = dt / 1000;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      enemy.x += enemy.vx * sec;
      enemy.y += enemy.vy * sec;
      if (enemy.x < 24) {
        enemy.x = 24;
        enemy.vx = Math.abs(enemy.vx);
      } else if (enemy.x > LOGICAL_W - 24) {
        enemy.x = LOGICAL_W - 24;
        enemy.vx = -Math.abs(enemy.vx);
      }

      const def = ENEMY_DEFS[enemy.kind];
      if (enemy.kind === "shooter" && def.shootIntervalMs && def.shotSpeed && def.shotDamage) {
        // Keep shooters in the upper playfield.
        if (enemy.y > LOGICAL_H * 0.42) {
          enemy.y = LOGICAL_H * 0.42;
          enemy.vy = Math.min(enemy.vy, 12);
        }
        enemy.shootCd -= dt;
        if (enemy.shootCd <= 0 && this.hostileShots.length < MAX_HOSTILE_SHOTS) {
          enemy.shootCd = def.shootIntervalMs;
          this.hostileShots.push({
            x: enemy.x,
            y: enemy.y + enemy.h * 0.25,
            vx: 0,
            vy: def.shotSpeed,
            damage: def.shotDamage,
            radius: 5,
            scale: 1,
            bright: 1,
            hostile: true,
            alive: true,
          });
        }
      }

      if (enemy.y > LOGICAL_H + enemy.h) {
        enemy.alive = false;
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive);
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
      if (shot.y < -40 || shot.y > LOGICAL_H + 40) shot.alive = false;
    }
    this.playerShots = this.playerShots.filter((s) => s.alive);
    this.hostileShots = this.hostileShots.filter((s) => s.alive);
  }

  private updatePickups(dt: number): void {
    const sec = dt / 1000;
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue;
      pickup.y += pickup.vy * sec;
      if (pickup.y > LOGICAL_H + 40) pickup.alive = false;
    }
    this.pickups = this.pickups.filter((p) => p.alive);
  }

  private resolveCollisions(): void {
    // Player shots → enemies
    for (const shot of this.playerShots) {
      if (!shot.alive) continue;
      for (const enemy of this.enemies) {
        if (!enemy.alive) continue;
        if (!circleHit(shot.x, shot.y, shot.radius, enemy.x, enemy.y, enemy.radius)) continue;
        shot.alive = false;
        enemy.hull -= shot.damage;
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
      this.applyPlayerDamage(shot.damage);
      if (this.outcomeLocked !== "none") return;
    }

    // Enemy body → player
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      if (!circleHit(enemy.x, enemy.y, enemy.radius, this.player.x, this.player.y, this.player.radius)) continue;
      const def = ENEMY_DEFS[enemy.kind];
      this.applyPlayerDamage(def.contactDamage);
      enemy.alive = false;
      if (this.outcomeLocked !== "none") return;
    }

    // Player → Fire-Up
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue;
      if (!circleHit(pickup.x, pickup.y, pickup.radius, this.player.x, this.player.y, this.player.radius + 6)) continue;
      pickup.alive = false;
      this.collectFireUp();
    }
  }

  private killEnemy(enemy: Enemy): void {
    if (!enemy.alive) return;
    enemy.alive = false;
    this.enemiesDestroyed += 1;
    this.score += ENEMY_DEFS[enemy.kind].scoreValue;
    if (enemy.kind === "powerCarrier" && !enemy.dropped) {
      enemy.dropped = true;
      this.spawnFireUp(enemy.x, enemy.y);
    }
  }

  private spawnFireUp(x: number, y: number): void {
    if (this.pickups.length >= MAX_PICKUPS) return;
    this.pickups.push({
      x,
      y,
      vy: 90,
      radius: 16,
      alive: true,
    });
  }

  private collectFireUp(): void {
    if (this.firepower < FIREPOWER_MAX) {
      this.firepower += 1;
      return;
    }
    // Already at 10 — Max Firepower
    if (this.maxFpRemaining <= 0) {
      this.maxFpRemaining = MAX_FIREPOWER.durationMs;
    } else {
      this.maxFpRemaining = Math.min(MAX_FIREPOWER.refreshCapMs, this.maxFpRemaining + MAX_FIREPOWER.durationMs);
    }
  }

  private applyPlayerDamage(raw: number): void {
    if (this.outcomeLocked !== "none") return;
    const mitigated = Math.max(1, Math.round(raw * (100 / (100 + this.defense))));
    const applied = Math.min(this.hull, mitigated);
    if (applied <= 0) return;
    this.damageTaken += applied;
    this.hull = Math.max(0, this.hull - applied);
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

  private draw(): void {
    const ctx = this.ctx;
    const cssW = this.canvas.clientWidth || LOGICAL_W;
    const cssH = this.canvas.clientHeight || Math.round((cssW * LOGICAL_H) / LOGICAL_W);
    const scaleX = cssW / LOGICAL_W;
    const scaleY = cssH / LOGICAL_H;

    ctx.save();
    ctx.setTransform(
      (this.canvas.width / cssW) * scaleX,
      0,
      0,
      (this.canvas.height / cssH) * scaleY,
      0,
      0,
    );
    // Reset using css pixel space mapped to logical via the transform above.
    // Simpler: clear in device space then draw in logical via scale.
    ctx.restore();

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const dpr = this.canvas.width / cssW;
    ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);

    this.drawBackground(ctx);
    this.drawPickups(ctx);
    this.drawEnemies(ctx);
    this.drawHostileShots(ctx);
    this.drawPlayerShots(ctx);
    this.drawPlayer(ctx);
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const bg = this.images.background;
    if (bg) {
      const imgAspect = bg.width / bg.height;
      const viewAspect = LOGICAL_W / LOGICAL_H;
      let dw = LOGICAL_W;
      let dh = LOGICAL_H;
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
      ctx.globalAlpha = 0.85;
      ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, dw, dh);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = "#070816";
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
    }
    ctx.fillStyle = "rgba(4,6,18,0.35)";
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
  }

  private drawPlayer(ctx: CanvasRenderingContext2D): void {
    const img = this.images.shipSprite;
    const { x, y, w, h } = this.player;
    if (this.maxFpRemaining > 0) {
      const pulse = 0.35 + 0.15 * Math.sin(this.elapsedMs / 120);
      ctx.beginPath();
      ctx.arc(x, y, w * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(80, 200, 255, ${pulse})`;
      ctx.fill();
    }
    if (img) {
      ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    } else {
      ctx.fillStyle = "#7ef";
      ctx.fillRect(x - w / 2, y - h / 2, w, h);
    }
  }

  private drawPlayerShots(ctx: CanvasRenderingContext2D): void {
    const bolt = this.images.primaryBolt;
    for (const shot of this.playerShots) {
      if (!shot.alive) continue;
      const bw = 8 * shot.scale;
      const bh = 28 * shot.scale;
      ctx.save();
      if (shot.bright > 1) ctx.globalAlpha = Math.min(1, 0.75 + shot.bright * 0.15);
      if (bolt) {
        ctx.drawImage(bolt, shot.x - bw / 2, shot.y - bh / 2, bw, bh);
      } else {
        ctx.fillStyle = "#6ef";
        ctx.fillRect(shot.x - 2, shot.y - 10, 4, 16);
      }
      ctx.restore();
    }
  }

  private drawHostileShots(ctx: CanvasRenderingContext2D): void {
    for (const shot of this.hostileShots) {
      if (!shot.alive) continue;
      ctx.beginPath();
      ctx.fillStyle = "#ff8a3a";
      ctx.arc(shot.x, shot.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.fillStyle = "#ffe0a0";
      ctx.arc(shot.x, shot.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawEnemies(ctx: CanvasRenderingContext2D): void {
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const key =
        enemy.kind === "basic"
          ? "enemyBasic"
          : enemy.kind === "shooter"
            ? "enemyShooter"
            : "enemyPowerCarrier";
      const img = this.images[key];
      if (img) {
        ctx.drawImage(img, enemy.x - enemy.w / 2, enemy.y - enemy.h / 2, enemy.w, enemy.h);
      } else {
        ctx.fillStyle = "#f55";
        ctx.fillRect(enemy.x - enemy.w / 2, enemy.y - enemy.h / 2, enemy.w, enemy.h);
      }
    }
  }

  private drawPickups(ctx: CanvasRenderingContext2D): void {
    const img = this.images.fireUpPickup;
    for (const pickup of this.pickups) {
      if (!pickup.alive) continue;
      const s = 34;
      if (img) {
        ctx.drawImage(img, pickup.x - s / 2, pickup.y - s / 2, s, s);
      } else {
        ctx.fillStyle = "#fd4";
        ctx.beginPath();
        ctx.arc(pickup.x, pickup.y, 12, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
