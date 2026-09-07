'use client'

import { useCallback, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { openCounts, selectTasks } from '@/lib/sort'
import type { Project, Task, View } from '@/lib/types'

import { Capture, type Draft } from './capture'
import { Sidebar } from './sidebar'
import { TaskRow } from './task-row'

/** Keep in step with --complete-ms in globals.css. */
const COMPLETE_MS = 260

const EMPTY_STATES: Record<View['kind'], { title: string; hint: string }> = {
  all: {
    title: 'Capture the thing you are avoiding',
    hint: 'Type it above and press Enter. You can add a project or date later.',
  },
  today: {
    title: 'Nothing is due today',
    hint: 'Give a task a due date and it will show up here.',
  },
  done: {
    title: 'Finished work collects here',
    hint: 'Complete a task and it stays, so you can see what you got through.',
  },
  project: {
    title: 'This project has no open tasks',
    hint: 'Capture one above and pick this project in the details row.',
  },
}

export function Workspace({
  initialTasks,
  initialProjects,
  email,
  userId,
}: {
  initialTasks: Task[]
  initialProjects: Project[]
  email: string
  userId: string
}) {
  const supabase = useMemo(() => createClient(), [])

  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [view, setView] = useState<View>({ kind: 'all' })
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [completing, setCompleting] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const visible = useMemo(() => selectTasks(tasks, view), [tasks, view])
  const counts = useMemo(() => openCounts(tasks), [tasks])

  const createTask = useCallback(
    async (draft: Draft) => {
      const now = new Date().toISOString()
      const tempId = `temp-${crypto.randomUUID()}`

      // Show it immediately. A capture that waits on the network does not feel
      // like two seconds even when it is.
      const optimistic: Task = {
        id: tempId,
        user_id: userId,
        project_id: draft.project_id,
        title: draft.title,
        notes: null,
        due_date: draft.due_date,
        priority: draft.priority,
        completed_at: null,
        created_at: now,
        updated_at: now,
      }
      setTasks((prev) => [optimistic, ...prev])

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: draft.title,
          project_id: draft.project_id,
          due_date: draft.due_date,
          priority: draft.priority,
        })
        .select()
        .single()

      if (error) {
        setTasks((prev) => prev.filter((t) => t.id !== tempId))
        setError(`Could not save "${draft.title}" — ${error.message}`)
        return
      }

      setTasks((prev) => prev.map((t) => (t.id === tempId ? (data as Task) : t)))
    },
    [supabase, userId],
  )

  const toggleTask = useCallback(
    async (task: Task) => {
      const completedAt = task.completed_at ? null : new Date().toISOString()
      const previous = task.completed_at

      // Write and animate at the same time, so the 260ms is spent on feedback
      // rather than added on top of the round trip.
      const write = supabase
        .from('tasks')
        .update({ completed_at: completedAt })
        .eq('id', task.id)

      if (completedAt) {
        setCompleting((prev) => new Set(prev).add(task.id))
        await new Promise((resolve) => setTimeout(resolve, COMPLETE_MS))
        setCompleting((prev) => {
          const next = new Set(prev)
          next.delete(task.id)
          return next
        })
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, completed_at: completedAt } : t,
        ),
      )

      const { error } = await write
      if (error) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, completed_at: previous } : t,
          ),
        )
        setError(`Could not update that task — ${error.message}`)
      }
    },
    [supabase],
  )

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      const before = tasks.find((t) => t.id === id)
      if (!before) return

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      )

      const { error } = await supabase.from('tasks').update(patch).eq('id', id)
      if (error) {
        setTasks((prev) => prev.map((t) => (t.id === id ? before : t)))
        setError(`Could not save that change — ${error.message}`)
      }
    },
    [supabase, tasks],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      const before = tasks
      setTasks((prev) => prev.filter((t) => t.id !== id))

      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) {
        setTasks(before)
        setError(`Could not delete that task — ${error.message}`)
      }
    },
    [supabase, tasks],
  )

  const createProject = useCallback(
    async (name: string) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: userId, name })
        .select()
        .single()

      if (error) {
        setError(`Could not create that project — ${error.message}`)
        return
      }
      setProjects((prev) => [...prev, data as Project])
    },
    [supabase, userId],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }, [supabase])

  // Lowercase throughout: UI copy is lowercase by design, not by oversight.
  const title =
    view.kind === 'project'
      ? (projects.find((p) => p.id === view.projectId)?.name ?? 'project')
      : view.kind === 'all'
        ? 'all'
        : view.kind === 'today'
          ? 'today'
          : 'done'

  const empty = EMPTY_STATES[view.kind]

  return (
    <div className="app">
      <Sidebar
        view={view}
        onSelect={setView}
        projects={projects}
        counts={counts}
        email={email}
        onCreateProject={createProject}
        onSignOut={signOut}
      />

      <main className="main">
        <div className="main-inner">
          <Capture
            projects={projects}
            view={view}
            onCreate={createTask}
          />

          {error ? (
            <p className="error-note" role="alert" onClick={() => setError(null)}>
              {error}
            </p>
          ) : null}

          <header className="view-header">
            <h1 className="view-title">{title}</h1>
            <span className="view-count">
              {visible.length} {visible.length === 1 ? 'task' : 'tasks'}
            </span>
          </header>

          {visible.length === 0 ? (
            <div className="empty">
              <p className="empty-title">{empty.title}</p>
              <p className="empty-hint">{empty.hint}</p>
            </div>
          ) : (
            <ul className="task-list">
              {visible.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  projects={projects}
                  expanded={expandedId === task.id}
                  completing={completing.has(task.id)}
                  onExpand={() =>
                    setExpandedId((id) => (id === task.id ? null : task.id))
                  }
                  onToggle={() => toggleTask(task)}
                  onUpdate={(patch) => updateTask(task.id, patch)}
                  onDelete={() => deleteTask(task.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}
