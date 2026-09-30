# DayLoad

A personal gym PWA that recommends what to train at whatever gym you are in, using the equipment that gym has. **iPhone only.** It is installed from Safari with Add to Home Screen. The owner does not write code: you do all setup, coding, testing and git. Ask when something is genuinely unclear, and do not invent features that are not in the spec.

## Read first

1. `docs/dayload-spec.md` is the full product spec (features, recommender rules, screens, data model, build phases).
2. `DESIGN.md` is the design direction (transcribed from `docs/ui/STYLE_GUIDE.md`).
3. `docs/ui/screens/*.html` are the approved mockups (Home, Hit the gym, Workout, Profile). Match them closely.
4. The logo and all PWA icons are in `public/`. Do not regenerate or change them. The logo mark used in the UI is `src/components/LogoMark.tsx`.

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
| `db/` | Dexie database (`db.ts`), first-launch seed (`seed.ts`), backup export/restore (`backup.ts`) |
| `data/` | Seed JSON: `equipment.json`, `exercises.json` |
| `types/` | One shared types file for every table |
| `lib/` | Pure helpers: `units.ts`, `bmi.ts`, `dates.ts`, backup validation. No DB access here, so they are testable in Node |
| `hooks/` | Live-query hooks over the database |
| `components/ui/` | Small reusable pieces: Button, Card, BottomSheet, ConfirmDialog, Field... |
| `components/` | App pieces: Shell, TabBar, LogoMark, WeightChart, ErrorBoundary... |
| `pages/` | One file per route |

Outside `src/`: `tests/` (Node's built-in test runner, plain `.mjs`, no test framework), `vercel.json` (sends every URL to `index.html` so deep links survive a reload), `.claude/launch.json` (dev and preview servers for the Claude Code browser pane).

Routes: `/` Home, `/hit-the-gym`, `/workout`, `/summary`, `/plan`, `/library`, `/gyms`, `/profile`, `/profile/settings`, anything else shows Not Found. Only Home, Profile and Settings are built in Phase 1; the rest are `Placeholder`.

## Key rules

- **Build only the current phase.** Phases are in the spec. Later-phase screens are honest placeholders ("Coming in a later phase"). No fake numbers, names or content anywhere.
- **Store metric, show the user's units.** The database holds kg and cm. Convert only for display and input, through `src/lib/units.ts`. Units live in the `settings` table.
- **Every screen that shows data has loading, empty and error states.** Live queries return `undefined` while loading and throw on error (caught by `ErrorBoundary`), so "no data" must be `null` or `[]`. `DbGuard` in `Shell.tsx` opens the database explicitly, because Dexie's `liveQuery` silently swallows the error from a database that fails to open and the screen would stay on "Loading" forever.
- **Don't override a Tailwind utility with a second one** (for example `p-[14px]` on top of `p-[18px]`): which wins depends on generated CSS order, not class order. Give the component a prop (`Card compact`, `Button size`) instead.
- **Effects must not return a value.** `useEffect(() => fn(), [])` returns whatever `fn` returns and React treats it as a cleanup function. Use a block body.
- **Sheets and dialogs use `components/ui/BottomSheet.tsx`** (native `<dialog>`: focus trap, Escape, inert page). `ConfirmDialog` is built on it.
- **Seed data lives in the database after first launch.** `src/data/*.json` is copied in once (Dexie `populate`). Changing the JSON later does not update phones that already have the data; a Dexie `version(2).upgrade()` is needed for that.
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
- Synthetic Tab and Escape key presses are unreliable in the pane. Verify focus rings by calling `el.focus({ focusVisible: true })` and reading the computed outline.
- To test a notch: set `--safe-top: 59px` and `--safe-bottom: 34px` on `<html>` (see `src/index.css`).

## Status

- Phase 1 (foundation) is built and verified: PWA, database and seed data (21 equipment, 60 exercises, the "No equipment" gym), Home, Profile (onboarding, weight log and chart, BMI), Settings (units, export and import backup).
- Phase 2 (core loop) has **not** been started. Do not start it unless asked.
- Not verified on a real iPhone yet: the Web Share export sheet in a home-screen app, the iOS date picker, and keyboard behavior with the bottom sheets. Check these first if the owner reports an iPhone-only problem.
