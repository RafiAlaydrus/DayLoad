# DayLoad Progress

Last updated: 2026-09-30. Update this file at the end of every phase (what shipped, what was decided, what is still unverified). A new session can start from `CLAUDE.md` plus this file.

## Where we are

| Phase | What the spec says | Status |
| --- | --- | --- |
| 1. Foundation | PWA setup, database, seed data, profile and weight log, export/import | **Done** (`5b068e8`) |
| 2. Core loop | Gyms with equipment, exercise library, Hit the gym, workout mode with logging | **Done** (`daea30b`) |
| 3. Smart features | Adaptive mode, progressive overload, PRs, time scaling, avoid and favorites | **Next. Not started.** |
| 4. Planning | Timetable editor, calendar, goals, BMI and measurements | Not started |
| 5. Polish | General guides, streaks, warm-ups, rest day suggestions, light theme | Not started |

Pulled forward: kg/lb and cm/ft-in units (Phase 1, planned for 5), BMI (Phase 1, planned for 4), a per-exercise how-to page (Phase 2), Home's week strip (Phase 2).

Size today: about 4,100 lines of TypeScript, 40 equipment items, 78 exercises, 30 automated tests, all passing.

## What works today

- **Install and offline:** installable from Safari (Add to Home Screen), opens offline, updates itself.
- **Profile:** two-step onboarding (age and height, then first weight), weight log with edit and delete, trend chart, BMI, height, age and sessions count.
- **Settings:** kg or lb, cm or ft/in (stored metric underneath), backup export via the iOS share sheet, validated import that replaces data only after confirmation. Older backup files are upgraded on import.
- **Gyms:** saved gyms with an equipment checklist (40 items in 7 groups, each with a drawing), one-time locations, and the built-in "No equipment" gym.
- **Library:** 78 exercises, filtered by muscle group and equipment, with a how-to page per exercise (equipment, form cues, common mistakes, alternatives).
- **Hit the gym:** pick a gym, 30/45/60 minutes and a muscle group. The recommender builds 3, 5 or 6 exercises the gym can support.
- **Workout:** set logging that copies values forward, undo, add set, rest timer (90 s), how-to sheet, swap, skip, end early, resume after the app is closed, and a session summary.
- **Home:** hero that starts or resumes a workout, a week strip of days trained, latest weight.
- **Plan tab:** still a placeholder ("Coming in a later phase").

## What we did, in order

