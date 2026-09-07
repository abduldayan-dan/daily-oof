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
      ? `Sign in with your ${domains.map((d) => `@${d}`).join(' or ')} account.`
      : 'That account is not permitted.'

  return (
    <main className="centred">
      <div className="card">
        <Brand />

        <div>
          <h1 className="card-title">wrong account</h1>
          <p className="card-text">
            {requirement} You have been signed out of the account you just used.
          </p>
        </div>

        <Link className="button" href="/login">
          try a different account
        </Link>
      </div>
    </main>
  )
}
