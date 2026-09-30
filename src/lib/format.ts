/** "Barbell, Dumbbells, Flat bench +3 more". Empty input gives an empty string, so the caller can say "Bodyweight". */
export function listNames(names: readonly string[], max = 4): string {
  if (names.length <= max) return names.join(', ')
  return `${names.slice(0, max).join(', ')} +${names.length - max} more`
}

/** Seconds as m:ss, for the elapsed and rest clocks. */
export function clock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** A timestamp `seconds` from now, for countdowns that are computed from a deadline. */
export const secondsFromNow = (seconds: number) => Date.now() + seconds * 1000

/** Groups a list by its `group` field, keeping the order it came in: [{ group: "Free weights", items: [...] }, ...]. */
export function groupBy<T extends { group: string }>(list: readonly T[]): { group: string; items: T[] }[] {
  const groups: { group: string; items: T[] }[] = []
  for (const item of list) {
    const found = groups.find((g) => g.group === item.group)
    if (found) found.items.push(item)
    else groups.push({ group: item.group, items: [item] })
  }
  return groups
}

/** Names of the picked items, in the list's order (not the order they were ticked in). */
export const namesOf = (list: readonly { id: string; name: string }[], ids: readonly string[]) =>
  list.filter((item) => ids.includes(item.id)).map((item) => item.name)
