import Link from 'next/link'

import { allowedDomains } from '@/lib/auth/allowed-domains'

import { Brand } from '../../brand'

export default function NotAllowedPage() {
  const domains = allowedDomains()

  // Name the domain rather than saying "an approved domain". Someone who just
  // signed in with a personal Gmail should be able to see why it failed without
  // having to ask anyone.
  const requirement =
    domains.length > 0
      ? `daily oof is ${domains.map((d) => `@${d}`).join(' / ')} only.`
      : 'that account is not on the list.'

  return (
    <main className="centred">
      <div className="card">
        <Brand />

        <div>
          <h1 className="card-title">not on the list.</h1>
          <p className="card-text">
            {requirement} we&rsquo;ve signed you out of the one you just used.
          </p>
        </div>

        <Link className="button" href="/login">
          try your work account
        </Link>
      </div>
    </main>
  )
}
