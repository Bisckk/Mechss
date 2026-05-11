'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

async function getCtx() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: perfil } = await supabase
        .from('users')
        .select('workshop_id, role')
        .eq('id', user.id)
        .single()

    const workshopId = (perfil as any)?.workshop_id
    if (!workshopId) throw new Error('Sin taller asignado')
    return { workshopId, userId: user.id, role: (perfil as any)?.role as string }
}

// ── Types ──────────────────────────────────────────────────

export interface Pago {
    id: string
    repair_id: string
    amount: number
    payment_method: string
    reference: string | null
    notes: string | null
    created_at: string
}

export interface TotalesRepair {
    total_cost: number
    total_paid: number
    balance: number
    payment_status: 'pending' | 'partial' | 'paid' | 'refunded'
}

export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta' | 'credito'

export interface RegistrarPagoParams {
    repair_id: string
    amount: number
    payment_method: MetodoPago
    reference?: string
    notes?: string
}

// ── Actions ────────────────────────────────────────────────

export async function getPagosRepairAction(repairId: string): Promise<ActionResult<Pago[]>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('payments')
            .select('id, repair_id, amount, payment_method, reference, notes, created_at')
            .eq('repair_id', repairId)
            .eq('workshop_id', workshopId)
            .order('created_at', { ascending: false })

        if (error) return { ok: false, error: error.message }
        return { ok: true, data: (data || []) as Pago[] }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getTotalesRepairAction(repairId: string): Promise<ActionResult<TotalesRepair>> {
    try {
        const { workshopId } = await getCtx()
        const admin = createAdminClient()

        const [repairRes, pagosRes] = await Promise.all([
            admin
                .from('repairs')
                .select('final_cost, estimated_cost, payment_status')
                .eq('id', repairId)
                .eq('workshop_id', workshopId)
                .single(),
            admin
                .from('payments')
                .select('amount')
                .eq('repair_id', repairId)
                .eq('workshop_id', workshopId),
        ])

        if (repairRes.error) return { ok: false, error: repairRes.error.message }

        const r = repairRes.data as any
        const total_cost = Number(r?.final_cost) || Number(r?.estimated_cost) || 0
        const total_paid = ((pagosRes.data || []) as any[])
            .reduce((acc, p) => acc + Number(p.amount), 0)

        return {
            ok: true,
            data: {
                total_cost,
                total_paid,
                balance: Math.max(0, total_cost - total_paid),
                payment_status: (r?.payment_status || 'pending') as TotalesRepair['payment_status'],
            },
        }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function registrarPagoAction(
    params: RegistrarPagoParams
): Promise<ActionResult<{ id: string }>> {
    try {
        if (!params.amount || params.amount <= 0) {
            return { ok: false, error: 'El monto debe ser mayor a cero.' }
        }

        const { workshopId, userId, role } = await getCtx()
        if (role !== 'admin' && role !== 'receptionist' && role !== 'superadmin') {
            return { ok: false, error: 'Sin permisos para registrar pagos.' }
        }

        const admin = createAdminClient()

        const { data: repairCheck } = await admin
            .from('repairs')
            .select('id')
            .eq('id', params.repair_id)
            .eq('workshop_id', workshopId)
            .single()

        if (!repairCheck) return { ok: false, error: 'Orden no encontrada.' }

        const { data, error } = await admin
            .from('payments')
            .insert({
                workshop_id:    workshopId,
                repair_id:      params.repair_id,
                amount:         params.amount,
                payment_method: params.payment_method,
                reference:      params.reference || null,
                notes:          params.notes     || null,
                created_by:     userId,
            } as any)
            .select('id')
            .single()

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/taller')
        revalidatePath('/admin/contabilidad')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
