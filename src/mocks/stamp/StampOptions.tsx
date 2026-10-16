// Stamp options (Mystery Pub Crawl): the police are now Manchester Metropolitan Police, and the seal on their letter is to
// be purple with the city's worker bee at its centre. Three designs, each shown where it lands, slammed onto the sign-off
// of the booking desk's letter once the sergeant has signed, and again big on a proof sheet so its detail can be judged.
// Tap the letter to sign and stamp it again.
import { useState, type ComponentType } from 'react';
import '../../themes/mystery.css';
import { Variants } from '../Variants';
import { CrestStamp, HoneycombStamp, RoundSeal } from './stamps';
import './stamp.css';

interface Design {
  /** Picks where the stamp sits on the letter and how it's tilted (`st-stamp--<kind>`). */
  kind: 'round' | 'crest' | 'hex';
  name: string;
  Stamp: ComponentType<{ className?: string }>;
  /** The proof sheet's caption, after the name. */
  note: string;
}

const DESIGNS: Design[] = [
  { kind: 'round', name: 'Round seal', Stamp: RoundSeal, note: 'the name round the rim, C.I.D. at the foot' },
  { kind: 'crest', name: 'Crest', Stamp: CrestStamp, note: 'a crowned shield, laurels and a ribbon' },
  { kind: 'hex', name: 'Honeycomb', Stamp: HoneycombStamp, note: 'a hexagonal cell, the name round the inside' },
];

/** The stamp pad's ink; kept in step with --st-ink in stamp.css. */
const INK = '#5F2D95';

const LETTER = [
  'Thank you for your cooperation.',
  'We will now proceed to take your fingerprints for the purposes of the investigation.',
  'When asked, place your right thumb on the glass and keep it there until the machine has finished.',
];

export default function StampOptions() {
  return (
    <Variants
      storageKey="stamp-variant"
      items={DESIGNS.map((design) => ({ name: design.name, render: () => <Sheet design={design} /> }))}
    />
  );
}

function Sheet({ design: { kind, name, Stamp, note } }: { design: Design }) {
  // Bumped on a tap, to remount the sign-off so the signature and the stamp play again.
  const [take, setTake] = useState(0);
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="st">
      <p className="st-kicker">Manchester Metropolitan Police · the seal</p>
      <div className="st-folder">
        <span className="st-folder__tab">From the desk sergeant</span>
        <div className="st-folder__body">
          <article className="st-letter" onClick={() => setTake((n) => n + 1)}>
            <Paperclip />
            <header className="st-letter__head">
              <Crest />
              <div className="st-letter__org">
                <strong>Manchester Metropolitan Police</strong>
                <span>Criminal Investigation Dept.</span>
              </div>
            </header>
            <dl className="st-letter__meta">
              <dt>Ref</dt>
              <dd>MMP/CID/2352</dd>
              <dt>Date</dt>
              <dd>{today}</dd>
              <dt>Re</dt>
              <dd>Sam Rivers, a.k.a. “The Duchess”</dd>
            </dl>
            <div className="st-letter__body">
              <p>Dear Sam Rivers,</p>
              {LETTER.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <footer key={take} className="st-letter__sign">
              <span>Yours faithfully,</span>
              <svg className="st-letter__sig" viewBox="0 0 130 44" aria-hidden="true">
                <path
                  pathLength={1}
                  d="M4 32C12 10 20 4 22 14S16 38 26 30 36 10 40 18 38 34 48 26 58 12 62 20 60 32 70 26 80 14 86 18 84 30 94 26 104 18 110 22M30 38C56 34 90 34 126 30"
                />
              </svg>
              <span className="st-letter__who">Desk Sergeant, Manchester Metropolitan Police</span>
              <Stamp className={`st-stamp st-stamp--${kind} st-letter__stamp`} />
            </footer>
          </article>
        </div>
      </div>
      <p className="st-hint">Tap the letter to sign and stamp it again.</p>
      <figure className="st-proof">
        <span className="st-proof__label">
          Proof <span aria-hidden="true">·</span> ink {INK}
        </span>
        <Stamp className={`st-stamp st-stamp--${kind} st-proof__stamp`} />
        <figcaption className="st-proof__caption">
          <strong>{name}:</strong> {note}
        </figcaption>
      </figure>
    </div>
  );
}

function Paperclip() {
  return (
    <svg className="st-clip" width="16" height="44" viewBox="0 0 16 44" aria-hidden="true">
      <path d="M5 40 V8 a3 3 0 0 1 6 0 V34 a5 5 0 0 1 -10 0 V12" fill="none" stroke="var(--eyelet)" strokeWidth="2" />
    </svg>
  );
}

/** The force's shield, for the letterhead. */
function Crest() {
  return (
    <svg className="st-letter__crest" viewBox="0 0 30 34" aria-hidden="true">
      <path d="M15 1.5 28 6v10.5C28 24.5 22.5 30 15 32.5 7.5 30 2 24.5 2 16.5V6z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M15 4.8 25 8.3v8.2C25 22.6 20.8 27 15 29.2 9.2 27 5 22.6 5 16.5V8.3z" fill="currentColor" opacity="0.12" />
      <polygon points="15,9 16.9,14.4 22.6,14.6 18.1,18 19.7,23.5 15,20.3 10.3,23.5 11.9,18 7.4,14.6 13.1,14.4" fill="currentColor" />
    </svg>
  );
}
