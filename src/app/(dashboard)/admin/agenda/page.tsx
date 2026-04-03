import { createClient } from '@/lib/supabase/server'
import AgendaClient from '@/components/admin/agenda/AgendaClient'
import type { Appointment } from '@/components/admin/agenda/AgendaClient'

export const metadata = {
    title: 'Agenda | MotoFix Admin',
}

export default async function AdminAgendaPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    let initialAppointments: Appointment[] = []

    if (user) {
        // RLS policy "appointments: admin+receptionist all" scopes results to the
        // user's workshop via get_my_workshop_id() at the DB level.
        // This removes one sequential round-trip vs. fetching workshop_id first.
        const { data: dbAppointments } = await supabase
            .from('appointments')
            .select(`
                id, title, description, scheduled_at, status, vehicle_info,
                clients!inner ( full_name )
            `)
            .order('scheduled_at', { ascending: true })

        if (dbAppointments && dbAppointments.length > 0) {
            initialAppointments = dbAppointments.map((a: any) => ({
                id: a.id,
                clientName: a.clients?.full_name || 'Sin cliente',
                vehicle: a.vehicle_info || a.title || '',
                date: new Date(a.scheduled_at),
                reason: a.description || a.title || '',
                status: a.status as Appointment['status'],
            }))
        }
    }

    return <AgendaClient initialAppointments={initialAppointments} />
}
