// The tour's red pen, as on the game's map (its stop circles and the "next?" arrow): a marker loop round what the
// torch has just lit, a curved arrow to where the tour goes next (a folder tab, a tab at the foot, a face, a button)
// with a word or two in handwriting, a dotted trail from one spot to the next on the same screen, and a nudge towards
// Next. Each is drawn as if by hand (stroke-dashoffset), a little off true; with reduced motion it is all there at once
// (tour.css). Every stroke is red over a pale halo, and the handwriting deep red with a paper-coloured halo, so they
// read on the dark and on paper alike.
import { useId, type CSSProperties } from 'react';
import type { Box } from './layout';

export interface Pt {
  x: number;
  y: number;
}

/** A small seeded random, so a stop's loop wobbles the same way every time: returns ±amp. */
function wobble(seed: number) {
  let a = (Math.imul(seed + 1, 2654435761) >>> 0) || 1;
  return (amp: number) => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1) * amp;
  };
}

const n = (v: number) => Math.round(v * 10) / 10;
const center = (b: Box): Pt => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** Where `el` is in the root, from its place on screen (the marks measure once everything has settled). */
export function boxIn(el: Element, root: Element): Box {
  const r = el.getBoundingClientRect();
  const o = root.getBoundingClientRect();
  return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
}

export const union = (boxes: Box[]): Box | null => {
  if (!boxes.length) return null;
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w));
  const y1 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

/** The part of `b` between `top` and `bottom`; scrolled right off, a sliver at the edge it went off. */
export function within(b: Box, top: number, bottom: number): Box {
  const y0 = Math.min(Math.max(b.y, top), bottom - 6);
  const y1 = Math.max(Math.min(b.y + b.h, bottom), y0 + 6);
  return { ...b, y: y0, h: y1 - y0 };
}

export const contains = (b: Box, p: Pt) => p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;

/** A loop round `b`, `gap` outside it and inside the screen: a rounded oblong begun at the top left, a little off true,
 * its end running on past its start. */
export function loopPath(b: Box, seed: number, screen: { w: number; h: number }, gap = 5): string {
  const j = wobble(seed);
  const x0 = Math.max(3, b.x - gap);
  const x1 = Math.min(screen.w - 3, b.x + b.w + gap);
  const y0 = Math.max(3, b.y - gap);
  const y1 = Math.min(screen.h - 3, b.y + b.h + gap);
  const r = Math.min(20, (x1 - x0) / 2, (y1 - y0) / 2);
  const end = Math.min(x1 - r, x0 + r + 34 + j(8));
  return [
    `M${n(x0 + r + j(4))} ${n(y0 + j(2))}`,
    `L${n(x1 - r + j(3))} ${n(y0 + j(2.5))}`,
    `Q${n(x1 + j(1.5))} ${n(y0 + j(1))} ${n(x1 + j(1.5))} ${n(y0 + r + j(3))}`,
    `L${n(x1 + j(2))} ${n(y1 - r + j(3))}`,
    `Q${n(x1 + j(1))} ${n(y1 + j(1.5))} ${n(x1 - r + j(3))} ${n(y1 + j(1.5))}`,
    `L${n(x0 + r + j(3))} ${n(y1 + j(2))}`,
    `Q${n(x0 + j(1.5))} ${n(y1 + j(1))} ${n(x0 + j(1.5))} ${n(y1 - r + j(3))}`,
    `L${n(x0 + j(2))} ${n(y0 + r + j(3))}`,
    `Q${n(x0 + j(1))} ${n(y0 - 2)} ${n(x0 + r + 8)} ${n(y0 - 3 + j(1.5))}`,
    `L${n(end)} ${n(y0 - 5 + j(2))}`,
  ].join(' ');
}

/** Where `b`'s edge meets the line from its centre towards `p`, pushed out by `gap`. */
function edge(b: Box, p: Pt, gap: number): Pt {
  const c = center(b);
  const dx = p.x - c.x;
  const dy = p.y - c.y;
  if (!dx && !dy) return c;
  const s = Math.min(dx ? b.w / 2 / Math.abs(dx) : Infinity, dy ? b.h / 2 / Math.abs(dy) : Infinity);
  const len = Math.hypot(dx, dy);
  return { x: c.x + dx * s + (dx / len) * gap, y: c.y + dy * s + (dy / len) * gap };
}

/** Whether the curve p0–c–p1 stays on the screen and clear of `avoid` (the tag), sampled along its length. */
function clear(p0: Pt, c: Pt, p1: Pt, screen: { w: number; h: number }, avoid: Box | null): boolean {
  for (let t = 0; t <= 1.0001; t += 0.04) {
    const u = 1 - t;
    const x = u * u * p0.x + 2 * u * t * c.x + t * t * p1.x;
    const y = u * u * p0.y + 2 * u * t * c.y + t * t * p1.y;
    if (x < 3 || x > screen.w - 3 || y < 3 || y > screen.h - 3) return false;
    if (avoid && x > avoid.x - 8 && x < avoid.x + avoid.w + 8 && y > avoid.y - 8 && y < avoid.y + avoid.h + 8) return false;
  }
  return true;
}

/**
 * A curved arrow from box `a` to box `b`: the shaft and the head. It bows towards the middle of the screen, or round
 * `avoid` (the tag) when the straight way would cross it; null when there's no way round that stays on the screen.
 */
