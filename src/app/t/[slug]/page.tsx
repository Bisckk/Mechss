import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import LandingClient from './LandingClient'

export const dynamic = 'force-dynamic'

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const slug = (await params).slug
    const supabaseAdmin = getAdminClient()

    const { data: config } = await supabaseAdmin
        .from('workshop_landing_pages')
        .select(`meta_title, meta_description, logo_url, workshops (name)`)
        .eq('slug', slug)
        .single()

    const configAny = config as any
    const w = configAny?.workshops
    const logoUrl: string | null = configAny?.logo_url ?? null

    return {
        title: configAny?.meta_title || `${w?.name || 'Taller'} | Servicio Automotriz`,
        description: configAny?.meta_description || `Página oficial de ${w?.name || 'nuestro taller'}. Consulta el estado de tu vehículo en tiempo real.`,
        ...(logoUrl && { icons: { icon: logoUrl, apple: logoUrl } }),
    }
}

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug
    const supabaseAdmin = getAdminClient()

    const { data: config, error } = await supabaseAdmin
        .from('workshop_landing_pages')
        .select(`
            id, theme_preset, font_family, button_radius, primary_color, bg_color, blocks, slug, workshop_id,
            logo_url, cover_url,
            workshops (name, phone)
        `)
        .eq('slug', slug)
        .single()

    if (error || !config) {
        notFound()
    }

    const configData = config as any
    const workshop = configData.workshops

    const { data: products } = await supabaseAdmin
        .from('inventory_items')
        .select('id, name, description, sale_price, image_url, category, stock_quantity')
        .eq('workshop_id', configData.workshop_id)
        .eq('is_published', true)

    return (
        <LandingClient
            config={configData}
            workshop={workshop}
            products={products || []}
        />
    )
}
