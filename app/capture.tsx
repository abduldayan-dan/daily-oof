'use client'

import { useEffect, useRef, useState } from 'react'

import { todayISO } from '@/lib/dates'
import {
  EMPTY_NAGS,
  STREAK_TARGET,
  STREAK_WINDOW_MS,
  findDuplicate,
} from '@/lib/eggs'
import type { Priority, Project, Task, View } from '@/lib/types'

export type Draft = {
  title: string
  project_id: string | null
  due_date: string | null
  priority: Priority | null
}

export type Nudge = { text: string; shake?: boolean }

/**
 * Rendered on the server too, so this must be the same on both sides. The
 * hour-aware set is swapped in after mount — computing the time during render
 * would mismatch whenever the server and the browser disagree about the clock.
 */
const DEFAULT_PROMPTS = [
  "what's the oof?",
  'what are you avoiding?',
  'go on, admit it',
]

function promptsForHour(hour: number): string[] {
  if (hour >= 21 || hour < 5) {
    return ['go home', 'this can wait until tomorrow', 'still up?']
  }
  if (hour >= 17) {
    return ['still here?', 'one more, then?', "what's left?"]
  }
  if (hour >= 12) {
    return ["what's nagging you?", 'name the dread', 'what are you avoiding?']
  }
  return DEFAULT_PROMPTS
}

const PROMPT_MS = 4000

/**
 * The whole app is arranged around this input. It is autofocused, it is never
 * in a modal, and Enter alone is enough to save. The attribute row below stays
 * collapsed until someone reaches for it, because every control visible here is
 * a decision the user has to skip past before typing.
 */
export function Capture({
  projects,
  view,
  openTasks,
  resetSignal,
  onCreate,
  onNudge,
}: {
  projects: Project[]
  view: View
  openTasks: Task[]
  resetSignal: number
  onCreate: (draft: Draft) => void
  onNudge: (nudge: Nudge) => void
}) {
  const [title, setTitle] = useState('')
  const [showAttrs, setShowAttrs] = useState(false)
  const [projectId, setProjectId] = useState<string | null>(null)
  const [dueDate, setDueDate] = useState<string>('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [promptIndex, setPromptIndex] = useState(0)
  const [prompts, setPrompts] = useState<string[]>(DEFAULT_PROMPTS)
  const [thunk, setThunk] = useState(false)
  const [nagIndex, setNagIndex] = useState(0)

  // Captures inside the streak window, used to spot a brain-dump in progress.
  const recent = useRef<number[]>([])
  // The duplicate warning fires once per phrase; pressing Enter again saves it.
  const warnedFor = useRef<string | null>(null)

  useEffect(() => {
    setPrompts(promptsForHour(new Date().getHours()))
  }, [])

  // Never swap the prompt out from under someone mid-sentence.
  useEffect(() => {
    if (title) return
    const id = setInterval(
      () => setPromptIndex((i) => (i + 1) % prompts.length),
      PROMPT_MS,
    )
    return () => clearInterval(id)
  }, [title, prompts.length])

  // The konami sequence ends in "b a", which lands in this field. Clearing it
  // here keeps the unlock from leaving litter behind.
  useEffect(() => {
    if (resetSignal > 0) setTitle('')
  }, [resetSignal])

  // Capturing inside a view should inherit that view's context, but never
  // require it. Adding a task while looking at Today and having it not appear
  // in Today is the kind of thing that quietly erodes trust in the list.
  const effectiveProjectId =
    projectId ?? (view.kind === 'project' ? view.projectId : null)

  const effectiveDueDate =
    dueDate || (view.kind === 'today' ? todayISO() : null)

  function trackStreak() {
    const now = Date.now()
    recent.current = [...recent.current, now].filter(
      (t) => now - t < STREAK_WINDOW_MS,
    )
    if (recent.current.length >= STREAK_TARGET) {
      recent.current = []
      onNudge({ text: 'on a roll.' })
    }
  }

  function submit() {
    const trimmed = title.trim()

    // Enter on an empty field: escalate rather than doing nothing at all.
    if (!trimmed) {
      setNagIndex((i) => Math.min(i + 1, EMPTY_NAGS.length))
      return
    }

    const key = trimmed.toLowerCase()

    // Warn once about an exact duplicate, then get out of the way. The text
    // stays in the field either way, so nothing is ever lost.
    if (warnedFor.current !== key && findDuplicate(openTasks, trimmed)) {
      warnedFor.current = key
      onNudge({ text: 'you already said that.' })
      return
    }
    warnedFor.current = null

    onCreate({
      title: trimmed.slice(0, 500),
      project_id: effectiveProjectId,
      due_date: effectiveDueDate,
      priority: priority || null,
    })

    // The task is still created — an easter egg that eats your input is a bug.
    if (key === 'oof') {
      onNudge({ text: "we've all been there.", shake: true })
    }

    trackStreak()

    // Restart the thunk even on rapid captures: dropping the attribute for a
    // frame is what lets the animation replay.
    setThunk(false)
    requestAnimationFrame(() => setThunk(true))

    // Clear the title but keep the attributes: capturing five tasks for the
    // same project in a row is common, re-picking it five times is not.
    setTitle('')
    setNagIndex(0)
  }

  const placeholder =
    nagIndex > 0
      ? EMPTY_NAGS[Math.min(nagIndex, EMPTY_NAGS.length) - 1]
      : prompts[promptIndex % prompts.length]

  return (
    <div className="capture">
      <div
        className="capture-field"
        data-thunk={thunk || undefined}
        onAnimationEnd={() => setThunk(false)}
      >
        <input
          className="capture-input"
          value={title}
          autoFocus
          maxLength={500}
          placeholder={placeholder}
          aria-label="New task"
          onChange={(e) => {
            setTitle(e.target.value)
            if (nagIndex) setNagIndex(0)
          }}
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

            {/* Shows the inherited date rather than an empty box, so the
                default is visible and can be overridden. */}
            <input
              className="attr-control"
              type="date"
              aria-label="Due date"
              value={effectiveDueDate ?? ''}
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
              nevermind
            </button>
          </>
        ) : (
          // Names the three controls it reveals. "pin it down" read as
          // atmosphere — nobody guessed a due date was behind it. A
          // comma-separated noun list also sits better in mono than a sentence.
          <button className="attr-toggle" onClick={() => setShowAttrs(true)}>
            + date, project, priority
          </button>
        )}
      </div>
    </div>
  )
}
