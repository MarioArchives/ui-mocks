// The tour over the app: everything dark but a torch's spot on the stop's element, a kraft tag tied to a brass tack on
// it (hanging under it, or turned over above it so the twine never crosses the tag), the SPECIMEN NIGHT badge at the
// top, and at the foot a progress bar and Skip. The spot, the twine, the tacks and the tag glide from stop to stop (or
// jump, with reduced motion); the tag swings a little as it lands. On the way to somewhere else the torch goes to each
// thing you'd tap (a hop), the red pen (Marks.tsx) drawing an arrow to it unless the hop says not to.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { HangTag, Tack } from './HangTag';
import { place, selectorOf, type Box, type Limits, type Placement } from './layout';
import { Arrow, boxIn, contains, union, within } from './Marks';
import { ArrowIcon, CheckIcon, TagText } from './screens';
import { STOPS, TILT } from './stops';

export type Phase = 'in' | 'on' | 'out' | 'gone';

/** A hop on the way to a stop elsewhere, as the tour shows it: what to point at, from where, and when to look. */
export interface HopView {
  /** The thing you'd tap: a selector, or a data-tour name. */
  target: string;
  /** What was lit before it (names or selectors), for the arrow to start from. */
  from: string[];
  /** What a screen reader hears on the way ("the Map"); nothing is written on the screen. */
  label: string;
  /** Wait this long first (the page turning to the hop's screen). */
  settle: number;
  /** On a screen other than the stop's (so nothing the stop lit is there). */
  elsewhere: boolean;
  /** Draw the pen's arrow to it (the torch goes there either way). */
  arrow: boolean;
}

/** Whether the SPECIMEN NIGHT badge steps down under the case number: when the torch is on it where it hangs, at the
 * top in the middle, and not on the place it would step down to. */
function low(spot: Box, width: number): boolean {
  const hits = (x: number, y: number, w: number, h: number) => spot.x < x + w && spot.x + spot.w > x && spot.y < y + h && spot.y + spot.h > y;
  return hits(width / 2 - 80, 0, 160, 40) && !hits(4, 46, 156, 38);
}

/** The tag's width: the stop's own, else the mockup's 220, never wider than the phone allows. */
const tagWidth = (stop: number, phone: number) => Math.min(STOPS[stop]!.width ?? 220, phone - 24);

function limits(root: HTMLElement, top: HTMLElement | null): Limits {
  const bar = root.querySelector<HTMLElement>('.tr-bar');
  const nav = bar?.querySelector<HTMLElement>('.tabbar');
  const inset = nav ? parseFloat(getComputedStyle(nav).paddingBottom) || 0 : 0;
  return {
    top: top ? top.offsetTop + top.offsetHeight + 2 : 40,
    bottom: bar ? bar.offsetTop + bar.offsetHeight - inset - 6 : root.clientHeight - 8,
    width: root.clientWidth,
    floor: root.clientHeight,
  };
}

/** The visible part of what `names` light, in the root; null when none of it is on the page. */
function litBox(root: HTMLElement, names: string[], lim: Limits): Box | null {
  const boxes = names.flatMap((name) => {
    const el = root.querySelector(selectorOf(name));
    return el && (el as HTMLElement).offsetParent ? [boxIn(el, root)] : [];
  });
  const u = union(boxes);
  return u ? within(u, lim.top, lim.bottom) : null;
}

/** Light round a box, inside the phone's sides. */
const padded = (b: Box, width: number, pad = 6): Box => {
  const x0 = Math.max(4, b.x - pad);
  const x1 = Math.min(width - 4, b.x + b.w + pad);
  return { x: x0, y: b.y - pad, w: x1 - x0, h: b.h + pad * 2 };
};

/** Where an arrow from the tag sets off: from its side facing the target, a third of the way down, so the arrow has
 * room to sweep out and round even when the target sits right by the tag. */
