import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
    CalendarRange, Wrench, DollarSign, PackageOpen, ArrowUpRight,
    CalendarPlus, UserPlus, PackagePlus, ArrowRight, Zap, ShieldCheck,
    Clock, TrendingUp, TrendingDown, Medal, UserCog,
} from 'lucide-react'
import DashboardAnimator from '@/components/ui/DashboardAnimator'
import { getWorkshopPlanInfo } from '@/lib/actions/subscription'
import { getDashboardAnalyticsAction } from '@/lib/actions/analytics'

export const metadata = { title: 'Dashboard | MotoFix Admin' }

const STATUS_META: Record<string, { label: string; color: string; bar: string }> = {
    received:           { label: 'Recibidos',         color: 'text-blue-400',    bar: 'bg-blue-500' },
    in_progress:        { label: 'En Diagnóstico',    color: 'text-amber-400',   bar: 'bg-amber-500' },
    repairing:          { label: 'En Reparación',     color: 'text-purple-400',  bar: 'bg-purple-500' },
    waiting_parts:      { label: 'Esp. Repuestos',    color: 'text-rose-400',    bar: 'bg-rose-500' },
    pending_completion: { label: 'Pend. Aprobación',  color: 'text-orange-400',  bar: 'bg-orange-500' },
    completed:          { label: 'Completados',        color: 'text-emerald-400', bar: 'bg-emerald-500' },
}

