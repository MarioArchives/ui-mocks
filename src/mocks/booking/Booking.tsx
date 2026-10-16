// Booking desk (Mystery Pub Crawl): what a new player sees after signing in with Google. Three steps on one screen:
// their particulars on a manila booking sheet, a typed letter from the police thanking them and warning that their
// prints come next, their right thumb on a livescan machine (press and hold; nothing is read, it only looks the part),
// then the finished file, stamped BOOKED, waiting on the GM's desk.
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../../themes/mystery.css';
import './booking.css';
import { FINGER, PRINT_H, PRINT_W, hashText, makePrint, type Print } from './fingerprint';

type Step = 'particulars' | 'letter' | 'prints' | 'booked';

interface Particulars {
  name: string;
  alias: string;
  heightCm: number;
  poison: string | null;
  marks: string;
}

/** Who the mock pretends signed in with Google. */
const GOOGLE_NAME = 'Sam Rivers';
const POISONS = ['Pint', 'Wine', 'Gin', 'Cocktail', 'Shots', 'Soft'];
/** The step tabs; the letter counts as the start of the prints. */
const STEPS: { id: Step; label: string }[] = [
  { id: 'particulars', label: 'Particulars' },
  { id: 'prints', label: 'Prints' },
  { id: 'booked', label: 'Booked' },
];

const pad = (n: number, width: number) => String(n).padStart(width, '0');
const caseNumber = (name: string) => {
  const h = hashText(`case:${name}`);
  return `${pad(h % 97, 2)} · ${pad(h % 1_000_000, 6)}`;
};
const sheetNumber = (name: string) => pad(hashText(`sheet:${name}`) % 10_000, 4);
const feetInches = (cm: number) => {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
};

/** A short buzz where the phone can (Android); iPhones ignore it. */
const buzz = (pattern: number | number[]) => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* no vibration: fine */
  }
};

