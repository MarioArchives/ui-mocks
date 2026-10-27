// Several versions of one screen, to compare in the hand: a pill at the top left with ‹ › and the version's name, or
// swipe sideways (or ← → on a keyboard). Each version is mounted fresh when you land on it, so its opening plays again.
// A mock whose screens use sideways swipes themselves passes `swipe={false}`, leaving the pill and the keys.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import './variants.css';

export interface Variant {
  /** A short name for the pill, two or three words. */
  name: string;
  render: () => ReactNode;
}

export function Variants({ items, storageKey, swipe: swipes = true }: { items: Variant[]; storageKey: string; swipe?: boolean }) {
  const [at, setAt] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(storageKey));
      return Number.isInteger(saved) && saved >= 0 && saved < items.length ? saved : 0;
    } catch {
      return 0;
    }
  });
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const go = (by: number) => setAt((n) => (n + by + items.length) % items.length);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(at));
    } catch {
      /* private mode: it just starts at the first again */
    }
  }, [at, storageKey]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') setAt((n) => (n - 1 + items.length) % items.length);
      else if (e.key === 'ArrowRight') setAt((n) => (n + 1) % items.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items.length]);

  const item = items[at]!;
  return (
    <div
      className="mk-variants"
      onTouchStart={(e) => {
        if (!swipes) return;
        const t = e.touches[0];
        swipe.current = t ? { x: t.clientX, y: t.clientY } : null;
      }}
      onTouchEnd={(e) => {
        const from = swipe.current;
        const t = e.changedTouches[0];
        swipe.current = null;
        if (!from || !t) return;
        const dx = t.clientX - from.x;
        if (Math.abs(dx) > 70 && Math.abs(t.clientY - from.y) < 60) go(dx < 0 ? 1 : -1);
      }}
    >
      <div key={at}>{item.render()}</div>
      <nav className="mk-switch" aria-label="Versions">
        <button type="button" onClick={() => go(-1)} aria-label="Previous version">
          ‹
        </button>
        <span aria-live="polite">
          {at + 1}/{items.length} · {item.name}
        </span>
        <button type="button" onClick={() => go(1)} aria-label="Next version">
          ›
        </button>
      </nav>
    </div>
  );
}