function formatCOP(val: number): string {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000)     return `$${(val / 1_000).toFixed(0)}K`
    return `$${val.toLocaleString('es-CO')}`
}

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    const [
        { count: todayAppointments },
        { count: runningRepairs },
        { count: lowStock },
        planResult,
        analyticsResult,
    ] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabase.from('repairs').select('*', { count: 'exact', head: true }).neq('status', 'delivered'),
        supabase.from('inventory').select('*', { count: 'exact', head: true }).lt('quantity', 5),
        getWorkshopPlanInfo(),
        getDashboardAnalyticsAction(),
    ])

    const plan      = planResult.ok ? planResult.data : null
    const analytics = analyticsResult.ok ? analyticsResult.data : null

    // Ingresos hoy trend text
    const ingresosHoy = analytics?.ingresosHoy ?? 0
    const ingresosSemana = analytics?.ingresosEstaSemana ?? 0
    const prevMes = analytics?.ingresosMesAnterior ?? 0
    const ingresosDisplay = formatCOP(ingresosHoy)
    const semanaDisplay   = ingresosSemana > 0 ? `${formatCOP(ingresosSemana)} esta semana` : 'Sin ingresos aún'
    const mesAnteriorTrend = prevMes > 0 ? `vs ${formatCOP(prevMes)} mes ant.` : 'Sin datos previos'

    const stats = [
        {
            label: 'Citas Hoy',
            value: todayAppointments ?? 0,
            trend: 'agendadas para hoy',
            trendUp: (todayAppointments ?? 0) > 0,
            Icon: CalendarRange,
            color: 'text-blue-400',
            bgUrl: 'bg-blue-400/10',
            href: '/admin/agenda',
        },
        {
            label: 'En Taller',
            value: runningRepairs ?? 0,
            trend: 'vehículos activos',
            trendUp: true,
            Icon: Wrench,
            color: 'text-orange-400',
            bgUrl: 'bg-orange-400/10',
            href: '/admin/taller',
        },
        {
            label: 'Ingresos Hoy',
            value: ingresosDisplay,
            trend: semanaDisplay,
            trendUp: ingresosHoy > 0,
            Icon: DollarSign,
            color: 'text-emerald-400',
            bgUrl: 'bg-emerald-400/10',
            href: '/admin/contabilidad',
        },
        {
            label: 'Stock Bajo',
            value: lowStock ?? 0,
            trend: (lowStock ?? 0) > 0 ? 'requieren atención' : 'Stock en orden',
            trendUp: (lowStock ?? 0) === 0,
            Icon: PackageOpen,
            color: 'text-rose-400',
            bgUrl: 'bg-rose-400/10',
            href: '/admin/inventario',
        },
    ]

    const quickActions = [
        { label: 'Nueva Orden',   icon: Wrench,      href: '/admin/taller',    color: 'text-orange-400', bg: 'bg-orange-400/10 hover:bg-orange-400/20', border: 'border-orange-500/20 hover:border-orange-500/40' },
        { label: 'Agendar Cita',  icon: CalendarPlus, href: '/admin/agenda',   color: 'text-blue-400',   bg: 'bg-blue-400/10 hover:bg-blue-400/20',     border: 'border-blue-500/20 hover:border-blue-500/40' },
        { label: 'Nuevo Cliente', icon: UserPlus,     href: '/admin/clientes', color: 'text-emerald-400',bg: 'bg-emerald-400/10 hover:bg-emerald-400/20',border: 'border-emerald-500/20 hover:border-emerald-500/40' },
        { label: 'Ingresar Stock',icon: PackagePlus,  href: '/admin/inventario',color: 'text-purple-400', bg: 'bg-purple-400/10 hover:bg-purple-400/20', border: 'border-purple-500/20 hover:border-purple-500/40' },
    ]

    const repairsByStatus = analytics?.repairsByStatus ?? []
    const maxStatusCount  = Math.max(...repairsByStatus.map(s => s.count), 1)
    const recentRepairs   = analytics?.recentRepairs ?? []
    const topMechanics    = analytics?.topMechanics ?? []

    return (
        <div className="space-y-8 pb-10">
            <DashboardAnimator />

            {/* Header */}
            <div className="dash-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenido a tu Taller</h1>
                    <p className="text-zinc-400 text-sm mt-1">Resumen general de operaciones de hoy.</p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 rounded-xl p-1 shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/5">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">Taller Online</span>
                    </div>
                    {plan ? (
                        <div className="flex items-center gap-1.5 px-2">
                            {plan.plan_status === 'trial' && (
                                <><Zap className="w-3 h-3 text-orange-400" /><span className="text-xs font-semibold text-orange-400">{plan.daysLeftTrial != null && plan.daysLeftTrial > 0 ? `Prueba · ${plan.daysLeftTrial}d` : 'Prueba'}</span></>
                            )}
                            {plan.plan_status === 'active' && (
                                <><ShieldCheck className="w-3 h-3 text-emerald-400" /><span className="text-xs font-semibold text-emerald-400">{plan.plan_name ?? 'Plan Activo'}</span></>
                            )}
                            {plan.plan_status === 'inactive' && (
                                <><Clock className="w-3 h-3 text-zinc-500" /><span className="text-xs font-semibold text-zinc-500">Inactivo</span></>
                            )}
                        </div>
                    ) : (
                        <span className="text-xs text-zinc-500 px-2 font-medium">—</span>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                {quickActions.map((a, i) => (
                    <Link key={i} href={a.href} className={`dash-quick-action flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-[background-color,border-color] duration-200 ${a.bg} ${a.border} group`}>
                        <div className={`p-3 rounded-xl bg-white/5 ${a.color} group-hover:scale-110 transition-transform duration-200`}>
                            <a.icon className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors text-center leading-tight">{a.label}</span>
                    </Link>
                ))}
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, i) => (
                    <Link key={i} href={stat.href} className="dash-stat group bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] hover:border-white/10 transition-all relative overflow-hidden">
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full ${stat.bgUrl} -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700 ease-out`} />
                        <div className="flex items-start justify-between relative z-10">
                            <div>
                                <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
                                <div className="mt-2 text-3xl font-bold text-white tracking-tight">{stat.value}</div>
                            </div>
                            <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${stat.color} shadow-inner`}>
                                <stat.Icon className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-1 text-xs relative z-10">
                            <span className={stat.trendUp ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>{stat.trend}</span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Main grid: Estado del Taller + Actividad */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Reparaciones por Estado */}
                <div className="dash-section lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-white">Estado del Taller</h2>
                        <Link href="/admin/taller" className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 group">
                            Ver todas <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                    </div>

                    {repairsByStatus.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center py-10 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                            <Wrench className="w-8 h-8 mb-3 opacity-20" />
                            <p className="text-sm">No hay reparaciones activas.</p>
                            <Link href="/admin/taller" className="mt-4 flex items-center gap-1.5 text-xs font-medium text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                                Crear orden <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {repairsByStatus.map(({ status, count }) => {
                                const meta = STATUS_META[status] ?? { label: status, color: 'text-zinc-400', bar: 'bg-zinc-600' }
                                const pct  = Math.round((count / maxStatusCount) * 100)
                                return (
                                    <div key={status} className="flex items-center gap-4">
                                        <span className={`text-xs font-semibold w-36 shrink-0 ${meta.color}`}>{meta.label}</span>
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div className={`h-full ${meta.bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                        </div>
                                        <span className="text-sm font-bold text-white w-5 text-right shrink-0">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Órdenes recientes */}
                    {recentRepairs.length > 0 && (
                        <>
                            <div className="border-t border-white/5 pt-4">
                                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Actualizadas recientemente</p>
                                <div className="space-y-2">
                                    {recentRepairs.slice(0, 4).map(r => {
                                        const meta = STATUS_META[r.status] ?? { label: r.status, color: 'text-zinc-400', bar: 'bg-zinc-600' }
                                        return (
                                            <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/5">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <span className="font-mono text-[11px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 shrink-0">#{r.tracking_code}</span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{r.vehicle}</p>
                                                        {r.client_name && <p className="text-[11px] text-zinc-500 truncate">{r.client_name}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`text-[10px] font-bold ${meta.color}`}>{meta.label}</span>
                                                    <span className="text-[10px] text-zinc-600">{r.updated_at}</span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Actividad reciente → Top mecánicos */}
                <div className="dash-section bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-5">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Medal className="w-4 h-4 text-orange-400" /> Top Mecánicos
                        </h2>
                        <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Este mes</span>
                    </div>

                    {topMechanics.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                            <UserCog className="w-8 h-8 text-zinc-700 mb-3" />
                            <p className="text-sm text-zinc-500">Sin servicios completados este mes.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {topMechanics.map((m, i) => (
                                <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0
                                        ${i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                          i === 1 ? 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30' :
                                          i === 2 ? 'bg-orange-900/30 text-orange-600 border border-orange-900/30' :
                                          'bg-white/5 text-zinc-500 border border-white/10'}`}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                                        <p className="text-[11px] text-zinc-500">
                                            {m.completed} {m.completed === 1 ? 'servicio' : 'servicios'}
                                            {m.avgDays !== null && ` · ${m.avgDays}d promedio`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        {m.avgDays !== null && m.avgDays <= 3
                                            ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                            : m.avgDays !== null && m.avgDays > 7
                                            ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                                            : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Ingresos del mes anterior como referencia */}
                    {prevMes > 0 && (
                        <div className="border-t border-white/5 pt-4 mt-auto">
                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">Referencia mes anterior</p>
                            <p className="text-sm font-bold text-zinc-300">{formatCOP(prevMes)} en ingresos</p>
                            <p className="text-[11px] text-zinc-600 mt-0.5">{mesAnteriorTrend}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
