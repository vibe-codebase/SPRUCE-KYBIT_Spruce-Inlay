type P = { size?: number };
const s = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const Pause = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 6.5v11M15 6.5v11" /></svg>;
export const Back = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>;
export const Next = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9.5 5.5 16 12l-6.5 6.5" /></svg>;
export const Restart = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4 4.5v3.5h3.5" /></svg>;
export const Undo = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 7 4.5 11.5 9 16" /><path d="M5 11.5h9a5 5 0 0 1 0 10h-2" /></svg>;
export const Lamp = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>;
export const Gear = ({ size }: P) => (
  <svg {...s(size)} aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /></svg>
);
/** The jewel: a cabochon in a gold square. */
export const Jewel = ({ size }: P) => <svg {...s(size)} aria-hidden><rect x="4" y="4" width="16" height="16" rx="3" /><circle cx="12" cy="12" r="4" fill="currentColor" opacity=".35" /><circle cx="12" cy="12" r="4" /></svg>;
/** A box with a lid. */
export const Box = ({ size }: P) => <svg {...s(size)} aria-hidden><rect x="3.5" y="9" width="17" height="10.5" rx="1.5" /><path d="M3 9 5 5h14l2 4" /><path d="M10.5 12h3v2.5h-3z" /></svg>;
/** Stars are little gold rosettes, lit when earned. */
export const Star = ({ size = 22, on = true }: P & { on?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    {on && <circle cx="12" cy="12" r="10.5" fill="url(#ro-g)" />}
    <defs><radialGradient id="ro-g"><stop offset="0" stopColor="#ffe6a0" stopOpacity=".7" /><stop offset="1" stopColor="#ffb850" stopOpacity="0" /></radialGradient></defs>
    <g fill={on ? '#f2c860' : 'none'} stroke={on ? '#fff0c0' : 'rgba(240,226,200,.5)'} strokeWidth="1.2">
      {[0, 45, 90, 135].map((a) => <ellipse key={a} cx="12" cy="12" rx="2.6" ry="8" transform={`rotate(${a} 12 12)`} />)}
      <circle cx="12" cy="12" r="2.6" fill={on ? '#c0302e' : 'none'} />
    </g>
  </svg>
);