### Setup
- Read the spec, style guide, four mockups and the antislop skill. Updated the spec to say iPhone only.
- Scaffolded Vite in a scratch folder and copied only config files in, so `docs/`, `public/` and `.claude/` were never touched.
- Stack: React 19, Vite 8, TypeScript 6 (strict), Tailwind v4 (Vite plugin, tokens in `src/index.css`), `motion`, Dexie and dexie-react-hooks, react-router-dom 7, lucide-react, vite-plugin-pwa, oxlint.
- Wrote `DESIGN.md` (transcribed from the style guide plus the owner's four reasons), `CLAUDE.md`, and a `.gitignore`. Commit `0c4283b`.

### Phase 1: foundation (`5b068e8`)
- Types and a 10-table Dexie database (versioned, indexed), seeded once on first launch (`populate`). `navigator.storage.persist()` on startup.
- Seed data: 21 equipment items and 60 exercises at that time (later replaced, see Phase 2), plus the "No equipment" gym.
- App shell: routes for every screen, bottom tab bar, slide-and-fade page transitions that respect reduced motion, press feedback, safe-area variables.
- Home, Profile (onboarding, weight log, chart, BMI) and Settings (units, backup). Loading, empty and error states on every screen.
- Pure helpers with tests: units, BMI, dates, form validation, backup validation.
- PWA verified on a production build: manifest, icons, service worker, precached shell, fonts cached, and the app opened with the server stopped.

### Phase 2: core loop (`daea30b`)
- Recommender (`lib/recommend.ts`): candidates are exercises whose equipment the gym has; equipment lifts first, bodyweight after; exercises that list each other as alternatives count as the same movement, so a first pass avoids near-duplicates. Same gym gives the same plan every time (good for overload later).
- Workout writes to the database as it happens (`db/sessions.ts`), so resuming after iOS closes the app loses nothing.
- Screens: Hit the gym, Workout, Session summary, Gyms, Library, exercise page. Home hero, week strip, and a Sessions card on Profile.

### Mid-session change: equipment list and drawings (also in `daea30b`)
- The owner supplied a 40-item, 7-group equipment list and asked for a drawing per item.
- Replaced the equipment list, added 18 exercises (so every item has one), drew 40 SVG line illustrations (six were redrawn after review).
- Database version 2 with an upgrade that refreshes the built-in lists and translates old gyms and custom exercises. The same translation runs when an old backup file is imported.
- Tested the upgrade three ways: on a real version-1 database, by importing an old-format backup file, and on the production build under the service worker.

### Docs
- `docs/PROGRESS.md` (this file). Spec, `DESIGN.md` and `CLAUDE.md` kept in step with the code.

## Bugs found by testing and fixed

Things a green build did not catch, found by running the app:

- A `useEffect` that returned `window.scrollTo(...)` made React treat the result as a cleanup function. Now a block body.
- BMI showed "33" instead of "33.0".
- Focus was lost after closing a sheet (the dialog was already gone when the cleanup ran). Now remembered explicitly.
- If the database cannot open, Dexie's `liveQuery` silently swallows the error, so screens sat on "Loading" forever. `DbGuard` in `Shell.tsx` now opens it explicitly and shows the error card, and "Try again" retries.
- Bottom sheets opened shifted up 68 px: the dialog was `overflow: hidden`, and the browser scrolled it to reveal a focused button while the panel was still sliding in. Now `overflow: clip`.
- Pinned bottom buttons would jump during the page slide-in (a fixed element inside a transformed ancestor). `BottomAction` now renders through a portal.
- The gym form's error appeared at the top while the Save button was at the bottom. Now focuses the invalid field.
- Set inputs were 42 px tall. Now 44 px.
- The summary showed "60.0 kg". Now "60 kg".
- A lint warning for `Date.now()` in a handler: moved into a helper.
- Sample-number placeholders in weight fields (antislop R-17) removed.
- Bundle-size warning: the big libraries are now separate chunks, which also makes updates smaller.
- Two Tailwind utilities on one element (for example two paddings) are decided by CSS order, not class order. Components now take props (`Card compact`, `Button size`) instead.

## How it fits together

- **Pages** (`src/pages`) read data with hooks (`src/hooks/useData.ts`, built on `useLiveQuery`) and write with small functions or direct Dexie calls in forms.
- **Live queries** return `undefined` while loading and throw on error (caught by `ErrorBoundary`), so "no data" is always `null` or `[]`.
- **`src/lib`** is pure logic with no database access, so Node tests can run it: `recommend`, `migrate`, `validate`, `units`, `bmi`, `dates`, `format`, `backup`.
- **`src/db`**: `db.ts` (tables and versions), `seed.ts`, `sessions.ts` (workout writes), `backup.ts` (export, restore).
- **Seed order matters:** IndexedDB returns rows sorted by id, so `sortBySeedOrder` and `sortEquipmentBySeedOrder` restore the JSON order the recommender and checklists rely on.
- **Equipment rules:** an adjustable bench counts as a flat bench and a cable crossover counts as a cable machine (`IMPLIES` in `lib/recommend.ts`).

### Data (database version 2)

Tables: profile, bodyLogs, goals, equipment (with `group`), exercises, gyms, timetable, sessions, sets, settings. Goals and timetable exist but nothing writes to them yet.

A session with no `finishedAt` is the workout in progress. It stores its plan (`exerciseIds`), position (`currentIndex`), `setsPerExercise`, `plannedMin`, and real `durationMin` when finished. A set stores `sessionId`, `exerciseId`, `reps`, `weightKg` and `order` (the set number within its exercise). Settings already holds `workoutMode`, `avoidIds`, `favoriteIds` and both units.

## Decisions

### Made by the owner
- Dark mode only for v1; Barlow Condensed and Manrope; Lucide icons; uppercase small labels (reasons in `DESIGN.md`).
- iPhone only, installed from Safari.
- Phase 2: the muscle group is chosen each time on Hit the gym (a timetable row for today is used if one exists).
- Phase 2: a session is 3, 5 or 6 exercises of 4 sets for 30, 45 or 60 minutes. Phase 3 replaces this with real time scaling.
- Phase 2: custom exercises are not built yet.
- The equipment list is the owner's 40 items in 7 groups, and each item gets a drawing.

### Made by the agent (change any of these)
- Units live in `settings`, not `profile`. Values are stored in kg and cm.
- Fonts come from Google Fonts with a runtime cache (offline after the first visit), instead of being self-hosted.
- An adjustable bench also counts as a flat bench; a cable crossover also counts as a cable machine.
- The old combined "Pec deck / rear delt machine" became two items. Old gyms that had it keep both.
- Gyms that had only "Cable machine" no longer get Seated Cable Row (it is its own item now); they get Straight-Arm Pulldown.
- 78 exercises, past the spec's 40 to 60, because every equipment item needs at least one exercise.
- Rest timer is 90 seconds, with no sound or vibration. A blank set weight means bodyweight.
- The equipment drawings are hand-drawn SVG by the agent.
- Validation limits: age 5 to 120, weight 20 to 400 kg, height 50 to 272 cm.
- The Dial line in `DESIGN.md` (ENERGY 2 / RHYTHM 2 / MOTION 2) is the agent's reading of the style guide.
- The Settings screen lives at `/profile/settings`; onboarding also links to it so a backup can be restored before a profile exists.

## Next: Phase 3 (smart features)

What the spec asks for, and what already exists to build on:

| Feature | Spec | Already in place |
| --- | --- | --- |
| Adaptive mode | Pick the muscle group trained longest ago; suggest rest after too many hard days | `settings.workoutMode` exists (default `timetable`); sessions record `muscleGroup` and `date`. No Settings control yet. |
| Progressive overload | Show the target from the last session ("last time 60 kg x 8, try 62.5 kg") | Sets are indexed by `exerciseId`. The Workout mockup has a "Target" row. Nothing reads history yet. |
| PRs | Show new PRs on the summary and a PR list on Profile | The Profile mockup has a "Personal records" card. Nothing computes PRs yet. |
| Time scaling | Fewer exercises and sets for 30 min, more for 60 | `PLAN_BY_TIME` in `lib/recommend.ts` is a fixed 3/5/6 x 4 placeholder. |
| Avoid and favorites | Remove avoided exercises, rank favorites higher | `settings.avoidIds` and `favoriteIds` exist and are empty. No controls yet. |

Questions to put to the owner before building (each has a sensible default):
1. Overload rule: when do we suggest more weight (all sets hit the reps? by how much, 2.5 kg?).
2. What counts as a PR: heaviest weight, best reps at a weight, or estimated one-rep max?
3. How many hard days in a row before adaptive mode suggests rest? (Open question in the spec.)
4. Real time scaling numbers for 30, 45 and 60 minutes.
5. Where do avoid and favorite toggles live (Library rows, exercise page, Settings)?

Rules to remember when building it:
- If exercise or equipment data changes, add a Dexie `version(3)` upgrade and a function in `lib/migrate.ts`, and test it. Never edit a released version.
- Keep workout state in the database, not only in React state.
- Any new equipment needs an exercise and a drawing (tests enforce this).

## Open questions

- How many hard days in a row before adaptive mode suggests rest? (Phase 3)
- Is the bottom tab layout right, or should Hit the gym be its own tab? (Still unanswered from the spec.)
- When should custom exercises be built?
- The timetable editor is Phase 4, so following a timetable is written but cannot be tried in the app yet.

## Not verified yet

- **On a real iPhone:** the share-sheet export in a home-screen app, the iOS date picker, keyboard behavior with the bottom sheets and the set inputs, and how the drawings look at real phone size. There is no Xcode on the dev Mac, so the iOS Simulator has never been used.
- Real Tab-key order (only focus rings, Esc and Enter were checked).
- "Today is chest day" and "Follows your timetable" (no way to create a timetable row until Phase 4).
- iOS launch splash: there are no startup images, so expect a brief blank screen on launch.
- Deployment: no git remote is set up in this repo, and it has not been deployed to Vercel from here. `vercel.json` (SPA fallback) is ready.

## Known limits

- The screen may lock between sets (no wake lock).
- Field outlines are subtle (about 1.5:1 contrast) because they use the palette's `border` colour. If they are hard to see in gym light, use `muted`.
- Some machine drawings look alike (chest press, shoulder press, rear delt); the name carries the meaning. The medicine ball reads a little like a basketball.
- Data lives only on the phone. Export a backup regularly.

## Environment and working notes

- **How the owner works:** they do not write code. They want a short summary, how to run it, decisions made, and the antislop Delivery Gate PASS/FAIL report at the end of each phase, and for the agent to stop after a phase. Ask when something is genuinely unclear (offer a recommended option); otherwise decide and flag it.
- **antislop:** core file only (`.claude/skills/antislop/SKILL.md`), usage mode DURING, no pointer block. No em dashes in any text. No gradients, glow or shadows.
- **Git:** the global git email is `ahmadalirgld@gmaiil.com` (double "i", probably a typo), so commits carry it. Fix with `git config --global user.email ahmadalirgld@gmail.com`. The commits are not pushed anywhere yet, so the author can still be rewritten.
- **Servers** (`.claude/launch.json`): `dev` on 5173 holds the owner's own test data, so do not test destructive things there. `dev-test` on 5174 is a separate origin with its own database, for the agent's testing. `preview` on 4173 serves the production build, the only place the service worker runs.
- **Browser pane quirks** are listed in `CLAUDE.md` under "Testing notes" (click coordinates are 2x, a hidden window freezes animations, the console buffer accumulates).
- No Xcode on this Mac, so no iOS Simulator.
- The empty `untitled folder` in the project root was there from the start and is untouched.

## Checks that run automatically

`npm test` (30 tests): seed data integrity (every id link, bodyweight options, the owner's exact equipment list, every equipment item has an exercise and a drawing), the recommender, units, validation, backup import, and the data upgrade. `npm run build` must finish with no warnings and `npm run lint` must be clean.

## How to resume

```bash
cd ~/Desktop/PROJECT/DayLoad
npm install
npm test
npm run build
npm run dev -- --host
```

On the iPhone (same Wi-Fi) open the "Network" address Vite prints. For the real PWA behavior (offline, install, share sheet) deploy to Vercel: push the repo to GitHub, import it in Vercel, and open the address in Safari, then Add to Home Screen. The data upgrade runs by itself the first time a phone opens a new version.

## History

| Commit | What |
| --- | --- |
| `0c4283b` | Project setup |
| `5b068e8` | Phase 1: foundation |
| `daea30b` | Phase 2: core loop, plus the 40-item equipment list with drawings and data version 2 |
| `efd35e4` | Progress log |