export default function Booking() {
  const [step, setStep] = useState<Step>('particulars');
  const [who, setWho] = useState<Particulars>({ name: GOOGLE_NAME, alias: '', heightCm: 175, poison: null, marks: '' });
  const print = useMemo(() => makePrint(`${who.name}|${who.alias}`), [who.name, who.alias]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const startOver = () => {
    setWho({ name: GOOGLE_NAME, alias: '', heightCm: 175, poison: null, marks: '' });
    setStep('particulars');
  };

  return (
    <div className="bk">
      <div className="bk__beam" aria-hidden="true" />
      <header className="bk-board">
        <span className="bk-board__line">Blackwood Manor PD</span>
        <span className="bk-board__title">Booking desk</span>
      </header>
      <div className="bk-who">
        <GoogleG />
        <span>
          Signed in as <strong>{GOOGLE_NAME}</strong>
        </span>
        <button type="button" className="bk-who__out" onClick={startOver}>
          Not you?
        </button>
      </div>
      <Steps step={step} />
      <div key={step} className="bk-step">
        {step === 'particulars' ? (
          <ParticularsSheet who={who} onChange={setWho} onDone={() => setStep('letter')} />
        ) : step === 'letter' ? (
          <Letter who={who} onDone={() => setStep('prints')} onBack={() => setStep('particulars')} />
        ) : step === 'prints' ? (
          <Livescan print={print} onDone={() => setStep('booked')} onBack={() => setStep('particulars')} />
        ) : (
          <BookedFile who={who} print={print} onAgain={startOver} />
        )}
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <span className="bk-who__g" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4z" />
        <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
        <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14z" />
        <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 5.9 12 5.9z" />
      </svg>
    </span>
  );
}

/** The three steps as file tabs: done ones ticked, this one lifted out in manila. */
function Steps({ step }: { step: Step }) {
  const at = STEPS.findIndex((s) => s.id === (step === 'letter' ? 'prints' : step));
  return (
    <ol className="bk-steps" aria-label="Booking steps">
      {STEPS.map((s, i) => (
        <li key={s.id} className={`bk-steps__tab${i === at ? ' is-now' : i < at ? ' is-done' : ''}`} aria-current={i === at ? 'step' : undefined}>
          <span className="bk-steps__n">{i < at ? '✓' : i + 1}</span> {s.label}
        </li>
      ))}
    </ol>
  );
}

function Paperclip({ className }: { className?: string }) {
  return (
    <svg className={`bk-clip${className ? ` ${className}` : ''}`} width="16" height="44" viewBox="0 0 16 44" aria-hidden="true">
      <path d="M5 40 V8 a3 3 0 0 1 6 0 V34 a5 5 0 0 1 -10 0 V12" fill="none" stroke="var(--eyelet)" strokeWidth="2" />
    </svg>
  );
}

function Stamp({ tone, className, children }: { tone: 'red' | 'teal' | 'ink'; className?: string; children: ReactNode }) {
  return <span className={`bk-stamp bk-stamp--${tone}${className ? ` ${className}` : ''}`}>{children}</span>;
}

/* ---------------------------------------------------------------- 1 · particulars */

function ParticularsSheet({ who, onChange, onDone }: { who: Particulars; onChange(next: Particulars): void; onDone(): void }) {
  const [tried, setTried] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const aliasRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Particulars>(key: K, value: Particulars[K]) => onChange({ ...who, [key]: value });
  const missingName = !who.name.trim();
  const missingAlias = !who.alias.trim();

  const submit = () => {
    setTried(true);
    if (missingName) return nameRef.current?.focus();
    if (missingAlias) return aliasRef.current?.focus();
    buzz(12);
    onDone();
  };

  return (
    <form
      className="bk-folder"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <span className="bk-folder__tab">
        Booking sheet · No. {sheetNumber(who.name || GOOGLE_NAME)}
        <Paperclip className="bk-clip--tab" />
      </span>
      <div className="bk-folder__body">
        <h1 className="bk-title">Your particulars</h1>
        <p className="bk-note">The desk sergeant needs a few details before your prints. Lies will be noted.</p>

        <Field label="Full name" hint="From your Google account" missing={tried && missingName}>
          {(id) => (
            <input
              ref={nameRef}
              id={id}
              className="bk-input"
              value={who.name}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              onChange={(e) => set('name', e.target.value)}
            />
          )}
        </Field>

        <Field label="Goes by" hint="What the others will call you tonight" missing={tried && missingAlias}>
          {(id) => (
            <input
              ref={aliasRef}
              id={id}
              className="bk-input"
              value={who.alias}
              placeholder="The Duchess, Two-Pint Pete…"
              autoCapitalize="words"
              autoComplete="off"
              enterKeyHint="next"
              onChange={(e) => set('alias', e.target.value)}
            />
          )}
        </Field>

        <Field label="Height" hint={`${who.heightCm} cm · ${feetInches(who.heightCm)}`}>
          {(id) => (
            <div className="bk-ruler">
              <input
                id={id}
                className="bk-range"
                type="range"
                min={140}
                max={210}
                step={1}
                value={who.heightCm}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (next % 5 === 0) buzz(4);
                  set('heightCm', next);
                }}
              />
              <div className="bk-ruler__ticks" aria-hidden="true">
                {[140, 150, 160, 170, 180, 190, 200, 210].map((cm) => (
                  <span key={cm}>{cm}</span>
                ))}
              </div>
            </div>
          )}
        </Field>

        <fieldset className="bk-field">
          <legend className="bk-label">Poison of choice</legend>
          <div className="bk-chips" role="radiogroup" aria-label="Poison of choice">
            {POISONS.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={who.poison === p}
                className="bk-chip"
                onClick={() => {
                  buzz(6);
                  set('poison', who.poison === p ? null : p);
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </fieldset>

        <Field label="Distinguishing marks" hint="Optional">
          {(id) => (
            <textarea
              id={id}
              className="bk-input bk-input--area"
              rows={2}
              value={who.marks}
              placeholder="A dragon tattoo, a laugh you'd know anywhere…"
              onChange={(e) => set('marks', e.target.value)}
            />
          )}
        </Field>

        <button type="submit" className="bk-go">
          Take my prints <span aria-hidden="true">→</span>
        </button>
      </div>
    </form>
  );
}

function Field({ label, hint, missing = false, children }: { label: string; hint?: string; missing?: boolean; children(id: string): ReactNode }) {
  const id = useId();
  return (
    <div className={`bk-field${missing ? ' is-missing' : ''}`}>
      <label className="bk-label" htmlFor={id}>
        {label}
        {missing ? (
          <Stamp tone="red" className="bk-stamp--tiny">
            Needed
          </Stamp>
        ) : null}
      </label>
      {children(id)}
      {hint ? <span className="bk-hint">{hint}</span> : null}
    </div>
  );
}

/* ---------------------------------------------------------------- 1½ · the letter */

const LETTER = [
  'Thank you for your cooperation.',
  'We will now proceed to take your fingerprints for the purposes of the investigation.',
  'When asked, place your right thumb on the glass and keep it there until the machine has finished.',
];
const TYPE_MS = 18;

const lessMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

/** A letter from the police, typed out as you watch (tap it to skip), then signed and sealed. */
function Letter({ who, onDone, onBack }: { who: Particulars; onDone(): void; onBack(): void }) {
  const total = LETTER.reduce((n, line) => n + line.length, 0);
  const [typed, setTyped] = useState(() => (lessMotion() ? total : 0));
  const signed = typed >= total;

  useEffect(() => {
    if (signed) return;
    const id = window.setInterval(() => setTyped((n) => Math.min(total, n + 1)), TYPE_MS);
    return () => window.clearInterval(id);
  }, [signed, total]);

  // The seal lands just after the signature is drawn.
  useEffect(() => {
    if (!signed) return;
    const id = window.setTimeout(() => buzz(30), 1050);
    return () => window.clearTimeout(id);
  }, [signed]);

  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let left = typed;
  let caretPlaced = false;
  const lines = LETTER.map((line) => {
    const shown = Math.max(0, Math.min(line.length, left));
    left -= line.length;
    const caret = !caretPlaced && shown < line.length;
    if (caret) caretPlaced = true;
    return { line, shown, caret };
  });

  return (
    <>
      <div className="bk-folder">
        <span className="bk-folder__tab">From the desk sergeant</span>
        <div className="bk-folder__body">
          <article className={`bk-letter${signed ? ' is-signed' : ''}`} onClick={() => setTyped(total)}>
            <Paperclip className="bk-clip--letter" />
            <header className="bk-letter__head">
              <Crest />
              <div className="bk-letter__org">
                <strong>Blackwood Manor Police</strong>
                <span>Criminal Investigation Dept.</span>
              </div>
            </header>
            <dl className="bk-letter__meta">
              <dt>Ref</dt>
              <dd>BM/CID/{sheetNumber(who.name || GOOGLE_NAME)}</dd>
              <dt>Date</dt>
              <dd>{today}</dd>
              <dt>Re</dt>
              <dd>
                {who.name}, a.k.a. “{who.alias}”
              </dd>
            </dl>
            <div className="bk-letter__body">
              <p>Dear {who.name},</p>
              {lines.map(({ line, shown, caret }) => (
                <p key={line}>
                  <span className="bk-sr">{line}</span>
                  <span aria-hidden="true">
                    {line.slice(0, shown)}
                    {caret ? <span className="bk-letter__caret" /> : null}
                    <span className="bk-letter__rest">{line.slice(shown)}</span>
                  </span>
                </p>
              ))}
            </div>
            <footer className="bk-letter__sign">
              <span>Yours faithfully,</span>
              <svg className="bk-letter__sig" viewBox="0 0 130 44" aria-hidden="true">
                <path
                  pathLength={1}
                  d="M4 32C12 10 20 4 22 14S16 38 26 30 36 10 40 18 38 34 48 26 58 12 62 20 60 32 70 26 80 14 86 18 84 30 94 26 104 18 110 22M30 38C56 34 90 34 126 30"
                />
              </svg>
              <span className="bk-letter__who">Desk Sergeant, Blackwood Manor PD</span>
              <Seal />
            </footer>
          </article>
          <button type="button" className="bk-go" onClick={onDone}>
            Next <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <button type="button" className="bk-back bk-back--center" onClick={onBack}>
        ← Back to particulars
      </button>
    </>
  );
}

/** The force's shield, for the letterhead. */
function Crest() {
  return (
    <svg className="bk-letter__crest" viewBox="0 0 30 34" aria-hidden="true">
      <path d="M15 1.5 28 6v10.5C28 24.5 22.5 30 15 32.5 7.5 30 2 24.5 2 16.5V6z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15 4.8 25 8.3v8.2C25 22.6 20.8 27 15 29.2 9.2 27 5 22.6 5 16.5V8.3z" fill="currentColor" opacity="0.12" />
      <polygon points="15,9 16.9,14.4 22.6,14.6 18.1,18 19.7,23.5 15,20.3 10.3,23.5 11.9,18 7.4,14.6 13.1,14.4" fill="currentColor" />
    </svg>
  );
}

/** A round inked seal with the force's name running round the rim. */
function Seal() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <svg className="bk-seal" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id={`s${uid}`} d="M50 50m-36 0a36 36 0 1 1 72 0a36 36 0 1 1-72 0" />
      </defs>
      <circle cx="50" cy="50" r="47" />
      <circle cx="50" cy="50" r="26" className="bk-seal__thin" />
      <text>
        <textPath href={`#s${uid}`} textLength="224" lengthAdjust="spacing">
          BLACKWOOD MANOR PD ★ C.I.D. ★
        </textPath>
      </text>
      <polygon points="50,36 53.5,45.1 63.3,45.7 55.7,51.9 58.2,61.3 50,56 41.8,61.3 44.3,51.9 36.7,45.7 46.5,45.1" />
    </svg>
  );
}

