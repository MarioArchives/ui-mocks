// Save our number (Mystery Pub Crawl): the slide after booking that asks a player to save the police's number, so they
// know who it is when the GM rings during the night (the more suspicious they look, the more often). Three versions
// to compare: a calling card on the desk, a preview of the incoming call, and a notice on the cork board with tear-off
// tabs. Each saves a contact card (a .vcf download, which a phone opens in its contacts) or copies the number; "I've
// saved it" only stamps a slip here, where the game would go on to the first pub.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import '../../themes/mystery.css';
import './phone.css';
import { buzz, lessMotion } from '../booking/feel';
import { HoneycombStamp } from '../stamp/stamps';
import { Variants } from '../Variants';
import { POLICE_NAME, POLICE_TEL_SHOWN, addContact, copyText } from './contact';

export default function SaveNumber() {
  return (
    <Variants
      storageKey="phone-variant"
      items={[
        { name: 'Calling card', render: () => <CallingCard /> },
        { name: 'Incoming call', render: () => <IncomingCall /> },
        { name: 'Notice', render: () => <Notice /> },
      ]}
    />
  );
}

/* ---------------------------------------------------------------- shared */

type Said = 'saved' | 'card' | 'file' | 'torn' | 'copied' | 'failed';
/** The line under the actions after each one, read out too. */
const SAID: Record<Said, string> = {
  saved: 'Your phone app opens with our number in. Tap “Create new contact” and call us Manchester Metropolitan Police.',
  card: 'Tap “Create New Contact” to keep us. If nothing opened, copy the number.',
  file: 'On a computer that’s a contact file. On your phone, this opens your phone app or contacts instead.',
  torn: 'Torn off. Your phone should offer to add us.',
  copied: 'Copied. Paste it into a new contact.',
  failed: 'Couldn’t copy it. Write it down, then.',
};

/** Saving the card and copying the number, the same in every version, and whether they've done either yet. */
function useNumber() {
  const [said, setSaid] = useState<Said | null>(null);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const save = (how: 'saved' | 'torn') => {
    buzz(how === 'torn' ? [5, 25, 5, 25, 14] : 14);
    const added = addContact();
    setSaid(added === 'file' ? 'file' : how === 'torn' ? 'torn' : added === 'card' ? 'card' : 'saved');
    setDone(true);
  };
  const copy = async () => {
    const ok = await copyText(POLICE_TEL_SHOWN);
    buzz(ok ? 10 : [8, 40, 8]);
    setSaid(ok ? 'copied' : 'failed');
    if (!ok) return;
    setDone(true);
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1800);
  };
  return { said, copied, done, save, copy };
}
type NumberKit = ReturnType<typeof useNumber>;

function Heading({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <header className="ph-head">
      <p className="ph-head__kicker">{kicker}</p>
      <h1 className="ph-head__title">{title}</h1>
      <p className="ph-head__copy">{children}</p>
    </header>
  );
}

function Status({ said, idle = '' }: { said: Said | null; idle?: string }) {
  return (
    <p className="ph-said" role="status">
      {said ? SAID[said] : idle}
    </p>
  );
}

/** Add to contacts, and copy the number as a second string. */
function Actions({ kit }: { kit: NumberKit }) {
  return (
    <div className="ph-actions">
      <button type="button" className="ph-go" onClick={() => kit.save('saved')}>
        <ContactIcon />
        Add to contacts
      </button>
      <button type="button" className={`ph-copy${kit.copied ? ' is-copied' : ''}`} onClick={kit.copy}>
        {kit.copied ? <TickIcon /> : <CopyIcon />}
        {kit.copied ? 'Copied' : 'Copy number'}
      </button>
      <Status said={kit.said} />
    </div>
  );
}

/**
 * The way on: quiet until they've saved or copied the number, then filled in. In the booking flow it moves on
 * (`onDone`); on its own here it only stamps a slip.
 */
function Onward({ ready, onDone }: { ready: boolean; onDone?: () => void }) {
  const [noted, setNoted] = useState(false);
  return (
    <div className="ph-foot">
      {noted ? (
        <div className="ph-slip" role="status">
          <span className="ph-slip__stamp">Noted</span>
          <p className="ph-slip__line">Number on file. On to the first pub, and keep your ringer on.</p>
          <button type="button" className="ph-link" onClick={() => setNoted(false)}>
            Back (mock only)
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`ph-next${ready ? ' is-ready' : ''}`}
          onClick={() => {
            buzz(30);
            if (onDone) onDone();
            else setNoted(true);
          }}
        >
          I’ve saved it <span aria-hidden="true">→</span>
        </button>
      )}
    </div>
  );
}

