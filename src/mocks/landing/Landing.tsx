// The landing (sign-in) page, five ways round, to compare in the hand. All five keep the sign-in screen's pieces: the dark
// room, a police car's red and blue going off and on, plain striped tape pulled across as the page opens, a sprawled
// chalk outline with a little blood, and the way in as a manila case file. Tapping the file only presses it.
import type { ReactNode } from 'react';
import '../../themes/mystery.css';
import { GoogleMark } from '../booking/google';
import { Variants } from '../Variants';
import './landing.css';

const LEAD = 'Duck under the tape. Your case file is waiting.';
const FINE = 'We only use your name and photo. The GM approves everyone before they join.';

export default function Landing() {
  return (
    <Variants
      storageKey="landing-variant"
      items={[
        { name: 'Crossed tape', render: () => <CrossedTape /> },
        { name: 'Taped off', render: () => <TapedOff /> },
        { name: 'Big type', render: () => <BigType /> },
        { name: 'Barrier', render: () => <Barrier /> },
        { name: 'Exhibit', render: () => <Exhibit /> },
      ]}
    />
  );
}

/** 1. Crossed tape: the title at the top, a big chalk outline with two thick tapes pulled across it in an X from opposite
 * sides, meeting over the body, and a big case file at the bottom. */
function CrossedTape() {
  return (
    <div className="ld">
      <Siren />
      <header className="ld-x__head">
        <h1 className="ld-title ld-x__title">
          Mystery
          <br />
          Pub Crawl
        </h1>
      </header>
      <div className="ld-x__scene" aria-hidden="true">
        <ChalkOutline />
        <div className="ld-tapes">
          <span className="ld-tape ld-x__tape ld-x__tape--a" />
          <span className="ld-tape ld-tape--rtl ld-x__tape ld-x__tape--b" />
        </div>
      </div>
      <main className="ld-main ld-x__main">
        <p className="ld-lead">{LEAD}</p>
        <CaseFile className="ld-file--big" g={22} />
        <p className="ld-fine">{FINE}</p>
      </main>
    </div>
  );
}

/** 2. Taped off, seen from above: a dark wooden floor with tape run round all four edges in turn (top, right side,
 * bottom, left side), the title on a felt letterboard, three numbered evidence markers by the blood, and the case file
 * dropped on the floor. */
function TapedOff() {
  return (
    <div className="ld ld--floor">
      <Siren />
      <div className="ld-tapes ld-tapes--floor" aria-hidden="true">
        <span className="ld-tape ld-off__edge ld-off__edge--top" />
        <span className="ld-tape ld-tape--down ld-off__edge ld-off__edge--right" />
        <span className="ld-tape ld-tape--rtl ld-off__edge ld-off__edge--bottom" />
        <span className="ld-tape ld-tape--up ld-off__edge ld-off__edge--left" />
      </div>
      <div className="ld-off__inside">
        <h1 className="ld-board">
          <span>Mystery</span> <span>Pub Crawl</span>
        </h1>
        <div className="ld-off__scene" aria-hidden="true">
          <ChalkOutline>
            <Marker n={1} x={128} y={40} delay={1.1} />
            <Marker n={2} x={34} y={152} delay={1.25} />
            <Marker n={3} x={240} y={172} delay={1.4} />
          </ChalkOutline>
        </div>
        <p className="ld-lead">{LEAD}</p>
        <CaseFile className="ld-file--floor" />
        <p className="ld-fine">{FINE}</p>
      </div>
    </div>
  );
}

/** 3. Big type: the title stacked huge on the left with a thick tape slashed across it and a thin one above, the chalk
 * outline small and low on the right, partly off the edge, with a third tape behind it. Everything below sits left. */
function BigType() {
  return (
    <div className="ld">
      <Siren />
      <div className="ld-tapes" aria-hidden="true">
        <span className="ld-tape ld-tape--rtl ld-type__thin" />
      </div>
      <header className="ld-type__head">
        <div className="ld-type__block">
          <h1 className="ld-type__title">
            Mystery
            <br />
            Pub
            <br />
            Crawl
          </h1>
          <div className="ld-tapes" aria-hidden="true">
            <span className="ld-tape ld-type__slash" />
          </div>
        </div>
      </header>
      <div className="ld-type__mid">
        <div className="ld-tapes" aria-hidden="true">
          <span className="ld-tape ld-tape--rtl ld-type__low" />
        </div>
        <div className="ld-type__scene" aria-hidden="true">
          <ChalkOutline />
        </div>
        <p className="ld-lead ld-type__lead">{LEAD}</p>
      </div>
      <main className="ld-main ld-type__main">
        <CaseFile className="ld-file--narrow" />
        <p className="ld-fine">{FINE}</p>
      </main>
    </div>
  );
}

/** 4. Barrier: a police barrier across the middle (tape, the title on a dark strip, tape) tilted a little, a big faint
 * chalk outline behind everything, and a small case file below. The light comes from both sides: red, then blue. */