/* ---------------------------------------------------------------- the print itself */

/**
 * The print in its fingertip, revealed from the top down to `reveal` (0–1) with the scan line on its edge (`glow`), or
 * pressed in ink (`ink`) with ragged edges that fade out.
 */
function PrintArt({ print, tone, reveal = 1, className }: { print: Print; tone: 'glow' | 'ink'; reveal?: number; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const y = Math.min(1, Math.max(0, reveal)) * PRINT_H;
  return (
    <svg className={`bk-print bk-print--${tone}${className ? ` ${className}` : ''}`} viewBox={`0 0 ${PRINT_W} ${PRINT_H}`} aria-hidden="true">
      <defs>
        <clipPath id={`f${uid}`}>
          <path d={FINGER} />
        </clipPath>
        <clipPath id={`r${uid}`}>
          <rect x="0" y="0" width={PRINT_W} height={y} />
        </clipPath>
        {tone === 'ink' ? (
          <>
            <filter id={`i${uid}`} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={print.ridgeCount} result="noise" />
              <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" />
            </filter>
            <radialGradient id={`g${uid}`} cx="50%" cy="46%" r="58%">
              <stop offset="55%" stopColor="#fff" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <mask id={`m${uid}`}>
              <rect width={PRINT_W} height={PRINT_H} fill={`url(#g${uid})`} />
            </mask>
          </>
        ) : null}
      </defs>
      {tone === 'glow' ? <path className="bk-print__ghost" d={FINGER} /> : null}
      <g clipPath={tone === 'glow' ? `url(#r${uid})` : undefined}>
        <g clipPath={`url(#f${uid})`} mask={tone === 'ink' ? `url(#m${uid})` : undefined}>
          <g className="bk-print__ridges" filter={tone === 'ink' ? `url(#i${uid})` : undefined}>
            {print.ridges.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        </g>
      </g>
      {tone === 'glow' && reveal > 0 && reveal < 1 ? <rect className="bk-print__scan" x="0" y={y - 2} width={PRINT_W} height="4" /> : null}
    </svg>
  );
}

/* ---------------------------------------------------------------- 2 · prints */

const HOLD_MS = 2800;
const SEARCH_LINES = ['Searching county records', 'Cross-checking Blackwood Manor', 'Checking the bar tabs', 'Asking the barmaid'];

type ScanPhase = 'idle' | 'reading' | 'lifted' | 'searching' | 'done';

function Livescan({ print, onDone, onBack }: { print: Print; onDone(): void; onBack(): void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [touch, setTouch] = useState({ x: 50, y: 50 });
  const [search, setSearch] = useState(0);
  const holding = useRef(false);
  const progressRef = useRef(0);
  const lastBuzz = useRef(0);

  // While a thumb is down the reading climbs; lifted, it slips back a little at a time.
  useEffect(() => {
    if (phase === 'searching' || phase === 'done') return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      const before = progressRef.current;
      const next = holding.current ? Math.min(1, before + dt / HOLD_MS) : Math.max(0, before - dt / (HOLD_MS * 1.6));
      if (next !== before) {
        progressRef.current = next;
        setProgress(next);
      }
      if (holding.current && now - lastBuzz.current > 240) {
        lastBuzz.current = now;
        buzz(5);
      }
      if (next >= 1) {
        holding.current = false;
        buzz([18, 50, 30]);
        setPhase('searching');
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  // The records search: a few lines, then no prior record.
  useEffect(() => {
    if (phase !== 'searching') return;
    if (search >= SEARCH_LINES.length) {
      setPhase('done');
      buzz(30);
      return;
    }
    const id = window.setTimeout(() => setSearch((n) => n + 1), 650);
    return () => window.clearTimeout(id);
  }, [phase, search]);

  const press = (x: number, y: number) => {
    if (phase === 'searching' || phase === 'done') return;
    holding.current = true;
    setTouch({ x, y });
    setPhase('reading');
  };
  const lift = () => {
    if (!holding.current) return;
    holding.current = false;
    if (progressRef.current < 1) setPhase('lifted');
  };

  const pct = Math.round(progress * 100);
  const reading = phase === 'reading';
  const status =
    phase === 'idle'
      ? 'Ready. Right thumb on the glass.'
      : phase === 'reading'
        ? pct < 35
          ? 'Reading… hold still.'
          : pct < 75
            ? 'Reading ridges… keep it there.'
            : 'Nearly… don’t move.'
        : phase === 'lifted'
          ? 'Lifted too soon. Press and hold.'
          : phase === 'searching'
            ? `${SEARCH_LINES[Math.min(search, SEARCH_LINES.length - 1)]}…`
            : 'No prior record. Yet.';

  return (
    <section className="bk-scan" aria-labelledby="bk-scan-title">
      <div className="bk-scan__plate">
        <span id="bk-scan-title">Livescan · BMPD-2</span>
        <span className={`bk-scan__led${reading ? ' is-on' : phase === 'done' ? ' is-done' : ''}`} aria-hidden="true" />
      </div>

      <div className={`bk-screen${phase === 'searching' ? ' is-searching' : ''}${phase === 'done' ? ' is-done' : ''}`}>
        <div className="bk-screen__grid" aria-hidden="true" />
        <span className="bk-screen__corner bk-screen__corner--tl" aria-hidden="true" />
        <span className="bk-screen__corner bk-screen__corner--tr" aria-hidden="true" />
        <span className="bk-screen__corner bk-screen__corner--bl" aria-hidden="true" />
        <span className="bk-screen__corner bk-screen__corner--br" aria-hidden="true" />
        <div className="bk-screen__hud" aria-hidden="true">
          <span>R. thumb</span>
          <span>{phase === 'done' ? 'On file' : `${pct}%`}</span>
        </div>
        <PrintArt print={print} tone="glow" reveal={progress} className="bk-screen__print" />
        {phase === 'searching' ? <Records seed={search} /> : null}
        {phase === 'done' ? (
          <Stamp tone="teal" className="bk-screen__stamp">
            Print on file
          </Stamp>
        ) : null}
      </div>

      <dl className="bk-readout" aria-hidden="true">
        <div>
          <dt>Ridges</dt>
          <dd>{Math.round(progress * print.ridgeCount)}</dd>
        </div>
        <div>
          <dt>Minutiae</dt>
          <dd>{Math.round(progress * print.minutiae)}</dd>
        </div>
        <div>
          <dt>Quality</dt>
          <dd>{progress >= 1 ? print.quality : Math.round(progress * 88)}%</dd>
        </div>
        <div>
          <dt>Type</dt>
          <dd>{progress > 0.6 ? print.pattern : '—'}</dd>
        </div>
      </dl>

      <p className={`bk-status${phase === 'lifted' ? ' is-warn' : ''}${phase === 'done' ? ' is-good' : ''}`} role="status" aria-live="polite">
        {status}
      </p>

      {phase === 'done' ? (
        <button type="button" className="bk-go bk-go--dark" onClick={onDone}>
          File my prints <span aria-hidden="true">→</span>
        </button>
      ) : (
        <button
          type="button"
          className={`bk-pad${reading ? ' is-pressed' : ''}${phase === 'lifted' ? ' is-lifted' : ''}`}
          aria-label="Fingerprint glass: press and hold"
          disabled={phase === 'searching'}
          style={{ '--x': `${touch.x}%`, '--y': `${touch.y}%`, '--p': progress } as CSSProperties}
          onContextMenu={(e) => e.preventDefault()}
          onPointerDown={(e) => {
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* a synthetic pointer: no capture, pointerup still lifts */
            }
            const box = e.currentTarget.getBoundingClientRect();
            press(((e.clientX - box.left) / box.width) * 100, ((e.clientY - box.top) / box.height) * 100);
          }}
          onPointerUp={lift}
          onPointerCancel={lift}
          onLostPointerCapture={lift}
          onKeyDown={(e) => {
            if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
              e.preventDefault();
              press(50, 50);
            }
          }}
          onKeyUp={(e) => {
            if (e.key === ' ' || e.key === 'Enter') lift();
          }}
        >
          <span className="bk-pad__ring" aria-hidden="true" />
          <span className="bk-pad__ripple" aria-hidden="true" />
          <svg className="bk-pad__glyph" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5.5 10.5C6.6 6.6 9 5 12 5s5.4 1.6 6.5 5.5" />
            <path d="M4.8 15c0-1.4.1-2.6.4-3.7M19.2 12.5c.1 2.6-.3 5-1.1 7.2" />
            <path d="M7.4 18.5c-.4-1.5-.5-3-.4-4.5.2-4 2.3-6.6 5-6.6s4.8 2.6 4.9 6.6c0 1.6-.1 3.1-.5 4.6" />
            <path d="M9.9 20.6c-.6-1.7-.9-3.6-.8-5.6.1-3 1.3-4.6 2.9-4.6s2.9 1.6 3 4.6c.1 2-.3 4-1 5.8" />
            <path d="M12 13.8c.5 2.4.4 5-.4 7.6" />
          </svg>
          <span className="bk-pad__label">{phase === 'searching' ? 'Got it' : reading ? 'Hold…' : 'Press & hold'}</span>
        </button>
      )}

      {phase === 'done' ? null : (
        <button type="button" className="bk-back" onClick={onBack}>
          ← Back to particulars
        </button>
      )}
    </section>
  );
}

/** Record numbers flickering past while the "search" runs. */
function Records({ seed }: { seed: number }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 90);
    return () => window.clearInterval(id);
  }, []);
  const lines = Array.from({ length: 6 }, (_, i) => {
    const h = hashText(`${seed}:${tick}:${i}`);
    return `BM-${pad(h % 10_000, 4)}  ${pad((h >>> 8) % 100, 2)}/${pad((h >>> 16) % 100, 2)}  ${h % 3 === 0 ? 'NO MATCH' : '····'}`;
  });
  return (
    <div className="bk-records" aria-hidden="true">
      {lines.map((line, i) => (
        <span key={i}>{line}</span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- 3 · booked */

function BookedFile({ who, print, onAgain }: { who: Particulars; print: Print; onAgain(): void }) {
  useEffect(() => {
    const id = window.setTimeout(() => buzz(35), 520);
    return () => window.clearTimeout(id);
  }, []);
  const number = caseNumber(who.name);
  return (
    <>
      <article className="bk-folder bk-file">
        <span className="bk-folder__tab">
          Case {number}
          <Paperclip className="bk-clip--tab" />
        </span>
        <div className="bk-folder__body">
          <div className="bk-file__top">
            <Mugshot heightCm={who.heightCm} alias={who.alias} number={number} />
            <dl className="bk-facts">
              <Fact label="Name">{who.name}</Fact>
              <Fact label="Goes by">{who.alias}</Fact>
              <Fact label="Height">
                {who.heightCm} cm · {feetInches(who.heightCm)}
              </Fact>
              <Fact label="Poison">{who.poison ?? 'Won’t say'}</Fact>
            </dl>
          </div>
          {who.marks.trim() ? (
            <p className="bk-marks">
              <span className="bk-label">Distinguishing marks</span>
              {who.marks}
            </p>
          ) : null}
          <div className="bk-prints">
            <span className="bk-label">Prints · right hand</span>
            <ol className="bk-prints__row">
              <li className="bk-prints__box is-taken">
                <PrintArt print={print} tone="ink" className="bk-prints__ink" />
                <span>Thumb</span>
              </li>
              {['Index', 'Middle', 'Ring', 'Little'].map((finger) => (
                <li key={finger} className="bk-prints__box">
                  <span className="bk-prints__none" aria-hidden="true" />
                  <span>{finger}</span>
                </li>
              ))}
            </ol>
          </div>
          <Stamp tone="red" className="bk-file__booked">
            Booked
          </Stamp>
        </div>
      </article>
      <p className="bk-lead">Your file is on the GM’s desk. You’ll be let into the game once they’ve had a look.</p>
      <div className="bk-wait" role="status">
        <span className="bk-wait__dot" aria-hidden="true" />
        Waiting for the GM
      </div>
      <button type="button" className="bk-back bk-back--center" onClick={onAgain}>
        Start over (mock only)
      </button>
    </>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bk-fact">
      <dt className="bk-label">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/** A silhouette against a height chart, standing as tall as they said, holding a placard. */
function Mugshot({ heightCm, alias, number }: { heightCm: number; alias: string; number: string }) {
  // The chart runs 140–210 cm over the panel; the head's top sits at their height.
  const top = ((210 - heightCm) / 70) * 100;
  return (
    <div className="bk-mug" aria-label={`Mugshot placeholder, ${heightCm} cm`} role="img">
      <div className="bk-mug__chart" aria-hidden="true">
        {[200, 190, 180, 170, 160, 150].map((cm) => (
          <span key={cm} style={{ top: `${((210 - cm) / 70) * 100}%` }}>
            {cm}
          </span>
        ))}
      </div>
      <svg className="bk-mug__who" viewBox="0 0 100 120" preserveAspectRatio="xMidYMin meet" style={{ top: `${top}%` }} aria-hidden="true">
        <circle cx="50" cy="28" r="20" />
        <path d="M12 120 C12 78 28 58 50 58 C72 58 88 78 88 120 Z" />
      </svg>
      <div className="bk-mug__placard" aria-hidden="true">
        <span>{alias || 'Unknown'}</span>
        <span>{number}</span>
      </div>
    </div>
  );
}
