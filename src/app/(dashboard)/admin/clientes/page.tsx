import { createClient } from '@/lib/supabase/server'
import ClientesClient from './ClientesClient'

export const metadata = {
    title: 'Clientes | MotoFix Admin',
}

export default async function AdminClientesPage() {
    const supabase = await createClient()

    // Fetch clients and their count relationships
    const { data: clientsData, error } = await supabase
        .from('clients')
        .select(`
            *,
            vehicles:vehicles(count),
            appointments:appointments(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    const clients = ((clientsData as any[]) || []).map(c => ({
        ...c,
        vehicles_count: c.vehicles?.[0]?.count || 0,
        appointments_count: c.appointments?.[0]?.count || 0
    }))

    return <ClientesClient initialClients={clients} />
}
