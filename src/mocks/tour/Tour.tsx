// The torch tour (Mystery Pub Crawl): the new player's walkthrough, on the game's own screens. A player has booked in
// and the case is still sealed: Missions shows the sealed case file with its countdown, and a kraft tag tied to its
// twine offers the tour. Taking it fills the tabs with a specimen night (the game's demo, as Maya) and puts out the
// lights but for a torch on one thing at a time, with a tag on twine saying what it does: thirteen stops across
// Missions (its map and standings too), Log book and My file, the tabs turning as it goes. Next and Back on the tag, or
// ← → on a keyboard; Escape or End tour leaves. Afterwards My file keeps "How tonight works": the whole tour again, or
// one part of it.
//
// Every screen is a snapshot of the real game (Snapshot.tsx, scripts/snapshot-tour.mjs). Outside the tour the three
// tabs turn as in the game. `?stop=5` in the address (before the #) opens the tour at that stop, and `?tab=file` opens
// on a tab, to show someone one place.
import '@fontsource/caveat/latin-700.css';
import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import '../../themes/mystery.css';
import { usePager } from '../swipe/pager';
import { offsetIn } from './layout';
import { OFFER_WIDTH, OfferTag, TourCard, type OfferAt } from './screens';
import { Page, ShadowFrame, SNAP, shown, tick } from './Snapshot';
import { PARTS, SEALED, SPECIMEN, STOPS, TABS, type Hop, type SceneId, type TabId } from './stops';
import { TourLayer, type HopView, type Phase } from './TourLayer';

/** A run of the tour: the stop it's on, the stops it covers (the whole tour or one part) and the tab it started on. */
interface Run {
  stop: number;
  from: number;
  to: number;
  origin: number;
  phase: Phase;
  /** Ended at the last stop rather than left early. */
  done?: boolean;
  /** On the way to stop `to`: showing its i-th hop. */
  hop?: { to: number; i: number };
}

/** How long the lights take to go down, or come up, around the swap to and from the specimen night. */
const DIM_MS = 260;
const HOLD_MS = 360;
/** With reduced motion the pager's spring runs this many times faster, so a tab change lands in one frame. */
const INSTANT = 1e-4;
/** A hop: the page turning to its screen (when it has one) before the pen points; the tour layer says when it has
 * pointed (HOP_SAFE_MS is in case it never does). */
const HOP_TURN_MS = 560;
const HOP_SAFE_MS = 4000;

