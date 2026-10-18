/**
 * Inlay art, painted with Canvas 2D: a puzzle box of fine woods on a cloth, seen from above. A mitred frame with a
 * gap in it; carved pieces with bevelled edges, figured grain and small marquetry motifs; pieces cut along the grain
 * carry engraved grooves and a brass arrow; the jewel piece is red lacquer bound in gold with a ruby at its heart.
 */
export type Wood = { base: [string, string]; line: string; inlay: string };
export type Mood = { name: string; cloth: [string, string]; light: string; frame: Wood; floor: [string, string]; woods: Wood[] };
const WALNUT: Wood = { base: ['#7a4e30', '#4e2e1a'], line: 'rgba(30,14,6,', inlay: '#e8d3a8' };
const MAPLE: Wood = { base: ['#e6c896', '#c49e6a'], line: 'rgba(120,80,40,', inlay: '#6a3a22' };
const CHERRY: Wood = { base: ['#b2603c', '#7e3a22'], line: 'rgba(60,20,8,', inlay: '#f0dcb0' };
const ROSE: Wood = { base: ['#8a3a2c', '#521c16'], line: 'rgba(30,6,4,', inlay: '#f2d8a0' };
const SATIN: Wood = { base: ['#e8c870', '#b89040'], line: 'rgba(110,70,20,', inlay: '#5a2a1a' };
const EBONY: Wood = { base: ['#3a3230', '#161212'], line: 'rgba(0,0,0,', inlay: '#d8b860' };
const OLIVE: Wood = { base: ['#c8b07a', '#8e7448'], line: 'rgba(60,40,14,', inlay: '#3a2410' };
export const MOODS: Mood[] = [
  { name: 'walnut', cloth: ['#2f5a44', '#183a2a'], light: '255,236,190', frame: WALNUT, floor: ['#3a2416', '#24160c'], woods: [MAPLE, CHERRY, OLIVE] },
  { name: 'rosewood', cloth: ['#24345e', '#121c3a'], light: '220,230,255', frame: ROSE, floor: ['#2a1210', '#180a08'], woods: [SATIN, MAPLE, ROSE] },
  { name: 'ebony', cloth: ['#5e2230', '#34101a'], light: '255,220,190', frame: EBONY, floor: ['#1a1412', '#0c0a08'], woods: [OLIVE, SATIN, CHERRY] },
];
export function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return { c, g: c.getContext('2d')! };
}
export const hash = (a: number, b: number) => { let h = Math.imul(a + 0x9e3779b9, 374761393) ^ Math.imul(b + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
const TAU = Math.PI * 2;

/** Figured wood grain in a rect, running across (`h`) or down (`v`). */
function grain(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, wood: Wood, dir: 'h' | 'v', seed: number, strong = false) {
  const gr = g.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, wood.base[0]); gr.addColorStop(1, wood.base[1]);
  g.fillStyle = gr; g.fillRect(x, y, w, h);
  const along = dir === 'h' ? w : h, across = dir === 'h' ? h : w, n = Math.max(6, Math.round(across / 2.6));
  for (let k = 0; k < n; k++) {
    const o = (k + hash(k, seed) * 0.8) * (across / n), amp = across * 0.03 * (0.5 + hash(k, seed + 1)), f = 1 + hash(k, seed + 2) * 3, ph = hash(k, seed + 3) * TAU;
    g.strokeStyle = `${wood.line}${(strong ? 0.22 : 0.12) + hash(k, seed + 4) * 0.12})`; g.lineWidth = 0.5 + hash(k, seed + 5) * (strong ? 1.4 : 0.9);
    g.beginPath();
    for (let s = 0; s <= 24; s++) { const a = (s / 24) * along, b = o + Math.sin((s / 24) * TAU * f / 2 + ph) * amp; const px = dir === 'h' ? x + a : x + b, py = dir === 'h' ? y + b : y + a; if (s) g.lineTo(px, py); else g.moveTo(px, py); }
    g.stroke();
  }
  // a sheen of light across the wood
  const sh = g.createLinearGradient(x, y, x + w * 0.6, y + h * 0.6); sh.addColorStop(0, 'rgba(255,255,255,0.14)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sh; g.fillRect(x, y, w, h);
}

/** The cloth the box sits on, with a pool of lamplight. */
export function backdrop(m: Mood, W: number, H: number, r: number, cx: number, cy: number) {
  const { c, g } = canvas(W * r, H * r); g.scale(r, r);
  const cl = g.createLinearGradient(0, 0, W, H); cl.addColorStop(0, m.cloth[0]); cl.addColorStop(1, m.cloth[1]);
  g.fillStyle = cl; g.fillRect(0, 0, W, H);
  // the weave
  for (let y = 0; y < H; y += 2) { g.fillStyle = `rgba(0,0,0,${0.04 + (y % 4 ? 0.02 : 0)})`; g.fillRect(0, y, W, 1); }
  for (let x = 0; x < W; x += 3) { g.fillStyle = 'rgba(255,255,255,0.018)'; g.fillRect(x, 0, 1, H); }
  for (let i = 0; i < 2000; i++) { g.fillStyle = `rgba(255,255,255,${hash(i, 2) * 0.04})`; g.fillRect(hash(i, 3) * W, hash(i, 4) * H, 1, 1); }
  const lp = g.createRadialGradient(cx, cy, 10, cx, cy, Math.max(W, H) * 0.75); lp.addColorStop(0, `rgba(${m.light},0.2)`); lp.addColorStop(0.5, `rgba(${m.light},0.05)`); lp.addColorStop(1, 'rgba(0,0,0,0.45)');
  g.fillStyle = lp; g.fillRect(0, 0, W, H);
  return c;
}

/**
 * The tray: a mitred frame of width `fw` round a floor of w×h cells of size cs, with a gap in the bottom rail under
 * the exit. Origin of the cells at (ox, oy) in a canvas that also holds the frame.
 */
export function tray(m: Mood, w: number, h: number, cs: number, fw: number, exitX: number, r: number) {
  const W = w * cs + fw * 2, H = h * cs + fw * 2 + fw * 0.4, { c, g } = canvas(W * r, (H + fw) * r); g.scale(r, r);
  const ox = fw, oy = fw;
  // shadow under the box
  g.save(); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = fw * 1.4; g.shadowOffsetY = fw * 0.5; g.fillStyle = '#000'; g.beginPath(); g.roundRect(2, 2, W - 4, h * cs + fw * 2 - 4, fw * 0.5); g.fill(); g.restore();
  // the four rails, mitred, grain running along each
  const rails: [number, number, number, number, 'h' | 'v', [number, number][]][] = [
    [0, 0, W, fw, 'h', [[0, 0], [W, 0], [W - fw, fw], [fw, fw]]],
    [0, oy + h * cs, W, fw, 'h', [[fw, oy + h * cs], [W - fw, oy + h * cs], [W, oy + h * cs + fw], [0, oy + h * cs + fw]]],
    [0, 0, fw, h * cs + fw * 2, 'v', [[0, 0], [fw, fw], [fw, oy + h * cs], [0, oy + h * cs + fw]]],
    [W - fw, 0, fw, h * cs + fw * 2, 'v', [[W, 0], [W, oy + h * cs + fw], [W - fw, oy + h * cs], [W - fw, fw]]],
  ];
  rails.forEach(([x, y, rw, rh, d, poly], k) => {
    g.save(); g.beginPath(); poly.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.clip();
    grain(g, x, y, rw, rh, m.frame, d, 40 + k, true);
    g.restore();
  });
  // bevel lines on the frame, the mitres, and a brass stringing line inlaid along the rails
  g.strokeStyle = 'rgba(255,255,255,0.22)'; g.lineWidth = 1; g.strokeRect(0.5, 0.5, W - 1, h * cs + fw * 2 - 1);
  g.strokeStyle = 'rgba(0,0,0,0.45)'; g.beginPath(); for (const [a, b] of [[[0, 0], [fw, fw]], [[W, 0], [W - fw, fw]], [[0, oy + h * cs + fw], [fw, oy + h * cs]], [[W, oy + h * cs + fw], [W - fw, oy + h * cs]]] as [number, number][][]) { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); } g.stroke();
  g.strokeStyle = 'rgba(232,200,120,0.55)'; g.lineWidth = 1.2; g.strokeRect(fw * 0.42, fw * 0.42, W - fw * 0.84, h * cs + fw * 1.16);
  // the floor of the tray, in shadow at its edges
  const fl = g.createLinearGradient(ox, oy, ox, oy + h * cs); fl.addColorStop(0, m.floor[0]); fl.addColorStop(1, m.floor[1]);
  g.fillStyle = fl; g.fillRect(ox, oy, w * cs, h * cs);
  for (let k = 0; k < 10; k++) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.lineWidth = 1; g.beginPath(); g.moveTo(ox, oy + (k + 0.5) * (h * cs) / 10); g.lineTo(ox + w * cs, oy + (k + 0.5) * (h * cs) / 10 + hash(k, 3) * 4); g.stroke(); }
  g.strokeStyle = 'rgba(255,255,255,0.05)'; for (let x = 1; x < w; x++) { g.beginPath(); g.moveTo(ox + x * cs, oy); g.lineTo(ox + x * cs, oy + h * cs); g.stroke(); } for (let y = 1; y < h; y++) { g.beginPath(); g.moveTo(ox, oy + y * cs); g.lineTo(ox + w * cs, oy + y * cs); g.stroke(); }
  const inner = g.createLinearGradient(0, oy, 0, oy + fw * 0.6); inner.addColorStop(0, 'rgba(0,0,0,0.55)'); inner.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = inner; g.fillRect(ox, oy, w * cs, fw * 0.6);
  const innerL = g.createLinearGradient(ox, 0, ox + fw * 0.5, 0); innerL.addColorStop(0, 'rgba(0,0,0,0.4)'); innerL.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = innerL; g.fillRect(ox, oy, fw * 0.5, h * cs);
  // the gap in the bottom rail: cut away, with the cloth showing through, and brass caps on the cut ends
  const gx = ox + exitX * cs, gy = oy + h * cs;
  g.clearRect(gx, gy, cs * 2, fw + 1);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(gx, gy, cs * 2, fw * 0.35);
  const brass = g.createLinearGradient(0, gy, 0, gy + fw); brass.addColorStop(0, '#f6dc94'); brass.addColorStop(1, '#8a6224');
  g.fillStyle = brass; g.fillRect(gx - 3, gy, 3, fw); g.fillRect(gx + cs * 2, gy, 3, fw);
  return { c, W, H: H + fw };
}

