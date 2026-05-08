'use server'

import { createClient } from '@/lib/supabase/server'

type TrackingResult = {
    repair: {
        id: string
        tracking_code: string
        status: string
        reported_issue: string
        created_at: string
        estimated_completion: string | null
        vehicle_brand: string | null
        vehicle_model: string | null
        vehicle_year: number | null
        vehicle_plate: string | null
    }
    updates: {
        id: string
        status: string
        notes: string
        photos: string[]
        created_at: string
    }[]
    workshop: {
        name: string
        phone: string | null
    } | null
}

export async function lookupTrackingCodeAction(
    code: string
): Promise<{ ok: true; data: TrackingResult } | { ok: false; error: string }> {
    try {
        const supabase = await createClient()

        // Lookup repair by tracking code
        const { data: repair, error } = await supabase
            .from('repairs')
            .select(`
                id, tracking_code, status, reported_issue, created_at,
                estimated_completion, vehicle_brand, vehicle_model,
                vehicle_year, vehicle_plate, workshop_id
            `)
            .eq('tracking_code', code.trim().toUpperCase())
            .single()

        if (error || !repair) {
            return { ok: false, error: 'No se encontró ninguna orden con ese código de seguimiento.' }
        }

        const repairAny = repair as any

        // Fetch only client-visible updates
        const { data: updates } = await supabase
            .from('repair_updates')
            .select('id, status, notes, photos, created_at')
            .eq('repair_id', repairAny.id)
            .eq('is_client_visible', true)
            .order('created_at', { ascending: false })

        // Fetch workshop info
        const { data: workshop } = await supabase
            .from('workshops')
            .select('name, phone')
            .eq('id', repairAny.workshop_id)
            .single()

        return {
            ok: true,
            data: {
                repair: {
                    id: repairAny.id,
                    tracking_code: repairAny.tracking_code,
                    status: repairAny.status,
                    reported_issue: repairAny.reported_issue,
                    created_at: repairAny.created_at,
                    estimated_completion: repairAny.estimated_completion,
                    vehicle_brand: repairAny.vehicle_brand,
                    vehicle_model: repairAny.vehicle_model,
                    vehicle_year: repairAny.vehicle_year,
                    vehicle_plate: repairAny.vehicle_plate,
                },
                updates: (updates as any[]) || [],
                workshop: workshop as any || null,
            }
        }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al consultar' }
    }
}
