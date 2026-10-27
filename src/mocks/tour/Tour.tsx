// The torch tour (Mystery Pub Crawl): the new player's walkthrough, option B refined. A player has booked in and the
// case opens at 19:00: Missions shows the sealed case file with its countdown, and a kraft tag tied to its twine offers
// the tour. Taking it fills the real tabs with a made-up specimen night and puts out the lights but for a torch on one
// thing at a time, with a tag on twine saying what it does: twelve stops across Missions, Log book and My file, the
// tabs switching as it goes. Next and Back on the tag, or ← → on a keyboard; Escape or End tour leaves. Afterwards My
// file keeps "How tonight works": the whole tour again, or one part of it.
//
// Outside the tour the three tabs swipe as in the game. `?stop=5` in the address (before the #) opens the tour at that
// stop, and `?tab=file` opens on a tab, to show someone one place.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import '../../themes/mystery.css';
import { usePager } from '../swipe/pager';
import { BookIcon, FolderIcon, PersonIcon, PhoneIcon } from '../swipe/screens';
import { ChargeSheet, ClockIcon, FilePane, LogbookPane, MissionsPane, OfferTag, WrongToast } from './screens';
import { PARTS, STOPS, TABS, type Scene } from './stops';
import { TourLayer, type Phase } from './TourLayer';
import './tour.css';

/** A run of the tour: the stop it's on, the stops it covers (the whole tour or one part) and the tab it started on. */
interface Run {
  stop: number;
  from: number;
  to: number;
  origin: number;
  phase: Phase;
  /** Ended at the last stop rather than left early. */
  done?: boolean;
}

/** How long the lights take to go down, or come up, around the swap to and from the specimen night. */
const DIM_MS = 260;
const HOLD_MS = 360;
/** With reduced motion the pager's spring runs this many times faster, so a tab change lands in one frame. */
const INSTANT = 1e-4;
/** The mock's clock starts at 16:42, two hours and eighteen minutes before the case opens at 19:00. */
const START_MIN = 16 * 60 + 42;
const OPENS_MIN = 19 * 60;

const TAB_LABELS = ['Missions', 'Log book', 'My file'];
const TAB_ICONS = [FolderIcon, BookIcon, PersonIcon];

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

/** Minutes since midnight on the mock's clock, moving with real time from 16:42. */
function useClock() {
  const [mounted] = useState(() => Date.now());
  const [now, setNow] = useState(START_MIN);
  useEffect(() => {
    const id = window.setInterval(() => setNow(START_MIN + Math.floor((Date.now() - mounted) / 60000)), 10000);
    return () => window.clearInterval(id);
  }, [mounted]);
  return now;
}

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** The case number, in place of the game's name on Missions and Log book. */
function CaseNo() {
  return (
    <span className="tr-caseno">
      <span className="tr-caseno__k">Case no.</span>
      <span className="tr-caseno__no">64 · 721897</span>
    </span>
  );
}

