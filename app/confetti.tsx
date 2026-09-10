'use client'

import { useMemo } from 'react'

import { PROJECT_COLORS } from '@/lib/colors'

const PIECES = 16

/**
 * Fires once when you clear an entire view.
 *
 * Hard-edged squares in the project palette — no blur, no gravity, no physics
 * library. The point is that it belongs to the same brutalist system as
 * everything else, and that it is rare. Seen weekly it is charming; seen on
 * every completed task it would cheapen the completion animation, which is the
 * moment that actually matters.
 */
export function Confetti() {
  // Randomised once per mount. This only ever renders in response to a click,
  // so there is no server render for it to mismatch against.
  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        left: Math.round(Math.random() * 94),
        delay: Math.round(Math.random() * 160),
        duration: 700 + Math.round(Math.random() * 500),
        distance: 150 + Math.round(Math.random() * 150),
        rotate: Math.round(Math.random() * 220 - 110),
        color: PROJECT_COLORS[i % PROJECT_COLORS.length].key,
      })),
    [],
  )

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece project-dot"
          data-color={p.color}
          style={
            {
              left: `${p.left}%`,
              '--fall-delay': `${p.delay}ms`,
              '--fall-ms': `${p.duration}ms`,
              '--fall-distance': `${p.distance}px`,
              '--fall-rotate': `${p.rotate}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
