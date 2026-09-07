import { redirect } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'

import { Brand } from '../brand'
import { SignInButton } from './sign-in-button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (data?.claims) redirect('/')

  const { error } = await searchParams

  return (
    <main className="centred">
      <div className="card">
        <Brand />

        <div>
          <h1 className="card-title">tasks</h1>
          <p className="card-text">A quiet place for your own work.</p>
        </div>

        {error ? (
          <p className="error-note" role="alert">
            {error}
          </p>
        ) : null}

        <SignInButton />
      </div>
    </main>
  )
}
