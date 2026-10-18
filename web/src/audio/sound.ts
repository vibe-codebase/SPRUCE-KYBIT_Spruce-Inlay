/**
 * Inlay sound, synthesised with Web Audio: wood sliding on wood, a hollow knock as a piece meets the frame or its
 * neighbour, a soft click as it settles in its cell, a marimba when the jewel slips free, and under it a quiet
 * room: rain on the window and a slow, warm piano.
 */
const PENTA = [0, 2, 4, 7, 9];
export function noteHz(degree: number) { const o = Math.floor(degree / 5), s = PENTA[((degree % 5) + 5) % 5] + o * 12; return 261.63 * Math.pow(2, s / 12); }

export class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private music!: GainNode;
  private sfx!: GainNode;
  private verb!: ConvolverNode;
  private noise!: AudioBuffer;
  private timer: number | null = null;
  private next = 0;
  private beatN = 0;
  private chapter = 0;
  private musicVol = 0.6;
  private sfxVol = 0.8;
  private ducked = false;
  private rub: { g: GainNode; bp: BiquadFilterNode } | null = null;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      this.ctx = ctx;
      this.master = ctx.createGain(); this.master.gain.value = 0.9;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 3;
      this.master.connect(comp).connect(ctx.destination);
      this.music = ctx.createGain(); this.sfx = ctx.createGain();
      this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(1.8);
      const wet = ctx.createGain(); wet.gain.value = 0.3;
      this.verb.connect(wet).connect(this.master);
      this.music.connect(this.master); this.music.connect(this.verb);
      this.sfx.connect(this.master); this.sfx.connect(this.verb);
      this.noise = this.makeNoise();
      // the rub of wood on wood while a piece is dragged
      const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 1.2;
      const g = ctx.createGain(); g.gain.value = 0; src.connect(bp).connect(g).connect(this.sfx); src.start();
      this.rub = { g, bp };
      // rain on the window, always there, very soft
      const rain = ctx.createBufferSource(); rain.buffer = this.noise; rain.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800;
      const rg = ctx.createGain(); rg.gain.value = 0.012; rain.connect(hp).connect(rg).connect(this.music); rain.start();
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }
  setVolumes(music: number, sfx: number) { this.musicVol = music; this.sfxVol = sfx; this.applyVolumes(); }
  private applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.music.gain.setTargetAtTime(this.musicVol * 0.5 * (this.ducked ? 0.6 : 1), t, 0.3);
    this.sfx.gain.setTargetAtTime(this.sfxVol, t, 0.05);
  }
  duck(on: boolean) { this.ducked = on; this.applyVolumes(); }
  suspend() { void this.ctx?.suspend(); }
  resume() { if (this.ctx?.state === 'suspended') void this.ctx.resume(); }

  startMusic(chapter: number) {
    if (!this.ctx) return;
    if (this.timer !== null && chapter === this.chapter) return;
    this.chapter = chapter;
    this.next = this.ctx.currentTime + 0.4;
    if (this.timer === null) this.timer = window.setInterval(() => this.schedule(), 150);
  }
  /** A slow piano: a bass note and a broken chord every two beats, now and then a falling phrase. */
  private schedule() {
    const ctx = this.ctx!;
    const prog = [[[-5, 0, 2, 4], [-4, 0, 3, 5], [-6, -1, 2, 4], [-3, 0, 2, 5]], [[-4, 0, 2, 5], [-5, -1, 2, 4], [-6, 0, 3, 5], [-5, 0, 2, 4]], [[-6, -1, 1, 4], [-5, 0, 2, 4], [-7, -1, 2, 3], [-6, 0, 1, 4]]][this.chapter % 3];
    const beat = 0.85;
    while (this.next < ctx.currentTime + 1) {
      const t = this.next, bar = Math.floor(this.beatN / 4), pos = this.beatN % 4, ch = prog[bar % prog.length];
      if (pos === 0) this.piano(t, noteHz(ch[0]), 0.035, 3.4);
      if (pos === 1) ch.slice(1).forEach((d, i) => this.piano(t + i * 0.12, noteHz(d), 0.016, 2.6));
      if (pos === 3 && bar % 3 === 2) [7, 6, 5].forEach((d, i) => this.piano(t + i * 0.28, noteHz(d + ch[1]), 0.012, 2));
      this.next += beat; this.beatN++;
    }
  }
  private piano(t: number, f: number, vol: number, dur: number) {
    const ctx = this.ctx!, lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(600, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    for (const [m, ty] of [[1, 'triangle'], [2, 'sine'], [1.003, 'sine']] as [number, OscillatorType][]) { const o = ctx.createOscillator(); o.type = ty; o.frequency.value = f * m; o.connect(lp); o.start(t); o.stop(t + dur + 0.05); }
    lp.connect(g).connect(this.music);
  }
  private hiss(t: number, dur: number, vol: number, freq: number, q = 1, bus?: GainNode) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource(); src.buffer = this.noise;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.value = freq;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g).connect(bus ?? this.sfx); src.start(t, Math.random()); src.stop(t + dur + 0.05);
  }
  /** A hollow wooden knock: a short resonant body and a click. */
  private knock(t: number, f: number, vol: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f * 1.4, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.03);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(this.sfx); o.start(t); o.stop(t + 0.15);
    this.hiss(t, 0.03, vol * 0.6, 3000, 2);
  }
  /** Marimba: a woody bar with its fourth-octave overtone. */
  private marimba(t: number, f: number, vol: number) {
    const ctx = this.ctx!;
    [[1, 1, 0.9], [4, 0.25, 0.15]].forEach(([m, v, d]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f * m; g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(g).connect(this.sfx); o.start(t); o.stop(t + d + 0.05); });
  }
  /** Wood rubbing while a piece moves, speed 0..1. */
  slide(speed: number) { if (this.ctx && this.rub) { const t = this.ctx.currentTime; this.rub.g.gain.setTargetAtTime(Math.min(0.05, speed * 0.05), t, 0.03); this.rub.bp.frequency.setTargetAtTime(500 + speed * 700, t, 0.05); } }
  settle(cells: number) { if (this.ctx) { const t = this.ctx.currentTime; this.knock(t, 180 + cells * 10, 0.09); } }
  bump() { if (this.ctx) this.knock(this.ctx.currentTime, 140, 0.05); }
  pick() { if (this.ctx) this.hiss(this.ctx.currentTime, 0.04, 0.02, 2200, 3); }
  tap() { if (this.ctx) this.knock(this.ctx.currentTime, 420, 0.03); }
  undo() { if (this.ctx) { const t = this.ctx.currentTime; this.knock(t, 220, 0.04); this.knock(t + 0.07, 260, 0.03); } }
  hint() { if (this.ctx) { const t = this.ctx.currentTime; this.marimba(t, noteHz(7), 0.05); this.marimba(t + 0.1, noteHz(9), 0.04); } }
  /** The jewel slips free: a rising marimba run and a chord. */
  free() { if (this.ctx) { const t = this.ctx.currentTime; [0, 2, 4, 5, 7, 10].forEach((d, i) => this.marimba(t + i * 0.09, noteHz(d), 0.07)); [5, 7, 9].forEach((d) => this.marimba(t + 0.7, noteHz(d), 0.05)); this.hiss(t + 0.6, 1.5, 0.01, 6000, 0.5); } }
  star(i: number) { if (this.ctx) this.marimba(this.ctx.currentTime, noteHz([7, 9, 12][i] ?? 12), 0.07); }

  private makeNoise() {
    const ctx = this.ctx!;
    const b = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const b = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.8); }
    return b;
  }
}
export const sound = new Sound();
