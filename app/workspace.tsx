'use client'

import { useCallback, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { openCounts, selectTasks } from '@/lib/sort'
import type { Project, Task, View } from '@/lib/types'

import { Capture, type Draft } from './capture'
import { Sidebar } from './sidebar'
import { TaskRow } from './task-row'

/** Keep in step with --complete-ms in globals.css. */
const COMPLETE_MS = 320

type EmptyCopy = { title: string; hint: string }

/** Say what to do next, never "nothing here". */
const EMPTY_STATES: Record<View['kind'], EmptyCopy> = {
  all: {
    title: 'nothing here. suspicious.',
    hint: "type it up top. we both know there's something.",
  },
  today: {
    title: "today's clear.",
    hint: 'enjoy it, or go give something a due date.',
  },
  done: {
    title: 'nothing finished yet.',
    hint: "bold strategy. let's see how it plays out.",
  },
  project: {
    title: "this one's empty.",
    hint: 'add something before anyone notices.',
  },
}

/**
 * Shown only when you emptied the view yourself, just now. Arriving at an empty
 * list is not an achievement; clearing one is.
 */
const CLEARED_STATES: Partial<Record<View['kind'], EmptyCopy>> = {
  all: {
    title: 'zero oofs. remarkable.',
    hint: 'nothing left on the list. this is as good as it gets.',
  },
  today: {
    title: 'today is beaten.',
    hint: 'genuinely, go outside.',
  },
  project: {
    title: 'project cleared.',
    hint: 'someone has been suspiciously productive.',
  },
}

function viewKey(view: View) {
  return view.kind === 'project' ? `project:${view.projectId}` : view.kind
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
  const [enteringId, setEnteringId] = useState<string | null>(null)
  const [clearedView, setClearedView] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const visible = useMemo(() => selectTasks(tasks, view), [tasks, view])
  const counts = useMemo(() => openCounts(tasks), [tasks])

  const selectView = useCallback((next: View) => {
    setClearedView(null)
    setView(next)
  }, [])

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
      setEnteringId(tempId)
      setClearedView(null)

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
        setEnteringId(null)
        setError(`Could not save "${draft.title}" — ${error.message}`)
        return
      }

      // Swapping the temp id for the real one remounts the row. Clearing this
      // first stops the drop-in animation replaying on the replacement.
      setEnteringId(null)
      setTasks((prev) => prev.map((t) => (t.id === tempId ? (data as Task) : t)))
    },
    [supabase, userId],
  )

  const toggleTask = useCallback(
    async (task: Task) => {
      const completedAt = task.completed_at ? null : new Date().toISOString()
      const previous = task.completed_at

      // Write and animate at the same time, so the animation is spent on
      // feedback rather than added on top of the round trip.
      const write = supabase
        .from('tasks')
        .update({ completed_at: completedAt })
        .eq('id', task.id)

      if (completedAt) {
        const after = tasks.map((t) =>
          t.id === task.id ? { ...t, completed_at: completedAt } : t,
        )
        // Was this the one that emptied the view? Decide before the row leaves.
        if (selectTasks(after, view).length === 0) {
          setClearedView(viewKey(view))
        }

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
        setClearedView(null)
        setError(`Could not update that task — ${error.message}`)
      }
    },
    [supabase, tasks, view],
  )

  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>) => {
      const before = tasks.find((t) => t.id === id)
      if (!before) return

      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

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

  const countLabel =
    view.kind === 'done'
      ? `${visible.length} survived`
      : `${visible.length} ${visible.length === 1 ? 'oof' : 'oofs'}`

  const justCleared = clearedView === viewKey(view)
  const empty =
    (justCleared ? CLEARED_STATES[view.kind] : undefined) ??
    EMPTY_STATES[view.kind]

  return (
    <div className="app">
      <Sidebar
        view={view}
        onSelect={selectView}
        projects={projects}
        counts={counts}
        email={email}
        onCreateProject={createProject}
        onSignOut={signOut}
      />

      <main className="main">
        <div className="main-inner">
          <Capture projects={projects} view={view} onCreate={createTask} />

          {error ? (
            <p className="error-note" role="alert" onClick={() => setError(null)}>
              {error}
            </p>
          ) : null}

          <header className="view-header">
            <h1 className="view-title">{title}</h1>
            <span className="view-count">{countLabel}</span>
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
                  entering={enteringId === task.id}
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
