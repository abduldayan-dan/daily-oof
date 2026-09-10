'use client'

import { useEffect, useRef, useState } from 'react'

import type { Task } from '@/lib/types'

const COUNT_MS = 700
const DAY = 24 * 60 * 60 * 1000

/**
 * Counts up from zero on mount.
 *
 * The whole point of the Done screen is to feel good, and a number that lands
 * instantly reads as data while a number that climbs reads as an achievement.
 * Roboto Mono is monospaced so the digits do not reflow as they change.
 */
function useCountUp(target: number) {
  const [value, setValue] = useState(target)
  const frame = useRef(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced || target === 0) {
      setValue(target)
      return
    }

    const start = performance.now()
    setValue(0)

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_MS)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target])

  return value
}

function Stat({ value, label }: { value: number; label: string }) {
  const shown = useCountUp(value)
  return (
    <div className="stat">
      <span className="stat-value">{shown}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

/** Something warmer than a number, without pretending every week is a triumph. */
function headline(week: number, total: number): string {
  if (total === 0) return 'nothing finished yet'
  if (week === 0) return 'quiet week, but it all still counts'
  if (week >= 15) return 'genuinely, that is a lot'
  if (week >= 5) return 'look at you go'
  return 'chipping away at it'
}

export function DoneSummary({ tasks }: { tasks: Task[] }) {
  // Only mounts when the Done view is opened, which is always client-side, so
  // reading the clock during render cannot cause a hydration mismatch.
  const now = Date.now()
  const done = tasks.filter((t) => t.completed_at)

  const since = (days: number) =>
    done.filter((t) => now - new Date(t.completed_at!).getTime() < days * DAY)
      .length

  const week = since(7)
  const month = since(30)

  return (
    <div className="done-summary">
      <p className="done-headline">{headline(week, done.length)}</p>
      <div className="done-stats">
        <Stat value={week} label="this week" />
        <Stat value={month} label="this month" />
        <Stat value={done.length} label="all time" />
      </div>
    </div>
  )
}
