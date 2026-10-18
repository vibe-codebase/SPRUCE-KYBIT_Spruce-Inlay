import { describe, expect, it } from 'vitest';
import { apply, moves, room, solve, solved, start, starsFor, type Box } from './sim';
import { CHAPTERS, LEVELS, levelIndex } from './levels';
import { freshSave, isUnlocked, parseSave, recordResult, totalStars } from '../state/save';

const cells = (b: Box, s: number[]) => { const g = new Array(b.w * b.h).fill(0); b.pieces.forEach((p, i) => { for (let dy = 0; dy < p.h; dy++) for (let dx = 0; dx < p.w; dx++) g[(s[i * 2 + 1] + dy) * b.w + s[i * 2] + dx]++; }); return g; };

describe('boxes', () => {
  it('has 24 boxes in three chapters of eight, with unique ids and names', () => {
    expect(LEVELS).toHaveLength(24); expect(CHAPTERS).toHaveLength(3);
    for (let c = 0; c < 3; c++) expect(LEVELS.filter((l) => l.chapter === c)).toHaveLength(8);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(24); expect(new Set(LEVELS.map((l) => l.name)).size).toBe(24);
    expect(levelIndex(LEVELS[9].id)).toBe(9);
  });
  it('grain pieces only come in the last chapter', () => {
    expect(LEVELS.filter((l) => l.chapter < 2).every((l) => l.pieces.every((p) => !p.grain))).toBe(true);
    expect(LEVELS.filter((l) => l.chapter === 2).every((l) => l.pieces.some((p) => p.grain))).toBe(true);
  });
  it('par rises through each chapter', () => {
    for (let c = 0; c < 3; c++) { const p = LEVELS.filter((l) => l.chapter === c).map((l) => l.par); for (let i = 1; i < 8; i++) expect(p[i]).toBeGreaterThanOrEqual(p[i - 1]); }
  });
});

describe('every box', () => {
  for (const l of LEVELS) {
    it(`${l.id} ${l.name}: pieces fit without overlap, the jewel is 2×2 and not yet free, and par is the true shortest`, () => {
      const g = cells(l, start(l));
      expect(g.every((c) => c <= 1)).toBe(true);
      expect(g.filter((c) => c === 0).length).toBeGreaterThanOrEqual(2);
      expect(l.pieces[0].w).toBe(2); expect(l.pieces[0].h).toBe(2);
      expect(l.exit.y).toBe(l.h - 2);
      expect(solved(l, start(l))).toBe(false);
      const path = solve(l)!; expect(path).not.toBeNull(); expect(path.length).toBe(l.par);
      let s = start(l);
      for (const m of path) { expect(room(l, s, m.piece, m.dir)).toBeGreaterThanOrEqual(m.n); s = apply(s, m); expect(cells(l, s).every((c) => c <= 1)).toBe(true); }
      expect(solved(l, s)).toBe(true);
    });
  }
});

describe('sliding', () => {
  const b: Box = { w: 3, h: 3, exit: { x: 1, y: 1 }, pieces: [{ w: 2, h: 2, x: 0, y: 0 }, { w: 1, h: 1, x: 2, y: 0, grain: 'v' }] };
  it('slides as far as it is free, and grain pieces only one way', () => {
    const s = start({ ...b, pieces: [b.pieces[0], b.pieces[1]] });
    const bb = { ...b, pieces: [b.pieces[0], b.pieces[1]] };
    expect(room(bb, s, 1, 'D')).toBe(2); expect(room(bb, s, 1, 'L')).toBe(0);
    expect(room(bb, s, 0, 'R')).toBe(0); expect(room(bb, s, 0, 'D')).toBe(1);
    expect(moves(bb, s).length).toBe(2 + 1);
    expect(solve(bb)!.length).toBe(2);
  });
});

describe('stars and save', () => {
  it('stars follow par', () => { expect(starsFor(20, 20)).toBe(3); expect(starsFor(26, 20)).toBe(2); expect(starsFor(27, 20)).toBe(1); });
  it('records the fewest moves and unlocks the next box', () => {
    let v = freshSave(); expect(isUnlocked(v, 1)).toBe(false);
    v = recordResult(v, LEVELS[0].id, 2, 9); v = recordResult(v, LEVELS[0].id, 3, 5);
    expect(v.stars[LEVELS[0].id]).toBe(3); expect(v.best[LEVELS[0].id]).toBe(5); expect(isUnlocked(v, 1)).toBe(true); expect(totalStars(v)).toBe(3);
  });
  it('parses corrupt saves safely', () => { expect(parseSave('{')).toEqual(freshSave()); });
});
