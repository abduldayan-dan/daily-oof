'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { nextColor } from '@/lib/colors'
import { todayISO } from '@/lib/dates'
import {
  COMBO_TARGET,
  COMBO_WINDOW_MS,
  IDLE_MS,
  MILESTONE_EVERY,
  avalancheLine,
  claimAnniversary,
  claimFirstOpenOfDay,
  completedCount,
  completionRemark,
  oldestOpenId,
  overdueCount,
  storeTheme,
  storedTheme,
  type Theme,
} from '@/lib/eggs'
import { openCounts, selectTasks } from '@/lib/sort'
import type { Project, Task, View } from '@/lib/types'

import { Capture, type Draft, type Nudge } from './capture'
import { Confetti } from './confetti'
import { DoneSearch } from './done-search'
import { DoneSummary } from './done-summary'
import { Sidebar } from './sidebar'
import { Takeover, type TakeoverContent } from './takeover'
import { TaskRow } from './task-row'
import { useIdle, useKonami } from './use-eggs'

/** Keep these in step with --complete-ms and the delete animation in globals.css. */
const COMPLETE_MS = 320
const DELETE_MS = 220
const RESTORE_MS = 260
const NUDGE_MS = 2600

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
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [enteringProjectId, setEnteringProjectId] = useState<string | null>(null)
  const [clearedView, setClearedView] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)

  // --- eggs ---------------------------------------------------------------
  const [theme, setTheme] = useState<Theme>('default')
  const [takeover, setTakeover] = useState<TakeoverContent | null>(null)
  const [nudge, setNudge] = useState<Nudge | null>(null)
  const [restoringId, setRestoringId] = useState<string | null>(null)
  const [resetCapture, setResetCapture] = useState(0)
  const [idling, setIdling] = useState(false)
  const [showLifetime, setShowLifetime] = useState(false)
  const [celebrating, setCelebrating] = useState(false)
  const combo = useRef<number[]>([])

  useEffect(() => {
    if (!celebrating) return
    const id = setTimeout(() => setCelebrating(false), 1500)
    return () => clearTimeout(id)
  }, [celebrating])

  useEffect(() => {
    if (!showLifetime) return
    const id = setTimeout(() => setShowLifetime(false), 2400)
    return () => clearTimeout(id)
  }, [showLifetime])

  const lastNudge = useRef<{ text: string; at: number } | null>(null)

  /**
   * Swallows an identical line repeated in quick succession. Completing the
   * oldest task promotes the next one to oldest, so clearing a backlog would
   * otherwise say "that one took 10 days" over and over and stop meaning
   * anything.
   */
  const showNudge = useCallback((next: Nudge) => {
    const now = Date.now()
    const last = lastNudge.current
    if (last && last.text === next.text && now - last.at < 10_000) return
    lastNudge.current = { text: next.text, at: now }
    setNudge(next)
  }, [])

  useEffect(() => {
    if (!nudge) return
    const id = setTimeout(() => setNudge(null), NUDGE_MS)
    return () => clearTimeout(id)
  }, [nudge])

  /** One takeover at a time — a queue of full-page moments would be a pile-up. */
  const queueTakeover = useCallback((content: TakeoverContent) => {
    setTakeover((current) => current ?? content)
  }, [])

  // Theme is read after mount rather than during render: localStorage does not
  // exist on the server, and reading it in render would mismatch on hydration.
  useEffect(() => setTheme(storedTheme()), [])

  useEffect(() => {
    document.documentElement.dataset.theme =
      theme === 'inverted' ? 'inverted' : ''
  }, [theme])

  useKonami(
    useCallback(() => {
      setTheme((current) => {
        const next: Theme = current === 'inverted' ? 'default' : 'inverted'
        storeTheme(next)
        return next
      })
      // The sequence ends in "b a", which lands in the autofocused capture box.
      setResetCapture((n) => n + 1)
      showNudge({ text: 'inverted mode. you found it.' })
    }, [showNudge]),
  )

  useIdle(
    IDLE_MS,
    !idling && !takeover,
    useCallback(() => setIdling(true), []),
  )

  useEffect(() => {
    if (!idling) return
    const wake = () => setIdling(false)
    const events = ['keydown', 'mousedown', 'wheel', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }))
    return () => events.forEach((e) => window.removeEventListener(e, wake))
  }, [idling])

  // Once per calendar day, and once ever for an anniversary. Both claim their
  // slot in localStorage as they fire, so neither repeats on a refresh.
  useEffect(() => {
    const years = claimAnniversary(initialTasks)
    if (years) {
      queueTakeover({
        title: years === 1 ? 'one year of oofs' : `${years} years of oofs`,
        subtitle: `${initialTasks.filter((t) => t.completed_at).length} finished so far`,
        ms: 2600,
      })
      return
    }
    if (claimFirstOpenOfDay()) {
      queueTakeover({
        title: new Date().toLocaleDateString(undefined, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
        subtitle: 'a fresh set of oofs',
      })
    }
  }, [initialTasks, queueTakeover])

  const visible = useMemo(() => {
    const selected = selectTasks(tasks, view)
    const q = query.trim().toLowerCase()
    if (view.kind !== 'done' || !q) return selected

    // Notes are searched too — the useful detail is often there rather than in
    // a title written in two seconds.
    return selected.filter(
      (task) =>
        task.title.toLowerCase().includes(q) ||
        (task.notes ?? '').toLowerCase().includes(q),
    )
  }, [tasks, view, query])

  const counts = useMemo(() => openCounts(tasks), [tasks])

  const selectView = useCallback((next: View) => {
    setClearedView(null)
    setQuery('')
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

        // Emptying the entire list is the rarest thing that happens here, and
        // until now it got exactly the same treatment as clearing three tasks
        // in Today.
        if (selectTasks(after, { kind: 'all' }).length === 0) {
          queueTakeover({
            title: 'nothing left.',
            subtitle: 'the whole list. gone.',
            ms: 2400,
          })
        }

        const finished = completedCount(after)
        if (finished > 0 && finished % MILESTONE_EVERY === 0) {
          setCelebrating(true)
          showNudge({ text: `${finished} oofs survived.` })
        } else {
          // Chain completions that land close together, otherwise fall back to
          // a remark about this particular task.
          const now = Date.now()
          combo.current = [...combo.current, now].filter(
            (t) => now - t < COMBO_WINDOW_MS,
          )
          if (combo.current.length >= COMBO_TARGET) {
            showNudge({ text: `${combo.current.length} in a row.` })
          } else {
            const remark = completionRemark(task, oldestOpenId(tasks))
            if (remark) showNudge({ text: remark })
          }
        }

        setCompleting((prev) => new Set(prev).add(task.id))
        await new Promise((resolve) => setTimeout(resolve, COMPLETE_MS))
        setCompleting((prev) => {
          const next = new Set(prev)
          next.delete(task.id)
          return next
        })
      } else {
        // Putting one back. Play the completion in reverse so it reads as an
        // undo rather than the row silently reappearing.
        setRestoringId(task.id)
        showNudge({ text: 'changed your mind?' })
        await new Promise((resolve) => setTimeout(resolve, RESTORE_MS))
        setRestoringId(null)
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
    [supabase, tasks, view, queueTakeover, showNudge],
  )

  /** Resolves true when the write landed, so the row can confirm it visibly. */
  const updateTask = useCallback(
    async (id: string, patch: Partial<Task>): Promise<boolean> => {
      const before = tasks.find((t) => t.id === id)
      if (!before) return false

      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))

      const { error } = await supabase.from('tasks').update(patch).eq('id', id)
      if (error) {
        setTasks((prev) => prev.map((t) => (t.id === id ? before : t)))
        setError(`Could not save that change — ${error.message}`)
        return false
      }
      return true
    },
    [supabase, tasks],
  )

  const deleteTask = useCallback(
    async (id: string) => {
      const before = tasks

      // Start the write and the collapse together, so the animation is spent on
      // feedback rather than added on top of the round trip.
      const write = supabase.from('tasks').delete().eq('id', id)

      setDeletingId(id)
      await new Promise((resolve) => setTimeout(resolve, DELETE_MS))
      setDeletingId(null)
      setTasks((prev) => prev.filter((t) => t.id !== id))

      const { error } = await write
      if (error) {
        setTasks(before)
        setError(`Could not delete that task — ${error.message}`)
      }
    },
    [supabase, tasks],
  )

  const createProject = useCallback(
    async (name: string) => {
      // Pick the least-used colour rather than letting the column default to a
      // neutral. Otherwise every project renders identically and the dots stop
      // carrying any information.
      const color = nextColor(projects.map((p) => p.color))

      const { data, error } = await supabase
        .from('projects')
        .insert({ user_id: userId, name, color })
        .select()
        .single()

      if (error) {
        setError(`Could not create that project — ${error.message}`)
        return
      }
      setProjects((prev) => [...prev, data as Project])
      setEnteringProjectId((data as Project).id)
    },
    [supabase, userId, projects],
  )

  const updateProject = useCallback(
    async (id: string, patch: Partial<Project>) => {
      const before = projects.find((p) => p.id === id)
      if (!before) return

      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      )

      const { error } = await supabase
        .from('projects')
        .update(patch)
        .eq('id', id)

      if (error) {
        setProjects((prev) => prev.map((p) => (p.id === id ? before : p)))
        setError(`Could not save that project — ${error.message}`)
      }
    },
    [supabase, projects],
  )

  const deleteProject = useCallback(
    async (id: string) => {
      const previousProjects = projects
      const previousTasks = tasks

      setProjects((prev) => prev.filter((p) => p.id !== id))

      // Mirror the foreign key's ON DELETE SET NULL locally. Without this the
      // rows keep pointing at a project that no longer exists and the metadata
      // line renders nothing until a reload. Tasks are never deleted here —
      // losing work because someone tidied up their projects is the worst
      // possible bug in a tool people are learning to trust.
      setTasks((prev) =>
        prev.map((t) => (t.project_id === id ? { ...t, project_id: null } : t)),
      )

      if (view.kind === 'project' && view.projectId === id) {
        setView({ kind: 'all' })
      }

      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) {
        setProjects(previousProjects)
        setTasks(previousTasks)
        setError(`Could not delete that project — ${error.message}`)
      }
    },
    [supabase, projects, tasks, view],
  )

  const signOut = useCallback(async () => {
    // Hold the farewell briefly rather than jumping straight to /login, which
    // reads like the app crashed.
    queueTakeover({ title: 'see you tomorrow.', ms: 1400 })
    await supabase.auth.signOut()
    setTimeout(() => {
      window.location.href = '/login'
    }, 1200)
  }, [supabase, queueTakeover])

  // Lowercase throughout: UI copy is lowercase by design, not by oversight.
  const title =
    view.kind === 'project'
      ? (projects.find((p) => p.id === view.projectId)?.name ?? 'project')
      : view.kind === 'all'
        ? 'all'
        : view.kind === 'today'
          ? 'today'
          : 'done'

  const lifetime = completedCount(tasks)

  const countLabel = showLifetime
    ? `${lifetime} finished, all time`
    : view.kind === 'done'
      ? `${visible.length} survived`
      : `${visible.length} ${visible.length === 1 ? 'oof' : 'oofs'}`

  // Past a certain pile of overdue, encouragement stops landing. Naming it is
  // kinder than pretending everything is on track.
  const avalanche =
    view.kind === 'done' ? '' : avalancheLine(overdueCount(tasks, todayISO()))

  const justCleared = clearedView === viewKey(view)
  const searching = view.kind === 'done' && query.trim().length > 0

  const empty = searching
    ? {
        title: 'nothing matches that.',
        hint: 'try a shorter word, or clear the search.',
      }
    : ((justCleared ? CLEARED_STATES[view.kind] : undefined) ??
      EMPTY_STATES[view.kind])

  return (
    <div className="app" data-idling={idling || undefined}>
      {takeover ? (
        <Takeover content={takeover} onDone={() => setTakeover(null)} />
      ) : null}

      {/* Milestones fire wherever you happen to be, so this one is page-level
          rather than living inside the empty state. */}
      {celebrating ? (
        <div className="confetti-layer" aria-hidden="true">
          <Confetti />
        </div>
      ) : null}

      {idling ? (
        <div className="idle-drift" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ) : null}

      <Sidebar
        view={view}
        onSelect={selectView}
        projects={projects}
        counts={counts}
        email={email}
        enteringProjectId={enteringProjectId}
        onCreateProject={createProject}
        onUpdateProject={updateProject}
        onDeleteProject={deleteProject}
        onSignOut={signOut}
      />

      <main className="main">
        <div className="main-inner">
          {/* Done is the one view you cannot capture from — it is a record, not
              a place to add work. The search takes the same slot so the top of
              the page keeps its shape between views. */}
          {view.kind === 'done' ? (
            <DoneSearch value={query} onChange={setQuery} />
          ) : (
            <Capture
              projects={projects}
              view={view}
              openTasks={tasks}
              resetSignal={resetCapture}
              onCreate={createTask}
              onNudge={showNudge}
            />
          )}

          {nudge ? (
            <p className="nudge" data-shake={nudge.shake || undefined} role="status">
              {nudge.text}
            </p>
          ) : null}

          {view.kind === 'done' && !searching ? (
            <DoneSummary tasks={tasks} />
          ) : null}

          {error ? (
            <p className="error-note" role="alert" onClick={() => setError(null)}>
              {error}
            </p>
          ) : null}

          <header className="view-header">
            <h1 className="view-title">{title}</h1>
            {/* `detail` is the browser's own click counter, so a triple-click
                needs no timers of our own. */}
            <span
              className="view-count"
              onClick={(e) => {
                if (e.detail === 3) setShowLifetime(true)
              }}
            >
              {countLabel}
            </span>
          </header>

          {avalanche ? <p className="avalanche">{avalanche}</p> : null}

          {visible.length === 0 ? (
            <div className="empty">
              {justCleared ? <Confetti /> : null}
              <p className="empty-title">{empty.title}</p>
              <p className="empty-hint">{empty.hint}</p>
              <div className="empty-marks" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          ) : (
            /* Keyed on the view so switching remounts the rows and the stagger
               plays. Rows are keyed by task id inside a view, so this never
               fires when a single task is completed or deleted. */
            <ul className="task-list" key={viewKey(view)}>
              {visible.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  projects={projects}
                  expanded={expandedId === task.id}
                  completing={completing.has(task.id)}
                  entering={enteringId === task.id}
                  deleting={deletingId === task.id}
                  restoring={restoringId === task.id}
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