/** The force's mark: a worker bee, Manchester's own, in a double ring. */
function Bee({ className }: { className: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <svg className={`ph-bee ${className}`} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        {/* The stripes are gaps in the ink, so the bee sits on any background. */}
        <mask id={`b${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">
          <rect width="48" height="48" fill="#fff" />
          <path d="M18 26.6H30M18 30.4H30" stroke="#000" strokeWidth="1.5" />
        </mask>
      </defs>
      <circle className="ph-bee__line" cx="24" cy="24" r="22.6" strokeWidth="1.6" />
      <circle className="ph-bee__line" cx="24" cy="24" r="20" strokeWidth="0.8" />
      <g className="ph-bee__wings">
        <ellipse cx="17.6" cy="24.4" rx="5" ry="2.6" transform="rotate(14 17.6 24.4)" />
        <ellipse cx="30.4" cy="24.4" rx="5" ry="2.6" transform="rotate(-14 30.4 24.4)" />
        <ellipse cx="16.4" cy="18.8" rx="7" ry="3.7" transform="rotate(-26 16.4 18.8)" />
        <ellipse cx="31.6" cy="18.8" rx="7" ry="3.7" transform="rotate(26 31.6 18.8)" />
      </g>
      <path className="ph-bee__line" d="M22.8 12.6C21.8 10.4 20.2 9.4 18.6 9.4M25.2 12.6C26.2 10.4 27.8 9.4 29.4 9.4" strokeWidth="1.2" />
      <g mask={`url(#b${uid})`}>
        <circle cx="24" cy="14.4" r="2.6" />
        <circle cx="24" cy="19.6" r="3.3" />
        <ellipse cx="24" cy="28.6" rx="4.8" ry="7" />
        <path d="M22.6 35.2L24 38.6L25.4 35.2Z" />
      </g>
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg className="ph-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10.8" r="2.3" />
      <path d="M5.8 16.2c.6-1.7 1.7-2.5 3.2-2.5s2.6.8 3.2 2.5M14.6 10h3.8M14.6 13.4h2.6" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="ph-icon" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8.5" y="8" width="11.5" height="13" rx="1.5" />
      <path d="M15.5 5V4.5A1.5 1.5 0 0 0 14 3H5.5A1.5 1.5 0 0 0 4 4.5V15A1.5 1.5 0 0 0 5.5 16.5H6" />
    </svg>
  );
}

function TickIcon() {
  return (
    <svg className="ph-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

/* ---------------------------------------------------------------- 1 · the calling card */

/**
 * The detective's card, dealt onto the desk under the torch: letterpress on cream stock with the force's honeycomb
 * stamp for a crest, the number underlined in pen. The booking flow uses it as its last step, passing `onDone`.
 */
export function CallingCard({ onDone }: { onDone?: () => void }) {
  const kit = useNumber();
  return (
    <div className="ph ph--desk">
      <div className="ph__beam" aria-hidden="true" />
      <Heading kicker="One more thing" title="Save this number">
        We’ll be in touch tonight. The more suspicious you look, the more often we’ll ring. Don’t ignore us.
      </Heading>
      <div className="ph-desk">
        <span className="ph-desk__ring" aria-hidden="true" />
        <article className="ph-card">
          <div className="ph-card__face">
            <header className="ph-card__head">
              <HoneycombStamp className="ph-card__stamp" />
              <div className="ph-card__org">
                <strong className="ph-card__name">
                  <span>Manchester</span> <span>Metropolitan Police</span>
                </strong>
                <span className="ph-card__dept">Criminal Investigation Dept.</span>
              </div>
            </header>
            <p className="ph-card__num">
              <span className="ph-card__tel">Telephone</span>
              <span className="ph-card__digits">
                {POLICE_TEL_SHOWN}
                {/* Someone at the desk has underlined it twice, in biro. */}
                <svg className="ph-card__pen" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true">
                  <path pathLength={1} d="M2 5C48 2 118 7 198 3" />
                  <path pathLength={1} d="M16 11C74 8 128 12 186 9" />
                </svg>
              </span>
            </p>
            <footer className="ph-card__foot">
              <span>Night desk</span>
              <span>Day or night · mostly night</span>
            </footer>
          </div>
        </article>
      </div>
      <Actions kit={kit} />
      <Onward ready={kit.done} onDone={onDone} />
    </div>
  );
}

/* ---------------------------------------------------------------- 2 · the incoming call */

/** A preview of the call itself, ringing on a phone of its own: it shakes, and its buttons are only for show. */
function IncomingCall() {
  const kit = useNumber();

  // One real buzz with the first ring, where the phone allows it (only once they've touched the page, so after a swipe).
  useEffect(() => {
    if (lessMotion()) return;
    const id = window.setTimeout(() => buzz([180, 110, 180]), 1000);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className="ph ph--call">
      <div className="ph__beam" aria-hidden="true" />
      <Heading kicker="Fair warning" title="Pick up when we ring">
        This is what you’ll see when we call. The more suspicious you look, the more we’ll ring. Save us so you know it’s us.
      </Heading>
      <figure className="ph-preview">
        <div className="ph-phone">
          <div className="ph-phone__screen">
            <div className="ph-call__bar" aria-hidden="true">
              <span>23:47</span>
              <svg className="ph-call__icons" viewBox="0 0 40 12">
                <rect x="0" y="8" width="3" height="4" rx="0.6" />
                <rect x="4.5" y="6" width="3" height="6" rx="0.6" />
                <rect x="9" y="3.5" width="3" height="8.5" rx="0.6" />
                <rect x="13.5" y="1" width="3" height="11" rx="0.6" opacity="0.35" />
                <rect x="21" y="1.5" width="16" height="9" rx="2.4" fill="none" stroke="currentColor" strokeWidth="1" />
                <rect className="ph-call__low" x="22.6" y="3.1" width="3.2" height="5.8" rx="1.2" />
                <rect x="37.8" y="4.3" width="1.6" height="3.4" rx="0.6" />
              </svg>
            </div>
            <span className="ph-call__island" aria-hidden="true" />
            <p className="ph-call__kind">Incoming call</p>
            <div className="ph-call__face" aria-hidden="true">
              <span className="ph-call__ring" />
              <span className="ph-call__ring" />
              <Bee className="ph-call__bee" />
            </div>
            <p className="ph-call__name">{POLICE_NAME}</p>
            <p className="ph-call__num">{POLICE_TEL_SHOWN}</p>
            <div className="ph-call__btns" aria-hidden="true">
              <span className="ph-call__btn">
                <span className="ph-call__disc ph-call__disc--no">
                  <Handset turned />
                </span>
                Decline
              </span>
              <span className="ph-call__btn">
                <span className="ph-call__disc ph-call__disc--yes">
                  <Handset />
                </span>
                Answer
              </span>
            </div>
          </div>
        </div>
        <span className="ph-preview__tag" aria-hidden="true">
          Preview
        </span>
        <figcaption className="ph-preview__cap">Only a preview. Nobody’s ringing yet.</figcaption>
      </figure>
      <Actions kit={kit} />
      <Onward ready={kit.done} />
    </div>
  );
}

function Handset({ turned = false }: { turned?: boolean }) {
  return (
    <svg className="ph-call__handset" viewBox="0 0 24 24">
      <path
        transform={turned ? 'rotate(135 12 12)' : undefined}
        d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
      />
    </svg>
  );
}

/* ---------------------------------------------------------------- 3 · the notice */

const TABS = 7;
/** Taken before you got here. */
const GONE = [1, 4];

/** A typed notice pinned to the cork board, with the number on tear-off tabs along its foot. Tear one to save us. */
function Notice() {
  const kit = useNumber();
  const [torn, setTorn] = useState<number[]>([]);
  return (
    <div className="ph ph--board">
      <div className="ph__beam" aria-hidden="true" />
      <div className="ph-board">
        <span className="ph-board__scrap" aria-hidden="true" />
        <article className="ph-notice">
          <div className="ph-notice__sheet">
            <span className="ph-pin ph-pin--l" aria-hidden="true" />
            <span className="ph-pin ph-pin--r" aria-hidden="true" />
            <h1 className="ph-notice__title">
              <span className="ph-notice__big">Notice</span> <span className="ph-notice__to">to all suspects</span>
            </h1>
            <div className="ph-notice__body">
              <p>Tonight the Manchester Metropolitan Police will be making enquiries by telephone.</p>
              <p>The more suspicious you look, the more often we will ring. Calls not answered will be noted.</p>
              <p className="ph-notice__save">Save this number:</p>
              <p className="ph-notice__num">{POLICE_TEL_SHOWN}</p>
              <p className="ph-notice__take" aria-hidden="true">
                ↓ Please take one ↓
              </p>
            </div>
          </div>
          <ul className="ph-tabs">
            {Array.from({ length: TABS }, (_, i) => {
              if (GONE.includes(i)) return <li key={i} className="is-gone" aria-hidden="true" />;
              const off = torn.includes(i);
              return (
                <li key={i} className={off ? 'is-gone' : undefined}>
                  <button
                    type="button"
                    className={`ph-tab${off ? ' is-torn' : ''}`}
                    disabled={off}
                    aria-hidden={off || undefined}
                    aria-label={`Tear off a tab: save ${POLICE_NAME} to your contacts`}
                    onClick={() => {
                      setTorn((t) => [...t, i]);
                      kit.save('torn');
                    }}
                  >
                    <span className="ph-tab__print">
                      <span className="ph-tab__who">Manchester Met. Police</span>
                      <span className="ph-tab__num">{POLICE_TEL_SHOWN}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </article>
      </div>
      <Status said={kit.said} idle="Tear off a tab to save us to your contacts." />
      <button type="button" className={`ph-link ph-copylink${kit.copied ? ' is-copied' : ''}`} onClick={kit.copy}>
        {kit.copied ? <TickIcon /> : <CopyIcon />}
        {kit.copied ? 'Copied' : 'Copy number'}
      </button>
      <Onward ready={kit.done} />
    </div>
  );
}
