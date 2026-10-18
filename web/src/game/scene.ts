import Phaser from 'phaser';
import * as A from './art';
import { LEVELS, type Level } from './levels';
import { DX, DY, apply, room, solve, solved, start, starsFor, type Dir, type Move, type Pos } from './sim';
import { sound } from '../audio/sound';

export type Result = { moves: number; par: number; stars: number; hinted: boolean };
export type Finish = { level: Level; result: Result };
type Hooks = { onFinish?: (f: Finish) => void; onFirstAction?: () => void; onHaptic?: (s: 'light' | 'medium' | 'success' | 'warning') => void };
export type HudState = { phase: 'play' | 'busy' | 'done'; moves: number; par: number; canUndo: boolean; hints: number; msg: string; msgId: number };

/** Bridge between React and the Phaser scene. */
export const box = {
  hooks: {} as Hooks,
  scene: null as BoxScene | null,
  reducedMotion: false,
  show(mode: 'menu' | 'play', level: Level) { this.scene?.show(mode, level); },
  setPaused(p: boolean) { this.scene?.setPaused(p); },
  state(): HudState | null { return this.scene?.hudState() ?? null; },
  undo() { this.scene?.undo(); },
  hint() { this.scene?.hint(); },
  restart() { this.scene?.restart(); },
  debug() { return this.scene?.debugState(); },
  /** QA only: the CSS centre of a piece, the size of a cell, and the fewest moves from here. */
  qaPiece(i: number) { return this.scene?.qaPiece(i); },
  solvePath() { return this.scene ? solve(this.scene.level, this.scene.pos) : null; },
};
(window as unknown as { __box: typeof box }).__box = box;

const VIEW_W = 360;
const SHOWCASE = ['w8', 'e7', 'r6', 'e4', 'w6'];
type Drag = { i: number; sx: number; sy: number; axis: 'x' | 'y' | null; lim: Record<Dir, number>; off: number; last: number; lastT: number };

export class BoxScene extends Phaser.Scene {
  level: Level = LEVELS[0];
  pos: Pos = start(LEVELS[0]);
  private mode: 'menu' | 'play' = 'menu';
  private phase: 'play' | 'done' = 'play';
  private paused = false;
  private acted = false;
  private texSeq = 0;
  private r = 2;
  private viewW = VIEW_W; private viewH = 700;
  private cs = 60; private fw = 24; private ox = 0; private oy = 0;
  private history: Pos[] = [];
  private moves = 0; private hints = 0;
  private imgs: Phaser.GameObjects.Image[] = [];
  private drag: Drag | null = null;
  private busy = false;
  private fx!: Phaser.GameObjects.Graphics; private shine!: Phaser.GameObjects.Image;
  private msg = ''; private msgId = 0;
  private clock = 0; private hintMove: Move | null = null; private hintT = -9; private winT = -9;
  private demo: { path: Move[]; k: number; wait: number } | null = null;

  constructor() { super('box'); }

