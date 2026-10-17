// The checks either side of the booking: the records check that waits on the GM before anything is taken down, the
// police's test call to the number they gave (last, once they've saved the police's number), and the case opening. In this mock a dashed "Mock:"
// button stands in for what the game would hear from elsewhere (the GM letting them in, Twilio saying the call was
// answered).
import { useEffect, useId, useState } from 'react';
import { buzz } from './feel';
import { cleanUkNumber, isUkMobile, showUkNumber, typedCountryCode } from './suspect';

/** A small dashed button that stands in for the GM or Twilio in the mock. */
function MockButton({ onClick, children }: { onClick(): void; children: string }) {
  return (
    <button type="button" className="bk-mockctl" onClick={onClick}>
      Mock: {children}
    </button>
  );
}

/** The force's board over the desk, with what this desk is for. */
function Board({ title }: { title: string }) {
  return (
    <header className="bk-board">
      <span className="bk-board__line">Manchester Metropolitan Police</span>
      <span className="bk-board__title">{title}</span>
    </header>
  );
}

/* ---------------------------------------------------------------- the records check */

const dots = (label: string, width = 22) => `${label} `.padEnd(width, '.');

/**
 * Before anything is taken down: their name run through the suspect register on a green screen, line by line, ending on
 * the duty inspector (the GM) deciding. When the GM lets them in, PERSON OF INTEREST stamps across it and on they go.
 */
export function Standby({ name, onIn, onOut }: { name: string; onIn(): void; onOut(): void }) {
  const [shown, setShown] = useState(0);
  const [cleared, setCleared] = useState(false);
  const lines = [
    `QUERY  ${name.toUpperCase()}`,
    `${dots('GUEST LIST')} ON IT`,
    `${dots('PRIOR RECORD')} NONE`,
    `${dots('MOTIVE')} UNKNOWN`,
    `${dots('DUTY INSPECTOR')} ${cleared ? 'CLEARED' : 'REVIEWING'}`,
  ];

  useEffect(() => {
    if (shown >= lines.length) return;
    const timer = window.setTimeout(() => setShown((n) => n + 1), shown === 0 ? 600 : 850);
    return () => window.clearTimeout(timer);
  }, [shown, lines.length]);

  useEffect(() => {
    if (!cleared) return;
    buzz([20, 60, 20]);
    const timer = window.setTimeout(onIn, 1900);
    return () => window.clearTimeout(timer);
  }, [cleared, onIn]);

  return (
    <div className="bk">
      <div className="bk__beam" aria-hidden="true" />
      <Board title="Records check" />
      <section className="bk-check">
        <div className={`bk-term${cleared ? ' is-cleared' : ''}`} aria-hidden="true">
          <span className="bk-term__head">MMP suspect register</span>
          {lines.slice(0, shown).map((line, i) => (
            <span key={i} className={`bk-term__line${i === lines.length - 1 && !cleared ? ' is-waiting' : ''}`}>
              {line}
            </span>
          ))}
          {shown < lines.length || !cleared ? <span className="bk-term__caret" /> : null}
          {cleared ? <span className="bk-stamp bk-stamp--teal bk-term__stamp">Person of interest</span> : null}
        </div>
        <p className="bk-lead" role="status">
          {cleared
            ? 'You’re a person of interest. Step this way.'
            : 'Hold tight. The duty inspector is deciding whether you’re a person of interest. This page moves on by itself.'}
        </p>
        {cleared ? null : (
          <>
            <div className="bk-wait">
              <span className="bk-wait__dot" aria-hidden="true" />
              Under review
            </div>
            <button type="button" className="bk-back bk-back--center" onClick={onOut}>
              Not you? Sign out
            </button>
            <MockButton onClick={() => setCleared(true)}>the GM lets them in</MockButton>
          </>
        )}
      </section>
    </div>
  );
}

/* ---------------------------------------------------------------- the test call */

type Call = 'dialling' | 'ringing' | 'answered' | 'missed';

/**
 * The last check: with the police's number saved, the police ring the number they gave, to be sure they can be reached
 * (and that the call shows as the police). Dialling, ringing (pick up, hear a short message, hang up), then answered
 * and on, or no answer and a choice of ringing again or fixing the number, right here.
 */
