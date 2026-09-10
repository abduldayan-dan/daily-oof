'use client'

import { useEffect, useState } from 'react'

import type { Priority, Project, View } from '@/lib/types'

export type Draft = {
  title: string
  project_id: string | null
  due_date: string | null
  priority: Priority | null
}

/**
 * Prompts rotate while the field is empty. Cheapest personality in the app —
 * it costs no motion and no pixels, only words.
 */
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
  const [promptIndex, setPromptIndex] = useState(0)
  const [prompts, setPrompts] = useState<string[]>(DEFAULT_PROMPTS)
  const [thunk, setThunk] = useState(false)

  useEffect(() => {
    setPrompts(promptsForHour(new Date().getHours()))
  }, [])

  // Never swap the prompt out from under someone mid-sentence.
  useEffect(() => {
    if (title) return
    const id = setInterval(() => setPromptIndex((i) => i + 1), PROMPT_MS)
    return () => clearInterval(id)
  }, [title])

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

    // Restart the thunk even on rapid captures: dropping the attribute for a
    // frame is what lets the animation replay.
    setThunk(false)
    requestAnimationFrame(() => setThunk(true))

    // Clear the title but keep the attributes: capturing five tasks for the
    // same project in a row is common, re-picking it five times is not.
    setTitle('')
  }

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
          placeholder={prompts[promptIndex % prompts.length]}
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
