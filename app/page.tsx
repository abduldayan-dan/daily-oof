import { redirect } from 'next/navigation'

import type { Project, Task } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

import { Workspace } from './workspace'

export default async function Home() {
  const supabase = await createClient()

  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) redirect('/login')

  // Fetched on the server so the list is painted on first load rather than
  // flashing empty. RLS scopes both queries to this user; there is no filter
  // here by design, because a filter in application code would imply the
  // policy is not the real boundary.
  const [tasks, projects] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('projects')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: true }),
  ])

  return (
    <Workspace
      initialTasks={(tasks.data as Task[]) ?? []}
      initialProjects={(projects.data as Project[]) ?? []}
      email={(data.claims.email as string) ?? ''}
      userId={data.claims.sub as string}
    />
  )
}
