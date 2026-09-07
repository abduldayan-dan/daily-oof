'use client'

import { useState } from 'react'

import type { Priority, Project, View } from '@/lib/types'

export type Draft = {
  title: string
  project_id: string | null
  due_date: string | null
  priority: Priority | null
}

/**
 * The whole app is arranged around this input. It is autofocused, it is never
 * in a modal, and Enter alone is enough to save. The attribute row below stays
 * collapsed until someone reaches for it, because every control visible here is
 * a decision the user has to skip past before typing.
 */
export function Capture({
  projects,
  view,
  onCreate,
}: {
  projects: Project[]
  view: View
  onCreate: (draft: Draft) => void
}) {
  const [title, setTitle] = useState('')
  const [showAttrs, setShowAttrs] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState<string>('')
  const [priority, setPriority] = useState<Priority | ''>('')

  // Capturing inside a project should default to that project, but never
  // require it.
  const effectiveProjectId =
    projectId ?? (view.kind === 'project' ? view.projectId : null)

  function submit() {
    const trimmed = title.trim()
    if (!trimmed) return

    onCreate({
      title: trimmed.slice(0, 500),
      project_id: effectiveProjectId,
      due_date: dueDate || null,
      priority: priority || null,
    })

    // Clear the title but keep the attributes: capturing five tasks for the
    // same project in a row is common, re-picking it five times is not.
    setTitle('')
  }

  return (
    <div className="capture">
      <div className="capture-field">
        <input
          className="capture-input"
          value={title}
          autoFocus
          maxLength={500}
          placeholder="what needs doing?"
          aria-label="New task"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submit()
            }
            if (e.key === 'Escape') setTitle('')
          }}
        />
        <span className="capture-hint" aria-hidden="true">
          ↵
        </span>
      </div>

      <div className="capture-attrs">
        {showAttrs ? (
          <>
            <select
              className="attr-control"
              aria-label="Project"
              value={effectiveProjectId ?? ''}
              onChange={(e) => setProjectId(e.target.value || null)}
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
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />

            <select
              className="attr-control"
              aria-label="Priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority | '')}
            >
              <option value="">no priority</option>
              <option value="high">high</option>
              <option value="medium">medium</option>
              <option value="low">low</option>
            </select>

            <button
              className="attr-toggle"
              onClick={() => {
                setShowAttrs(false)
                setProjectId(null)
                setDueDate('')
                setPriority('')
              }}
            >
              clear
            </button>
          </>
        ) : (
          <button className="attr-toggle" onClick={() => setShowAttrs(true)}>
            + add project, date or priority
          </button>
        )}
      </div>
    </div>
  )
}
