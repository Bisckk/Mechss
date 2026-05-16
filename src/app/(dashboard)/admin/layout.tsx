import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminShell from '@/components/admin/layout/AdminShell'
import { getWorkshopPlanInfo } from '@/lib/actions/subscription'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) redirect('/login')

    const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, full_name, email, avatar_url, workshop_id, workshops(name)')
        .eq('id', user.id)
        .single()

    const profileAny = profile as any

    if (profileError || !profile) redirect('/login')

    const allowedRoles = ['admin', 'mechanic', 'receptionist']
    if (!allowedRoles.includes(profileAny.role)) redirect('/login')

    // ── Subscription check (skip for non-admins: mechanics/receptionists can't fix it) ──
    let planInfo = null
    if (profileAny.role === 'admin' && profileAny.workshop_id) {
        const planResult = await getWorkshopPlanInfo()
        if (planResult.ok) {
            planInfo = planResult.data
            if (planInfo.isBlocked) {
                redirect('/suscripcion-vencida')
            }
        }
    }

    const workshopName = profileAny.workshops?.name ?? null

    return (
        <AdminShell
            user={{
                full_name: profileAny.full_name,
                email: profileAny.email,
                avatar_url: profileAny.avatar_url,
                role: profileAny.role,
                workshop_name: workshopName,
            }}
            planInfo={planInfo}
        >
            {children}
        </AdminShell>
    )
}
