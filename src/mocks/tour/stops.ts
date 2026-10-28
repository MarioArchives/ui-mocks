// The torch tour's nineteen stops, in order, and the five parts My file can start it at. Each stop names the tab it
// happens on, the game screen shown there (a snapshot from snap/scenes.json, see scripts/snapshot-tour.mjs), the
// elements the torch lights (by the data-tour names the snapshot stamped on them) and what the tag says. The words
// follow what the snapshots show (Maya's specimen night in the game's demo), and every number in them comes from the
// settings the demo ran with (snap/rules.json, kept by the same script): the points, the verdicts' wait and quorum, the
// wait before charging the same suspect again. The lines for a trusted confidant and a person of interest go unnumbered
// (the GM moves them). In the tag's text {heart} and {eye} draw the log book's two marks. A stop somewhere else says how to get there (`via`): the
// red pen points at what you'd tap, one hop at a time, before the tour moves on.

import rulesJson from './snap/rules.json?raw';

/** The game's settings the tags' numbers come from. */
interface Rules {
  sideQuestSkipPenalty: number;
  verdictPoints: number;
  verdictWindowMin: number;
  verdictMinVotes: number;
  topEntryPoints: number;
  cleanPoints: number;
  framePoints: number;
  correctGuessReward: number;
  exposePenalty: number;
  wrongGuessCost: number;
  guessCooldownMin: number;
  policePassPoints: number;
  policeFailPenalty: number;
}

const R = JSON.parse(rulesJson) as Rules;
const plus = (n: number) => `+${n}`;
const minus = (n: number) => `−${n}`;

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
  | 'tip-pick'
  | 'tip-note'
  | 'tip-sent'
  | 'tip-logbook'
  | 'pre-missions'
  | 'pre-logbook'
  | 'pre-file';

/** What each tab shows before the case opens (and outside the tour), and on the specimen night when no stop is on it. */
export const SEALED: Record<TabId, SceneId> = { missions: 'pre-missions', logbook: 'pre-logbook', file: 'pre-file' };
export const SPECIMEN: Record<TabId, SceneId> = { missions: 'missions', logbook: 'logbook', file: 'file' };

/**
 * One hop on the way to a stop elsewhere: the thing you'd tap (a CSS selector in the game's snapshot, or a data-tour
 * name) and what a screen reader hears on the way. It is pointed at on the screen being left, or on `at` when the hop
 * is on a screen between (Standings, on the way from My file to someone's file). The torch always goes to it; the pen
 * draws its arrow unless `arrow` is false (where the arrow would only be a stub, the thing being right by the spot).
 */
export interface Hop {
  at?: { tab: TabId; scene: SceneId };
  target: string;
  label: string;
  arrow?: false;
}

