/**
 * Inlay: a sliding-block puzzle box. Carved pieces fill a tray with a gap in its frame; slide the jewel piece out
 * through the gap. A move is one piece slid any distance in one straight line. Some pieces are cut along the grain
 * and slide only that way: across ('h') or up and down ('v').
 */
export type Grain = 'h' | 'v' | undefined;
export type Piece = { w: number; h: number; x: number; y: number; grain?: 'h' | 'v' };
/** A box: its size, the pieces (the jewel is piece 0), and where the jewel must reach to slip out of the gap. */
export type Box = { w: number; h: number; pieces: Piece[]; exit: { x: number; y: number } };
export type Dir = 'U' | 'D' | 'L' | 'R';
export const DX: Record<Dir, number> = { U: 0, D: 0, L: -1, R: 1 };
export const DY: Record<Dir, number> = { U: -1, D: 1, L: 0, R: 0 };
export type Move = { piece: number; dir: Dir; n: number };
export type Pos = number[]; // x,y for each piece, flattened

export const start = (b: Box): Pos => b.pieces.flatMap((p) => [p.x, p.y]);
function grid(b: Box, s: Pos, skip = -1) {
  const g = new Int8Array(b.w * b.h).fill(-1);
  b.pieces.forEach((p, i) => { if (i === skip) return; const x = s[i * 2], y = s[i * 2 + 1]; for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) g[(y + dy) * b.w + x + dx] = i; });
  return g;
}
/** How far piece i can slide in a direction from here. */
export function room(b: Box, s: Pos, i: number, d: Dir, g = grid(b, s)) {
  const p = b.pieces[i];
  if ((p.grain === 'h' && (d === 'U' || d === 'D')) || (p.grain === 'v' && (d === 'L' || d === 'R'))) return 0;
  let n = 0, x = s[i * 2], y = s[i * 2 + 1];
  for (;;) {
    const nx = x + DX[d], ny = y + DY[d];
    if (nx < 0 || ny < 0 || nx + p.w > b.w || ny + p.h > b.h) break;
    let free = true;
    for (let dy = 0; dy < p.h && free; dy++) for (let dx = 0; dx < p.w; dx++) { const c = g[(ny + dy) * b.w + nx + dx]; if (c !== -1 && c !== i) { free = false; break; } }
    if (!free) break;
    x = nx; y = ny; n++;
  }
  return n;
}
export function apply(s: Pos, m: Move): Pos { const t = s.slice(); t[m.piece * 2] += DX[m.dir] * m.n; t[m.piece * 2 + 1] += DY[m.dir] * m.n; return t; }
export const solved = (b: Box, s: Pos) => s[0] === b.exit.x && s[1] === b.exit.y;
/** A key that treats pieces of the same shape and grain alike. */
export function key(b: Box, s: Pos) {
  const out = new Array(b.w * b.h).fill('.');
  b.pieces.forEach((p, i) => { out[s[i * 2 + 1] * b.w + s[i * 2]] = i === 0 ? '*' : `${p.w}${p.h}${p.grain ?? ''}`; });
  return out.join(' ');
}
export function moves(b: Box, s: Pos): Move[] {
  const g = grid(b, s), out: Move[] = [];
  for (let i = 0; i < b.pieces.length; i++) for (const d of ['U', 'D', 'L', 'R'] as Dir[]) { const r = room(b, s, i, d, g); for (let n = 1; n <= r; n++) out.push({ piece: i, dir: d, n }); }
  return out;
}
/** Fewest moves to free the jewel from here, as a list of moves; null if it can't be done. */
export function solve(b: Box, from: Pos = start(b), limit = 300000): Move[] | null {
  if (solved(b, from)) return [];
  const prev = new Map<string, [string, Move, Pos] | null>([[key(b, from), null]]);
  let frontier = [from];
  while (frontier.length && prev.size < limit) {
    const next: Pos[] = [];
    for (const s of frontier) for (const m of moves(b, s)) {
      const t = apply(s, m), k = key(b, t); if (prev.has(k)) continue;
      prev.set(k, [key(b, s), m, s]);
      if (solved(b, t)) {
        const path: Move[] = []; let c: string | undefined = k;
        while (c && prev.get(c)) { const [p, mv]: [string, Move, Pos] = prev.get(c)!; path.unshift(mv); c = p; }
        return remap(b, from, path);
      }
      next.push(t);
    }
    frontier = next;
  }
  return null;
}
/**
 * The search merges look-alike pieces, so a stored move may name a twin of the piece actually at that spot. Replay
 * the path and point each move at whichever piece is really at that place.
 */
function remap(b: Box, from: Pos, path: Move[]): Move[] {
  let s = from; const out: Move[] = [];
  // re-run the search's view: find, before each move, the piece whose anchor matches the one the move started from
  let shadow = from;
  for (const m of path) {
    const sx = shadow[m.piece * 2], sy = shadow[m.piece * 2 + 1], shape = b.pieces[m.piece];
    const real = b.pieces.findIndex((p, i) => s[i * 2] === sx && s[i * 2 + 1] === sy && p.w === shape.w && p.h === shape.h && p.grain === shape.grain);
    const mv = { piece: real < 0 ? m.piece : real, dir: m.dir, n: m.n };
    out.push(mv); s = apply(s, mv); shadow = apply(shadow, m);
  }
  return out;
}
export function starsFor(n: number, par: number) { return n <= par ? 3 : n <= Math.ceil(par * 1.25) + 1 ? 2 : 1; }
