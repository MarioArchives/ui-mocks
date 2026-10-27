// The five ways to move between Missions, Log book and My file. Each look is a function of where a screen sits against
// the view: `d` is its offset in screens (0 showing, -1 one to the left, 1 one to the right, anything between while
// you drag), so the same look plays forwards and backwards, follows the finger and springs back the way it came.

/** The stage's size and the swipe's position, for looks that work in pixels. */
export interface Frame {
  pos: number;
  w: number;
  h: number;
}

/** How one screen is drawn at one moment. Left out means its resting state. */
export interface Paint {
  hidden?: boolean;
  transform?: string;
  origin?: string;
  z?: number;
  /** How dark the screen is under its shade, 0–1 (cheaper than a filter on a phone). */
  shade?: number;
  clip?: string;
  shadow?: string;
  /** Custom properties for the look's CSS (the board's pins fade in with --zoomed). */
  vars?: Record<string, string>;
}

export interface Look {
  id: string;
  name: string;
  /** One line on the hint chip: what you see as you swipe. */
  blurb: string;
  pane: (d: number, i: number, f: Frame) => Paint;
  /** What sits between screen i and i + 1 (the board's twine), at offset d = i + 0.5 - pos. */
  between?: (d: number, f: Frame) => Paint;
  /** One element over the whole stage (the torch's ring). */
  overlay?: (f: Frame) => Paint & { box?: { x: number; y: number; size: number } };
}

const off = (d: number) => d <= -1 || d >= 1;

/** A: side by side. The screens lie in a row with a strip of the dark room between them, the row moves with your
 * finger, and the tab bar's marker slides along under it. */
const strip: Look = {
  id: 'strip',
  name: 'Side by side',
  blurb: 'The screens sit in a row and move with your finger.',
  pane: (d, _i, { w }) => (off(d) ? { hidden: true } : { transform: `translate3d(${d * (w + 14)}px, 0, 0)` }),
};

/** B: pull the top sheet. The screens are a pile of sheets: going on pulls the top one off to the side, tilting as it
 * goes, and the next one rises from underneath; going back lays the last one down on top again. */
const pile: Look = {
  id: 'pile',
  name: 'Pull the top sheet',
  blurb: 'The top sheet is pulled off the pile; the next rises from under it.',
  pane: (d, _i, { w }) => {
    if (off(d)) return { hidden: true };
    if (d <= 0) {
      const lift = Math.min(1, -d * 5);
      return {
        z: 3,
        transform: `translate3d(${d * w * 1.12}px, ${lift * -4}px, 0) rotate(${d * 7}deg) scale(${1 + lift * 0.015})`,
        origin: '50% 130%',
        shadow: `0 ${14 * lift}px ${40 * lift}px rgba(0, 0, 0, ${0.55 * lift})`,
      };
    }
    return { z: 2, transform: `scale(${1 - 0.06 * d})`, shade: 0.5 * d };
  },
};

/** C: turn the page. Like the log book's own pages: the screen turns over on its left edge towards you, darkening as
 * it goes, and the next is the page underneath; going back turns the last page down again. */
const page: Look = {
  id: 'page',
  name: 'Turn the page',
  blurb: 'Each screen turns over like a page, on its left edge.',
  pane: (d) => {
    if (off(d)) return { hidden: true };
    if (d <= 0) {
      return {
        z: 3,
        transform: `perspective(2200px) rotateY(${d * 90}deg)`,
        origin: '0 50%',
        shade: 0.45 * -d,
        shadow: d < 0 ? `-12px 0 30px rgba(0, 0, 0, ${0.5 * Math.min(1, -d * 3)})` : undefined,
      };
    }
    return { z: 2, shade: 0.55 * d };
  },
};

/** D: pan the evidence board. The three screens are pinned side by side on a cork board: the camera pulls back as you
 * swipe, so you see the pins and the red string between them, pans along and pushes in on the next. */
const ZOOM = 0.24;
const BOARD_GAP = 46;
const PIN_Y = 16;
/** How far back the camera is: 0 at a screen, the most halfway between. */
const zoomedAt = (pos: number) => Math.sin(Math.PI * (pos - Math.floor(pos)));
const board: Look = {
  id: 'board',
  name: 'Pan the evidence board',
  blurb: 'The camera pulls back across the cork board to the next screen.',
  pane: (d, i, { pos, w }) => {
    if (d <= -1.6 || d >= 1.6) return { hidden: true };
    const k = zoomedAt(pos);
    const z = 1 - ZOOM * k;
    const tilt = (i % 2 ? 1.4 : -1.1) * k;
    return {
      transform: `translate3d(${d * (w + BOARD_GAP) * z}px, 0, 0) scale(${z}) rotate(${tilt}deg)`,
      shadow: `0 ${10 * k}px ${34 * k}px rgba(0, 0, 0, ${0.6 * k})`,
      vars: { '--zoomed': String(k) },
    };
  },
  between: (d, { pos, w, h }) => {
    const k = zoomedAt(pos);
    if (k < 0.02 || d <= -1.2 || d >= 1.2) return { hidden: true };
    const z = 1 - ZOOM * k;
    const span = (w + BOARD_GAP) * z;
    const x = w / 2 + d * span - span / 2;
    const y = h / 2 + (PIN_Y - h / 2) * z;
    return { z: 4, transform: `translate3d(${x}px, ${y}px, 0) scale(${span / 100}, ${z})`, vars: { '--zoomed': String(k) } };
  },
};

/** E: torch. The room is dark; as you swipe, a torch beam opens from the edge you pull from and lights the next screen,
 * while the one you leave goes dark. Going back, the beam closes into the edge it came from. */
const torch: Look = {
  id: 'torch',
  name: 'Torch',
  blurb: 'A torch beam opens from the edge and lights the next screen.',
  pane: (d, _i, { w, h }) => {
    if (off(d)) return { hidden: true };
    if (d > 0) {
      const r = Math.hypot(w, h / 2) * 1.04 * (1 - d);
      return { z: 3, clip: `circle(${r}px at ${w}px ${h / 2}px)` };
    }
    return { z: 2, shade: 0.8 * -d, transform: `scale(${1 - 0.025 * -d})` };
  },
  overlay: ({ pos, w, h }) => {
    const t = pos - Math.floor(pos);
    if (t < 0.002 || t > 0.998) return { hidden: true };
    const size = 2 * Math.hypot(w, h / 2) * 1.04 * t;
    return { z: 5, box: { x: w - size / 2, y: h / 2 - size / 2, size }, vars: { '--beam': String(Math.min(1, Math.sin(Math.PI * t) * 1.6)) } };
  },
};

export const LOOKS: Look[] = [strip, pile, page, board, torch];
