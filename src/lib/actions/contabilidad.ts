'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { TipoImpuesto } from '@/lib/types/contabilidad'
import type {
    TipoTransaccion,
    EstadoTransaccion,
    FuenteTransaccion,
    FiltrotipoTransaccion,
    ResumenFinanciero,
    FlujoCaja,
    MixIngreso,
    ItemCartera,
    Transaccion,
    NuevaTransaccionParams,
    AbonoCarteraParams,
    ResumenImpuestos,
    EstadoResultados,
    LineaEstadoResultados,
} from '@/lib/types/contabilidad'

export type {
    TipoTransaccion,
    EstadoTransaccion,
    FuenteTransaccion,
    FiltrotipoTransaccion,
    Transaccion,
    ResumenFinanciero,
    FlujoCaja,
    MixIngreso,
    ItemCartera,
    NuevaTransaccionParams,
} from '@/lib/types/contabilidad'

type ActionResult<T = null> =
    | { ok: true; data: T }
    | { ok: false; error: string }

// ── Helper de contexto ─────────────────────────────────────

async function getWorkshopId() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')

    const { data: perfil } = await supabase
        .from('users')
        .select('workshop_id, role')
        .eq('id', user.id)
        .single()

    const p = perfil as any
    if (p?.workshop_id) {
        return { workshopId: p.workshop_id as string, userId: user.id, role: p.role as string }
    }

    if (p?.role === 'superadmin') {
        const adminClient = createAdminClient()
        const { data: ws } = await adminClient
            .from('workshops')
            .select('id')
            .eq('is_active', true)
            .order('created_at', { ascending: true })
            .limit(1)
            .single()
        if ((ws as any)?.id) {
            return { workshopId: (ws as any).id as string, userId: user.id, role: 'superadmin' }
        }
    }

    throw new Error('Sin taller asignado')
}

// ── Utilidades internas ────────────────────────────────────

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function formatMesLabel(yyyyMM: string): string {
    const [y, m] = yyyyMM.split('-')
    return `${MESES_ES[parseInt(m) - 1]} ${y}`
}

function primerDiaMes(offsetMeses = 0): string {
    const d = new Date()
    d.setMonth(d.getMonth() - offsetMeses)
    d.setDate(1)
    return d.toISOString().split('T')[0]
}

function ultimoDiaMes(yyyyMM: string): string {
    const [y, m] = yyyyMM.split('-')
    return new Date(parseInt(y), parseInt(m), 0).toISOString().split('T')[0]
}

