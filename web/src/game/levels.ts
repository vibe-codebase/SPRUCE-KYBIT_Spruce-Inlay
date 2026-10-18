import type { Box } from './sim';
import DATA from './boxes.json';

export type Level = Box & { id: string; name: string; chapter: number; hint?: string; par: number };
export const CHAPTERS = [
  { name: 'Walnut', short: 'Walnut', blurb: 'Small boxes of walnut and maple. Slide the pieces aside and let the jewel out.' },
  { name: 'Rosewood', short: 'Rosewood', blurb: 'Deeper trays, crowded with pieces. Every move counts.' },
  { name: 'Ebony', short: 'Ebony', blurb: 'Some pieces are cut along the grain and slide only the way their brass arrow points.' },
];
const NAMES: [string, string, string?][] = [
  ['w1', 'Snuffbox', 'Drag a piece to slide it. Free the red jewel through the gap in the frame.'],
  ['w2', 'Tea Caddy', 'One move is one piece slid as far as you like in a straight line. Fewer moves earn more stars.'],
  ['w3', 'Locket'], ['w4', 'Sewing Box'], ['w5', 'Pen Case'], ['w6', 'Spice Chest'], ['w7', 'Ring Box'], ['w8', 'Jewel Casket'],
  ['r1', 'Writing Slope', 'Bigger trays, more pieces. Look for the move that opens a path, not just the one that is free.'],
  ['r2', 'Vanity'], ['r3', 'Card Box'], ['r4', 'Secretaire'], ['r5', 'Bureau'], ['r6', 'Document Chest'], ['r7', 'Music Box'], ['r8', 'Dowry Chest'],
  ['e1', 'Inro', 'Pieces with a brass arrow are cut along the grain: they slide only the way it points.'],
  ['e2', 'Netsuke'], ['e3', 'Lacquer Box'], ['e4', 'Reliquary'], ['e5', 'Strongbox'], ['e6', 'Hakone'], ['e7', 'Curio Cabinet'], ['e8', 'The Last Box'],
];
const D = DATA as unknown as Record<string, Box & { par: number }>;
/** Within each chapter the boxes come in order of par; names and first hints follow their place. */
const ORDER = [0, 1, 2].flatMap((c) => NAMES.slice(c * 8, c * 8 + 8).map(([id]) => id).filter((id) => D[id]).sort((a, b) => D[a].par - D[b].par || a.localeCompare(b)));
export const LEVELS: Level[] = ORDER.map((id) => { const c = id[0] === 'w' ? 0 : id[0] === 'r' ? 1 : 2, i = c * 8 + ORDER.filter((x) => x[0] === id[0]).indexOf(id); const [, name, hint] = NAMES[i]; return { ...D[id], id, name, hint, chapter: c }; });
export const levelIndex = (id: string) => LEVELS.findIndex((l) => l.id === id);
