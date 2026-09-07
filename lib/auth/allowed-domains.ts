/**
 * Sign-in gate.
 *
 * Supabase's Google provider will happily accept *any* Google account, so
 * without this the deployed URL is open to anyone on the internet who finds it.
 * RLS still keeps their data separate from yours, but you would be running an
 * open sign-up page on a work tool.
 *
 * Set ALLOWED_EMAIL_DOMAINS to a comma-separated list, e.g.
 *   ALLOWED_EMAIL_DOMAINS=yourcompany.com,yourcompany.co.uk
 *
 * Leave it unset and everyone is allowed — deliberately permissive so a missing
 * env var can never lock you out of your own app.
 */
export function allowedDomains(): string[] {
  return (process.env.ALLOWED_EMAIL_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean)
}

export function isAllowedEmail(email: string | undefined | null): boolean {
  const domains = allowedDomains()
  if (domains.length === 0) return true
  if (!email) return false

  const domain = email.toLowerCase().split('@').pop()
  if (!domain) return false

  // Match the domain itself or any subdomain of it, but never a suffix match —
  // "notyourcompany.com" must not pass a "yourcompany.com" rule.
  return domains.some((d) => domain === d || domain.endsWith(`.${d}`))
}
