// Snapshots the real game's screens for the torch tour (src/mocks/tour). It drives a headless Chrome (its own profile
// and port, over the DevTools protocol) through Quest-Game's in-memory demo, `npm run mock` in ~/projects/Quest-Game
// with the mystery pack, signs in as Maya, puts the game into each state the tour shows, and keeps the app's DOM:
//
//   src/mocks/tour/snap/scenes.json  each screen: the app (app bar and page), its tab bar, overlays (a sheet, a toast)
//   src/mocks/tour/snap/game.css     the game's CSS, rewritten to live in a shadow root (html/body/:root → snap-*)
//   public/tour-snap/                images, map tiles and clips the screens point at
//
// The elements the tour lights are stamped with data-tour="…" as they are captured (the keep(…) calls below), so the
// mock finds them by name. Start the demo (in Quest-Game: VITE_GAME_PACK=mystery npm run mock -- --port 5180), then run
// this again whenever the game's look changes:
//
//   node scripts/snapshot-tour.mjs [--url http://localhost:5180/] [--scratch <dir>] [--keep-shots] [--size 390x844] [--dry]
//
// --scratch is where Chrome's throwaway profile goes (and, with --keep-shots, a screenshot of each screen as kept).
// --dry drives the demo without writing anything, to keep the game's own screenshots at another --size.
//
// Three sessions, since every reload resets the demo: the specimen night (Missions, Map, Standings, Log book, My file,
// Alex's file and Form 3 through to an upheld charge), a dismissed charge, and the case still sealed before it opens.
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SNAP = join(ROOT, 'src/mocks/tour/snap');
const ASSETS = join(ROOT, 'public/tour-snap');
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : fallback;
};
const BASE = arg('--url', 'http://localhost:5180/');
/** The phone the screens are kept on (the mock reflows them to any width; a map is re-centred). */
const [WIDTH, HEIGHT] = arg('--size', '390x844').split('x').map(Number);
/** Only drive the demo (with --keep-shots, to see the game at another size); write nothing into the mock. */
const DRY = process.argv.includes('--dry');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('·', ...a);

/* ---------------------------------------------------------------- the browser */

