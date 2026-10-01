# DayLoad — Full Spec

2026-09-30

## Overview

DayLoad is a personal gym app that tells you what to train at whatever gym you're in, using the equipment that gym actually has. It is an iPhone-only PWA, installed from Safari with Add to Home Screen. There are no tablet or desktop layouts: portrait iPhone screens only (375 to 430px wide). On a wider screen the phone layout is simply centered at a maximum of 430px.

Version 1 has no login and no backend. All data stays on the phone in IndexedDB; a JSON export/import covers backup and moving to a new phone. Supabase auth and sync can be added later without a rebuild. The code will be open source.

## Features

Everything agreed so far, grouped by area.

| Area | Features |
| --- | --- |
| Profile | Age, height, weight logged over time with a trend line, BMI, body measurements (waist, arms, etc.) |
| Goals | Target weight or measurement, progress shown against the trend |
| Plan | Weekly timetable (e.g. Monday = chest), calendar showing which day and gym lands on each date |
| Gyms | Saved locations with name and equipment checklist, one-time locations, built-in "No equipment" location |
| Hit the gym | Pick location and time available (30/45/60 min), get a recommended workout, option to train something else |
| Workout mode | One exercise at a time, rest timer, tap to log sets, reps and weight |
| History | Past sessions, personal records, progressive overload suggestions ("last time 60kg x 8, try 62.5kg") |
| Library | Exercises tagged by muscle group and equipment, how-to with form cues and common mistakes, custom exercises, general guides (splits, warm-up) |
| Settings | Workout mode (timetable or adaptive), avoid list, favorites, units (kg/lb, cm/ft), dark mode, export/import backup |
| Extras | Streaks, warm-up suggestion before each session, rest day suggestions |

## Recommender rules

The recommender picks a muscle group, then fills it with exercises the chosen gym can support.

1. Pick the target muscle group.
    - Timetable mode: use today's day in the weekly timetable.
    - Adaptive mode: pick the muscle group trained longest ago, based on logged sessions.
    - "Train something else" overrides either mode for that session.
2. Suggest rest if adaptive mode sees too many hard days in a row (threshold to be decided).
3. Build the candidate list: exercises for that muscle group whose required equipment the gym has.
4. Remove anything on the avoid list; rank favorites higher.
5. If a planned exercise isn't possible at this gym, swap to its alternative for the same muscle.
6. Scale to time available: fewer exercises and sets for 30 min, more for 60 min.
7. Add a warm-up suggestion at the start.
8. For each exercise, show the progressive overload target from the last logged session.

### The numbers behind the rules (the owner's Phase 3 decisions)

- **Rest (rule 2):** adaptive mode suggests a rest day after 3 days in a row with a finished workout (counted back from today, or from yesterday if today is not trained yet). "Hard day" means a finished session, because sets have no effort score. The suggestion can be overridden with "Train anyway".
- **Time (rule 6):** a set takes about 2.25 min counting the 90 s rest, and changing exercise about 2 min. 30 min is 3 exercises of 3 sets, 45 min is 4 of 4, 60 min is 5 of 4 (about 26, 44 and 55 min; the 60 min plan leaves room for the Phase 5 warm-up).
- **Overload (rule 8):** if every set last time reached 8 reps, the target is the same lift 2.5 kg heavier (5 lb in lb mode), for 8 reps. Otherwise repeat the weight and aim for 8 on every set. Bodyweight exercises aim for one more rep than the best set. The first set of an exercise starts filled in with the target.
- **Personal record:** the heaviest weight ever logged for an exercise, with more reps at the same weight also counting. Bodyweight sets (weight 0) are ranked by reps. The summary lists records that beat an earlier session; the first time an exercise is logged is a starting point, not a record.
- **Avoid and favorites (rule 4):** avoided exercises are never suggested and not offered as a swap. Favorites are picked first. An exercise cannot be both. They are set on the exercise page and listed in Settings.

## Screens and navigation

Home opens on the big "Hit the gym" button, with five bottom tabs for everything else. Proposed layout, open to change:

