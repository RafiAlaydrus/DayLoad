# DayLoad Progress

Last updated: 2026-10-01 (Phase 4). Update this file at the end of every phase (what shipped, what was decided, what is still unverified). A new session can start from `CLAUDE.md` plus this file.

## Where we are

| Phase | What the spec says | Status |
| --- | --- | --- |
| 1. Foundation | PWA setup, database, seed data, profile and weight log, export/import | **Done** (`5b068e8`) |
| 2. Core loop | Gyms with equipment, exercise library, Hit the gym, workout mode with logging | **Done** (`daea30b`) |
| 3. Smart features | Adaptive mode, progressive overload, PRs, time scaling, avoid and favorites | **Done** (`fba816a`) |
| 4. Planning | Timetable editor, calendar, goals, BMI and measurements | **Done** (this commit) |
| 5. Polish | General guides, streaks, warm-ups, rest day suggestions, light theme | **Next. Not started.** |

Pulled forward: kg/lb and cm/ft-in units (Phase 1, planned for 5), BMI (Phase 1, planned for 4), a per-exercise how-to page (Phase 2), Home's week strip (Phase 2). Added at the owner's request during Phase 3: body figures on the Library's muscle filter.

Size today: about 5,800 lines of TypeScript, 40 equipment items, 78 exercises, 57 automated tests, all passing.

## What works today

- **Install and offline:** installable from Safari (Add to Home Screen), opens offline, updates itself.
- **Profile:** two-step onboarding (age and height, then first weight), weight log with edit and delete, trend chart, BMI, height, age and sessions count.
- **Settings:** kg or lb, cm or ft/in (stored metric underneath), backup export via the iOS share sheet, validated import that replaces data only after confirmation. Older backup files are upgraded on import.
- **Gyms:** saved gyms with an equipment checklist (40 items in 7 groups, each with a drawing), one-time locations, and the built-in "No equipment" gym.
- **Library:** 78 exercises, filtered by muscle group and equipment, with a how-to page per exercise (equipment, form cues, common mistakes, alternatives).
- **Hit the gym:** pick a gym, 30/45/60 minutes and a muscle group. The recommender builds 3x3, 4x4 or 5x4 (exercises x sets) from what the gym can support, with favorites first and the avoid list left out. In adaptive mode the muscle group is chosen for you and a rest day is suggested after 3 training days in a row.
- **Workout:** set logging that copies values forward, undo, add set, rest timer (90 s), how-to sheet, swap (never offers an avoided exercise), skip, end early, resume after the app is closed, and a session summary. Each exercise shows a **Target** from the last time you did it, and its first set is filled in with it.
- **Summary:** now lists **new records** (sets that beat an earlier session).
- **Profile:** a **Personal records** card (best set per exercise, five shown, "Show all" for the rest). Cards for each **measurement** you have logged (with the change since the first entry), a **Goals** card, and a dashed **target line** on the weight chart.
- **Plan tab:** a **Calendar** (month grid, dot for a trained day, ring for a planned one, a panel for the tapped day with a link to its summary) and a **Timetable** (seven weekdays, each a muscle group or Rest plus an optional default gym). Hit the gym and Home follow the timetable in Timetable mode.
- **Weigh-in sheet:** five optional **measurements** (waist, chest, hips, arm, thigh), in cm or inches.
- **Library:** the muscle filter is a grid of tiles with body figures. Favorites and avoided exercises carry a small heart or crossed-circle mark. The exercise page has Favorite and Avoid toggles.
- **Settings:** Workout mode (Timetable or Adaptive), the Favorites and Avoid lists (each with a remove button), then units and backup as before.
- **Home:** hero that starts or resumes a workout, a week strip of days trained, latest weight.
- **Settings text:** the Timetable mode description now points at the Plan tab.

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

