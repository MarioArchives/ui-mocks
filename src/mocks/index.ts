// Every mock, in the order the list shows them. A mock is a folder under src/mocks/ whose default export is a
// full-screen component; add it here and it gets a row on the list and its own link (#/<id>).
import type { ComponentType } from 'react';

export interface Mock {
  id: string;
  title: string;
  /** One line on the list: where it sits in the game and what to try. */
  blurb: string;
  /** Which game (pack) it belongs to. */
  game: string;
  /** Background behind it while it loads, so the switch doesn't flash. */
  backdrop: string;
  load: () => Promise<{ default: ComponentType }>;
}

export const MOCKS: Mock[] = [
  {
    id: 'booking',
    title: 'Booking desk',
    blurb: 'From the sign-in screen: Google, the interview room, your particulars, a letter from the police, your prints, your mugshot, then the police’s number.',
    game: 'Mystery Pub Crawl',
    backdrop: '#0d0e0f',
    load: () => import('./booking/Booking'),
  },
  {
    id: 'landing',
    title: 'Landing page · 5 styles',
    blurb: 'Five takes on the sign-in page: tape, chalk outline and the case-file button, laid out differently. Arrows at the top, or swipe.',
    game: 'Mystery Pub Crawl',
    backdrop: '#0d0e0f',
    load: () => import('./landing/Landing'),
  },
  {
    id: 'stamp',
    title: 'Police stamp · 3 styles',
    blurb: 'Purple Manchester Metropolitan Police stamps with a bee at the centre, shown on the letter and up close. Arrows at the top, or swipe.',
    game: 'Mystery Pub Crawl',
    backdrop: '#0d0e0f',
    load: () => import('./stamp/StampOptions'),
  },
  {
    id: 'save-number',
    title: 'Save our number · 3 styles',
    blurb: 'Asks suspects to save the police’s number so they know when we ring. Flip between versions with the arrows at the top, or swipe.',
    game: 'Mystery Pub Crawl',
    backdrop: '#0d0e0f',
    load: () => import('./phone/SaveNumber'),
  },
];
