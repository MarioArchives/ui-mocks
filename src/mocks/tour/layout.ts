// Where the torch's spot, the brass tacks, the twine and the hanging tag go for one stop. The lit elements are
// measured where they will rest (by offsets, which ignore transforms, so a screen still sliding in or a sheet still
// rising counts as arrived), and a screen that scrolls is scrolled, as little as it can be, so the element and its tag
// both fit. The tag hangs under the spot from a tack on its bottom edge when there's room; otherwise from a tack at
// the top of the screen, its twine running on down behind it to a tack on the spot. When neither fits (a short
// screen), the smaller `core` box is tried, and last of all the tag hangs over the foot of a shortened spot.

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Placement {
  spot: Box;
  /** The tag's top left corner. */
  tag: { x: number; y: number };
  /** The twine, a straight drop. */
  cord: { x: number; y1: number; y2: number };
  tacks: { x: number; y: number }[];
  /** A screen to scroll, and where to. */
  scroll: { el: HTMLElement; top: number } | null;
}

/** The free space the tag may hang in: under the overlay's top strip, above the tab bar's home-indicator inset. */
export interface Limits {
  top: number;
  bottom: number;
  width: number;
}

/** Light around an element. */
const PAD = 8;
/** The spot keeps this far inside the phone's sides. */
const SIDE = 4;
/** The tag keeps this far inside the phone's sides. */
const TAG_SIDE = 10;
/** Under the spot: its tack sits 8px inside the bottom edge, the twine drops 24px to the knot and the tag's top is
 * 20px under the knot, so the tag starts this far below the spot. */
const BELOW = 36;
/** From the top: the tack 9px under the limit, the tag 42px under the tack. */
const TOP_TACK = 9;
const TOP_TAG = TOP_TACK + 42;
/** Room kept between a tag hung from the top and the spot under it. */
const GAP = 12;

/** Where `el` sits inside `ancestor` (one of its offset parents), ignoring transforms and the ancestor's scroll. */
export function offsetIn(el: HTMLElement, ancestor: HTMLElement): { x: number; y: number } {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    const parent = node.offsetParent as HTMLElement | null;
    if (!parent) break;
    if (parent !== ancestor) {
      x += parent.clientLeft;
      y += parent.clientTop;
    }
    node = parent;
  }
  return { x, y };
}

interface Lit {
  /** In the scroller's content when it has one, else in the root. */
  box: Box;
  scroller: HTMLElement | null;
}

