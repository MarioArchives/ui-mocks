// Swiping between the main screens (Mystery Pub Crawl): five looks for the move between Missions, Log book and My
// file. In each, the screens follow your finger while you drag, a flick or a drag past halfway moves on, and anything
// less springs back; tapping a tab plays the same move. The tab bar's marker and the title move along in every look.
// "Slow-mo" stretches the settling spring four times, to see what each look does.
import { useCallback, useEffect, useRef, useState } from 'react';
import '../../themes/mystery.css';
import { Variants } from '../Variants';
import { LOOKS, type Look, type Paint } from './looks';
import { usePager } from './pager';
import { PhoneIcon, SCREENS } from './screens';
import './swipe.css';

export default function SwipeOptions() {
  return <Variants storageKey="swipe-variant" swipe={false} items={LOOKS.map((look) => ({ name: look.name, render: () => <Phone look={look} /> }))} />;
}

/** Sets one element's styles for a frame; anything the paint leaves out goes back to rest. */
function apply(el: HTMLElement, p: Paint) {
  const s = el.style;
  s.visibility = p.hidden ? 'hidden' : '';
  s.transform = p.transform ?? '';
  s.transformOrigin = p.origin ?? '';
  s.zIndex = p.z === undefined ? '' : String(p.z);
  s.clipPath = p.clip ?? '';
  s.boxShadow = p.shadow ?? '';
  s.setProperty('--shade', String(p.shade ?? 0));
  for (const [k, v] of Object.entries(p.vars ?? {})) s.setProperty(k, v);
}

function Phone({ look }: { look: Look }) {
  const stage = useRef<HTMLDivElement>(null);
  const panes = useRef<(HTMLElement | null)[]>([]);
  const twines = useRef<(HTMLElement | null)[]>([]);
  const beam = useRef<HTMLSpanElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const tabs = useRef<(HTMLElement | null)[]>([]);
  const titles = useRef<(HTMLElement | null)[]>([]);
  const [slow, setSlow] = useState(false);
  const [moved, setMoved] = useState(false);

  const paint = useCallback(
    (pos: number) => {
      const el = stage.current;
      if (!el) return;
      const f = { pos, w: el.clientWidth, h: el.clientHeight };
      panes.current.forEach((pane, i) => pane && apply(pane, look.pane(i - pos, i, f)));
      twines.current.forEach((twine, i) => twine && apply(twine, look.between?.(i + 0.5 - pos, f) ?? { hidden: true }));
      if (beam.current) {
        const o = look.overlay?.(f) ?? { hidden: true };
        apply(beam.current, o);
        if (o.box) {
          beam.current.style.width = beam.current.style.height = `${o.box.size}px`;
          beam.current.style.transform = `translate3d(${o.box.x}px, ${o.box.y}px, 0)`;
        }
      }
      // The tab bar's marker and the app bar's title follow the same position, in every look.
      if (marker.current) marker.current.style.transform = `translate3d(${pos * 100}%, 0, 0)`;
      tabs.current.forEach((tab, i) => tab?.style.setProperty('--lit', String(Math.max(0, 1 - Math.abs(i - pos)))));
      titles.current.forEach((title, i) => {
        if (!title) return;
        title.style.opacity = String(Math.max(0, 1 - Math.abs(i - pos) * 1.8));
        title.style.transform = `translate3d(${(i - pos) * 28}px, 0, 0)`;
      });
    },
    [look],
  );

  const { index, goTo } = usePager(stage, SCREENS.length, paint, slow ? 4 : 1);
  useEffect(() => {
    if (index !== 0) setMoved(true);
  }, [index]);

  return (
    <div className={`sw-app sw-app--${look.id}`}>
      <header className="sw-appbar">
        <h1 className="sw-title">
          {SCREENS.map((s, i) => (
            <span key={s.id} ref={(el) => void (titles.current[i] = el)} aria-hidden={i !== index}>
              {s.title}
            </span>
          ))}
        </h1>
        <span className="sw-appbar__right">
          <span className="sw-tipline" aria-label="Tip line">
            <PhoneIcon />
          </span>
          <span className="sw-pts">15 pts · #1</span>
          <span className="sw-avatar" aria-label="Your account" />
        </span>
      </header>

      <div className="sw-stage" ref={stage}>
        {SCREENS.map((s, i) => (
          <section key={s.id} className={`sw-pane sw-pane--${s.id}`} ref={(el) => void (panes.current[i] = el)} aria-hidden={i !== index} inert={i !== index}>
            <div className="sw-scroll">
              <s.Body />
            </div>
            <span className="sw-pin" aria-hidden="true" />
            <span className="sw-shade" aria-hidden="true" />
          </section>
        ))}
        {SCREENS.slice(1).map((s, i) => (
          <span key={s.id} className="sw-twine" ref={(el) => void (twines.current[i] = el)} aria-hidden="true">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none">
              <path d="M0 1 Q50 22 100 1" />
            </svg>
          </span>
        ))}
        <span className="sw-beam" ref={beam} aria-hidden="true" />
      </div>

      <div className="sw-help">
        <p className={`sw-hint${moved ? ' is-gone' : ''}`}>
          <b>{look.blurb}</b> Swipe sideways, or tap a tab.
        </p>
        <button type="button" className={`sw-slow${slow ? ' is-on' : ''}`} aria-pressed={slow} onClick={() => setSlow((on) => !on)}>
          Slow-mo
        </button>
      </div>

      <nav className="sw-tabbar" aria-label="Main">
        <span className="sw-tabbar__marker" ref={marker} aria-hidden="true" />
        {SCREENS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className="sw-tab"
            ref={(el) => void (tabs.current[i] = el)}
            aria-current={i === index ? 'page' : undefined}
            onClick={() => goTo(i)}
          >
            <s.Icon />
            <span>{s.tab}</span>
            {s.id === 'file' ? <i className="sw-tab__dot" aria-hidden="true" /> : null}
          </button>
        ))}
      </nav>
    </div>
  );
}
