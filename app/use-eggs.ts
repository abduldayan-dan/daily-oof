'use client'

import { useEffect } from 'react'

const KONAMI = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
]

/**
 * Listens on the window so it works regardless of focus — which matters,
 * because the capture field is autofocused and would otherwise swallow it.
 *
 * The trailing "b a" does type two characters into that field. Whoever calls
 * this is expected to clear the capture input on unlock; see resetCapture in
 * Workspace.
 */
export function useKonami(onUnlock: () => void) {
  useEffect(() => {
    let index = 0

    const onKey = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key

      if (key === KONAMI[index]) {
        index += 1
        if (index === KONAMI.length) {
          index = 0
          onUnlock()
        }
        return
      }

      // A wrong key restarts, but the key itself may be a valid first step.
      index = key === KONAMI[0] ? 1 : 0
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onUnlock])
}

/**
 * Fires once after `ms` of no interaction. Any input resets the clock, and
 * `active` lets the caller stop re-arming while the idle state is showing.
 */
export function useIdle(ms: number, active: boolean, onIdle: () => void) {
  useEffect(() => {
    if (!active) return

    let timer: ReturnType<typeof setTimeout>
    const events = [
      'keydown',
      'mousemove',
      'mousedown',
      'wheel',
      'touchstart',
    ] as const

    const reset = () => {
      clearTimeout(timer)
      timer = setTimeout(onIdle, ms)
    }

    events.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    reset()

    return () => {
      clearTimeout(timer)
      events.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [ms, active, onIdle])
}
