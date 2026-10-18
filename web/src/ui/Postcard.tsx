import { useEffect, useRef } from 'react';
import { canvas, MOODS } from '../game/art';
import type { Level } from '../game/levels';

const cache = new Map<string, HTMLCanvasElement>();
/** The box in miniature: its frame and pieces; once opened, the jewel has gone and the gap glows. */
function paintCard(level: Level, solved: boolean, w: number, h: number, dpr: number) {
  const m = MOODS[level.chapter], { c, g } = canvas(w * dpr, h * dpr);
  g.scale(dpr, dpr);
  g.save(); g.beginPath(); g.roundRect(0, 0, w, h, 8); g.clip();
  const bg = g.createLinearGradient(0, 0, w, h); bg.addColorStop(0, m.cloth[0]); bg.addColorStop(1, m.cloth[1]); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const cs = Math.min((w - 16) / (level.w + 0.8), (h - 16) / (level.h + 1.2)), fw = cs * 0.4;
  const ox = (w - level.w * cs) / 2, oy = (h - level.h * cs) / 2 - fw * 0.2;
  g.fillStyle = m.frame.base[0]; g.fillRect(ox - fw, oy - fw, level.w * cs + fw * 2, level.h * cs + fw * 2);
  g.strokeStyle = 'rgba(232,200,120,0.6)'; g.lineWidth = 0.8; g.strokeRect(ox - fw * 0.55, oy - fw * 0.55, level.w * cs + fw * 1.1, level.h * cs + fw * 1.1);
  g.fillStyle = m.floor[1]; g.fillRect(ox, oy, level.w * cs, level.h * cs);
  g.fillStyle = solved ? 'rgba(255,200,120,0.8)' : m.cloth[1]; g.fillRect(ox + level.exit.x * cs, oy + level.h * cs, cs * 2, fw);
  let k = 0;
  level.pieces.forEach((p, i) => {
    if (i === 0 && solved) return;
    const x = ox + p.x * cs + cs * 0.06, y = oy + p.y * cs + cs * 0.06, pw = p.w * cs - cs * 0.12, ph = p.h * cs - cs * 0.12;
    const wood = i === 0 ? null : m.woods[k++ % m.woods.length];
    g.fillStyle = wood ? wood.base[0] : '#b01c26'; g.beginPath(); g.roundRect(x, y, pw, ph, cs * 0.12); g.fill();
    g.strokeStyle = wood ? 'rgba(0,0,0,0.4)' : '#e8c060'; g.lineWidth = wood ? 0.6 : 1; g.stroke();
    if (i === 0) { g.fillStyle = '#ff5060'; g.beginPath(); g.arc(x + pw / 2, y + ph / 2, cs * 0.3, 0, Math.PI * 2); g.fill(); }
    if (p.grain) { g.strokeStyle = '#e0c068'; g.lineWidth = 1; g.beginPath(); if (p.grain === 'h') { g.moveTo(x + pw * 0.25, y + ph / 2); g.lineTo(x + pw * 0.75, y + ph / 2); } else { g.moveTo(x + pw / 2, y + ph * 0.25); g.lineTo(x + pw / 2, y + ph * 0.75); } g.stroke(); }
  });
  g.restore();
  return c;
}

export function Postcard({ level, solved, locked, width }: { level: Level; solved: boolean; locked: boolean; width: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const height = Math.round(width * 1.25);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1), key = `${level.id}|${solved}|${locked}|${width}|${dpr}`;
    let src = cache.get(key);
    if (!src) { src = paintCard(level, solved && !locked, width, height, dpr); cache.set(key, src); }
    el.width = src.width; el.height = src.height; el.getContext('2d')!.drawImage(src, 0, 0);
  }, [level, solved, locked, width, height]);
  return <canvas ref={ref} className="postcard" style={{ width, height }} aria-hidden />;
}
