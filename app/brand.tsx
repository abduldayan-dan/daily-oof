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
 */
export function Brand({
  as: Tag = 'div',
  large = false,
}: {
  as?: 'div' | 'h1'
  large?: boolean
}) {
  return (
    <Tag className="brand" data-large={large || undefined}>
      <span className="brand-mark" aria-hidden="true">
        {/* <img src="/nurture-mark.svg" alt="" /> */}
      </span>
      <span className="brand-wordmark">daily oof</span>
    </Tag>
  )
}