const tagSide = (tag: Box, to: Box): Box => {
  const left = to.x + to.w / 2 < tag.x + tag.w / 2;
  return { x: left ? tag.x - 2 : tag.x + tag.w - 2, y: tag.y + tag.h * 0.35, w: 4, h: 4 };
};

/** The hop as drawn: the box the arrow leaves, the one it reaches, and whether the torch stays where it is (the thing to
 * tap is inside what's lit, so the arrow comes from the tag instead). */
interface HopAt {
  from: Box;
  to: Box;
  inner: boolean;
  /** The tag's middle, for an arrow from its side to bow away from. */
  away?: { x: number; y: number };
  key: string;
}

export function TourLayer({
  root,
  stop,
  phase,
  first,
  last,
  progress,
  reduced,
  hop,
  onHopShown,
  onBack,
  onNext,
  onEnd,
}: {
  root: RefObject<HTMLDivElement | null>;
  stop: number;
  phase: Phase;
  /** No stop before this one in this run (Back has nowhere to go). */
  first: boolean;
  /** The run's last stop: Next says Done. */
  last: boolean;
  /** How far through the run this stop is: the `at`th of `of` (a part of the tour counts only its own stops). */
  progress: { at: number; of: number };
  reduced: boolean;
  /** On the way to the next stop: what's being pointed at. */
  hop: HopView | null;
  /** The hop has been pointed out (or there was nothing to point at): the tour can move on. */
  onHopShown: () => void;
  onBack: () => void;
  onNext: () => void;
  onEnd: () => void;
}) {
  const tag = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const go = useRef<HTMLButtonElement>(null);
  const [at, setAt] = useState<Placement | null>(null);
  /** The first placement (and one after a resize) lands without gliding. */
  const [jump, setJump] = useState(true);
  const [width, setWidth] = useState(() => tagWidth(stop, root.current?.clientWidth ?? 390));
  const [screen, setScreen] = useState({ w: 390, h: 844, top: 40 });
  const s = STOPS[stop]!;

  const relayout = useCallback(
    (instant: boolean) => {
      const el = root.current;
      const t = tag.current;
      if (!el || !t) return;
      const w = tagWidth(stop, el.clientWidth);
      if (w !== width) {
        setWidth(w); // measured again once it's that wide
        return;
      }
      const lim = limits(el, top.current);
      setScreen({ w: el.clientWidth, h: el.clientHeight, top: lim.top });
      const p = place(el, s, { w, h: t.offsetHeight }, lim);
      if (!p) return;
      if (instant) setJump(true);
      setAt(p);
      const behavior = reduced || instant ? 'auto' : 'smooth';
      if (p.scroll) p.scroll.el.scrollTo({ top: p.scroll.top, behavior });
      // A tab with nothing lit on it goes back to its top, rather than staying wherever the last stop left it.
      const tab = el.querySelector<HTMLElement>(`.tr-pane--${s.tab}[data-scroller]`);
      if (tab && tab.scrollTop > 0 && !s.lit.some((name) => tab.querySelector(selectorOf(name)))) tab.scrollTo({ top: 0, behavior });
    },
    [root, s, stop, width, reduced],
  );

  const latest = useRef(relayout);
  latest.current = relayout;

  // Each stop (and the moment the specimen night is in place): measure, then hang.
  useLayoutEffect(() => {
    if (phase !== 'on') return;
    relayout(at === null);
  }, [phase, stop, width, relayout]);

  // After a jump, glide again from the next stop on.
  useEffect(() => {
    if (!jump || !at) return;
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setJump(false)));
    return () => cancelAnimationFrame(id);
  }, [jump, at]);

  // The phone turning, the browser's bars, the fonts arriving: hang it again where it now belongs.
  useEffect(() => {
    const el = root.current;
    if (!el || phase !== 'on') return;
    let size = `${el.clientWidth}x${el.clientHeight}`;
    const seen = new ResizeObserver(() => {
      const now = `${el.clientWidth}x${el.clientHeight}`;
      if (now === size) return;
      size = now;
      latest.current(true);
    });
    seen.observe(el);
    let live = true;
    void document.fonts?.ready.then(() => live && latest.current(false));
    return () => {
      live = false;
      seen.disconnect();
    };
  }, [root, phase]);

  // The tag swings as it lands on a new stop, and keeps the keyboard on Next.
  const landed = useRef(stop);
  useEffect(() => {
    if (!at) return;
    go.current?.focus({ preventScroll: true });
    if (landed.current === stop) return;
    landed.current = stop;
    if (reduced) return;
    tag.current?.animate([{ rotate: '5deg' }, { rotate: '-3deg' }, { rotate: '1.4deg' }, { rotate: '-0.5deg' }, { rotate: '0deg' }], {
      duration: 1300,
      easing: 'ease-out',
    });
  }, [at, stop, reduced]);

  /** Waits, unless motion is reduced (then everything is where it ends up at once). */
  const settled = (ms: number) => (reduced ? 0 : ms);

  // A hop: the page brought round to it if it's scrolled away, then the arrow from what was lit to the thing to tap,
  // the torch going with it unless that thing is inside what's lit already.
  const [hopAt, setHopAt] = useState<HopAt | null>(null);
  /** Where the torch is on a hop elsewhere; it stays there between one hop and the next, until the stop. */
  const [hopSpot, setHopSpot] = useState<Box | null>(null);
  useEffect(() => {
    if (!hop) setHopSpot(null);
  }, [hop]);
  const atRef = useRef(at);
  atRef.current = at;
  const shownRef = useRef(onHopShown);
  shownRef.current = onHopShown;
  useEffect(() => {
    setHopAt(null);
    const el = root.current;
    if (!hop || phase !== 'on' || !el) return;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => timers.push(window.setTimeout(fn, ms));
    later(() => {
      const target = el.querySelector<HTMLElement>(selectorOf(hop.target));
      if (!target) return shownRef.current();
      const lim = limits(el, top.current);
      const scroller = target.closest<HTMLElement>('[data-scroller]');
      const r = boxIn(target, el);
      let wait = 0;
      if (scroller && (r.y < lim.top + 10 || r.y + r.h > lim.bottom - 10)) {
        const by = r.y < lim.top + 10 ? r.y - lim.top - 24 : r.y + r.h - lim.bottom + 24;
        scroller.scrollBy({ top: by, behavior: reduced ? 'auto' : 'smooth' });
        wait = settled(420);
      }
      later(() => {
        const to = boxIn(target, el);
        const spot = atRef.current?.spot;
        const inner = !hop.elsewhere && !!spot && contains(spot, { x: to.x + to.w / 2, y: to.y + to.h / 2 });
        // From what was lit, unless that holds the target too (the arrow would point back into itself): then the torch's
        // spot, or failing that the tag.
        const mid = { x: to.x + to.w / 2, y: to.y + to.h / 2 };
        const lit = litBox(el, hop.from, lim);
        const outside = (b: Box | null | undefined) => (b && !contains(b, mid) ? b : null);
        const plain = inner ? null : (outside(lit) ?? outside(spot));
        const t = !plain && tag.current ? boxIn(tag.current, el) : null;
        const from = plain ?? (t ? tagSide(t, to) : to);
        setHopAt({ from, to, inner, away: t ? { x: t.x + t.w / 2, y: t.y + t.h / 2 } : undefined, key: hop.target });
        if (!inner) setHopSpot(padded(to, el.clientWidth));
        // The arrow and its head take this long to draw (or, without one, the torch to get there); a moment, then on.
        later(() => shownRef.current(), reduced ? 650 : !hop.arrow ? 900 : inner ? 1050 : 1250);
      }, wait);
    }, hop.settle);
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [hop, phase, root, reduced]);

  const shown = phase === 'on' && at;
  // On a hop elsewhere the torch goes to the thing to tap and the tag steps back; on one inside what's lit, both stay.
  const away = !!hop && !(hopAt?.inner ?? false);
  const spot = (hop && hopSpot) || at?.spot;

  return (
    <div className={`tr-tour is-${phase}${jump ? ' is-jump' : ''}`}>
      <div className="tr-catch" aria-hidden="true" />
      <span
        className="tr-spot"
        style={spot ? { left: spot.x, top: spot.y, width: spot.w, height: spot.h } : { left: '50%', top: '45%', width: 0, height: 0 }}
        aria-hidden="true"
      />
      {shown && !hop && s.pen === 'swipe' ? (
        <span className="tr-pen" style={{ left: at.spot.x + at.spot.w / 2, top: at.spot.y + 18 }} aria-hidden="true">
          <svg viewBox="0 0 250 40">
            <path d="M8 22 C 70 14, 170 14, 242 20" />
            <path d="M20 12l-12 10 13 8" />
            <path d="M230 9l12 11-13 9" />
          </svg>
        </span>
      ) : null}
      {shown ? (
        <svg className="tr-marks" aria-hidden="true">
          {hopAt && hop?.arrow ? (
            <Arrow key={`hop-${hopAt.key}`} from={hopAt.from} to={hopAt.to} screen={screen} away={hopAt.away} delay={hopAt.inner ? 0 : 0.25} />
          ) : null}
        </svg>
      ) : null}
      <div className={`tr-hang${shown && !away ? ' is-shown' : ''}`}>
        {at ? <span className="tr-cord" style={{ left: at.cord.x - 1.5, top: at.cord.y1, height: Math.max(0, at.cord.y2 - at.cord.y1) }} /> : null}
        {at?.tacks.map((t, i) => <Tack key={i} x={t.x} y={t.y} />)}
        <HangTag
          width={width}
          tilt={TILT[stop] ?? 0}
          flip={at?.flip}
          className="tr-ht--tour"
          style={at ? { left: at.tag.x, top: at.tag.y } : { left: 0, top: 0 }}
          ref={tag}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="tr-stop-title" aria-describedby="tr-stop-text">
            <p className="tr-ht__no">
              <span>No. {stop + 1}</span>
              <span>of {STOPS.length}</span>
            </p>
            <p className="tr-ht__sec" id="tr-stop-title">
              {s.title}
            </p>
            <p className="tr-ht__t" id="tr-stop-text">
              <TagText text={s.text} />
            </p>
            <p className="tr-ht__foot">
              <button type="button" className="tr-ht__back" onClick={onBack} disabled={first}>
                Back
              </button>
              <button type="button" className="tr-ht__go" onClick={onNext} ref={go}>
                {last ? (
                  <>
                    Done <CheckIcon />
                  </>
                ) : (
                  <>
                    Next <ArrowIcon />
                  </>
                )}
              </button>
            </p>
          </div>
        </HangTag>
      </div>
      <span className="tr-black" aria-hidden="true" />
      <div className={`tr-strip${spot && low(spot, screen.w) ? ' is-low' : ''}`} ref={top}>
        <span className="tr-specimen">Specimen night</span>
      </div>
      <div className="tr-dock">
        <div
          className="tr-progress"
          role="progressbar"
          aria-label="The tour"
          aria-valuemin={1}
          aria-valuemax={progress.of}
          aria-valuenow={progress.at}
          aria-valuetext={`Stop ${progress.at} of ${progress.of}`}
        >
          {Array.from({ length: progress.of }, (_, i) => (
            <span key={i} className={i < progress.at - 1 ? 'is-done' : i === progress.at - 1 ? 'is-on' : undefined} />
          ))}
        </div>
        <button type="button" className="tr-skip" onClick={onEnd}>
          Skip
        </button>
      </div>
      <p className="tr-sr" aria-live="polite">
        {hop ? `On the way: ${hop.label}.` : shown ? `Stop ${progress.at} of ${progress.of}: ${s.title}.` : ''}
      </p>
    </div>
  );
}
