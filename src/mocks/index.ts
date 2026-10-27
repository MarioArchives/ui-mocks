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
    id: 'tour',
    title: 'The torch tour',
    blurb: 'The new player’s walkthrough: take the tour from the tag on the sealed case file, and a torch lights a specimen night one thing at a time, twelve stops from group missions to the police.',
    game: 'Mystery Pub Crawl',
    backdrop: '#0d0e0f',
    load: () => import('./tour/Tour'),
  },
  {
    id: 'swipe',
    title: 'Swiping between screens · 5 looks',
    blurb: 'Missions, Log book and My file: drag sideways and the screens follow your finger, or tap a tab. Five ways for the move to look; switch with the pill at the top, and try Slow-mo.',
    game: 'Mystery Pub Crawl',
    backdrop: '#0d0e0f',
    load: () => import('./swipe/Swipe'),
  },
];
