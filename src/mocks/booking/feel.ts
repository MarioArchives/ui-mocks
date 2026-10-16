// How the booking desk feels in the hand: a buzz where the phone allows it, and less motion where it's asked for.

/** A short buzz where the phone can (Android); iPhones ignore it, and so does Chrome until the first tap. */
export const buzz = (pattern: number | number[]) => {
  try {
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
    navigator.vibrate?.(pattern);
  } catch {
    /* no vibration: fine */
  }
};

export const lessMotion = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};
