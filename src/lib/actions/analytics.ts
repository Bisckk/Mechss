'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

type ActionResult<T = null> = { ok: true; data: T } | { ok: false; error: string }

async function getWorkshopCtx() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No autenticado')
    const { data: perfil } = await supabase.from('users').select('workshop_id').eq('id', user.id).single()
    const workshopId = (perfil as any)?.workshop_id as string | null
    if (!workshopId) throw new Error('Sin taller asignado')
    return { workshopId }
}

export type MechanicStat = {
    name: string
    completed: number
    avgDays: number | null
}

export type RepairStatusCount = {
    status: string
    count: number
}

export type RecentRepair = {
    id: string
    tracking_code: string
    vehicle: string
    status: string
    updated_at: string
    client_name: string | null
}

export type DashboardAnalytics = {
    ingresosHoy: number
    ingresosEstaSemana: number
    ingresosMesAnterior: number
    repairsByStatus: RepairStatusCount[]
    topMechanics: MechanicStat[]
    recentRepairs: RecentRepair[]
}

function elapsed(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1)  return 'Ahora mismo'
    if (m < 60) return `Hace ${m} min`
    const h = Math.floor(m / 60)
    if (h < 24) return `Hace ${h}h`
    return `Hace ${Math.floor(h / 24)}d`
}

export async function getDashboardAnalyticsAction(): Promise<ActionResult<DashboardAnalytics>> {
    try {
        const { workshopId } = await getWorkshopCtx()
        const admin = createAdminClient()

        const today           = new Date()
        const todayStr        = today.toISOString().split('T')[0]
        const weekAgo         = new Date(today); weekAgo.setDate(today.getDate() - 7)
        const weekAgoStr      = weekAgo.toISOString().split('T')[0]
        const monthStart      = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
        const prevMonthStart  = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().split('T')[0]
        const prevMonthEnd    = new Date(today.getFullYear(), today.getMonth(), 0).toISOString().split('T')[0]

        const [
            ingresosHoyRes,
            ingresosSemanRes,
            ingresosPrevRes,
            statusRes,
            mechanicsRes,
            recentRes,
        ] = await Promise.all([
            admin.from('accounting').select('amount')
                .eq('workshop_id', workshopId).eq('type', 'income')
                .neq('status', 'cancelled').eq('transaction_date', todayStr),

            admin.from('accounting').select('amount')
                .eq('workshop_id', workshopId).eq('type', 'income')
                .neq('status', 'cancelled').gte('transaction_date', weekAgoStr),

            admin.from('accounting').select('amount')
                .eq('workshop_id', workshopId).eq('type', 'income')
                .neq('status', 'cancelled')
                .gte('transaction_date', prevMonthStart).lte('transaction_date', prevMonthEnd),

            admin.from('repairs').select('status')
                .eq('workshop_id', workshopId).neq('status', 'delivered'),

            admin.from('repairs')
                .select('mechanic_id, mechanic:mechanic_id(full_name), completed_at, created_at')
                .eq('workshop_id', workshopId)
                .in('status', ['completed', 'delivered'])
                .gte('completed_at', monthStart)
                .not('mechanic_id', 'is', null),

            admin.from('repairs')
                .select('id, tracking_code, vehicle_brand, vehicle_model, status, updated_at, clients:client_id(full_name)')
                .eq('workshop_id', workshopId)
                .neq('status', 'delivered')
                .order('updated_at', { ascending: false })
                .limit(6),
        ])

        const sum = (rows: any[]) => rows.reduce((a: number, r: any) => a + (Number(r.amount) || 0), 0)
        const ingresosHoy          = sum(ingresosHoyRes.data ?? [])
        const ingresosEstaSemana   = sum(ingresosSemanRes.data ?? [])
        const ingresosMesAnterior  = sum(ingresosPrevRes.data ?? [])

        // Repairs by status
        const statusMap = new Map<string, number>()
        for (const r of (statusRes.data ?? []) as any[]) {
            statusMap.set(r.status, (statusMap.get(r.status) ?? 0) + 1)
        }
        const STATUS_ORDER = ['received', 'in_progress', 'repairing', 'waiting_parts', 'pending_completion', 'completed']
        const repairsByStatus: RepairStatusCount[] = STATUS_ORDER
            .filter(s => statusMap.has(s))
            .map(s => ({ status: s, count: statusMap.get(s)! }))

        // Top mechanics
        const mechMap = new Map<string, { name: string; completed: number; totalDays: number; withDays: number }>()
        for (const r of (mechanicsRes.data ?? []) as any[]) {
            const id   = r.mechanic_id as string
            const name = (r.mechanic as any)?.full_name ?? 'Sin nombre'
            if (!mechMap.has(id)) mechMap.set(id, { name, completed: 0, totalDays: 0, withDays: 0 })
            const e = mechMap.get(id)!
            e.completed++
            if (r.completed_at && r.created_at) {
                const days = (new Date(r.completed_at).getTime() - new Date(r.created_at).getTime()) / 86_400_000
                if (days >= 0) { e.totalDays += days; e.withDays++ }
            }
        }
        const topMechanics: MechanicStat[] = [...mechMap.values()]
            .sort((a, b) => b.completed - a.completed)
            .slice(0, 5)
            .map(m => ({
                name:      m.name,
                completed: m.completed,
                avgDays:   m.withDays > 0 ? Math.round((m.totalDays / m.withDays) * 10) / 10 : null,
            }))

        // Recent repairs
        const recentRepairs: RecentRepair[] = (recentRes.data ?? []).map((r: any) => ({
            id:            r.id,
            tracking_code: r.tracking_code,
            vehicle:       [r.vehicle_brand, r.vehicle_model].filter(Boolean).join(' ') || 'Vehículo',
            status:        r.status,
            updated_at:    elapsed(r.updated_at),
            client_name:   (r.clients as any)?.full_name ?? null,
        }))

        return { ok: true, data: { ingresosHoy, ingresosEstaSemana, ingresosMesAnterior, repairsByStatus, topMechanics, recentRepairs } }
    } catch (e: any) {
        return { ok: false, error: e.message }
    }
}
