import { isOverdue, todayISO } from './dates'
import type { Task, View } from './types'

/**
 * Sort order, straight from the brief: overdue first, then by due date, then
 * undated by creation.
 *
 * Undated tasks sort newest-first so a task you just captured appears at the
 * top of its group rather than buried at the bottom of a long list.
 */
export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isOverdue(a.due_date, a.completed_at)
    const bOverdue = isOverdue(b.due_date, b.completed_at)
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1

    // Dated before undated.
    if (a.due_date && !b.due_date) return -1
    if (!a.due_date && b.due_date) return 1

    if (a.due_date && b.due_date && a.due_date !== b.due_date) {
      return a.due_date < b.due_date ? -1 : 1
    }

    return b.created_at.localeCompare(a.created_at)
  })
}

/** Done view reads as history: most recently finished first. */
function sortCompleted(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) =>
    (b.completed_at ?? '').localeCompare(a.completed_at ?? ''),
  )
}

export function selectTasks(tasks: Task[], view: View): Task[] {
  const open = tasks.filter((t) => !t.completed_at)

  switch (view.kind) {
    case 'all':
      return sortTasks(open)

    // Today includes anything overdue. Hiding what you already missed is how a
    // task list quietly stops being trusted.
    case 'today': {
      const today = todayISO()
      return sortTasks(open.filter((t) => t.due_date && t.due_date <= today))
    }

    case 'done':
      return sortCompleted(tasks.filter((t) => t.completed_at))

    case 'project':
      return sortTasks(open.filter((t) => t.project_id === view.projectId))
  }
}

/** Open task counts per project id, plus the top-level view counts. */
export function openCounts(tasks: Task[]) {
  const open = tasks.filter((t) => !t.completed_at)
  const today = todayISO()

  const byProject = new Map<string, number>()
  for (const task of open) {
    if (!task.project_id) continue
    byProject.set(task.project_id, (byProject.get(task.project_id) ?? 0) + 1)
  }

  return {
    all: open.length,
    today: open.filter((t) => t.due_date && t.due_date <= today).length,
    byProject,
  }
}
