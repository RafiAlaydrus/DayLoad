import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { GUIDES, guideById } from '../src/content/guides.ts'
import { addDays } from '../src/lib/dates.ts'
import { STREAK_MIN, weeklyStreak } from '../src/lib/streak.ts'
import { resolveTheme } from '../src/lib/theme.ts'
import { MUSCLE_GROUPS } from '../src/lib/recommend.ts'
import { rampUpSets, rampUpText, WARMUP } from '../src/lib/warmup.ts'

const on = (...dates) => dates.map((date) => ({ date }))

test('streak: weeks in a row with 3+ workouts, a week still running never breaks it', () => {
  assert.equal(STREAK_MIN, 3)
  const today = '2026-09-30' // a Wednesday, so this week started on Monday 28 September
  assert.deepEqual(weeklyStreak([], today), { weeks: 0, thisWeek: 0 })

  const lastTwoWeeks = on('2026-09-14', '2026-09-15', '2026-09-17', '2026-09-21', '2026-09-23', '2026-09-25')
  // this week only 1 workout so far: the streak is still the two finished weeks
  assert.deepEqual(weeklyStreak([...lastTwoWeeks, ...on('2026-09-28')], today), { weeks: 2, thisWeek: 1 })
  // this week reaches 3: it counts too
  assert.deepEqual(weeklyStreak([...lastTwoWeeks, ...on('2026-09-28', '2026-09-29', '2026-09-30')], today), { weeks: 3, thisWeek: 3 })
})

test('streak: a finished week with fewer than 3 breaks it, and a gap ends it', () => {
  const today = '2026-09-30'
  const short = on('2026-09-14', '2026-09-15', '2026-09-17', '2026-09-21', '2026-09-23') // last week has only 2
  assert.equal(weeklyStreak(short, today).weeks, 0)
  assert.equal(weeklyStreak([...short, ...on('2026-09-28', '2026-09-29', '2026-09-30')], today).weeks, 1)
  // an empty week in the middle ends the run
  const gap = on('2026-09-07', '2026-09-08', '2026-09-09', '2026-09-21', '2026-09-22', '2026-09-23')
  assert.equal(weeklyStreak(gap, today).weeks, 1)
})

test('streak: weeks run Monday to Sunday, across month and year ends', () => {
  // Sunday 4 October belongs to the week that began on Monday 28 September
  assert.deepEqual(weeklyStreak(on('2026-09-28', '2026-10-01', '2026-10-04'), '2026-10-04'), { weeks: 1, thisWeek: 3 })
  // 28 December 2026 to 3 January 2027 is one week
  assert.equal(weeklyStreak(on('2026-12-28', '2026-12-30', '2027-01-03'), '2027-01-03').weeks, 1)
  // two workouts every week for ten weeks is no streak at all
  const thin = Array.from({ length: 10 }, (_, w) => [addDays('2026-09-28', -7 * w), addDays('2026-09-28', -7 * w + 3)]).flat()
  assert.equal(weeklyStreak(on(...thin), '2026-09-30').weeks, 0)
  // the same weeks with a third workout each is a ten week streak
  const steady = Array.from({ length: 10 }, (_, w) => [0, 2, 4].map((d) => addDays('2026-09-28', -7 * w + d))).flat()
  assert.equal(weeklyStreak(on(...steady), '2026-09-30').weeks, 10)
})

test('ramp-up sets: about half for 8 then three quarters for 4, rounded to the step', () => {
  assert.deepEqual(rampUpSets(60, 'kg'), [{ weightKg: 30, reps: 8 }, { weightKg: 45, reps: 4 }])
  assert.deepEqual(rampUpSets(62.5, 'kg').map((s) => s.weightKg), [32.5, 47.5])
  assert.deepEqual(rampUpSets(20, 'kg').map((s) => s.weightKg), [10, 15])
  assert.equal(rampUpText(rampUpSets(60, 'kg'), 'kg'), '30 kg × 8, then 45 kg × 4')
  // in lb the step is 5 lb: 135 lb gives 70 and 100 lb
  assert.equal(rampUpText(rampUpSets(61.235, 'lb'), 'lb'), '70 lb × 8, then 100 lb × 4')
})

