# DayLoad

A personal gym PWA that recommends what to train at whatever gym you are in, using the equipment that gym has. **iPhone only.** It is installed from Safari with Add to Home Screen. The owner does not write code: you do all setup, coding, testing and git. Ask when something is genuinely unclear, and do not invent features that are not in the spec.

## Read first

1. `docs/dayload-spec.md` is the full product spec (features, recommender rules, screens, data model, build phases).
2. `DESIGN.md` is the design direction (transcribed from `docs/ui/STYLE_GUIDE.md`).
3. `docs/ui/screens/*.html` are the approved mockups (Home, Hit the gym, Workout, Profile). Match them closely.
4. `docs/PROGRESS.md` is the progress log: what is done, decisions, open questions and what is unverified. **Update it at the end of every phase.**
5. The logo and all PWA icons are in `public/`. Do not regenerate or change them. The logo mark used in the UI is `src/components/LogoMark.tsx`.

## Phone only

- Portrait iPhone screens, 375 to 430px wide. No tablet or desktop layouts.
- On a wider screen (a laptop during development) the phone layout is centered at max 430px. Nothing else.
- Touch first: tap targets at least 44px, no hover-only interactions, no keyboard shortcuts needed.
- Respect safe areas with `env(safe-area-inset-*)` (notch, Dynamic Island, home bar). They are exposed as `--safe-top`, `--safe-bottom`, `--page-top` and `--tabbar-h` in `src/index.css`. Override `--safe-top` and `--safe-bottom` on `<html>` to test a notch in a desktop browser.
- Inputs are 16px or larger so iOS does not zoom. Never disable zoom.
- Test in an iPhone-sized viewport (390x844, also 375 and 430 wide).

## Stack

React 19 + Vite 8 + TypeScript (strict) · Tailwind CSS v4 (Vite plugin, tokens in `src/index.css`) · `motion` (import from `"motion/react"`) · Dexie + dexie-react-hooks (IndexedDB) · react-router-dom · lucide-react · vite-plugin-pwa · oxlint.

## Commands

```bash
npm run dev            # dev server (add -- --host to open it on a phone on the same Wi-Fi)
npm run build          # tsc -b && vite build (must finish with no errors or warnings)
npm run lint           # oxlint
npm test               # node --test tests/ (seed data, units, BMI, backup validation)
npm run preview        # serve the production build (this is where the service worker runs)
```

## Folder structure (`src/`)

