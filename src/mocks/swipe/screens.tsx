// The three main screens of Mystery Pub Crawl as they look in the game tonight (Missions, Log book, My file), drawn
// with made-up data so the swipe between them can be judged on real-looking pages. Long enough to scroll each one.
import type { ComponentType, ReactNode } from 'react';

export function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.2l2 2.2h8.8A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M8 3v18M11 8h5M11 12h5" />
      <path d="M3.5 7h3M3.5 12h3M3.5 17h3" strokeLinecap="round" />
    </svg>
  );
}

export function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" />
      <path d="M4.5 20.5c.8-4 3.9-6.3 7.5-6.3s6.7 2.3 7.5 6.3" />
    </svg>
  );
}

export function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.6 3.5h2.7l1.4 4-2 1.4a11 11 0 0 0 6.4 6.4l1.4-2 4 1.4v2.7A1.6 1.6 0 0 1 18.9 19 15.4 15.4 0 0 1 5 5.1a1.6 1.6 0 0 1 1.6-1.6z" />
    </svg>
  );
}

function Clip() {
  return <span className="sw-clip" aria-hidden="true" />;
}

/** A row in one of the Missions folder's lists. */
function Row({ k, title, sub, tag, hot }: { k: string; title: string; sub: string; tag?: string; hot?: boolean }) {
  return (
    <div className="sw-row">
      <span className={`sw-row__k${hot ? ' sw-red' : ''}`}>{k}</span>
      <span className="sw-row__body">
        <b>{title}</b>
        <small>{sub}</small>
      </span>
      {tag ? <span className="sw-row__tag">{tag}</span> : null}
    </div>
  );
}

function Section({ title, meta, children }: { title: string; meta?: string; children: ReactNode }) {
  return (
    <section className="sw-sec">
      <header className="sw-sec__head">
        <h2>{title}</h2>
        {meta ? <span>{meta}</span> : null}
      </header>
      {children}
    </section>
  );
}

/** Missions: the manila folder with its tabs, tonight's live group event on top and the lists below. */
function Missions() {
  return (
    <div className="sw-ms">
      <div className="sw-ms__tabs">
        <span className="is-on">Missions</span>
        <span>Map</span>
        <span>Standings</span>
      </div>
      <div className="sw-ms__folder">
        <span className="sw-ms__livetab">
          Remake <b>34:20</b>
        </span>
        <article className="sw-ms__card">
          <Clip />
          <p className="sw-kicker">
            <span>Group event · No. 1</span>
            <span className="sw-red">1 of 1 live</span>
          </p>
          <h2 className="sw-ms__title">Album cover remake</h2>
          <p className="sw-ms__text">
            Recreate a famous album cover with whatever (and whoever) is to hand. Name the album in your comment. Most
            faithful, or most ridiculous, wins.
          </p>
          <p className="sw-ms__rule">Most yes (less no) wins +5 · −5 if you don’t</p>
          <div className="sw-ms__timer">
            <b>34:20</b>
            <span>left</span>
            <span className="sw-prints" aria-label="2 of 5 in">
              {[1, 1, 0, 0, 0].map((on, i) => (
                <i key={i} className={on ? 'is-in' : undefined} />
              ))}
              <small>2 of 5 in</small>
            </span>
          </div>
          <p className="sw-ms__in">You’re in · hidden until voting</p>
          <span className="sw-ms__btn">✎ Edit your entry</span>
        </article>
        <Section title="Group events" meta="Random drops">
          <Row k="No. 1" hot title="Album cover remake" sub="34:20 left · you’re in" tag="Remake" />
          <Row k="Next" title="Random drop" sub="can land at any time" />
        </Section>
        <Section title="Your missions" meta="3 in hand">
          <Row k="01" title="Get a stranger to toast the victim" sub="Proof: a photo of the raised glass" tag="Claim" />
          <Row k="02" title="Order a drink in an accent all night" sub="Proof: your witness heard it" tag="Claim" />
          <Row k="03" title="Learn the barman’s middle name" sub="Proof: tell it to your witness" tag="Claim" />
        </Section>
        <Section title="Periodic missions">
          <Row k="–" title="None yet tonight" sub="they come as the night goes on" />
        </Section>
        <Section title="Story missions" meta="8 chapters">
          <div className="sw-row">
            <span className="sw-row__k">1–8</span>
            <span className="sw-row__body">
              <span className="sw-seals" aria-label="8 sealed chapters">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <small>sealed until the GM opens them</small>
            </span>
          </div>
        </Section>
      </div>
    </div>
  );
}

/** One luggage tag on the log book's string: a stamp, who and what. */
function Tag({ no, time, stamp, tone, children }: { no: string; time: string; stamp: string; tone?: 'good' | 'bad'; children: ReactNode }) {
  return (
    <article className="sw-tag">
      <span className="sw-tag__eye" aria-hidden="true" />
      <p className="sw-tag__top">
        <span>No. {no}</span>
        <span>{time}</span>
      </p>
      <span className={`sw-stamp${tone ? ` sw-stamp--${tone}` : ''}`}>{stamp}</span>
      <p className="sw-tag__text">{children}</p>
    </article>
  );
}

