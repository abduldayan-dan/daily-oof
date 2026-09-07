export type Priority = 'high' | 'medium' | 'low'

export type Project = {
  id: string
  user_id: string
  name: string
  color: string
  archived: boolean
  created_at: string
}

export type Task = {
  id: string
  user_id: string
  project_id: string | null
  title: string
  notes: string | null
  due_date: string | null
  priority: Priority | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

/** The three top-level views, plus a per-project view. */
export type View =
  | { kind: 'all' }
  | { kind: 'today' }
  | { kind: 'done' }
  | { kind: 'project'; projectId: string }
