# UI mocks: context for Claude

Phone-first UI mocks for Quest-Game (`~/projects/Quest-Game`, the game engine and its packs). A mock is a throwaway
front-end page with made-up data, so the user can feel a screen on their phone before it is built into the game.
**README.md** has the commands and how to add a mock.

- **Stack:** Vite + React + TypeScript, no router library (hash routes in `src/App.tsx`), no backend. Node 24 via nvm:
  prefix shell commands with `export PATH=~/.nvm/versions/node/v24.13.1/bin:$PATH`.
- **Publishing:** pushing to `main` deploys to GitHub Pages (`.github/workflows/pages.yml`). Ask before pushing unless
  the user just asked for it.
- **Looks:** a mock for a game uses that game's look. `src/themes/mystery.css` copies the mystery pack's tokens and
  fonts; screens borrow its kit (manila folders, stamps, the dark room of the sign-in). Show the user options before
  committing to a new look in the game itself; a mock *is* such an option.
- **Phone first:** check at about 360–430 px wide. 16px+ type in inputs (iOS zoom), `touch-action`/`user-select` off
  on press-and-hold controls, safe-area insets (`--safe-top`, `--safe-bottom`), `navigator.vibrate` only as a bonus
  (Android only).
- **Conventions:** match Quest-Game: ~140-column lines (don't run prettier), comments that say what a piece is for,
  CSS per mock with a short class prefix (`bk-` for the booking desk).