test('ramp-up sets: a very light lift gets fewer sets, bodyweight and zero get none, no set equals the working weight', () => {
  assert.deepEqual(rampUpSets(5, 'kg'), [{ weightKg: 2.5, reps: 8 }]) // three quarters rounds up to 5 kg, the working weight
  assert.deepEqual(rampUpSets(2.5, 'kg'), [])
  assert.deepEqual(rampUpSets(0, 'kg'), [])
  for (const kg of [5, 7.5, 10, 12.5, 40, 100, 182.5]) {
    const sets = rampUpSets(kg, 'kg')
    assert.ok(sets.every((s) => s.weightKg > 0 && s.weightKg < kg), `${kg}: a ramp set is not lighter`)
    assert.equal(new Set(sets.map((s) => s.weightKg)).size, sets.length, `${kg}: repeated weights`)
  }
})

test('warm-up text: every muscle group has a few lines, and none use an em dash', () => {
  for (const group of MUSCLE_GROUPS) {
    assert.ok(WARMUP[group].length >= 3, `${group} needs at least 3 lines`)
    assert.ok(WARMUP[group].every((line) => line.length > 10 && !line.includes('—')), `${group}: a bad line`)
  }
})

test('guides: unique ids, real sections, findable, and no em dashes', () => {
  assert.ok(GUIDES.length >= 2)
  assert.equal(new Set(GUIDES.map((g) => g.id)).size, GUIDES.length)
  assert.deepEqual(GUIDES.map((g) => g.id).slice(0, 2), ['splits', 'warm-up']) // the two the spec asks for
  for (const guide of GUIDES) {
    assert.ok(guide.title && guide.summary && guide.sections.length > 0, guide.id)
    for (const section of guide.sections) {
      assert.ok(section.heading, `${guide.id}: a section has no heading`)
      assert.ok((section.paragraphs?.length ?? 0) + (section.bullets?.length ?? 0) > 0, `${guide.id}/${section.heading} is empty`)
    }
  }
  assert.ok(!JSON.stringify(GUIDES).includes('—'))
  assert.equal(guideById('splits').title, 'Training splits')
  assert.equal(guideById('nope'), undefined)
})

test('theme: a fixed choice wins, "system" (or none) follows the phone', () => {
  assert.equal(resolveTheme('dark', true), 'dark')
  assert.equal(resolveTheme('light', false), 'light')
  assert.equal(resolveTheme('system', true), 'light')
  assert.equal(resolveTheme('system', false), 'dark')
  assert.equal(resolveTheme(undefined, true), 'light') // a row saved before the light theme existed
  assert.equal(resolveTheme(undefined, false), 'dark')
})

// --- Contrast in BOTH palettes, read from the real stylesheet (antislop R-25 and R-34) ---

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
const tokensIn = (block) => Object.fromEntries([...block.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]))
const dark = tokensIn(css.slice(css.indexOf('@theme'), css.indexOf('}', css.indexOf('@theme'))))
const lightStart = css.search(/:root\[data-theme=["']light["']\]\s*\{/)
const light = lightStart === -1 ? {} : tokensIn(css.slice(lightStart, css.indexOf('}', lightStart)))

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

// Every pair the app puts text on. Muted is never put on accent (it fails), so that pair is not listed.
const TEXT_PAIRS = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['ink', 'surface-2'],
  ['muted', 'bg'],
  ['muted', 'surface'],
  ['muted', 'surface-2'],
  ['ink', 'accent'], // the hero card and the rest timer
  ['bg', 'ink'], // the primary button and the Target label
]

test('theme: the light palette overrides every colour the dark one defines', () => {
  assert.ok(Object.keys(dark).length >= 7, 'dark tokens not found')
  assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort())
})

for (const [name, palette] of [['dark', dark], ['light', light]]) {
  test(`theme: every text pair in the ${name} palette passes WCAG AA (4.5:1)`, () => {
    for (const [fg, bg] of TEXT_PAIRS) {
      const ratio = contrast(palette[fg], palette[bg])
      assert.ok(ratio >= 4.5, `${name}: ${fg} on ${bg} is ${ratio.toFixed(2)}:1`)
    }
  })
}
