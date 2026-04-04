'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// ── Types ──────────────────────────────────────────────────

export interface LandingPageConfig {
    id: string
    workshop_id: string
    slug: string
    is_published: boolean
    theme_preset: string
    font_family: string
    button_radius: string
    primary_color: string
    bg_color: string
    blocks: any[]
    meta_title: string | null
    meta_description: string | null
}

export type SaveLandingPageParams = Partial<Omit<LandingPageConfig, 'id' | 'workshop_id'>>

// ── Helpers ────────────────────────────────────────────────

async function getWorkshopId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: profile } = await supabase
        .from('users')
        .select('workshop_id, role')
        .eq('id', user.id)
        .single()

    const profileAny = profile as any

    if (profileAny?.workshop_id) {
        return { supabase, workshopId: profileAny.workshop_id, userId: user.id }
    }

    if (profileAny?.role === 'superadmin') {
        const { data: workshop } = await supabase
            .from('workshops')
            .select('id')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()

        const workshopAny = workshop as any
        if (workshopAny?.id) {
            return { supabase, workshopId: workshopAny.id, userId: user.id }
        }
    }

    throw new Error('No workshop assigned')
}

// ── Actions ────────────────────────────────────────────────

// Get current landing page config (creates default if it doesn't exist)
export async function getLandingPageConfigAction(): Promise<{ ok: true; data: LandingPageConfig } | { ok: false; error: string }> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        // 1. Try to fetch existing
        const { data, error } = await supabase
            .from('workshop_landing_pages')
            .select('*')
            .eq('workshop_id', workshopId)
            .single()

        if (data) {
            return { ok: true, data: data as LandingPageConfig }
        }

        if (error && error.code !== 'PGRST116') { // PGRST116 is "Not Found" error
            throw error
        }

        // 2. If no config exists, generate a default slug based on workshop name
        const { data: workshop } = await supabase
            .from('workshops')
            .select('name, brand_color')
            .eq('id', workshopId)
            .single()

        const w = workshop as any
        const safeSlug = w?.name ? w.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000) : 'taller-' + Date.now()

        const defaultBlocks = [
            { id: 'hero_1', type: 'hero', visible: true, content: { title: `Bienvenido a ${w?.name || 'Nuestro Taller'}`, subtitle: 'Expertos en cuidado y mantenimiento de motocicletas.' } },
            { id: 'track_1', type: 'tracking', visible: true, content: { title: 'Rastrea tu moto', subtitle: 'Ingresa tu código de seguimiento (#REP-XXX) para ver en tiempo real la reparación.' } }
        ]

        const { data: newConfig, error: insertError } = await (supabase.from('workshop_landing_pages') as any)
            .insert({
                workshop_id: workshopId,
                slug: safeSlug,
                primary_color: w?.brand_color || '#f97316',
                font_family: 'Inter',
                theme_preset: 'cyberpunk',
                blocks: defaultBlocks,
                is_published: false
            })
            .select()
            .single()

        if (insertError) throw insertError

        return { ok: true, data: newConfig as LandingPageConfig }

    } catch (e: any) {
        return { ok: false, error: e.message || 'Error fetching config' }
    }
}

// Update landing page config
export async function updateLandingPageConfigAction(
    updates: SaveLandingPageParams
): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
        const { supabase, workshopId } = await getWorkshopId()

        const { error } = await (supabase.from('workshop_landing_pages') as any)
            .update(updates)
            .eq('workshop_id', workshopId)

        if (error) {
            // Check for slug uniqueness error
            if (error.code === '23505') {
                return { ok: false, error: 'Ese enlace (slug) ya está en uso por otro taller. Por favor, elige uno diferente.' }
            }
            return { ok: false, error: error.message }
        }

        revalidatePath('/admin/builder')
        if (updates.slug) {
            revalidatePath(`/t/${updates.slug}`)
        }

        return { ok: true }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
