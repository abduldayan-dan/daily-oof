'use client'

import { useEffect, useMemo } from 'react'

import { PROJECT_COLORS } from '@/lib/colors'

export type TakeoverContent = {
  /** Small mono line above the title — "easter egg", "milestone", and so on. */
  kicker?: string
  title: string
  subtitle?: string
  ms?: number
  /** `burst` adds confetti thrown out from the centre. */
  tone?: 'sweep' | 'burst'
}

const BARS = 12
const BURST_PIECES = 18
const DEFAULT_MS = 2200

/**
 * Full-page moment.
 *
 * Used for anything rare or earned: discovering an egg, hitting a milestone,
 * clearing the whole list, the first open of a day. A one-line nudge at the top
 * of the page was never going to carry "you found a secret" — the whole point
 * is that it interrupts you.
 *
 * Twelve bars close from alternating directions, the title arrives a word at a
 * time, it holds long enough to actually read, then everything leaves. Hard
 * edges and flat colour throughout, so it belongs to the same system as the
 * rest of the app rather than looking like a library was dropped in.
 *
 * Deliberately NOT used for functional feedback — a duplicate warning or an
 * undo confirmation must never take the screen away mid-capture.
 */
export function Takeover({
  content,
  onDone,
}: {
  content: TakeoverContent
  onDone: () => void
}) {
  const ms = content.ms ?? DEFAULT_MS

  useEffect(() => {
    const id = setTimeout(onDone, ms)
    return () => clearTimeout(id)
  }, [content, ms, onDone])

  // Split on spaces so each word can arrive on its own beat.
  const words = useMemo(() => content.title.split(' '), [content.title])

  const burst = useMemo(() => {
    if (content.tone !== 'burst') return []
    return Array.from({ length: BURST_PIECES }, (_, i) => {
      const angle = (i / BURST_PIECES) * Math.PI * 2
      const distance = 160 + Math.random() * 220
      return {
        x: Math.round(Math.cos(angle) * distance),
        y: Math.round(Math.sin(angle) * distance),
        rotate: Math.round(Math.random() * 300 - 150),
        delay: Math.round(260 + Math.random() * 240),
        colour: PROJECT_COLORS[i % PROJECT_COLORS.length].key,
      }
    })
  }, [content.tone])

  return (
    <div
      className="takeover"
      role="status"
      aria-live="polite"
      onClick={onDone}
      style={{ '--dur': `${ms}ms` } as React.CSSProperties}
    >
      <div className="takeover-sweep" aria-hidden="true">
        {Array.from({ length: BARS }, (_, i) => (
          <span key={i} style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      {burst.length > 0 ? (
        <div className="takeover-burst" aria-hidden="true">
          {burst.map((p, i) => (
            <span
              key={i}
              className="project-dot"
              data-color={p.colour}
              style={
                {
                  '--bx': `${p.x}px`,
                  '--by': `${p.y}px`,
                  '--br': `${p.rotate}deg`,
                  '--bd': `${p.delay}ms`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ) : null}

      <div className="takeover-copy">
        {content.kicker ? (
          <p className="takeover-kicker">{content.kicker}</p>
        ) : null}

        <p className="takeover-title">
          {words.map((word, i) => (
            <span key={i} style={{ '--w': i } as React.CSSProperties}>
              {word}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </p>

        {content.subtitle ? (
          <p className="takeover-subtitle">{content.subtitle}</p>
        ) : null}

        <p className="takeover-dismiss" aria-hidden="true">
          click to dismiss
        </p>
      </div>
    </div>
  )
}
