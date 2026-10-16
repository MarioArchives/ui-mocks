// The game's sign-in screen (Quest-Game src/packs/mystery/screens/SignIn.tsx, copied for the look: torchlight, tape,
// the title, a chalk outline and the way in as a little case file), then a stand-in for Google's account picker.
// Nothing is signed in: picking the account just moves the mock on.
import { useEffect, useRef, useState } from 'react';
import { GoogleMark } from './google';
import './signin.css';

const TAPE = 'CRIME SCENE · DO NOT CROSS · '.repeat(8);

type Picker = 'closed' | 'open' | 'signing';

export function SignIn({ name, email, onDone }: { name: string; email: string; onDone(): void }) {
  const [picker, setPicker] = useState<Picker>('closed');
  const done = useRef(onDone);
  done.current = onDone;

  // "Signing in" for a moment after the account is picked, as Google does.
  useEffect(() => {
    if (picker !== 'signing') return;
    const timer = window.setTimeout(() => done.current(), 1100);
    return () => window.clearTimeout(timer);
  }, [picker]);

  return (
    <div className="si">
      <div className="si__beam" aria-hidden="true" />
      <div className="si__cordon si__cordon--top" aria-hidden="true">
        <span className="si__tape">{TAPE}</span>
        <span className="si__tape si__tape--thin">{TAPE}</span>
      </div>
      <header className="si__head">
        <p className="si__line">Blackwood Manor · one night only</p>
        <h1 className="si__title">
          Mystery
          <br />
          Pub Crawl
        </h1>
        <p className="si__sticker">· Someone did it ·</p>
      </header>
      <ChalkOutline />
      <div className="si__cordon si__cordon--bottom" aria-hidden="true">
        <span className="si__tape">{TAPE}</span>
        <span className="si__tape si__tape--thin">{TAPE}</span>
      </div>
      <main className="si__main">
        <p className="si__lead">Duck under the tape. Your case file is waiting.</p>
        <button type="button" className="si-file" onClick={() => setPicker('open')}>
          <span className="si-file__tab" aria-hidden="true">
            Your file
          </span>
          <span className="si-file__body">
            <span className="si-file__g">
              <GoogleMark size={18} />
            </span>
            <span>Sign in with Google</span>
          </span>
        </button>
        <p className="si__fine">We only use your name and photo. The GM approves everyone before they join.</p>
      </main>
      {picker === 'closed' ? null : (
        <AccountPicker name={name} email={email} signing={picker === 'signing'} onPick={() => setPicker('signing')} onClose={() => setPicker('closed')} />
      )}
    </div>
  );
}

/** A chalk outline on the floor, with a couple of prints beside it. */
function ChalkOutline() {
  return (
    <div className="si__scene" aria-hidden="true">
      <svg viewBox="0 0 240 300" preserveAspectRatio="xMidYMid meet">
        <g transform="rotate(18 120 150)" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="16 3 9 2">
          <path d="M120 18a22 22 0 1 0 .1 0z M112 64 L80 80 L42 138 L58 150 L90 110 L94 182 L70 280 L94 286 L120 198 L146 286 L170 280 L148 182 L152 110 L182 150 L198 138 L160 80 L128 64" />
        </g>
        <g className="si__prints" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
          <g transform="translate(196 40) scale(1.4) rotate(12 12 12)">
            <Print />
          </g>
          <g transform="translate(8 218) scale(1.1) rotate(-20 12 12)">
            <Print />
          </g>
        </g>
      </svg>
    </div>
  );
}

function Print() {
  return (
    <>
      <path d="M5.5 10.5C6.6 6.6 9 5 12 5s5.4 1.6 6.5 5.5" />
      <path d="M4.8 15c0-1.4.1-2.6.4-3.7M19.2 12.5c.1 2.6-.3 5-1.1 7.2" />
      <path d="M7.4 18.5c-.4-1.5-.5-3-.4-4.5.2-4 2.3-6.6 5-6.6s4.8 2.6 4.9 6.6c0 1.6-.1 3.1-.5 4.6" />
      <path d="M9.9 20.6c-.6-1.7-.9-3.6-.8-5.6.1-3 1.3-4.6 2.9-4.6s2.9 1.6 3 4.6c.1 2-.3 4-1 5.8" />
      <path d="M12 13.8c.5 2.4.4 5-.4 7.6" />
    </>
  );
}

/**
 * Where Google's own "choose an account" page would come up: a plain stand-in sheet with the one pretend account.
 * No password, no real account; tapping the account just signs the mock in.
 */
function AccountPicker({ name, email, signing, onPick, onClose }: { name: string; email: string; signing: boolean; onPick(): void; onClose(): void }) {
  return (
    <div className="gg" onClick={signing ? undefined : onClose}>
      <div className="gg__card" role="dialog" aria-modal="true" aria-labelledby="gg-title" onClick={(e) => e.stopPropagation()}>
        <div className="gg__bar">
          <GoogleMark size={18} />
          <span>Sign in with Google</span>
        </div>
        <div className={`gg__progress${signing ? ' is-on' : ''}`} aria-hidden="true" />
        <div className="gg__body">
          <h2 id="gg-title" className="gg__title">
            {signing ? 'Signing you in…' : 'Choose an account'}
          </h2>
          <p className="gg__sub">
            to continue to <strong>Mystery Pub Crawl</strong>
          </p>
          <ul className="gg__list">
            <li>
              <button type="button" className="gg__acct" onClick={onPick} disabled={signing}>
                <span className="gg__avatar" aria-hidden="true">
                  {name.trim()[0] ?? '?'}
                </span>
                <span className="gg__who">
                  <span className="gg__name">{name}</span>
                  <span className="gg__email">{email}</span>
                </span>
              </button>
            </li>
            <li>
              <span className="gg__acct gg__acct--other">
                <span className="gg__avatar gg__avatar--other" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <circle cx="12" cy="8.5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                Use another account
              </span>
            </li>
          </ul>
          <p className="gg__fine">Mock only: no account is used and nothing is signed in.</p>
        </div>
      </div>
    </div>
  );
}
