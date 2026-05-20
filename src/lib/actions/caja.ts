'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type {
    SesionCaja,
    AperturaCajaParams,
    CierreCajaParams,
    ArqueoCaja,
} from '@/lib/types/contabilidad'

type ActionResult<T = null> =
    | { ok: true; data: T }
    | { ok: false; error: string }

// ── Helper de contexto ──────────────────────────────────────

async function getContexto() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: perfil } = await supabase
        .from('users')
        .select('workshop_id, role, full_name')
        .eq('id', user.id)
        .single()

    const p = perfil as any
    if (!p?.workshop_id) throw new Error('Sin taller asignado')
    return {
        workshopId: p.workshop_id as string,
        userId:     user.id,
        role:       p.role as string,
        nombre:     (p.full_name as string) ?? 'Usuario',
    }
}

// ── Mapper: columnas reales → tipo SesionCaja ───────────────
// Tabla: cash_sessions (migration 00022_contabilidad_v3)
// Columnas reales: estado, saldo_inicial, saldo_final_fisico,
//   efectivo_sistema, diferencia, notas, abierta_en, cerrada_en,
//   user_name, ingresos_efectivo, egresos_efectivo, notas_cierre

function mapearSesion(d: any): SesionCaja {
    return {
        id:                      d.id,
        usuario_id:              d.user_id,
        usuario_nombre:          d.user_name ?? '—',
        saldo_inicial:           Number(d.saldo_inicial)       || 0,
        saldo_final:             d.saldo_final_fisico != null ? Number(d.saldo_final_fisico) : null,
        total_ingresos_efectivo: Number(d.ingresos_efectivo)   || 0,
        total_egresos_efectivo:  Number(d.egresos_efectivo)    || 0,
        diferencia:              d.diferencia != null ? Number(d.diferencia) : null,
        estado:                  d.estado === 'abierta' ? 'open' : 'closed',
        apertura_at:             d.abierta_en ?? d.created_at,
        cierre_at:               d.cerrada_en ?? null,
        notas_cierre:            d.notas_cierre ?? d.notas ?? null,
    }
}

// ── Calcular totales de efectivo desde accounting ───────────

async function calcularEfectivo(workshopId: string, desde: string) {
    const admin = createAdminClient()
    const { data: txs } = await admin
        .from('accounting')
        .select('type, amount, payment_method')
        .eq('workshop_id', workshopId)
        .neq('status', 'cancelled')
        .gte('created_at', desde)

    let ingresos = 0
    let egresos  = 0

    for (const t of (txs ?? []) as any[]) {
        const monto      = Number(t.amount) || 0
        const metodo     = ((t.payment_method as string) ?? '').toLowerCase()
        const esEfectivo = metodo.includes('efectivo')
        if (!esEfectivo) continue
        if (t.type === 'income')  ingresos += monto
        if (t.type === 'expense') egresos  += monto
    }

    return { ingresos, egresos }
}

// ── Queries ────────────────────────────────────────────────

