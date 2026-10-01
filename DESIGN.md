# DayLoad Design Direction

Transcribed from `docs/ui/STYLE_GUIDE.md` (the approved visual design). The mockups in `docs/ui/screens/` are the reference for how it looks. The author of this direction is the product owner; this file only formats it. Nothing here is new direction, except the Dial line, which is marked.

Dial: ENERGY 2 / RHYTHM 2 / MOTION 2 (read from the style guide by the agent, not stated by the owner. Change it here if it is wrong.)

## Look

Dark, warm and minimal, taken from the logo: warm charcoal grounds, a taupe accent, off-white type and buttons. Soft, rounded shapes to match the curves in the logo mark. No gradients, no bright accent colors. Dark mode only for now.

## Why these choices (the owner's reasons, per antislop R-31)

- **Dark mode only for v1.** The brand comes from the logo's charcoal-to-taupe palette, and the app is used in gyms with harsh lighting. A light theme can come later.
- **Uppercase small section labels.** They separate data labels from values at a glance on small phone screens. Used only for small labels.
- **Lucide icons.** Consistent 2px round-cap strokes that match the logo's rounded line style.
- **Barlow Condensed.** Condensed bold numbers and titles give a gym-poster feel and fit big weights and timers on narrow phone screens.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| `bg` | `#1B1A17` | App background |
| `surface` | `#25231F` | Cards, tab bar, secondary buttons |
| `surface-2` | `#302D27` | Selected cards, completed set rows |
| `border` | `#3E3A33` | Card borders, dividers, inactive outlines |
| `accent` | `#6B655A` | Hero "Hit the gym" card, rest timer (taupe from the logo) |
| `ink` | `#F3EFE7` | Primary text, primary buttons, active states (the style guide calls this `text`) |
| `muted` | `#B3AC9F` | Secondary text, labels, inactive icons |

Primary buttons are `ink` background with `bg` colored text. Selected states use an `ink`-colored border or fill.

## Typography

Fonts from Google Fonts: Barlow Condensed (500, 600, 700) for display, Manrope (400 to 800) for everything else.

| Role | Font | Size / weight |
| --- | --- | --- |
| Hero title ("Hit the gym") | Barlow Condensed | 46px / 700 |
| Screen title | Barlow Condensed | 30 to 44px / 700, line-height about 1 |
| Big numbers (weight, timer) | Barlow Condensed | 28 to 44px / 700 |
| Section label | Manrope | 12px / 600, uppercase, 0.08em tracking, `muted` |
| Body | Manrope | 14 to 16px / 500 to 700 |
| Tab labels | Manrope | 11px / 500 (700 when active) |

## Shape and spacing

Screen padding 22px sides, content starts about 58px from the top (below the safe area). Cards: `surface`, 1px `border`, radius 22px, padding 18px. Hero card radius 28px. Pills and primary buttons are fully rounded. Chips and inner rows radius 14 to 16px. Vertical gap between sections 16 to 22px.

Touch targets at least 44px. Icons are 2px stroke outline icons with round caps (Lucide).

## Components

- **Bottom tab bar:** Home, Plan, Library, Gyms, Profile. 84px tall including safe area, `surface` background, top border, active tab in `ink`, inactive in `muted`.
- **Hero card:** `accent` background, large faded logo mark (22% opacity) bleeding off the bottom right, label + big title + white pill button.
- **Selectable option (gym, time):** `surface` with `border`; when selected, `surface-2` with an `ink`-colored border and a filled check circle.
- **Set row:** grid of set number, weight, reps, and a 44px round check button. Completed rows switch to `surface-2` with a filled check.
- **Progress bar:** segmented, one segment per exercise; done = `ink`, current = `muted`, upcoming = `border`.
- **Rest timer:** `accent` card pinned above the bottom button, big countdown in Barlow Condensed, "Skip rest" pill.

## Motion (Motion library)

The app should feel smooth and native. Use spring transitions for screen changes (slide + fade), a shared layout animation when the hero card expands into the Hit the gym screen, a quick scale-and-fill when a set is checked off, and a smooth countdown on the rest timer. Animate only transform and opacity, keep durations short (150 to 350ms), and respect `prefers-reduced-motion`.

## Working notes for building (agent-added, not direction)

Design Read: Reading this as: a personal gym tracker app for its owner, used one-handed on an iPhone in a bright gym, in a warm dark charcoal-and-taupe style with gym-poster condensed type, dial ENERGY 2 / RHYTHM 2 / MOTION 2.

