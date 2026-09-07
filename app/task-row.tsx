'use client'

import { useEffect, useState } from 'react'

import { formatCompleted, formatDue, isOverdue } from '@/lib/dates'
import type { Priority, Project, Task } from '@/lib/types'

export function TaskRow({
  task,
  projects,
  expanded,
  completing,
  entering,
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
  onExpand: () => void
  onToggle: () => void
  onUpdate: (patch: Partial<Task>) => void
  onDelete: () => void
}) {
  const [notes, setNotes] = useState(task.notes ?? '')
  const [title, setTitle] = useState(task.title)

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
    if (trimmed !== task.title) onUpdate({ title: trimmed.slice(0, 500) })
  }

  return (
    <li
      className="task-row"
      data-priority={task.priority ?? undefined}
      data-done={done}
      data-completing={completing}
      data-entering={entering}
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
              <span className="project-dot" data-color={project.color} />
              {project.name}
            </span>
          ) : null}

          {task.due_date && !done ? (
            <span className="task-meta-item task-due" data-overdue={overdue}>
              {formatDue(task.due_date)}
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
            value={notes}
            placeholder="notes"
            aria-label="Notes"
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              if (notes !== (task.notes ?? '')) {
                onUpdate({ notes: notes || null })
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
