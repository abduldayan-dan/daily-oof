/**
 * Project colours.
 *
 * DESIGN.md defines eight pastels. Two are unusable here:
 *   - hot-pink is not pastel, and DESIGN.md forbids pairing it with
 *     brand-orange — which is exactly the active nav background the dot sits
 *     inside, so it would break the rule on every selected project.
 * The remaining seven are used as-is; five more were added in the same family
 * to reach twelve. New additions are marked below so they are easy to review
 * against the brand.
 *
 * Values live in globals.css as --project-<key>. This file is the source of
 * truth for which keys exist and what order they appear in.
 */
export const PROJECT_COLORS = [
  { key: 'pink', label: 'pink' }, //        DESIGN.md  baby-pink
  { key: 'rose', label: 'rose' }, //        new
  { key: 'salmon', label: 'salmon' }, //    DESIGN.md  light-salmon
  { key: 'yellow', label: 'yellow' }, //    DESIGN.md  yellow
  { key: 'sand', label: 'sand' }, //        new
  { key: 'mint', label: 'mint' }, //        new
  { key: 'powder', label: 'powder' }, //    DESIGN.md  powder-blue
  { key: 'cyan', label: 'cyan' }, //        DESIGN.md  baby-cyan
  { key: 'sky', label: 'sky' }, //          DESIGN.md  baby-blue-eyes
  { key: 'lavender', label: 'lavender' }, // new
  { key: 'purple', label: 'purple' }, //    DESIGN.md  baby-purple
  { key: 'stone', label: 'stone' }, //      new (neutral, for uncoloured projects)
] as const

export type ProjectColor = (typeof PROJECT_COLORS)[number]['key']

const KEYS = PROJECT_COLORS.map((c) => c.key) as readonly string[]

export const DEFAULT_PROJECT_COLOR: ProjectColor = 'stone'

/**
 * Projects created before this palette existed carry values like 'slate' or
 * 'blue'. Map them forward rather than rendering an unstyled dot.
 */
const LEGACY: Record<string, ProjectColor> = {
  slate: 'stone',
  blue: 'sky',
  green: 'mint',
  amber: 'yellow',
  red: 'salmon',
  purple: 'purple',
}

export function normaliseColor(value: string | null | undefined): ProjectColor {
  if (!value) return DEFAULT_PROJECT_COLOR
  if (KEYS.includes(value)) return value as ProjectColor
  return LEGACY[value] ?? DEFAULT_PROJECT_COLOR
}

/**
 * Pick the least-used colour so a new project is never grey by default and
 * rarely collides with an existing one. This is what stops every project
 * looking identical, which is the current bug.
 */
export function nextColor(existing: Array<string | null | undefined>): ProjectColor {
  const used = new Map<ProjectColor, number>()
  for (const key of KEYS) used.set(key as ProjectColor, 0)
  for (const value of existing) {
    const key = normaliseColor(value)
    used.set(key, (used.get(key) ?? 0) + 1)
  }

  // Skip the neutral when auto-assigning; it is for people who deliberately
  // want a project to recede.
  let best: ProjectColor = PROJECT_COLORS[0].key
  let bestCount = Infinity
  for (const { key } of PROJECT_COLORS) {
    if (key === 'stone') continue
    const count = used.get(key) ?? 0
    if (count < bestCount) {
      best = key
      bestCount = count
    }
  }
  return best
}
