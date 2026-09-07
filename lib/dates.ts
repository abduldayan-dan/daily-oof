/**
 * `due_date` is a Postgres `date` — a calendar day with no time and no zone.
 *
 * The trap: `new Date('2026-03-12')` parses as UTC midnight, so anyone west of
 * Greenwich renders it as the 11th. Everything here therefore works on
 * 'YYYY-MM-DD' strings, or builds a Date from explicit local parts.
 */

/** Today as 'YYYY-MM-DD' in the viewer's own timezone. */
export function todayISO(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

/** Parse 'YYYY-MM-DD' into a Date at local midnight. */
function toLocalDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function isOverdue(dueDate: string | null, completedAt: string | null) {
  if (!dueDate || completedAt) return false
  return dueDate < todayISO()
}

export function isDueToday(dueDate: string | null) {
  return dueDate === todayISO()
}

/** Short, human due label: Today, Tomorrow, Yesterday, or '12 Mar'. */
export function formatDue(iso: string): string {
  const today = todayISO()
  if (iso === today) return 'Today'

  const target = toLocalDate(iso)
  const base = toLocalDate(today)
  const days = Math.round(
    (target.getTime() - base.getTime()) / (1000 * 60 * 60 * 24),
  )

  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'

  const sameYear = target.getFullYear() === base.getFullYear()
  return target.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** 'Completed 12 Mar' style label for the Done view. */
export function formatCompleted(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  })
}
