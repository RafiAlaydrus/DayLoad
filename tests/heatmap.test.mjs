import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activityByDay, HEAT_WEEKS, heatLevel, heatWeeks, monthStarts } from '../src/lib/heatmap.ts'

test('heat levels: nothing, under 40 min, 40 to 59, 60 and more', () => {
  assert.deepEqual([0, 1, 39, 40, 59, 60, 200].map(heatLevel), [0, 1, 1, 2, 2, 3, 3])
})

test('activity per day: workout and cardio minutes add up, and anything logged counts for at least a minute', () => {
  const byDay = activityByDay(
    [{ date: '2026-10-01', durationMin: 45 }, { date: '2026-09-30', durationMin: 0 }],
    [{ date: '2026-10-01', minutes: 20 }, { date: '2026-09-29', minutes: 30 }],
  )
  assert.equal(byDay.get('2026-10-01'), 65)
  assert.equal(byDay.get('2026-09-30'), 1)
  assert.equal(byDay.get('2026-09-29'), 30)
  assert.equal(byDay.get('2026-09-28'), undefined)
})

test('heat grid: 18 columns of 7 days, Monday first, today in the last column, the rest of the week is future', () => {
  const grid = heatWeeks(new Map([['2026-10-01', 65]]), '2026-10-01') // a Thursday
  assert.equal(grid.length, HEAT_WEEKS)
  assert.ok(grid.every((c) => c.length === 7))
  assert.equal(grid.at(-1)[0].date, '2026-09-28') // Monday of this week
  assert.equal(grid[0][0].date, '2026-06-01') // 17 weeks earlier, also a Monday
  const last = grid.at(-1)
  assert.deepEqual(last.map((c) => c.today), [false, false, false, true, false, false, false])
  assert.deepEqual(last.map((c) => c.future), [false, false, false, false, true, true, true])
  assert.equal(last[3].level, 3)
  assert.equal(grid.flat().filter((c) => c.level > 0).length, 1)
})

test('heat grid: runs across a year end without skipping or repeating a day', () => {
  const dates = heatWeeks(new Map(), '2026-01-08').flat().map((c) => c.date)
  assert.equal(new Set(dates).size, dates.length)
  assert.ok(dates.includes('2025-12-31') && dates.includes('2026-01-01'))
  for (let i = 1; i < dates.length; i++) assert.ok(dates[i] > dates[i - 1])
})

test('month labels: one per month change, none that would crowd the next', () => {
  const grid = heatWeeks(new Map(), '2026-10-01')
  const starts = monthStarts(grid)
  const months = starts.map((s) => s.month)
  assert.deepEqual(months, [...new Set(months)].sort((a, b) => months.indexOf(a) - months.indexOf(b))) // no month twice
  for (let i = 1; i < starts.length; i++) assert.ok(starts[i].col - starts[i - 1].col >= 3)
  // A column is named by its Monday, so on Thursday 1 Oct the newest label is still September, and it is never the one dropped.
  assert.equal(starts.at(-1).month, 8)
})
