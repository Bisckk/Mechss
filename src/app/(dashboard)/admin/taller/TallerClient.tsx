'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Wrench, Package, CheckCircle, Clock, AlertTriangle,
    Search, RefreshCw, ChevronRight, User, Hash, FileText, Plus, UserCog,
    ChevronDown, Check, LayoutGrid, List, SlidersHorizontal, CalendarCheck2,
    ThumbsUp, Loader2, DollarSign, Bell, Wifi, X, Truck,
} from 'lucide-react'
import { gsap } from 'gsap'
import { createClient } from '@/lib/supabase/client'
import { getActiveRepairsAction, updateRepairStatusAction, aprobarCompletarAction } from '@/lib/actions/admin'
import RepairLogModal from '@/components/admin/taller/RepairLogModal'
import CreateRepairDrawer from '@/components/admin/taller/CreateRepairDrawer'
import DetallesOrdenModal from '@/components/admin/taller/DetallesOrdenModal'
import PagoModal from '@/components/admin/taller/PagoModal'
import GarantiaModal from '@/components/admin/taller/GarantiaModal'

type Repair = {
    id: string
    tracking_code: string
    status: string
    reported_issue: string
    created_at: string
    estimated_completion: string | null
    estimated_cost: number | null
    final_cost: number | null
    payment_status: string | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_plate: string | null
    mechanic_id: string | null
    clients: { id: string; full_name: string; phone: string | null } | null
    mechanic: { id: string; full_name: string } | null
}

interface Props {
    userRole: string
    userId: string
    workshopId: string
}

type ToastItem = { id: string; message: string; type: 'success' | 'info' | 'warning' }

const COLUMNS = [
    { key: 'received',           label: 'Recibidos',         icon: Package,        borderActive: 'border-blue-500/50',   textActive: 'text-blue-400',    gradient: 'from-blue-500 to-blue-600',    glow: 'rgba(59,130,246,0.15)' },
    { key: 'in_progress',        label: 'En Diagnóstico',    icon: Search,         borderActive: 'border-amber-500/50',  textActive: 'text-amber-400',   gradient: 'from-amber-500 to-amber-600',  glow: 'rgba(245,158,11,0.15)' },
    { key: 'repairing',          label: 'En Reparación',     icon: Wrench,         borderActive: 'border-purple-500/50', textActive: 'text-purple-400',  gradient: 'from-purple-500 to-purple-600',glow: 'rgba(168,85,247,0.15)' },
    { key: 'waiting_parts',      label: 'Esp. Repuestos',    icon: AlertTriangle,  borderActive: 'border-rose-500/50',   textActive: 'text-rose-400',    gradient: 'from-rose-500 to-rose-600',    glow: 'rgba(244,63,94,0.15)' },
    { key: 'pending_completion', label: 'Pend. Aprobación',  icon: ThumbsUp,       borderActive: 'border-orange-500/50', textActive: 'text-orange-400',  gradient: 'from-orange-500 to-orange-600',glow: 'rgba(249,115,22,0.15)' },
    { key: 'completed',          label: 'Completados',       icon: CheckCircle,    borderActive: 'border-emerald-500/50',textActive: 'text-emerald-400', gradient: 'from-emerald-500 to-emerald-600',glow: 'rgba(16,185,129,0.15)' },
]

const isMechanic  = (role: string) => role === 'mechanic'
const canManage   = (role: string) => role === 'admin' || role === 'receptionist'

function PaymentBadge({ status }: { status: string | null }) {
    if (status === 'paid') return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            <Check className="w-2.5 h-2.5" /> Pagado
        </span>
    )
    if (status === 'partial') return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            <DollarSign className="w-2.5 h-2.5" /> Parcial
        </span>
    )
    if (status === 'pending') return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-full whitespace-nowrap">
            <Clock className="w-2.5 h-2.5" /> Pendiente
        </span>
    )
    return null
}

