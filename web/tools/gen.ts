/**
 * Puzzle-box generator. It lays the jewel at the gap and fills the rest of the tray with random pieces, leaving a
 * few cells empty. Then it searches every arrangement those pieces can reach, measures each one's distance (in
 * moves) from the nearest arrangement with the jewel at the gap, and picks a start at the template's distance:
 * the far end of what that tray can offer. Par is that distance, the true fewest moves.
 * Run: npx esbuild tools/gen.ts --bundle --platform=node --format=esm --outfile=tools/.gen.mjs && node tools/.gen.mjs
 */
import fs from 'node:fs';
import { apply, key, moves, solve, solved, type Box, type Piece, type Pos } from '../src/game/sim';

type T = { id: string; w: number; h: number; empty: number; mix: [number, number, number]; grains: [number, number]; par: [number, number]; seed: number };
const t = (id: string, w: number, h: number, empty: number, mix: [number, number, number], grains: [number, number], par: [number, number], seed: number): T => ({ id, w, h, empty, mix, grains, par, seed });
// mix: weights for 1×1, 1×2 (tall), 2×1 (wide)
const TEMPLATES: T[] = [
  t('w1', 4, 4, 2, [1, 2, 2], [0, 0], [4, 6], 1), t('w2', 4, 4, 2, [1, 2, 2], [0, 0], [7, 10], 2), t('w3', 4, 5, 2, [1, 2, 2], [0, 0], [9, 13], 3), t('w4', 4, 5, 2, [1, 2, 2], [0, 0], [12, 16], 4),
  t('w5', 4, 5, 2, [1, 2, 2], [0, 0], [15, 20], 5), t('w6', 4, 5, 2, [1, 2, 2], [0, 0], [18, 24], 6), t('w7', 4, 5, 2, [1, 2, 2], [0, 0], [22, 28], 7), t('w8', 4, 5, 2, [1, 2, 2], [0, 0], [26, 34], 8),
  t('r1', 4, 6, 2, [1, 2, 2], [0, 0], [16, 22], 11), t('r2', 4, 6, 2, [1, 2, 2], [0, 0], [20, 26], 12), t('r3', 4, 6, 2, [1, 2, 2], [0, 0], [22, 28], 43), t('r4', 4, 6, 2, [1, 2, 2], [0, 0], [25, 32], 14),
  t('r5', 4, 6, 2, [1, 2, 2], [0, 0], [28, 36], 45), t('r6', 4, 6, 2, [1, 2, 2], [0, 0], [32, 40], 16), t('r7', 4, 6, 2, [1, 2, 2], [0, 0], [35, 48], 47), t('r8', 4, 6, 2, [1, 2, 2], [0, 0], [40, 55], 18),
  t('e1', 4, 5, 2, [1, 2, 2], [2, 3], [10, 16], 21), t('e2', 4, 5, 2, [1, 2, 2], [3, 4], [14, 20], 22), t('e3', 4, 6, 2, [1, 2, 2], [3, 4], [18, 26], 23), t('e4', 5, 5, 2, [1, 2, 2], [3, 5], [22, 30], 24),
  t('e5', 4, 6, 2, [1, 2, 2], [4, 6], [26, 34], 25), t('e6', 5, 5, 2, [1, 2, 2], [4, 6], [30, 40], 26), t('e7', 4, 6, 2, [1, 2, 2], [5, 7], [34, 46], 27), t('e8', 5, 5, 2, [1, 2, 2], [5, 8], [40, 56], 28),
];
function rng(seed: number) { let s = Math.imul(seed + 0x9e3779b9, 2654435761) >>> 0 || 1; for (let i = 0; i < 8; i++) { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; } return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

function attempt(T: T, rnd: () => number) {
  const { w, h } = T;
  const ex = Math.floor(rnd() * (w - 1)), exit = { x: ex, y: h - 2 };
  const taken = new Int8Array(w * h);
  const put = (x: number, y: number, pw: number, ph: number) => { for (let dy = 0; dy < ph; dy++) for (let dx = 0; dx < pw; dx++) taken[(y + dy) * w + x + dx] = 1; };
  const fits = (x: number, y: number, pw: number, ph: number) => { if (x + pw > w || y + ph > h) return false; for (let dy = 0; dy < ph; dy++) for (let dx = 0; dx < pw; dx++) if (taken[(y + dy) * w + x + dx]) return false; return true; };
  const pieces: Piece[] = [{ w: 2, h: 2, x: exit.x, y: exit.y }]; put(exit.x, exit.y, 2, 2);
  // fill, leaving `empty` cells free
  const cellsLeft = () => w * h - taken.reduce((a, b) => a + b, 0);
  let guard = 0;
  while (cellsLeft() > T.empty && guard++ < 400) {
    const free: number[] = []; for (let i = 0; i < w * h; i++) if (!taken[i]) free.push(i);
    const i = free[Math.floor(rnd() * free.length)], x = i % w, y = Math.floor(i / w);
    const tot = T.mix[0] + T.mix[1] + T.mix[2], r = rnd() * tot;
    let [pw, ph] = r < T.mix[0] ? [1, 1] : r < T.mix[0] + T.mix[1] ? [1, 2] : [2, 1];
    if (cellsLeft() - pw * ph < T.empty) [pw, ph] = [1, 1];
    // a domino that doesn't fit here tries the other way round before settling for a single
    if (!fits(x, y, pw, ph) && pw * ph === 2 && fits(x, y, ph, pw)) [pw, ph] = [ph, pw];
    if (!fits(x, y, pw, ph)) { if (fits(x, y, 1, 1) && cellsLeft() - 1 >= T.empty) [pw, ph] = [1, 1]; else continue; }
    pieces.push({ w: pw, h: ph, x, y }); put(x, y, pw, ph);
  }
  if (cellsLeft() !== T.empty) return null;
  // not too many little squares: dominoes make a box interesting
  if (pieces.filter((p) => p.w * p.h === 1).length > (w * h > 20 ? 6 : 5)) return null;
  // grains: some long pieces (and a few squares) slide only one way
  const ng = T.grains[0] + Math.floor(rnd() * (T.grains[1] - T.grains[0] + 1));
  const idx = pieces.map((_, i) => i).slice(1).sort(() => rnd() - 0.5).slice(0, ng);
  for (const i of idx) { const p = pieces[i]; p.grain = p.w > p.h ? 'h' : p.h > p.w ? 'v' : rnd() < 0.5 ? 'h' : 'v'; }
  const box: Box = { w, h, pieces, exit };
  // every arrangement these pieces can reach
  const s0: Pos = pieces.flatMap((p) => [p.x, p.y]);
  const all = new Map<string, Pos>([[key(box, s0), s0]]);
  let frontier = [s0];
  while (frontier.length && all.size < 150000) {
    const next: Pos[] = [];
    for (const s of frontier) for (const m of moves(box, s)) { const t2 = apply(s, m), k = key(box, t2); if (!all.has(k)) { all.set(k, t2); next.push(t2); } }
    frontier = next;
  }
  if (all.size >= 150000) return null;
  // distance from the nearest freed arrangement (moves are reversible, so search outward from all of them at once)
  const dist = new Map<string, number>(); let fr: Pos[] = [];
  for (const [k, s] of all) if (solved(box, s)) { dist.set(k, 0); fr.push(s); }
  let d = 0;
  while (fr.length) { d++; const nx: Pos[] = []; for (const s of fr) for (const m of moves(box, s)) { const t2 = apply(s, m), k = key(box, t2); if (!dist.has(k)) { dist.set(k, d); nx.push(t2); } } fr = nx; }
  const cands = [...dist.entries()].filter(([, v]) => v >= T.par[0] && v <= T.par[1]);
  if (!cands.length) return null;
  // the far end of the range, chosen among a few
  cands.sort((a, b) => b[1] - a[1]);
  const [k] = cands[Math.floor(rnd() * Math.min(cands.length, 6))];
  const st = all.get(k)!;
  const out: Box = { w, h, exit, pieces: pieces.map((p, i) => ({ w: p.w, h: p.h, x: st[i * 2], y: st[i * 2 + 1], ...(p.grain ? { grain: p.grain } : {}) })) };
  const sol = solve(out); if (!sol) return null;
  if (sol.length !== dist.get(k)) return null;
  return { ...out, par: sol.length, states: all.size };
}

const only = process.argv[2] ? process.argv[2].split(',') : null;
const file = process.env.OUT ? new URL('file://' + process.env.OUT) : new URL('../src/game/boxes.json', import.meta.url);
const out: Record<string, unknown> = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
for (const T of TEMPLATES) {
  if (only && !only.includes(T.id)) continue;
  const rnd = rng(T.seed * 7919);
  let got = null, tries = 0;
  while (!got && tries < 3000) { tries++; got = attempt(T, rnd); }
  if (!got) { console.log(T.id, 'NONE'); continue; }
  out[T.id] = got;
  console.log(T.id, 'tries', tries, 'par', got.par, 'pieces', got.pieces.length, 'grains', got.pieces.filter((p) => p.grain).length, 'states', got.states);
  fs.writeFileSync(file, JSON.stringify(out) + '\n');
}