/** The screen a hop is pointed at on: the last one of its hops so far that moves to another, if any. */
const hopScreen = (via: Hop[], i: number) => via.slice(0, i + 1).reverse().find((h) => h.at)?.at ?? null;

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  useEffect(() => {
    const q = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!q) return;
    const on = () => setReduced(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return reduced;
}

const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export default function TorchTour() {
  return (
    <ShadowFrame>
      <Frame />
    </ShadowFrame>
  );
}

function Frame() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const panes = useRef<(HTMLElement | null)[]>([]);
  const reduced = useReducedMotion();

  const [offer, setOffer] = useState<'open' | 'leaving' | 'gone'>('open');
  const [taken, setTaken] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // The game's page turn: going on, the page you leave turns over on its left edge towards you and darkens, the next
  // lying under it; going back, the previous page comes down on top. One number, the position along the tabs, draws it.
  const paint = useCallback((pos: number) => {
    panes.current.forEach((pane, i) => {
      if (!pane) return;
      const d = i - pos;
      const s = pane.style;
      if (d <= -1 || d >= 1) {
        s.visibility = 'hidden';
        s.transform = s.filter = '';
        s.zIndex = '0';
      } else if (d <= 0) {
        s.visibility = '';
        s.zIndex = '2';
        s.transform = d < 0 ? `perspective(2200px) rotateY(${d * 90}deg)` : '';
        s.filter = d < 0 ? `brightness(${1 + 0.45 * d})` : '';
      } else {
        s.visibility = '';
        s.zIndex = '1';
        s.transform = '';
        s.filter = `brightness(${0.45 + 0.55 * (1 - d)})`;
      }
    });
  }, []);
  const { index, goTo } = usePager(stage, TABS.length, paint, reduced ? INSTANT : 1);

  // Timers that outlive a click (the lights, the toast), cleared if the mock is left.
  const timers = useRef<number[]>([]);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  const say = useCallback(
    (text: string) => {
      setToast(text);
      later(() => setToast((t) => (t === text ? null : t)), 3600);
    },
    [later],
  );

  const runRef = useRef(run);
  runRef.current = run;
  const indexRef = useRef(index);
  indexRef.current = index;

  /** Starts the tour, the whole of it or one part: the lights go down, then the specimen night is lit stop by stop. */
  const begin = useCallback(
    (from = 0, to = STOPS.length - 1) => {
      if (runRef.current) return;
      setToast(null);
      setOffer((o) => (o === 'open' ? 'gone' : o));
      setRun({ stop: from, from, to, origin: indexRef.current, phase: 'in' });
      later(() => setRun((r) => r && { ...r, phase: 'on' }), reduced ? 0 : DIM_MS);
    },
    [later, reduced],
  );

  /** Counts moves, so a hop still under way knows when it has been overtaken (Next, Back, End tour). */
  const hopping = useRef(0);
  const hopShown = useRef<() => void>(() => {});

  /** Leaves the tour: the lights go down, the app comes back as it was, the lights come up. */
  const finish = useCallback(
    (done: boolean) => {
      const r = runRef.current;
      if (!r || r.phase !== 'on') return;
      hopping.current++; // a hop under way stops here
      setRun({ ...r, phase: 'out', hop: undefined, done });
      later(() => {
        setRun((x) => x && { ...x, phase: 'gone' });
        goTo(r.origin);
        if (done) setTaken(hhmm(new Date()));
      }, reduced ? 0 : DIM_MS);
      later(() => {
        setRun(null);
        say(done ? 'Tour done. It stays in My file: How tonight works.' : 'Tour closed. Pick it up in My file whenever you like.');
      }, reduced ? 0 : DIM_MS + HOLD_MS + DIM_MS);
    },
    [later, reduced, goTo, say],
  );

  // Moving on to a stop somewhere else goes by its hops: the pen points at each thing you'd tap, then the tour follows.
  // Next during a hop skips straight there; Back stays put. Back never hops.
  const step = useCallback(
    (by: 1 | -1) => {
      const r = runRef.current;
      if (!r || r.phase !== 'on') return;
      const seq = ++hopping.current;
      if (r.hop) return setRun(by === 1 ? { ...r, stop: r.hop.to, hop: undefined } : { ...r, hop: undefined });
      const to = r.stop + by;
      if (to > r.to) return finish(true);
      if (to < r.from) return;
      const via = by === 1 ? (STOPS[to]!.via ?? []) : [];
      if (!via.length) return setRun({ ...r, stop: to, hop: undefined });
      const hop = (i: number) => {
        if (hopping.current !== seq) return;
        if (i >= via.length) return setRun((x) => x && { ...x, stop: to, hop: undefined });
        setRun((x) => x && { ...x, hop: { to, i } });
        let moved = false;
        const on = () => {
          if (moved) return;
          moved = true;
          hop(i + 1);
        };
        hopShown.current = on;
        later(on, HOP_SAFE_MS);
      };
      hop(0);
    },
    [finish, later],
  );

  // The tabs follow the tour, and its hops.
  const hopNow = run?.hop ? (STOPS[run.hop.to]!.via ?? [])[run.hop.i] ?? null : null;
  const hopAt = run?.hop ? hopScreen(STOPS[run.hop.to]!.via ?? [], run.hop.i) : null;
  const stopTab = run && (run.phase === 'on' || run.phase === 'out') ? TABS.indexOf(hopAt?.tab ?? STOPS[run.stop]!.tab) : null;
  useLayoutEffect(() => {
    if (stopTab !== null) goTo(stopTab);
  }, [stopTab, goTo]);

  // ← → and Escape while the tour is on.
  useEffect(() => {
    if (!run) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        step(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        step(-1);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, step, finish]);

  // ?stop=n and ?tab=… in the address, to open on one place.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const tab = TABS.indexOf(q.get('tab') as TabId);
    if (tab > 0) goTo(tab);
    const n = Number(q.get('stop'));
    if (Number.isInteger(n) && n >= 1 && n <= STOPS.length) {
      setOffer('gone');
      setRun({ stop: n - 1, from: 0, to: STOPS.length - 1, origin: 0, phase: 'on' });
    }
  }, [goTo]);

  // The sealed screens' countdowns keep running, from what they showed when they were kept.
  useEffect(() => {
    const start = Date.now();
    const from = SNAP.scenes['pre-missions'].count ?? 0;
    const draw = () => root.current && tick(root.current, from - (Date.now() - start) / 1000);
    draw();
    const id = window.setInterval(draw, 1000);
    return () => window.clearInterval(id);
  }, []);

  const specimen = !!run && (run.phase === 'on' || run.phase === 'out');
  const stop = specimen ? STOPS[run.stop]! : null;
  const sceneOf = (tab: TabId): SceneId =>
    !stop ? SEALED[tab] : hopAt?.tab === tab ? hopAt.scene : stop.tab === tab ? stop.scene : SPECIMEN[tab];
  const scenes = TABS.map(sceneOf);
  const shownScene = SNAP.scenes[scenes[index]!];
  const overlays = !stop ? [] : hopAt ? SNAP.scenes[hopAt.scene].overlays.filter(shown) : stop.bare ? [] : SNAP.scenes[stop.scene].overlays.filter(shown);

  // What the pen points at on this hop, and what it points from: what the stop lit, or the hop before's target.
  const hopKey = run?.hop ? `${run.hop.to}:${run.hop.i}` : '';
  const hopView = useMemo<HopView | null>(() => {
    if (!run?.hop || !hopNow) return null;
    const via = STOPS[run.hop.to]!.via ?? [];
    const before = run.hop.i > 0 ? [via[run.hop.i - 1]!.target] : STOPS[run.stop]!.lit;
    return {
      target: hopNow.target,
      label: hopNow.label,
      from: before,
      settle: hopNow.at && !reduced ? HOP_TURN_MS : 0,
      elsewhere: !!hopScreen(via, run.hop.i),
      arrow: hopNow.arrow !== false,
    };
  }, [hopKey, reduced]);

  // Where the offer hangs: tied on under the wax seal, down the file's right-hand side.
  const [offerAt, setOfferAt] = useState<OfferAt | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = root.current;
    const bar = el?.querySelector<HTMLElement>('.tr-bar');
    if (!el || !bar) return;
    const seen = new ResizeObserver(() => {
      setWidth(el.clientWidth);
      el.style.setProperty('--tr-bar-h', `${bar.offsetHeight}px`);
    });
    seen.observe(el);
    seen.observe(bar);
    return () => seen.disconnect();
  }, []);
  useLayoutEffect(() => {
    const pane = panes.current[0];
    const wax = pane?.querySelector<HTMLElement>('[data-tour="wax"]');
    const file = pane?.querySelector<HTMLElement>('[data-tour="sealed"]');
    if (scenes[0] !== 'pre-missions' || !pane || !wax || !file) return setOfferAt(null);
    const w = offsetIn(wax, pane);
    const f = offsetIn(file, pane);
    setOfferAt({ x: Math.min(w.x + wax.offsetWidth / 2 - OFFER_WIDTH / 2, f.x + file.offsetWidth - OFFER_WIDTH - 4), y: w.y + wax.offsetHeight - 6 });
  }, [scenes[0], width]);

  // "How tonight works" goes in My file under the suspect file, in the game's own column.
  const [cardSlot, setCardSlot] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const anchor = scenes[2] === 'pre-file' ? panes.current[2]?.querySelector('[data-tour="suspect"]') : null;
    if (!anchor) return setCardSlot(null);
    const slot = document.createElement('div');
    slot.className = 'tr-cardslot';
    anchor.after(slot);
    setCardSlot(slot);
    return () => slot.remove();
  }, [scenes[2]]);

  const putOff = () => {
    setOffer('leaving');
    later(() => setOffer('gone'), reduced ? 0 : 420);
    say('No rush. The tour is kept in My file.');
  };
  const tourFromFile = (part: number | null) => {
    const p = part === null ? null : PARTS[part];
    begin(p?.from ?? 0, p?.to ?? STOPS.length - 1);
  };

  // The screens are pictures of the game: their links go nowhere here; the tab bar's turn the page.
  const stay = (e: MouseEvent) => {
    const a = (e.target as Element).closest('a[href]');
    if (a) e.preventDefault();
  };
  const onBar = (e: MouseEvent) => {
    const tab = (e.target as Element).closest('.tabbar__tab');
    if (!tab?.parentElement) return;
    e.preventDefault();
    goTo([...tab.parentElement.children].indexOf(tab));
  };

  return (
    <div className={`tr-app${specimen ? ' is-touring' : ''}${stop?.peek ? ' is-peek' : ''}`} ref={root} onClickCapture={stay}>
      <div className="tr-stage" ref={stage} inert={!!run}>
        {TABS.map((id, i) => (
          <section
            key={id}
            className={`tr-pane tr-pane--${id}${SNAP.scenes[scenes[i]!].appClass.includes('app--fill') ? ' is-fill' : ''}`}
            data-scroller
            ref={(el) => void (panes.current[i] = el)}
            aria-hidden={i !== index}
            inert={i !== index}
          >
            <Page id={scenes[i]!} />
            {i === 0 && offerAt && offer !== 'gone' ? <OfferTag at={offerAt} onTake={() => begin()} onLater={putOff} gone={offer === 'leaving'} /> : null}
          </section>
        ))}
      </div>
      <div className="tr-bar" data-tour="tabbar" inert={!!run} onClick={onBar} dangerouslySetInnerHTML={{ __html: shownScene.tabbar }} />
      {overlays.map((html, i) => (
        <div key={`${hopAt?.scene ?? stop?.scene}-${i}`} className="tr-over" dangerouslySetInnerHTML={{ __html: html }} />
      ))}
      {toast ? (
        <div className="toasts" data-snap-fixed="">
          <p className="toast toast--info" role="status">
            {toast}
          </p>
        </div>
      ) : null}
      {cardSlot ? createPortal(<TourCard taken={taken} onTour={tourFromFile} />, cardSlot) : null}

      {run ? (
        <TourLayer
          root={root}
          stop={run.stop}
          phase={run.phase}
          first={run.stop === run.from}
          last={run.stop === run.to}
          progress={{ at: run.stop - run.from + 1, of: run.to - run.from + 1 }}
          reduced={reduced}
          hop={hopView}
          onHopShown={() => hopShown.current()}
          onBack={() => step(-1)}
          onNext={() => step(1)}
          onEnd={() => finish(false)}
        />
      ) : null}
    </div>
  );
}
