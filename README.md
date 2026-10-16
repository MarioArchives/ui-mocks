# UI mocks

Phone-first UI mocks for [Quest-Game](https://github.com/MarioArchives/Quest-Game): try a screen in your hand before it
is built into the game. Each mock is a plain front-end page with made-up data, no Firebase and no backend.

## Mocks

| Mock | Game | What to try |
|---|---|---|
| [Booking desk](https://marioarchives.github.io/ui-mocks/#/booking) (`#/booking`) | Mystery Pub Crawl | What a new player sees after signing in with Google: fill in your particulars on a manila booking sheet, then press and hold the livescan glass to have your "prints" taken (nothing is read; it only looks the part). Ends on your booked file, waiting for the GM. Android phones buzz along; iPhones don't support vibration from a web page. |

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
