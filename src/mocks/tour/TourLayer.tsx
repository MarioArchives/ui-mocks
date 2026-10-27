// The tour over the app: everything dark but a torch's spot on the stop's element, a kraft tag hanging from a brass
// tack on it, the SPECIMEN NIGHT badge and a way out at the top. The spot, the twine, the tacks and the tag glide from
// stop to stop (or jump, with reduced motion); the tag swings a little as it lands.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { HangTag, Tack } from './HangTag';
import { place, type Limits, type Placement } from './layout';
import { ArrowIcon, CheckIcon, TagText } from './screens';
import { STOPS, TILT } from './stops';

export type Phase = 'in' | 'on' | 'out' | 'gone';

/** Whether the SPECIMEN NIGHT badge steps down under the case number: when the torch is on it where it hangs, at the
 * top in the middle, and not on the place it would step down to. */
function low(spot: Placement['spot'], width: number): boolean {
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
  };
}

export function TourLayer({
  root,
  stop,
  phase,
  first,
  last,
  reduced,
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
  reduced: boolean;
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
      const p = place(el, s, { w, h: t.offsetHeight }, limits(el, top.current));
      if (!p) return;
      if (instant) setJump(true);
      setAt(p);
      const behavior = reduced || instant ? 'auto' : 'smooth';
      if (p.scroll) p.scroll.el.scrollTo({ top: p.scroll.top, behavior });
      // A tab with nothing lit on it goes back to its top, rather than staying wherever the last stop left it.
      const tab = el.querySelector<HTMLElement>(`.tr-pane--${s.tab}[data-scroller]`);
      if (tab && tab.scrollTop > 0 && !s.lit.some((name) => tab.querySelector(`[data-tour="${name}"]`))) tab.scrollTo({ top: 0, behavior });
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

  const shown = phase === 'on' && at;
  return (
    <div className={`tr-tour is-${phase}${jump ? ' is-jump' : ''}`}>
      <div className="tr-catch" aria-hidden="true" />
      <span
        className="tr-spot"
        style={at ? { left: at.spot.x, top: at.spot.y, width: at.spot.w, height: at.spot.h } : { left: '50%', top: '45%', width: 0, height: 0 }}
        aria-hidden="true"
      />
      {shown && s.pen === 'swipe' ? (
        <span className="tr-pen" style={{ left: at.spot.x + at.spot.w / 2, top: at.spot.y + 18 }} aria-hidden="true">
          <svg viewBox="0 0 250 40">
            <path d="M8 22 C 70 14, 170 14, 242 20" />
            <path d="M20 12l-12 10 13 8" />
            <path d="M230 9l12 11-13 9" />
          </svg>
          <span>swipe</span>
        </span>
      ) : null}
      <div className={`tr-hang${shown ? ' is-shown' : ''}`}>
        {at ? <span className="tr-cord" style={{ left: at.cord.x - 1.5, top: at.cord.y1, height: Math.max(0, at.cord.y2 - at.cord.y1) }} /> : null}
        {at?.tacks.map((t, i) => <Tack key={i} x={t.x} y={t.y} />)}
        <HangTag
          width={width}
          tilt={TILT[stop] ?? 0}
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
      <div className={`tr-strip${shown && low(shown.spot, root.current?.clientWidth ?? 390) ? ' is-low' : ''}`} ref={top}>
        <button type="button" className="tr-end" onClick={onEnd}>
          End tour
        </button>
        <span className="tr-specimen">Specimen night</span>
      </div>
      <p className="tr-sr" aria-live="polite">
        {shown ? `Stop ${stop + 1} of ${STOPS.length}: ${s.title}.` : ''}
      </p>
    </div>
  );
}