export function TestCall({ digits, onDone, onNumber }: { digits: string; onDone(): void; onNumber(typed: string): void }) {
  const [call, setCall] = useState<Call>('dialling');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (call !== 'dialling') return;
    const timer = window.setTimeout(() => setCall('ringing'), 1500);
    return () => window.clearTimeout(timer);
  }, [call]);

  useEffect(() => {
    if (call === 'answered') buzz([20, 40, 20]);
    else if (call === 'missed') buzz([8, 40, 8]);
  }, [call]);

  const number = showUkNumber(digits);
  const status =
    call === 'dialling'
      ? `Dialling ${number}…`
      : call === 'ringing'
        ? 'Ringing. Pick up: you’ll hear a short message from the desk. Then hang up.'
        : call === 'answered'
          ? 'Answered. We can reach you.'
          : 'No answer. Is the number right, and your ringer on?';

  return (
    <section className="bk-call" aria-labelledby="bk-call-title">
      <h1 id="bk-call-title" className="bk-call__title">
        A test call
      </h1>
      <p className="bk-call__note">
        One last thing: we need to know we can reach you. We’re ringing your mobile from the number you just saved.
      </p>

      <div className={`bk-call__panel is-${call}`}>
        <span className="bk-call__plate">MMP switchboard · Line 1</span>
        <div className="bk-call__handset" aria-hidden="true">
          <span className="bk-call__ring" />
          <span className="bk-call__ring bk-call__ring--2" />
          <svg viewBox="0 0 24 24">
            <path d="M6.6 3.5 9 3a1 1 0 0 1 1.1.6l1.2 2.9a1 1 0 0 1-.3 1.2L9.6 8.9a12 12 0 0 0 5.5 5.5l1.2-1.4a1 1 0 0 1 1.2-.3l2.9 1.2a1 1 0 0 1 .6 1.1l-.5 2.4a1.5 1.5 0 0 1-1.5 1.2C10.6 18.6 5.4 13.4 5.4 5a1.5 1.5 0 0 1 1.2-1.5Z" />
          </svg>
        </div>
        <span className="bk-call__number">{number}</span>
        <p className="bk-call__status" role="status" aria-live="polite">
          {status}
        </p>
        {call === 'answered' ? <span className="bk-stamp bk-stamp--teal bk-call__stamp">Reachable</span> : null}
      </div>

      {editing ? (
        <NumberFix
          digits={digits}
          onSave={(typed) => {
            onNumber(typed);
            setEditing(false);
            setCall('dialling');
          }}
          onCancel={() => setEditing(false)}
        />
      ) : call === 'answered' ? (
        <button type="button" className="bk-go" onClick={onDone}>
          Next <span aria-hidden="true">→</span>
        </button>
      ) : call === 'missed' ? (
        <div className="bk-call__retry">
          <button type="button" className="bk-go" onClick={() => setCall('dialling')}>
            Ring me again
          </button>
          <button type="button" className="bk-back bk-back--center" onClick={() => setEditing(true)}>
            Change my number
          </button>
        </div>
      ) : (
        <>
          <button type="button" className="bk-back bk-back--center" onClick={() => setEditing(true)}>
            Wrong number? Change it
          </button>
          {call === 'ringing' ? (
            <div className="bk-mockrow">
              <MockButton onClick={() => setCall('answered')}>they pick up</MockButton>
              <MockButton onClick={() => setCall('missed')}>no answer</MockButton>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

/** Putting the number right without leaving the call: same rules as the booking sheet (07…, no +44). */
function NumberFix({ digits, onSave, onCancel }: { digits: string; onSave(typed: string): void; onCancel(): void }) {
  const id = useId();
  const [typed, setTyped] = useState(showUkNumber(digits));
  const [tried, setTried] = useState(false);
  const clean = cleanUkNumber(typed);
  const ok = isUkMobile(clean);
  return (
    <form
      className="bk-call__fix"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        setTried(true);
        if (ok) onSave(showUkNumber(clean));
      }}
    >
      <label className="bk-call__fixlabel" htmlFor={id}>
        Your mobile
        {tried && !ok ? <span className="bk-stamp bk-stamp--red bk-stamp--tiny">Check it</span> : null}
      </label>
      <input
        id={id}
        className="bk-call__input"
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="07700 900417"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
      />
      <span className="bk-call__fixhint">
        {typedCountryCode(typed) && clean ? `No need for +44: we’ll ring ${showUkNumber(clean)}.` : 'Starting 07, as you’d dial it in the UK. No +44.'}
      </span>
      <button type="submit" className="bk-go">
        Ring this number
      </button>
      <button type="button" className="bk-back bk-back--center" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}

/* ---------------------------------------------------------------- the case opens */

/**
 * Through: where the game itself would start. Their file on top, and the way out; signing in again comes straight back
 * here, because the phone remembers they've been booked.
 */
export function CaseOpen({
  name,
  digits,
  photo,
  onSignOut,
  onForget,
}: {
  name: string;
  digits: string;
  photo: string | null;
  onSignOut(): void;
  onForget(): void;
}) {
  const first = name.trim().split(/\s+/)[0] || 'suspect';
  return (
    <div className="bk">
      <div className="bk__beam" aria-hidden="true" />
      <Board title="Case open" />
      <section className="bk-open">
        <div className="bk-open__card">
          {photo ? <img className="bk-open__photo" src={photo} alt="" /> : <span className="bk-open__photo" aria-hidden="true" />}
          <div className="bk-open__who">
            <span className="bk-label">Suspect</span>
            <strong>{name}</strong>
            <span className="bk-open__tel">{showUkNumber(digits)}</span>
          </div>
          <span className="bk-stamp bk-stamp--red bk-open__stamp">Booked</span>
        </div>
        <h1 className="bk-open__title">Welcome to the investigation, {first}.</h1>
        <div className="bk-open__game">The game starts here</div>
        <button type="button" className="bk-back bk-back--center" onClick={onSignOut}>
          Sign out
        </button>
        <MockButton onClick={onForget}>forget me, book me again</MockButton>
      </section>
    </div>
  );
}
