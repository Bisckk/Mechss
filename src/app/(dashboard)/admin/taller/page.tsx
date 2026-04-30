import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import TallerClient from './TallerClient'

export const metadata: Metadata = {
    title: 'Taller Activo | Panel Admin',
    description: 'Panel de control del taller con seguimiento de reparaciones en tiempo real.'
}

export default async function TallerPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userRole = 'admin'
    let userId = ''

    if (user) {
        userId = user.id
        const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()
        userRole = (profile as any)?.role || 'admin'
    }

    return <TallerClient userRole={userRole} userId={userId} />
}