export default function TorchTour() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const panes = useRef<(HTMLElement | null)[]>([]);
  const tabs = useRef<(HTMLElement | null)[]>([]);
  const marker = useRef<HTMLSpanElement>(null);
  const caseTitle = useRef<HTMLSpanElement>(null);
  const fileTitle = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const clock = useClock();

  const [offer, setOffer] = useState<'open' | 'leaving' | 'gone'>('open');
  const [taken, setTaken] = useState<string | null>(null);
  const [run, setRun] = useState<Run | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Side by side, as in the game: each screen a screen-width along, the tab bar's marker and the title following.
  const paint = useCallback((pos: number) => {
    panes.current.forEach((pane, i) => {
      if (!pane) return;
      const d = i - pos;
      pane.style.visibility = Math.abs(d) >= 1 ? 'hidden' : '';
      pane.style.transform = `translate3d(${d * 100}%, 0, 0)`;
    });
    if (marker.current) marker.current.style.transform = `translate3d(${pos * 100}%, 0, 0)`;
    tabs.current.forEach((tab, i) => tab?.style.setProperty('--lit', String(Math.max(0, 1 - Math.abs(i - pos)))));
    // Missions and Log book share the case number; My file has its own title.
    const f = Math.max(0, Math.min(1, pos - 1));
    if (caseTitle.current) {
      caseTitle.current.style.opacity = String(Math.max(0, 1 - f * 1.8));
      caseTitle.current.style.transform = `translate3d(${-f * 28}px, 0, 0)`;
    }
    if (fileTitle.current) {
      fileTitle.current.style.opacity = String(Math.max(0, (f - 0.45) * 1.8));
      fileTitle.current.style.transform = `translate3d(${(1 - f) * 28}px, 0, 0)`;
    }
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

  /** Leaves the tour: the lights go down, the app comes back as it was, the lights come up. */
  const finish = useCallback(
    (done: boolean) => {
      const r = runRef.current;
      if (!r || r.phase !== 'on') return;
      setRun({ ...r, phase: 'out', done });
      later(() => {
        setRun((x) => x && { ...x, phase: 'gone' });
        stage.current?.querySelectorAll<HTMLElement>('[data-scroller]').forEach((el) => (el.scrollTop = 0));
        goTo(r.origin);
        if (done) setTaken(hhmm(clock));
      }, reduced ? 0 : DIM_MS);
      later(() => {
        setRun(null);
        say(done ? 'Tour done. It stays in My file: How tonight works.' : 'Tour closed. Pick it up in My file whenever you like.');
      }, reduced ? 0 : DIM_MS + HOLD_MS + DIM_MS);
    },
    [later, reduced, goTo, clock, say],
  );

  const step = useCallback(
    (by: 1 | -1) => {
      const r = runRef.current;
      if (!r || r.phase !== 'on') return;
      const to = r.stop + by;
      if (to > r.to) return finish(true);
      if (to < r.from) return;
      setRun({ ...r, stop: to });
    },
    [finish],
  );

  // The tabs follow the tour.
  const stopTab = run && (run.phase === 'on' || run.phase === 'out') ? TABS.indexOf(STOPS[run.stop]!.tab) : null;
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
    const tab = TABS.indexOf(q.get('tab') as (typeof TABS)[number]);
    if (tab > 0) goTo(tab);
    const n = Number(q.get('stop'));
    if (Number.isInteger(n) && n >= 1 && n <= STOPS.length) {
      setOffer('gone');
      setRun({ stop: n - 1, from: 0, to: STOPS.length - 1, origin: 0, phase: 'on' });
    }
  }, [goTo]);

  const specimen = !!run && (run.phase === 'on' || run.phase === 'out');
  const scene: Scene = specimen ? STOPS[run.stop]!.scene : {};
  const left = Math.max(0, OPENS_MIN - clock);
  const countdown = { h: Math.floor(left / 60), m: left % 60 };

  const putOff = () => {
    setOffer('leaving');
    later(() => setOffer('gone'), reduced ? 0 : 420);
    say('No rush. The tour is kept in My file.');
  };
  const tourFromFile = (part: number | null) => {
    const p = part === null ? null : PARTS[part];
    begin(p?.from ?? 0, p?.to ?? STOPS.length - 1);
  };

  return (
    <div className={`tr-app${specimen ? ' is-touring' : ''}${scene.peek ? ' is-peek' : ''}`} ref={root}>
      <header className="tr-appbar" inert={!!run}>
        <h1 className="tr-title">
          <span ref={caseTitle} aria-hidden={index === 2}>
            <CaseNo />
          </span>
          <span ref={fileTitle} aria-hidden={index !== 2}>
            My file
          </span>
        </h1>
        <span className="tr-appbar__right">
          {specimen ? (
            <span className="tr-police" data-tour="police">
              <span className="tr-tipline" aria-label="Tip off the police">
                <PhoneIcon />
              </span>
              <span className="tr-chip">12 pts · #2</span>
            </span>
          ) : (
            <span className="tr-chip" aria-label={`${countdown.h} hours ${countdown.m} minutes until the case opens`}>
              <ClockIcon />
              {`${countdown.h}h ${countdown.m}m`}
            </span>
          )}
          <span className="tr-avatar" aria-label="Your account" />
        </span>
      </header>

      <div className="tr-stage" ref={stage} inert={!!run}>
        <div className="tr-panes">
          {TABS.map((id, i) => (
            <section key={id} className={`tr-pane tr-pane--${id}`} ref={(el) => void (panes.current[i] = el)} aria-hidden={i !== index} inert={i !== index}>
              <div className="tr-scroll" data-scroller>
                {id === 'missions' ? (
                  <MissionsPane
                    specimen={specimen}
                    scene={scene}
                    left={countdown}
                    offer={offer === 'gone' ? null : <OfferTag onTake={() => begin()} onLater={putOff} gone={offer === 'leaving'} />}
                  />
                ) : id === 'logbook' ? (
                  <LogbookPane specimen={specimen} />
                ) : (
                  <FilePane specimen={specimen} taken={taken} onTour={tourFromFile} />
                )}
              </div>
            </section>
          ))}
        </div>
        {specimen && scene.wrong ? <WrongToast /> : null}
        {toast ? (
          <p className="tr-toast" role="status">
            {toast}
          </p>
        ) : null}
      </div>

      <nav className="tr-tabbar" aria-label="Main" data-tour="tabbar" inert={!!run}>
        <span className="tr-tabbar__marker" ref={marker} aria-hidden="true" />
        {TABS.map((id, i) => {
          const Icon = TAB_ICONS[i]!;
          return (
            <button key={id} type="button" className="tr-tab" ref={(el) => void (tabs.current[i] = el)} aria-current={i === index ? 'page' : undefined} onClick={() => goTo(i)}>
              <Icon />
              <span>{TAB_LABELS[i]}</span>
            </button>
          );
        })}
      </nav>

      {specimen && scene.sheet ? (
        <>
          <div className="tr-sheet-scrim" aria-hidden="true" />
          <ChargeSheet step={scene.sheet} />
        </>
      ) : null}

      {run ? (
        <TourLayer
          root={root}
          stop={run.stop}
          phase={run.phase}
          first={run.stop === run.from}
          last={run.stop === run.to}
          reduced={reduced}
          onBack={() => step(-1)}
          onNext={() => step(1)}
          onEnd={() => finish(false)}
        />
      ) : null}
    </div>
  );
}
