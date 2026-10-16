// The sign-in screen, from the game's (Quest-Game src/packs/mystery/screens/SignIn.tsx) and moved on: police tape that
// stretches across the screen as it opens, a sprawled chalk outline with a little blood, and a police car's red and
// blue going off and on from the left. The way in is a manila file standing up from the bottom of the screen, the sign-in
// typed on its label; then a stand-in for Google's account picker. Nothing is signed in: picking the account just moves the mock on.
import { useEffect, useRef, useState } from 'react';
import { GoogleMark } from './google';
import './signin.css';

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
      <div className="si__siren" aria-hidden="true" />
      <div className="si__cordon si__cordon--top" aria-hidden="true">
        <span className="si__tape" />
        <span className="si__tape si__tape--thin" />
      </div>
      <header className="si__head">
        {/* Three lines, the murder biggest; the spaces between keep the name whole when it's read out. */}
        <h1 className="si__title">
          <span className="si__title-a">A Manchester</span> <span className="si__title-b">Murder:</span>{' '}
          <span className="si__title-c">Pub Crawl</span>
        </h1>
      </header>
      <ChalkOutline />
      <div className="si__cordon si__cordon--bottom" aria-hidden="true">
        <span className="si__tape" />
        <span className="si__tape si__tape--thin" />
      </div>
      <main className="si__main">
        <p className="si__lead">Duck under the tape. Your case file is waiting.</p>
        <button type="button" className="si-file" onClick={() => setPicker('open')}>
          <span className="si-file__tab" aria-hidden="true">
            Your file
          </span>
          <span className="si-file__back">
            <span className="si-file__papers" aria-hidden="true" />
            <span className="si-file__front">
              <span className="si-file__label">Sign in with Google</span>
              <span className="si-file__fine">We only use your name and photo. The GM approves everyone before they join.</span>
            </span>
          </span>
        </button>
      </main>
      {picker === 'closed' ? null : (
        <AccountPicker name={name} email={email} signing={picker === 'signing'} onPick={() => setPicker('signing')} onClose={() => setPicker('closed')} />
      )}
    </div>
  );
}

/**
 * A chalk outline on the floor, sprawled: one arm flung up past the head, the other out and down, a knee bent out to
 * the side. A spatter of blood by the head and a few drops around, no more.
 */
function ChalkOutline() {
  return (
    <div className="si__scene" aria-hidden="true">
      <svg viewBox="0 0 240 300" preserveAspectRatio="xMidYMid meet">
        <g transform="rotate(-26 120 150)">
        <g className="si__chalk" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="16 3 9 2">
          <circle cx="114" cy="44" r="20" />
          <path d="M104 66L54 58L62 26L60 12L46 8L40 16L32 70L90 96L98 160L46 214L54 276L48 292L76 294L78 268L70 226L118 186L146 236L166 282L170 296L196 292L190 276L174 230L152 166L150 104L186 128L196 164L200 180L212 182L220 164L208 108L144 80L128 70Z" />
        </g>
        <g className="si__blood">
          <path d="M150 28c6-3 12 1 12 7s-5 10-11 9c-5-1-8-5-7-9 1-3 3-6 6-7z" />
          <circle cx="166" cy="24" r="1.8" />
          <circle cx="163" cy="47" r="1.3" />
          <circle cx="143" cy="22" r="1.2" />
          <ellipse cx="62" cy="128" rx="2.6" ry="1.8" transform="rotate(30 62 128)" />
          <circle cx="69" cy="135" r="1.2" />
          <circle cx="226" cy="196" r="2" />
          <circle cx="24" cy="200" r="1.6" />
        </g>
        </g>
      </svg>
    </div>
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
            to continue to <strong>A Manchester Murder: Pub Crawl</strong>
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
