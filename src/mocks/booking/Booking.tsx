// Booking desk (Mystery Pub Crawl): what a new player sees, from the game's sign-in screen and Google's account picker
// (a stand-in: nothing is signed in) to waiting on the GM. After sign-in, first the interview room (a
// desk in the dark, a man behind it, and a lamp that swings round into their face: "Who are you?"), then three steps
// on one screen: their particulars on a manila booking sheet, a typed letter from the police thanking them and warning that their
// prints come next, their right thumb on a livescan machine (press and hold; nothing is read, it only looks the part),
// then the file with the inked print and a mugshot to come: the photographer's room, a countdown, the flash, and the
// phone's own camera for the photo, which goes into the file before it's stamped BOOKED and left on the GM's desk.
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import '../../themes/mystery.css';
import './booking.css';
import { FINGER, PRINT_H, PRINT_W, hashText, makePrint, type Print } from './fingerprint';
import { buzz, lessMotion } from './feel';
import { GoogleMark } from './google';
import { PhotoRoom } from './PhotoRoom';
import { SignIn } from './SignIn';

type Step = 'signin' | 'room' | 'particulars' | 'letter' | 'prints' | 'booked' | 'photo';

interface Particulars {
  name: string;
  alias: string;
  heightCm: number;
  poison: string | null;
  marks: string;
}

/** Who the mock pretends signed in with Google. */
const GOOGLE_NAME = 'Sam Rivers';
const GOOGLE_EMAIL = 'sam.rivers@example.com';
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

export default function Booking() {
  const [step, setStep] = useState<Step>('signin');
  const [who, setWho] = useState<Particulars>({ name: GOOGLE_NAME, alias: '', heightCm: 175, poison: null, marks: '' });
  const print = useMemo(() => makePrint(`${who.name}|${who.alias}`), [who.name, who.alias]);
  /** Their mugshot, as a local object URL; it never leaves the phone. */
  const [photo, setPhoto] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const startOver = () => {
    setWho({ name: GOOGLE_NAME, alias: '', heightCm: 175, poison: null, marks: '' });
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(null);
    setStep('signin');
  };

  if (step === 'signin') return <SignIn name={GOOGLE_NAME} email={GOOGLE_EMAIL} onDone={() => setStep('room')} />;

  if (step === 'room') {
    return (
      <div className="bk bk--scene">
        <InterviewRoom onDone={() => setStep('particulars')} />
      </div>
    );
  }

  if (step === 'photo') {
    return (
      <div className="bk bk--scene">
        <PhotoRoom
          onDone={(url) => {
            if (photo) URL.revokeObjectURL(photo);
            setPhoto(url);
            setStep('booked');
          }}
        />
      </div>
    );
  }

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
          <BookedFile who={who} print={print} photo={photo} onPhoto={() => setStep('photo')} onAgain={startOver} />
        )}
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <span className="bk-who__g" aria-hidden="true">
      <GoogleMark size={14} />
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

/* ---------------------------------------------------------------- 0 · the interview room */

type RoomPhase = 'dark' | 'lit' | 'turning' | 'asked' | 'ready';
const ROOM_ORDER: RoomPhase[] = ['dark', 'lit', 'turning', 'asked', 'ready'];
/** How long each phase lasts before the next. */
const ROOM_NEXT: Partial<Record<RoomPhase, [RoomPhase, number]>> = {
  dark: ['lit', 700],
  lit: ['turning', 2200],
  // The lamp takes 0.6s to swing round, then a second of glare before the question (typing from 4.5s in).
  turning: ['asked', 1600],
};
const QUESTION = 'Who are you?';
const KEY_MS = 95;

/** The man behind the desk, a little smaller than life, sitting on its back edge. */
const HIM = 'translate(195 522) scale(0.84) translate(-195 -522)';
/** Plank seams down the desk, which the tilt draws together into the distance. */
const SEAMS = Array.from({ length: 15 }, (_, i) => `M${-290 + i * 70} 264V900`).join('');

function Sunglasses({ className }: { className: string }) {
  return (
    <g className={className}>
      <path className="bk-int__temples" d="M158 250L150 256M232 250L240 256M191 251Q195 246.5 199 251" />
      <rect x="158" y="244" width="33" height="21" rx="7" />
      <rect x="199" y="244" width="33" height="21" rx="7" />
      <path className="bk-int__sheen" d="M163 250L171 246.5M204 250L212 246.5" />
    </g>
  );
}

