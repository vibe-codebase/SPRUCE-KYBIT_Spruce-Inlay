// Store icon, adaptive-icon layers, splash and feature graphic: the puzzle box, its carved pieces, the ruby jewel.
import * as A from '../src/game/art';
import type { Piece } from '../src/game/sim';

const W0 = A.MOODS[0], R0 = A.MOODS[1], E0 = A.MOODS[2];
/** A whole box drawn at (x, y) with cells of size cs; `lift` pulls the jewel down through the gap by that many cells. */
function boxArt(g: CanvasRenderingContext2D, m: A.Mood, w: number, h: number, exitX: number, pieces: Piece[], x: number, y: number, cs: number, lift = 0) {
  const fw = cs * 0.42, t = A.tray(m, w, h, cs, fw, exitX, 1);
  g.drawImage(t.c, x - fw, y - fw);
  let kind = 0;
  pieces.forEach((p, i) => {
    const c = i === 0 ? A.jewel(cs, 1) : A.piece(p.w, p.h, cs, m, kind++, p.grain, 1, i * 13 + 5);
    g.drawImage(c, x + p.x * cs + cs * 0.05 - 8, y + (p.y + (i === 0 ? lift : 0)) * cs + cs * 0.05 - 8);
  });
}
const LAYOUT: Piece[] = [
  { w: 2, h: 2, x: 1, y: 2 }, { w: 1, h: 2, x: 0, y: 0 }, { w: 2, h: 1, x: 1, y: 0 }, { w: 1, h: 2, x: 3, y: 0 }, { w: 1, h: 1, x: 1, y: 1 }, { w: 1, h: 1, x: 2, y: 1 },
  { w: 1, h: 2, x: 0, y: 2 }, { w: 1, h: 1, x: 3, y: 2 }, { w: 1, h: 1, x: 0, y: 4 }, { w: 1, h: 1, x: 3, y: 4 },
];
export function icon() {
  const { c, g } = A.canvas(1024, 1024);
  g.drawImage(A.backdrop(W0, 1024, 1024, 1, 512, 480), 0, 0);
  const fw = 0.42;
  // a close view of the jewel, half out of the gap, between its neighbours
  const cs = 300, x = 512 - cs, y = 160;
  const t = A.tray(W0, 2, 2, cs, cs * fw, 0, 1);
  g.drawImage(t.c, x - cs * fw, y - cs * fw);
  g.drawImage(A.jewel(cs, 1), x + cs * 0.05 - 8, y + cs * 0.55 + cs * 0.05 - 8);
  const glow = g.createRadialGradient(512, y + cs * 2.2, 10, 512, y + cs * 2.2, cs * 1.3); glow.addColorStop(0, 'rgba(255,200,120,0.35)'); glow.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = glow; g.fillRect(0, 0, 1024, 1024);
  return c;
}
export function adaptive() {
  const { c, g } = A.canvas(1024, 1024);
  g.drawImage(A.jewel(230, 1), 512 - 230 - 8 + 230 * 0.05, 512 - 230 - 8 + 230 * 0.05);
  return c;
}
export function adaptiveBg() { const { c, g } = A.canvas(1024, 1024); g.drawImage(A.backdrop(W0, 1024, 1024, 1, 512, 480), 0, 0); return c; }
export function splash() {
  const W = 1284, H = 2778, { c, g } = A.canvas(W, H);
  g.drawImage(A.backdrop(R0, W, H, 1, W / 2, 1700), 0, 0);
  const cs = 230, x = (W - 4 * cs) / 2, y = 1150;
  boxArt(g, R0, 4, 5, 1, LAYOUT, x, y, cs);
  g.textAlign = 'center'; g.font = '600 230px Cinzel, serif';
  const tg = g.createLinearGradient(0, 560, 0, 780); tg.addColorStop(0, '#fff4d6'); tg.addColorStop(0.5, '#e8c070'); tg.addColorStop(1, '#9a6a2a');
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 40; g.fillStyle = tg; g.fillText('INLAY', W / 2, 760); g.shadowBlur = 0;
  g.save(); g.shadowBlur = 0; g.font = '600 58px "Work Sans", sans-serif'; g.fillStyle = '#e8c070'; try { g.letterSpacing = '34px'; } catch { /* */ } g.fillText('SPRUCE', W / 2 + 17, 520); g.restore();
  return c;
}
/** The feature graphic: an ebony box on velvet, the jewel slipping out of the gap; the words on the left. */
export function feature() {
  const W = 1024, H = 500, { c, g } = A.canvas(W, H);
  g.drawImage(A.backdrop(E0, W, H, 1, 760, 230), 0, 0);
  const cs = 70, x = 640, y = 54;
  const pcs: Piece[] = LAYOUT.map((p, i) => ({ ...p, ...(i === 2 ? { grain: 'h' as const } : i === 6 ? { grain: 'v' as const } : {}) }));
  boxArt(g, E0, 4, 5, 1, pcs, x, y, cs, 0.62);
  const gl = g.createRadialGradient(x + cs * 2, y + cs * 5.2, 5, x + cs * 2, y + cs * 5.2, cs * 2); gl.addColorStop(0, 'rgba(255,200,130,0.35)'); gl.addColorStop(1, 'rgba(255,200,130,0)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  const shade = g.createLinearGradient(0, 0, 600, 0); shade.addColorStop(0, 'rgba(20,6,10,0.75)'); shade.addColorStop(1, 'rgba(20,6,10,0)'); g.fillStyle = shade; g.fillRect(0, 0, 600, H);
  g.textAlign = 'left';
  const tg = g.createLinearGradient(0, 110, 0, 190); tg.addColorStop(0, '#fff4d6'); tg.addColorStop(0.5, '#e8c070'); tg.addColorStop(1, '#a8743a');
  g.save(); g.shadowBlur = 0; g.font = '600 22px "Work Sans", sans-serif'; g.fillStyle = '#e8c070'; try { g.letterSpacing = '13px'; } catch { /* */ } g.fillText('SPRUCE', 60, 96); g.restore();
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 20; g.fillStyle = tg; g.font = '600 96px Cinzel, serif'; g.fillText('INLAY', 56, 182); g.shadowBlur = 0;
  g.fillStyle = '#f6ecdc'; g.font = '600 25px Cinzel, serif'; g.fillText('Every box keeps a secret.', 60, 230);
  g.fillStyle = '#e8c070'; g.fillRect(62, 252, 48, 2);
  g.fillStyle = 'rgba(246,236,220,0.86)'; g.font = '500 18px "Work Sans", sans-serif';
  g.fillText('Slide the carved pieces of a puzzle box and', 62, 288);
  g.fillText('free the jewel. 24 boxes of walnut, rosewood', 62, 314);
  g.fillText('and ebony.', 62, 340);
  return c;
}
(window as unknown as { brand: unknown }).brand = { icon, adaptive, adaptiveBg, splash, feature };
