/**
 * WebGL renderer for the Rapid-Fire gameplay slice (PixiJS 8).
 *
 * This module owns ALL drawing. It is a pure presentation layer: every frame
 * the engine calls `render(state)` with its live entity arrays + presentation
 * scalars, and the renderer syncs a persistent, pooled Pixi scene graph to
 * match. It never mutates simulation state, never owns hitboxes, and never
 * runs its own loop — the engine's single requestAnimationFrame drives both
 * `update(dt)` (simulation) and `render(state)` (this).
 *
 * Design rules honored here:
 * - One loop: Pixi's ticker is NOT started (`autoStart:false`); we call
 *   `renderer.render(stage)` manually from the engine loop.
 * - Preload/reuse: textures are created once in `init()`; spritesheets are
 *   pre-sliced into per-frame textures once; a soft radial "glow" texture is
 *   generated once. Sprites/graphics are pooled and reused, never created per
 *   frame.
 * - Bloom/glow: a single BlurFilter (created once) over an additive glow
 *   layer gives the premium bloom Canvas2D could not. Additive blend on
 *   projectile glows, explosion cores, muzzle/impact VFX, and the under-ship
 *   glow provides the energy look.
 * - Teardown: `destroy()` disposes the Application, all pooled display
 *   objects, generated textures, the filter, and the ResizeObserver.
 */
import {
  Application,
  BlurFilter,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Texture,
  TilingSprite,
} from "pixi.js";
import { ANIM } from "./animationDefs";
import type { SpriteAnimationInstance, VfxLayer } from "./spriteAnimation";
import type { Enemy, RenderState } from "./renderTypes";

const LOGICAL_W = 390;
const LOGICAL_H = 700;
const ENEMY_DEATH_SPRITE_MS = 200;

/** Simple grow-on-demand pool of Sprites parented to one container. */
class SpritePool {
  private pool: Sprite[] = [];
  private idx = 0;
  constructor(
    private readonly layer: Container,
    private readonly make: () => Sprite,
  ) {}

  /** Reset the cursor at the start of a frame's fill pass. */
  begin(): void {
    this.idx = 0;
  }

  next(): Sprite {
    let s = this.pool[this.idx];
    if (!s) {
      s = this.make();
      this.layer.addChild(s);
      this.pool.push(s);
    }
    s.visible = true;
    this.idx += 1;
    return s;
  }

  /** Hide any sprites not claimed this frame. */
  end(): void {
    for (let i = this.idx; i < this.pool.length; i += 1) this.pool[i].visible = false;
  }

  destroy(): void {
    for (const s of this.pool) s.destroy();
    this.pool = [];
    this.idx = 0;
  }
}

export class PixiRenderer {
  private app: Application | null = null;
  private canvas: HTMLCanvasElement;
  private destroyed = false;

  // Scene graph
  private viewport = new Container(); // scaled logical→css, carries screen shake
  private layerBg = new Container();
  private layerWorld = new Container(); // enemies, pickups, projectile bases
  private layerGlow = new Container(); // additive + bloom (BlurFilter)
  private layerFx = new Container(); // vector explosions (rings/debris)
  private layerPlayer = new Container();

  // Persistent display objects
  private bgFar: TilingSprite | null = null;
  private player: Sprite | null = null;
  private playerGlow: Sprite | null = null;
  private playerAura: Sprite | null = null;
  private fxGraphics: Graphics | null = null;
  private blur: BlurFilter | null = null;

  // Pools
  private starPool: SpritePool | null = null;
  private streakPool: SpritePool | null = null;
  private enemyPool: SpritePool | null = null;
  private enemyFlashPool: SpritePool | null = null;
  private playerShotPool: SpritePool | null = null;
  private playerShotGlowPool: SpritePool | null = null;
  private hostileShotPool: SpritePool | null = null;
  private pickupPool: SpritePool | null = null;
  private pickupGlowPool: SpritePool | null = null;
  private explosionCorePool: SpritePool | null = null;
  private vfxPool: SpritePool | null = null;

  // Textures (owned; destroyed on teardown)
  private textures: Record<string, Texture> = {};
  private glowTex: Texture | null = null;
  private frameTextures = new Map<string, Texture[]>();
  private generatedTextures: Texture[] = [];

