/**
 * Rapid-Fire battle audio system.
 *
 * Procedural Web Audio API sound design — no licensed audio assets exist in
 * the repository yet, so every effect below is synthesized (oscillators +
 * filtered noise) rather than downloaded. The architecture is ready to swap
 * in real WAV/OGG buffers later: each `play*` method is the single call site
 * an eventual buffer-based implementation would replace.
 *
 * Rules this module honors:
 * - AudioContext is created/resumed only after a real user gesture (mobile
 *   autoplay policy) via `unlock()`.
 * - Every trigger call site is driven by actual simulation events inside
 *   RapidFireEngine — never by an unrelated timer.
 * - Rapid, repeated triggers (player fire at FP10 ~145ms/volley, hostile
 *   impacts) are throttled/pooled so overlapping identical voices never clip
 *   or turn into noise.
 * - Preferences persist under a dedicated localStorage key, deliberately
 *   separate from the versioned save (`starfire-armada-v2:save`, schema
 *   v12) — audio prefs are presentation-only and must never touch schema.
 */

export interface AudioPrefs {
  master: number;
  music: number;
  sfx: number;
  muted: boolean;
}

export const DEFAULT_AUDIO_PREFS: AudioPrefs = {
  master: 0.7,
  music: 0.5,
  sfx: 0.85,
  muted: false,
};

export const AUDIO_PREFS_STORAGE_KEY = "starfire-armada-v2:audio-prefs";

export function clampVolume(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function sanitizeAudioPrefs(raw: unknown): AudioPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_AUDIO_PREFS };
  const r = raw as Partial<AudioPrefs>;
  return {
    master: typeof r.master === "number" ? clampVolume(r.master) : DEFAULT_AUDIO_PREFS.master,
    music: typeof r.music === "number" ? clampVolume(r.music) : DEFAULT_AUDIO_PREFS.music,
    sfx: typeof r.sfx === "number" ? clampVolume(r.sfx) : DEFAULT_AUDIO_PREFS.sfx,
    muted: typeof r.muted === "boolean" ? r.muted : DEFAULT_AUDIO_PREFS.muted,
  };
}

/** Reads persisted prefs. Safe to call outside a browser (returns defaults). */
export function loadAudioPrefs(storage: Pick<Storage, "getItem"> | undefined = safeLocalStorage()): AudioPrefs {
  if (!storage) return { ...DEFAULT_AUDIO_PREFS };
  try {
    const raw = storage.getItem(AUDIO_PREFS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AUDIO_PREFS };
    return sanitizeAudioPrefs(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_AUDIO_PREFS };
  }
}

export function saveAudioPrefs(
  prefs: AudioPrefs,
  storage: Pick<Storage, "setItem"> | undefined = safeLocalStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(AUDIO_PREFS_STORAGE_KEY, JSON.stringify(sanitizeAudioPrefs(prefs)));
  } catch {
    /* storage unavailable — presentation-only, safe to ignore */
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof window !== "undefined" ? window.localStorage : undefined;
  } catch {
    return undefined;
  }
}

/** Minimum ms between repeats of a throttled sound key. */
const THROTTLE_MS: Record<string, number> = {
  playerShot: 70,
  playerShotHeavy: 90,
  enemyShot: 90,
  impact: 55,
  impactHeavy: 90,
  explosionSmall: 40,
  explosionMedium: 60,
  warning: 1500,
};

/** Max simultaneous voices for a given synthesized category (voice pooling). */
const VOICE_CAP: Record<string, number> = {
  playerShot: 4,
  impact: 5,
  explosionSmall: 3,
  explosionMedium: 3,
};

type Ctx = AudioContext;

export class RapidFireAudioSystem {
  private ctx: Ctx | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicNodes: { stop: () => void } | null = null;
  private unlocked = false;
  private prefs: AudioPrefs;
  private lastPlayed: Record<string, number> = {};
  private activeVoices: Record<string, number> = {};
  private duckAmount = 0;

  constructor(initialPrefs: AudioPrefs = loadAudioPrefs()) {
    this.prefs = sanitizeAudioPrefs(initialPrefs);
  }

  getPrefs(): AudioPrefs {
    return { ...this.prefs };
  }

