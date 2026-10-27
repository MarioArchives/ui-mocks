# UI mocks

Phone-first UI mocks for [Quest-Game](https://github.com/MarioArchives/Quest-Game): try a screen in your hand before it
is built into the game. Each mock is a plain front-end page with made-up data, no Firebase and no backend.

## Mocks

| Mock | Game | What to try |
|---|---|---|
| [The torch tour](https://marioarchives.github.io/ui-mocks/#/tour) (`#/tour`) | Mystery Pub Crawl | The new player's walkthrough while the case is still sealed, on the game's own screens: tap Take the tour on the tag tied on under the sealed case file's wax seal, and the tabs fill with a specimen night (the game's demo, as Maya), dark but for a torch on one thing at a time and a kraft tag on twine saying what it does (turned over above it when there's no room below). Before the tour moves somewhere else, a red-pen arrow points at what you'd tap to get there (a folder tab, a tab at the foot, a face, a button) and the torch goes with it; nothing is drawn round what's lit. A progress bar and Skip sit at the foot. Thirteen stops across Missions (its Map and Standings too), Log book and My file, the standings and police explaining a trusted confidant and a person of interest without numbers: Next and Back on the tag, ← → on a keyboard, Escape or Skip to leave. Afterwards My file keeps "How tonight works": the whole tour again, or one part. `?stop=5` before the `#` opens that stop. |
| [Swiping between screens](https://marioarchives.github.io/ui-mocks/#/swipe) (`#/swipe`) | Mystery Pub Crawl | Drag sideways between Missions, Log book and My file (or tap a tab) in five looks: side by side, pulling the top sheet off a pile, turning the page, panning across the evidence board, and a torch beam. The screens follow your finger and spring back if you let go early; Slow-mo plays the settling four times slower. |

## On your phone

- **Published:** every push to `main` builds and publishes to GitHub Pages (see `.github/workflows/pages.yml`), at
  `https://marioarchives.github.io/ui-mocks/`. One-off setup: Settings › Pages › Source = "GitHub Actions".
- **From this machine, same Wi-Fi:** `npm run phone` starts the dev server on your network and prints a QR code. Scan
  it and edits hot-reload on the phone as you save.
- **Add to Home Screen** opens the mocks full screen, without the browser bars, which is closest to how the game feels.

## Commands

| Command | Use |
|---|---|
| `npm run phone` | Dev server on your network, plus a QR code to open it on a phone. |
| `npm run dev` | Dev server on http://localhost:5180 (also on your network). |
| `npm run typecheck` | TypeScript, silent on success. |
| `npm run build` | Static build in `dist/`; works from any host or sub-path (relative base, hash routing). |
| `npm run preview` | Serve the build on :5181. |

Node 24 (`.nvmrc`). With nvm: `export PATH=~/.nvm/versions/node/v24.13.1/bin:$PATH`.

## Adding a mock

1. Make a folder `src/mocks/<id>/` whose default export is a full-screen component, with its own CSS.
2. Add it to `MOCKS` in `src/mocks/index.ts` (id, title, one-line blurb, game, backdrop colour).
3. It gets a row on the list and its own link, `#/<id>`. A small "‹ Mocks" pill in the top right leads back.

For a game's look, import its theme from `src/themes/` (`mystery.css` copies the mystery pack's tokens and fonts from
Quest-Game's `src/packs/mystery/theme.css`; keep them in step when the game's change). Use 16px or larger type in
inputs, or iPhones zoom in when you tap them.


## The torch tour's screens

The torch tour (`src/mocks/tour/`) doesn't draw the game's screens itself: they are snapshots of the real game, taken
from Quest-Game's in-memory demo by `scripts/snapshot-tour.mjs`, so they look exactly as the game does. The script
drives a headless Chrome (its own profile and port) through the demo as Maya, puts the game into each state the tour
shows (the case sealed two hours ahead; the specimen night's Missions, Map, Standings, Log book and My file; Alex's
file and Form 3 from the search to an upheld charge; a dismissed one), and keeps each screen's DOM and the game's CSS:

- `src/mocks/tour/snap/scenes.json`: each screen's app bar and page, its tab bar and what was over it, as HTML, with the
  elements the tour lights named (`data-tour="…"`, by the selectors in the script's `keep(…)` calls);
- `src/mocks/tour/snap/game.css`: the game's CSS, with `html`, `body` and `:root` renamed so it works in a shadow root;
- `public/tour-snap/`: the images, map tiles (© OpenStreetMap contributors) and clip stills the screens use, with a
  `CREDITS.md`.

The mock draws them in a shadow root (`Snapshot.tsx`), so the game's CSS and the mocks' never meet, and the tour's
torch, twine and tags on top. To refresh them after the game's look changes:

1. In Quest-Game, start the demo with the mystery pack: `VITE_GAME_PACK=mystery npm run mock -- --port 5180` (the
   script's default `--url` is http://localhost:5180/; this repo's `npm run dev` wants that port too, so give one of
   them another).
2. Here: `node scripts/snapshot-tour.mjs` (`--url <demo>`, `--keep-shots` to save what Chrome saw, `--size 360x640 --dry`
   to see the game at another size without writing). It takes about three minutes: the demo's timer has to run.
3. Restart `npm run dev` if it was running (Vite only notices a new folder in `public/` on start), and check the tour:
   a stop whose element moved in the game may need its names in `src/mocks/tour/stops.ts` or the script.