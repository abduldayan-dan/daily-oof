/**
 * Shared logic for the easter eggs and reactions.
 *
 * Kept pure and in one place so twenty small surprises do not become twenty
 * scattered conditionals. Anything touching localStorage is guarded — these run
 * during SSR too, where `window` does not exist.
 */
import type { Task } from './types'

export const MILESTONE_EVERY = 25
export const QUICK_MS = 60_000 // "that was quick"
export const STREAK_WINDOW_MS = 30_000 // five captures inside this earns a streak
export const STREAK_TARGET = 5
export const COMBO_WINDOW_MS = 60_000 // completions inside this chain together
export const COMBO_TARGET = 3
export const AVALANCHE_AT = 10 // overdue count where the tone changes
export const STALE_DAYS = 30 // "this one's been here a while"
export const IDLE_MS = 5 * 60_000

const DAY = 86_400_000

/* --- storage -------------------------------------------------------------- */

const KEY = {
  theme: 'daily-oof:theme',
  lastOpen: 'daily-oof:last-open',
  anniversary: 'daily-oof:anniversary-seen',
} as const

function read(key: string): string | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    // Safari in private mode throws rather than returning null.
    return null
  }
}

function write(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* not worth breaking anything over */
  }
}

/* --- theme ---------------------------------------------------------------- */

export type Theme = 'default' | 'inverted'

export function storedTheme(): Theme {
  return read(KEY.theme) === 'inverted' ? 'inverted' : 'default'
}

export function storeTheme(theme: Theme) {
  write(KEY.theme, theme)
}

/* --- once-per-day / once-ever gates --------------------------------------- */

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

/** True the first time this is called on a given calendar day. */
export function claimFirstOpenOfDay(): boolean {
  const today = todayKey()
  if (read(KEY.lastOpen) === today) return false
  write(KEY.lastOpen, today)
  return true
}

/** True once, on or after the first anniversary of the oldest task. */
export function claimAnniversary(tasks: Task[]): number | null {
  if (tasks.length === 0) return null
  if (read(KEY.anniversary)) return null

  const oldest = tasks.reduce((acc, t) =>
    t.created_at < acc.created_at ? t : acc,
  )
  const years = Math.floor(
    (Date.now() - new Date(oldest.created_at).getTime()) / (365 * DAY),
  )
  if (years < 1) return null

  write(KEY.anniversary, String(years))
  return years
}

/* --- task queries --------------------------------------------------------- */

export function ageInDays(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
}

/** An identical open task already exists. Completed ones do not count. */
export function findDuplicate(tasks: Task[], title: string): Task | undefined {
  const needle = title.trim().toLowerCase()
  if (!needle) return undefined
  return tasks.find(
    (t) => !t.completed_at && t.title.trim().toLowerCase() === needle,
  )
}

export function completedCount(tasks: Task[]): number {
  return tasks.filter((t) => t.completed_at).length
}

export function overdueCount(tasks: Task[], todayIso: string): number {
  return tasks.filter(
    (t) => !t.completed_at && t.due_date && t.due_date < todayIso,
  ).length
}

/** The longest-standing open task, used for "that one took a while". */
export function oldestOpenId(tasks: Task[]): string | null {
  const open = tasks.filter((t) => !t.completed_at)
  if (open.length === 0) return null
  return open.reduce((acc, t) => (t.created_at < acc.created_at ? t : acc)).id
}

/* --- copy ----------------------------------------------------------------- */

/** Placeholder escalation when Enter is pressed on an empty field. */
export const EMPTY_NAGS = [
  'nothing?',
  'still nothing',
  'take your time',
  'we can do this all day',
  'fine. i can wait.',
]

/**
 * Past a certain amount of overdue, encouragement stops working. Naming it is
 * kinder than pretending it is fine.
 */
export function avalancheLine(count: number): string {
  if (count >= 25) return "it's fine. everything's fine."
  if (count >= AVALANCHE_AT) return `${count} overdue. no notes.`
  return ''
}

/** Age at which finishing something long-overdue earns the whole screen. */
export const BIG_REMARK_DAYS = 14

/**
 * `big` decides between a full-page moment and an inline line. Clearing a
 * three-day-old task should not stop the world; clearing something you have
 * been avoiding for a month should.
 */
export function completionRemark(
  task: Task,
  oldestId: string | null,
): { text: string; big: boolean } | null {
  const age = ageInDays(task.created_at)

  if (Date.now() - new Date(task.created_at).getTime() < QUICK_MS) {
    return { text: 'that was quick.', big: false }
  }
  if (task.id === oldestId && age >= 2) {
    return {
      text: `that one took ${age} ${age === 1 ? 'day' : 'days'}.`,
      big: age >= BIG_REMARK_DAYS,
    }
  }
  return null
}
