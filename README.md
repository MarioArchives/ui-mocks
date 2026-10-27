# UI mocks

Phone-first UI mocks for [Quest-Game](https://github.com/MarioArchives/Quest-Game): try a screen in your hand before it
is built into the game. Each mock is a plain front-end page with made-up data, no Firebase and no backend.

## Mocks

| Mock | Game | What to try |
|---|---|---|
| [The torch tour](https://marioarchives.github.io/ui-mocks/#/tour) (`#/tour`) | Mystery Pub Crawl | The new player's walkthrough while the case is still sealed: tap Take the tour on the tag tied to the sealed case file, and the tabs fill with a made-up specimen night, dark but for a torch on one thing at a time and a kraft tag on twine saying what it does. Twelve stops across Missions, Log book and My file: Next and Back on the tag, ← → on a keyboard, Escape or End tour to leave. Afterwards My file keeps "How tonight works": the whole tour again, or one part. `?stop=5` before the `#` opens that stop. |
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
