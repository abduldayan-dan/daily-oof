'use client'

import { useState } from 'react'

import { PROJECT_COLORS, normaliseColor, type ProjectColor } from '@/lib/colors'
import type { Project, View } from '@/lib/types'

import { Brand } from './brand'

export function Sidebar({
  view,
  onSelect,
  projects,
  counts,
  email,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onSignOut,
}: {
  view: View
  onSelect: (view: View) => void
  projects: Project[]
  counts: { all: number; today: number; byProject: Map<string, number> }
  email: string
  onCreateProject: (name: string) => void
  onUpdateProject: (id: string, patch: Partial<Project>) => void
  onDeleteProject: (id: string) => void
  onSignOut: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  function submit() {
    const trimmed = name.trim()
    if (trimmed) onCreateProject(trimmed.slice(0, 80))
    setName('')
    setAdding(false)
  }

  return (
    <nav className="sidebar" aria-label="Views and projects">
      <Brand />

      <div className="sidebar-section">
        <NavItem
          label="all"
          count={counts.all}
          current={view.kind === 'all'}
          onClick={() => onSelect({ kind: 'all' })}
        />
        <NavItem
          label="today"
          count={counts.today}
          current={view.kind === 'today'}
          onClick={() => onSelect({ kind: 'today' })}
        />
        <NavItem
          label="done"
          current={view.kind === 'done'}
          onClick={() => onSelect({ kind: 'done' })}
        />
      </div>

      <div className="sidebar-section">
        <p className="sidebar-label">projects</p>

        {projects.map((project) =>
          editingId === project.id ? (
            <ProjectEditor
              key={project.id}
              project={project}
              onSave={(patch) => {
                onUpdateProject(project.id, patch)
                setEditingId(null)
              }}
              onDelete={() => {
                onDeleteProject(project.id)
                setEditingId(null)
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className="nav-row" key={project.id}>
              <NavItem
                label={project.name}
                colour={normaliseColor(project.color)}
                count={counts.byProject.get(project.id) ?? 0}
                current={
                  view.kind === 'project' && view.projectId === project.id
                }
                onClick={() =>
                  onSelect({ kind: 'project', projectId: project.id })
                }
              />
              <button
                className="nav-edit"
                aria-label={`Edit ${project.name}`}
                onClick={() => setEditingId(project.id)}
              >
                <PencilIcon />
              </button>
            </div>
          ),
        )}

        {adding ? (
          <input
            className="attr-control"
            autoFocus
            maxLength={80}
            placeholder="project name"
            aria-label="New project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={submit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') {
                setName('')
                setAdding(false)
              }
            }}
          />
        ) : (
          <button className="nav-item" onClick={() => setAdding(true)}>
            <span className="nav-item-name">+ new project</span>
          </button>
        )}
      </div>

      <div className="sidebar-footer">
        <span className="user-email" title={email}>
          {email}
        </span>
        <button className="button" data-variant="ghost" onClick={onSignOut}>
          sign out
        </button>
      </div>
    </nav>
  )
}

function ProjectEditor({
  project,
  onSave,
  onDelete,
  onCancel,
}: {
  project: Project
  onSave: (patch: Partial<Project>) => void
  onDelete: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(project.name)
  const [colour, setColour] = useState<ProjectColor>(
    normaliseColor(project.color),
  )
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function save() {
    const trimmed = name.trim()
    // Empty names violate the schema's check constraint, so fall back rather
    // than firing a request that is guaranteed to fail.
    onSave({ name: trimmed ? trimmed.slice(0, 80) : project.name, color: colour })
  }

  return (
    <div className="project-editor">
      <input
        className="attr-control"
        autoFocus
        maxLength={80}
        aria-label="Project name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') onCancel()
        }}
      />

      <div className="swatch-grid" role="group" aria-label="Project colour">
        {PROJECT_COLORS.map((c) => (
          <button
            key={c.key}
            className="swatch project-dot"
            data-color={c.key}
            aria-label={c.label}
            aria-pressed={colour === c.key}
            onClick={() => setColour(c.key)}
          />
        ))}
      </div>

      {confirmingDelete ? (
        <>
          <p className="editor-warning">
            delete “{project.name}”? its tasks are kept and simply lose their
            project.
          </p>
          <div className="editor-actions">
            <button className="text-button" onClick={onDelete}>
              yes, delete
            </button>
            <button
              className="text-button"
              onClick={() => setConfirmingDelete(false)}
            >
              keep it
            </button>
          </div>
        </>
      ) : (
        <div className="editor-actions">
          <button
            className="text-button"
            onClick={() => setConfirmingDelete(true)}
          >
            delete
          </button>
          <button className="text-button" onClick={save}>
            save
          </button>
        </div>
      )}
    </div>
  )
}

function NavItem({
  label,
  count,
  colour,
  current,
  onClick,
}: {
  label: string
  count?: number
  colour?: string
  current: boolean
  onClick: () => void
}) {
  return (
    <button className="nav-item" aria-current={current} onClick={onClick}>
      {colour ? <span className="project-dot" data-color={colour} /> : null}
      <span className="nav-item-name">{label}</span>
      {/* Keying on the value remounts the span when the number changes, which
          replays the tick animation without any state of its own. */}
      {count ? (
        <span className="nav-item-count" key={count}>
          {count}
        </span>
      ) : null}
    </button>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
      <path
        d="M9.4 2.3l2.3 2.3-7 7-2.9.6.6-2.9 7-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
