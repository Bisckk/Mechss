'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Search, Loader2, Wrench, Clock, CheckCircle, Package, AlertTriangle,
    ArrowLeft, MapPin, Phone, ZoomIn, X, Wifi, Bell, User
} from 'lucide-react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { lookupTrackingCodeAction } from '@/lib/actions/tracking'
import { createClient } from '@/lib/supabase/client'

type TrackingData = {
    repair: {
        id: string; tracking_code: string; status: string; reported_issue: string;
        created_at: string; estimated_completion: string | null;
        vehicle_brand: string | null; vehicle_model: string | null;
        vehicle_year: number | null; vehicle_plate: string | null;
        mechanic_name?: string | null;
    }
    updates: { id: string; status: string; notes: string; photos: string[]; created_at: string }[]
    workshop: { name: string; phone: string | null } | null
}

const STATUS_STEPS = [
    { key: 'received',   label: 'Recibido',     icon: Package },
    { key: 'in_progress',label: 'Diagnóstico',  icon: Search },
    { key: 'repairing',  label: 'En Reparación',icon: Wrench },
    { key: 'completed',  label: 'Completado',   icon: CheckCircle },
]

const statusLabels: Record<string, string> = {
    received: 'Recibido', in_progress: 'En Diagnóstico', repairing: 'En Reparación',
    waiting_parts: 'Esperando Repuestos', completed: 'Completado',
    delivered: 'Entregado', cancelled: 'Cancelado',
}

type Toast = { id: string; message: string }

