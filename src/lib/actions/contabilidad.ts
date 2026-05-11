'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

// ── Enums de dominio ───────────────────────────────────────

export enum CategoriaIngreso {
    Servicios  = 'Servicios',
    Repuestos  = 'Repuestos',
    Ecommerce  = 'Ecommerce',
    Otro       = 'Otro',
}

export enum CategoriaGasto {
    Nomina           = 'Nómina',
    Arriendo         = 'Arriendo',
    ServiciosPublicos = 'Servicios Públicos',
    CompraInventario = 'Compra Inventario',
    Suscripcion      = 'Suscripción Plataforma',
    Impuestos        = 'Impuestos',
    Mantenimiento    = 'Mantenimiento',
    Marketing        = 'Marketing',
    Otro             = 'Otro',
}

export type TipoTransaccion  = 'income' | 'expense'
export type EstadoTransaccion = 'pending' | 'reconciled' | 'cancelled'
export type FuenteTransaccion = 'manual' | 'repair_auto' | 'inventory_auto'

export type FiltrotipoTransaccion = 'todos' | TipoTransaccion

// ── Interfaces de datos ────────────────────────────────────

export interface Transaccion {
    id: string
    tipo: TipoTransaccion
    categoria: string
    descripcion: string
    monto: number
    fecha: string
    estado: EstadoTransaccion
    fuente: FuenteTransaccion
    repair_id: string | null
    metodo_pago: string | null
    referencia: string | null
    created_at: string
}

export interface ResumenFinanciero {
    ingresos_mes: number
    egresos_mes: number
    utilidad_mes: number
    cartera_pendiente: number
}

export interface FlujoCaja {
    mes: string
    mes_label: string
    ingresos: number
    egresos: number
}

export interface MixIngreso {
    categoria: string
    total: number
    porcentaje: number
}

export interface ItemCartera {
    id: string
    tracking_code: string
    cliente: string
    vehiculo: string
    monto_pendiente: number
    fecha_completado: string | null
    dias_pendiente: number
}

export interface NuevaTransaccionParams {
    tipo: TipoTransaccion
    categoria: string
    descripcion: string
    monto: number
    fecha: string
    metodo_pago?: string
    referencia?: string
    notas?: string
}

type ActionResult<T = null> =
    | { ok: true; data: T }
    | { ok: false; error: string }

// ── Helper ─────────────────────────────────────────────────

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

// ── Actions de consulta ────────────────────────────────────

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
                .select('final_cost, estimated_cost')
                .eq('workshop_id', workshopId)
                .in('payment_status', ['pending', 'partial'])
                .in('status', ['completed', 'delivered']),
        ])

        const sumar = (rows: any[]) =>
            (rows ?? []).reduce((acc: number, r: any) => acc + (Number(r.amount) || 0), 0)

        const ingresos = sumar(resIngreso.data ?? [])
        const egresos  = sumar(resEgreso.data ?? [])
        const cartera  = (resCartera.data ?? []).reduce(
            (acc: number, r: any) => acc + (Number(r.final_cost) || Number(r.estimated_cost) || 0), 0
        )

        return {
            ok: true,
            data: {
                ingresos_mes:       ingresos,
                egresos_mes:        egresos,
                utilidad_mes:       ingresos - egresos,
                cartera_pendiente:  cartera,
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

        // Genera los últimos 6 meses como YYYY-MM
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
            .limit(20)

        if (error) return { ok: false, error: error.message }

        const hoy = Date.now()
        const cartera: ItemCartera[] = (data ?? []).map((r: any) => {
            const monto    = Number(r.final_cost) || Number(r.estimated_cost) || 0
            const fechaStr = r.completed_at as string | null
            const dias     = fechaStr
                ? Math.floor((hoy - new Date(fechaStr).getTime()) / 86_400_000)
                : 0

            const vehiculo = [r.vehicle_brand, r.vehicle_model, r.vehicle_plate]
                .filter(Boolean).join(' ')

            return {
                id:                r.id,
                tracking_code:     r.tracking_code,
                cliente:           r.clients?.full_name ?? '—',
                vehiculo:          vehiculo || '—',
                monto_pendiente:   monto,
                fecha_completado:  fechaStr,
                dias_pendiente:    dias,
            }
        })

        return { ok: true, data: cartera }
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
            .select('id, type, category, description, amount, transaction_date, status, source, repair_id, payment_method, reference, created_at')
            .eq('workshop_id', workshopId)
            .gte('transaction_date', `${mes}-01`)
            .lte('transaction_date', ultimoDiaMes(mes))
            .order('transaction_date', { ascending: false })
            .limit(params?.limite ?? 30)

        if (params?.tipo && params.tipo !== 'todos') {
            q = q.eq('type', params.tipo)
        }

        const { data, error } = await q
        if (error) return { ok: false, error: error.message }

        const transacciones: Transaccion[] = (data ?? []).map((r: any) => ({
            id:          r.id,
            tipo:        r.type       as TipoTransaccion,
            categoria:   r.category,
            descripcion: r.description,
            monto:       Number(r.amount),
            fecha:       r.transaction_date,
            estado:      (r.status ?? 'pending') as EstadoTransaccion,
            fuente:      (r.source ?? 'manual')  as FuenteTransaccion,
            repair_id:   r.repair_id  ?? null,
            metodo_pago: r.payment_method ?? null,
            referencia:  r.reference  ?? null,
            created_at:  r.created_at,
        }))

        return { ok: true, data: transacciones }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}

export async function crearTransaccionAction(
    params: NuevaTransaccionParams
): Promise<ActionResult<{ id: string }>> {
    try {
        if (!params.descripcion?.trim()) return { ok: false, error: 'La descripción es obligatoria.' }
        if (!params.categoria?.trim())   return { ok: false, error: 'Selecciona una categoría.' }
        if (!params.monto || params.monto <= 0) return { ok: false, error: 'El monto debe ser mayor a cero.' }

        const { workshopId, userId } = await getWorkshopId()
        const admin = createAdminClient()

        const { data, error } = await admin
            .from('accounting')
            .insert({
                workshop_id:      workshopId,
                user_id:          userId,
                type:             params.tipo,
                category:         params.categoria,
                description:      params.descripcion.trim(),
                amount:           params.monto,
                payment_method:   params.metodo_pago || null,
                reference:        params.referencia  || null,
                transaction_date: params.fecha,
                source:           'manual',
                status:           'reconciled',
                notes:            params.notas || null,
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
