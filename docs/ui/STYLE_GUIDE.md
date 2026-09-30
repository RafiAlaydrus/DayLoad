# DayLoad — UI Style Guide

Reference mockups are in `screens/` (open in a browser, 390×844 phone frame). Rebuild them as React + Tailwind components; don't copy the inline styles directly. The logo is `DayLoad_Logo.svg`.

## Look

Dark, warm and minimal, taken from the logo: warm charcoal grounds, a taupe accent, off-white type and buttons. Soft, rounded shapes to match the curves in the logo mark. No gradients, no bright accent colors. Dark mode only for now.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| `bg` | `#1B1A17` | App background |
| `surface` | `#25231F` | Cards, tab bar, secondary buttons |
| `surface-2` | `#302D27` | Selected cards, completed set rows |
| `border` | `#3E3A33` | Card borders, dividers, inactive outlines |
| `accent` | `#6B655A` | Hero "Hit the gym" card, rest timer (taupe from the logo) |
| `text` | `#F3EFE7` | Primary text, primary buttons, active states |
| `muted` | `#B3AC9F` | Secondary text, labels, inactive icons |

Primary buttons are `text` background with `bg` colored text. Selected states use a `text`-colored border or fill.

Suggested Tailwind config:

```js
colors: {
  bg: '#1B1A17',
  surface: '#25231F',
  'surface-2': '#302D27',
  border: '#3E3A33',
  accent: '#6B655A',
  ink: '#F3EFE7',
  muted: '#B3AC9F',
}
```

## Typography

Fonts from Google Fonts: Barlow Condensed (500, 600, 700) for display, Manrope (400–800) for everything else.

| Role | Font | Size / weight |
| --- | --- | --- |
| Hero title ("Hit the gym") | Barlow Condensed | 46px / 700 |
| Screen title | Barlow Condensed | 30–44px / 700, line-height ~1 |
| Big numbers (weight, timer) | Barlow Condensed | 28–44px / 700 |
| Section label | Manrope | 12px / 600, uppercase, 0.08em tracking, `muted` |
| Body | Manrope | 14–16px / 500–700 |
| Tab labels | Manrope | 11px / 500 (700 when active) |

## Shape and spacing

Screen padding 22px sides, content starts ~58px from top (below the safe area). Cards: `surface`, 1px `border`, radius 22px, padding 18px. Hero card radius 28px. Pills and primary buttons are fully rounded. Chips and inner rows radius 14–16px. Vertical gap between sections 16–22px.

Touch targets at least 44px. Icons are 2px stroke outline icons with round caps (Lucide matches well).

## Components

Bottom tab bar: Home, Plan, Library, Gyms, Profile. 84px tall incl. safe area, `surface` background, top border, active tab in `text`, inactive in `muted`.

Hero card: `accent` background, large faded logo mark (22% opacity) bleeding off the bottom right, label + big title + white pill button.

Selectable option (gym, time): `surface` with `border`; when selected, `surface-2` with a `text`-colored border and a filled check circle.

Set row: grid of set number, weight, reps, and a 44px round check button. Completed rows switch to `surface-2` with a filled check.

Progress bar: segmented, one segment per exercise; done = `text`, current = `muted`, upcoming = `border`.

Rest timer: `accent` card pinned above the bottom button, big countdown in Barlow Condensed, "Skip rest" pill.

## Motion (Motion library)

The app should feel smooth and native. Use spring transitions for screen changes (slide + fade), a shared layout animation when the hero card expands into the Hit the gym screen, a quick scale-and-fill when a set is checked off, and a smooth countdown on the rest timer. Animate only transform and opacity, keep durations short (150–350ms), and respect `prefers-reduced-motion`.
