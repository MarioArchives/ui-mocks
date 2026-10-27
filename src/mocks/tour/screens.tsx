// The three tabs of Mystery Pub Crawl twice over: as a booked-in player sees them before 19:00 (the sealed case file
// with its countdown, an empty log book, their own file), and as the torch tour's specimen night, a made-up game in
// full swing at 21:53. Elements a stop lights carry `data-tour`; a screen that scrolls is marked `data-scroller`.
import type { CSSProperties, ReactNode } from 'react';
import { HangTag } from './HangTag';
import type { Scene } from './stops';

/* ---------------------------------------------------------------- icons */

function Ic({ d, className }: { d: string; className?: string }) {
  return (
    <svg className={`tr-ic${className ? ` ${className}` : ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const ArrowIcon = () => <Ic d="M5 12h14M13 6l6 6-6 6" />;
export const CheckIcon = () => <Ic d="M5 12l5 5L19 7" />;
export const ClockIcon = () => <Ic d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7.5V12l3 2" />;
const CameraIcon = () => <Ic d="M4 8h3.2l1.8-2.5h6L16.8 8H20v11H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z" />;
const XIcon = () => <Ic d="M6 6l12 12M18 6L6 18" />;
const RerollIcon = () => <Ic d="M4.5 11a7.5 7.5 0 0 1 13-4.5L19.5 9M19.5 4v5h-5M19.5 13a7.5 7.5 0 0 1-13 4.5L4.5 15M4.5 20v-5h5" />;
const SendIcon = () => <Ic d="M21 3L10 14M21 3l-7 18-4-7-7-4z" />;
const EditIcon = () => <Ic d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />;
const PlayIcon = () => <Ic d="M8 5l11 7-11 7z" />;
const BackIcon = () => <Ic d="M15 6l-6 6 6 6" />;
/** The eye (doubtful) and the heart (credible), as on the game's entries. */
const EYE = 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM9.5 12a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0 -5 0';
const HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z';

/** A face on a tinted disc, the avatar placeholder. */
function Face({ tint, size, ring }: { tint: number; size: number; ring?: string }) {
  const style = { width: size, height: size, background: `var(--tint-${tint})`, borderColor: ring } as CSSProperties;
  return (
    <span className="tr-av" style={style} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="9" r="4.2" />
        <path d="M3.5 24c0-5.2 3.8-8.6 8.5-8.6s8.5 3.4 8.5 8.6z" />
      </svg>
    </span>
  );
}

/** The paper clip on a folder's corner. */
function Clip() {
  return (
    <svg className="tr-clip" viewBox="0 0 16 44" aria-hidden="true">
      <path d="M5 40 V8 a3 3 0 0 1 6 0 V34 a5 5 0 0 1 -10 0 V12" />
    </svg>
  );
}

/** The Manchester bee, pressed into the wax. */
function Bee() {
  return (
    <svg className="tr-bee" viewBox="-24 -27 48 51" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M3 -9C6 -14 15 -16.5 20.5 -14.5C24.5 -13 24.5 -8.5 20.5 -7C15.5 -5.2 7.5 -6.2 3 -9Z" />
        <path d="M-3 -9C-6 -14 -15 -16.5 -20.5 -14.5C-24.5 -13 -24.5 -8.5 -20.5 -7C-15.5 -5.2 -7.5 -6.2 -3 -9Z" />
        <path d="M3.2 -5.5C5.7 -9.1 12.2 -10.1 15.7 -8.5C18.2 -7.3 17.8 -3.9 15.2 -3.1C11.7 -2 6.2 -3.1 3.2 -5.5Z" />
        <path d="M-3.2 -5.5C-5.7 -9.1 -12.2 -10.1 -15.7 -8.5C-18.2 -7.3 -17.8 -3.9 -15.2 -3.1C-11.7 -2 -6.2 -3.1 -3.2 -5.5Z" />
        <path d="M-1.5 -18.5Q-2.6 -22.5 -6 -23.6M1.5 -18.5Q2.6 -22.5 6 -23.6" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <path d="M-4 -15.5a4 4 0 1 1 8 0a4 4 0 1 1 -8 0ZM-5.6 -7.5a5.6 5.2 0 1 1 11.2 0a5.6 5.2 0 1 1 -11.2 0Z" fill="currentColor" />
      <path d="M0 -2C6.5 -2 8.6 4 8.2 9.5C7.8 15 3.6 19 0 22.5C-3.6 19 -7.8 15 -8.2 9.5C-8.6 4 -6.5 -2 0 -2Z" fill="currentColor" />
      <path d="M-8 5.5h16M-8 11.5h16M-5.5 17h11" stroke="var(--wax)" strokeWidth="2" />
    </svg>
  );
}

/** The C.I.D. stamp on the file's label: a hexagon, as on the force's badge. */
function Honey() {
  return (
    <svg className="tr-honey" viewBox="0 0 100 88" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeLinejoin="round">
        <polygon points="97.5,44 73.75,85.14 26.25,85.14 2.5,44 26.25,2.86 73.75,2.86" strokeWidth="3" />
        <polygon points="80,44 65,69.98 35,69.98 20,44 35,18.02 65,18.02" strokeWidth="2" />
      </g>
      <text x="50" y="52" textAnchor="middle" fontSize="15" fontWeight="700" fill="currentColor" fontFamily="Space Mono, monospace">
        CID
      </text>
    </svg>
  );
}

/** The Standings tab's mark: a line of faces either side of zero. */
function StandingsMark() {
  return (
    <svg className="tr-smark" viewBox="0 0 28 14" aria-hidden="true">
      <rect className="tr-smark__bad" x="0.5" y="5.6" width="13.5" height="2.8" />
      <rect className="tr-smark__good" x="14" y="5.6" width="13.5" height="2.8" />
      <path className="tr-smark__zero" d="M14 0.8v12.4" />
      <circle className="tr-smark__f tr-smark__f--bad" cx="5" cy="3.6" r="2.7" />
      <circle className="tr-smark__f tr-smark__f--good" cx="19" cy="10.4" r="2.7" />
      <circle className="tr-smark__f tr-smark__f--good" cx="23.6" cy="3.6" r="2.7" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Missions */

function FolderTabs({ on }: { on: 'missions' | 'standings' }) {
  return (
    <div className="tr-ftabs" data-tour="ftabs">
      <span className={on === 'missions' ? 'is-on' : undefined}>Missions</span>
      <span>Map</span>
      <span className={on === 'standings' ? 'is-on is-chart' : undefined}>
        <StandingsMark />
        Standings
      </span>
    </div>
  );
}

/** Before 19:00: the case file under twine and a wax seal, the time to go, and (until it's taken or put off) the
 * tour's tag tied to the twine under the seal. */
function SealedFile({ left, offer }: { left: { h: number; m: number }; offer: ReactNode }) {
  return (
    <div className="tr-sealed">
      <span className="tr-sealed__tab">
        Sealed · <b>{`${left.h}h ${left.m}m`}</b>
      </span>
      <div className="tr-sf">
        <Clip />
        <div className="tr-sf__label">
          <Honey />
          <p className="tr-sf__force">Manchester Metropolitan Police · C.I.D.</p>
          <p className="tr-sf__case">Case file · Op. Last Orders</p>
          <h3 className="tr-sf__title">The death of Bob</h3>
          <p className="tr-sf__warn">Not to be opened before</p>
          <p className="tr-sf__when">
            <b>19:00</b>
            <span>Sat 7 Nov 2026</span>
          </p>
        </div>
        <span className="tr-sf__tw tr-sf__tw--h" aria-hidden="true" />
        <span className="tr-sf__tw tr-sf__tw--v" aria-hidden="true" />
        <span className="tr-wax" aria-hidden="true">
          <Bee />
        </span>
        <p className="tr-sf__count" aria-label={`${left.h} hours ${left.m} minutes to go`}>
          <span className="tr-sf__big">{left.h}</span>
          <span className="tr-sf__u">hrs</span>
          <span className="tr-sf__big">{left.m}</span>
          <span className="tr-sf__u">min</span>
        </p>
        <p className="tr-sf__sub">to go</p>
        <p className="tr-sf__meet">
          <b>Meeting point:</b> Big Hands, 296 Oxford Road.
        </p>
        {offer}
      </div>
    </div>
  );
}

/** The offer: a tag tied to the sealed file's twine. */
export function OfferTag({ onTake, onLater, gone }: { onTake: () => void; onLater: () => void; gone: boolean }) {
  return (
    <HangTag width={152} tilt={1.2} className={`tr-offer${gone ? ' is-gone' : ''}`}>
      <p className="tr-ht__no">
        <span>Tour</span>
        <span>3 min</span>
      </p>
      <p className="tr-ht__sec">While you wait</p>
      <p className="tr-ht__t">Two hours to kill? Take the tour: 12 stops, 3 minutes.</p>
      <div className="tr-ht__stack">
        <button type="button" className="tr-ht__go" onClick={onTake}>
          Take the tour <ArrowIcon />
        </button>
        <button type="button" className="tr-ht__later" onClick={onLater}>
          Not now
        </button>
      </div>
    </HangTag>
  );
}

/** Tonight's live group mission, the stack's front folder. */
function LiveCard() {
  return (
    <div className="tr-front" data-tour="live">
      <div className="tr-front__tabs">
        <span className="tr-front__tab">
          Live · <b>12:40</b>
        </span>
        <span className="tr-front__back">2 more</span>
      </div>
      <div className="tr-front__b">
        <Clip />
        <p className="tr-k">
          <span>Group mission · everyone plays</span>
          <em>+5</em>
        </p>
        <h3 className="tr-front__t">Hats only!</h3>
        <p className="tr-front__d">Find the least hat-like thing you can and wear it as a hat. Weirdest wins.</p>
        <div className="tr-front__row">
          <p className="tr-front__time">
            12:40<small>left</small>
          </p>
          <p className="tr-front__you">
            3 of 7 in
            <br />
            you’re not in yet
          </p>
        </div>
        <span className="tr-btn tr-btn--go">
          <CameraIcon /> Send a photo
        </span>
      </div>
    </div>
  );
}

function Row({ k, title, sub, x, done }: { k: string; title: ReactNode; sub: string; x?: string; done?: boolean }) {
  return (
    <div className="tr-row">
      <b>{k}</b>
      <span className="tr-row__m">
        <span>{title}</span>
        <i>{sub}</i>
      </span>
      <span className={`tr-row__x${done ? ' is-done' : ''}`}>{x}</span>
    </div>
  );
}

function Section({ title, meta, tour, children }: { title: string; meta: string; tour?: string; children: ReactNode }) {
  return (
    <section className="tr-sec" data-tour={tour}>
      <header className="tr-sec__h">
        <h3>{title}</h3>
        <span>{meta}</span>
      </header>
      {children}
    </section>
  );
}

const STANDINGS = [
  { name: 'Maya', score: 15, tint: 4, badge: 'Confidant' },
  { name: 'Alex', score: 12, tint: 7, badge: 'Confidant', me: true },
  { name: 'Sam', score: 2, tint: 6 },
  { name: 'Ruth', score: -3, tint: 2 },
  { name: 'Priya', score: -9, tint: 5 },
  { name: 'Jonah', score: -15, tint: 1, badge: 'Interest' },
];

/** Standings on chart paper: bars from zero to ±25, each capped by the player's face, and the ±10 lines. */
function Standings() {
  const at = (score: number) => 50 + score * 1.8;
  return (
    <div className="tr-sg" data-tour="standings">
      {[-20, -10, 10, 20].map((v) => (
        <span key={v} className="tr-sg__line" style={{ left: `${at(v)}%` }} aria-hidden="true" />
      ))}
      <span className="tr-sg__line tr-sg__line--zero" style={{ left: '50%' }} aria-hidden="true" />
      <span className="tr-sg__line tr-sg__line--conf" style={{ left: `${at(10)}%` }} aria-hidden="true" />
      <span className="tr-sg__line tr-sg__line--poi" style={{ left: `${at(-10)}%` }} aria-hidden="true" />
      <p className="tr-sg__heads">
        <span>Under suspicion</span>
        <span>In the clear</span>
      </p>
      <p className="tr-sg__axis" aria-hidden="true">
        {[-20, -10, 0, 10, 20].map((v) => (
          <span key={v} style={{ left: `${at(v)}%` }}>
            {v > 0 ? `+${v}` : v < 0 ? `−${-v}` : '0'}
          </span>
        ))}
      </p>
      <p className="tr-sg__thr" aria-hidden="true">
        <span className="tr-sg__trusted" style={{ left: `calc(${at(10)}% + 5px)` }}>
          Trusted ›
        </span>
        <span className="tr-sg__watched" style={{ right: `calc(${at(10)}% + 5px)` }}>
          ‹ Watched
        </span>
      </p>
      <ol className="tr-sg__rows">
        {STANDINGS.map((p) => {
          const plus = p.score >= 0;
          const bar: CSSProperties = plus ? { left: '50%', width: `${p.score * 1.8}%` } : { right: '50%', width: `${-p.score * 1.8}%` };
          return (
            <li key={p.name} className={`tr-sg__row${p.me ? ' is-me' : ''}`}>
              <span className={`tr-sg__bar tr-sg__bar--${plus ? 'plus' : 'minus'}`} style={bar} />
              <span className="tr-sg__face" style={{ left: `${at(p.score)}%` }}>
                <Face tint={p.tint} size={30} ring={plus ? 'var(--accent)' : 'var(--warn)'} />
              </span>
              <span className="tr-sg__lab" style={plus ? { right: 'calc(50% + 8px)' } : { left: 'calc(50% + 8px)' }}>
                {p.me ? <b>{p.name}</b> : p.name}
                <i className={plus ? 'is-pos' : 'is-neg'}>{plus ? `+${p.score}` : `−${-p.score}`}</i>
                {p.badge ? <span className={`tr-sg__badge tr-sg__badge--${p.badge === 'Confidant' ? 'conf' : 'poi'}`}>{p.badge}</span> : null}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Form 3 on a suspect's file: a strung tag with Suspect and Charge, or, after a wrong guess, the charge struck through. */
function Form3({ wrong }: { wrong: boolean }) {
  return (
    <div className="tr-strung tr-strung--one">
      <div className="tr-strtag tr-strtag--form" data-tour="form3">
        <span className="tr-eye" aria-hidden="true" />
        <p className="tr-strtag__top">
          <span>Accusation · Form 3</span>
          <span>{wrong ? '2 of 3 left' : '3 of 3 left'}</span>
        </p>
        <span className="tr-stamp tr-stamp--bad">Charge Priya</span>
        <dl className="tr-cs">
          <div className="tr-cs__line">
            <dt>Suspect</dt>
            <dd>
              Marguerite D. <small>· Priya</small>
            </dd>
          </div>
          {wrong ? (
            <>
              <div className="tr-cs__line tr-cs__line--mini">
                <dt>Charge</dt>
                <dd>
                  <s>Seat thief</s> <small>21:53</small>
                  <span className="tr-cs__mini">Dismissed</span>
                </dd>
              </div>
              <div className="tr-cs__line">
                <dt>On file</dt>
                <dd>
                  <s>Seat thief</s> <small>21:53 · −5</small>
                </dd>
              </div>
            </>
          ) : (
            <div className="tr-cs__line">
              <dt>Charge</dt>
              <dd>
                <span className="tr-cs__blank">tap to type a charge</span>
                <i className="tr-caret" aria-hidden="true" />
              </dd>
            </div>
          )}
        </dl>
        {wrong ? (
          <span className="tr-cfb tr-cfb--off">Charge Priya again at 22:03</span>
        ) : (
          <span className="tr-cfb tr-cfb--red">
            <EditIcon /> Type a charge
          </span>
        )}
        <p className="tr-fine">{wrong ? 'Nobody else sees these, Priya included.' : 'Right: you +5, Priya −5 · Wrong: you −5'}</p>
      </div>
    </div>
  );
}

/** Priya's file, opened from her face on Standings. */
function SuspectFile({ wrong }: { wrong: boolean }) {
  return (
    <div className="tr-sub">
      <p className="tr-sub__back">
        <BackIcon /> Standings
      </p>
      <section className="tr-mf" data-tour="suspect-head">
        <span className="tr-mf__tab">Suspect file · Priya</span>
        <div className="tr-mf__head">
          <Face tint={5} size={54} />
          <div>
            <p className="tr-mf__name">Marguerite Delacroix</p>
            <p className="tr-mf__line">Housekeeper to Bob · played by Priya</p>
          </div>
        </div>
        <dl className="tr-mf__stats">
          <div>
            <dt>Score</dt>
            <dd className="is-neg">−9</dd>
          </div>
          <div>
            <dt>Rank</dt>
            <dd>
              #6<small>/8</small>
            </dd>
          </div>
          <div>
            <dt>Done</dt>
            <dd>2</dd>
          </div>
        </dl>
      </section>
      <Form3 wrong={wrong} />
      <div className="tr-redtag">
        <span className="tr-eye" aria-hidden="true" />
        <p className="tr-redtag__k">Tip-off · Form 7</p>
        <p className="tr-redtag__t">Tip off the police</p>
      </div>
    </div>
  );
}

export function MissionsPane({ specimen, scene, left, offer }: { specimen: boolean; scene: Scene; left: { h: number; m: number }; offer: ReactNode }) {
  if (specimen && scene.suspect) return <SuspectFile wrong={!!scene.wrong} />;
  const folder = specimen ? (scene.folder ?? 'missions') : 'missions';
  return (
    <div className="tr-folder">
      <FolderTabs on={folder} />
      <div className={`tr-fbody${folder === 'standings' ? ' tr-fbody--chart' : ''}`}>
        {!specimen ? (
          <SealedFile left={left} offer={offer} />
        ) : folder === 'standings' ? (
          <Standings />
        ) : (
          <>
            <LiveCard />
            <Section title="Story missions" meta="8 chapters" tour="story">
              <Row k="Ch. 1" title="The good old days" sub="closed · you entered" x="done" done />
              <Row k="Ch. 2" title="Motive" sub="live · you were given Sam" x="41:10" />
              <Row
                k="3–8"
                title={
                  <span className="tr-waxes" aria-label="Six sealed chapters">
                    {Array.from({ length: 6 }, (_, i) => (
                      <i key={i} />
                    ))}
                  </span>
                }
                sub="sealed until the GM opens them"
              />
            </Section>
            <Section title="Periodic missions" meta="Roll call" tour="rollcall">
              <Row k="No. 2" title="Your best detective face" sub="every hour · 15 min to answer" x="09:12" />
            </Section>
            <Section title="Group events" meta="Random drops">
              <Row k="Next" title="Random drop" sub="can land at any time" />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Form 3, the charge sheet */

const HITS = [
  { t: 'Cheers!', d: ['Clink ', 'drinks', ' with five different strangers (any ', 'drink', ' counts).'] },
  { t: 'Hold this', d: ['Get someone to hold your ', 'drink', ' for at least five minutes.'] },
  { t: 'Treat me', d: ['Get a player to buy you a ', 'drink', ' or a snack without asking them directly.'] },
];

/** The full-height Form 3: the search, then the terms and the signature, then upheld. */
export function ChargeSheet({ step }: { step: 'search' | 'terms' | 'upheld' }) {
  return (
    <div className="tr-csh" role="dialog" aria-label="Form 3, accusation">
      <span className="tr-csh__grab" aria-hidden="true" />
      <header className="tr-csh__head">
        <div>
          <p className="tr-csh__t">Form 3 · Accusation</p>
          <p className="tr-csh__sub">{step === 'upheld' ? 'Charge upheld' : 'Priya · 3 of 3 guesses left'}</p>
        </div>
        <span className="tr-csh__x" aria-hidden="true">
          <XIcon />
        </span>
      </header>
      <div className="tr-csh__body" data-scroller>
        {step === 'search' ? (
          <div className="tr-csh__group" data-tour="cs-search">
            <dl className="tr-cs tr-cs--big">
              <div className="tr-cs__line">
                <dt>Suspect</dt>
                <dd>
                  Marguerite D. <small>· played by Priya</small>
                </dd>
              </div>
              <div className="tr-cs__line">
                <dt>Charge</dt>
                <dd>
                  <span className="tr-cs__typed">drink</span>
                  <i className="tr-caret" aria-hidden="true" />
                </dd>
              </div>
            </dl>
            <div className="tr-csh__group" data-tour="cs-hits">
              <p className="tr-cs__count">
                <span>3 of 68 match “drink”</span>
                <span>Tap one</span>
              </p>
              <ul className="tr-hits">
                {HITS.map((h) => (
                  <li key={h.t}>
                    <b>{h.t}</b>
                    <span>{h.d.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</span>
                  </li>
                ))}
              </ul>
              <div className="tr-like">
                <span>Words like it</span>
                <ul>
                  <li>
                    hold <b>2</b>
                  </li>
                  <li>
                    buy <b>1</b>
                  </li>
                  <li>
                    strangers <b>12</b>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ) : step === 'terms' ? (
          <>
            <dl className="tr-cs tr-cs--big">
              <div className="tr-cs__line">
                <dt>Suspect</dt>
                <dd>
                  Marguerite D. <small>· played by Priya</small>
                </dd>
              </div>
              <div className="tr-cs__line">
                <dt>Charge</dt>
                <dd>
                  <span className="tr-cs__head">
                    <strong>Hold this</strong>
                    <u>Change</u>
                  </span>
                  <span className="tr-cs__desc">Get someone to hold your drink for at least five minutes. Proof: a photo of them holding it.</span>
                </dd>
              </div>
            </dl>
            <div className="tr-csh__group" data-tour="cs-terms">
              <div className="tr-terms">
                <h4>Terms · read before you sign</h4>
                <dl>
                  <div>
                    <dt>Uses</dt>
                    <dd>guess 1 of 3. You’ll have 2 left.</dd>
                  </div>
                  <div>
                    <dt className="is-ok">Upheld</dt>
                    <dd>you +5, Priya −5. It goes in the log book and Priya is dealt a fresh one.</dd>
                  </div>
                  <div>
                    <dt className="is-bad">Dismissed</dt>
                    <dd>you −5. No post; Priya isn’t told.</dd>
                  </div>
                  <div>
                    <dt>Then</dt>
                    <dd>no more charges on Priya for 10 min.</dd>
                  </div>
                </dl>
              </div>
              <div className="tr-csh__group" data-tour="cs-file">
                <p className="tr-sign">
                  <span>Signed</span>
                  <em>Alex</em>
                  <span>21:53</span>
                </p>
                <span className="tr-hold">
                  <svg viewBox="0 0 26 26" aria-hidden="true">
                    <circle cx="13" cy="13" r="10" />
                  </svg>
                  Hold to file the charge
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="tr-csh__group" data-tour="cs-upheld">
              <div className="tr-stampwrap">
                <dl className="tr-cs tr-cs--big">
                  <div className="tr-cs__line">
                    <dt>Suspect</dt>
                    <dd>
                      Marguerite D. <small>· played by Priya</small>
                    </dd>
                  </div>
                  <div className="tr-cs__line">
                    <dt>Charge</dt>
                    <dd>
                      <strong className="tr-cs__title">Hold this</strong>
                    </dd>
                  </div>
                  <div className="tr-cs__line">
                    <dt>Signed</dt>
                    <dd>
                      Alex <small>· 21:53</small>
                    </dd>
                  </div>
                </dl>
                <span className="tr-bigstamp">Upheld</span>
              </div>
              <p className="tr-result">
                <b>+5</b>
                <span>
                  to you · Priya −5
                  <br />
                  it’s left Priya’s hand; a fresh one is dealt
                </span>
              </p>
            </div>
            <p className="tr-cs__count">
              <span>In the log book now</span>
            </p>
            <div className="tr-strung tr-strung--one">
              <Entry no="0418" time="21:53" stamp="Cover blown" tone="bad" pts="−5">
                <b>Alex</b> exposed Priya’s secret mission: “Hold this”
              </Entry>
            </div>
            <p className="tr-fine">2 of 3 guesses left · charge Priya again from 22:03</p>
            <span className="tr-cfb tr-cfb--dark">Back to Priya’s file</span>
          </>
        )}
      </div>
    </div>
  );
}

/** The toast after a dismissed charge. */
export function WrongToast() {
  return (
    <p className="tr-toast tr-toast--top" data-tour="toast" role="status">
      <XIcon /> Not one of Priya’s. You lose 5.
    </p>
  );
}

/* ---------------------------------------------------------------- Log book */

/** The eye and the heart under an entry. `mine` is yours (1 heart, −1 eye, 0 neither); the counts stay hidden until
 * you've picked. */
function Marks({ mine, up, down, who }: { mine: -1 | 0 | 1; up: number; down: number; who: string }) {
  const seen = mine !== 0;
  return (
    <span className="tr-vm" role="group" aria-label={`Is ${who} credible?`}>
      <span className={`tr-vm__btn tr-vm__btn--eye${mine === -1 ? ' is-on' : ''}`} aria-label={seen ? `Doubtful, ${down}` : 'Doubtful'}>
        <Ic d={EYE} className="tr-vm__icon" />
        {seen ? <span>{down}</span> : null}
      </span>
      <span className={`tr-vm__btn tr-vm__btn--heart${mine === 1 ? ' is-on' : ''}`} aria-label={seen ? `Credible, ${up}` : 'Credible'}>
        <Ic d={HEART} className="tr-vm__icon" />
        {seen ? <span>{up}</span> : null}
      </span>
    </span>
  );
}

/** One entry: a kraft tag on the log book's twine. */
function Entry({
  no,
  time,
  stamp,
  tone,
  pts,
  marks,
  verdict,
  tour,
  children,
}: {
  no: string;
  time: string;
  stamp: string;
  tone: 'good' | 'bad' | 'warm' | 'plain';
  pts?: string;
  marks?: ReactNode;
  verdict?: ReactNode;
  tour?: string;
  children: ReactNode;
}) {
  return (
    <div className="tr-strtag" data-tour={tour}>
      <span className="tr-eye" aria-hidden="true" />
      <p className="tr-strtag__top">
        <span>No. {no}</span>
        <span>{time}</span>
      </p>
      <span className={`tr-stamp tr-stamp--${tone}`}>{stamp}</span>
      <p className="tr-strtag__text">{children}</p>
      {marks || pts ? (
        <div className="tr-strtag__foot">
          {marks}
          {pts ? <span className={`tr-pts tr-pts--${pts.startsWith('+') ? 'pos' : 'neg'}`}>{pts}</span> : null}
        </div>
      ) : null}
      {verdict}
    </div>
  );
}

export function LogbookPane({ specimen }: { specimen: boolean }) {
  if (!specimen) {
    return (
      <div className="tr-wall">
        <header className="tr-lbh">
          <h2>Log book</h2>
          <span>0 entries</span>
        </header>
        <div className="tr-empty">
          <span className="tr-empty__pin" aria-hidden="true" />
          <p className="tr-empty__k">Nothing logged yet</p>
          <p className="tr-empty__t">The log book opens with the case at 19:00.</p>
          <p className="tr-empty__d">Every mission, every frame and every tip lands here, stop by stop, for everyone to judge.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="tr-wall">
      <header className="tr-lbh">
        <h2>Log book</h2>
        <span>11 entries tonight</span>
      </header>
      <article className="tr-top" data-tour="top-card">
        <span className="tr-top__pin" aria-hidden="true" />
        <p className="tr-top__k">
          <span>Most credible tonight</span>
          <b>+4</b>
        </p>
        <div className="tr-top__body">
          <span className="tr-top__ph" aria-hidden="true">
            <svg viewBox="0 0 100 70" preserveAspectRatio="xMidYMax slice">
              <path d="M0 70h100V58H78V46H56V34H34V22H0z" className="tr-top__steps" />
              <path d="M0 22h34v12h22v12h22v12h22" className="tr-top__edge" />
              <circle cx="66" cy="22" r="5" className="tr-top__fig" />
              <path d="M58 46c0-10 3-17 8-17s8 7 8 17z" className="tr-top__fig" />
            </svg>
          </span>
          <div>
            <p className="tr-top__q">“Who’s that on the cellar steps? Sam, 23:01.”</p>
            <p className="tr-top__by">Maya · roll call No. 3 · 21:31</p>
          </div>
        </div>
        <p className="tr-top__foot">
          <Marks mine={1} up={5} down={1} who="Maya’s entry" />
          <span className="tr-award">+5 to Maya</span>
        </p>
      </article>
      <div className="tr-strung">
        <Entry no="0417" time="21:52" stamp="Confirmed · Theo" tone="good" pts="+5" tour="entry-new" marks={<Marks mine={0} up={3} down={1} who="Maya’s entry" />}>
          <b>Maya</b> completed a tampering mission
        </Entry>
        <Entry no="0416" time="21:48" stamp="Anonymous tip" tone="warm" pts="−5" marks={<Marks mine={-1} up={1} down={3} who="this entry" />}>
          Someone framed <b>Theo</b>
        </Entry>
        <Entry
          no="0409"
          time="21:14"
          stamp="Confirmed · Ruth"
          tone="good"
          pts="+5"
          marks={<Marks mine={1} up={4} down={1} who="Sam’s entry" />}
          verdict={
            <p className="tr-verdict">
              <span className="tr-stamp tr-stamp--good">Verdict · credible</span>
              <span>you agreed · +1</span>
            </p>
          }
        >
          <b>Sam</b> ordered a round in an accent. Ruth heard it.
        </Entry>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- My file */

function MyFolder({ score, rank, motive }: { score: string; rank: string; motive?: boolean }) {
  return (
    <section className="tr-mf">
      <span className="tr-mf__tab">Suspect file · Alex</span>
      <div className="tr-mf__head">
        <Face tint={7} size={54} />
        <div>
          <p className="tr-mf__name">Capt. Alistair Thorne</p>
          <p className="tr-mf__line">
            Alex · old army friend of Bob
            <br />
            Case no. 64 · 721897
          </p>
        </div>
      </div>
      <dl className="tr-mf__stats">
        <div>
          <dt>Score</dt>
          <dd className={score.startsWith('+') ? 'is-pos' : undefined}>{score}</dd>
        </div>
        <div>
          <dt>Rank</dt>
          <dd>{rank}</dd>
        </div>
        <div>
          <dt>Charges</dt>
          <dd>
            3<small> left</small>
          </dd>
        </div>
      </dl>
      {motive ? (
        <p className="tr-motive">
          <b>Motive · not for the record</b>
          He owed Bob a fortune, and the only record of the debt was in Bob’s desk.
        </p>
      ) : null}
    </section>
  );
}

/** The tour, kept in My file: the whole of it again, or one part. */
function TourCard({ taken, onTour }: { taken: string | null; onTour: (part: number | null) => void }) {
  const parts = ['Missions', 'Log book', 'Your missions', 'Accusing', 'Police'];
  return (
    <div className="tr-strung tr-strung--one">
      <div className="tr-strtag tr-strtag--tour">
        <span className="tr-eye" aria-hidden="true" />
        <p className="tr-strtag__top">
          <span>Torch tour · 12 stops</span>
          <span>3 min</span>
        </p>
        <h3 className="tr-tourcard__t">How tonight works</h3>
        <p className="tr-fine">Start at one part:</p>
        <div className="tr-parts">
          {parts.map((label, i) => (
            <button key={label} type="button" className="tr-part" onClick={() => onTour(i)}>
              {label}
            </button>
          ))}
        </div>
        <button type="button" className="tr-cfb tr-cfb--dark" onClick={() => onTour(null)}>
          <PlayIcon /> {taken ? 'Take the tour again' : 'Take the tour'}
        </button>
      </div>
    </div>
  );
}

export function FilePane({ specimen, taken, onTour }: { specimen: boolean; taken: string | null; onTour: (part: number | null) => void }) {
  if (specimen) {
    return (
      <div className="tr-wall">
        <p className="tr-sechead">
          <span>Tampering missions</span>
          <span>2 rerolls left</span>
        </p>
        <div className="tr-tt" data-tour="mission">
          <span className="tr-tt__eye" aria-hidden="true" />
          <div className="tr-tt__body">
            <p className="tr-tt__top">
              <span>No. 4 · dealt 19:00</span>
              <span>To do</span>
            </p>
            <h3 className="tr-tt__t">Say the word</h3>
            <p className="tr-tt__d">Get a player to say the word “spatula” without you saying it first.</p>
            <p className="tr-tt__proof">
              <b>Proof:</b> the player, and how you got them there.
            </p>
            <div className="tr-tt__btns">
              <span className="tr-btn tr-btn--line">
                <RerollIcon /> Reroll
              </span>
              <span className="tr-btn tr-btn--go">
                <SendIcon /> Submit
              </span>
            </div>
          </div>
        </div>
        <MyFolder score="+12" rank="#2" />
      </div>
    );
  }
  return (
    <div className="tr-wall">
      <MyFolder score="0" rank="–" motive />
      <p className="tr-sechead">
        <span>Tampering missions</span>
        <span>dealt at 19:00</span>
      </p>
      <p className="tr-dealt">Five secret missions come to this file when the case opens. Tell no one.</p>
      <p className="tr-sechead">
        <span>Your property</span>
        <span>{taken ? `toured ${taken}` : 'issued 16:40'}</span>
      </p>
      <TourCard taken={taken} onTour={onTour} />
    </div>
  );
}
