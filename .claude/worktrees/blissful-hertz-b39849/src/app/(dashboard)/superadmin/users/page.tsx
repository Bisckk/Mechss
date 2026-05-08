import { createClient } from '@/lib/supabase/server'
import AdminUsersList from '@/components/superadmin/users/AdminUsersList'
import type { AdminUser, PlanOption } from '@/components/superadmin/users/AdminUsersList'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('users')
    .select('id, full_name, email, role, is_active, created_at, workshop_id, workshops(name)')
    .eq('role', 'admin')
    .order('created_at', { ascending: false })

  const { data: wsData } = await supabase
    .from('workshops')
    .select('id, name')
    .order('name', { ascending: true })

  const { data: plansData } = await supabase
    .from('plans')
    .select('id, name')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true })

  const users = (data ?? []) as unknown as AdminUser[]
  const workshops = (wsData ?? []) as { id: string; name: string }[]
  const planOptions = (plansData ?? []) as PlanOption[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Usuarios Admin
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          {users.length} cuenta{users.length !== 1 ? 's' : ''} Admin en todos los talleres.
        </p>
      </div>
      <AdminUsersList users={users} workshops={workshops} planOptions={planOptions} />
    </div>
  )
}