export async function getCajaActivaAction(): Promise<ActionResult<SesionCaja | null>> {
    try {
        const { workshopId, userId, role } = await getContexto()
        const admin = createAdminClient()

        let q = admin
            .from('cash_sessions')
            .select('*')
            .eq('workshop_id', workshopId)
            .eq('estado', 'abierta')
            .order('abierta_en', { ascending: false })
            .limit(1)

        if (role === 'receptionist') q = (q as any).eq('user_id', userId)

        const { data, error } = await (q as any).maybeSingle()
        if (error) return { ok: false, error: error.message }
        if (!data)  return { ok: true, data: null }

        // Calcular totales en tiempo real desde accounting
        const { ingresos, egresos } = await calcularEfectivo(workshopId, data.abierta_en)

        return {
            ok: true,
            data: mapearSesion({ ...data, ingresos_efectivo: ingresos, egresos_efectivo: egresos }),
        }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getHistorialCajaAction(limite = 15): Promise<ActionResult<SesionCaja[]>> {
    try {
        const { workshopId, userId, role } = await getContexto()
        const admin = createAdminClient()

        let q = admin
            .from('cash_sessions')
            .select('*')
            .eq('workshop_id', workshopId)
            .order('abierta_en', { ascending: false })
            .limit(limite)

        if (role === 'receptionist') q = (q as any).eq('user_id', userId)

        const { data, error } = await q
        if (error) return { ok: false, error: error.message }

        return { ok: true, data: (data ?? []).map(mapearSesion) }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// ── Mutaciones ─────────────────────────────────────────────

export async function abrirCajaAction(params: AperturaCajaParams): Promise<ActionResult<{ id: string }>> {
    try {
        if (params.saldo_inicial < 0) return { ok: false, error: 'El saldo inicial no puede ser negativo.' }

        const { workshopId, userId, nombre } = await getContexto()
        const admin = createAdminClient()

        // Verificar que no haya ya una caja abierta
        const { data: existente } = await admin
            .from('cash_sessions')
            .select('id')
            .eq('workshop_id', workshopId)
            .eq('user_id', userId)
            .eq('estado', 'abierta')
            .maybeSingle()

        if (existente) return { ok: false, error: 'Ya tienes una caja abierta.' }

        const { data, error } = await admin
            .from('cash_sessions')
            .insert({
                workshop_id:   workshopId,
                user_id:       userId,
                user_name:     nombre,
                saldo_inicial: params.saldo_inicial,
                estado:        'abierta',
                notas:         params.notas || null,
                // abierta_en usa DEFAULT now()
            } as any)
            .select('id')
            .single()

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/contabilidad')
        return { ok: true, data: { id: (data as any).id } }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function cerrarCajaAction(params: CierreCajaParams): Promise<ActionResult<ArqueoCaja>> {
    try {
        if (params.saldo_final < 0) return { ok: false, error: 'El saldo final no puede ser negativo.' }

        const { workshopId, userId, role } = await getContexto()
        const admin = createAdminClient()

        const { data: sesion, error: sesErr } = await admin
            .from('cash_sessions')
            .select('*')
            .eq('id', params.sesion_id)
            .eq('workshop_id', workshopId)
            .single()

        if (sesErr || !sesion) return { ok: false, error: 'Sesión de caja no encontrada.' }

        const s = sesion as any
        if (s.estado === 'cerrada') return { ok: false, error: 'Esta caja ya fue cerrada.' }
        if (role === 'receptionist' && s.user_id !== userId) {
            return { ok: false, error: 'Solo puedes cerrar tu propia caja.' }
        }

        // Calcular totales reales de efectivo desde accounting
        const { ingresos, egresos } = await calcularEfectivo(workshopId, s.abierta_en)

        const efectivo_sistema = (Number(s.saldo_inicial) || 0) + ingresos - egresos
        const diferencia       = params.saldo_final - efectivo_sistema

        const { error: updErr } = await admin
            .from('cash_sessions')
            .update({
                estado:             'cerrada',
                saldo_final_fisico: params.saldo_final,
                efectivo_sistema,
                diferencia,
                ingresos_efectivo:  ingresos,
                egresos_efectivo:   egresos,
                cerrada_en:         new Date().toISOString(),
                notas_cierre:       params.notas || null,
            } as any)
            .eq('id', params.sesion_id)

        if (updErr) return { ok: false, error: updErr.message }

        revalidatePath('/admin/contabilidad')

        const sesionCerrada: SesionCaja = {
            id:                      params.sesion_id,
            usuario_id:              s.user_id,
            usuario_nombre:          s.user_name ?? '—',
            saldo_inicial:           Number(s.saldo_inicial) || 0,
            saldo_final:             params.saldo_final,
            total_ingresos_efectivo: ingresos,
            total_egresos_efectivo:  egresos,
            diferencia,
            estado:                  'closed',
            apertura_at:             s.abierta_en ?? s.created_at,
            cierre_at:               new Date().toISOString(),
            notas_cierre:            params.notas ?? null,
        }

        return {
            ok: true,
            data: {
                sesion:                 sesionCerrada,
                diferencia,
                transacciones_efectivo: 0,
                transacciones_otros:    0,
                total_efectivo_sistema: efectivo_sistema,
                total_efectivo_real:    params.saldo_final,
                estado:                 diferencia === 0 ? 'cuadrado' : diferencia > 0 ? 'sobrante' : 'faltante',
            },
        }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