  setPrefs(next: Partial<AudioPrefs>): void {
    this.prefs = sanitizeAudioPrefs({ ...this.prefs, ...next });
    saveAudioPrefs(this.prefs);
    this.applyGains();
  }

  /** Must be called from within a real user-gesture handler (pointerdown). */
  unlock(): void {
    if (this.unlocked) return;
    if (typeof window === "undefined") return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.masterGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.connect(this.masterGain);
    this.sfxGain.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);
    this.unlocked = true;
    this.applyGains();
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private applyGains(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const m = this.prefs.muted ? 0 : clampVolume(this.prefs.master);
    const musicLevel = clampVolume(this.prefs.music) * (1 - this.duckAmount);
    this.masterGain.gain.setTargetAtTime(m, now, 0.05);
    this.musicGain.gain.setTargetAtTime(musicLevel, now, 0.15);
    this.sfxGain.gain.setTargetAtTime(clampVolume(this.prefs.sfx), now, 0.05);
  }

  /** Duck music under pause/dense combat (0 = full volume, 1 = silent). */
  setDuck(amount: number): void {
    this.duckAmount = clampVolume(amount);
    this.applyGains();
  }

  destroy(): void {
    this.stopMusic();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.unlocked = false;
  }

  // ---------------------------------------------------------------------
  // Throttling / pooling helpers
  // ---------------------------------------------------------------------

  private allowed(key: string): boolean {
    const now = this.ctx?.currentTime ?? 0;
    const minGapS = (THROTTLE_MS[key] ?? 40) / 1000;
    const last = this.lastPlayed[key] ?? -Infinity;
    if (now - last < minGapS) return false;
    const cap = VOICE_CAP[key];
    if (cap != null && (this.activeVoices[key] ?? 0) >= cap) return false;
    this.lastPlayed[key] = now;
    return true;
  }

  private trackVoice(key: string, durationS: number): void {
    this.activeVoices[key] = (this.activeVoices[key] ?? 0) + 1;
    const ctx = this.ctx;
    if (!ctx) return;
    window.setTimeout(
      () => {
        this.activeVoices[key] = Math.max(0, (this.activeVoices[key] ?? 1) - 1);
      },
      Math.max(10, durationS * 1000),
    );
  }

  // ---------------------------------------------------------------------
  // Low-level synthesis primitives
  // ---------------------------------------------------------------------