  private resizeObserver: ResizeObserver | null = null;
  private cssW = LOGICAL_W;
  private cssH = LOGICAL_H;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Boot the WebGL Application and build the (static) scene graph + pools.
   * `images` are the already-loaded HTMLImageElements the engine preloaded.
   */
  async init(images: Record<string, HTMLImageElement>): Promise<void> {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.cssW = this.canvas.clientWidth || LOGICAL_W;
    this.cssH = this.canvas.clientHeight || Math.round((this.cssW * LOGICAL_H) / LOGICAL_W);

    const app = new Application();
    await app.init({
      canvas: this.canvas,
      width: this.cssW,
      height: this.cssH,
      resolution: dpr,
      autoDensity: false, // CSS (width/height:100%) owns display size; we own the buffer
      antialias: true,
      backgroundAlpha: 1,
      background: 0x050714,
      autoStart: false, // engine's rAF is the single loop; Pixi ticker stays stopped
      preference: "webgl",
    });
    if (this.destroyed) {
      app.destroy(true, { children: true });
      return;
    }
    this.app = app;
    app.ticker.stop();

    // Base textures from preloaded images.
    for (const [key, img] of Object.entries(images)) {
      this.textures[key] = Texture.from(img);
    }
    this.glowTex = this.makeGlowTexture();
    this.sliceSheets();

    // Layer order (back → front).
    app.stage.addChild(this.viewport);
    this.viewport.addChild(this.layerBg);
    this.viewport.addChild(this.layerWorld);
    this.viewport.addChild(this.layerGlow);
    this.viewport.addChild(this.layerFx);
    this.viewport.addChild(this.layerPlayer);

    // Bloom: one blur over the additive glow layer (created once).
    this.blur = new BlurFilter({ strength: 5, quality: 3 });
    this.layerGlow.filters = [this.blur];

    this.buildBackground();
    this.buildPlayer();
    this.buildPools();

    this.applyViewportTransform();

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.canvas);
  }

  private makeGlowTexture(): Texture {
    const size = 128;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.35, "rgba(255,255,255,0.55)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
    const tex = Texture.from(c);
    this.generatedTextures.push(tex);
    return tex;
  }

  /** Pre-slice every spritesheet into per-frame sub-textures (once). */
  private sliceSheets(): void {
    for (const def of Object.values(ANIM)) {
      const base = this.textures[def.imageKey];
      if (!base) continue;
      const frames: Texture[] = [];
      for (let i = 0; i < def.frameCount; i += 1) {
        const col = i % def.columns;
        const row = Math.floor(i / def.columns);
        const frame = new Rectangle(
          col * def.frameWidth,
          row * def.frameHeight,
          def.frameWidth,
          def.frameHeight,
        );
        const t = new Texture({ source: base.source, frame });
        frames.push(t);
        this.generatedTextures.push(t);
      }
      this.frameTextures.set(def.imageKey, frames);
    }
  }

  private buildBackground(): void {
    const bg = this.textures.background;
    if (bg) {
      const tiling = new TilingSprite({ texture: bg, width: LOGICAL_W, height: LOGICAL_H });
      // Cover the logical width; vertical repeat gives a seamless scroll.
      const s = LOGICAL_W / bg.width;
      tiling.tileScale.set(s, s);
      tiling.alpha = 0.85;
      this.layerBg.addChild(tiling);
      this.bgFar = tiling;
    }
    // Mood dim over the far layer (a static child of layerBg; disposed with
    // the layer on teardown, so no field reference is needed to keep it).
    const dim = new Graphics();
    dim.rect(0, 0, LOGICAL_W, LOGICAL_H).fill({ color: 0x040612, alpha: 0.35 });
    this.layerBg.addChild(dim);
  }

  private buildPlayer(): void {
    // Under-ship glow (additive) sits on the glow layer so it blooms.
    if (this.glowTex) {
      const glow = new Sprite(this.glowTex);
      glow.anchor.set(0.5);
      glow.blendMode = "add";
      glow.tint = 0x5acdff;
      glow.visible = false;
      this.layerGlow.addChild(glow);
      this.playerGlow = glow;

      const aura = new Sprite(this.glowTex);
      aura.anchor.set(0.5);
      aura.blendMode = "add";
      aura.tint = 0x8ad8ff;
      aura.visible = false;
      this.layerGlow.addChild(aura);
      this.playerAura = aura;
    }
    const shipTex = this.textures.shipSprite;
    if (shipTex) {
      const ship = new Sprite(shipTex);
      ship.anchor.set(0.5);
      this.layerPlayer.addChild(ship);
      this.player = ship;
    }
  }

  private buildPools(): void {
    const glow = this.glowTex ?? Texture.WHITE;

    this.starPool = new SpritePool(this.layerBg, () => {
      const s = new Sprite(glow);
      s.anchor.set(0.5);
      s.blendMode = "add";
      s.tint = 0xbcd8ff;
      return s;
    });
    this.streakPool = new SpritePool(this.layerBg, () => {
      const s = new Sprite(this.textures.backgroundSpeedStreak ?? glow);
      s.anchor.set(0.5, 0);
      s.blendMode = "add";
      return s;
    });
    this.enemyPool = new SpritePool(this.layerWorld, () => {
      const s = new Sprite(Texture.EMPTY);
      s.anchor.set(0.5);
      return s;
    });
    this.enemyFlashPool = new SpritePool(this.layerGlow, () => {
      const s = new Sprite(Texture.EMPTY);
      s.anchor.set(0.5);
      s.blendMode = "add";
      return s;
    });
    this.playerShotPool = new SpritePool(this.layerWorld, () => {
      const s = new Sprite(Texture.EMPTY);
      s.anchor.set(0.5);
      return s;
    });
    this.playerShotGlowPool = new SpritePool(this.layerGlow, () => {
      const s = new Sprite(Texture.EMPTY);
      s.anchor.set(0.5);
      s.blendMode = "add";
      return s;
    });
    this.hostileShotPool = new SpritePool(this.layerWorld, () => {
      const s = new Sprite(Texture.EMPTY);
      s.anchor.set(0.5);
      return s;
    });
    this.pickupPool = new SpritePool(this.layerWorld, () => {
      const s = new Sprite(this.textures.fireUpPickup ?? glow);
      s.anchor.set(0.5);
      return s;
    });
    this.pickupGlowPool = new SpritePool(this.layerGlow, () => {
      const s = new Sprite(this.textures.pickupMagnetGlow ?? glow);
      s.anchor.set(0.5);
      s.blendMode = "add";
      return s;
    });
    this.explosionCorePool = new SpritePool(this.layerGlow, () => {
      const s = new Sprite(glow);
      s.anchor.set(0.5);
      s.blendMode = "add";
      return s;
    });
    this.vfxPool = new SpritePool(this.layerGlow, () => {
      const s = new Sprite(Texture.EMPTY);
      s.anchor.set(0.5);
      s.blendMode = "add";
      return s;
    });

    // Reused vector graphics for procedural explosion rings + debris.
    const fx = new Graphics();
    this.layerFx.addChild(fx);
    this.fxGraphics = fx;
  }

  private applyViewportTransform(): void {
    this.viewport.scale.set(this.cssW / LOGICAL_W, this.cssH / LOGICAL_H);
  }

  private handleResize(): void {
    if (!this.app || this.destroyed) return;
    const w = this.canvas.clientWidth || LOGICAL_W;
    const h = this.canvas.clientHeight || Math.round((w * LOGICAL_H) / LOGICAL_W);
    if (w === this.cssW && h === this.cssH) return;
    this.cssW = w;
    this.cssH = h;
    this.app.renderer.resize(w, h);
    this.applyViewportTransform();
  }

  /** Draw one frame from the engine's current state. Allocates nothing. */
  render(s: RenderState): void {
    const app = this.app;
    if (!app || this.destroyed) return;

    // Screen shake, applied to the whole viewport in css px.
    if (s.shakeMs > 0) {
      const k = s.shakeMs / 220;
      const sx = this.cssW / LOGICAL_W;
      const sy = this.cssH / LOGICAL_H;
      this.viewport.position.set(
        (Math.random() * 2 - 1) * s.shakeMag * k * sx,
        (Math.random() * 2 - 1) * s.shakeMag * k * sy,
      );
    } else {
      this.viewport.position.set(0, 0);
    }

    this.syncBackground(s);
    this.syncEnemies(s);
    this.syncHostileShots(s);
    this.syncPlayerShots(s);
    this.syncPickups(s);
    this.syncExplosions(s);
    this.syncVfx(s);
    this.syncPlayer(s);

    app.renderer.render(app.stage);
  }

  private syncBackground(s: RenderState): void {
    if (this.bgFar) this.bgFar.tilePosition.y = s.bgScroll;

    const stars = this.starPool!;
    stars.begin();
    for (const star of s.stars) {
      const y = ((star.y + s.bgScroll * star.speedMul) % (LOGICAL_H + 6)) - 3;
      const sp = stars.next();
      sp.position.set(star.x, y);
      const d = star.r * 3;
      sp.width = d;
      sp.height = d;
      sp.alpha = star.a;
    }
    stars.end();

    const streaks = this.streakPool!;
    streaks.begin();
    const cols = [0.14, 0.42, 0.66, 0.9];
    for (let i = 0; i < cols.length; i += 1) {
      const sp = streaks.next();
      const sw = 26;
      const sh = 180;
      const speedMul = 0.7 + (i % 3) * 0.35;
      const y = ((s.streakScroll * speedMul + i * 240) % (LOGICAL_H + sh)) - sh;
      sp.position.set(cols[i] * LOGICAL_W, y);
      sp.width = sw;
      sp.height = sh;
      sp.alpha = 0.1 + (i % 2) * 0.05;
    }
    streaks.end();
  }

  private enemyTextureKey(e: Enemy): string {
    return e.kind === "basic" ? "enemyBasic" : e.kind === "shooter" ? "enemyShooter" : "enemyPowerCarrier";
  }

  private syncEnemies(s: RenderState): void {
    const pool = this.enemyPool!;
    const flashPool = this.enemyFlashPool!;
    pool.begin();
    flashPool.begin();
    for (const e of s.enemies) {
      if (!e.alive) continue;
      if (e.dying && e.dyingMs >= ENEMY_DEATH_SPRITE_MS) continue;
      const tex = this.textures[this.enemyTextureKey(e)];
      if (!tex) continue;
      const sway = Math.sin(s.elapsedMs / 620 + e.swayPhase) * 3;
      const bank =
        clamp(e.vx * 0.006, -0.22, 0.22) + Math.sin(s.elapsedMs / 900 + e.swayPhase) * 0.05;
      const recoil = e.recoilMs > 0 ? -(e.recoilMs / 130) * 3 : 0;
      const side = e.h;
      const alpha = e.dying ? Math.max(0, 1 - e.dyingMs / ENEMY_DEATH_SPRITE_MS) : 1;
      // Source art is nose-up; enemies travel downward → rotate 180° so the
      // nose faces the direction of travel.
      const rot = Math.PI + bank;

      const sp = pool.next();
      sp.texture = tex;
      sp.position.set(e.x + sway, e.y + recoil);
      sp.width = side;
      sp.height = side;
      sp.rotation = rot;
      sp.alpha = alpha;

      if (e.flashMs > 0) {
        const fp = flashPool.next();
        fp.texture = tex;
        fp.position.set(e.x + sway, e.y + recoil);
        fp.width = side;
        fp.height = side;
        fp.rotation = rot;
        fp.alpha = Math.min(1, e.flashMs / 90) * 0.85 * alpha;
      }
    }
    pool.end();
    flashPool.end();
  }

  private syncPlayerShots(s: RenderState): void {
    const pool = this.playerShotPool!;
    const glowPool = this.playerShotGlowPool!;
    pool.begin();
    glowPool.begin();
    const primary = this.textures.primaryBolt;
    const heavy = this.textures.heavyBolt;
    for (const shot of s.playerShots) {
      if (!shot.alive) continue;
      const tex = shot.kind === "heavy" ? heavy : primary;
      if (!tex) continue;
      const side = (shot.kind === "heavy" ? 42 : 26) * shot.scale;
      const sp = pool.next();
      sp.texture = tex;
      sp.position.set(shot.x, shot.y);
      sp.width = side;
      sp.height = side;
      sp.rotation = shot.rotation;

      // Additive glow twin (bloom) scaled by the shot's glow value.
      const gp = glowPool.next();
      gp.texture = tex;
      gp.position.set(shot.x, shot.y);
      gp.width = side * 1.25;
      gp.height = side * 1.25;
      gp.rotation = shot.rotation;
      gp.alpha = 0.35 + shot.glow * 0.5;
    }
    pool.end();
    glowPool.end();
  }

  private syncHostileShots(s: RenderState): void {
    const pool = this.hostileShotPool!;
    pool.begin();
    const small = this.textures.enemyBulletSmall;
    const aimed = this.textures.enemyBulletAimed;
    for (const shot of s.hostileShots) {
      if (!shot.alive) continue;
      const isAimed = shot.hostileKind === "aimed";
      const tex = isAimed ? aimed : small;
      if (!tex) continue;
      const side = isAimed ? 22 : 18;
      const sp = pool.next();
      sp.texture = tex;
      sp.position.set(shot.x, shot.y);
      sp.width = side;
      sp.height = side;
      sp.rotation = isAimed ? -shot.rotation : 0;
    }
    pool.end();
  }

  private syncPickups(s: RenderState): void {
    const pool = this.pickupPool!;
    const glowPool = this.pickupGlowPool!;
    pool.begin();
    glowPool.begin();
    for (const p of s.pickups) {
      if (!p.alive) continue;
      const pulse = 1 + 0.08 * Math.sin(s.elapsedMs / 220 + p.phase);
      const bobX = Math.sin(s.elapsedMs / 500 + p.phase) * 4;
      const size = 36 * pulse;
      const x = p.x + bobX;

      if (this.textures.pickupMagnetGlow) {
        const gp = glowPool.next();
        gp.position.set(x, p.y);
        const gs = size * 1.9;
        gp.width = gs;
        gp.height = gs;
        gp.alpha = 0.55 + 0.2 * Math.sin(s.elapsedMs / 260 + p.phase);
      }
      if (this.textures.fireUpPickup) {
        const sp = pool.next();
        sp.position.set(x, p.y);
        sp.width = size;
        sp.height = size;
      }
    }
    pool.end();
    glowPool.end();
  }

  private syncExplosions(s: RenderState): void {
    const corePool = this.explosionCorePool!;
    const fx = this.fxGraphics!;
    corePool.begin();
    fx.clear();
    for (const ex of s.explosions) {
      const t = clamp(ex.ageMs / ex.durationMs, 0, 1);
      const flashT = clamp(ex.ageMs / (ex.durationMs * 0.25), 0, 1);
      const baseR = 10 * ex.scale;

      // Hot additive core (blooms via the glow layer's blur).
      if (flashT < 1) {
        const flashA = 1 - flashT;
        const flashR = baseR * (0.6 + flashT * 1.4);
        const core = corePool.next();
        core.position.set(ex.x, ex.y);
        core.width = flashR * 4;
        core.height = flashR * 4;
        core.tint = ex.color;
        core.alpha = flashA;
      }

      // Expanding shockwave ring (vector).
      const ringR = baseR * (1 + t * 5);
      const ringA = (1 - t) * 0.8;
      if (ringA > 0.01) {
        fx.circle(ex.x, ex.y, ringR).stroke({
          width: Math.max(1, baseR * 0.35 * (1 - t * 0.6)),
          color: ex.color,
          alpha: ringA,
        });
      }

      // Debris streaks.
      const debrisA = 1 - t;
      if (debrisA > 0.01) {
        for (const d of ex.debris) {
          const dx = ex.x + Math.cos(d.angle) * d.dist;
          const dy = ex.y + Math.sin(d.angle) * d.dist;
          const tx = ex.x + Math.cos(d.angle) * (d.dist - d.len);
          const ty = ex.y + Math.sin(d.angle) * (d.dist - d.len);
          fx.moveTo(tx, ty).lineTo(dx, dy).stroke({
            width: Math.max(1, 1.5 * ex.scale),
            color: 0xffebc8,
            alpha: debrisA,
          });
        }
      }
    }
    corePool.end();
  }

  private syncVfx(s: RenderState): void {
    const pool = this.vfxPool!;
    pool.begin();
    if (s.vfx) {
      s.vfx.forEachActive((inst: SpriteAnimationInstance, _layer: VfxLayer) => {
        const frames = this.frameTextures.get(inst.def.imageKey);
        if (!frames || frames.length === 0) return;
        const tex = frames[Math.min(inst.frameIndex, frames.length - 1)];
        const pose = inst.resolvePose();
        const sp = pool.next();
        sp.texture = tex;
        sp.anchor.set(inst.def.anchorX, inst.def.anchorY);
        sp.position.set(pose.x, pose.y);
        sp.rotation = pose.rotation;
        sp.width = inst.def.frameWidth * inst.scale;
        sp.height = inst.def.frameHeight * inst.scale;
        sp.alpha = Math.max(0, Math.min(1, inst.opacity * (1 + inst.boost)));
      });
    }
    pool.end();
  }

  private syncPlayer(s: RenderState): void {
    const hover = Math.sin(s.elapsedMs / 480) * 2.2;
    const recoilY = s.recoil * 3.2;
    const px = s.playerX;
    const py = s.playerY + hover + recoilY;
    const h = s.playerH;

    // Invulnerability flicker (hide every other 70ms window).
    const hidden = s.invulnMs > 0 && Math.floor(s.invulnMs / 70) % 2 === 0;

    if (this.player) {
      this.player.visible = !hidden;
      this.player.position.set(px, py);
      this.player.rotation = s.bank;
      this.player.width = h;
      this.player.height = h;
      // Red damage flash via tint (white → red), reverting as the timer fades.
      if (s.damageFlashMs > 0) {
        const f = Math.min(1, s.damageFlashMs / 260) * 0.85;
        const g = Math.round(255 * (1 - f));
        this.player.tint = (255 << 16) | (g << 8) | g;
      } else {
        this.player.tint = 0xffffff;
      }
    }

    if (this.playerGlow) {
      this.playerGlow.visible = !hidden;
      this.playerGlow.position.set(px, py + h * 0.1);
      const d = h * 1.5;
      this.playerGlow.width = d;
      this.playerGlow.height = d;
      this.playerGlow.alpha = s.maxActive ? 0.6 : 0.32;
    }

    if (this.playerAura) {
      const show = s.atMax && !hidden;
      this.playerAura.visible = show;
      if (show) {
        const pulse = 0.82 + 0.12 * Math.sin(s.elapsedMs / 160);
        const size = h * 2.4 * pulse;
        this.playerAura.position.set(px, py);
        this.playerAura.width = size;
        this.playerAura.height = size;
        this.playerAura.rotation = s.elapsedMs / 900;
        this.playerAura.alpha = s.maxActive ? 0.7 : 0.3;
      }
    }
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.starPool?.destroy();
    this.streakPool?.destroy();
    this.enemyPool?.destroy();
    this.enemyFlashPool?.destroy();
    this.playerShotPool?.destroy();
    this.playerShotGlowPool?.destroy();
    this.hostileShotPool?.destroy();
    this.pickupPool?.destroy();
    this.pickupGlowPool?.destroy();
    this.explosionCorePool?.destroy();
    this.vfxPool?.destroy();

    if (this.layerGlow) this.layerGlow.filters = [];
    this.blur?.destroy();
    this.blur = null;

    // Destroy the Application (renderer, stage, ticker). removeView:false so
    // the React-owned <canvas> stays in the DOM. We destroy our own generated
    // textures separately below (texture:false keeps the shared image sources).
    this.app?.destroy({ removeView: false }, { children: true, texture: false });
    this.app = null;

    for (const t of this.generatedTextures) t.destroy(false);
    this.generatedTextures = [];
    for (const t of Object.values(this.textures)) t.destroy(false);
    this.textures = {};
    this.frameTextures.clear();
    this.glowTex = null;
  }
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
