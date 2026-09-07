/**
 * Brand lockup.
 *
 * The wordmark is set in DM Serif Display rather than being a traced copy of
 * the Nurture leaf mark — an approximated logo is worse than no logo.
 *
 * To use the real mark: drop the asset at `public/nurture-mark.svg` (white
 * artwork, transparent background, square viewBox — the orange tile comes from
 * `.brand-mark`) and swap the commented line below.
 */
export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        {/* <img src="/nurture-mark.svg" alt="" /> */}
      </span>
      <span className="brand-wordmark">nurture</span>
    </div>
  )
}
