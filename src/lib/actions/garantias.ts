'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

async function getCtx() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    const { data: perfil } = await supabase.from('users').select('workshop_id, role').eq('id', user.id).single()
    const workshopId = (perfil as any)?.workshop_id
    if (!workshopId) throw new Error('Sin taller asignado')
    return { workshopId, userId: user.id, role: (perfil as any)?.role as string }
}

// ── Types ──────────────────────────────────────────────────

export interface Garantia {
    id: string
    workshop_id: string
    repair_id: string
    valid_days: number
    issued_at: string
    expires_at: string
    terms: string | null
    status: 'active' | 'expired' | 'claimed'
    claimed_repair_id: string | null
    created_at: string
    repair?: {
        tracking_code: string
        vehicle_brand: string | null
        vehicle_model: string | null
        vehicle_plate: string | null
        clients: { full_name: string } | null
    }
}

export interface EntregarOrdenParams {
    repairId: string
    validDays: number
    terms?: string
}

// ── Actions ────────────────────────────────────────────────

export async function entregarOrdenAction(params: EntregarOrdenParams): Promise<ActionResult<{ garantiaId: string }>> {
    try {
        const { workshopId, userId, role } = await getCtx()
        if (role !== 'admin' && role !== 'receptionist' && role !== 'superadmin') {
            return { ok: false, error: 'Sin permisos para entregar órdenes.' }
        }

        const admin = createAdminClient()

        // Verify repair belongs to this workshop and is completed
        const { data: repair } = await admin
            .from('repairs')
            .select('id, status, payment_status')
            .eq('id', params.repairId)
            .eq('workshop_id', workshopId)
            .single()

        if (!repair) return { ok: false, error: 'Orden no encontrada.' }
        if ((repair as any).status !== 'completed') return { ok: false, error: 'Solo se pueden entregar órdenes completadas.' }

        const now = new Date()
        const expiresAt = new Date(now)
        expiresAt.setDate(expiresAt.getDate() + params.validDays)

        // Mark as delivered
        const { error: repairErr } = await admin
            .from('repairs')
            .update({ status: 'delivered', delivered_at: now.toISOString() } as any)
            .eq('id', params.repairId)

        if (repairErr) return { ok: false, error: repairErr.message }

        // Create warranty
        const { data: garantia, error: gErr } = await admin
            .from('garantias')
            .insert({
                workshop_id: workshopId,
                repair_id:   params.repairId,
                valid_days:  params.validDays,
                issued_at:   now.toISOString(),
                expires_at:  expiresAt.toISOString(),
                terms:       params.terms || null,
                status:      'active',
                created_by:  userId,
            } as any)
            .select('id')
            .single()

        if (gErr) return { ok: false, error: gErr.message }

        revalidatePath('/admin/taller')
        return { ok: true, data: { garantiaId: (garantia as any).id } }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function getGarantiasByWorkshopAction(params?: {
    status?: 'active' | 'expired' | 'claimed'
    expiringDays?: number   // get warranties expiring in next N days
}): Promise<ActionResult<Garantia[]>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()

        let q = admin
            .from('garantias')
            .select(`
                *,
                repair:repairs(
                    tracking_code, vehicle_brand, vehicle_model, vehicle_plate,
                    clients:client_id(full_name)
                )
            `)
            .eq('workshop_id', workshopId)
            .order('expires_at', { ascending: true })

        if (params?.status) {
            q = q.eq('status', params.status)
        }

        if (params?.expiringDays !== undefined) {
            const cutoff = new Date()
            cutoff.setDate(cutoff.getDate() + params.expiringDays)
            q = q.lte('expires_at', cutoff.toISOString())
        }

        const { data, error } = await q.limit(50)
        if (error) return { ok: false, error: error.message }
        return { ok: true, data: (data || []) as Garantia[] }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function getGarantiaByRepairAction(repairId: string): Promise<ActionResult<Garantia | null>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()
        const { data, error } = await admin
            .from('garantias')
            .select('*')
            .eq('repair_id', repairId)
            .eq('workshop_id', workshopId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        if (error) return { ok: false, error: error.message }
        return { ok: true, data: data as Garantia | null }
    } catch (e: any) { return { ok: false, error: e.message } }
}

export async function reclamarGarantiaAction(garantiaId: string): Promise<ActionResult<{ newRepairId: string }>> {
    try {
        const { workshopId, userId } = await getCtx()
        const admin = createAdminClient()

        const { data: garantia } = await admin
            .from('garantias')
            .select('*, repair:repairs(client_id, vehicle_id, vehicle_brand, vehicle_model, vehicle_plate, workshop_id)')
            .eq('id', garantiaId)
            .eq('workshop_id', workshopId)
            .single()

        if (!garantia) return { ok: false, error: 'Garantía no encontrada.' }
        if ((garantia as any).status !== 'active') return { ok: false, error: 'Esta garantía no está activa.' }
        if (new Date((garantia as any).expires_at) < new Date()) return { ok: false, error: 'Esta garantía ha vencido.' }

        const g = garantia as any
        const r = g.repair

        // Create a linked repair
        const { data: newRepair, error: repairErr } = await admin
            .from('repairs')
            .insert({
                workshop_id:   workshopId,
                client_id:     r.client_id,
                vehicle_id:    r.vehicle_id,
                vehicle_brand: r.vehicle_brand,
                vehicle_model: r.vehicle_model,
                vehicle_plate: r.vehicle_plate,
                reported_issue: `Reclamación de garantía — Orden original relacionada`,
                status: 'received',
            } as any)
            .select('id')
            .single()

        if (repairErr) return { ok: false, error: repairErr.message }

        // Mark warranty as claimed
        await admin
            .from('garantias')
            .update({ status: 'claimed', claimed_repair_id: (newRepair as any).id } as any)
            .eq('id', garantiaId)

        revalidatePath('/admin/taller')
        return { ok: true, data: { newRepairId: (newRepair as any).id } }
    } catch (e: any) { return { ok: false, error: e.message } }
}