/**
 * Lights off, then the desk lamp clicks on over the case files, with the man behind the desk in shadow; then the lamp
 * swings round to face you, the screen whites out, he's gone, and the question hangs there. Tap early and the lamp
 * turns at once.
 */
function InterviewRoom({ onDone }: { onDone(): void }) {
  const [phase, setPhase] = useState<RoomPhase>(() => (lessMotion() ? 'ready' : 'dark'));
  const [typed, setTyped] = useState(() => (lessMotion() ? QUESTION.length : 0));
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const at = (p: RoomPhase) => ROOM_ORDER.indexOf(phase) >= ROOM_ORDER.indexOf(p);
  const asked = at('asked');

  useEffect(() => {
    const next = ROOM_NEXT[phase];
    if (!next) return;
    const timer = window.setTimeout(() => setPhase(next[0]), next[1]);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase === 'lit') buzz(8);
    else if (phase === 'turning') buzz(16);
  }, [phase]);

  // The question types out a key at a time; a second after the last key, the way on.
  useEffect(() => {
    if (!asked) return;
    if (typed < QUESTION.length) {
      const timer = window.setTimeout(() => {
        buzz(4);
        setTyped((n) => n + 1);
      }, KEY_MS);
      return () => window.clearTimeout(timer);
    }
    if (phase !== 'asked') return;
    const timer = window.setTimeout(() => setPhase('ready'), 1000);
    return () => window.clearTimeout(timer);
  }, [asked, typed, phase]);

  const cls = ['bk-scene bk-int', at('lit') && 'is-lit', at('turning') && 'is-turned', at('asked') && 'is-asked', at('ready') && 'is-ready'];
  return (
    <section
      className={cls.filter(Boolean).join(' ')}
      aria-label="Interview room"
      onClick={() => {
        if (phase === 'dark' || phase === 'lit') setPhase('turning');
      }}
    >
      {/* Three layers over one stage: the wall and the man, then the desk tilted back in perspective, then the lamp and
          its glare standing up in front. */}
      <div className="bk-scene__stage">
      <svg className="bk-scene__layer" viewBox="0 0 390 844" aria-hidden="true">
        <defs>
          <linearGradient id={`wall${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2a2d30" />
            <stop offset="1" stopColor="#1b1d1f" />
          </linearGradient>
          <linearGradient id={`desk${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#6e4c31" />
            <stop offset="1" stopColor="#3d2919" />
          </linearGradient>
          <linearGradient id={`shade${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1a1c1e" />
            <stop offset="0.6" stopColor="#3d4247" />
            <stop offset="1" stopColor="#202326" />
          </linearGradient>
          <radialGradient id={`hole${id}`}>
            <stop offset="0" stopColor="#000" />
            <stop offset="0.5" stopColor="#000" stopOpacity="0.92" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`spill${id}`}>
            <stop offset="0" stopColor="#000" stopOpacity="0.55" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`soft${id}`}>
            <stop offset="0" stopColor="#000" stopOpacity="0.3" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`beam${id}`} gradientUnits="userSpaceOnUse" x1="145" y1="579" x2="310" y2="670">
            <stop offset="0" stopColor="#ffe7aa" stopOpacity="0.5" />
            <stop offset="1" stopColor="#ffe7aa" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id={`bulb${id}`}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.4" stopColor="#fff6d6" />
            <stop offset="0.85" stopColor="#ffd98a" />
            <stop offset="1" stopColor="#c8952e" />
          </radialGradient>
          <radialGradient id={`flare${id}`} gradientUnits="userSpaceOnUse" cx="104" cy="560" r="620">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.05" stopColor="#fffdf3" />
            <stop offset="0.22" stopColor="#fff4d8" stopOpacity="0.85" />
            <stop offset="0.5" stopColor="#f8e9c6" stopOpacity="0.4" />
            <stop offset="1" stopColor="#f4e7c8" stopOpacity="0" />
          </radialGradient>
          <filter id={`blur${id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id={`haze${id}`} x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id={`glow${id}`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* What the dark hides: everything, bar a faint glow on the wall behind him once the lamp is on... */}
          <mask id={`wallDark${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="390" height="844">
            <rect width="390" height="844" fill="#fff" />
            <ellipse className="bk-int__pool" cx="195" cy="330" rx="210" ry="220" fill={`url(#soft${id})`} />
          </mask>
          {/* ...and on the desk (in its flat plan), the pool of lamplight on the files and its spill around. */}
          <mask id={`deskDark${id}`} maskUnits="userSpaceOnUse" x="-300" y="200" width="1000" height="760">
            <rect x="-300" y="200" width="1000" height="760" fill="#fff" />
            <g className="bk-int__pool">
              <ellipse cx="200" cy="560" rx="380" ry="340" fill={`url(#spill${id})`} />
              <ellipse cx="295" cy="548" rx="180" ry="200" fill={`url(#hole${id})`} />
            </g>
          </mask>
        </defs>

        {/* The wall, and the man in front of it. */}
        <rect width="390" height="844" fill={`url(#wall${id})`} />
        <g className="bk-int__him bk-int__man" transform={HIM}>
          <path d="M40 522C42 430 92 374 158 358Q195 350 232 358C298 374 348 430 350 522Z" />
          <path d="M175 296L215 296L219 362L171 362Z" />
          <ellipse cx="195" cy="258" rx="45" ry="56" />
          <ellipse cx="150" cy="264" rx="7" ry="12" />
          <ellipse cx="240" cy="264" rx="7" ry="12" />
          <path className="bk-int__collar" d="M170 358L195 404L220 358L209 352L195 378L181 352Z" />
          <path d="M191 378L199 378L204 440L195 452L186 440Z" />
          <Sunglasses className="bk-int__specs" />
          <path className="bk-int__cig" d="M207 290L226 295.3" />
          <path className="bk-int__ash" d="M226 295.3L229.5 296.3" />
        </g>
        <rect className="bk-int__dark" width="390" height="844" fill="#040405" mask={`url(#wallDark${id})`} />
      </svg>

      {/* The desk top, drawn flat and deep, then tilted back by CSS so it lands under him at the back. */}
      <svg className="bk-scene__layer bk-int__desk" viewBox="0 0 390 844" aria-hidden="true">
        <rect x="-300" y="262" width="1000" height="640" fill={`url(#desk${id})`} />
        <path d="M-300 263H700" stroke="#5a3f2b" strokeWidth="3" />
        <path className="bk-int__seams" d={SEAMS} />
        <path className="bk-int__grain" d="M-300 380C-100 372 200 390 700 378M-300 520C0 512 300 530 700 518M-300 700C0 690 300 712 700 700" />
        <g className="bk-int__files" transform="translate(295 548) scale(1.15) translate(-112 -652)">
          <rect x="32" y="596" width="160" height="112" rx="3" fill="#c9a974" transform="rotate(-10 112 652)" />
          <rect x="46" y="588" width="150" height="110" fill="#ece8dc" transform="rotate(-2 112 652)" />
          <g transform="rotate(5 112 652)">
            <rect x="40" y="588" width="50" height="12" rx="2" fill="#d9bd7e" />
            <rect x="32" y="598" width="160" height="112" rx="2" fill="#d9bd7e" />
          </g>
          <g transform="rotate(-4 112 652)">
            <rect x="124" y="586" width="56" height="12" rx="2" fill="#e6cf98" />
            <rect x="30" y="596" width="164" height="114" rx="2" fill="#e6cf98" stroke="#b89a62" />
            <text x="40" y="613" fontSize="8.5" fill="#5b4a33" letterSpacing="1">
              CASE No. 0417
            </text>
            {[64, 92, 80, 70, 88].map((w, i) => (
              <rect key={i} x="40" y={621 + i * 8} width={w} height="2" fill="#8e7550" opacity="0.55" />
            ))}
            <g transform="rotate(-12 100 678)">
              <rect x="54" y="666" width="96" height="23" fill="none" stroke="#8f2a22" strokeWidth="2.5" />
              <text x="102" y="682.5" fontSize="12" fill="#8f2a22" letterSpacing="1.5" textAnchor="middle">
                CLASSIFIED
              </text>
            </g>
            <g transform="rotate(9 168 628)">
              <rect x="146" y="600" width="44" height="52" fill="#f4f1ea" />
              <rect x="150" y="604" width="36" height="34" fill="#2c3134" />
              <circle cx="168" cy="616" r="6" fill="#5e666b" />
              <path d="M156 638C158 627 178 627 180 638Z" fill="#5e666b" />
              <path d="M162 596V608" stroke="#9aa0a3" strokeWidth="2" />
            </g>
          </g>
        </g>
        <g transform="translate(169 772) scale(1.05) rotate(-7) translate(-228 -798)">
          <rect x="166" y="718" width="124" height="160" fill="#efebe0" />
          <text x="178" y="738" fontSize="10" fill="#8f2a22" letterSpacing="2">
            TOP SECRET
          </text>
          {[96, 80, 100, 72, 90, 60].map((w, i) => (
            <rect key={i} x="178" y={748 + i * 9} width={w} height="2" fill="#6b6455" opacity="0.5" />
          ))}
        </g>

        <rect className="bk-int__dark" x="-300" y="200" width="1000" height="760" fill="#040405" mask={`url(#deskDark${id})`} />
      </svg>

      {/* Standing up in front: the stacks at the back of the desk and the ashtray (both in shadow), the lamp, his smoke,
          and the glare. */}
      <svg className="bk-scene__layer" viewBox="0 0 390 844" aria-hidden="true">
        <g className="bk-int__stack">
          {['#332b1d', '#3b3a37', '#372f20', '#3a3426', '#3b3a37', '#332b1d', '#372f20', '#3b3a37', '#3a3426'].map((fill, i) => (
            <rect key={i} x={12 + ((i * 7) % 5)} y={566 - (i + 1) * 6} width="112" height="6" fill={fill} />
          ))}
          <rect x="40" y="508" width="34" height="5" fill="#2a1210" />
          {['#372f20', '#3b3a37', '#332b1d', '#3b3a37', '#3a3426', '#372f20'].map((fill, i) => (
            <rect key={`r${i}`} x={306 + ((i * 3) % 4)} y={552 - (i + 1) * 6} width="78" height="6" fill={fill} />
          ))}
        </g>
        <g className="bk-int__ashtray">
          <ellipse cx="262" cy="556" rx="24" ry="7" fill="#101213" />
          <ellipse cx="262" cy="555" rx="17" ry="4.5" fill="#060707" />
          <path d="M254 554L266 551" stroke="#3a3833" strokeWidth="2.5" />
        </g>
        <polygon className="bk-int__beam" points="159,548 130,610 208,744 384,694 374,588" fill={`url(#beam${id})`} filter={`url(#blur${id})`} />

        {/* The lamp: an anglepoise, its shade down over the files to start with. */}
        <g className="bk-int__lamp">
          <ellipse cx="56" cy="714" rx="40" ry="11" fill="#1c1e20" />
          <ellipse cx="56" cy="710" rx="30" ry="6" fill="#2b2e31" />
          <path d="M56 708L32 612M32 612L104 560" stroke="#2a2d30" strokeWidth="6" strokeLinecap="round" />
          <path d="M50 700L28 618M38 606L100 562" stroke="#596066" strokeWidth="1" />
          <circle cx="32" cy="612" r="6.5" fill="#3a3e42" />
        </g>
        <g className="bk-int__shade">
          <path d="M94 556C94 547 114 547 114 556L138 604C125 613 83 613 70 604Z" fill={`url(#shade${id})`} />
          <ellipse cx="104" cy="605" rx="34" ry="8" fill="#121315" />
          <ellipse className="bk-int__mouth" cx="104" cy="605" rx="31" ry="6.5" fill="#fff1c4" filter={`url(#glow${id})`} />
        </g>
        <circle cx="104" cy="560" r="5.5" fill="#3a3e42" />

        {/* Smoke off the cigarette, and its tip. */}
        <g className="bk-int__him" transform={HIM}>
          <g className="bk-int__smoke" filter={`url(#haze${id})`}>
            <path d="M231 294C223 280 239 270 231 256C223 242 237 232 230 218" />
            <path d="M231 294C239 282 225 272 233 258C241 244 227 234 235 220" />
            <path d="M231 294C225 284 235 276 229 264C223 252 233 242 227 230" />
          </g>
          <circle className="bk-int__ember" cx="230.6" cy="296.6" r="2.2" fill="#ff7a30" filter={`url(#glow${id})`} />
        </g>

        {/* Turned on you: the lamp face-on, and its glare over everything. */}
        <g className="bk-int__face">
          <circle cx="104" cy="560" r="38" fill="#1a1c1e" stroke="#3a3e42" strokeWidth="2" />
          <circle cx="104" cy="560" r="31" fill={`url(#bulb${id})`} />
        </g>
        <g className="bk-int__glare">
          <rect width="390" height="844" fill="#f4e7c8" opacity="0.6" />
          <g className="bk-int__flare">
            <circle cx="104" cy="560" r="620" fill={`url(#flare${id})`} />
            <ellipse cx="104" cy="560" rx="230" ry="2.5" fill="#fff" opacity="0.8" />
          </g>
        </g>
      </svg>
      </div>

      <p className="bk-int__rec" aria-hidden="true">
        Rec · Interview room B
      </p>
      {asked ? (
        <h1 className="bk-int__q">
          <span className="bk-sr">{QUESTION}</span>
          <span aria-hidden="true">
            {QUESTION.slice(0, typed)}
            <span className="bk-caret" />
            <span className="bk-rest">{QUESTION.slice(typed)}</span>
          </span>
        </h1>
      ) : null}
      {at('ready') ? (
        <button
          type="button"
          className="bk-go bk-int__next"
          onClick={(e) => {
            e.stopPropagation();
            onDone();
          }}
        >
          Next <span aria-hidden="true">→</span>
        </button>
      ) : null}
    </section>
  );
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
                    {caret ? <span className="bk-caret" /> : null}
                    <span className="bk-rest">{line.slice(shown)}</span>
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

/**
 * The file. First with the print in and the photo still to come, and a Next to the photographer; back from there, the
 * photo is pasted in, the file stamped BOOKED and left on the GM's desk.
 */
function BookedFile({ who, print, photo, onPhoto, onAgain }: { who: Particulars; print: Print; photo: string | null; onPhoto(): void; onAgain(): void }) {
  useEffect(() => {
    if (!photo) return;
    const id = window.setTimeout(() => buzz(35), 1150);
    return () => window.clearTimeout(id);
  }, [photo]);
  const number = caseNumber(who.name);
  return (
    <>
      <article className={`bk-folder bk-file${photo ? ' has-photo' : ''}`}>
        <span className="bk-folder__tab">
          Case {number}
          <Paperclip className="bk-clip--tab" />
        </span>
        <div className="bk-folder__body">
          <div className="bk-file__top">
            <Mugshot heightCm={who.heightCm} alias={who.alias} number={number} photo={photo} />
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
          {photo ? (
            <Stamp tone="red" className="bk-file__booked">
              Booked
            </Stamp>
          ) : null}
        </div>
      </article>
      {photo ? (
        <>
          <p className="bk-lead">Your file is on the GM’s desk. You’ll be let into the game once they’ve had a look.</p>
          <div className="bk-wait" role="status">
            <span className="bk-wait__dot" aria-hidden="true" />
            Waiting for the GM
          </div>
          <button type="button" className="bk-back bk-back--center" onClick={onAgain}>
            Start over (mock only)
          </button>
        </>
      ) : (
        <>
          <p className="bk-lead">One more thing for your file: your photograph.</p>
          <div className="bk-next">
            <button type="button" className="bk-go" onClick={onPhoto}>
              Next <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
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

/**
 * Against a height chart, holding a placard: their photo once it's taken (in old black and white), or until then a
 * silhouette standing as tall as they said.
 */
function Mugshot({ heightCm, alias, number, photo }: { heightCm: number; alias: string; number: string; photo: string | null }) {
  // The chart runs 140–210 cm over the panel; the head's top sits at their height.
  const top = ((210 - heightCm) / 70) * 100;
  return (
    <div className={`bk-mug${photo ? ' has-photo' : ''}`} aria-label={photo ? 'Your mugshot' : `Mugshot placeholder, ${heightCm} cm`} role="img">
      {photo ? <img className="bk-mug__photo" src={photo} alt="" /> : null}
      <div className="bk-mug__chart" aria-hidden="true">
        {[200, 190, 180, 170, 160, 150].map((cm) => (
          <span key={cm} style={{ top: `${((210 - cm) / 70) * 100}%` }}>
            {cm}
          </span>
        ))}
      </div>
      {photo ? null : (
        <svg className="bk-mug__who" viewBox="0 0 100 120" preserveAspectRatio="xMidYMin meet" style={{ top: `${top}%` }} aria-hidden="true">
          <circle cx="50" cy="28" r="20" />
          <path d="M12 120 C12 78 28 58 50 58 C72 58 88 78 88 120 Z" />
        </svg>
      )}
      <div className="bk-mug__placard" aria-hidden="true">
        <span>{alias || 'Unknown'}</span>
        <span>{number}</span>
      </div>
    </div>
  );
}
