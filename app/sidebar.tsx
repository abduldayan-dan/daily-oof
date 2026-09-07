'use client'

import { useState } from 'react'

import type { Project, View } from '@/lib/types'

import { Brand } from './brand'

export function Sidebar({
  view,
  onSelect,
  projects,
  counts,
  email,
  onCreateProject,
  onSignOut,
}: {
  view: View
  onSelect: (view: View) => void
  projects: Project[]
  counts: { all: number; today: number; byProject: Map<string, number> }
  email: string
  onCreateProject: (name: string) => void
  onSignOut: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

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

        {projects.map((project) => (
          <NavItem
            key={project.id}
            label={project.name}
            colour={project.color}
            count={counts.byProject.get(project.id) ?? 0}
            current={view.kind === 'project' && view.projectId === project.id}
            onClick={() => onSelect({ kind: 'project', projectId: project.id })}
          />
        ))}

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
