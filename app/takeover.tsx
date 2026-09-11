'use client'

import { useEffect } from 'react'

export type TakeoverContent = {
  title: string
  subtitle?: string
  ms?: number
}

const BARS = 12
const DEFAULT_MS = 1900

/**
 * Full-page moment, used by the handful of events rare enough to earn one:
 * clearing everything, the first open of the day, signing out, an anniversary.
 *
 * Twelve pastel bars sweep up, the line lands, everything leaves. Hard edges and
 * flat colour, so it belongs to the same system as the rest of the app rather
 * than looking like a library was dropped in.
 *
 * Only one can be on screen at a time — the queue lives in Workspace. Clicking
 * dismisses early, because a takeover you cannot skip is an obstacle.
 */
export function Takeover({
  content,
  onDone,
}: {
  content: TakeoverContent
  onDone: () => void
}) {
  useEffect(() => {
    const id = setTimeout(onDone, content.ms ?? DEFAULT_MS)
    return () => clearTimeout(id)
  }, [content, onDone])

  return (
    <div
      className="takeover"
      role="status"
      aria-live="polite"
      onClick={onDone}
    >
      <div className="takeover-sweep" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      <div className="takeover-copy">
        <p className="takeover-title">{content.title}</p>
        {content.subtitle ? (
          <p className="takeover-subtitle">{content.subtitle}</p>
        ) : null}
      </div>
    </div>
  )
}
