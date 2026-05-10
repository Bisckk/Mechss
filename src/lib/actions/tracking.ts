'use server'

import { createAdminClient } from '@/lib/supabase/server'

export type TrackingResult = {
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
        mechanic_name: string | null
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

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

async function buscarReparacion(
    code: string,
    workshopId?: string
): Promise<ActionResult<TrackingResult>> {
    try {
        const admin = createAdminClient()

        let query = admin
            .from('repairs')
            .select(`
                id, tracking_code, status, reported_issue, created_at,
                estimated_completion, vehicle_brand, vehicle_model,
                vehicle_year, vehicle_plate, workshop_id,
                mechanic:mechanic_id ( full_name )
            `)
            .eq('tracking_code', code.trim().toUpperCase())

        if (workshopId) {
            query = (query as any).eq('workshop_id', workshopId)
        }

        const { data: repair, error } = await (query as any).single()

        if (error || !repair) {
            return { ok: false, error: 'No se encontró ninguna orden con ese código de seguimiento.' }
        }

        const r = repair as any

        const { data: updates } = await admin
            .from('repair_updates')
            .select('id, status, notes, photos, created_at')
            .eq('repair_id', r.id)
            .eq('is_client_visible', true)
            .order('created_at', { ascending: false })

        const { data: workshop } = await admin
            .from('workshops')
            .select('name, phone')
            .eq('id', r.workshop_id)
            .single()

        return {
            ok: true,
            data: {
                repair: {
                    id: r.id,
                    tracking_code: r.tracking_code,
                    status: r.status,
                    reported_issue: r.reported_issue,
                    created_at: r.created_at,
                    estimated_completion: r.estimated_completion ?? null,
                    vehicle_brand: r.vehicle_brand,
                    vehicle_model: r.vehicle_model,
                    vehicle_year: r.vehicle_year,
                    vehicle_plate: r.vehicle_plate,
                    mechanic_name: (r.mechanic as any)?.full_name ?? null,
                },
                updates: (updates as any[]) || [],
                workshop: (workshop as any) || null,
            }
        }
    } catch (e: any) {
        return { ok: false, error: e.message || 'Error al consultar' }
    }
}

export async function lookupTrackingCodeAction(
    code: string
): Promise<ActionResult<TrackingResult>> {
    return buscarReparacion(code)
}

// Busca un código validando que pertenezca al taller indicado
export async function lookupByWorkshopAction(
    code: string,
    workshopId: string
): Promise<ActionResult<TrackingResult>> {
    return buscarReparacion(code, workshopId)
}