export default function TallerClient({ userRole, userId, workshopId }: Props) {
    const [repairs, setRepairs] = useState<Repair[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
    const [detallesRepair, setDetallesRepair] = useState<Repair | null>(null)
    const [pagoRepair, setPagoRepair]         = useState<Repair | null>(null)
    const [garantiaRepair, setGarantiaRepair] = useState<Repair | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('received')
    const [showCreateDrawer, setShowCreateDrawer] = useState(false)
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const [aprobandoId, setAprobandoId] = useState<string | null>(null)
    const [isLive, setIsLive] = useState(false)
    const [toasts, setToasts] = useState<ToastItem[]>([])

    const listRef       = useRef<HTMLDivElement>(null)
    const hasLoadedRef  = useRef(false)
    const channelRef    = useRef<any>(null)

    const addToast = useCallback((message: string, type: ToastItem['type'] = 'info') => {
        const id = Date.now().toString()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500)
    }, [])

    // ── Supabase Realtime ──────────────────────────────────
    useEffect(() => {
        if (!workshopId) return
        const supabase = createClient()

        const channel = supabase
            .channel(`taller:${workshopId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'repairs', filter: `workshop_id=eq.${workshopId}` },
                (payload) => {
                    const updated = payload.new as any
                    setRepairs(prev => prev.map(r =>
                        r.id === updated.id
                            ? { ...r, status: updated.status, payment_status: updated.payment_status, final_cost: updated.final_cost }
                            : r
                    ))
                    addToast(`Orden #${updated.tracking_code} actualizada`, 'info')
                }
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'repairs', filter: `workshop_id=eq.${workshopId}` },
                () => {
                    loadRepairs()
                    addToast('Nueva orden de servicio recibida', 'success')
                }
            )
            .subscribe(status => {
                setIsLive(status === 'SUBSCRIBED')
            })

        channelRef.current = channel

        return () => {
            supabase.removeChannel(channel)
            channelRef.current = null
        }
    }, [workshopId, addToast])

    // ── Load repairs ───────────────────────────────────────
    useEffect(() => { loadRepairs() }, [])

    useEffect(() => {
        if (isLoading) return
        gsap.fromTo('.taller-header', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out', force3D: true })
        gsap.fromTo('.status-tab', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.05, ease: 'expo.out', force3D: true })
    }, [isLoading])

    useEffect(() => {
        if (!isLoading && listRef.current) {
            gsap.fromTo(listRef.current.children,
                { opacity: 0, y: 20, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.04, ease: 'back.out(1.2)', force3D: true }
            )
        }
    }, [activeTab, viewMode, isLoading])

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.status-dropdown-container')) setOpenDropdownId(null)
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const loadRepairs = async () => {
        if (!hasLoadedRef.current) setIsLoading(true)
        setLoadError(null)
        const mechanicFilter = isMechanic(userRole) ? userId : undefined
        const res = await getActiveRepairsAction(mechanicFilter)
        if (res.ok) setRepairs(res.data as Repair[])
        else setLoadError((res as any).error ?? 'Error al cargar órdenes')
        setIsLoading(false)
        hasLoadedRef.current = true
    }

    const handleAprobarCompletado = async (repairId: string) => {
        setAprobandoId(repairId)
        setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: 'completed' } : r))
        const res = await aprobarCompletarAction(repairId)
        if (!res.ok) setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: 'pending_completion' } : r))
        setAprobandoId(null)
    }

    const handleMoveStatus = async (repairId: string, newStatus: string) => {
        const repair = repairs.find(r => r.id === repairId)
        if (!repair || repair.status === newStatus) return
        setOpenDropdownId(null)
        setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: newStatus } : r))
        const res = await updateRepairStatusAction(repairId, newStatus)
        if (!res.ok) setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: repair.status } : r))
    }

    const filteredRepairs = repairs.filter(r => {
        if (!searchQuery) return true
        const q = searchQuery.toLowerCase()
        return (
            r.tracking_code.toLowerCase().includes(q) ||
            r.vehicle_plate?.toLowerCase().includes(q) ||
            r.vehicle_brand?.toLowerCase().includes(q) ||
            r.vehicle_model?.toLowerCase().includes(q) ||
            r.clients?.full_name.toLowerCase().includes(q) ||
            r.reported_issue.toLowerCase().includes(q)
        )
    })

    const activeRepairs    = filteredRepairs.filter(r => r.status === activeTab)
    const activeColConfig  = COLUMNS.find(c => c.key === activeTab)!

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="h-9 w-52 bg-white/5 rounded-xl animate-pulse" />
                        <div className="h-4 w-72 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {COLUMNS.map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">

            {/* Toast notifications */}
            <div className="fixed top-20 right-4 z-[300] space-y-2 pointer-events-none">
                {toasts.map(toast => (
                    <div key={toast.id} className={`flex items-center gap-3 border rounded-2xl px-4 py-3 shadow-2xl shadow-black/50 pointer-events-auto
                        animate-in slide-in-from-right-4 duration-300
                        ${toast.type === 'success' ? 'bg-zinc-900 border-emerald-500/30' :
                          toast.type === 'warning' ? 'bg-zinc-900 border-amber-500/30'  :
                          'bg-zinc-900 border-orange-500/30'}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                            ${toast.type === 'success' ? 'bg-emerald-500/20' :
                              toast.type === 'warning' ? 'bg-amber-500/20'  :
                              'bg-orange-500/20'}`}>
                            <Bell className={`w-3.5 h-3.5 ${toast.type === 'success' ? 'text-emerald-400' : toast.type === 'warning' ? 'text-amber-400' : 'text-orange-400'}`} />
                        </div>
                        <p className="text-sm font-semibold text-white">{toast.message}</p>
                        <button onClick={() => setToasts(p => p.filter(t => t.id !== toast.id))} className="ml-1 p-0.5 text-zinc-600 hover:text-zinc-400">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="taller-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                            <Wrench className="w-6 h-6 text-orange-500" />
                        </div>
                        {isMechanic(userRole) ? 'Mis Órdenes' : 'Centro de Servicios'}
                    </h1>
                    <div className="flex items-center gap-3 mt-1.5 ml-[60px]">
                        <p className="text-sm text-zinc-400">
                            {repairs.length} {repairs.length === 1 ? 'vehículo' : 'vehículos'} en el taller
                            {!isMechanic(userRole) && ' · Gestión centralizada'}
                        </p>
                        {isLive && (
                            <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400">En vivo</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar placa, cliente..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                    <div className="hidden sm:flex bg-zinc-900 border border-white/10 rounded-xl p-1">
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                            <List className="w-4 h-4" />
                        </button>
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={loadRepairs} className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0" title="Refrescar">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {canManage(userRole) && (
                        <button
                            onClick={() => setShowCreateDrawer(true)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] active:scale-95 flex-shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Nuevo Ingreso</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Banners */}
            {loadError && (
                <div className="flex items-start gap-3 bg-rose-500/8 border border-rose-500/20 rounded-2xl px-5 py-4">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-rose-400">Error al cargar órdenes</p>
                        <p className="text-xs text-rose-400/70 mt-1 font-mono break-all">{loadError}</p>
                    </div>
                    <button onClick={loadRepairs} className="text-sm text-rose-400 hover:text-rose-300 font-bold px-3 py-1.5 bg-rose-500/10 rounded-lg transition-colors">Reintentar</button>
                </div>
            )}

            {isMechanic(userRole) && (
                <div className="flex items-center gap-3 bg-orange-500/5 border border-orange-500/15 rounded-2xl px-5 py-4">
                    <Wrench className="w-5 h-5 text-orange-400 flex-shrink-0" />
                    <p className="text-sm text-orange-300/80">Visualizando únicamente los servicios que te han sido asignados. Haz clic en "Bitácora" para añadir fotos y novedades.</p>
                </div>
            )}

            {/* Status Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {COLUMNS.map((col, idx) => {
                    const count    = filteredRepairs.filter(r => r.status === col.key).length
                    const isActive = activeTab === col.key
                    const isLastOdd = idx === COLUMNS.length - 1 && COLUMNS.length % 2 !== 0

                    return (
                        <button
                            key={col.key}
                            onClick={() => setActiveTab(col.key)}
                            className={`status-tab relative flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 overflow-hidden text-left
                                ${isLastOdd ? 'col-span-2 md:col-span-1' : ''}
                                ${isActive
                                    ? `bg-zinc-900 ${col.borderActive} shadow-[0_4px_20px_rgba(0,0,0,0.2)]`
                                    : 'bg-zinc-900/50 border-white/5 hover:border-white/10 hover:bg-zinc-900/80'
                                }`}
                        >
                            {isActive && (
                                <div className="absolute inset-0 opacity-10 pointer-events-none transition-opacity duration-500" style={{ background: `linear-gradient(135deg, transparent, ${col.glow})` }} />
                            )}
                            <div className="flex items-center justify-between w-full mb-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'} bg-gradient-to-br ${col.gradient}`}>
                                    <col.icon className="w-5 h-5 text-white" />
                                </div>
                                <span className={`text-2xl font-black tabular-nums transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-600'}`}>{count}</span>
                            </div>
                            <h3 className={`font-bold text-sm transition-colors duration-300 ${isActive ? 'text-white' : 'text-zinc-400'}`}>{col.label}</h3>
                            {isActive && <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${col.gradient}`} />}
                        </button>
                    )
                })}
            </div>

            {/* Main Content */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-1 sm:p-5 min-h-[400px]">
                <div className="flex items-center justify-between px-4 py-2 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${activeColConfig.gradient} flex items-center justify-center shadow-lg`}>
                            <activeColConfig.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white">{activeColConfig.label}</h2>
                            <p className="text-xs text-zinc-500">{activeRepairs.length} {activeRepairs.length === 1 ? 'servicio' : 'servicios'} en esta etapa</p>
                        </div>
                    </div>
                </div>

                <div ref={listRef} className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 px-2 sm:px-0' : 'space-y-3 px-2 sm:px-0'}>
                    {activeRepairs.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-2xl bg-zinc-900/20">
                            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                <activeColConfig.icon className="w-8 h-8 text-zinc-600" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">Cero Servicios</h3>
                            <p className="text-sm text-zinc-500 max-w-sm">
                                No hay vehículos en la etapa de <span className="text-zinc-300 font-semibold">{activeColConfig.label.toLowerCase()}</span> actualmente.
                            </p>
                        </div>
                    ) : (
                        activeRepairs.map(repair => (
                            viewMode === 'list' ? (
                                /* ── List View ── */
                                <div key={repair.id} className="group flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 bg-zinc-900 border border-white/5 rounded-2xl p-4 md:p-5 hover:border-white/10 hover:bg-zinc-900/80 transition-all shadow-sm hover:shadow-xl">
                                    {/* Column 1: Vehicle */}
                                    <div className="flex-1 min-w-[200px] flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${activeColConfig.gradient} flex items-center justify-center flex-shrink-0 shadow-inner`}>
                                            <activeColConfig.icon className="w-6 h-6 text-white opacity-90" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-mono text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                                    #{repair.tracking_code}
                                                </span>
                                                {repair.vehicle_plate && (
                                                    <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 tracking-widest">
                                                        {repair.vehicle_plate.toUpperCase()}
                                                    </span>
                                                )}
                                                <PaymentBadge status={repair.payment_status} />
                                            </div>
                                            <h3 className="text-base font-bold text-white leading-tight">
                                                {repair.vehicle_brand} {repair.vehicle_model} {repair.vehicle_year}
                                            </h3>
                                        </div>
                                    </div>

                                    {/* Column 2: Issue & Client */}
                                    <div className="flex-1 min-w-[250px] w-full md:w-auto">
                                        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="font-medium text-zinc-300 truncate">{repair.clients?.full_name}</span>
                                        </div>
                                        <p className="text-sm text-zinc-500 line-clamp-2 leading-snug">{repair.reported_issue}</p>
                                    </div>

                                    {/* Column 3: Mechanic & Dates */}
                                    <div className="flex-1 min-w-[150px] w-full md:w-auto flex flex-row md:flex-col items-center md:items-start justify-between md:justify-center border-t border-white/5 md:border-t-0 pt-3 md:pt-0">
                                        {repair.mechanic ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                                                    <span className="text-[10px] font-bold text-orange-400">{repair.mechanic.full_name.charAt(0)}</span>
                                                </div>
                                                <span className="text-zinc-300 font-medium">{repair.mechanic.full_name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-sm text-zinc-600">
                                                <UserCog className="w-4 h-4" /><span>Sin asignar</span>
                                            </div>
                                        )}
                                        <div className="flex flex-col gap-1 md:mt-2">
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                                <Clock className="w-3 h-3 flex-shrink-0" />
                                                <span className="whitespace-nowrap">{new Date(repair.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                            </div>
                                            {repair.estimated_completion ? (
                                                <div className="flex items-center gap-1.5 text-xs text-orange-400/80">
                                                    <CalendarCheck2 className="w-3 h-3 flex-shrink-0" />
                                                    <span className="whitespace-nowrap">{new Date(repair.estimated_completion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                                                    <CalendarCheck2 className="w-3 h-3 flex-shrink-0" /><span className="whitespace-nowrap">Sin fecha est.</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Column 4: Actions */}
                                    <div className="w-full md:w-auto flex items-center gap-2 justify-end border-t border-white/5 md:border-t-0 pt-3 md:pt-0 flex-wrap">
                                        {canManage(userRole) && repair.status === 'pending_completion' && (
                                            <button
                                                onClick={() => handleAprobarCompletado(repair.id)}
                                                disabled={aprobandoId === repair.id}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm font-bold border border-emerald-500/30 transition-all disabled:opacity-50"
                                            >
                                                {aprobandoId === repair.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                                                <span className="hidden lg:inline">Aprobar</span>
                                            </button>
                                        )}
                                        {/* Cobrar button — completed orders not yet paid */}
                                        {canManage(userRole) && repair.status === 'completed' && repair.payment_status !== 'paid' && (
                                            <button
                                                onClick={() => setPagoRepair(repair)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-sm font-bold border border-orange-500/30 transition-all"
                                            >
                                                <DollarSign className="w-4 h-4" />
                                                <span className="hidden lg:inline">Cobrar</span>
                                            </button>
                                        )}
                                        {/* Entregar button — completed + paid orders */}
                                        {canManage(userRole) && repair.status === 'completed' && repair.payment_status === 'paid' && (
                                            <button
                                                onClick={() => setGarantiaRepair(repair)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm font-bold border border-emerald-500/30 transition-all"
                                            >
                                                <Truck className="w-4 h-4" />
                                                <span className="hidden lg:inline">Entregar</span>
                                            </button>
                                        )}
                                        {canManage(userRole) && (
                                            <button
                                                onClick={() => setDetallesRepair(repair)}
                                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold transition-all"
                                            >
                                                <SlidersHorizontal className="w-4 h-4 text-zinc-400" />
                                                <span className="hidden lg:inline">Detalles</span>
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setSelectedRepair(repair)}
                                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-semibold transition-all"
                                        >
                                            <FileText className="w-4 h-4 text-zinc-400" />
                                            Bitácora
                                        </button>
                                        {canManage(userRole) && (
                                            <div className="relative status-dropdown-container flex-1 md:flex-none">
                                                <button
                                                    onClick={() => setOpenDropdownId(openDropdownId === repair.id ? null : repair.id)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-semibold border border-white/5 transition-all"
                                                >
                                                    Estado <ChevronDown className="w-4 h-4 text-zinc-400" />
                                                </button>
                                                {openDropdownId === repair.id && (
                                                    <div className="absolute right-0 bottom-full mb-2 w-56 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 origin-bottom-right animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2 pt-1">Cambiar Estado</div>
                                                        <div className="space-y-1">
                                                            {COLUMNS.map(col => (
                                                                <button
                                                                    key={col.key}
                                                                    onClick={() => handleMoveStatus(repair.id, col.key)}
                                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${repair.status === col.key ? 'bg-white/5 text-white font-bold cursor-default' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                                                >
                                                                    <col.icon className={`w-4 h-4 ${repair.status === col.key ? col.textActive : ''}`} />
                                                                    {col.label}
                                                                    {repair.status === col.key && <Check className="w-4 h-4 ml-auto text-white/50" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* ── Grid View ── */
                                <div key={repair.id} className="group bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all shadow-sm hover:shadow-xl flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${activeColConfig.gradient} flex items-center justify-center shadow-inner`}>
                                            <activeColConfig.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="font-mono text-[11px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">#{repair.tracking_code}</span>
                                            {repair.vehicle_plate && (
                                                <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 tracking-widest">{repair.vehicle_plate.toUpperCase()}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                        <h3 className="text-base font-bold text-white leading-tight">{repair.vehicle_brand} {repair.vehicle_model} {repair.vehicle_year}</h3>
                                        <PaymentBadge status={repair.payment_status} />
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
                                        <User className="w-3.5 h-3.5" />
                                        <span className="font-medium text-zinc-300 truncate">{repair.clients?.full_name}</span>
                                    </div>

                                    <p className="text-sm text-zinc-500 line-clamp-2 leading-snug mb-4 flex-1">{repair.reported_issue}</p>

                                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mb-4">
                                        {repair.mechanic ? (
                                            <div className="flex items-center gap-2 text-xs">
                                                <div className="w-5 h-5 rounded-full bg-orange-500/20 flex items-center justify-center">
                                                    <span className="text-[9px] font-bold text-orange-400">{repair.mechanic.full_name.charAt(0)}</span>
                                                </div>
                                                <span className="text-zinc-300 font-medium truncate">{repair.mechanic.full_name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-xs text-zinc-600"><UserCog className="w-3.5 h-3.5" /><span>Sin asignar</span></div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span className="whitespace-nowrap">{new Date(repair.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-wrap">
                                        {canManage(userRole) && repair.status === 'pending_completion' && (
                                            <button onClick={() => handleAprobarCompletado(repair.id)} disabled={aprobandoId === repair.id} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all disabled:opacity-50">
                                                {aprobandoId === repair.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                        {canManage(userRole) && repair.status === 'completed' && repair.payment_status !== 'paid' && (
                                            <button onClick={() => setPagoRepair(repair)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500/25 text-orange-400 text-xs font-bold border border-orange-500/30 transition-all">
                                                <DollarSign className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {canManage(userRole) && repair.status === 'completed' && repair.payment_status === 'paid' && (
                                            <button onClick={() => setGarantiaRepair(repair)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-all">
                                                <Truck className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {canManage(userRole) && (
                                            <button onClick={() => setDetallesRepair(repair)} className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold transition-all">
                                                <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
                                            </button>
                                        )}
                                        <button onClick={() => setSelectedRepair(repair)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-all">
                                            <FileText className="w-3.5 h-3.5 text-zinc-400" /> Bitácora
                                        </button>
                                        {canManage(userRole) && (
                                            <div className="relative status-dropdown-container flex-[0.7]">
                                                <button onClick={() => setOpenDropdownId(openDropdownId === repair.id ? null : repair.id)} className="w-full h-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold border border-white/5 transition-all">
                                                    Estado <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                                                </button>
                                                {openDropdownId === repair.id && (
                                                    <div className="absolute right-0 bottom-full mb-2 w-52 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 origin-bottom-right animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2 pt-1">Cambiar Estado</div>
                                                        <div className="space-y-1">
                                                            {COLUMNS.map(col => (
                                                                <button key={col.key} onClick={() => handleMoveStatus(repair.id, col.key)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all ${repair.status === col.key ? 'bg-white/5 text-white font-bold cursor-default' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}>
                                                                    <col.icon className={`w-3.5 h-3.5 ${repair.status === col.key ? col.textActive : ''}`} />
                                                                    <span className="truncate">{col.label}</span>
                                                                    {repair.status === col.key && <Check className="w-3.5 h-3.5 ml-auto text-white/50 flex-shrink-0" />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
            <RepairLogModal
                isOpen={!!selectedRepair}
                onClose={() => { setSelectedRepair(null); loadRepairs() }}
                repair={selectedRepair}
                userRole={userRole}
            />

            <DetallesOrdenModal
                isOpen={!!detallesRepair}
                onClose={() => setDetallesRepair(null)}
                repair={detallesRepair}
                onSaved={loadRepairs}
            />

            <CreateRepairDrawer
                open={showCreateDrawer}
                onClose={() => setShowCreateDrawer(false)}
                onCreated={loadRepairs}
            />

            <PagoModal
                repair={pagoRepair}
                isOpen={!!pagoRepair}
                onClose={() => setPagoRepair(null)}
                onPagado={() => { loadRepairs(); addToast('Pago registrado correctamente', 'success') }}
            />

            <GarantiaModal
                repair={garantiaRepair}
                isOpen={!!garantiaRepair}
                onClose={() => setGarantiaRepair(null)}
                onEntregado={() => { setGarantiaRepair(null); loadRepairs(); addToast('Vehículo entregado con garantía generada', 'success') }}
            />
        </div>
    )
}