### Phase 3: smart features
- Asked the owner the five Phase 3 questions; every answer was the recommended option (see Decisions).
- Rules are pure functions with tests: overload target, personal records and new records (`lib/progress.ts`), the longest-ago muscle group and the rest streak (`lib/adaptive.ts`), time plans, avoid and favorites (`lib/recommend.ts`). 12 new tests (42 in total), including the Workout mockup's own example (60 kg x 8, try 62.5 kg).
- New hooks `useHistory` and `useFinishedSessions`; one write helper (`db/prefs.ts`, a single transaction so two quick taps cannot lose one).
- Screens changed: Workout (Target row, pre-filled first set, swap list), Summary (new records), Profile (records card), Hit the gym (adaptive, rest card, time plan, empty plan when everything is avoided), Settings (mode and lists), exercise page (toggles), Library (markers and body-figure filter).
- No seed data or table changed, so there is **no new Dexie version** and `BACKUP_VERSION` stays 2. Mode, avoid and favorites were already in `settings` and already in the backup validation, so they export and import with no change.
- Muscle filter figures (owner's request mid-session): a first pass of rectangles looked like a robot, so it was redrawn as a smooth silhouette with the worked muscle as its own shape (pecs split down the middle, abs in rows, legs apart, a spine gap on the back). Checked enlarged and at real size.
- Verified in the browser at 375 and 390 wide on `dev-test` with seeded history: every new control clicked, no target under 44 px, no horizontal overflow, console clean. 430 wide was not tried.

### Phase 4: planning
- Asked the owner four questions (measurements, goals, calendar, timetable days); every answer was the recommended option (see Decisions).
- New pure logic with 15 more tests (57 in total): the month grid and which timetable row a date uses (`lib/calendar.ts`), the five measurements, goal progress, change since first, remaining (`lib/goals.ts`), measurement and goal validation, and `daysBetween`, `weekdayName` and inch conversions. Also a test that goals, rest days and measurements pass backup validation as stored.
- New screens: `pages/Plan.tsx` (Calendar or Timetable, in the address as `?view=timetable`), `components/PlanCalendar.tsx`, `components/Timetable.tsx`, `components/GoalsCard.tsx` and `GoalSheet.tsx`. The weigh-in sheet gained its measurement fields, `MuscleTiles` can offer "Rest" instead of "All", and `ui/Select.tsx` is the Library's equipment picker pulled out so the timetable could reuse it.
- Deleting a gym now also clears it from any timetable day that named it, in one transaction (there is no index on the gym, so the seven rows are filtered in memory).
- Removed the unused `Placeholder` page. No screen is a placeholder any more.
- No table changed, so there is **no new Dexie version** and `BACKUP_VERSION` stays 2. A goal row gained two optional fields (`start`, `startDate`); goals written without them fall back to the first value logged.
- Verified in the browser on `dev-test` at 375 and 390 wide, in kg/cm and lb/ft-in, in Timetable and Adaptive mode: every control clicked and the result read back from the database (see the delivery report). Also run once on the production build under the service worker.

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

Phase 3, caught while building or testing:

- An interface named `Record` in `lib/progress.ts` would have hidden TypeScript's own `Record<K, V>` in the same file. Renamed to `PersonalRecord` before it compiled.
- The first muscle figures merged both legs into one block and both pecs into one pill. Redrawn with a gap down the middle.
- The rest-day sentence read badly ("after 3"). Reworded to say what was counted.
- Not a bug but a trap: `find` returns the screen-reader-only label of a set input, and clicking it misses the box. Click the `textbox` ref instead (noted in `CLAUDE.md`).

Phase 4, caught while building or testing:

- The first version of the gym-delete cleanup asked Dexie for `where('defaultGymId')`, but that field has no index (and adding one would need a new database version), so deleting a gym would have thrown. It now filters the seven timetable rows in memory.
- TypeScript caught that a measurement check can return "no value" on its error path, so saving needed an explicit guard.
- The linter flagged `new Date()` called while rendering the Timetable; it now goes through the date helpers.
- `GoalsCard` and `GoalSheet` imported each other. The shared `Units` type and `valueText` moved into `lib/goals.ts`.
- The Adaptive note on the Plan tab was a large card that pushed the calendar down the screen. It is now one short row with a Settings button.
- Test-script traps, not app bugs: closed sheets linger in the DOM while the pane is hidden, so scripts that grab "the open dialog" can act on the wrong one (one test run looked like a stuck save and was not). Noted in `CLAUDE.md`. After a rebuild, the production service worker shows the old version on the first load and the new one on the next.

## How it fits together

- **Pages** (`src/pages`) read data with hooks (`src/hooks/useData.ts`, built on `useLiveQuery`) and write with small functions or direct Dexie calls in forms.
- **Live queries** return `undefined` while loading and throw on error (caught by `ErrorBoundary`), so "no data" is always `null` or `[]`.
- **`src/lib`** is pure logic with no database access, so Node tests can run it: `recommend`, `migrate`, `validate`, `units`, `bmi`, `dates`, `format`, `backup`.
- **`src/db`**: `db.ts` (tables and versions), `seed.ts`, `sessions.ts` (workout writes), `backup.ts` (export, restore).
- **Seed order matters:** IndexedDB returns rows sorted by id, so `sortBySeedOrder` and `sortEquipmentBySeedOrder` restore the JSON order the recommender and checklists rely on.
- **Equipment rules:** an adjustable bench counts as a flat bench and a cable crossover counts as a cable machine (`IMPLIES` in `lib/recommend.ts`).

### Data (database version 2)

Tables: profile, bodyLogs, goals, equipment (with `group`), exercises, gyms, timetable, sessions, sets, settings. The Plan tab writes `timetable` (one row per weekday that was set; a null muscle group is Rest, a missing row is "not set"), and Profile writes `goals` and the `measurements` on `bodyLogs`.

A session with no `finishedAt` is the workout in progress. It stores its plan (`exerciseIds`), position (`currentIndex`), `setsPerExercise`, `plannedMin`, and real `durationMin` when finished. A set stores `sessionId`, `exerciseId`, `reps`, `weightKg` and `order` (the set number within its exercise). Settings already holds `workoutMode`, `avoidIds`, `favoriteIds` and both units.

## Decisions

### Made by the owner
- Dark mode only for v1; Barlow Condensed and Manrope; Lucide icons; uppercase small labels (reasons in `DESIGN.md`).
- iPhone only, installed from Safari.
- Phase 2: the muscle group is chosen each time on Hit the gym (a timetable row for today is used if one exists).
- Phase 2: a session is 3, 5 or 6 exercises of 4 sets for 30, 45 or 60 minutes. Phase 3 replaces this with real time scaling.
- Phase 2: custom exercises are not built yet.
- The equipment list is the owner's 40 items in 7 groups, and each item gets a drawing.
- Phase 3, all five questions answered with the recommended option: overload is "every set at 8 reps, then +2.5 kg (5 lb)"; a PR is the heaviest weight; adaptive rest after 3 training days in a row; plans 3x3, 4x4, 5x4; avoid and favorites on the exercise page plus lists in Settings.
- Phase 3: the Library's muscle filter gets body-figure illustrations (asked for mid-session).
- Phase 4, all four questions answered with the recommended option: five fixed measurements (waist, chest, hips, arm, thigh); one goal per thing with a progress bar and a chart line, no on-pace forecast; a month calendar with plan and history; each weekday is a muscle group or Rest plus a default gym.

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

### Made by the agent in Phase 3 (change any of these)
- **Overload details the owner did not specify:** the weight to build on is the heaviest set of last time; "every set reached 8" counts every logged set of that exercise (a short warm-up set would hold the weight back); bodyweight aims for the best set plus one rep; in lb mode the step is 5 lb, so a set logged in kg can show an odd lb value (15 kg is 33.1 lb, target 38.1 lb).
- **The first set of each exercise is pre-filled with the target** (weight and reps), so following it is one tap. Typing over it works as before. Not in the spec.
- **The first time an exercise is logged is not a record** (nothing to beat). It still appears in Personal records.
- **Records only count finished workouts.** A discarded or unfinished session feeds nothing.
- **Favorites go first in the plan, ahead of heavy compound lifts**, so a favorite isolation exercise can open a workout. "Rank higher" was read as "first". An exercise is never both favorite and avoided: marking one clears the other.
- **Avoided exercises are also hidden from the swap list.** If everything a muscle has at a gym is avoided, Hit the gym says so and links to Settings instead of building an empty workout.
- **Adaptive mode picks a never-trained muscle group first, in the order chest, back, shoulders, arms, legs, core.** A "day" is a calendar day with at least one finished session; two sessions in a day count once. The streak counts back from today if you trained today, otherwise from yesterday.
- **Rest is a suggestion**: a card, and the bottom button becomes "Train anyway". "Train something else?" still works in adaptive mode.
- **Default mode stays Timetable**, even though no timetable can be made until Phase 4 (so today you still choose the group each time). Switch to Adaptive in Settings to get a suggestion. You may want Adaptive as the default until Phase 4.
- **The plan card shows an estimate** ("4 sets each, about 44 min") worked out from the pace constants, not measured. It is labelled "about".
- **Personal records shows five exercises**, newest first, with "Show all".
- **Muscle figures are flat shapes, not outlines** (unlike the equipment drawings), and only the Library uses them. The Hit the gym chooser kept plain chips.

### Made by the agent in Phase 4 (change any of these)
- **Plan tab layout:** one tab with a Calendar | Timetable switch (the choice is in the address, `?view=timetable`), not two screens.
- **Default workout mode stays Timetable** for new installs, now that the editor exists. Existing phones keep whatever they chose in Settings.
- **The calendar marks a plan only for today and later, and only in Timetable mode.** Rest days and unset days have no mark. Past days show only what you did, plus "No workout logged". In Adaptive mode the calendar and timetable show a short note that they are not used for Hit the gym.
- **Two workouts on one day show one dot**, and both are listed in the panel.
- **Swiping the calendar** needs a sideways move of 60 px that stays mostly level. Changing month selects today (in the current month) or the 1st.
- **A measurement is saved with a weigh-in, never alone**, because every weigh-in row needs a weight. A second weigh-in on the same day is allowed and the newest one counts as the latest. Deleting a weigh-in also deletes its measurements, and the confirm says so.
- **Inches for ft/in users.** A waist in "2 ft 8 in" is not how anyone says it, so with the ft/in setting measurements are one number in inches. Stored in cm either way. Limits are 10 to 300 cm (4 to 118 in).
- **Goal rules:** at most one goal per thing. The start is your latest value when the goal is set, and editing keeps it. A target equal to where you are now is refused, a deadline must be after today, and you cannot set a goal for something you have never logged. Moving the wrong way shows 0%, and passing the target shows "Goal reached" (nothing is archived).
- **Editing a goal in lb or ft/in re-saves from a rounded value**, so a target stored in kg can shift by up to about 0.05 lb. Same behavior the weigh-in sheet already had.
- **Home's "Today is ..." line only shows in Timetable mode**, since Adaptive mode does not use the timetable.

## Next: Phase 5 (polish)

General guides (splits, warm-up), streaks, a warm-up suggestion before each session, rest-day suggestions, and a light theme (the spec's Phase 5). Things already in place: a rest-day suggestion in adaptive mode (Phase 3), the week strip on Home (a streak needs the same days), kg/lb and cm/ft-in units, and a fixed dark theme (a light theme needs both modes to work, per the antislop rule R-34).

Rules to remember when building it:
- If exercise or equipment data changes, add a Dexie `version(3)` upgrade and a function in `lib/migrate.ts`, and test it. Never edit a released version.
- Keep workout state in the database, not only in React state.
- Any new equipment needs an exercise and a drawing (tests enforce this).
- The 60 minute plan leaves about 5 minutes for the warm-up; a warm-up suggestion should fit in that.

## Open questions

- Is the bottom tab layout right, or should Hit the gym be its own tab? (Still unanswered from the spec.)
- When should custom exercises be built?
- Should the Hit the gym muscle chooser get the same body figures as the Library?
- Should a body measurement be loggable without a weight? Today it is saved with a weigh-in, because the weigh-in row requires a weight. Changing that means a data change (and a backup-format change).
- Should a past day that the timetable planned but you skipped be marked on the calendar? Today it is not.
- Overload at 8 reps jumps small isolation lifts by a lot (a 8 kg lateral raise would target 10.5 kg). Worth a smaller step per exercise type?

## Not verified yet

- **On a real iPhone:** the share-sheet export in a home-screen app, the iOS date picker, keyboard behavior with the bottom sheets and the set inputs, and how the drawings and body figures look at real phone size. There is no Xcode on the dev Mac, so the iOS Simulator has never been used.
- Real Tab-key order (only focus rings, Esc and Enter were checked).
- Phase 3 focus rings in the browser pane: the pane was not the focused window, so no control could show `:focus-visible`. The compiled rules and the shared class names were checked instead.
- A full workout in the production build under the service worker. The build loads, the service worker activates, the new screens open and the console is clean, but the workout flow itself was only run on the dev server.
- 430 px wide.
- Swiping the calendar with a real finger. The swipe was tested with synthetic touch events only (a long level swipe turns the month, a short or mostly vertical one does not).
- The iOS date picker for a goal deadline (an empty iOS date field has no clear button, so there is a "Clear deadline" link).
- The Plan tab in the production build was opened and one timetable day saved there, but the full calendar and goals flows were only run on the dev server.
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

`npm test` (57 tests): seed data integrity (every id link, bodyweight options, the owner's exact equipment list, every equipment item has an exercise and a drawing), the recommender (time plans, avoid, favorites, swaps), the Phase 3 rules (overload, records, adaptive group, rest streak), the Phase 4 rules (month grid, timetable lookup, measurements, goal progress, validation), units, backup import (including the new data shapes), and the data upgrade. `npm run build` must finish with no warnings and `npm run lint` must be clean.

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
| `fba816a` | Phase 3: adaptive mode, overload targets, records, time scaling, avoid and favorites, Library body figures |
| (this commit) | Phase 4: Plan tab (calendar and timetable), measurements, goals |