/** A piece of w×h cells (cell size cs, inset `pad`): wood, bevel, grain grooves if it is cut along the grain, a motif. */
export function piece(pw: number, ph: number, cs: number, m: Mood, kind: number, grainDir: 'h' | 'v' | undefined, r: number, seed: number) {
  const pad = cs * 0.05, W = pw * cs - pad * 2, H = ph * cs - pad * 2, S = 8, { c, g } = canvas((W + S * 2) * r, (H + S * 2) * r); g.scale(r, r);
  const x = S, y = S, rad = cs * 0.12, wood = m.woods[kind % m.woods.length];
  g.save(); g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 6; g.shadowOffsetX = 1.5; g.shadowOffsetY = 3; g.fillStyle = wood.base[1]; g.beginPath(); g.roundRect(x, y, W, H, rad); g.fill(); g.restore();
  g.save(); g.beginPath(); g.roundRect(x, y, W, H, rad); g.clip();
  grain(g, x, y, W, H, wood, grainDir ?? (W >= H ? 'h' : 'v'), seed, !!grainDir);
  if (grainDir) {
    // engraved grooves running the only way it slides
    g.strokeStyle = 'rgba(0,0,0,0.35)'; g.lineWidth = 1.4;
    for (const f of [0.2, 0.8]) { g.beginPath(); if (grainDir === 'h') { g.moveTo(x + cs * 0.18, y + H * f); g.lineTo(x + W - cs * 0.18, y + H * f); } else { g.moveTo(x + W * f, y + cs * 0.18); g.lineTo(x + W * f, y + H - cs * 0.18); } g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 0.8;
    for (const f of [0.2, 0.8]) { g.beginPath(); if (grainDir === 'h') { g.moveTo(x + cs * 0.18, y + H * f + 1.2); g.lineTo(x + W - cs * 0.18, y + H * f + 1.2); } else { g.moveTo(x + W * f + 1.2, y + cs * 0.18); g.lineTo(x + W * f + 1.2, y + H - cs * 0.18); } g.stroke(); }
  }
  g.restore();
  // bevel: light on the top-left edges, dark on the bottom-right
  g.lineWidth = cs * 0.05;
  g.strokeStyle = 'rgba(255,255,255,0.32)'; g.beginPath(); g.moveTo(x + rad, y + 1.5); g.lineTo(x + W - rad, y + 1.5); g.moveTo(x + 1.5, y + rad); g.lineTo(x + 1.5, y + H - rad); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.35)'; g.beginPath(); g.moveTo(x + rad, y + H - 1.5); g.lineTo(x + W - rad, y + H - 1.5); g.moveTo(x + W - 1.5, y + rad); g.lineTo(x + W - 1.5, y + H - rad); g.stroke();
  g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1; g.beginPath(); g.roundRect(x + 0.5, y + 0.5, W - 1, H - 1, rad); g.stroke();
  const cx = x + W / 2, cy = y + H / 2;
  if (grainDir) brassArrow(g, cx, cy, Math.min(W, H) * 0.3, grainDir, Math.max(W, H) * 0.32);
  else motif(g, cx, cy, Math.min(W, H) * 0.24, wood.inlay, W >= H ? (W > H ? 'h' : 'o') : 'v', seed);
  return c;
}
/** A small marquetry motif: a four-petal flower on a square, a vine on a long piece. */
function motif(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, col: string, shape: 'o' | 'h' | 'v', seed: number) {
  g.save(); g.translate(cx, cy); if (shape === 'v') g.rotate(Math.PI / 2);
  g.fillStyle = col; g.globalAlpha = 0.85;
  const petal = (a: number, len: number, wid: number) => { g.save(); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.5, -wid, len, 0); g.quadraticCurveTo(len * 0.5, wid, 0, 0); g.fill(); g.restore(); };
  if (shape === 'o') {
    if (hash(seed, 9) < 0.5) { for (let k = 0; k < 4; k++) petal((k * Math.PI) / 2, s, s * 0.42); for (let k = 0; k < 4; k++) petal(Math.PI / 4 + (k * Math.PI) / 2, s * 0.55, s * 0.2); }
    else { // a compass rose: eight points, long and short
      for (let k = 0; k < 8; k++) { const L = k % 2 ? s * 0.6 : s * 1.05, a = (k * Math.PI) / 4; g.beginPath(); g.moveTo(Math.cos(a) * L, Math.sin(a) * L); g.lineTo(Math.cos(a + 0.35) * s * 0.22, Math.sin(a + 0.35) * s * 0.22); g.lineTo(Math.cos(a - 0.35) * s * 0.22, Math.sin(a - 0.35) * s * 0.22); g.closePath(); g.fill(); }
    }
    g.beginPath(); g.arc(0, 0, s * 0.17, 0, TAU); g.fillStyle = 'rgba(0,0,0,0.4)'; g.fill();
  }
  else {
    // a vine: a curving stem with leaves
    g.strokeStyle = col; g.lineWidth = s * 0.1; g.beginPath(); g.moveTo(-s * 2.4, 0); g.bezierCurveTo(-s, -s * 0.6, s, s * 0.6, s * 2.4, 0); g.stroke();
    for (let k = -2; k <= 2; k++) { if (!k) continue; g.save(); g.translate(k * s * 0.95, (k % 2 ? -1 : 1) * s * 0.1); petal((k % 2 ? -1 : 1) * 0.9 + (k < 0 ? Math.PI : 0), s * 0.7, s * 0.26); g.restore(); }
    g.beginPath(); g.arc(0, 0, s * 0.2, 0, TAU); g.fill();
  }
  g.restore();
}
/** A brass double arrow inlaid along the grain. */
function brassArrow(g: CanvasRenderingContext2D, cx: number, cy: number, s: number, dir: 'h' | 'v', half: number) {
  g.save(); g.translate(cx, cy); if (dir === 'v') g.rotate(Math.PI / 2);
  const br = g.createLinearGradient(0, -s * 0.3, 0, s * 0.3); br.addColorStop(0, '#fbe6a6'); br.addColorStop(1, '#a07428');
  g.fillStyle = br; g.strokeStyle = 'rgba(60,36,8,0.7)'; g.lineWidth = 0.8;
  const L = Math.max(half, s * 0.9), t = s * 0.12, hd = s * 0.42;
  g.beginPath(); g.moveTo(-L, 0); g.lineTo(-L + hd, -hd * 0.7); g.lineTo(-L + hd, -t); g.lineTo(L - hd, -t); g.lineTo(L - hd, -hd * 0.7); g.lineTo(L, 0); g.lineTo(L - hd, hd * 0.7); g.lineTo(L - hd, t); g.lineTo(-L + hd, t); g.lineTo(-L + hd, hd * 0.7); g.closePath(); g.fill(); g.stroke();
  g.restore();
}
/** The jewel piece: red lacquer bound in gold, a ruby cabochon at its heart. */
export function jewel(cs: number, r: number) {
  const pad = cs * 0.05, W = 2 * cs - pad * 2, S = 8, { c, g } = canvas((W + S * 2) * r, (W + S * 2) * r); g.scale(r, r);
  const x = S, y = S, rad = cs * 0.16;
  g.save(); g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 8; g.shadowOffsetX = 2; g.shadowOffsetY = 4; g.fillStyle = '#5a0a10'; g.beginPath(); g.roundRect(x, y, W, W, rad); g.fill(); g.restore();
  const lac = g.createLinearGradient(x, y, x + W, y + W); lac.addColorStop(0, '#d02a32'); lac.addColorStop(0.55, '#8e1018'); lac.addColorStop(1, '#5a060c');
  g.fillStyle = lac; g.beginPath(); g.roundRect(x, y, W, W, rad); g.fill();
  const gold = g.createLinearGradient(x, y, x + W, y + W); gold.addColorStop(0, '#fff0b0'); gold.addColorStop(0.5, '#d8a840'); gold.addColorStop(1, '#8a5a18');
  g.strokeStyle = gold; g.lineWidth = cs * 0.09; g.beginPath(); g.roundRect(x + cs * 0.1, y + cs * 0.1, W - cs * 0.2, W - cs * 0.2, rad * 0.7); g.stroke();
  g.lineWidth = cs * 0.025; g.beginPath(); g.roundRect(x + cs * 0.24, y + cs * 0.24, W - cs * 0.48, W - cs * 0.48, rad * 0.5); g.stroke();
  // gold scroll corners
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const px = x + W / 2 + sx * W * 0.3, py = y + W / 2 + sy * W * 0.3; g.lineWidth = cs * 0.03; g.beginPath(); g.arc(px, py, cs * 0.08, 0, Math.PI * 1.5); g.stroke(); }
  // the ruby
  const cx = x + W / 2, cy = y + W / 2, R = cs * 0.34;
  g.fillStyle = gold; g.beginPath(); g.arc(cx, cy, R * 1.18, 0, TAU); g.fill();
  const rb = g.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.05, cx, cy, R); rb.addColorStop(0, '#ffd0d4'); rb.addColorStop(0.25, '#ff3a4a'); rb.addColorStop(0.7, '#a00818'); rb.addColorStop(1, '#4a0008');
  g.fillStyle = rb; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(255,200,210,0.35)'; g.lineWidth = 1; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.beginPath(); g.moveTo(cx + Math.cos(a) * R * 0.45, cy + Math.sin(a) * R * 0.45); g.lineTo(cx + Math.cos(a) * R * 0.95, cy + Math.sin(a) * R * 0.95); g.stroke(); }
  g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(cx - R * 0.35, cy - R * 0.4, R * 0.22, R * 0.12, -0.6, 0, TAU); g.fill();
  // lacquer sheen
  const sh = g.createLinearGradient(x, y, x + W * 0.7, y + W * 0.7); sh.addColorStop(0, 'rgba(255,255,255,0.25)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.beginPath(); g.roundRect(x, y, W, W, rad); g.fill();
  return c;
}
export function glow(rad: number, tint: string, r: number, a = 0.6) {
  const S = rad * 2, { c, g } = canvas(S * r, S * r); g.scale(r, r);
  const gr = g.createRadialGradient(rad, rad, 0, rad, rad, rad); gr.addColorStop(0, `rgba(${tint},${a})`); gr.addColorStop(1, `rgba(${tint},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  return c;
}
