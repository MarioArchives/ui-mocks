// The torch tour's twelve stops, in order, and the five parts My file can start it at. Each stop names the tab it
// happens on, what the specimen night shows there, the elements the torch lights (by their data-tour names) and what
// the tag says. The numbers are the mystery pack's settings: every move is worth 5, a verdict +1, three charges a
// night and a 10-minute wait before charging the same suspect again.

export type TabId = 'missions' | 'logbook' | 'file';
export const TABS: TabId[] = ['missions', 'logbook', 'file'];

/** What the specimen night shows under a stop. */
export interface Scene {
  /** The Missions folder's open tab. */
  folder?: 'missions' | 'standings';
  /** Priya's file, opened from Standings over the Missions folder, with Form 3 on it. */
  suspect?: boolean;
  /** Form 3's full-height sheet, at one of its steps. */
  sheet?: 'search' | 'terms' | 'upheld';
  /** A charge dismissed: struck through on her file, and the toast that says so. */
  wrong?: boolean;
  /** The screens edge sideways and back, to show the swipe. */
  peek?: boolean;
}

export interface Stop {
  tab: TabId;
  /** The tag's heading, in type. */
  title: string;
  /** What the tag says, in handwriting. */
  text: string;
  /** The elements lit, as one box. */
  lit: string[];
  /** A smaller box to light instead when `lit` and the tag can't both fit on the screen. */
  core?: string[];
  scene: Scene;
  /** Light this much above the element too: a folder's tab, or the screens moving over the tab bar. */
  growTop?: number;
  /** A wider tag, for a stop with more to say. */
  width?: number;
  /** A red-pen note over the lit part. */
  pen?: 'swipe';
}

export const STOPS: Stop[] = [
  {
    tab: 'missions',
    title: 'Group missions',
    text: 'Everyone sends a photo before the clock runs out. Then yes or no on each one. Most yeses: +5. Skip it: −5.',
    lit: ['live'],
    scene: { folder: 'missions' },
  },
  {
    tab: 'missions',
    title: 'Story and roll call',
    text: 'The GM opens story missions as the case unfolds. Roll call comes every hour: 15 min to answer, −5 if you miss it.',
    lit: ['story', 'rollcall'],
    core: ['story'],
    scene: { folder: 'missions' },
  },
  {
    tab: 'missions',
    title: 'Map and standings',
    text: 'Map: the route, one bar revealed at a time. Standings: above +10 you’re trusted, below −10 you’re watched. Tap a face to open their file.',
    lit: ['ftabs', 'standings'],
    core: ['standings'],
    scene: { folder: 'standings' },
  },
  {
    tab: 'missions',
    title: 'Swipe between tabs',
    text: 'Swipe left or right to move between Missions, Log book and My file. Or tap the tabs.',
    lit: ['tabbar'],
    growTop: 130,
    scene: { folder: 'missions', peek: true },
    pen: 'swipe',
  },
  {
    tab: 'logbook',
    title: 'Log book',
    text: 'Heart it if you believe it, eye it if you doubt it, or neither. You see the counts once you pick. After 30 min (3+ picks) the majority wins: side with it, +1. Most hearts minus eyes is pinned on top: +5 to its player while it stays.',
    lit: ['top-card', 'entry-new'],
    core: ['entry-new'],
    width: 258,
    scene: {},
  },
  {
    tab: 'file',
    title: 'Your missions',
    text: 'Five secret ones. Done one? Submit it and name a witness: confirmed, +5. Then destroy the evidence (+5) or frame someone (−5 to them).',
    lit: ['mission'],
    width: 230,
    scene: {},
  },
  {
    tab: 'missions',
    title: 'Accuse someone',
    text: 'Know what someone’s up to? Open their file: tap their face on Standings. Charge them on Form 3. Three charges a night.',
    lit: ['suspect-head', 'form3'],
    core: ['form3'],
    growTop: 26,
    scene: { suspect: true },
  },
  {
    tab: 'missions',
    title: 'Name the mission',
    text: 'Type any word from the mission you think they’re on, then tap it. You choose from the whole book of 68.',
    lit: ['cs-search'],
    core: ['cs-hits'],
    scene: { suspect: true, sheet: 'search' },
  },
  {
    tab: 'missions',
    title: 'Sign and file',
    text: 'Read the terms, sign, then hold the red button to file. A charge can’t be taken back.',
    lit: ['cs-terms'],
    core: ['cs-file'],
    scene: { suspect: true, sheet: 'terms' },
  },
  {
    tab: 'missions',
    title: 'If you’re right',
    text: 'Upheld: you +5, Priya −5. Her cover’s blown in the log book, and she’s dealt a fresh mission.',
    lit: ['cs-upheld'],
    scene: { suspect: true, sheet: 'upheld' },
  },
  {
    tab: 'missions',
    title: 'If you’re wrong',
    text: 'Dismissed: you −5, and nobody’s told. Then wait 10 min to charge Priya again.',
    lit: ['toast', 'form3'],
    core: ['form3'],
    scene: { suspect: true, wrong: true },
  },
  {
    tab: 'missions',
    title: 'The police',
    text: 'Below −10 they ring you on Telegram every 30 min: answer in their chat. Above +10, this phone tips them off. Case updates land there too.',
    lit: ['police'],
    scene: { folder: 'missions' },
  },
];

/** A part of the tour, as stop indexes (from and to, both included). */
export interface Part {
  label: string;
  from: number;
  to: number;
}

export const PARTS: Part[] = [
  { label: 'Missions', from: 0, to: 3 },
  { label: 'Log book', from: 4, to: 4 },
  { label: 'Your missions', from: 5, to: 5 },
  { label: 'Accusing', from: 6, to: 10 },
  { label: 'Police', from: 11, to: 11 },
];

/** How each tag hangs: a degree or so off straight, never the same way twice running. */
export const TILT = [-1, 1, -1, 0.8, -0.8, 1, -1, 1, -1, 0.8, -0.8, -1.2];
