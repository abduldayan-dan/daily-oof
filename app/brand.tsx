'use client'

import { useState } from 'react'

import { PROJECT_COLORS } from '@/lib/colors'

const UNLOCK_AT = 5

/**
 * Brand lockup for Daily Oof, set in the Nurture design system.
 *
 * The wordmark is DM Serif Display rather than a traced copy of the Nurture
 * leaf mark — an approximated logo is worse than no logo.
 *
 * To use the real mark: drop the asset at `public/nurture-mark.svg` (white
 * artwork, transparent background, square viewBox — the orange tile comes from
 * `.brand-mark`) and swap the commented line below.
 *
 * Pass `as="h1"` with `large` on pages where the lockup *is* the heading, so
 * the name is not repeated immediately beneath itself.
 *
 * Clicking it five times starts cycling the tile through the project palette.
 * Harmless, and it quietly shows off the twelve pastels.
 */
export function Brand({
  as: Tag = 'div',
  large = false,
}: {
  as?: 'div' | 'h1'
  large?: boolean
}) {
  const [clicks, setClicks] = useState(0)

  const unlocked = clicks >= UNLOCK_AT
  const colour = unlocked
    ? PROJECT_COLORS[(clicks - UNLOCK_AT) % PROJECT_COLORS.length].key
    : null

  return (
    <Tag className="brand" data-large={large || undefined}>
      <span
        className="brand-mark"
        aria-hidden="true"
        onClick={() => setClicks((c) => c + 1)}
        style={colour ? { background: `var(--project-${colour})` } : undefined}
      >
        {/* <img src="/nurture-mark.svg" alt="" /> */}
      </span>
      <span className="brand-wordmark">daily oof</span>
    </Tag>
  )
}