  create() {
    box.scene = this;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.down(p));
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => this.move(p));
    this.input.on('pointerup', () => this.up());
    this.input.on('pointerupoutside', () => this.up());
    this.scale.on('resize', () => this.rebuild());
    this.show('menu', LEVELS.find((l) => l.id === SHOWCASE[0]) ?? LEVELS[LEVELS.length - 1]);
  }
  isMenu() { return this.mode === 'menu'; }
  setPaused(p: boolean) { this.paused = p; if (p) this.up(); }
  hudState(): HudState { return { phase: this.phase === 'done' ? 'done' : this.busy || this.drag ? 'busy' : 'play', moves: this.moves, par: this.level.par, canUndo: this.history.length > 0 && this.phase === 'play', hints: this.hints, msg: this.msg, msgId: this.msgId }; }
  debugState() { return { ...this.hudState(), mode: this.mode, pos: this.pos.slice() }; }
  qaPiece(i: number) {
    const z = this.cameras.main.zoom, kk = (this.game.canvas.clientWidth || VIEW_W) / this.scale.width, p = this.level.pieces[i];
    const x = this.ox + (this.pos[i * 2] + p.w / 2) * this.cs, y = this.oy + (this.pos[i * 2 + 1] + p.h / 2) * this.cs;
    return { x: x * z * kk, y: y * z * kk, cell: this.cs * z * kk };
  }
  private say(m: string) { this.msg = m; this.msgId++; }
  private gen = 0;
  private later(ms: number, fn: () => void) { const g = this.gen; this.time.delayedCall(ms, () => { if (g === this.gen) fn(); }); }

  show(mode: 'menu' | 'play', level: Level) {
    this.mode = mode; this.level = level; this.gen++;
    this.pos = start(level); this.paused = false; this.acted = false; this.phase = 'play';
    this.history = []; this.moves = 0; this.hints = 0; this.drag = null; this.busy = false; this.msg = ''; this.hintMove = null; this.winT = -9;
    this.demo = mode === 'menu' ? { path: solve(level) ?? [], k: 0, wait: 1.3 } : null;
    this.rebuild();
  }
  restart() { if (this.mode === 'play' && this.phase === 'play' && !this.busy && this.history.length) { this.show('play', this.level); sound.undo(); } }

  // ── layout ────────────────────────────────────────────────────────────
  private tex(prefix: string, c: HTMLCanvasElement) { const key = `${prefix}-${++this.texSeq}`; this.textures.addCanvas(key, c); return key; }
  private rebuild() {
    const stale = this.textures.getTextureKeys().filter((k) => /-\d+$/.test(k));
    this.tweens.killAll();
    this.children.removeAll(true);
    if (stale.length) this.events.once('postrender', () => stale.forEach((k) => this.textures.exists(k) && this.textures.remove(k)));
    const pw = this.scale.width, ph = this.scale.height, dpr = Math.min(2, window.devicePixelRatio || 1);
    const zoom = Math.min(pw / VIEW_W, ph / 640);
    this.r = Math.min(2, Math.max(1, zoom));
    this.viewW = pw / zoom; this.viewH = ph / zoom;
    this.cameras.main.setZoom(zoom).centerOn(this.viewW / 2, this.viewH / 2);
    const css = zoom / dpr, play = this.mode === 'play', W = this.viewW, H = this.viewH, l = this.level, m = A.MOODS[l.chapter], r = this.r;
    const top = (play ? 74 : 232) / css, bottom = (play ? 100 : 196) / css, availH = H - top - bottom;
    this.cs = Math.min((W - 28) / (l.w + 0.84), availH / (l.h + 1.5), 84);
    const cs = this.cs; this.fw = cs * 0.42;
    this.ox = (W - l.w * cs) / 2; this.oy = top + (availH - (l.h + 1.5) * cs) / 2 + this.fw * 1.1;
    this.add.image(0, 0, this.tex('bg', A.backdrop(m, W, H, Math.min(r, 1.5), W / 2, this.oy + (l.h * cs) / 2))).setOrigin(0, 0).setScale(1 / Math.min(r, 1.5));
    const t = A.tray(m, l.w, l.h, cs, this.fw, l.exit.x, r);
    this.add.image(this.ox - this.fw, this.oy - this.fw, this.tex('tray', t.c)).setOrigin(0, 0).setScale(1 / r).setDepth(1);
    // the way out: a glow below the gap
    this.shine = this.add.image(this.ox + (l.exit.x + 1) * cs, this.oy + l.h * cs + this.fw * 0.6, this.tex('sh', A.glow(cs * 1.1, '255,200,120', r, 0.35))).setScale(1 / r).setBlendMode(Phaser.BlendModes.ADD).setDepth(1.5);
    let kind = 0;
    this.imgs = l.pieces.map((p, i) => {
      const c = i === 0 ? A.jewel(cs, r) : A.piece(p.w, p.h, cs, m, kind++, p.grain, r, i * 13 + l.id.charCodeAt(1));
      return this.add.image(0, 0, this.tex('pc', c)).setOrigin(0, 0).setScale(1 / r).setDepth(i === 0 ? 3 : 2);
    });
    this.fx = this.add.graphics().setDepth(5);
    this.placeAll();
  }
  private px(i: number, dx = 0, dy = 0) { return { x: this.ox + (this.pos[i * 2] + dx) * this.cs + this.cs * 0.05 - 8, y: this.oy + (this.pos[i * 2 + 1] + dy) * this.cs + this.cs * 0.05 - 8 }; }
  private placeAll() { this.imgs.forEach((img, i) => { const p = this.px(i); img.setPosition(p.x, p.y); }); }

  // ── input ─────────────────────────────────────────────────────────────
  private pieceAt(wx: number, wy: number) {
    const cx = Math.floor((wx - this.ox) / this.cs), cy = Math.floor((wy - this.oy) / this.cs);
    return this.level.pieces.findIndex((p, i) => cx >= this.pos[i * 2] && cx < this.pos[i * 2] + p.w && cy >= this.pos[i * 2 + 1] && cy < this.pos[i * 2 + 1] + p.h);
  }
  private down(p: Phaser.Input.Pointer) {
    if (this.mode !== 'play' || this.paused || this.phase !== 'play' || this.busy) return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y), i = this.pieceAt(w.x, w.y);
    if (i < 0) return;
    if (!this.acted) { this.acted = true; box.hooks.onFirstAction?.(); }
    const lim = { U: room(this.level, this.pos, i, 'U'), D: room(this.level, this.pos, i, 'D'), L: room(this.level, this.pos, i, 'L'), R: room(this.level, this.pos, i, 'R') };
    this.drag = { i, sx: w.x, sy: w.y, axis: null, lim, off: 0, last: 0, lastT: this.clock };
    this.imgs[i].setDepth(4); sound.pick(); this.hintMove = null;
    if (!lim.U && !lim.D && !lim.L && !lim.R) { this.wiggle(i); sound.bump(); }
  }
  private move(p: Phaser.Input.Pointer) {
    const d = this.drag; if (!d) return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y), dx = (w.x - d.sx) / this.cs, dy = (w.y - d.sy) / this.cs;
    // pick the axis once the finger has clearly moved, and let it change while the piece is still at home
    if (Math.abs(d.off) < 0.12) { const ax = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; if (Math.max(Math.abs(dx), Math.abs(dy)) > 0.12) d.axis = ax; }
    if (!d.axis) return;
    const raw = d.axis === 'x' ? dx : dy, lo = -(d.axis === 'x' ? d.lim.L : d.lim.U), hi = d.axis === 'x' ? d.lim.R : d.lim.D;
    // a little give at the ends, like wood meeting wood
    const clamped = raw < lo ? lo - Math.min(0.06, (lo - raw) * 0.15) : raw > hi ? hi + Math.min(0.06, (raw - hi) * 0.15) : raw;
    if ((raw < lo - 0.05 && d.off > lo - 0.02) || (raw > hi + 0.05 && d.off < hi + 0.02)) { if (Math.abs(raw - d.off) > 0.1) sound.bump(); }
    const speed = Math.abs(clamped - d.off) / Math.max(0.016, this.clock - d.lastT) / 8;
    d.off = clamped; d.lastT = this.clock;
    sound.slide(Math.min(1, speed));
    const pp = this.px(d.i, d.axis === 'x' ? d.off : 0, d.axis === 'y' ? d.off : 0); this.imgs[d.i].setPosition(pp.x, pp.y);
  }
  private up() {
    const d = this.drag; if (!d) return; this.drag = null; sound.slide(0);
    const n = Math.round(d.off);
    if (!n || !d.axis) { this.snapBack(d.i); return; }
    const dir: Dir = d.axis === 'x' ? (n > 0 ? 'R' : 'L') : n > 0 ? 'D' : 'U';
    this.commit({ piece: d.i, dir, n: Math.abs(n) }, true);
  }
  private snapBack(i: number) { const p = this.px(i); this.tweens.add({ targets: this.imgs[i], x: p.x, y: p.y, duration: 90, ease: 'Quad.easeOut', onComplete: () => this.imgs[i].setDepth(i === 0 ? 3 : 2) }); }
  private wiggle(i: number) { const p = this.px(i); this.tweens.add({ targets: this.imgs[i], x: p.x + 3, duration: 50, yoyo: true, repeat: 1, onComplete: () => this.imgs[i].setPosition(p.x, p.y) }); }
  /** Make a move: record it, settle the piece into its cells, and check for the jewel's escape. */
  private commit(m: Move, fromDrag: boolean) {
    if (this.mode === 'play') this.history.push(this.pos.slice());
    this.moves++; this.pos = apply(this.pos, m); this.hintMove = null;
    const i = m.piece, p = this.px(i);
    this.busy = true;
    this.tweens.add({ targets: this.imgs[i], x: p.x, y: p.y, duration: fromDrag ? 90 : 160 + m.n * 60, ease: fromDrag ? 'Quad.easeOut' : 'Cubic.easeInOut', onComplete: () => {
      this.busy = false; this.imgs[i].setDepth(i === 0 ? 3 : 2); sound.settle(m.n); box.hooks.onHaptic?.('light');
      if (solved(this.level, this.pos)) this.win();
    } });
  }
  undo() {
    if (this.mode !== 'play' || this.busy || this.drag || this.phase !== 'play' || !this.history.length) return;
    this.pos = this.history.pop()!; this.moves = Math.max(0, this.moves - 1); this.hintMove = null;
    this.imgs.forEach((img, i) => { const p = this.px(i); this.tweens.add({ targets: img, x: p.x, y: p.y, duration: 140, ease: 'Quad.easeOut' }); });
    sound.undo();
  }
  hint() {
    if (this.mode !== 'play' || this.busy || this.drag || this.phase !== 'play') return;
    const path = solve(this.level, this.pos); if (!path || !path.length) return;
    this.hints++; this.hintMove = path[0]; this.hintT = this.clock;
    const word = { U: 'up', D: 'down', L: 'left', R: 'right' }[path[0].dir];
    this.say(`Slide the glowing piece ${word}${path[0].n > 1 ? ` ${path[0].n} spaces` : ''}. ${path.length === 1 ? 'That frees the jewel.' : `${path.length} moves to go.`}`);
    sound.hint();
  }
  private win() {
    this.phase = 'done'; this.winT = this.clock;
    sound.free(); box.hooks.onHaptic?.('success');
    // the jewel slips out through the gap
    const j = this.imgs[0]; this.tweens.add({ targets: j, y: j.y + this.cs * 2.2, alpha: 0.0, duration: 1100, delay: 250, ease: 'Cubic.easeIn' });
    const st = Math.min(starsFor(this.moves, this.level.par), this.hints ? 2 : 3);
    if (this.mode === 'play') this.later(1800, () => box.hooks.onFinish?.({ level: this.level, result: { moves: this.moves, par: this.level.par, stars: st, hinted: this.hints > 0 } }));
    else this.later(3000, () => { const i = (SHOWCASE.indexOf(this.level.id) + 1) % SHOWCASE.length; this.show('menu', LEVELS.find((x) => x.id === SHOWCASE[i]) ?? LEVELS[0]); });
  }

  // ── frame ─────────────────────────────────────────────────────────────
  update(_t: number, dms: number) {
    const dt = Math.min(0.05, dms / 1000);
    if (!this.paused) this.clock += dt;
    if (this.mode === 'menu') this.runDemo(dt);
    const fx = this.fx, cs = this.cs; fx.clear();
    this.shine.setAlpha(this.phase === 'done' ? 1 : 0.55 + 0.25 * Math.sin(this.clock * 2));
    // a hint: the piece glows and an arrow shows where it goes
    const he = this.clock - this.hintT;
    if (this.hintMove && he < 6 && this.phase === 'play' && !this.drag) {
      const m = this.hintMove, p = this.level.pieces[m.piece], x = this.ox + this.pos[m.piece * 2] * cs, y = this.oy + this.pos[m.piece * 2 + 1] * cs, a = Math.min(1, he * 3) * (0.6 + 0.4 * Math.sin(he * 6));
      fx.lineStyle(3, 0xffd27a, a); fx.strokeRoundedRect(x + 2, y + 2, p.w * cs - 4, p.h * cs - 4, cs * 0.14);
      const tx = x + DX[m.dir] * m.n * cs, ty = y + DY[m.dir] * m.n * cs;
      fx.lineStyle(2, 0xffd27a, a * 0.55); fx.strokeRoundedRect(tx + 4, ty + 4, p.w * cs - 8, p.h * cs - 8, cs * 0.14);
      const cx = x + (p.w * cs) / 2, cy = y + (p.h * cs) / 2, ex = cx + DX[m.dir] * m.n * cs, ey = cy + DY[m.dir] * m.n * cs;
      fx.lineStyle(3, 0xffd27a, a); fx.lineBetween(cx, cy, ex, ey);
      const s = cs * 0.16; fx.fillStyle(0xffd27a, a); fx.fillTriangle(ex + DX[m.dir] * s, ey + DY[m.dir] * s, ex - DY[m.dir] * s, ey + DX[m.dir] * s, ex + DY[m.dir] * s, ey - DX[m.dir] * s);
    }
    if (this.phase === 'done') { const e = Math.min(1, (this.clock - this.winT) / 1.4), gx = this.ox + (this.level.exit.x + 1) * cs, gy = this.oy + this.level.h * cs; fx.lineStyle(2, 0xffe0a0, 0.7 * (1 - e)); fx.strokeCircle(gx, gy, cs * (0.4 + e * 1.4)); }
  }

  // ── attract mode ──────────────────────────────────────────────────────
  private runDemo(dt: number) {
    const d = this.demo; if (!d || this.busy || this.phase !== 'play') return;
    d.wait -= dt; if (d.wait > 0) return;
    if (d.k < d.path.length) { this.commit(d.path[d.k++], false); d.wait = 0.35; }
  }
}

export function startGame(parent: HTMLElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#1a120c',
    scale: { mode: Phaser.Scale.NONE, width: parent.clientWidth * dpr, height: parent.clientHeight * dpr, zoom: 1 / dpr },
    render: { antialias: true, pixelArt: false, powerPreference: 'high-performance' },
    audio: { noAudio: true },
    fps: { target: 60, smoothStep: false },
    input: { activePointers: 1 },
    scene: [BoxScene],
    banner: false,
  });
  const onResize = () => {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    game.scale.setZoom(1 / d);
    game.scale.resize(parent.clientWidth * d, parent.clientHeight * d);
  };
  window.addEventListener('resize', onResize);
  return () => { window.removeEventListener('resize', onResize); game.destroy(true); };
}