- Focal point per screen: Home is the hero card, Profile is the weight card.
- Identity motif: the logo mark bleeding off the hero card, and Barlow Condensed for every big number.
- One accent: the taupe hero card. Nothing else uses `accent` on Home.
- Contrast: `muted` text on `accent` fails WCAG AA, so text on the hero card is `ink`.
- No red or other status colors exist in the palette. Errors are shown with an icon and words, on `surface-2`.
- Field outlines use `border`, which is subtle against `surface` (about 1.5:1). It matches the palette; a stronger outline (`muted`) is the fix if fields are hard to see in bright light.

One-line reasons for the choices the guide does not already explain (antislop R-31):

- Hero card is the only `accent` surface: it is the single most important action, so it is the one deliberate accent.
- Stat cards (BMI, height, age) are small and tight: they are secondary readouts, so they yield to the weight card.
- Forms open in a bottom sheet: the thumb reaches the bottom of the screen, and the page behind stays visible for context.
- The date field is the native iOS date picker: it is touch-friendly and needs no library.
- Screens slide 16px and fade in 300ms: it tells you which direction you moved, in transform and opacity only.
- Buttons and cards shrink to 97% while pressed: it confirms the tap landed on a screen with no hover.
- Placeholder screens say "Coming in a later phase": an honest empty page beats fake content.
- Equipment gets a small line drawing (`EquipmentIcon.tsx`): a person choosing a gym's gear has to know what "Hack squat" or "T-bar row" is, and a word alone does not tell them. They are drawn in the same 2px round-cap outline style as the Lucide icons, in one colour, so they read as part of the same family (antislop R-22 and R-04: an illustration with a stated purpose).
- Equipment is grouped under small uppercase headings in the owner's order (Free weights, Benches and racks, Bodyweight, Cable, Upper body machines, Lower body machines, Core and accessories): 40 tiles in one list is unreadable, and the groups match how a gym floor is laid out.
- The week strip on Home only marks days with a finished session: it is the one place "streak" data is real today, and it needs no plan or target number.
- Hit the gym and Workout hide the tab bar and pin one big button to the bottom (as in the mockups): mid-workout there is one next action, and it belongs under the thumb.
- The rest timer is the second `accent` surface, and it only exists during a rest: colour marks the one thing that is counting down.
- The Target row on the workout screen is the mockup's: a small `ink` label and one sentence. It sits above the sets because it is the number to beat, and the first set is filled in with it so following it is one tap per set.
- New records and Personal records are plain cards of name and result, no trophies or colour: a record is a number, and `ink` on `surface` is already the strongest contrast in the palette. Nothing new uses `accent`.
- The rest suggestion is a card, not a block: it says what was counted and the bottom button becomes "Train anyway", so the owner is always one tap from training.
- The Library's muscle filter is a grid of tiles with a body figure (`MuscleIcon.tsx`), like the equipment tiles: a word alone is a flat list of six chips, and a figure shows where the muscle is. The worked muscle is solid and the rest of the body is faint, flat shapes in the tile's one colour (no outline, because a muscle only reads as an area at this size). The Hit the gym chooser still uses plain chips.
- The calendar is bordered tiles straight on the page, not inside a card: a card's padding would squeeze the 7 columns under the 44px touch size on a 375px phone. Same tile look as the week strip on Home, with the day number in Barlow Condensed (it is the number you look for).
- A filled dot means done and a ring means planned: past and future read differently at a glance with one colour and no legend colours to learn. The legend under the grid says so in words. Today is the one filled tile (`ink`), as on the week strip.
- The panel under the calendar is a card, because it is the one place that lists things you can open. It gives the day in words so the dots never have to carry the meaning alone.
- The timetable is seven plain rows in one card, Monday first: it is a list you read down, so it is not a grid of tiles. The day sheet reuses the body-figure tiles and swaps "All" for a moon, the same way "Rest" is read as a day with nothing worked.
- The Adaptive note on the Plan tab is one short row with a Settings button: it only explains why the screen does not drive Hit the gym, so it must not push the calendar down the page.
- Measurement cards sit in the stat grid like the mockup's Waist card, with one muted line for the change (in words: "Down 2 cm since 10 Sep"), because a minus sign is easy to misread at a glance.
- Goals are a plain list with one thin `ink` bar each: the bar is the only progress element, and it is not animated because nothing about a saved number needs to move. The weight target is a dashed line on the chart, drawn lighter than the weight line, so it reads as a target and not a second series.
- Favorite (heart) and avoid (crossed circle) are the two marks on the exercise page, the Library rows and the Settings lists: the heart is the usual "like", and the crossed circle is the usual "not this one", so neither needs a legend.