| Screen | What's on it |
| --- | --- |
| Home | Hit the gym button, today's plan, streak, latest weight |
| Hit the gym | Choose location (saved, new, or no equipment), choose time, start |
| Workout mode | Current exercise, how-to, overload target, set logger, rest timer, next/skip/swap |
| Session summary | What you did, new PRs, save |
| Plan tab | Weekly timetable editor, calendar view |
| Library tab | Exercise list with muscle and equipment filters, exercise detail, guides |
| Gyms tab | Saved gyms, equipment checklist editor |
| Profile tab | Stats, weight chart, measurements, goals, BMI, history, PRs |
| Settings | Workout mode, avoid, favorites, units, dark mode, backup |

## Data model

Ten IndexedDB tables via Dexie. The key link is equipment: exercises need it, gyms have it, and the recommender matches the two.

| Table | Main fields | Links to |
| --- | --- | --- |
| profile | age, heightCm | — |
| bodyLogs | date, weightKg, measurements | — |
| goals | type, target, deadline | — |
| equipment | id, name, group | — |
| exercises | name, muscleGroup, equipmentIds, alternativeIds, howTo, isCustom | equipment, exercises |
| gyms | name, equipmentIds, isTemporary | equipment |
| timetable | dayOfWeek, muscleGroup, defaultGymId | gyms |
| sessions | date, gymId, muscleGroup, plannedMin, durationMin, startedAt, finishedAt, exerciseIds, currentIndex, setsPerExercise | gyms, exercises |
| sets | sessionId, exerciseId, reps, weightKg, order (set number within its exercise) | sessions, exercises |
| settings | workoutMode, avoidIds, favoriteIds, weightUnit, lengthUnit | exercises |

Everything is stored in metric (kg, cm). The unit settings only change what is shown and typed. Units live in `settings`, not `profile`, because onboarding asks for height before a profile exists. Dark mode is fixed for v1, so there is no `darkMode` setting yet. The built-in "No equipment" gym has the id `no-equipment`.

A session with no `finishedAt` is the workout in progress. Its plan (`exerciseIds`) and position (`currentIndex`) are stored on the row and every logged set is written the moment it is checked off, so "Continue workout" resumes after iOS closes the app. `durationMin` is the real length, filled in when the session finishes; `plannedMin` is the time the user said they had.

The equipment list (40 items in 7 groups, each with a drawing) and the built-in exercises ship as seed data on first launch. Changing them later needs a database version with an upgrade, so phones that already have data are refreshed without losing anything (data version 2 did this). Export/import dumps all tables to one JSON file.

## Exercise library

Started with 40 to 60 built-in exercises, written as a JSON seed file. The owner's 40-item equipment list needs an exercise for every item, so there are now 78. Each needs: name, muscle group, required equipment, one or more alternatives for the same muscle, and a short how-to (target muscles, form cues, common mistakes).

Cover every muscle group in the timetable (chest, back, shoulders, arms, legs, core) with at least one bodyweight option each, so the "No equipment" location always works. Custom exercises use the same fields.

## Tech stack

Decided: React + Vite with TypeScript, Tailwind for styling, Motion for animations, Dexie (IndexedDB) for storage, vite-plugin-pwa for the service worker and manifest. Free hosting on Vercel or GitHub Pages, open source (MIT suggested).

Animation priority: the app should feel smooth and native, with page transitions, expanding cards, swipe gestures and spring physics. Animate only transform and opacity, keep animations short, and respect reduced motion settings.

## Build phases

Design the full app now, build in phases so a usable version lands on the phone early.

1. Foundation: PWA setup, database, seed data, profile and weight log, export/import.
2. Core loop: gyms with equipment, exercise library, Hit the gym in timetable mode, workout mode with logging.
3. Smart features: adaptive mode, progressive overload, PRs, time scaling, avoid and favorites.
4. Planning: timetable editor, calendar, goals, BMI and measurements.
5. Polish: how-to guides, streaks, warm-ups, rest day suggestions, dark mode, units.

## Open questions

- [x] How many hard days in a row before adaptive mode suggests rest? 3 days in a row (Phase 3).
- [x] Exact exercise and set counts for 30, 45 and 60 minutes: 3x3, 4x4 and 5x4 (exercises x sets), from a pace estimate (Phase 3). Phase 2 used 3, 5 and 6 exercises of 4 sets, which overran the time.
- [ ] Is the bottom tab layout right, or should Hit the gym be its own tab?