function Barrier() {
  return (
    <div className="ld">
      <div className="ld-bar__ghost" aria-hidden="true">
        <ChalkOutline />
      </div>
      <Siren both />
      <div className="ld-bar__space ld-bar__space--top" />
      <div className="ld-bar__band">
        <span className="ld-tape ld-bar__tape" aria-hidden="true" />
        <div className="ld-bar__strip">
          <h1 className="ld-title ld-bar__title">
            Mystery
            <br />
            Pub Crawl
          </h1>
        </div>
        <span className="ld-tape ld-tape--rtl ld-bar__tape" aria-hidden="true" />
      </div>
      <main className="ld-main ld-bar__main">
        <p className="ld-lead">{LEAD}</p>
        <CaseFile className="ld-file--small" />
        <p className="ld-fine">{FINE}</p>
      </main>
      <div className="ld-bar__space" />
    </div>
  );
}

/** 5. Exhibit: two tapes across the top as on the sign-in screen, a smaller title, and the scene as an instant photo
 * stuck to the wall with two short bits of the tape over its top corners. */
function Exhibit() {
  return (
    <div className="ld">
      <Siren />
      <div className="ld-tapes ld-ex__cordon" aria-hidden="true">
        <span className="ld-tape ld-ex__tape" />
        <span className="ld-tape ld-tape--rtl ld-ex__tape ld-ex__tape--thin" />
      </div>
      <header className="ld-ex__head">
        <h1 className="ld-title ld-ex__title">
          Mystery
          <br />
          Pub Crawl
        </h1>
      </header>
      <div className="ld-ex__stage" aria-hidden="true">
        <div className="ld-photo">
          <div className="ld-photo__shot">
            <ChalkOutline />
          </div>
          <div className="ld-photo__caption" />
          <span className="ld-photo__stick ld-photo__stick--l">
            <span className="ld-tape" />
          </span>
          <span className="ld-photo__stick ld-photo__stick--r">
            <span className="ld-tape ld-tape--rtl" />
          </span>
        </div>
      </div>
      <main className="ld-main">
        <p className="ld-lead">{LEAD}</p>
        <CaseFile />
        <p className="ld-fine">{FINE}</p>
      </main>
    </div>
  );
}

/** A police car somewhere off to the left (or, with `both`, red on the left and blue on the right), faint on the walls. */
function Siren({ both = false }: { both?: boolean }) {
  return <div className={both ? 'ld-siren ld-siren--both' : 'ld-siren'} aria-hidden="true" />;
}

/** The way in: a manila case file with a tab. It does nothing here but look pressed. */
function CaseFile({ className, g = 18 }: { className?: string; g?: number }) {
  return (
    <button type="button" className={className ? `ld-file ${className}` : 'ld-file'}>
      <span className="ld-file__tab" aria-hidden="true">
        Your file
      </span>
      <span className="ld-file__body">
        <span className="ld-file__g">
          <GoogleMark size={g} />
        </span>
        <span>Sign in with Google</span>
      </span>
    </button>
  );
}

/**
 * The chalk outline from the sign-in screen, sprawled: one arm flung up past the head, the other out and down, a knee bent
 * out to the side, a spatter of blood by the head and a few drops around, no more. The view box is cropped to the drawing
 * so each version can size it by its box; children are drawn on top, upright (the evidence markers).
 */
function ChalkOutline({ children }: { children?: ReactNode }) {
  return (
    <svg className="ld-outline" viewBox="-14 12 268 302" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <g transform="rotate(-26 120 150)">
        <g className="ld-chalk" fill="none" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="16 3 9 2">
          <circle cx="114" cy="44" r="20" />
          <path d="M104 66L54 58L62 26L60 12L46 8L40 16L32 70L90 96L98 160L46 214L54 276L48 292L76 294L78 268L70 226L118 186L146 236L166 282L170 296L196 292L190 276L174 230L152 166L150 104L186 128L196 164L200 180L212 182L220 164L208 108L144 80L128 70Z" />
        </g>
        <g className="ld-blood">
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
      {children}
    </svg>
  );
}

/** A yellow numbered evidence marker (a little tent card) standing at (x, y) in the outline's drawing; it pops up late. */
function Marker({ n, x, y, delay }: { n: number; x: number; y: number; delay: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className="ld-marker" style={{ animationDelay: `${delay}s` }}>
        <ellipse className="ld-marker__shadow" cx="2.5" cy="1" rx="12" ry="3.2" />
        <path className="ld-marker__back" d="M-6.5 -18L-5 -21.5H5L6.5 -18Z" />
        <path className="ld-marker__face" d="M-10 0L-6.5 -18H6.5L10 0Z" />
        <text y="-4.5" textAnchor="middle">
          {n}
        </text>
      </g>
    </g>
  );
}
