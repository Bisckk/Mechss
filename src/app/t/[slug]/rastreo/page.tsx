import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import RastreoClient from './RastreoClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params
    const admin = createAdminClient()

    const { data } = await admin
        .from('workshop_landing_pages')
        .select('meta_title, logo_url, workshops ( name )')
        .eq('slug', slug)
        .single()

    const d = data as any
    const nombre = d?.workshops?.name || 'Taller'

    return {
        title: `Rastrear mi Moto · ${nombre}`,
        description: `Consulta el estado de tu moto en ${nombre}. Ingresa tu código de seguimiento.`,
        ...(d?.logo_url && { icons: { icon: d.logo_url, apple: d.logo_url } }),
    }
}

export default async function RastreoTallerPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const admin = createAdminClient()

    const { data, error } = await admin
        .from('workshop_landing_pages')
        .select(`
            workshop_id, primary_color, bg_color, logo_url,
            workshops ( name, phone )
        `)
        .eq('slug', slug)
        .single()

    if (error || !data) notFound()

    const d = data as any
    const workshop = d.workshops as any

    return (
        <RastreoClient
            workshopId={d.workshop_id}
            workshopSlug={slug}
            workshopName={workshop?.name || 'Taller'}
            workshopPhone={workshop?.phone || null}
            logoUrl={d.logo_url || null}
            primaryColor={d.primary_color || '#f97316'}
            bgColor={d.bg_color || '#09090b'}
        />
    )
}
