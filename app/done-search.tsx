'use client'

/**
 * Takes the slot the capture field occupies everywhere else.
 *
 * Two things at once: you cannot create a task from the Done screen, which was
 * always slightly odd, and finding something you finished weeks ago stops
 * meaning scrolling. Reuses the capture styling so the top of the page keeps
 * its shape as you move between views.
 */
export function DoneSearch({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="capture">
      <div className="capture-field">
        <SearchIcon />
        <input
          className="capture-input"
          value={value}
          placeholder="search what you finished"
          aria-label="Search completed tasks"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onChange('')
          }}
        />
        {value ? (
          <button
            className="attr-toggle"
            onClick={() => onChange('')}
            aria-label="Clear search"
          >
            clear
          </button>
        ) : null}
      </div>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      aria-hidden="true"
      style={{ flexShrink: 0, color: 'var(--text-chrome)' }}
    >
      <circle
        cx="7"
        cy="7"
        r="4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M10.4 10.4L14 14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="square"
      />
    </svg>
  )
}
