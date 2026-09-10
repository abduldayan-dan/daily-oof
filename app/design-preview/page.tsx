import { notFound } from 'next/navigation'

import type { Project, Task } from '@/lib/types'

import { Workspace } from '../workspace'

/**
 * Design preview with fixed mock data.
 *
 * Lets you work on globals.css without signing in or having a database — open
 * /design-preview, edit the CSS, watch it reload. Nothing here saves: the write
 * fails and the row rolls back, which is also a decent way to see the error
 * state on purpose.
 *
 * Never reachable in production. The 404 below is the real guard; the matching
 * entry in the middleware allow list only keeps you from being redirected to
 * /login while developing.
 */

function iso(offsetDays: number) {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

const projects: Project[] = [
  { id: 'p1', user_id: 'u', name: 'Onboarding', color: 'sky', archived: false, created_at: '2026-01-01' },
  { id: 'p2', user_id: 'u', name: 'Design system', color: 'mint', archived: false, created_at: '2026-01-02' },
  { id: 'p3', user_id: 'u', name: 'Q4 release', color: 'salmon', archived: false, created_at: '2026-01-03' },
]

const base = {
  user_id: 'u',
  notes: null,
  completed_at: null,
  updated_at: '2026-09-01T09:00:00Z',
}

const tasks: Task[] = [
  { ...base, id: '1', project_id: 'p1', title: 'Audit checkout flow against the design system', due_date: iso(-3), priority: 'high', created_at: '2026-09-01T09:00:00Z' },
  { ...base, id: '2', project_id: 'p3', title: 'QA settings screen on mobile — 320px breakpoint', due_date: iso(-1), priority: 'medium', created_at: '2026-09-02T09:00:00Z' },
  { ...base, id: '3', project_id: null, title: 'Redesign the empty state for search results', due_date: iso(0), priority: null, created_at: '2026-09-03T09:00:00Z' },
  { ...base, id: '4', project_id: 'p2', title: 'Spacing pass on the nav PR', due_date: iso(2), priority: 'low', created_at: '2026-09-04T09:00:00Z', notes: 'Check the 8px grid on the dropdown.' },
  { ...base, id: '5', project_id: 'p1', title: 'Write alt text for the illustration set', due_date: null, priority: null, created_at: '2026-09-05T09:00:00Z' },
  { ...base, id: '6', project_id: null, title: 'Ask engineering about the focus ring token', due_date: null, priority: null, created_at: '2026-09-06T09:00:00Z' },
  { ...base, id: '7', project_id: 'p2', title: 'Deprecate the old badge component', due_date: null, priority: null, created_at: '2026-08-20T09:00:00Z', completed_at: '2026-09-05T14:00:00Z' },
]

export default function DesignPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound()

  return (
    <Workspace
      initialTasks={tasks}
      initialProjects={projects}
      email="you@yourcompany.com"
      userId="preview-user"
    />
  )
}
