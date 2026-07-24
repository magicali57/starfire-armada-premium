/**
 * Reusable elapsed-time spritesheet animation runtime for the Canvas engine.
 *
 * - Frame advancement is driven exclusively by `update(dt)` calls from the
 *   single gameplay requestAnimationFrame loop (never by React renders and
 *   never by per-effect rAF loops).
 * - When the engine pauses it simply stops calling `update`, which freezes
 *   every animation in place.
 * - One-shot instances mark themselves `done` after their final frame and
 *   are swept by the owning VfxSystem.
 */

export interface SpriteSheetDef {
  /** Registry key of the sheet image. */
  imageKey: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  columns: number;
  rows: number;
  fps: number;
  loop: boolean;
  /** Normalized anchor inside a frame (0.5/0.5 = centered). */
  anchorX: number;
  anchorY: number;
  /** "screen"-style additive compositing recommended by the pack metadata. */
  additive: boolean;
}

export interface SpriteInstanceOptions {
  x?: number;
  y?: number;
  /** Optional live position source (e.g. attach to the player ship). */
  follow?: () => { x: number; y: number; rotation?: number };
  scale?: number;
  rotation?: number;
  opacity?: number;
  /** Extra brightness multiplier applied through a second additive pass. */
  boost?: number;
  /** Start offset into the timeline (ms) — desynchronizes loops. */
  startAtMs?: number;
}

export class SpriteAnimationInstance {
  readonly def: SpriteSheetDef;
  private image: HTMLImageElement;
  private elapsed: number;
  x: number;
  y: number;
  follow?: () => { x: number; y: number; rotation?: number };
  scale: number;
  rotation: number;
  opacity: number;
  boost: number;
  done = false;

  constructor(def: SpriteSheetDef, image: HTMLImageElement, opts: SpriteInstanceOptions = {}) {
    this.def = def;
    this.image = image;
    this.elapsed = opts.startAtMs ?? 0;
    this.x = opts.x ?? 0;
    this.y = opts.y ?? 0;
    this.follow = opts.follow;
    this.scale = opts.scale ?? 1;
    this.rotation = opts.rotation ?? 0;
    this.opacity = opts.opacity ?? 1;
    this.boost = opts.boost ?? 0;
  }

  /** Total timeline length in ms. */
  get durationMs(): number {
    return (this.def.frameCount / this.def.fps) * 1000;
  }

  get progress(): number {
    return Math.min(1, this.elapsed / this.durationMs);
  }

  /** Current spritesheet frame index (for external renderers, e.g. Pixi). */
  get frameIndex(): number {
    return this.currentFrame();
  }

  /** Resolved world transform, applying the optional `follow` source. */
  resolvePose(): { x: number; y: number; rotation: number } {
    let px = this.x;
    let py = this.y;
    let rot = this.rotation;
    if (this.follow) {
      const p = this.follow();
      px = p.x;
      py = p.y;
      if (p.rotation != null) rot = p.rotation + this.rotation;
    }
    return { x: px, y: py, rotation: rot };
  }

  update(dt: number): void {
    if (this.done) return;
    this.elapsed += dt;
    if (!this.def.loop && this.elapsed >= this.durationMs) {
      this.done = true;
    }
  }

  /** Force-complete (used when clearing VFX on restart). */
  cancel(): void {
    this.done = true;
  }

  private currentFrame(): number {
    const raw = Math.floor((this.elapsed / 1000) * this.def.fps);
    if (this.def.loop) return raw % this.def.frameCount;
    return Math.min(raw, this.def.frameCount - 1);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.done) return;
    const img = this.image;
    if (!img.complete || img.naturalWidth === 0) return;
    const frame = this.currentFrame();
    const col = frame % this.def.columns;
    const row = Math.floor(frame / this.def.columns);
    const sx = col * this.def.frameWidth;
    const sy = row * this.def.frameHeight;
    const dw = this.def.frameWidth * this.scale;
    const dh = this.def.frameHeight * this.scale;

    let px = this.x;
    let py = this.y;
    let rot = this.rotation;
    if (this.follow) {
      const p = this.follow();
      px = p.x;
      py = p.y;
      if (p.rotation != null) rot = p.rotation + this.rotation;
    }

    ctx.save();
    ctx.translate(px, py);
    if (rot !== 0) ctx.rotate(rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, this.opacity));
    if (this.def.additive) ctx.globalCompositeOperation = "screen";
    const dx = -dw * this.def.anchorX;
    const dy = -dh * this.def.anchorY;
    ctx.drawImage(img, sx, sy, this.def.frameWidth, this.def.frameHeight, dx, dy, dw, dh);
    if (this.boost > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = Math.min(1, this.opacity * this.boost);
      ctx.drawImage(img, sx, sy, this.def.frameWidth, this.def.frameHeight, dx, dy, dw, dh);
    }
    ctx.restore();
  }
}

/** Render layer relative to gameplay entities. */
export type VfxLayer = "world" | "top";

interface ManagedInstance {
  inst: SpriteAnimationInstance;
  layer: VfxLayer;
}

/**
 * Pool of active one-shot / looping VFX. Bounded to prevent unbounded
 * accumulation; when full, the oldest one-shot is evicted so high-priority
 * new effects still appear.
 */
export class VfxSystem {
  private items: ManagedInstance[] = [];
  private images: Record<string, HTMLImageElement>;
  private cap: number;

  constructor(images: Record<string, HTMLImageElement>, cap = 48) {
    this.images = images;
    this.cap = cap;
  }

  get activeCount(): number {
    return this.items.length;
  }

  spawn(def: SpriteSheetDef, opts: SpriteInstanceOptions = {}, layer: VfxLayer = "world"): SpriteAnimationInstance | null {
    const image = this.images[def.imageKey];
    if (!image) return null;
    if (this.items.length >= this.cap) {
      const evict = this.items.findIndex((m) => !m.inst.def.loop);
      if (evict === -1) return null;
      this.items.splice(evict, 1);
    }
    const inst = new SpriteAnimationInstance(def, image, opts);
    this.items.push({ inst, layer });
    return inst;
  }

  remove(inst: SpriteAnimationInstance): void {
    inst.cancel();
    this.items = this.items.filter((m) => m.inst !== inst);
  }

  update(dt: number): void {
    for (const m of this.items) m.inst.update(dt);
    this.items = this.items.filter((m) => !m.inst.done);
  }

  /** Iterate live instances (for an external renderer to draw them). */
  forEachActive(cb: (inst: SpriteAnimationInstance, layer: VfxLayer) => void): void {
    for (const m of this.items) {
      if (!m.inst.done) cb(m.inst, m.layer);
    }
  }

  draw(ctx: CanvasRenderingContext2D, layer: VfxLayer): void {
    for (const m of this.items) {
      if (m.layer === layer) m.inst.draw(ctx);
    }
  }

  clear(): void {
    for (const m of this.items) m.inst.cancel();
    this.items = [];
  }
}
