import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LandingClient from './LandingClient'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const slug = (await params).slug
    const supabase = await createClient()

    const { data: config } = await supabase
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
    const supabase = await createClient()

    // Traer la configuración del Landing y la info del taller
    const { data: config, error } = await supabase
        .from('workshop_landing_pages')
        .select(`
            id, theme_preset, font_family, button_radius, primary_color, bg_color, blocks, slug,
            workshops (name, phone, map_url)
        `)
        .eq('slug', slug)
        // .eq('is_published', true) -- Quitamos esto por ahora para que puedan probar en "vivo" inmediatamente
        .single()

    if (error || !config) {
        notFound()
    }

    const configData = config as any
    const workshop = configData.workshops

    return (
        <LandingClient
            config={configData}
            workshop={workshop}
        />
    )
}