export function arrowPaths(a: Box, b: Box, screen: { w: number; h: number }, avoid: Box | null = null): { shaft: string; head: string } | null {
  const p0 = edge(a, center(b), 6);
  const p1 = edge(b, center(a), 9);
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const mid = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
  // The bow: perpendicular to the line, first on whichever side faces the middle of the screen.
  let nx = -dy / len;
  let ny = dx / len;
  if ((screen.w / 2 - mid.x) * nx + (screen.h / 2 - mid.y) * ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  const bow = Math.min(56, len * 0.28);
  const tries: Pt[] = [
    { x: mid.x + nx * bow, y: mid.y + ny * bow },
    { x: mid.x - nx * bow, y: mid.y - ny * bow },
  ];
  if (avoid) {
    for (const x of [avoid.x - 40, avoid.x + avoid.w + 40, avoid.x - 90, avoid.x + avoid.w + 90, avoid.x - 150, avoid.x + avoid.w + 150]) {
      tries.push({ x, y: mid.y }, { x, y: p1.y }, { x, y: p0.y });
    }
  }
  const c = tries.find((t) => clear(p0, t, p1, screen, avoid));
  if (!c) return null;
  // The head: two strokes back from the tip along the curve's last direction.
  const tx = p1.x - c.x;
  const ty = p1.y - c.y;
  const tl = Math.hypot(tx, ty) || 1;
  const back = (turn: number) => {
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    const ux = (-tx / tl) * cos - (-ty / tl) * sin;
    const uy = (-tx / tl) * sin + (-ty / tl) * cos;
    return `${n(p1.x + ux * 13)} ${n(p1.y + uy * 13)}`;
  };
  return {
    shaft: `M${n(p0.x)} ${n(p0.y)} Q${n(c.x)} ${n(c.y)} ${n(p1.x)} ${n(p1.y)}`,
    head: `M${back(0.5)} L${n(p1.x)} ${n(p1.y)} L${back(-0.5)}`,
  };
}

/** Where a label goes by box `b`: to its right, else its left, below, above; inside the screen, under the strip. */
export function labelAt(text: string, b: Box, screen: { w: number; h: number; top: number }): Pt & { w: number } {
  const w = text.length * 10.4 + 6;
  const fits = (x: number, y: number) => x >= 8 && x + w <= screen.w - 8 && y - 20 >= screen.top && y + 6 <= screen.h;
  const tries = [
    { x: b.x + b.w + 12, y: b.y + b.h / 2 + 8 },
    { x: b.x - 12 - w, y: b.y + b.h / 2 + 8 },
    { x: b.x + b.w / 2 - w / 2, y: b.y + b.h + 26 },
    { x: b.x + b.w / 2 - w / 2, y: b.y - 12 },
  ];
  const hit = tries.find((t) => fits(t.x, t.y)) ?? tries[2]!;
  return { x: Math.max(8, Math.min(screen.w - 8 - w, hit.x)), y: Math.max(screen.top + 20, Math.min(screen.h - 6, hit.y)), w };
}

const at = (delay: number, dur = 0.5) => ({ '--delay': `${delay}s`, '--dur': `${dur}s` }) as CSSProperties;

/** One pen stroke: the halo, then the red, drawn together. */
function Stroke({ d, delay, dur }: { d: string; delay: number; dur?: number }) {
  return (
    <>
      <path d={d} pathLength={1} className="tr-pen__halo tr-pen__draw" style={at(delay, dur)} />
      <path d={d} pathLength={1} className="tr-pen__ink tr-pen__draw" style={at(delay, dur)} />
    </>
  );
}

/** A marker loop round a box. */
export function Loop({ box, seed, screen, delay = 0 }: { box: Box; seed: number; screen: { w: number; h: number }; delay?: number }) {
  return <Stroke d={loopPath(box, seed, screen)} delay={delay} dur={0.55} />;
}

/** A curved arrow from one box to another, with its label by the far end. */
export function Arrow({
  from,
  to,
  screen,
  label,
  delay = 0,
}: {
  from: Box;
  to: Box;
  screen: { w: number; h: number; top: number };
  label?: string;
  delay?: number;
}) {
  const a = arrowPaths(from, to, screen);
  const l = label ? labelAt(label, to, screen) : null;
  if (!a) return null;
  return (
    <>
      <Stroke d={a.shaft} delay={delay} dur={0.45} />
      <Stroke d={a.head} delay={delay + 0.42} dur={0.16} />
      {l ? (
        <text x={n(l.x)} y={n(l.y)} className="tr-pen__label" style={at(delay + 0.4)}>
          {label}
        </text>
      ) : null}
    </>
  );
}

/** A dotted trail from one spot to the next on the same screen, revealed as if drawn, with a head; round the tag, or
 * not at all when it can't get round it. */
export function Trail({ from, to, avoid, screen, delay = 0 }: { from: Box; to: Box; avoid: Box | null; screen: { w: number; h: number }; delay?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const a = arrowPaths(from, to, screen, avoid);
  if (!a) return null;
  return (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width={screen.w} height={screen.h}>
        <path d={a.shaft} pathLength={1} className="tr-pen__reveal tr-pen__draw" style={at(delay, 0.5)} />
      </mask>
      <g mask={`url(#${id}-m)`}>
        <path d={a.shaft} className="tr-pen__halo tr-pen__dots" />
        <path d={a.shaft} className="tr-pen__ink tr-pen__dots" />
      </g>
      <Stroke d={a.head} delay={delay + 0.48} dur={0.16} />
    </>
  );
}
