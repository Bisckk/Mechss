import { createClient } from '@/lib/supabase/server'
import DashboardAnimator from '@/components/ui/DashboardAnimator'
import EmpleadosClient from '@/components/admin/empleados/EmpleadosClient'

export const metadata = {
    title: 'Empleados | MotoFix Admin',
}

export default async function AdminEmpleadosPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
        .from('users')
        .select('workshop_id')
        .eq('id', user.id)
        .single()

    const workshopId = (profile as any)?.workshop_id

    let employees: any[] = []

    if (workshopId) {
        const { data } = await supabase
            .from('users')
            .select('id, full_name, email, phone, role, is_active, avatar_url, created_at')
            .eq('workshop_id', workshopId)
            .in('role', ['mechanic', 'receptionist'])
            .order('created_at', { ascending: false })

        employees = data || []
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <DashboardAnimator />
            <EmpleadosClient initialEmployees={employees} />
        </div>
    )
}
