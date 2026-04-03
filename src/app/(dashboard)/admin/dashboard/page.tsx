import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
    CalendarRange, Wrench, DollarSign, PackageOpen, ArrowUpRight,
    CalendarPlus, UserPlus, PackagePlus, ArrowRight
} from 'lucide-react'

export const metadata = {
    title: 'Dashboard | MotoFix Admin',
}

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Mock queries to show structural approach
    const [{ count: todayAppointments }, { count: runningRepairs }, { count: lowStock }] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabase.from('repairs').select('*', { count: 'exact', head: true }).in('status', ['received', 'diagnosing', 'waiting_parts', 'in_repair', 'quality_check']),
        supabase.from('inventory').select('*', { count: 'exact', head: true }).lt('quantity', 5),
    ])

    // Mock values
    const stats = [
        {
            label: 'Citas Hoy',
            value: todayAppointments ?? 4,
            trend: '+2 respecto ayer',
            trendUp: true,
            Icon: CalendarRange,
            color: 'text-blue-400',
            bgUrl: 'bg-blue-400/10',
        },
        {
            label: 'En Reparación',
            value: runningRepairs ?? 8,
            trend: '3 finalizan hoy',
            trendUp: true,
            Icon: Wrench,
            color: 'text-orange-400',
            bgUrl: 'bg-orange-400/10',
        },
        {
            label: 'Ingresos Hoy',
            value: '$ 450.00',
            trend: '+12% esta semana',
            trendUp: true,
            Icon: DollarSign,
            color: 'text-emerald-400',
            bgUrl: 'bg-emerald-400/10',
        },
        {
            label: 'Stock Bajo',
            value: lowStock ?? 12,
            trend: 'Requiere atención',
            trendUp: false,
            Icon: PackageOpen,
            color: 'text-rose-400',
            bgUrl: 'bg-rose-400/10',
        },
    ]

    const quickActions = [
        { label: 'Nueva Orden', icon: Wrench, href: '/admin/reparaciones', color: 'text-orange-400', bg: 'bg-orange-400/10 hover:bg-orange-400/20', border: 'border-orange-500/20 hover:border-orange-500/40' },
        { label: 'Agendar Cita', icon: CalendarPlus, href: '/admin/agenda', color: 'text-blue-400', bg: 'bg-blue-400/10 hover:bg-blue-400/20', border: 'border-blue-500/20 hover:border-blue-500/40' },
        { label: 'Nuevo Cliente', icon: UserPlus, href: '/admin/clientes', color: 'text-emerald-400', bg: 'bg-emerald-400/10 hover:bg-emerald-400/20', border: 'border-emerald-500/20 hover:border-emerald-500/40' },
        { label: 'Ingresar Stock', icon: PackagePlus, href: '/admin/inventario', color: 'text-purple-400', bg: 'bg-purple-400/10 hover:bg-purple-400/20', border: 'border-purple-500/20 hover:border-purple-500/40' },
    ]

    const recentActivity = [
        { id: 1, action: 'Reparación completada', details: 'Cambio de aceite Yamaha R6', time: 'Hace 10 min' },
        { id: 2, action: 'Nueva cita', details: 'Revisión general Honda CB500', time: 'Hace 35 min' },
        { id: 3, action: 'Ingreso inventario', details: '10x Pastillas freno Brembo', time: 'Hace 2 horas' },
    ]

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-10">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenido a tu Taller</h1>
                    <p className="text-zinc-400 text-sm mt-1">Resumen general de operaciones de hoy.</p>
                </div>
                <div className="flex items-center gap-3 bg-zinc-900 border border-white/5 rounded-xl p-1 shadow-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/5">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-zinc-300">Taller Online</span>
                    </div>
                    <span className="text-xs text-zinc-500 px-2 font-medium">V. Pro Activa</span>
                </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
                {quickActions.map((action, i) => (
                    <Link
                        key={i}
                        href={action.href}
                        className={`flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl border transition-all duration-300 ${action.bg} ${action.border} group`}
                    >
                        <div className={`p-3 rounded-xl bg-white/5 ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                            <action.icon className="w-5 h-5 flex-shrink-0" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-zinc-300 group-hover:text-white transition-colors text-center leading-tight">
                            {action.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors relative overflow-hidden group"
                    >
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
                        <div className="mt-4 flex items-center gap-1 text-xs text-zinc-500 relative z-10">
                            <span className={stat.trendUp ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                                {stat.trend}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Repairs Progress */}
                <div className="lg:col-span-2 bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-semibold text-white">Reparaciones en Curso</h2>
                        <button className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1 group">
                            Ver todas <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center py-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                        <Wrench className="w-8 h-8 mb-3 opacity-20" />
                        <p className="text-sm">No hay reparaciones en este momento.</p>
                        <button className="mt-4 flex items-center gap-1.5 text-xs font-medium text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 transition-colors">
                            Crear orden <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                    <h2 className="text-lg font-semibold text-white mb-6">Actividad Reciente</h2>
                    <div className="space-y-5">
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="relative pl-6 before:absolute before:left-[11px] before:top-2 before:bottom-[-20px] last:before:hidden before:w-px before:bg-zinc-800">
                                <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{activity.action}</p>
                                    <p className="text-xs text-zinc-400 mt-0.5">{activity.details}</p>
                                    <p className="text-[10px] uppercase text-zinc-600 mt-1 font-semibold">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    )
}

