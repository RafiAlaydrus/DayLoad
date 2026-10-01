# DayLoad

A personal gym app for iPhone. It recommends what to train at whatever gym you are in, using the equipment that gym has, and it logs your sets, targets, records, plan and goals.

Everything stays on your phone (no account, no server). It is a web app that installs from Safari with Add to Home Screen and works offline.

## Use it

Open the app address in Safari on your iPhone, tap the Share button, then Add to Home Screen.

## Run it on your computer

```bash
npm install
npm run dev
```

Other commands: `npm test` (the automated tests), `npm run build` (a production build), `npm run lint`.

## Where things are

- `docs/dayload-spec.md`: what the app does and the rules behind it.
- `DESIGN.md`: how it looks.
- `docs/PROGRESS.md`: what is built, what was decided, and what is not verified yet.
- `CLAUDE.md`: working notes for the AI assistant that builds the app.

Built with React, Vite, TypeScript, Tailwind, Dexie (IndexedDB) and vite-plugin-pwa.
