// The swipe between screens, as one number: the position along the screens (0 the first, 1 the second, 1.5 halfway
// from the second to the third). It follows the finger while you drag, then springs to a screen when you let go, faster
// for a flick. Nothing re-renders while it moves: each frame hands the position to `paint`, which sets styles directly.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

/** Sideways movement before a drag counts as a swipe, and how much straighter than vertical it must be. */
const LOCK_PX = 8;
const LOCK_RATIO = 1.2;
/** A flick at least this fast (screens a second) moves on even when short. */
const FLICK = 0.6;
/** Past the first or last screen the drag only goes this far for each pixel. */
const RUBBER = 0.25;
/** The spring that settles on a screen: about half a second, without a wobble. */
const STIFFNESS = 170;
const DAMPING = 26;
const STEP_S = 1 / 240;

/** Keeps a drag past either end on a short leash. */
function rubber(raw: number, last: number): number {
  if (raw < 0) return raw * RUBBER;
  if (raw > last) return last + (raw - last) * RUBBER;
  return raw;
}

export interface Pager {
  /** The screen it rests on (or is heading to). */
  index: number;
  goTo: (index: number) => void;
}

/**
 * Drag sideways on `stage` (with `touch-action: pan-y`, so scrolling up and down stays the browser's) to move between
 * `count` screens. `slow` stretches the settling spring, to watch a look in slow motion.
 */
export function usePager(stage: RefObject<HTMLElement | null>, count: number, paint: (pos: number) => void, slow = 1): Pager {
  const pos = useRef(0);
  const [index, setIndex] = useState(0);
  const latest = useRef({ paint, slow, count });
  latest.current = { paint, slow, count };
  const frame = useRef(0);

  /** Springs from where it is to `target`, starting at `velocity` screens a second. */
  const settle = useCallback((target: number, velocity: number) => {
    cancelAnimationFrame(frame.current);
    setIndex(target);
    let v = velocity;
    let last = performance.now();
    const tick = (now: number) => {
      const { paint, slow } = latest.current;
      let dt = Math.min(0.05, (now - last) / 1000) / slow;
      last = now;
      for (; dt > 0; dt -= STEP_S) {
        const h = Math.min(STEP_S, dt);
        v += (-STIFFNESS * (pos.current - target) - DAMPING * v) * h;
        pos.current += v * h;
      }
      if (Math.abs(pos.current - target) < 0.0005 && Math.abs(v) < 0.005) {
        pos.current = target;
        paint(target);
        return;
      }
      paint(pos.current);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let drag: { id: number; x: number; y: number; from: number; locked: boolean; trail: { t: number; x: number }[] } | null = null;
    let justDragged = false;

    const down = (e: PointerEvent) => {
      if (!e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
      cancelAnimationFrame(frame.current); // catch it mid-flight: the drag carries on from where it is
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, from: pos.current, locked: false, trail: [{ t: e.timeStamp, x: e.clientX }] };
      justDragged = false;
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.locked) {
        if (Math.abs(dx) > LOCK_PX && Math.abs(dx) > Math.abs(dy) * LOCK_RATIO) {
          drag.locked = true;
          el.setPointerCapture(e.pointerId);
          el.classList.add('is-dragging');
        } else if (Math.abs(dy) > LOCK_PX) {
          drag = null; // a scroll, not a swipe
          return;
        } else return;
      }
      drag.trail.push({ t: e.timeStamp, x: e.clientX });
      while (drag.trail.length > 2 && e.timeStamp - drag.trail[0]!.t > 100) drag.trail.shift();
      const { paint, count } = latest.current;
      pos.current = rubber(drag.from - dx / el.clientWidth, count - 1);
      paint(pos.current);
    };
    const up = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      el.classList.remove('is-dragging');
      if (!d.locked) {
        // A tap mid-flight: let it land where it was going.
        if (Math.abs(pos.current - Math.round(pos.current)) > 0.0005) settle(Math.round(pos.current), 0);
        return;
      }
      justDragged = true;
      const first = d.trail[0]!;
      const ms = Math.max(1, e.timeStamp - first.t);
      // Screens a second; a left flick moves on. A cancelled pointer's position can't be trusted.
      const velocity = e.type === 'pointercancel' ? 0 : (-(e.clientX - first.x) / ms) * 1000 / el.clientWidth;
      const start = Math.round(d.from);
      let target = Math.round(pos.current);
      if (Math.abs(velocity) > FLICK) target = velocity > 0 ? Math.ceil(pos.current - 0.0005) : Math.floor(pos.current + 0.0005);
      target = Math.max(start - 1, Math.min(start + 1, target)); // one screen a swipe
      target = Math.max(0, Math.min(latest.current.count - 1, target));
      settle(target, velocity);
    };
    // A drag that ends over a button doesn't press it.
    const click = (e: MouseEvent) => {
      if (!justDragged) return;
      justDragged = false;
      e.stopPropagation();
      e.preventDefault();
    };

    // The stage changes size with the phone (rotation, the browser's bars): paint again where it is.
    const resized = new ResizeObserver(() => latest.current.paint(pos.current));
    resized.observe(el);

    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('click', click, true);
    return () => {
      cancelAnimationFrame(frame.current);
      resized.disconnect();
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      el.removeEventListener('click', click, true);
    };
  }, [stage, settle]);

  // Paint the resting position on mount and whenever the look changes.
  useLayoutEffect(() => {
    paint(pos.current);
  }, [paint]);

  const goTo = useCallback((to: number) => settle(Math.max(0, Math.min(latest.current.count - 1, to)), 0), [settle]);
  return { index, goTo };
}
