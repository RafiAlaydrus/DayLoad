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
| equipment | id, name | — |
| exercises | name, muscleGroup, equipmentIds, alternativeIds, howTo, isCustom | equipment, exercises |
| gyms | name, equipmentIds, isTemporary | equipment |
| timetable | dayOfWeek, muscleGroup, defaultGymId | gyms |
| sessions | date, gymId, muscleGroup, durationMin | gyms |
| sets | sessionId, exerciseId, reps, weightKg, order | sessions, exercises |
| settings | workoutMode, avoidIds, favoriteIds, weightUnit, lengthUnit | exercises |

Everything is stored in metric (kg, cm). The unit settings only change what is shown and typed. Units live in `settings`, not `profile`, because onboarding asks for height before a profile exists. Dark mode is fixed for v1, so there is no `darkMode` setting yet. The built-in "No equipment" gym has the id `no-equipment`.

The equipment list and built-in exercises ship as seed data on first launch. Export/import dumps all tables to one JSON file.

## Exercise library

Start with 40 to 60 built-in exercises, written as a JSON seed file. Each needs: name, muscle group, required equipment, one or more alternatives for the same muscle, and a short how-to (target muscles, form cues, common mistakes).

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

- [ ] How many hard days in a row before adaptive mode suggests rest?
- [ ] Exact exercise and set counts for 30, 45 and 60 minutes
- [ ] Is the bottom tab layout right, or should Hit the gym be its own tab?