function measure(root: HTMLElement, names: string[]): Lit[] {
  const out: Lit[] = [];
  for (const name of names) {
    const el = root.querySelector<HTMLElement>(`[data-tour="${name}"]`);
    if (!el || !el.offsetParent) continue;
    const scroller = el.parentElement?.closest<HTMLElement>('[data-scroller]') ?? null;
    const at = offsetIn(el, scroller && root.contains(scroller) ? scroller : root);
    out.push({ box: { x: at.x, y: at.y, w: el.offsetWidth, h: el.offsetHeight }, scroller });
  }
  return out;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function union(boxes: Box[]): Box {
  const x0 = Math.min(...boxes.map((b) => b.x));
  const y0 = Math.min(...boxes.map((b) => b.y));
  const x1 = Math.max(...boxes.map((b) => b.x + b.w));
  const y1 = Math.max(...boxes.map((b) => b.y + b.h));
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

interface View {
  el: HTMLElement;
  /** The scroller's visible box, in the root. */
  x: number;
  top: number;
  h: number;
  now: number;
  max: number;
}

function viewOf(el: HTMLElement, root: HTMLElement): View {
  const at = offsetIn(el, root);
  return { el, x: at.x + el.clientLeft, top: at.y + el.clientTop, h: el.clientHeight, now: el.scrollTop, max: Math.max(0, el.scrollHeight - el.clientHeight) };
}

export interface StopShape {
  lit: string[];
  core?: string[];
  growTop?: number;
}

/** Lays one stop out; null while none of its elements are on the page. */
export function place(root: HTMLElement, stop: StopShape, tag: { w: number; h: number }, lim: Limits): Placement | null {
  const tries = stop.core ? [stop.lit, stop.core] : [stop.lit];
  for (const names of tries) {
    const lits = measure(root, names);
    if (!lits.length) continue;
    const fit = fitWith(root, lits, tag, lim, stop.growTop ?? 0);
    if (fit) return fit;
  }
  const lits = measure(root, stop.core ?? stop.lit);
  return lits.length ? squeeze(root, lits, tag, lim, stop.growTop ?? 0) : null;
}

/** The lit boxes in the root with the scroller at `s`, padded, as the spot; the light stops at a scroller's edges. */
function spotAt(lits: Lit[], view: View | null, s: number, lim: Limits, growTop: number): Box {
  const boxes = lits.map((l) => (l.scroller && view ? { ...l.box, x: view.x + l.box.x, y: view.top + l.box.y - s } : l.box));
  const u = union(boxes);
  const x0 = clamp(u.x - PAD, SIDE, lim.width - SIDE);
  const x1 = clamp(u.x + u.w + PAD, SIDE, lim.width - SIDE);
  let y0 = u.y - PAD - growTop;
  let y1 = u.y + u.h + PAD;
  if (view) {
    y0 = Math.max(y0, view.top);
    y1 = Math.min(y1, view.top + view.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

/** The tag centred under (or over) the spot, inside the phone's sides; the twine's x follows its knot. */
function tagX(spot: Box, tag: { w: number }, lim: Limits) {
  const x = clamp(spot.x + spot.w / 2 - tag.w / 2, TAG_SIDE, lim.width - TAG_SIDE - tag.w);
  return { x, knot: x + tag.w / 2 + 2 };
}

function hangBelow(spot: Box, tag: { w: number; h: number }, lim: Limits, scroll: Placement['scroll'], tagTop?: number): Placement {
  const { x, knot } = tagX(spot, tag, lim);
  const tack = spot.y + spot.h - PAD;
  const y = tagTop ?? tack + 44;
  return { spot, tag: { x, y }, cord: { x: knot, y1: tack, y2: y - 20 }, tacks: [{ x: knot, y: tack }], scroll };
}

function hangAbove(spot: Box, tag: { w: number; h: number }, lim: Limits, scroll: Placement['scroll']): Placement {
  const { x, knot } = tagX(spot, tag, lim);
  const top = lim.top + TOP_TACK;
  const bottom = spot.y + PAD + 1;
  return { spot, tag: { x, y: lim.top + TOP_TAG }, cord: { x: knot, y1: top, y2: bottom }, tacks: [{ x: knot, y: top }, { x: knot, y: bottom }], scroll };
}

const fitsBelow = (spot: Box, tag: { h: number }, lim: Limits) => spot.y + spot.h + BELOW + tag.h <= lim.bottom;
const fitsAbove = (spot: Box, tag: { h: number }, lim: Limits) => lim.top + TOP_TAG + tag.h + GAP <= spot.y;

function fitWith(root: HTMLElement, lits: Lit[], tag: { w: number; h: number }, lim: Limits, growTop: number): Placement | null {
  const sc = lits.find((l) => l.scroller)?.scroller ?? null;
  const view = sc ? viewOf(sc, root) : null;
  if (!view) {
    const spot = spotAt(lits, null, 0, lim, growTop);
    if (fitsBelow(spot, tag, lim)) return hangBelow(spot, tag, lim, null);
    if (fitsAbove(spot, tag, lim)) return hangAbove(spot, tag, lim, null);
    return null;
  }
  // The scrolled part's top and bottom in the scroller's content.
  const scrolled = union(lits.filter((l) => l.scroller).map((l) => l.box));
  const top = scrolled.y;
  const bottom = scrolled.y + scrolled.h;
  /** Scrolled no further than `hi`, the lit part's top (and its light, where it can) stays on screen; at least `seen`,
   * its bottom does. */
  const hi = clamp(top - PAD - growTop, 0, view.max);
  const seen = clamp(bottom + PAD - view.h, 0, view.max);
  const ok = (s: number, room: (spot: Box) => boolean) => {
    const shown = top - s >= -0.5 && bottom - s <= view.h + 0.5;
    const spot = spotAt(lits, view, s, lim, growTop);
    return shown && room(spot) ? spot : null;
  };
  const scrollTo = (s: number) => (Math.abs(s - view.now) > 1 ? { el: view.el, top: s } : null);

  // Under the spot: scroll down just enough for the tag to fit below it.
  const lo = Math.max(seen, view.top + bottom + PAD + BELOW + tag.h - lim.bottom, 0);
  if (lo <= hi) {
    const s = Math.round(clamp(view.now, lo, hi));
    const spot = ok(s, (b) => fitsBelow(b, tag, lim));
    if (spot) return hangBelow(spot, tag, lim, scrollTo(s));
  }
  // From the top: scroll up just enough for the tag to fit above the spot.
  const hiAbove = Math.min(hi, view.top + top - PAD - lim.top - TOP_TAG - tag.h - GAP);
  if (seen <= hiAbove) {
    const s = Math.round(clamp(view.now, seen, hiAbove));
    const spot = ok(s, (b) => fitsAbove(b, tag, lim));
    if (spot) return hangAbove(spot, tag, lim, scrollTo(s));
  }
  return null;
}

/** Last resort on a short screen: the element at the top, the tag under it as far as it can go, and the spot cut
 * short where the tag's twine begins, so nothing lit hides behind the tag. */
function squeeze(root: HTMLElement, lits: Lit[], tag: { w: number; h: number }, lim: Limits, growTop: number): Placement {
  const sc = lits.find((l) => l.scroller)?.scroller ?? null;
  const view = sc ? viewOf(sc, root) : null;
  let s = 0;
  if (view) {
    const scrolled = union(lits.filter((l) => l.scroller).map((l) => l.box));
    s = Math.round(clamp(scrolled.y - PAD - growTop, 0, view.max));
  }
  const full = spotAt(lits, view, s, lim, growTop);
  const lowest = Math.max(lim.top + 60, lim.bottom - tag.h);
  const spot = { ...full, h: Math.max(48, Math.min(full.h, lowest - BELOW - full.y)) };
  const scroll = view && Math.abs(s - view.now) > 1 ? { el: view.el, top: s } : null;
  return hangBelow(spot, tag, lim, scroll, Math.max(lowest, spot.y + spot.h + BELOW));
}