export default function TrackingClient() {
    const [code, setCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [data, setData] = useState<TrackingData | null>(null)
    const [error, setError] = useState('')
    const [isLive, setIsLive] = useState(false)
    const [toasts, setToasts] = useState<Toast[]>([])
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
    const channelRef = useRef<any>(null)
    const resultsRef = useRef<HTMLDivElement>(null)

    // ── Realtime subscription ──────────────────────────────

    const subscribeToRepair = useCallback((repairId: string) => {
        const supabase = createClient()

        // Unsubscribe previous
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current)
        }

        const channel = supabase
            .channel(`repair-${repairId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'repair_updates',
                    filter: `repair_id=eq.${repairId}`,
                },
                (payload) => {
                    const newUpdate = payload.new as any
                    // Only show client-visible updates
                    if (!newUpdate.is_client_visible) return

                    setData(prev => {
                        if (!prev) return prev
                        // Avoid duplicates
                        if (prev.updates.some(u => u.id === newUpdate.id)) return prev
                        return {
                            ...prev,
                            repair: { ...prev.repair, status: newUpdate.status },
                            updates: [newUpdate, ...prev.updates],
                        }
                    })

                    // Toast notification
                    const toastId = `${Date.now()}`
                    setToasts(prev => [...prev, { id: toastId, message: '¡Nueva actualización del taller!' }])
                    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000)

                    // Animate new entry
                    setTimeout(() => {
                        gsap.fromTo('.timeline-entry:first-child',
                            { opacity: 0, y: -16, scale: 0.97 },
                            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'expo.out', force3D: true }
                        )
                    }, 50)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'repairs',
                    filter: `id=eq.${repairId}`,
                },
                (payload) => {
                    const updated = payload.new as any
                    setData(prev => prev ? { ...prev, repair: { ...prev.repair, status: updated.status } } : prev)
                }
            )
            .subscribe((status) => {
                setIsLive(status === 'SUBSCRIBED')
            })

        channelRef.current = channel
    }, [])

    useEffect(() => {
        return () => {
            if (channelRef.current) {
                createClient().removeChannel(channelRef.current)
            }
        }
    }, [])

    // Animate results in
    useEffect(() => {
        if (!data || !resultsRef.current) return
        gsap.fromTo('.tracking-card',
            { opacity: 0, y: 20, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'expo.out', force3D: true }
        )
    }, [data])

    // ── Search ─────────────────────────────────────────────

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return
        setIsSearching(true)
        setError('')
        setData(null)
        setIsLive(false)

        // Unsubscribe previous
        if (channelRef.current) {
            createClient().removeChannel(channelRef.current)
            channelRef.current = null
        }

        const res = await lookupTrackingCodeAction(code.trim())
        if (res.ok) {
            setData(res.data)
            subscribeToRepair(res.data.repair.id)
        } else {
            setError(res.error)
        }
        setIsSearching(false)
    }

    const ESTADO_A_PASO: Record<string, number> = {
        received: 0, in_progress: 1, repairing: 2,
        waiting_parts: 2, completed: 3, delivered: 3,
    }
    const currentStepIndex = data ? (ESTADO_A_PASO[data.repair.status] ?? 0) : -1

    return (
        <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-blue-500/3 rounded-full blur-[100px]" />
            </div>

            {/* Toast notifications */}
            <div className="fixed top-4 right-4 z-[300] space-y-2">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className="flex items-center gap-3 bg-zinc-900 border border-orange-500/30 rounded-2xl px-4 py-3 shadow-2xl shadow-black/50 animate-in slide-in-from-right-4 duration-300"
                    >
                        <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <Bell className="w-4 h-4 text-orange-400" />
                        </div>
                        <p className="text-sm font-semibold text-white">{toast.message}</p>
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-orange-400 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                            <Wrench className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">MotoFix</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {isLive && (
                            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-emerald-400">En vivo</span>
                            </div>
                        )}
                        <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" /> Volver
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">

                {/* Hero */}
                {!data && (
                    <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
                            <Search className="w-9 h-9 text-orange-500" />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
                            Rastreo de <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Reparación</span>
                        </h1>
                        <p className="text-zinc-400 text-lg max-w-md mx-auto leading-relaxed">
                            Ingresa tu código de seguimiento para ver en tiempo real cómo va el proceso de tu moto.
                        </p>
                    </div>
                )}

                {/* Search Box */}
                <form onSubmit={handleSearch} className="mb-10">
                    <div className="relative flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-zinc-600 font-mono font-bold text-sm">#</span>
                            </div>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="REP-XXXXXXXX"
                                className="w-full bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-xl pl-9 pr-4 py-4 text-lg font-mono font-bold text-white tracking-widest focus:outline-none focus:border-orange-500/50 focus:shadow-[0_0_20px_rgba(249,115,22,0.15)] transition-all placeholder:text-zinc-700 placeholder:tracking-widest"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSearching || !code.trim()}
                            className="px-6 sm:px-8 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] flex items-center gap-2 text-lg"
                        >
                            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            <span className="hidden sm:inline">Buscar</span>
                        </button>
                    </div>
                </form>

                {/* Error */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center animate-in fade-in">
                        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">Código No Encontrado</h3>
                        <p className="text-sm text-zinc-400">{error}</p>
                    </div>
                )}

                {/* Results */}
                {data && (
                    <div ref={resultsRef} className="space-y-6">

                        {/* Live indicator strip */}
                        {isLive && (
                            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3">
                                <Wifi className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                                <p className="text-sm text-emerald-300/80">
                                    Conectado en tiempo real — recibirás notificaciones cuando el taller actualice tu servicio.
                                </p>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse ml-auto flex-shrink-0" />
                            </div>
                        )}

                        {/* Vehicle + Workshop */}
                        <div className="tracking-card bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                                        <span className="font-mono text-sm font-black text-orange-400 bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20">
                                            #{data.repair.tracking_code}
                                        </span>
                                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border
                                            ${data.repair.status === 'completed' || data.repair.status === 'delivered'
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                : data.repair.status === 'cancelled'
                                                    ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                            }`}>
                                            {statusLabels[data.repair.status] || data.repair.status}
                                        </span>
                                    </div>
                                    <h2 className="text-2xl font-black text-white">
                                        {data.repair.vehicle_brand} {data.repair.vehicle_model} {data.repair.vehicle_year}
                                    </h2>
                                    {data.repair.vehicle_plate && (
                                        <span className="inline-block mt-2 bg-white/10 text-white px-3 py-1 rounded text-sm font-mono font-black tracking-widest border border-white/10">
                                            {data.repair.vehicle_plate.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                {data.workshop && (
                                    <div className="bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 shrink-0">
                                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Taller</p>
                                        <p className="text-sm text-white font-bold flex items-center gap-2">
                                            <MapPin className="w-3.5 h-3.5 text-orange-400" /> {data.workshop.name}
                                        </p>
                                        {data.workshop.phone && (
                                            <p className="text-xs text-zinc-400 flex items-center gap-2 mt-1">
                                                <Phone className="w-3 h-3" /> {data.workshop.phone}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 bg-zinc-800/30 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Motivo de Ingreso</p>
                                <p className="text-sm text-zinc-300 leading-relaxed">{data.repair.reported_issue}</p>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400 font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    Ingresó: {new Date(data.repair.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                                {data.repair.estimated_completion && (
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400 font-medium">
                                        <Clock className="w-3.5 h-3.5" />
                                        Entrega est.: {new Date(data.repair.estimated_completion).toLocaleDateString('es-CO', { day: '2-digit', month: 'long' })}
                                    </div>
                                )}
                                {data.repair.mechanic_name && (
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400 font-medium">
                                        <User className="w-3.5 h-3.5" />
                                        Mecánico: {data.repair.mechanic_name}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="tracking-card bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Progreso del Servicio</h3>
                            <div className="flex items-center justify-between relative">
                                <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-zinc-800 rounded-full">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                        style={{ width: `${Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1) * 100)}%` }}
                                    />
                                </div>

                                {STATUS_STEPS.map((step, i) => {
                                    const isActive = i <= currentStepIndex
                                    const isCurrent = i === currentStepIndex
                                    return (
                                        <div key={step.key} className="flex flex-col items-center relative z-10" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                                                ${isCurrent ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-110'
                                                    : isActive ? 'bg-orange-500/80' : 'bg-zinc-800 border border-white/10'}`}>
                                                <step.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-600'}`} />
                                            </div>
                                            <p className={`text-[11px] font-bold mt-2 text-center ${isCurrent ? 'text-orange-400' : isActive ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full animate-ping" />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="tracking-card bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                Bitácora de Procesos
                                {data.updates.length > 0 && (
                                    <span className="ml-auto text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-zinc-500">
                                        {data.updates.length} {data.updates.length === 1 ? 'entrada' : 'entradas'}
                                    </span>
                                )}
                            </h3>

                            {data.updates.length === 0 ? (
                                <div className="text-center py-10 bg-zinc-800/20 border border-white/5 rounded-xl border-dashed">
                                    <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-500 font-medium">El taller aún no ha publicado actualizaciones.</p>
                                    {isLive && <p className="text-xs text-emerald-400/60 mt-2">Recibirás una notificación cuando haya novedades.</p>}
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-orange-500/40 via-white/5 to-transparent" />
                                    <div className="space-y-5">
                                        {data.updates.map((upd, idx) => {
                                            const date = new Date(upd.created_at)
                                            return (
                                                <div key={upd.id} className="timeline-entry relative flex gap-4 group">
                                                    <div className="shrink-0 z-10 pt-1">
                                                        <div className={`w-3 h-3 rounded-full border-2 border-zinc-950
                                                            ${idx === 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-zinc-700'}`} />
                                                    </div>
                                                    <div className="flex-1 bg-zinc-800/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-orange-500/10 border-orange-500/20 text-orange-400">
                                                                {statusLabels[upd.status] || upd.status}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        {upd.notes && (
                                                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{upd.notes}</p>
                                                        )}

                                                        {upd.photos && upd.photos.length > 0 && (
                                                            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                                {upd.photos.map((photo, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => setLightboxUrl(photo)}
                                                                        className="aspect-square rounded-xl overflow-hidden border border-white/8 hover:border-orange-500/40 transition-all group/photo relative"
                                                                    >
                                                                        <img src={photo} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300" />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover/photo:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover/photo:opacity-100">
                                                                            <ZoomIn className="w-5 h-5 text-white" />
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="relative z-10 border-t border-white/5 py-8 text-center">
                <p className="text-xs text-zinc-600">Powered by <span className="text-orange-500 font-bold">MotoFix Platform</span> · Seguimiento en tiempo real</p>
            </footer>

            {/* Lightbox */}
            {lightboxUrl && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button className="absolute top-4 right-4 p-2 text-white/60 hover:text-white bg-white/10 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Evidencia"
                        className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