| Folder | Holds |
| --- | --- |
| `db/` | Dexie database and versions (`db.ts`), first-launch seed (`seed.ts`), backup export/restore (`backup.ts`), workout writes: start, log a set, finish, discard (`sessions.ts`), favorite and avoid writes (`prefs.ts`) |
| `data/` | Seed JSON: `equipment.json` (the owner's 40 items in 7 groups), `exercises.json` (78 exercises) |
| `types/` | One shared types file for every table |
| `lib/` | Pure helpers: `recommend.ts` (the recommender, time plans, avoid and favorites), `progress.ts` (overload target, personal records), `adaptive.ts` (muscle group trained longest ago, rest streak), `calendar.ts` (month grid, which timetable row a date uses), `goals.ts` (the five measurements, goal progress, change since first), `streak.ts` (weekly streak), `warmup.ts` (warm-up text, ramp-up sets), `theme.ts` (which theme is in use), `migrate.ts` (data upgrades), `validate.ts`, `units.ts`, `bmi.ts`, `dates.ts`, `format.ts`, `backup.ts`. No DB access here, so they are testable in Node |
| `content/` | Written content that is not data: the Library guides (`guides.ts`) |
| `hooks/` | Live-query hooks over the database (`useHistory` is finished sessions plus their sets) |
| `components/ui/` | Small reusable pieces: Button, Card, BottomSheet, ConfirmDialog, Field, Select... |
| `components/` | App pieces: Shell, TabBar, LogoMark, WeightChart, ErrorBoundary, GymForm, EquipmentIcon (one drawing per equipment id), EquipmentTile, MuscleIcon and MuscleTiles (the body figures in the Library filter and the timetable day sheet), PlanCalendar and Timetable (the two views of the Plan tab), GoalsCard and GoalSheet, WarmUp, ThemeSync, SetRow, RestTimer, WeekStrip, HowTo... |
| `pages/` | One file per route |

Outside `src/`: `tests/` (Node's built-in test runner, plain `.mjs`, no test framework), `vercel.json` (sends every URL to `index.html` so deep links survive a reload), `.claude/launch.json` (dev and preview servers for the Claude Code browser pane).

Routes: `/` Home, `/hit-the-gym`, `/workout`, `/summary/:sessionId`, `/plan` (Calendar, or Timetable with `?view=timetable`), `/library` (Exercises, or Guides with `?view=guides`), `/library/:id`, `/library/guides/:id`, `/gyms`, `/profile`, `/profile/settings`, anything else shows Not Found. Hit the gym, Workout and Summary are focused screens: no tab bar, one big button pinned to the bottom (`BottomAction`).

## Key rules

- **The owner's decisions for Phase 2:** the muscle group is chosen each time on Hit the gym (a timetable row for today is used if one exists, but the editor is Phase 4); a session was 3, 5 or 6 exercises of 4 sets for 30, 45 or 60 minutes (replaced by the Phase 3 plans below); custom exercises are not built yet.
- **The owner's decisions for Phase 3** (details and numbers in the spec, "The numbers behind the rules"): overload is 8 reps on every set then +2.5 kg (5 lb); a PR is the heaviest weight (more reps at the same weight also counts; bodyweight is ranked by reps); adaptive mode suggests rest after 3 training days in a row; plans are 3x3, 4x4 and 5x4 (`PLAN_BY_TIME`); avoid and favorites are toggled on the exercise page and listed in Settings.
- **The owner's decisions for Phase 4** (details in the spec, "Planning, goals and measurements"): each weekday is one muscle group or Rest plus an optional default gym; the Plan tab is a Calendar (month grid, dot for trained, ring for planned, panel for the tapped day) and a Timetable editor; five optional measurements (waist, chest, hips, arm, thigh) entered with a weigh-in; one goal per thing with an optional deadline, a progress bar and a dashed target line on the weight chart (no on-pace forecast).
- **Build only the current phase.** Phases are in the spec. A screen from a later phase is an honest placeholder ("Coming in a later phase"); none exist right now. No fake numbers, names or content anywhere.
- **Store metric, show the user's units.** The database holds kg and cm. Convert only for display and input, through `src/lib/units.ts`. Units live in the `settings` table.
- **Every screen that shows data has loading, empty and error states.** Live queries return `undefined` while loading and throw on error (caught by `ErrorBoundary`), so "no data" must be `null` or `[]`. `DbGuard` in `Shell.tsx` opens the database explicitly, because Dexie's `liveQuery` silently swallows the error from a database that fails to open and the screen would stay on "Loading" forever.
- **Don't override a Tailwind utility with a second one** (for example `p-[14px]` on top of `p-[18px]`): which wins depends on generated CSS order, not class order. Give the component a prop (`Card compact`, `Button size`) instead.
- **Effects must not return a value.** `useEffect(() => fn(), [])` returns whatever `fn` returns and React treats it as a cleanup function. Use a block body.
- **Sheets and dialogs use `components/ui/BottomSheet.tsx`** (native `<dialog>`: focus trap, Escape, inert page). `ConfirmDialog` is built on it.
- **Both themes must work** (antislop R-34). Colours are tokens only: `bg-bg`, `text-ink`, `border-border` and so on, never a hex value in a component (the one exception is the sheet scrim, `bg-black/60`). The light palette is `:root[data-theme="light"]` in `src/index.css`, and `tests/polish.test.mjs` fails if any text pair in either palette is under 4.5:1. Never put `muted` text on `accent`. The theme is set on `<html data-theme>` by `ThemeSync` and by a tiny script in `index.html` that runs before the first paint; the choice is mirrored to `localStorage` for that script.
- **The owner's Phase 5 decisions** (details in the spec, "Polish"): streak is weeks in a row with 3+ workouts; the warm-up is text plus ramp-up sets from the target weight; rest suggestions work in both modes and show on Home; two guides (splits, warm-up); the theme is System (default), Light or Dark.
- **Rules over history are pure functions** in `lib/progress.ts` and `lib/adaptive.ts`, fed by `useHistory` and `useFinishedSessions`. A workout in progress is never history (its sets do not feed its own target or records). Change a rule there and in `tests/progress.test.mjs`, not in a page.
- **Seed data lives in the database after first launch.** `src/data/*.json` is copied in once (Dexie `populate`). Changing the JSON later does not update phones that already have the data. Do what data version 2 did: add a Dexie `version(n).upgrade()`, put the translation in a pure function in `lib/migrate.ts` (old ids to new ids, keep everything the user made), use it from both the upgrade and `restoreBackup` (old backup files), bump `BACKUP_VERSION`, and test it in `tests/migrate.test.mjs`.
- **Every equipment item needs a drawing and at least one exercise.** `npm test` checks both, and that the equipment list matches the owner's list exactly. Adding equipment therefore means adding exercises that use it, an entry in `EquipmentIcon.tsx`, and a data upgrade.
- **Workouts persist as they happen.** Each logged set is a database row the moment it is checked; the plan and position live on the session row. Never keep workout state only in React state. The rest timer and unlogged typing are the only things allowed to be lost.
- **Fixed bars go through a portal.** `BottomAction` renders into `document.body` because the page slide-in transforms its ancestor, and a fixed element inside a transformed ancestor is positioned against that ancestor.
- **`useLiveQuery` and raw IndexedDB writes:** live queries only refresh for writes made through Dexie. When testing by writing to IndexedDB directly, reload the page.
- **No dead controls.** A button either works or is visibly labeled as coming later, with a `// TODO` comment.
- **UI copy has no em dashes.** Use commas, periods, colons or parentheses.
- **Contrast:** text must pass WCAG AA (4.5:1). `muted` text is not allowed on `accent` (it fails). Use `ink`.
- **Animate only transform and opacity**, 150 to 350ms, and respect reduced motion (`MotionConfig reducedMotion="user"` is at the root).
- **antislop, usage mode DURING.** Apply `.claude/skills/antislop/SKILL.md` while building UI, and run its Delivery Gate at the end of each session with a PASS/FAIL report. Core file only: do not install other antislop skills and do not add an antislop pointer block.
- The exercise and equipment tags in `src/data/` drive the recommender. Any change must keep `npm test` green (it checks every id link, muscle-group coverage and bodyweight options).
- Commit messages: `chore:`, `feat:`, `fix:` prefixes. Commit when a phase works.

## Testing notes (Claude Code browser pane)

- Use `.claude/launch.json`: `dev` (5173), `dev-test` (5174, a different origin so it has its own IndexedDB and won't touch the owner's real data), `preview` (4173, the production build, the only place the service worker runs).
- `resize_window` to 390x844 (also 375x667 and 430x932). Reset to `desktop` when done.
- Click coordinates are in the screenshot's frame, which is 2x CSS pixels. Prefer clicking by `ref`.
- If the Claude window is not in front, the page reports `visibilityState: "hidden"` and `requestAnimationFrame` never fires, so Motion animations freeze (a new page stays at opacity 0, an exiting sheet never leaves the DOM). Take a screenshot to flush a frame, then read the DOM. Screenshots taken in that state can be stale; trust DOM reads.
- Synthetic Tab and Escape key presses are unreliable in the pane. Verify focus rings by calling `el.focus({ focusVisible: true })` and reading the computed outline. When the pane is not the focused window (`document.hasFocus()` is false), `:focus-visible` never matches for any control and every ring reads as `none`. Then check the compiled rules instead (`:focus-visible` and `.has-focus-visible\:outline-2:has(:focus-visible)` in `document.styleSheets`).
- Click a text input by its `textbox` ref from `read_page`, not the `find` result for its label (that is a screen-reader-only span and the click misses the box).
- A sheet that has closed stays in the DOM while the pane is hidden (its exit animation never runs), so a script that takes `document.querySelector('dialog[open]')` can grab the old one. Reload between sheet tests, or take a screenshot to flush a frame, and always confirm a save by reading the database.
- The production build's service worker serves the previous cached version on the first load after a rebuild, and the new one on the next load. Reload once before judging a `preview` check.
- To test the "System" theme, use `resize_window` with `colorScheme` and then take a screenshot before reading the page: media-query changes and page fades only run when a frame is drawn, so a read straight after looks stale.
- To test the light theme's status-bar strip, set `--safe-top: 47px` on `<html>` (see the notch note below).
- To seed workout history, write sessions and sets into IndexedDB directly on the `dev-test` origin and reload (see the live-query note above). Use real local dates (`todayKey()` style), because adaptive mode counts calendar days.
- The console buffer can accumulate old messages across navigations. For a trustworthy "no errors" reading, open a fresh tab (`tabs_create`), drive it with in-app navigation (`history.pushState` plus a `popstate` event) and read the console once at the end.
- To test a notch: set `--safe-top: 59px` and `--safe-bottom: 34px` on `<html>` (see `src/index.css`).

## Status

- Phase 1 (foundation) is built and verified: PWA, database and seed data, Home, Profile (onboarding, weight log and chart, BMI), Settings (units, export and import backup).
- Phase 2 (core loop) is built and verified: gyms with an equipment checklist (40 items, grouped, each with a drawing) and one-time locations, the exercise library with filters and how-to pages, Hit the gym, workout mode with set logging, rest timer, swap, skip, resume, and the session summary. Database is at version 2.
- Phase 3 (smart features) is built and verified: adaptive mode (Settings control, longest-ago muscle group, rest suggestion), progressive overload (Target row and a pre-filled first set), personal records (Profile card, "New records" on the summary), real time scaling, and avoid and favorites (exercise page, Library markers, Settings lists). No seed data or table changed, so the database is still at version 2 and `BACKUP_VERSION` is still 2. At the owner's request the Library's muscle filter also got body figures.
- Phase 4 (planning) is built and verified: the Plan tab (month calendar and weekly timetable editor), measurements on the weigh-in sheet and Profile, and goals with progress (Profile card, dashed target on the weight chart). Home and Hit the gym follow the timetable in Timetable mode. No table changed (the goal row gained optional `start` and `startDate`), so the database is still at version 2 and `BACKUP_VERSION` is still 2.
- Phase 5 (polish) is built and verified: a weekly streak on Home, a warm-up card (text plus ramp-up sets) on the first exercise, the rest-day suggestion in both modes plus a Home card, two Library guides (splits and warm-up), and a light theme (System, Light or Dark in Settings). `settings.theme` is a new optional field, so there is still no new database version (still 2, `BACKUP_VERSION` 2). All five phases of the spec are built.
- Not done and not in any phase: custom exercises, and deployment (the owner will create the GitHub repo and push it; guide them when asked, and do not push for them).
- Not verified on a real iPhone yet: the Web Share export sheet in a home-screen app, the iOS date picker, keyboard behavior with the bottom sheets and the workout set inputs, and how the equipment drawings look at real phone size. Check these first if the owner reports an iPhone-only problem.
