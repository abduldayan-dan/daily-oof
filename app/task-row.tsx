'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { normaliseColor } from '@/lib/colors'
import { formatCompleted, formatDue, isOverdue } from '@/lib/dates'
import { STALE_DAYS, ageInDays } from '@/lib/eggs'
import type { Priority, Project, Task } from '@/lib/types'

/** Keep in step with the save-flash animation in globals.css. */
const SAVE_FLASH_MS = 900

export function TaskRow({
  task,
  projects,
  expanded,
  completing,
  entering,
  deleting,
  restoring,
  onExpand,
  onToggle,
  onUpdate,
  onDelete,
}: {
  task: Task
  projects: Project[]
  expanded: boolean
  completing: boolean
  entering: boolean
  deleting: boolean
  restoring: boolean
  onExpand: () => void
  onToggle: () => void
  onUpdate: (patch: Partial<Task>) => Promise<boolean>
  onDelete: () => void
}) {
  const [notes, setNotes] = useState(task.notes ?? '')
  const [title, setTitle] = useState(task.title)
  const [saved, setSaved] = useState<'title' | 'notes' | null>(null)
  const rowRef = useRef<HTMLLIElement>(null)

  // The delete animation collapses from the row's real height. Measured here
  // because a guessed max-height makes the first half of the collapse look like
  // nothing is happening on short rows.
  useLayoutEffect(() => {
    if (!deleting || !rowRef.current) return
    rowRef.current.style.setProperty(
      '--row-height',
      `${rowRef.current.offsetHeight}px`,
    )
  }, [deleting])

  useEffect(() => {
    if (!saved) return
    const id = setTimeout(() => setSaved(null), SAVE_FLASH_MS)
    return () => clearTimeout(id)
  }, [saved])

  /** Confirm the write landed. A failed save used to look exactly like a good one. */
  async function commit(field: 'title' | 'notes', patch: Partial<Task>) {
    const ok = await onUpdate(patch)
    if (ok) setSaved(field)
  }

  // Re-sync when the row is reused for different data, or when an optimistic
  // insert is swapped for the saved row.
  useEffect(() => {
    setNotes(task.notes ?? '')
    setTitle(task.title)
  }, [task.id, task.notes, task.title])

  const project = projects.find((p) => p.id === task.project_id)
  const overdue = isOverdue(task.due_date, task.completed_at)
  const done = Boolean(task.completed_at)

  function commitTitle() {
    const trimmed = title.trim()
    if (!trimmed) {
      setTitle(task.title) // Empty titles violate the schema check constraint.
      return
    }
    if (trimmed !== task.title) commit('title', { title: trimmed.slice(0, 500) })
  }

  return (
    <li
      ref={rowRef}
      className="task-row"
      data-priority={task.priority ?? undefined}
      data-done={done}
      data-completing={completing}
      data-entering={entering}
      data-deleting={deleting}
      data-restoring={restoring}
      onClick={onExpand}
    >
      <button
        className="task-checkbox"
        data-checked={done}
        aria-label={done ? `Mark "${task.title}" as not done` : `Complete "${task.title}"`}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
      >
        <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
          <path
            d="M2.5 6.2 4.8 8.5 9.5 3.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="task-body">
        {expanded ? (
          <input
            className="capture-input task-title"
            data-saved={saved === 'title' ? 'true' : undefined}
            value={title}
            maxLength={500}
            aria-label="Task title"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') setTitle(task.title)
            }}
          />
        ) : (
          <p className="task-title">{task.title}</p>
        )}

        <div className="task-meta">
          {project ? (
            <span className="task-meta-item">
              <span
                className="project-dot"
                data-color={normaliseColor(project.color)}
              />
              {project.name}
            </span>
          ) : null}

          {task.due_date && !done ? (
            <span className="task-meta-item task-due" data-overdue={overdue}>
              {formatDue(task.due_date)}
            </span>
          ) : null}

          {/* A shrug rather than a nag. Somebody a month past a due date does
              not need the app raising its voice at them. */}
          {overdue && task.due_date && ageInDays(task.due_date) >= STALE_DAYS ? (
            <span className="task-meta-item task-stale">
              been here a while
            </span>
          ) : null}

          {done && task.completed_at ? (
            <span className="task-meta-item">
              done {formatCompleted(task.completed_at)}
            </span>
          ) : null}

          {task.notes && !expanded ? (
            <span className="task-meta-item" title={task.notes}>
              notes
            </span>
          ) : null}
        </div>
      </div>

      <div className="task-actions">
        {/* Clicking the row already expands it, but nothing said so. An explicit
            pencil is what makes editing discoverable. */}
        {expanded ? null : (
          <button
            className="icon-button"
            aria-label={`Edit "${task.title}"`}
            onClick={(e) => {
              e.stopPropagation()
              onExpand()
            }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M9.4 2.3l2.3 2.3-7 7-2.9.6.6-2.9 7-7z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        <button
          className="icon-button"
          data-danger="true"
          aria-label={`Delete "${task.title}"`}
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M2.5 3.5h9M5.5 3.5V2.4h3v1.1M3.6 3.5l.5 8h5.8l.5-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {expanded ? (
        <div className="task-editor" onClick={(e) => e.stopPropagation()}>
          <textarea
            className="task-notes"
            data-saved={saved === 'notes' ? 'true' : undefined}
            value={notes}
            placeholder="notes"
            aria-label="Notes"
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (task.notes ?? '')) {
                commit('notes', { notes: notes || null })
              }
            }}
          />

          <div className="editor-row">
            <select
              className="attr-control"
              aria-label="Project"
              value={task.project_id ?? ''}
              onChange={(e) => onUpdate({ project_id: e.target.value || null })}
            >
              <option value="">no project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <input
              className="attr-control"
              type="date"
              aria-label="Due date"
              value={task.due_date ?? ''}
              onChange={(e) => onUpdate({ due_date: e.target.value || null })}
            />

            <select
              className="attr-control"
              aria-label="Priority"
              value={task.priority ?? ''}
              onChange={(e) =>
                onUpdate({ priority: (e.target.value || null) as Priority | null })
              }
            >
              <option value="">no priority</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>
          </div>
        </div>
      ) : null}
    </li>
  )
}
