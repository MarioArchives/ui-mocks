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
    blurb: 'After Google sign-in: fill in your particulars, then press and hold to have your prints taken.',
    game: 'Mystery Pub Crawl',
    backdrop: '#0d0e0f',
    load: () => import('./booking/Booking'),
  },
];
