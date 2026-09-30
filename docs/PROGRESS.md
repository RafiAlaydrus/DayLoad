# DayLoad Progress

Last updated: 2026-09-30. Update this file at the end of every phase (what shipped, what was decided, what is still unverified).

## Where we are

| Phase | What the spec says | Status |
| --- | --- | --- |
| 1. Foundation | PWA setup, database, seed data, profile and weight log, export/import | **Done** (`5b068e8`) |
| 2. Core loop | Gyms with equipment, exercise library, Hit the gym, workout mode with logging | **Done** (`daea30b`) |
| 3. Smart features | Adaptive mode, progressive overload, PRs, time scaling, avoid and favorites | Not started |
| 4. Planning | Timetable editor, calendar, goals, BMI and measurements | Not started |
| 5. Polish | General guides, streaks, warm-ups, rest day suggestions, light theme | Not started |

Pulled forward: kg/lb and cm/ft-in units (Phase 1, planned for 5), BMI (Phase 1, planned for 4), a per-exercise how-to page (Phase 2), and Home's week strip (Phase 2).

## What works today

- **Install and offline:** installable from Safari (Add to Home Screen), opens offline, updates itself.
- **Profile:** two-step onboarding (age and height, then first weight), weight log with edit and delete, trend chart, BMI, height, age and sessions count.
- **Settings:** kg or lb, cm or ft/in (stored metric underneath), backup export via the iOS share sheet, validated import that replaces data only after confirmation. Older backup files are upgraded on import.
- **Gyms:** saved gyms with an equipment checklist (40 items in 7 groups, each with a drawing), one-time locations, and the built-in "No equipment" gym.
- **Library:** 78 exercises, filtered by muscle group and equipment, with a how-to page per exercise (equipment, form cues, common mistakes, alternatives).
- **Hit the gym:** pick a gym, 30/45/60 minutes and a muscle group. The recommender builds 3, 5 or 6 exercises the gym can support.
- **Workout:** set logging that copies values forward, undo, add set, rest timer (90 s), how-to sheet, swap, skip, end early, resume after the app is closed, and a session summary.
- **Home:** hero that starts or resumes a workout, a week strip of days trained, latest weight.

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
- 78 exercises, past the spec's 40 to 60, because every equipment item needs at least one exercise.
- Rest timer is 90 seconds, with no sound or vibration. A blank set weight means bodyweight.
- The equipment drawings are hand-drawn SVG by the agent.
- Validation limits: age 5 to 120, weight 20 to 400 kg, height 50 to 272 cm.
- The Dial line in `DESIGN.md` (ENERGY 2 / RHYTHM 2 / MOTION 2) is the agent's reading of the style guide.

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

## Known limits

- The screen may lock between sets (no wake lock).
- Field outlines are subtle (about 1.5:1 contrast) because they use the palette's `border` colour. If they are hard to see in gym light, use `muted`.
- Data lives only on the phone. Export a backup regularly.

## Checks that run automatically

`npm test` (30 tests): seed data integrity (every id link, bodyweight options, the owner's exact equipment list, every equipment item has an exercise and a drawing), the recommender, units, validation, backup import, and the data upgrade. `npm run build` must finish with no warnings and `npm run lint` must be clean.

## History

| Commit | What |
| --- | --- |
| `0c4283b` | Project setup |
| `5b068e8` | Phase 1: foundation |
| `daea30b` | Phase 2: core loop, plus the 40-item equipment list with drawings and data version 2 |