function getMesActual(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ── Queries de consulta ────────────────────────────────────

export async function getResumenFinancieroAction(): Promise<ActionResult<ResumenFinanciero>> {
    try {
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()
        const inicio = primerDiaMes()

        const [resIngreso, resEgreso, resCartera] = await Promise.all([
            admin
                .from('accounting')
                .select('amount')
                .eq('workshop_id', workshopId)
                .eq('type', 'income')
                .neq('status', 'cancelled')
                .gte('transaction_date', inicio),
            admin
                .from('accounting')
                .select('amount')
                .eq('workshop_id', workshopId)
                .eq('type', 'expense')
                .neq('status', 'cancelled')
                .gte('transaction_date', inicio),
            admin
                .from('repairs')
                .select('final_cost, estimated_cost, payment_status')
                .eq('workshop_id', workshopId)
                .in('payment_status', ['pending', 'partial'])
                .in('status', ['completed', 'delivered']),
        ])

        const sumar = (rows: any[]) =>
            (rows ?? []).reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0)

        const ingresos = sumar(resIngreso.data ?? [])
        const egresos  = sumar(resEgreso.data ?? [])

        // IVA acumulado del mes (neto = generado - descontable)
        const { data: taxData } = await admin
            .from('accounting')
            .select('type, tax_amount')
            .eq('workshop_id', workshopId)
            .eq('tax_type', TipoImpuesto.IVA)
            .neq('status', 'cancelled')
            .gte('transaction_date', inicio)

        let iva_gen = 0, iva_desc = 0
        for (const r of (taxData ?? []) as any[]) {
            const tax = Number(r.tax_amount) || 0
            if (r.type === 'income')  iva_gen  += tax
            if (r.type === 'expense') iva_desc += tax
        }

        const cartera = (resCartera.data ?? []).reduce((acc: number, r: any) => {
            const total  = Number(r.final_cost) || Number(r.estimated_cost) || 0
            return acc + total
        }, 0)

        return {
            ok: true,
            data: {
                ingresos_mes:      ingresos,
                egresos_mes:       egresos,
                utilidad_mes:      ingresos - egresos,
                cartera_pendiente: cartera,
                iva_por_pagar:     Math.max(0, iva_gen - iva_desc),
            },
        }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getFlujoCajaAction(): Promise<ActionResult<FlujoCaja[]>> {
    try {
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()

        const meses: string[] = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date()
            d.setMonth(d.getMonth() - i)
            meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
        }

        const { data, error } = await admin
            .from('accounting')
            .select('type, amount, transaction_date')
            .eq('workshop_id', workshopId)
            .neq('status', 'cancelled')
            .gte('transaction_date', primerDiaMes(5))
            .order('transaction_date', { ascending: true })

        if (error) return { ok: false, error: error.message }

        const mapa = new Map<string, { ingresos: number; egresos: number }>()
        for (const mes of meses) mapa.set(mes, { ingresos: 0, egresos: 0 })

        for (const row of (data ?? []) as any[]) {
            const clave = (row.transaction_date as string).slice(0, 7)
            if (!mapa.has(clave)) continue
            const actual = mapa.get(clave)!
            if (row.type === 'income')  actual.ingresos += Number(row.amount) || 0
            if (row.type === 'expense') actual.egresos  += Number(row.amount) || 0
        }

        const flujo: FlujoCaja[] = meses.map(mes => ({
            mes,
            mes_label: formatMesLabel(mes),
            ingresos:  mapa.get(mes)!.ingresos,
            egresos:   mapa.get(mes)!.egresos,
        }))

        return { ok: true, data: flujo }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getMixIngresosAction(): Promise<ActionResult<MixIngreso[]>> {
    try {
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('accounting')
            .select('category, amount')
            .eq('workshop_id', workshopId)
            .eq('type', 'income')
            .neq('status', 'cancelled')
            .gte('transaction_date', primerDiaMes(2))

        if (error) return { ok: false, error: error.message }

        const acumulado = new Map<string, number>()
        for (const row of (data ?? []) as any[]) {
            const cat = (row.category as string) || 'Otro'
            acumulado.set(cat, (acumulado.get(cat) ?? 0) + (Number(row.amount) || 0))
        }

        const total = [...acumulado.values()].reduce((a, b) => a + b, 0)
        const mix: MixIngreso[] = [...acumulado.entries()]
            .map(([categoria, monto]) => ({
                categoria,
                total: monto,
                porcentaje: total > 0 ? Math.round((monto / total) * 100) : 0,
            }))
            .sort((a, b) => b.total - a.total)

        return { ok: true, data: mix }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getCarteraPendienteAction(): Promise<ActionResult<ItemCartera[]>> {
    try {
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('repairs')
            .select('id, tracking_code, final_cost, estimated_cost, completed_at, vehicle_brand, vehicle_model, vehicle_plate, clients:client_id(full_name)')
            .eq('workshop_id', workshopId)
            .in('payment_status', ['pending', 'partial'])
            .in('status', ['completed', 'delivered'])
            .order('completed_at', { ascending: true })
            .limit(30)

        if (error) return { ok: false, error: error.message }

        const hoy = Date.now()
        const cartera: ItemCartera[] = await Promise.all(
            (data ?? []).map(async (r: any) => {
                const monto_total = Number(r.final_cost) || Number(r.estimated_cost) || 0
                const fechaStr    = r.completed_at as string | null
                const dias        = fechaStr
                    ? Math.floor((hoy - new Date(fechaStr).getTime()) / 86_400_000)
                    : 0

                // Calcular cuánto se ha abonado
                const { data: abonos } = await admin
                    .from('accounting')
                    .select('amount')
                    .eq('repair_id', r.id)
                    .eq('type', 'income')
                    .eq('category', 'Abono Cartera')
                    .neq('status', 'cancelled')

                const monto_pagado = (abonos ?? []).reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0)

                const vehiculo = [r.vehicle_brand, r.vehicle_model, r.vehicle_plate]
                    .filter(Boolean).join(' ')

                return {
                    id:               r.id,
                    tracking_code:    r.tracking_code,
                    cliente:          r.clients?.full_name ?? '—',
                    vehiculo:         vehiculo || '—',
                    monto_total,
                    monto_pagado,
                    monto_pendiente:  monto_total - monto_pagado,
                    fecha_completado: fechaStr,
                    dias_pendiente:   dias,
                }
            })
        )

        return { ok: true, data: cartera.filter(c => c.monto_pendiente > 0) }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getTransaccionesAction(params?: {
    tipo?:   FiltrotipoTransaccion
    mes?:    string
    limite?: number
}): Promise<ActionResult<Transaccion[]>> {
    try {
        const { workshopId } = await getWorkshopId()
        const admin = createAdminClient()
        const mes   = params?.mes ?? getMesActual()

        let q = admin
            .from('accounting')
            .select('id, type, category, description, amount, tax_type, tax_amount, transaction_date, status, source, repair_id, payment_method, reference, notes, created_at')
            .eq('workshop_id', workshopId)
            .gte('transaction_date', `${mes}-01`)
            .lte('transaction_date', ultimoDiaMes(mes))
            .order('transaction_date', { ascending: false })
            .limit(params?.limite ?? 50)

        if (params?.tipo && params.tipo !== 'todos') {
            q = q.eq('type', params.tipo)
        }

        const { data, error } = await q
        if (error) return { ok: false, error: error.message }

        const transacciones: Transaccion[] = (data ?? []).map((r: any) => ({
            id:             r.id,
            tipo:           r.type       as TipoTransaccion,
            categoria:      r.category,
            descripcion:    r.description,
            monto:          Number(r.amount),
            impuesto_tipo:  r.tax_type   ?? null,
            impuesto_valor: Number(r.tax_amount) || 0,
            fecha:          r.transaction_date,
            estado:         (r.status ?? 'pending') as EstadoTransaccion,
            fuente:         (r.source ?? 'manual')  as FuenteTransaccion,
            repair_id:      r.repair_id  ?? null,
            metodo_pago:    r.payment_method ?? null,
            referencia:     r.reference  ?? null,
            notas:          r.notes      ?? null,
            created_at:     r.created_at,
        }))

        return { ok: true, data: transacciones }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

// ── Mutaciones ─────────────────────────────────────────────

export async function crearTransaccionAction(
    params: NuevaTransaccionParams
): Promise<ActionResult<{ id: string }>> {
    try {
        if (!params.descripcion?.trim()) return { ok: false, error: 'La descripción es obligatoria.' }
        if (!params.categoria?.trim())   return { ok: false, error: 'Selecciona una categoría.' }
        if (!params.monto || params.monto <= 0) return { ok: false, error: 'El monto debe ser mayor a cero.' }

        const { workshopId, userId, role } = await getWorkshopId()

        if (params.tipo === 'expense' && role === 'receptionist') {
            return { ok: false, error: 'No tienes permiso para registrar egresos.' }
        }

        const admin = createAdminClient()

        // Calcular impuesto sobre el monto base
        const impuesto_tipo  = params.impuesto_tipo ?? TipoImpuesto.Ninguno
        const tasa           = impuesto_tipo !== TipoImpuesto.Ninguno
            ? (await import('@/lib/types/contabilidad')).TASA_IMPUESTO[impuesto_tipo]
            : 0
        const tax_amount     = Math.round(params.monto * tasa)
        const monto_total    = params.monto + tax_amount

        const { data, error } = await admin
            .from('accounting')
            .insert({
                workshop_id:      workshopId,
                user_id:          userId,
                type:             params.tipo,
                category:         params.categoria,
                description:      params.descripcion.trim(),
                amount:           monto_total,
                tax_type:         impuesto_tipo !== TipoImpuesto.Ninguno ? impuesto_tipo : null,
                tax_amount:       tax_amount,
                payment_method:   params.metodo_pago || null,
                reference:        params.referencia  || null,
                transaction_date: params.fecha,
                source:           'manual',
                status:           'reconciled',
                notes:            params.notas || null,
                repair_id:        params.repair_id || null,
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

export async function anularTransaccionAction(id: string): Promise<ActionResult<null>> {
    try {
        const { workshopId, role } = await getWorkshopId()

        if (role === 'receptionist') {
            return { ok: false, error: 'No tienes permiso para anular transacciones.' }
        }

        const admin = createAdminClient()
        const { error } = await admin
            .from('accounting')
            .update({ status: 'cancelled' } as any)
            .eq('id', id)
            .eq('workshop_id', workshopId)

        if (error) return { ok: false, error: error.message }

        revalidatePath('/admin/contabilidad')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function abonarCarteraAction(params: AbonoCarteraParams): Promise<ActionResult<null>> {
    try {
        if (!params.monto || params.monto <= 0) return { ok: false, error: 'El monto debe ser mayor a cero.' }
        if (!params.metodo_pago)               return { ok: false, error: 'Selecciona el método de pago.' }

        const { workshopId, userId } = await getWorkshopId()
        const admin = createAdminClient()

        const { data: repair, error: repErr } = await admin
            .from('repairs')
            .select('id, tracking_code, final_cost, estimated_cost, payment_status')
            .eq('id', params.repair_id)
            .eq('workshop_id', workshopId)
            .single()

        if (repErr || !repair) return { ok: false, error: 'Orden no encontrada.' }

        const r           = repair as any
        const monto_total = Number(r.final_cost) || Number(r.estimated_cost) || 0

        const { data: abonos } = await admin
            .from('accounting')
            .select('amount')
            .eq('repair_id', params.repair_id)
            .eq('type', 'income')
            .eq('category', 'Abono Cartera')
            .neq('status', 'cancelled')

        const pagado_prev = (abonos ?? []).reduce((s: number, a: any) => s + (Number(a.amount) || 0), 0)
        const nuevo_total = pagado_prev + params.monto

        if (nuevo_total > monto_total) {
            return { ok: false, error: `El abono excede el saldo pendiente de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(monto_total - pagado_prev)}.` }
        }

        const nuevo_estado = nuevo_total >= monto_total ? 'paid' : 'partial'

        const { error: txErr } = await admin.from('accounting').insert({
            workshop_id:      workshopId,
            user_id:          userId,
            type:             'income',
            category:         'Abono Cartera',
            description:      `Abono orden #${(r.tracking_code as string) ?? params.repair_id.slice(-8).toUpperCase()}`,
            amount:           params.monto,
            payment_method:   params.metodo_pago,
            transaction_date: params.fecha,
            source:           'manual',
            status:           'reconciled',
            repair_id:        params.repair_id,
            notes:            params.notas || null,
        } as any)

        if (txErr) return { ok: false, error: txErr.message }

        await admin
            .from('repairs')
            .update({ payment_status: nuevo_estado } as any)
            .eq('id', params.repair_id)

        revalidatePath('/admin/contabilidad')
        return { ok: true, data: null }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getResumenImpuestosAction(mes?: string): Promise<ActionResult<ResumenImpuestos>> {
    try {
        const { workshopId, role } = await getWorkshopId()
        if (role === 'receptionist') return { ok: false, error: 'Sin permiso.' }

        const admin   = createAdminClient()
        const periodo = mes ?? getMesActual()

        const { data, error } = await admin
            .from('accounting')
            .select('type, tax_amount, tax_type')
            .eq('workshop_id', workshopId)
            .neq('status', 'cancelled')
            .gte('transaction_date', `${periodo}-01`)
            .lte('transaction_date', ultimoDiaMes(periodo))

        if (error) return { ok: false, error: error.message }

        let iva_gen = 0, iva_desc = 0, ica = 0, ret = 0, impo = 0

        for (const r of (data ?? []) as any[]) {
            const tax  = Number(r.tax_amount) || 0
            const tipo = r.tax_type as string | null
            if (!tipo || tipo === TipoImpuesto.Ninguno || tax === 0) continue

            if (tipo === TipoImpuesto.IVA) {
                if (r.type === 'income')  iva_gen  += tax
                if (r.type === 'expense') iva_desc += tax
            } else if (tipo === TipoImpuesto.ICA) {
                ica += tax
            } else if (tipo === TipoImpuesto.RetFuente) {
                ret += tax
            } else if (tipo === TipoImpuesto.Impoconsumo) {
                impo += tax
            }
        }

        return {
            ok: true,
            data: {
                periodo,
                iva_generado:    iva_gen,
                iva_descontable: iva_desc,
                iva_neto:        iva_gen - iva_desc,
                ica,
                ret_fuente:      ret,
                impoconsumo:     impo,
                total_a_pagar:   Math.max(0, iva_gen - iva_desc) + ica + ret + impo,
            },
        }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function getEstadoResultadosAction(mes?: string): Promise<ActionResult<EstadoResultados>> {
    try {
        const { workshopId, role } = await getWorkshopId()
        if (role === 'receptionist') return { ok: false, error: 'Sin permiso.' }

        const admin   = createAdminClient()
        const periodo = mes ?? getMesActual()

        const { data, error } = await admin
            .from('accounting')
            .select('type, category, amount')
            .eq('workshop_id', workshopId)
            .neq('status', 'cancelled')
            .gte('transaction_date', `${periodo}-01`)
            .lte('transaction_date', ultimoDiaMes(periodo))

        if (error) return { ok: false, error: error.message }

        const ingresos: { cat: string; val: number }[] = []
        const egresos:  { cat: string; val: number }[] = []

        for (const r of (data ?? []) as any[]) {
            const val = Number(r.amount) || 0
            if (r.type === 'income')  ingresos.push({ cat: r.category, val })
            if (r.type === 'expense') egresos.push({ cat: r.category, val })
        }

        const ventas_brutas = ingresos.reduce((s, x) => s + x.val, 0)
        const costo_ventas  = egresos
            .filter(x => x.cat === 'Compra Inventario')
            .reduce((s, x) => s + x.val, 0)

        const catMap = new Map<string, number>()
        for (const x of egresos) {
            catMap.set(x.cat, (catMap.get(x.cat) ?? 0) + x.val)
        }

        const total_gastos = egresos.reduce((s, x) => s + x.val, 0)

        const gastos_operacionales: LineaEstadoResultados[] = [...catMap.entries()]
            .sort((a, b) => b[1] - a[1])
            .map(([concepto, monto]) => ({
                concepto,
                monto,
                porcentaje: ventas_brutas > 0 ? Math.round((monto / ventas_brutas) * 100) : 0,
            }))

        const utilidad_bruta       = ventas_brutas - costo_ventas
        const utilidad_operacional = ventas_brutas - total_gastos
        const impuestos_estimados  = Math.max(0, Math.round(utilidad_operacional * 0.33))
        const utilidad_neta        = utilidad_operacional - impuestos_estimados
        const margen_neto          = ventas_brutas > 0 ? Math.round((utilidad_neta / ventas_brutas) * 100) : 0

        return {
            ok: true,
            data: {
                periodo,
                ventas_brutas,
                costo_ventas,
                utilidad_bruta,
                gastos_operacionales,
                total_gastos,
                utilidad_operacional,
                impuestos_estimados,
                utilidad_neta,
                margen_neto,
            },
        }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