export interface Stop {
  tab: TabId;
  /** The game screen on that tab (with its sheet or toast, if it has one). */
  scene: SceneId;
  /** Without the screen's sheet or toast. */
  bare?: boolean;
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
    title: 'Live now',
    text: `Tonight will have several events. Live events will appear here. If more than one is on, tap the tabs to switch between them. Submit your entry before the time is up, or it’s ${minus(R.sideQuestSkipPenalty)}.`,
    lit: ['live'],
    width: 240,
  },
  {
    tab: 'missions',
    scene: 'missions',
    title: 'Group events',
    text: 'Several kinds of event can be triggered. Group events involve voting for the best answer.',
    lit: ['events'],
  },
  {
    tab: 'missions',
    scene: 'missions',
    title: 'Periodic missions',
    text: 'Periodic missions are just a submission of some kind: a way for the police to keep track of you.',
    lit: ['rollcall'],
  },
  {
    tab: 'missions',
    scene: 'missions',
    title: 'Story missions',
    text: 'Story missions develop the plot of the murder. How they’re scored varies from mission to mission.',
    lit: ['story'],
  },
  {
    tab: 'missions',
    scene: 'map',
    via: [{ target: '.tr-pane--missions .bd-tab:nth-child(2)', label: 'the Map' }],
    title: 'Map',
    text: 'Here you can see how the pub crawl stands and where other players are: where the crawl is up to, and what’s next.',
    lit: ['strip', 'players'],
    core: ['strip'],
  },
  {
    tab: 'missions',
    scene: 'standings',
    via: [{ target: '.tr-pane--missions .bd-tab:nth-child(3)', label: 'Standings', arrow: false }],
    title: 'Standings',
    text: 'Everyone’s score, from zero: in the clear to the right, under suspicion to the left. Tap a face to open their file.',
    lit: ['st-top', 'st-row3'],
    core: ['st-top', 'st-row2'],
  },
  {
    tab: 'missions',
    scene: 'standings',
    title: 'Trusted or watched',
    text: 'How trusted or suspicious you are changes how the police treat you. Above the trusted confidant line, you can get the police to call others. Below the person of interest line, they call you now and then to check on you. Miss a police call and there’s a penalty; answer their questions right and there’s a reward.',
    width: 262,
    lit: ['legend'],
  },
  {
    tab: 'missions',
    scene: 'standings',
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
    via: [{ target: '.tr-bar .tabbar__tab:nth-child(2)', label: 'Log book' }],
    title: 'Log book',
    text: `React with a {heart} or an {eye} on log book updates. After ${R.verdictWindowMin} min, with at least ${R.verdictMinVotes} reactions, if you reacted the same as the majority you get ${plus(R.verdictPoints)} for good detective work! The post with the most {heart} gets ${plus(R.topEntryPoints)} for its author.`,
    lit: ['top-card', 'entry-new'],
    core: ['entry-new'],
    width: 262,
  },
  {
    tab: 'file',
    scene: 'file',
    via: [{ target: '.tr-bar .tabbar__tab:nth-child(3)', label: 'My file' }],
    title: 'Your missions',
    text: `Everyone also has secret tampering missions! Complete them to clear your name or frame someone else: ${plus(R.cleanPoints)} to you, or ${minus(R.framePoints)} to someone else. Done one? Submit it to another player for approval.`,
    lit: ['mission'],
    width: 240,
  },
  {
    tab: 'missions',
    scene: 'alex',
    via: [
      { target: '.tr-bar .tabbar__tab:nth-child(1)', label: 'Missions' },
      { at: { tab: 'missions', scene: 'missions' }, target: '.tr-pane--missions .bd-tab:nth-child(3)', label: 'Standings' },
      { at: { tab: 'missions', scene: 'standings' }, target: '.tr-pane--missions .st__li[data-uid="demo-alex"] .st__face', label: 'Alex’s file' },
    ],
    title: 'Press charges',
    text: 'Is someone doing their secret tampering mission blatantly? Press charges against them: fill out Form 3.',
    lit: ['suspect-head', 'form3'],
    core: ['form3'],
  },
  {
    tab: 'missions',
    scene: 'search',
    via: [{ target: '.tr-pane--missions [data-tour="form3"] .cs-btn', label: 'type a charge' }],
    title: 'Name the mission',
    text: 'Search for the tampering mission’s name in the charge section. Then tap the one you think it is!',
    lit: ['cs-search', 'cs-hits'],
    core: ['cs-hits'],
  },
  {
    tab: 'missions',
    scene: 'terms',
    via: [{ target: '.tr-over .cs-hit', label: 'pick one' }],
    title: 'Sign and file',
    text: 'Read the terms, then hold the red button to file. A charge can’t be taken back.',
    lit: ['cs-terms', 'cs-file'],
    core: ['cs-sign', 'cs-file'],
  },
  {
    tab: 'missions',
    scene: 'upheld',
    via: [{ target: '.tr-over .cs-hold', label: 'hold to file' }],
    title: 'Sustained or dropped',
    text: `${minus(R.exposePenalty)} to them${R.correctGuessReward > 0 ? ` and ${plus(R.correctGuessReward)} to you` : ''} if your charge is sustained, and ${minus(R.wrongGuessCost)} to you if it’s dropped.`,
    lit: ['cs-upheld', 'cs-result'],
  },
  {
    tab: 'missions',
    scene: 'wrong',
    title: 'If you’re wrong',
    text: `Dropped: you ${minus(R.wrongGuessCost)}, and nobody’s told. Then wait ${R.guessCooldownMin} min to charge Alex again.`,
    lit: ['form3'],
  },
  {
    tab: 'missions',
    scene: 'wrong',
    bare: true,
    title: 'The police',
    text: 'This phone is your line to the police. A person of interest gets rung on Telegram now and then: answer them in the chat. Case updates land there too.',
    width: 236,
    lit: ['.tr-pane--missions .appbar__score'],
  },
  {
    tab: 'missions',
    scene: 'tip-pick',
    via: [{ target: '.tr-pane--missions .tipline', label: 'the tip line' }],
    title: 'Tip them off',
    text: 'A trusted confidant’s phone lights up. Tap it and pick who to tip off.',
    lit: ['tip-pick'],
  },
  {
    tab: 'missions',
    scene: 'tip-note',
    via: [{ target: 'tip-alex', label: 'Alex' }],
    title: 'What they’ve been up to',
    text: `Say what you saw, then send. The police put it to them with a question: right, they gain ${R.policePassPoints}; wrong, they lose ${R.policeFailPenalty}.`,
    lit: ['tip-field', 'tip-send'],
    core: ['tip-field'],
  },
  {
    tab: 'logbook',
    scene: 'tip-logbook',
    bare: true,
    via: [
      { target: 'tip-send', label: 'send' },
      { at: { tab: 'missions', scene: 'tip-sent' }, target: '.tr-bar .tabbar__tab:nth-child(2)', label: 'Log book' },
    ],
    title: 'The police ring them',
    text: 'They get the call, and the log book names you and what you wrote. Your line rests a while after.',
    lit: ['tip-entry'],
  },
];

/** A part of the tour, as stop indexes (from and to, both included). */
export interface Part {
  label: string;
  from: number;
  to: number;
}

export const PARTS: Part[] = [
  { label: 'Missions', from: 0, to: 7 },
  { label: 'Log book', from: 8, to: 8 },
  { label: 'Your missions', from: 9, to: 9 },
  { label: 'Accusing', from: 10, to: 14 },
  { label: 'Police', from: 15, to: 18 },
];

/** How each tag hangs: a degree or so off straight, never the same way twice running. */
export const TILT = [-1, 1, -0.8, 1, -0.9, 0.8, -1, 0.9, -0.8, 1, -1, 1, -1, 0.8, -0.8, 1.1, -1.2, 0.9, -1];