/** Log book: the most credible entry pinned on top, then the night stop by stop on a string of tags. */
function Logbook() {
  return (
    <div className="sw-wall">
      <header className="sw-lb__head">
        <h2>Log book</h2>
        <span>18 entries tonight</span>
      </header>
      <article className="sw-top">
        <span className="sw-top__pin" aria-hidden="true" />
        <p className="sw-top__k">
          <span>Most credible tonight</span>
          <b>+2</b>
        </p>
        <div className="sw-top__body">
          <span className="sw-polaroid" aria-hidden="true">
            <span>My precious</span>
            <i />
          </span>
          <div>
            <p className="sw-top__quote">“Ten out of ten, would repeat.”</p>
            <p className="sw-top__by">Sam · My precious · Before the crawl, 07:55</p>
          </div>
        </div>
        <p className="sw-top__foot">
          <span>
            Credible 2 <span className="sw-faint">Doubtful 0</span>
          </span>
          <span className="sw-award">+5 to Sam</span>
        </p>
      </article>

      <div className="sw-stop">
        <span className="sw-stop__tab">Now · Stop 02</span>
        <div className="sw-stop__card">
          <Clip />
          <p className="sw-kicker">
            <span>Since 10:31 · 1 entry</span>
          </p>
          <h3>The Grosvenor</h3>
          <span className="sw-stamp sw-stamp--bad sw-stop__live">Active</span>
        </div>
      </div>
      <div className="sw-string">
        <Tag no="2320" time="10:31" stamp="Standing changed">
          <b>Maya</b> is now a trusted confidant
        </Tag>
        <Tag no="2319" time="10:24" stamp="Confirmed" tone="good">
          <b>Priya</b> got a stranger to toast the victim. Jonah saw it.
        </Tag>
      </div>
      <p className="sw-walk">
        <span aria-hidden="true">· · ·</span>
        910 m · 11 min walk
      </p>
      <div className="sw-stop">
        <span className="sw-stop__tab">Stop 01 · Filed</span>
        <div className="sw-stop__card sw-stop__card--filed">
          <p className="sw-kicker">
            <span>09:31–10:31 · 4 entries</span>
            <span className="sw-teal">All stamped</span>
          </p>
          <h3>Big Hands</h3>
        </div>
      </div>
      <div className="sw-string">
        <Tag no="2311" time="10:12" stamp="Framed" tone="bad">
          Someone framed <b>Alex</b>: −5 off their score.
        </Tag>
        <Tag no="2307" time="09:58" stamp="Confirmed" tone="good">
          <b>Sam</b> ordered in an accent all round. Maya heard it.
        </Tag>
        <Tag no="2302" time="09:40" stamp="Group event">
          <b>Album cover remake</b> is open: 45 minutes to enter.
        </Tag>
      </div>
    </div>
  );
}

/** My file: the interview room, a witness request waiting on you, then your suspect file. */
function MyFile() {
  return (
    <div className="sw-wall">
      <p className="sw-room">
        <span>Interview room B</span>
        <span className="sw-rec">
          <i /> Rec 10:32
        </span>
      </p>
      <div className="sw-string">
        <article className="sw-tag sw-tag--big">
          <span className="sw-tag__eye" aria-hidden="true" />
          <p className="sw-tag__top">
            <span>Witness request</span>
            <span>1 waiting</span>
          </p>
          <span className="sw-stamp sw-stamp--bad">Needs your word</span>
          <p className="sw-tag__note">Only approve what you really saw. Rejecting costs them 5 and swaps their tampering mission.</p>
          <p className="sw-claim">
            <span className="sw-face" aria-hidden="true" />
            <span>
              <b>Priya</b> says they did
              <small>6 min ago</small>
            </span>
          </p>
          <h3 className="sw-tag__title">Question time</h3>
          <p className="sw-tag__text">
            Answer a player only with questions for five minutes without them calling it out. Proof: the player, who
            will vouch for it once they work it out.
          </p>
          <p className="sw-tag__label">Comment (optional)</p>
          <span className="sw-field">Nice one! / I didn’t see that.</span>
          <p className="sw-tag__btns">
            <span className="sw-btn">Approve</span>
            <span className="sw-btn sw-btn--bad">Reject</span>
          </p>
        </article>
      </div>
      <div className="sw-suspect">
        <span className="sw-stop__tab">Suspect file · Maya</span>
        <Clip />
        <p className="sw-cleared">
          <b>
            <PhoneIcon /> Cleared (for now)
          </b>
          <small>Trusted confidant · score above +10</small>
        </p>
        <div className="sw-suspect__card">
          <span className="sw-mug" aria-hidden="true" />
          <div>
            <p className="sw-kicker">
              <span>Case 64 · 721897</span>
            </p>
            <h3>Ashcombe V</h3>
            <p className="sw-suspect__who">Lady Violet Ashcombe · Niece of Bob · played by Maya</p>
          </div>
        </div>
        <ul className="sw-ledger">
          <li>
            <span>Top of the log book</span>
            <b>+5</b>
          </li>
          <li>
            <span>Learn the barman’s middle name</span>
            <b>+5</b>
          </li>
          <li>
            <span>Police check-in · answered</span>
            <b>+3</b>
          </li>
          <li>
            <span>Framed by someone</span>
            <b className="sw-red">−5</b>
          </li>
          <li>
            <span>Album cover remake · entered</span>
            <b>+2</b>
          </li>
        </ul>
      </div>
    </div>
  );
}

export interface Screen {
  id: string;
  /** The app bar's title on that screen. */
  title: string;
  tab: string;
  Icon: ComponentType;
  Body: ComponentType;
}

export const SCREENS: Screen[] = [
  { id: 'missions', title: 'Mystery Pub Crawl', tab: 'Missions', Icon: FolderIcon, Body: Missions },
  { id: 'logbook', title: 'Log book', tab: 'Log book', Icon: BookIcon, Body: Logbook },
  { id: 'file', title: 'My file', tab: 'My file', Icon: PersonIcon, Body: MyFile },
];
