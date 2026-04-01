import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuperAdminShell from '@/components/superadmin/layout/SuperAdminShell'
import type { UserRole } from '@/lib/supabase/types'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, full_name, email, avatar_url')
    .eq('id', user.id)
    .single()

  type ProfileRow = { role: UserRole; full_name: string; email: string; avatar_url: string | null }
  const p = profile as unknown as ProfileRow | null

  if (p?.role !== 'superadmin') redirect('/login')

  return (
    <SuperAdminShell
      user={{
        full_name:  p!.full_name,
        email:      p!.email,
        avatar_url: p!.avatar_url,
      }}
    >
      {children}
    </SuperAdminShell>
  )
}
