import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import LandingClient from './LandingClient'

export const dynamic = 'force-dynamic' // Evitar caché estático del 404

// Cliente de Supabase con Service Role para BYPASS RLS en páginas públicas de solo lectura
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const slug = (await params).slug

    const { data: config } = await supabaseAdmin
        .from('workshop_landing_pages')
        .select(`
            meta_title, meta_description, 
            workshops (name, logo_url)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

    const configAny = config as any
    const w = configAny?.workshops

    return {
        title: configAny?.meta_title || `${w?.name || 'Taller'} | Servicio Automotriz`,
        description: configAny?.meta_description || `Página oficial de ${w?.name || 'nuestro taller'}. Consulta el estado de tu vehículo en tiempo real.`,
    }
}

export default async function PublicLandingPage({ params }: { params: Promise<{ slug: string }> }) {
    const slug = (await params).slug
    const supabase = supabaseAdmin

    // Traer la configuración del Landing y la info del taller
    const { data: config, error } = await supabase
        .from('workshop_landing_pages')
        .select(`
            id, theme_preset, font_family, button_radius, primary_color, bg_color, blocks, slug, workshop_id,
            workshops (name, phone)
        `)
        .eq('slug', slug)
        // .eq('is_published', true) -- Quitamos esto por ahora para que puedan probar en "vivo" inmediatamente
        .single()

    if (error || !config) {
        console.error("LANDING PAGE FETCH ERROR:", error, "Config:", config, "Slug:", slug)
        notFound()
    }

    const configData = config as any
    const workshop = configData.workshops

    // Fetch published products
    const { data: products } = await supabase
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
