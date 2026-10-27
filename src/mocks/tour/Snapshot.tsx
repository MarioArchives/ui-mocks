// The game's own screens, as scripts/snapshot-tour.mjs kept them from Quest-Game's demo: each scene's app (app bar and
// page), its tab bar and what hung over it (a sheet, a toast), as HTML, with the game's CSS. They are drawn in a shadow
// root so the game's CSS and the mocks' never meet, inside stand-ins for the game's <html> and <body> (the script
// renamed those selectors snap-root and snap-body). The tour is drawn in the same shadow root, so it can measure the
// elements it lights where they lie.
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import gameCss from './snap/game.css?raw';
import scenesJson from './snap/scenes.json?raw';
import type { SceneId } from './stops';
import tourCss from './tour.css?inline';

export interface Scene {
  /** The game's .app class names (app--fill on the map). */
  appClass: string;
  /** The app's inside: the app bar and the page. */
  app: string;
  /** The tab bar, as the game drew it on that screen. */
  tabbar: string;
  /** Whatever was over the app: a sheet, the toasts. */
  overlays: string[];
  /** Seconds the countdown showed when it was kept (the sealed screens). */
  count: number | null;
}

export const SNAP = JSON.parse(scenesJson) as { taken: string; width: number; scenes: Record<SceneId, Scene> };

/** An overlay with something in it (every screen keeps the game's toasts holder, mostly empty). */
export const shown = (html: string) => !/^<div class="toasts"[^>]*><\/div>$/.test(html);

/** Draws `children` into a shadow root that holds the game's CSS and the tour's. */
export function ShadowFrame({ children }: { children: ReactNode }) {
  const host = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const el = host.current!;
    const root = el.shadowRoot ?? el.attachShadow({ mode: 'open' });
    if (!root.querySelector('snap-body')) {
      const style = document.createElement('style');
      style.textContent = `${gameCss}\n${tourCss}`;
      const html = document.createElement('snap-root');
      html.append(document.createElement('snap-body'));
      root.append(style, html);
    }
    setBody(root.querySelector<HTMLElement>('snap-body'));
  }, []);
  return <div ref={host}>{body ? createPortal(children, body) : null}</div>;
}

/**
 * One scene's app in a scrolling pane, as the game drew it. When the scene changes, the pane goes back to its top, a
 * carousel brings back the card that was in its middle, and a map is centred again for this phone's width.
 */
export function Page({ id }: { id: SceneId }) {
  const scene = SNAP.scenes[id];
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.parentElement) el.parentElement.scrollTop = 0;
    const fit = () => {
      for (const mid of el.querySelectorAll<HTMLElement>('[data-snap-center]')) {
        const track = mid.parentElement;
        if (!track) continue;
        const r = mid.getBoundingClientRect();
        const t = track.getBoundingClientRect();
        track.scrollLeft += r.left + r.width / 2 - (t.left + track.clientWidth / 2);
      }
      // Standings share the sheet's height out among the rows, as the game does on every resize (standingRowSize in
      // its src/lib/standingBars.ts): rows from 58px up to half as big again, faces in step.
      for (const st of el.querySelectorAll<HTMLElement>('.st')) {
        const rows = st.querySelector<HTMLElement>('.st__rows');
        const n = Number(st.style.getPropertyValue('--rows')) || rows?.children.length || 0;
        if (!rows || !n || !rows.clientHeight) continue;
        const row = Math.min(87, Math.max(58, Math.floor(rows.clientHeight / n)));
        const face = Math.round((row * 40) / 58);
        st.style.setProperty('--st-row', `${row}px`);
        st.style.setProperty('--st-face', `${face}px`);
        st.querySelectorAll<HTMLElement>('.st__icon').forEach((icon) => icon.style.setProperty('--size', `${face}px`));
      }
      for (const map of el.querySelectorAll<HTMLElement>('[data-snap-map]')) {
        const [w = 0] = (map.dataset.snapMap ?? '').split('x').map(Number);
        map.style.setProperty('--snap-dx', `${Math.round((map.clientWidth - w) / 2)}px`);
      }
    };
    fit();
    const seen = new ResizeObserver(fit);
    seen.observe(el);
    return () => seen.disconnect();
  }, [id]);
  return <div ref={ref} className={scene.appClass} dangerouslySetInnerHTML={{ __html: scene.app }} />;
}

/** Writes `left` seconds into every countdown the sealed screens showed, as the game does (H:MM:SS). */
export function tick(root: HTMLElement, left: number) {
  const s = Math.max(0, Math.floor(left));
  const text = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  for (const el of root.querySelectorAll('[data-snap-count]')) {
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE && /\d+:\d\d:\d\d/.test(node.textContent ?? '')) node.textContent = (node.textContent ?? '').replace(/\d+:\d\d:\d\d/, text);
    }
  }
}