  private tone(
    dest: GainNode,
    freqStart: number,
    freqEnd: number,
    durS: number,
    type: OscillatorType,
    peakGain: number,
  ): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    const t0 = ctx.currentTime;
    osc.frequency.setValueAtTime(freqStart, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + durS);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(peakGain, t0 + Math.min(0.01, durS * 0.2));
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durS);
    osc.connect(gain);
    gain.connect(dest);
    osc.start(t0);
    osc.stop(t0 + durS + 0.02);
  }

  private noiseBurst(dest: GainNode, durS: number, filterFreq: number, peakGain: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * durS));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    const t0 = ctx.currentTime;
    gain.gain.setValueAtTime(peakGain, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + durS);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(dest);
    src.start(t0);
  }

  // ---------------------------------------------------------------------
  // Event-mapped sound effects (see docs completion report §sound mapping)
  // ---------------------------------------------------------------------

  playerShot(heavy = false): void {
    if (!this.ctx || !this.sfxGain) return;
    const key = heavy ? "playerShotHeavy" : "playerShot";
    if (!this.allowed(key)) return;
    const jitter = 0.94 + Math.random() * 0.12;
    this.tone(this.sfxGain, heavy ? 620 * jitter : 900 * jitter, heavy ? 260 : 480, heavy ? 0.14 : 0.07, "square", heavy ? 0.16 : 0.08);
    this.trackVoice(key, 0.15);
  }

  enemyShot(): void {
    if (!this.ctx || !this.sfxGain) return;
    if (!this.allowed("enemyShot")) return;
    const jitter = 0.92 + Math.random() * 0.16;
    this.tone(this.sfxGain, 340 * jitter, 160, 0.12, "sawtooth", 0.07);
  }

  impact(heavy = false): void {
    if (!this.ctx || !this.sfxGain) return;
    const key = heavy ? "impactHeavy" : "impact";
    if (!this.allowed(key)) return;
    this.noiseBurst(this.sfxGain, heavy ? 0.09 : 0.05, heavy ? 2600 : 4200, heavy ? 0.22 : 0.12);
    this.trackVoice(key, 0.1);
  }

  explosion(size: "small" | "medium"): void {
    if (!this.ctx || !this.sfxGain) return;
    const key = size === "small" ? "explosionSmall" : "explosionMedium";
    if (!this.allowed(key)) return;
    const dur = size === "small" ? 0.32 : 0.55;
    this.noiseBurst(this.sfxGain, dur, size === "small" ? 1800 : 1100, size === "small" ? 0.3 : 0.42);
    this.tone(this.sfxGain, size === "small" ? 180 : 110, 40, dur * 0.9, "sine", size === "small" ? 0.22 : 0.34);
    this.trackVoice(key, dur);
  }

  playerDamage(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.noiseBurst(this.sfxGain, 0.18, 1500, 0.28);
    this.tone(this.sfxGain, 220, 90, 0.22, "triangle", 0.2);
  }

  pickupCollect(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.tone(this.sfxGain, 520, 1180, 0.18, "sine", 0.18);
  }

  maxFirepowerActivate(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.tone(this.sfxGain, 200, 900, 0.4, "sawtooth", 0.22);
    this.noiseBurst(this.sfxGain, 0.3, 3200, 0.18);
  }

  waveStart(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.tone(this.sfxGain, 440, 660, 0.22, "triangle", 0.14);
  }

  warning(): void {
    if (!this.ctx || !this.sfxGain) return;
    if (!this.allowed("warning")) return;
    this.tone(this.sfxGain, 700, 700, 0.12, "square", 0.16);
    window.setTimeout(() => this.tone(this.sfxGain!, 700, 700, 0.12, "square", 0.16), 160);
  }

  pauseCue(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.tone(this.sfxGain, 500, 260, 0.14, "sine", 0.12);
    this.setDuck(0.65);
  }

  resumeCue(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.tone(this.sfxGain, 300, 520, 0.14, "sine", 0.12);
    this.setDuck(0);
  }

  victory(): void {
    if (!this.ctx || !this.sfxGain) return;
    [0, 0.12, 0.24].forEach((delay, i) => {
      window.setTimeout(() => this.tone(this.sfxGain!, 440 + i * 150, 440 + i * 150, 0.3, "triangle", 0.16), delay * 1000);
    });
    this.stopMusic(0.5);
  }

  defeat(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.tone(this.sfxGain, 260, 90, 0.7, "sawtooth", 0.2);
    this.stopMusic(0.5);
  }

  uiClick(): void {
    if (!this.ctx || !this.sfxGain) return;
    this.tone(this.sfxGain, 700, 700, 0.05, "square", 0.06);
  }

  // ---------------------------------------------------------------------
  // Looping ambient combat bed
  // ---------------------------------------------------------------------

  startMusic(): void {
    if (!this.ctx || !this.musicGain || this.musicNodes) return;
    const ctx = this.ctx;
    const drone1 = ctx.createOscillator();
    const drone2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const bedGain = ctx.createGain();
    drone1.type = "sine";
    drone2.type = "sine";
    drone1.frequency.value = 82;
    drone2.frequency.value = 82 * 1.5; // fifth above — restrained, not melodic
    lfo.type = "sine";
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.4;
    bedGain.gain.value = 0.5;
    lfo.connect(lfoGain);
    lfoGain.connect(bedGain.gain);
    drone1.connect(bedGain);
    drone2.connect(bedGain);
    bedGain.connect(this.musicGain);
    drone1.start();
    drone2.start();
    lfo.start();
    this.musicNodes = {
      stop: () => {
        drone1.stop();
        drone2.stop();
        lfo.stop();
      },
    };
  }

  stopMusic(fadeS = 0.2): void {
    if (!this.musicNodes) return;
    const nodes = this.musicNodes;
    this.musicNodes = null;
    window.setTimeout(() => nodes.stop(), Math.max(10, fadeS * 1000));
  }
}
