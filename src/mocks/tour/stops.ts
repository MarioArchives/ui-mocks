// The torch tour's thirteen stops, in order, and the five parts My file can start it at. Each stop names the tab it
// happens on, the game screen shown there (a snapshot from snap/scenes.json, see scripts/snapshot-tour.mjs), the
// elements the torch lights (by the data-tour names the snapshot stamped on them) and what the tag says. The words
// follow what the snapshots show (Maya's specimen night in the game's demo) and the mystery pack's settings: every move
// is worth 5, a verdict +1, the top entry +5, three charges a night and a 10-minute wait before charging the same
// suspect again. In the tag's text {heart} and {eye} draw the log book's two marks. A stop somewhere else says how to
// get there (`via`): the red pen points at what you'd tap, one hop at a time, before the tour moves on.

export type TabId = 'missions' | 'logbook' | 'file';
export const TABS: TabId[] = ['missions', 'logbook', 'file'];

/** The snapshots, by the names scripts/snapshot-tour.mjs keeps them under. */
export type SceneId =
  | 'missions'
  | 'map'
  | 'standings'
  | 'logbook'
  | 'file'
  | 'alex'
  | 'search'
  | 'terms'
  | 'upheld'
  | 'wrong'
  | 'pre-missions'
  | 'pre-logbook'
  | 'pre-file';

/** What each tab shows before the case opens (and outside the tour), and on the specimen night when no stop is on it. */
export const SEALED: Record<TabId, SceneId> = { missions: 'pre-missions', logbook: 'pre-logbook', file: 'pre-file' };
export const SPECIMEN: Record<TabId, SceneId> = { missions: 'missions', logbook: 'logbook', file: 'file' };

/** The parts of the tour, as the strip under the SPECIMEN NIGHT badge lists them. */
export const SECTIONS = ['Missions', 'Map', 'Standings', 'Log book', 'My file', 'Accuse', 'Police'] as const;
export type Section = (typeof SECTIONS)[number];

/**
 * One hop on the way to a stop elsewhere: the thing you'd tap (a CSS selector in the game's snapshot, or a data-tour
 * name) and what the pen writes by it. It is pointed at on the screen being left, or on `at` when the hop is on a screen
 * between (Standings, on the way from My file to someone's file).
 */
export interface Hop {
  at?: { tab: TabId; scene: SceneId };
  target: string;
  label: string;
}

export interface Stop {
  tab: TabId;
  /** The game screen on that tab (with its sheet or toast, if it has one). */
  scene: SceneId;
  /** Without the screen's sheet or toast. */
  bare?: boolean;
  /** Which part of the tour it belongs to. */
  section: Section;
  /** How to get here from the stop before, when it's somewhere else. */
  via?: Hop[];
  /** The tag's heading, in type. */
  title: string;
  /** What the tag says, in handwriting. */
  text: string;
  /** The elements lit, as one box. */
  lit: string[];
  /** A smaller box to light instead when `lit` and the tag can't both fit on the screen. */
  core?: string[];
  /** Light this much above the element too: a folder's tab, or the screens moving over the tab bar. */
  growTop?: number;
  /** A wider tag, for a stop with more to say. */
  width?: number;
  /** A red-pen note over the lit part. */
  pen?: 'swipe';
  /** The pages edge over and back, to show the swipe. */
  peek?: boolean;
}