async function launch() {
  const port = 9300 + Math.floor(Math.random() * 600);
  const profile = mkdtempSync(join(arg('--scratch', tmpdir()), 'tour-snap-'));
  const chrome = spawn(
    'google-chrome',
    [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
      `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank',
    ],
    { stdio: 'ignore' },
  );
  let pages = [];
  for (let i = 0; i < 100 && !pages.length; i++) {
    try {
      pages = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).filter((t) => t.type === 'page');
    } catch {}
    if (!pages.length) await sleep(150);
  }
  if (!pages.length) throw new Error('Chrome did not start');
  const ws = new WebSocket(pages[0].webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const waiting = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m);
      waiting.delete(m.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const n = ++id;
      waiting.set(n, r);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
  const ev = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.error) throw new Error(r.error.message);
    if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 800));
    return r.result?.result?.value;
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: true });
  const mouse = async (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, buttons: type === 'mouseReleased' ? 0 : 1 });
  return {
    send,
    ev,
    mouse,
    goto: async (url, wait) => {
      await send('Page.navigate', { url });
      await sleep(wait);
    },
    type: (text) => send('Input.insertText', { text }),
    click: async (sel, text) => {
      const r = await ev(`(() => {
        const el = [...document.querySelectorAll(${JSON.stringify(sel)})].find((e) => ${text ? `e.textContent.includes(${JSON.stringify(text)})` : 'true'});
        if (!el) return false;
        el.click();
        return true;
      })()`);
      if (!r) log(`(no ${sel}${text ? ` "${text}"` : ''})`);
      return r;
    },
    shot: async (file) => {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(file, Buffer.from(r.result.data, 'base64'));
    },
    close: () => {
      try {
        ws.close();
      } catch {}
      chrome.kill();
      setTimeout(() => rmSync(profile, { recursive: true, force: true }), 1000);
    },
  };
}

/* ---------------------------------------------------------------- the demo's data */

/** Runs `body` in the page with the demo's backend (`be`), its store (`S`) and the Stamp class to hand. */
const withBackend = (body) => `(async () => {
  const names = performance.getEntriesByType('resource').map((e) => e.name);
  const { backend } = await import(names.find((n) => /\\/src\\/backend\\/index\\.ts/.test(n)));
  const { Stamp } = await import(names.find((n) => /\\/functions\\/src\\/shared\\/store\\/stamp\\.ts/.test(n)) ?? '/functions/src/shared/store/stamp.ts');
  const be = backend();
  const S = be.store;
  const all = async (path) => (await S.collection(path).get()).docs;
  const at = (min) => Stamp.fromMillis(Date.now() + min * 60000);
  ${body}
})()`;

/** The specimen night: the group 50 minutes into its second bar, whose page of the log book holds just three entries:
 * a fresh one nobody has stamped yet, one Maya has, and one old enough to have its verdict; everything else posted
 * since moves back to the first bar. And the next roll call due now. */
const SPECIMEN = withBackend(`
  await S.doc('stops/route-1').update({ startsAt: at(-110), endsAt: at(-50) });
  await S.doc('stops/route-2').update({ startsAt: at(-50) });
  await S.doc('stops/route-3').update({ startsAt: at(10) });
  const here = { 'approved-demo-sam-2': -4, 'entry-demo-sam-side': -15, 'approved-demo-priya-1': -41 };
  let back = -52;
  for (const f of await all('feed')) {
    if (f.id in here) continue;
    if (f.data().createdAt.toMillis() > Date.now() - 50 * 60000) await S.doc('feed/' + f.id).update({ createdAt: at(back--) });
  }
  for (const [id, min] of Object.entries(here)) await S.doc('feed/' + id).update({ createdAt: at(min), ...(min > -30 ? { verdict: null } : {}) });
  for (const p of await all('periodics')) await S.doc('periodics/' + p.id).update({ status: 'running', nextAt: at(-0.1) });
  return 'ok';
`);

/** Tidies the log book once the timer has run: the standing changes the verdicts set off and the roll call's own post
 * would sit on top of the stop and push the entries down. */
const TIDY = withBackend(`
  let n = 0;
  for (const f of await all('feed')) {
    const t = f.data().type;
    if (t === 'standing' || (/^(checkin|periodic)/.test(t) && t !== 'checkin-answer')) { await S.doc('feed/' + f.id).delete(); n++; }
  }
  const verdicts = (await all('feed')).filter((f) => f.data().verdict).length;
  const checkins = (await all('checkins')).length;
  return { removed: n, verdicts, checkins };
`);

/** Before the case opens: a sealed file opening on the hour two hours or so ahead, nothing logged, nothing dealt, and
 * only the meeting point on the map. */
const SEALED = withBackend(`
  const d = new Date(Date.now() + 2 * 3600e3);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  await S.doc('game/state').update({ status: 'lobby', opensAt: Stamp.fromMillis(d.getTime()), startedAt: null });
  const wipe = ['globalQuests', 'checkins', 'policeCalls', 'submissions', 'rewards', 'pointsLedger', 'wraps', 'locations', 'assignments', 'facts'];
  for (const c of wipe) for (const x of await all(c)) await S.doc(c + '/' + x.id).delete();
  for (const f of await all('feed')) {
    for (const r of await all('feed/' + f.id + '/reactions')) await S.doc('feed/' + f.id + '/reactions/' + r.id).delete();
    await S.doc('feed/' + f.id).delete();
  }
  await S.doc('game/top').delete();
  for (const p of await all('players')) {
    for (const q of await all('players/' + p.id + '/quests')) await S.doc('players/' + p.id + '/quests/' + q.id).delete();
    await S.doc('players/' + p.id).update({ points: 0, questsCompleted: 0, rerollsUsed: 0 });
  }
  for (const s of await all('stops')) {
    const first = s.data().order === 1;
    await S.doc('stops/' + s.id).update({ revealed: first, startsAt: first ? Stamp.fromMillis(d.getTime()) : null, endsAt: null });
  }
  return d.toString();
`);

/* ---------------------------------------------------------------- capturing a screen */

/**
 * In the page: stamps the tour's names on the elements to light, then keeps the app (without its tab bar), the tab
 * bar and whatever hangs over them (a sheet, the toasts) as HTML. Inputs keep their values, fixed elements are marked
 * (the mock pins them to its own frame), a carousel remembers which card sat in its middle, a scrolling sheet is
 * marked as a scroller, live countdowns are marked to keep ticking, and every URL becomes a token for the script to
 * fetch. Leaflet's markers sit on transforms, which the tour's measuring ignores, so a map gets a plain box round its
 * markers instead (`box`).
 */
const CAPTURE = (opts) => `(async (opts) => {
  const missing = [];
  const stamped = [];
  const mark = (el, name) => { el.setAttribute('data-tour', name); stamped.push(el); };
  const added = [];
  if (opts.box) {
    const map = document.querySelector('.leaflet-container');
    const m = map.getBoundingClientRect();
    const rs = [...map.querySelectorAll(opts.box)].map((e) => e.getBoundingClientRect()).filter((r) => r.bottom > m.top && r.top < m.bottom && r.right > m.left && r.left < m.right);
    const x0 = Math.min(...rs.map((r) => r.left)) - m.left, x1 = Math.max(...rs.map((r) => r.right)) - m.left;
    const y0 = Math.min(...rs.map((r) => r.top)) - m.top, y1 = Math.max(...rs.map((r) => r.bottom)) - m.top;
    const box = document.createElement('div');
    box.setAttribute('data-tour', opts.boxName);
    box.className = 'snap-box';
    box.style.cssText = 'left: calc(' + Math.round(x0) + 'px + var(--snap-dx, 0px)); top: calc(' + Math.round(y0) + 'px + var(--snap-dy, 0px)); width: ' + Math.round(x1 - x0) + 'px; height: ' + Math.round(y1 - y0) + 'px';
    map.appendChild(box);
    added.push(box);
    map.setAttribute('data-snap-map', Math.round(m.width) + 'x' + Math.round(m.height));
    stamped.push(map);
  }

  const app = document.querySelector('#root > .app');
  const overlays = [...document.querySelectorAll('#root > :not(.app), body > :not(#root):not(script):not(style):not(noscript)')];
  const parts = [app, ...overlays];
  const touched = [];
  const set = (el, k, v) => { touched.push([el, k, el.getAttribute(k)]); el.setAttribute(k, v); };
  for (const part of parts) for (const el of [part, ...part.querySelectorAll('*')]) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed') set(el, 'data-snap-fixed', '');
    if (el.matches('input, textarea')) {
      if (el.type === 'checkbox' || el.type === 'radio') { if (el.checked) set(el, 'checked', ''); }
      else if (el.tagName === 'TEXTAREA') set(el, 'data-snap-value', el.value);
      else set(el, 'value', el.value);
    }
    if (/(auto|scroll)/.test(cs.overflowX) && el.scrollWidth > el.clientWidth + 2 && el.scrollLeft > 0) {
      const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
      const kids = [...el.children];
      const near = kids.reduce((best, k) => { const r = k.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); return !best || d < best.d ? { k, d } : best; }, null);
      if (near) set(near.k, 'data-snap-center', '');
    }
    if (part !== app && /(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 2) set(el, 'data-scroller', '');
    if (opts.count && [...el.childNodes].some((n) => n.nodeType === 3 && /^\\s*\\d{1,2}:\\d\\d:\\d\\d\\s*$/.test(n.textContent))) set(el, 'data-snap-count', '');
  }

  // Named after the marks above, so a name can pick the carousel's middle card ([data-snap-center]).
  for (const [name, sel, text] of opts.tags) {
    const el = [...document.querySelectorAll(sel)].find((e) => !text || e.textContent.includes(text));
    if (el) mark(el, name); else missing.push(name);
  }

  // Blob URLs (a photo from the demo's camera) become data URLs; the rest become tokens.
  const urls = [];
  const token = (u) => {
    if (!u || /^(data:|#|javascript:)/.test(u)) return u;
    const abs = new URL(u, location.href).href;
    let i = urls.indexOf(abs);
    if (i < 0) i = urls.push(abs) - 1;
    return '__SNAP_' + i + '__';
  };
  const blobs = new Map();
  for (const part of parts) for (const el of part.querySelectorAll('[src^="blob:"], [poster^="blob:"]')) {
    for (const k of ['src', 'poster']) {
      const u = el.getAttribute(k);
      if (u?.startsWith('blob:') && !blobs.has(u)) {
        const b = await (await fetch(u)).blob();
        blobs.set(u, await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(b); }));
      }
    }
  }
  const clean = (root) => {
    root.querySelectorAll('script, noscript, .skip-link').forEach((e) => e.remove());
    for (const el of [root, ...root.querySelectorAll('*')]) {
      for (const k of ['src', 'poster', 'href', 'xlink:href']) {
        const v = el.getAttribute(k);
        if (v == null) continue;
        if (blobs.has(v)) el.setAttribute(k, blobs.get(v));
        else if (k === 'href' && el.tagName === 'A') continue;
        else if (!(k === 'href' && v.startsWith('#'))) el.setAttribute(k, token(v));
      }
      if (el.hasAttribute('srcset')) el.removeAttribute('srcset');
      const st = el.getAttribute('style');
      if (st && st.includes('url(')) el.setAttribute('style', st.replace(/url\\((['"]?)([^'")]+)\\1\\)/g, (m, q, u) => 'url(' + q + token(u) + q + ')'));
      if (el.tagName === 'VIDEO') { el.removeAttribute('autoplay'); el.setAttribute('preload', 'none'); el.setAttribute('muted', ''); }
      if (el.hasAttribute('data-snap-value')) { el.textContent = el.getAttribute('data-snap-value'); el.removeAttribute('data-snap-value'); }
    }
    return root;
  };
  const appClone = clean(app.cloneNode(true));
  const bar = appClone.querySelector('nav.tabbar');
  const tabbar = bar ? bar.outerHTML : '';
  bar?.remove();
  const out = {
    appClass: app.className,
    app: appClone.innerHTML,
    tabbar,
    overlays: overlays.map((o) => clean(o.cloneNode(true)).outerHTML).filter((h) => h.length > 40),
    urls,
    missing,
    count: opts.count ? (() => { const el = document.querySelector('[data-snap-count]'); const m = el && el.textContent.match(/(\\d+):(\\d\\d):(\\d\\d)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : null; })() : null,
  };
  for (const [el, k, v] of touched.reverse()) v == null ? el.removeAttribute(k) : el.setAttribute(k, v);
  for (const el of stamped) { el.removeAttribute('data-tour'); el.removeAttribute('data-snap-map'); }
  added.forEach((e) => e.remove());
  return out;
})(${JSON.stringify(opts)})`;

/** The CSS on the page now: every <style> (Vite's dev server injects each file as one) by its file. */
const STYLES = `[...document.querySelectorAll('style')].map((s, i) => ({ id: s.getAttribute('data-vite-dev-id') || 'inline-' + i + '-' + s.textContent.length, text: s.textContent }))`;

/* ---------------------------------------------------------------- the sessions */

const scenes = {};
const styles = new Map();
const urls = new Set();

async function keep(b, id, opts) {
  await b.ev('scrollTo(0, 0)');
  await sleep(250);
  const s = await b.ev(CAPTURE({ tags: [], ...opts }));
  if (s.missing.length) log(`${id}: nothing for ${s.missing.join(', ')}`);
  s.urls.forEach((u) => urls.add(u));
  scenes[id] = s;
  for (const st of await b.ev(STYLES)) if (!styles.has(st.id)) styles.set(st.id, st.text);
  if (process.argv.includes('--keep-shots')) await b.shot(join(arg('--scratch', tmpdir()), `tour-snap-${id}.png`));
  log(`kept ${id} (${Math.round(s.app.length / 1024)} KB${s.overlays.length ? `, ${s.overlays.length} over it` : ''})`);
}

/** Signs in as Maya, sets the stage, and closes the vote and the reward that greet her. */
async function signIn(b, setup) {
  await b.goto(BASE, 3500);
  if (!(await b.click('button', 'Maya'))) throw new Error(`No sign-in screen at ${BASE}: is Quest-Game's npm run mock running?`);
  await sleep(1500);
  log('setup', JSON.stringify(await b.ev(setup)));
  await sleep(1500);
  await b.click('button', 'Back to the case');
  await sleep(600);
  await b.click('button', 'Keep it for later');
  await sleep(600);
}

/** Waits for the demo's timer (every 20 s) to hand out verdicts and send the roll call, then tidies the log book. */
async function letTheNightRun(b) {
  for (let i = 0; i < 12; i++) {
    await sleep(5000);
    const t = await b.ev(TIDY);
    if (t.verdicts >= 3 && t.checkins > 0) {
      await sleep(5000);
      log('night', JSON.stringify(await b.ev(TIDY)));
      return;
    }
  }
  log('the timer did not settle everything; carrying on');
}

const route = async (b, hash, wait = 2000) => {
  await b.ev(`location.hash = ${JSON.stringify(hash)}`);
  await sleep(wait);
};

/** Opens Form 3 on Alex's file and searches for "drink". */
async function chargeSearch(b) {
  await route(b, '#/player/demo-alex', 2500);
  await b.click('button', 'Type a charge');
  await sleep(1200);
  await b.ev(`document.querySelector('.cs-sheet input')?.focus()`);
  await b.type('drink');
  await sleep(1200);
}

async function pickCharge(b, title) {
  await b.ev(`[...document.querySelectorAll('.cs-hit')].find((e) => e.querySelector('b')?.textContent.trim() === ${JSON.stringify(title)})?.click()`);
  await sleep(1200);
}

async function fileCharge(b) {
  // The hold to file: a tap arms it, a second files it.
  await b.click('.cs-hold');
  await sleep(300);
  await b.click('.cs-hold');
  await sleep(2500);
}

async function specimenNight() {
  const b = await launch();
  try {
    await signIn(b, SPECIMEN);
    await letTheNightRun(b);

    await route(b, '#/');
    await keep(b, 'missions', {
      tags: [
        ['live', '.ms-stackwrap'],
        ['events', '.ms-sec', 'Group events'],
        ['story', '.ms-sec', 'Story missions'],
        ['rollcall', '.ms-sec', 'Periodic missions'],
        ['police', '.appbar__score'],
      ],
    });

    await route(b, '#/map', 3500);
    // Pull the map down so the route sits just under Now / Next, where the torch and its tag both fit.
    const m = await b.ev(`(() => { const r = document.querySelector('.leaflet-container').getBoundingClientRect(); const s = [...document.querySelectorAll('.fqpin--stop-next')][0].getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.6, next: s.top - r.top }; })()`);
    const lift = Math.round(m.next - 92);
    await b.mouse('mousePressed', m.x, m.y);
    for (let i = 1; i <= 10; i++) await b.mouse('mouseMoved', m.x, m.y - (lift * i) / 10);
    await b.mouse('mouseReleased', m.x, m.y - lift);
    await sleep(3000);
    await keep(b, 'map', {
      tags: [['strip', '.fqstrip']],
      box: '.fqpin--stop, .fqpin--player, .fqfoot, .fqpin__label, .fqlabel',
      boxName: 'route',
    });

    await route(b, '#/');
    await b.click('.bd-tab', 'Standings');
    await sleep(1500);
    await keep(b, 'standings', { tags: [['standings', '.st__rows'], ['st-top', '.st__top'], ['st-row2', '.st__li:nth-child(2)'], ['st-row3', '.st__li:nth-child(3)'], ['legend', '.st__legend']] });

    await b.ev(TIDY);
    await route(b, '#/feed', 2500);
    await keep(b, 'logbook', {
      tags: [
        ['top-card', '.lb-top'],
        ['entry-new', '.tl__chapter:not(.tl__shut) .cf-strung > li', 'Autograph'],
        ['entry-verdict', '.tl__chapter:not(.tl__shut) .cf-strung > li', 'Not my birthday'],
      ],
    });

    await route(b, '#/account', 2500);
    // Bring the first mission still to do into the middle of the carousel.
    await b.ev(`(() => {
      const t = document.querySelector('.ml-track');
      const it = [...t.querySelectorAll('.ml-item')].find((i) => i.querySelector('.ml-tag--open'));
      const tr = t.getBoundingClientRect();
      const r = it.getBoundingClientRect();
      t.scrollBy({ left: r.left + r.width / 2 - (tr.left + t.clientWidth / 2), behavior: 'instant' });
    })()`);
    await sleep(1200);
    await keep(b, 'file', { tags: [['mission', '[data-snap-center]'], ['witness', '.mf-witness']] });

    await route(b, '#/player/demo-alex', 2500);
    await keep(b, 'alex', { tags: [['suspect-head', '.mf-suspect'], ['form3', 'ul.pf-accuse', 'Form 3']] });

    await chargeSearch(b);
    await keep(b, 'search', { tags: [['cs-search', '.cs-sheet--search .cs-form'], ['cs-hits', '.cs-hits']] });
    await pickCharge(b, 'Cheers!');
    await keep(b, 'terms', { tags: [['cs-terms', '.cs-terms'], ['cs-sign', '.cs-sign'], ['cs-file', '.cs-hold']] });
    await fileCharge(b);
    await keep(b, 'upheld', { tags: [['cs-upheld', '.cs-stampwrap'], ['cs-result', '.cs-result'], ['cs-post', '.cs-post']] });
  } finally {
    b.close();
  }
}

async function wrongCharge() {
  const b = await launch();
  try {
    await signIn(b, SPECIMEN);
    await letTheNightRun(b);
    await chargeSearch(b);
    await pickCharge(b, 'Hold this');
    await fileCharge(b);
    await sleep(400);
    await keep(b, 'wrong', { tags: [['toast', '.toast'], ['form3', 'ul.pf-accuse', 'Form 3']] });
  } finally {
    b.close();
  }
}

async function sealed() {
  const b = await launch();
  try {
    await signIn(b, SEALED);
    await route(b, '#/', 2500);
    await keep(b, 'pre-missions', { tags: [['sealed', '.sf'], ['twine', '.sf__tw--h'], ['wax', '.wax']], count: true });
    await route(b, '#/feed', 2500);
    await keep(b, 'pre-logbook', { count: true });
    await route(b, '#/account', 2500);
    await keep(b, 'pre-file', { tags: [['suspect', '.mf-suspect']], count: true });
  } finally {
    b.close();
  }
}

/* ---------------------------------------------------------------- writing it out */

/** Where a fetched file goes in public/tour-snap/: the demo's clips and the map's tiles by name, the rest by a hash. */
function assetName(u, type) {
  const clip = u.match(/\/demo\/clips\/([\w.-]+)$/);
  if (clip) return `clips/${clip[1]}`;
  const tile = u.match(/tile\.openstreetmap\.org\/(\d+)\/(\d+)\/(\d+)\.png/);
  if (tile) return `tiles/${tile[1]}-${tile[2]}-${tile[3]}.png`;
  const ext = (u.match(/\.(png|jpe?g|svg|webp|gif|mp4|webm|woff2?)(?:[?#]|$)/i)?.[1] ?? { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'video/mp4': 'mp4' }[type.split(';')[0]] ?? 'bin').toLowerCase();
  return `${createHash('sha1').update(u).digest('hex').slice(0, 12)}.${ext}`;
}

/** Fetches every URL the screens use into public/tour-snap/, with a CREDITS.md for the clips and the map. */
async function fetchAssets() {
  rmSync(ASSETS, { recursive: true, force: true });
  const names = new Map();
  const clips = [];
  for (const u of urls) {
    const res = await fetch(u, { headers: { 'User-Agent': 'Quest-Mocks tour snapshot (a dozen tiles for a static mock)' } });
    if (!res.ok) {
      log(`couldn't fetch ${u}: ${res.status}`);
      names.set(u, u);
      continue;
    }
    const name = assetName(u, res.headers.get('content-type') ?? '');
    mkdirSync(dirname(join(ASSETS, name)), { recursive: true });
    writeFileSync(join(ASSETS, name), Buffer.from(await res.arrayBuffer()));
    names.set(u, `tour-snap/${name}`);
    if (name.startsWith('clips/')) clips.push(name.slice(6).replace(/\.\w+$/, ''));
  }
  // The clips keep their sources' licences: the demo's own credits, the rows for the clips used here.
  let rows = '';
  if (clips.length) {
    const credits = await fetch(new URL('demo/clips/CREDITS.md', BASE)).then((r) => (r.ok ? r.text() : ''), () => '');
    rows = credits.split('\n').filter((l) => clips.some((c) => l.includes(`\`${c}.`))).join('\n');
  }
  writeFileSync(
    join(ASSETS, 'CREDITS.md'),
    `# Torch tour snapshots\n\nFiles the game's screens use, fetched by scripts/snapshot-tour.mjs from Quest-Game's demo.\n\n` +
      `- \`tiles/\`: map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, ODbL, from tile.openstreetmap.org.\n` +
      (clips.length
        ? `- \`clips/\`: stills from the demo's clips (Quest-Game \`demo/clips/\`), each under its source's licence:\n\n| File | Source | Author | Licence |\n|---|---|---|---|\n${rows}\n`
        : ''),
  );
  return names;
}

const untoken = (s, list, names) => s.replace(/__SNAP_(\d+)__/g, (_, i) => names.get(list[+i]) ?? '');

/**
 * The game's CSS made to work inside a shadow root: html and :root become <snap-root>, body <snap-body> (selectors
 * only, never declarations), @font-face goes (fonts load at the page's top level, from the mock's own imports), and
 * url()s point at the fetched copies.
 */
function shadowCss(css, cssUrls) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let out = '';
  let from = 0;
  let depth = 0;
  let quote = null;
  let skip = -1;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (depth === 0 && (c === '{' || c === '}' || c === ';')) {
      let piece = css.slice(from, i + 1);
      if (c === '{') {
        const prelude = piece.slice(0, -1);
        const t = prelude.trim();
        if (t.startsWith('@font-face')) {
          skip = css.indexOf('}', i);
          i = skip;
          from = i + 1;
          continue;
        }
        if (!t.startsWith('@'))
          piece =
            prelude
              .replace(/:root\b/g, 'snap-root')
              .replace(/(^|[\s,>+~(])html(?![\w-])/g, '$1snap-root')
              .replace(/(^|[\s,>+~(])body(?![\w-])/g, '$1snap-body') + '{';
      }
      out += piece;
      from = i + 1;
    }
  }
  out += css.slice(from);
  return out.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => {
    if (/^(data:|#)/.test(u)) return m;
    const abs = new URL(u, BASE).href;
    cssUrls.add(abs);
    return `url(${q}__CSS_${abs}__${q})`;
  });
}

log(`snapshotting ${BASE} at ${WIDTH}×${HEIGHT}`);
await specimenNight();
await wrongCharge();
await sealed();
if (DRY) process.exit(0);
mkdirSync(SNAP, { recursive: true });

const cssUrls = new Set();
const fonts = new Set();
let css = '';
for (const [id, text] of styles) {
  for (const f of text.matchAll(/@font-face\s*{[^}]*font-family:\s*([^;]+);[^}]*?(?:font-weight:\s*([^;]+);)?[^}]*}/g)) fonts.add(`${f[1].trim()} ${f[2] ?? ''}`.trim());
  css += `/* ${id.replace(/^.*\/(src|node_modules)\//, '$1/')} */\n${shadowCss(text, cssUrls)}\n`;
}
cssUrls.forEach((u) => urls.add(u));
const names = await fetchAssets();
css = css.replace(/__CSS_(.+?)__/g, (_, u) => names.get(u) ?? u);
for (const s of Object.values(scenes)) {
  const list = s.urls;
  s.app = untoken(s.app, list, names);
  s.tabbar = untoken(s.tabbar, list, names);
  s.overlays = s.overlays.map((o) => untoken(o, list, names));
  delete s.urls;
  delete s.missing;
}
writeFileSync(join(SNAP, 'game.css'), css);
writeFileSync(join(SNAP, 'scenes.json'), JSON.stringify({ taken: new Date().toISOString(), width: WIDTH, scenes }, null, 0));
log(`fonts the game declares: ${[...fonts].join(', ')}`);
log(`wrote ${Object.keys(scenes).length} screens, ${Math.round(css.length / 1024)} KB of CSS and ${urls.size} files`);
