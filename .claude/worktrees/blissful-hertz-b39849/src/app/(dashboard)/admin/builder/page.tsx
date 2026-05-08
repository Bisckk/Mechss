import { Metadata } from 'next'
import { getLandingPageConfigAction } from '@/lib/actions/builder'
import { createClient } from '@/lib/supabase/server'
import BuilderClient from './BuilderClient'

export const metadata: Metadata = {
    title: 'Constructor de Landing Page | MotoFix',
}

export default async function BuilderPage() {
    // 1. Fetch Config
    const res = await getLandingPageConfigAction()
    const config = res.ok ? res.data : null

    // 2. Fetch Workshop data & Products
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let workshop = { name: 'Taller Demo', phone: '+1234567890' }
    let products = []

    const workshopId = config?.workshop_id
    if (user && workshopId) {
        const { data: wData } = await supabase.from('workshops').select('name, phone').eq('id', workshopId).single()
        if (wData) workshop = wData as any

        const { data: pData } = await supabase.from('inventory_items').select('*').eq('workshop_id', workshopId).eq('is_published', true)
        if (pData) products = pData as any
    }

    return (
        <BuilderClient
            initialConfig={config}
            workshop={workshop}
            products={products}
        />
    )
}