export const STOPS: Stop[] = [
  {
    tab: 'missions',
    scene: 'missions',
    section: 'Missions',
    title: 'Live now',
    text: 'What’s live sits in front. Roll call comes every hour: one photo or a comment within 15 min, or −5. Tap a tab behind to pull another forward.',
    lit: ['live'],
    width: 236,
  },
  {
    tab: 'missions',
    scene: 'missions',
    section: 'Missions',
    title: 'Group events and story',
    text: 'Group events drop at any time: everyone sends a photo, then yes or no on each. Most yeses wins +5; sit it out, −5. Story chapters open as the GM tells the case.',
    lit: ['events', 'story'],
    core: ['events'],
    width: 240,
  },
  {
    tab: 'missions',
    scene: 'map',
    section: 'Map',
    via: [{ target: '.tr-pane--missions .bd-tab:nth-child(2)', label: '→ the Map' }],
    title: 'Map',
    text: 'The route, one bar at a time: the GM reveals each stop as you go. Now and Next up top; the faces are players sharing where they are.',
    lit: ['strip', 'route'],
    core: ['route'],
  },
  {
    tab: 'missions',
    scene: 'standings',
    section: 'Standings',
    via: [{ target: '.tr-pane--missions .bd-tab:nth-child(3)', label: '→ Standings' }],
    title: 'Standings',
    text: 'Everyone’s score, from zero. Above +10 you’re trusted; below −10 you’re watched. Tap a face to open their file.',
    lit: ['st-top', 'st-row3'],
    core: ['st-top', 'st-row2'],
  },
  {
    tab: 'missions',
    scene: 'standings',
    section: 'Standings',
    title: 'Swipe between tabs',
    text: 'Swipe left or right to turn the page between Missions, Log book and My file. Or tap the tabs.',
    lit: ['tabbar'],
    growTop: 130,
    pen: 'swipe',
    peek: true,
  },
  {
    tab: 'logbook',
    scene: 'logbook',
    section: 'Log book',
    via: [{ target: '.tr-bar .tabbar__tab:nth-child(2)', label: '→ Log book' }],
    title: 'Log book',
    text: 'A {heart} or an {eye} on anyone else’s entry, one pick each. Counts show once you pick. After 30 min, with 3+ picks, the majority wins: +1 to its side. Most hearts less eyes is pinned on top: +5 to its player while it stays.',
    lit: ['top-card', 'entry-new'],
    core: ['entry-new'],
    width: 262,
  },
  {
    tab: 'file',
    scene: 'file',
    section: 'My file',
    via: [{ target: '.tr-bar .tabbar__tab:nth-child(3)', label: '→ My file' }],
    title: 'Your missions',
    text: 'Five secret ones. Done one? Submit it and name a witness: once they confirm, +5. Then destroy the evidence (+5) or frame someone (−5 to them).',
    lit: ['mission'],
    width: 232,
  },
  {
    tab: 'missions',
    scene: 'alex',
    section: 'Accuse',
    via: [
      { target: '.tr-bar .tabbar__tab:nth-child(1)', label: '→ Missions' },
      { at: { tab: 'missions', scene: 'missions' }, target: '.tr-pane--missions .bd-tab:nth-child(3)', label: '→ Standings' },
      { at: { tab: 'missions', scene: 'standings' }, target: '.tr-pane--missions .st__li[data-uid="demo-alex"] .st__face', label: '→ Alex’s file' },
    ],
    title: 'Accuse someone',
    text: 'Know what someone’s up to? Tap their face on Standings to open their file, then charge them on Form 3. Three charges a night.',
    lit: ['suspect-head', 'form3'],
    core: ['form3'],
  },
  {
    tab: 'missions',
    scene: 'search',
    section: 'Accuse',
    via: [{ target: '.tr-pane--missions [data-tour="form3"] .cs-btn', label: '→ type a charge' }],
    title: 'Name the mission',
    text: 'Type any word from the mission you think they’re on, then tap it. All 68 are in the book.',
    lit: ['cs-search', 'cs-hits'],
    core: ['cs-hits'],
  },
  {
    tab: 'missions',
    scene: 'terms',
    section: 'Accuse',
    via: [{ target: '.tr-over .cs-hit', label: '→ pick one' }],
    title: 'Sign and file',
    text: 'Read the terms, then hold the red button to file. A charge can’t be taken back.',
    lit: ['cs-terms', 'cs-file'],
    core: ['cs-sign', 'cs-file'],
  },
  {
    tab: 'missions',
    scene: 'upheld',
    section: 'Accuse',
    via: [{ target: '.tr-over .cs-hold', label: '→ hold to file' }],
    title: 'If you’re right',
    text: 'Upheld: you +5, Alex −5. Everyone sees it in the log book, and Alex is dealt a fresh mission.',
    lit: ['cs-upheld', 'cs-result'],
  },
  {
    tab: 'missions',
    scene: 'wrong',
    section: 'Accuse',
    title: 'If you’re wrong',
    text: 'Dismissed: you −5, and nobody’s told. Then wait 10 min to charge Alex again.',
    lit: ['form3'],
  },
  {
    tab: 'missions',
    scene: 'wrong',
    bare: true,
    section: 'Police',
    title: 'The police',
    text: 'Below −10 they ring you on Telegram every 30 min: answer in their chat. Above +10, this phone tips them off. Case updates land there too.',
    lit: ['.tr-pane--missions .appbar__score'],
  },
];

/** A part of the tour, as stop indexes (from and to, both included). */
export interface Part {
  label: string;
  from: number;
  to: number;
}

export const PARTS: Part[] = [
  { label: 'Missions', from: 0, to: 4 },
  { label: 'Log book', from: 5, to: 5 },
  { label: 'Your missions', from: 6, to: 6 },
  { label: 'Accusing', from: 7, to: 11 },
  { label: 'Police', from: 12, to: 12 },
];

/** How each tag hangs: a degree or so off straight, never the same way twice running. */
export const TILT = [-1, 1, -0.8, 1, 0.8, -0.8, 1, -1, 1, -1, 0.8, -0.8, -1.2];
