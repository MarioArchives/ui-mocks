// The suspect: what the booking desk takes down, their mobile number the UK way, and what the mock remembers once
// they're through, so signing in again goes straight to the game (in the game itself, their player record does this).

export interface Particulars {
  name: string;
  /** Their mobile as typed; cleanUkNumber() gives the digits. */
  phone: string;
  heightCm: number;
  poison: string | null;
  marks: string;
}

/**
 * The digits of a UK number, starting 0. Spaces and dashes go, and a +44 (or 0044, or 44) typed anyway becomes the
 * leading 0, with any "(0)" after it dropped.
 */
export function cleanUkNumber(typed: string) {
  let digits = typed.replace(/[^\d+]/g, '');
  if (digits.startsWith('+44')) digits = digits.slice(3);
  else if (digits.startsWith('0044')) digits = digits.slice(4);
  else if (digits.startsWith('44') && digits.length >= 12) digits = digits.slice(2);
  digits = digits.replace(/\D/g, '').replace(/^0+/, '');
  return digits ? `0${digits}` : '';
}

/** Whether they typed a country code we'll drop, to say so. */
export const typedCountryCode = (typed: string) => /^\s*(\+|00)\s*4\s*4/.test(typed);

/** A UK mobile: 07 and nine more digits. */
export const isUkMobile = (digits: string) => /^07\d{9}$/.test(digits);

/** 07700 900417. */
export const showUkNumber = (digits: string) => (digits.length === 11 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits);

/* ---------------------------------------------------------------- remembered on this phone */

export interface DoneFile {
  who: Particulars;
  /** The mugshot as a small JPEG data URL. */
  photo: string | null;
}

const KEY = 'booking-done';

export function loadDone(): DoneFile | null {
  try {
    const saved = localStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as DoneFile) : null;
  } catch {
    return null;
  }
}

export function saveDone(file: DoneFile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(file));
  } catch {
    /* private mode or full: they'd just be booked again next time */
  }
}

export function forgetDone() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing kept to forget */
  }
}

/**
 * The photo shrunk to a small JPEG (360px on its long side) as a data URL, so it can be remembered and outlives the
 * camera's object URL. Falls back to the original if the browser can't draw it.
 */
export function shrinkPhoto(url: string, longSide = 360): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, longSide / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}
