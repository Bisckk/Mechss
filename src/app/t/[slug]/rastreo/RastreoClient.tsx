'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
    Search, Loader2, Wrench, Clock, CheckCircle, Package,
    AlertTriangle, ArrowLeft, Phone, ZoomIn, X, Wifi, Bell, User,
    ChevronLeft, ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { gsap } from 'gsap'
import { lookupByWorkshopAction, type TrackingResult } from '@/lib/actions/tracking'
import { createClient } from '@/lib/supabase/client'

interface Props {
    workshopId:    string
    workshopSlug:  string
    workshopName:  string
    workshopPhone: string | null
    logoUrl:       string | null
    primaryColor:  string
    bgColor:       string
}

const PASOS_ESTADO = [
    { key: 'received',   label: 'Recibido',      icon: Package },
    { key: 'in_progress',label: 'Diagnóstico',   icon: Search },
    { key: 'repairing',  label: 'En Reparación', icon: Wrench },
    { key: 'completed',  label: 'Completado',    icon: CheckCircle },
]

// Mapea estados a índice en la barra de progreso
const estadoAPaso: Record<string, number> = {
    received:           0,
    in_progress:        1,
    repairing:          2,
    waiting_parts:      2,
    pending_completion: 3,
    completed:          3,
    delivered:          3,
}

const etiquetasEstado: Record<string, string> = {
    received:           'Recibido',
    in_progress:        'En Diagnóstico',
    repairing:          'En Reparación',
    waiting_parts:      'Esperando Repuestos',
    pending_completion: 'Verificación Final',
    completed:          'Completado',
    delivered:          'Entregado',
    cancelled:          'Cancelado',
}

type Toast = { id: string; mensaje: string }

export default function RastreoClient({
    workshopId, workshopSlug, workshopName,
    workshopPhone, logoUrl, primaryColor, bgColor,
}: Props) {
    const [codigo, setCodigo]           = useState('')
    const [buscando, setBuscando]       = useState(false)
    const [datos, setDatos]             = useState<TrackingResult | null>(null)
    const [error, setError]             = useState('')
    const [enVivo, setEnVivo]           = useState(false)
    const [toasts, setToasts]           = useState<Toast[]>([])
    const [lightbox, setLightbox] = useState<{ photos: string[]; idx: number } | null>(null)

    const canalRef      = useRef<any>(null)
    const resultadosRef = useRef<HTMLDivElement>(null)

    // ── Suscripción realtime ───────────────────────────────

    const suscribirse = useCallback((repairId: string) => {
        const supabase = createClient()

        if (canalRef.current) supabase.removeChannel(canalRef.current)

        const canal = supabase
            .channel(`taller-${workshopSlug}-repair-${repairId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'repair_updates', filter: `repair_id=eq.${repairId}` },
                (payload) => {
                    const nueva = payload.new as any
                    if (!nueva.is_client_visible) return

                    setDatos(prev => {
                        if (!prev) return prev
                        if (prev.updates.some(u => u.id === nueva.id)) return prev
                        return {
                            ...prev,
                            repair: { ...prev.repair, status: nueva.status },
                            updates: [nueva, ...prev.updates],
                        }
                    })

                    const toastId = `${Date.now()}`
                    setToasts(prev => [...prev, { id: toastId, mensaje: '¡Nueva actualización del taller!' }])
                    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 4000)

                    setTimeout(() => {
                        gsap.fromTo('.entrada-timeline:first-child',
                            { opacity: 0, y: -16, scale: 0.97 },
                            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'expo.out', force3D: true }
                        )
                    }, 50)
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'repairs', filter: `id=eq.${repairId}` },
                (payload) => {
                    const actualizado = payload.new as any
                    setDatos(prev => prev ? { ...prev, repair: { ...prev.repair, status: actualizado.status } } : prev)
                }
            )
            .subscribe(status => setEnVivo(status === 'SUBSCRIBED'))

        canalRef.current = canal
    }, [workshopSlug])

    useEffect(() => {
        return () => {
            if (canalRef.current) createClient().removeChannel(canalRef.current)
        }
    }, [])

    useEffect(() => {
        if (!datos || !resultadosRef.current) return
        gsap.fromTo('.tarjeta-rastreo',
            { opacity: 0, y: 20, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'expo.out', force3D: true }
        )
    }, [datos])

    useEffect(() => {
        if (!lightbox) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightbox(null)
            if (e.key === 'ArrowLeft') setLightbox(prev => prev && prev.idx > 0 ? { ...prev, idx: prev.idx - 1 } : prev)
            if (e.key === 'ArrowRight') setLightbox(prev => prev && prev.idx < prev.photos.length - 1 ? { ...prev, idx: prev.idx + 1 } : prev)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [lightbox])

    // ── Búsqueda ───────────────────────────────────────────

    const buscar = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!codigo.trim()) return

        setBuscando(true)
        setError('')
        setDatos(null)
        setEnVivo(false)

        if (canalRef.current) {
            createClient().removeChannel(canalRef.current)
            canalRef.current = null
        }

        const res = await lookupByWorkshopAction(codigo.trim(), workshopId)
        if (res.ok) {
            setDatos(res.data)
            suscribirse(res.data.repair.id)
        } else {
            setError(res.error)
        }
        setBuscando(false)
    }

    const pasoActual = datos ? (estadoAPaso[datos.repair.status] ?? 0) : -1

    return (
        <div
            className="min-h-screen text-white relative overflow-hidden"
            style={{ backgroundColor: bgColor }}
        >
            {/* Fondo ambiental */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[120px] opacity-10 pointer-events-none"
                style={{ backgroundColor: primaryColor }}
            />

            {/* Toasts */}
            <div className="fixed top-4 right-4 z-[300] space-y-2">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className="flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 shadow-2xl animate-in slide-in-from-right-4 duration-300"
                        style={{ borderColor: `${primaryColor}30` }}
                    >
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${primaryColor}20` }}>
                            <Bell className="w-4 h-4" style={{ color: primaryColor }} />
                        </div>
                        <p className="text-sm font-semibold text-white">{t.mensaje}</p>
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
                    <Link href={`/t/${workshopSlug}`} className="flex items-center gap-3 group min-w-0">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={workshopName}
                                className="h-8 w-auto object-contain flex-shrink-0 group-hover:opacity-80 transition-opacity"
                            />
                        ) : (
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform"
                                style={{ backgroundColor: `${primaryColor}20`, border: `1px solid ${primaryColor}30` }}
                            >
                                <Wrench className="w-4 h-4" style={{ color: primaryColor }} />
                            </div>
                        )}
                        <span className="text-base font-bold text-white truncate">{workshopName}</span>
                    </Link>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {enVivo && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border" style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20` }}>
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: primaryColor }} />
                                <span className="text-xs font-bold" style={{ color: primaryColor }}>En vivo</span>
                            </div>
                        )}
                        {workshopPhone && (
                            <a
                                href={`tel:${workshopPhone}`}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                            >
                                <Phone className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{workshopPhone}</span>
                                <span className="sm:hidden">Llamar</span>
                            </a>
                        )}
                        <Link href={`/t/${workshopSlug}`} className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors">
                            <ArrowLeft className="w-3.5 h-3.5" /> Sitio web
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

                {/* Hero */}
                {!datos && (
                    <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                            style={{
                                backgroundColor: `${primaryColor}15`,
                                border: `1px solid ${primaryColor}25`,
                                boxShadow: `0 0 40px ${primaryColor}15`,
                            }}
                        >
                            <Search className="w-9 h-9" style={{ color: primaryColor }} />
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3 text-white">
                            Rastreo de Reparación
                        </h1>
                        <p className="text-zinc-400 text-base max-w-md mx-auto leading-relaxed">
                            Ingresa tu código de seguimiento para ver en qué etapa está tu moto en <span className="text-white font-semibold">{workshopName}</span>.
                        </p>
                    </div>
                )}

                {/* Formulario de búsqueda */}
                <form onSubmit={buscar} className="mb-10">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-zinc-600 font-mono font-bold text-sm">#</span>
                            </div>
                            <input
                                type="text"
                                value={codigo}
                                onChange={e => setCodigo(e.target.value.toUpperCase())}
                                placeholder="REP-XXXXXXXX"
                                className="w-full bg-zinc-900/80 backdrop-blur-sm border border-white/10 rounded-xl pl-9 pr-4 py-4 text-lg font-mono font-bold text-white tracking-widest focus:outline-none transition-all placeholder:text-zinc-700 placeholder:tracking-widest"
                                style={{ outline: 'none' }}
                                onFocus={e => e.target.style.borderColor = `${primaryColor}50`}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={buscando || !codigo.trim()}
                            className="px-6 sm:px-8 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center gap-2 text-base sm:text-lg flex-shrink-0"
                            style={{ backgroundColor: primaryColor, boxShadow: `0 0 20px ${primaryColor}40` }}
                        >
                            {buscando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                            <span className="hidden sm:inline">Buscar</span>
                        </button>
                    </div>
                </form>

                {/* Error */}
                {error && (
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-6 text-center animate-in fade-in mb-6">
                        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-white mb-1">Código No Encontrado</h3>
                        <p className="text-sm text-zinc-400">{error}</p>
                    </div>
                )}

                {/* Resultados */}
                {datos && (
                    <div ref={resultadosRef} className="space-y-5">

                        {/* Indicador en vivo */}
                        {enVivo && (
                            <div
                                className="flex items-center gap-3 rounded-xl px-4 py-3 border"
                                style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}20` }}
                            >
                                <Wifi className="w-4 h-4 flex-shrink-0" style={{ color: primaryColor }} />
                                <p className="text-sm" style={{ color: `${primaryColor}CC` }}>
                                    Conectado en tiempo real — recibirás notificaciones cuando el taller actualice tu servicio.
                                </p>
                                <div className="w-2 h-2 rounded-full animate-pulse ml-auto flex-shrink-0" style={{ backgroundColor: primaryColor }} />
                            </div>
                        )}

                        {/* Tarjeta del vehículo */}
                        <div className="tarjeta-rastreo bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-5 sm:p-6 relative overflow-hidden">
                            <div
                                className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-10"
                                style={{ backgroundColor: primaryColor }}
                            />
                            <div className="relative z-10">
                                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span
                                                className="font-mono text-sm font-black px-3 py-1 rounded-lg"
                                                style={{ color: bgColor, backgroundColor: primaryColor }}
                                            >
                                                #{datos.repair.tracking_code}
                                            </span>
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border
                                                ${['completed', 'delivered', 'pending_completion'].includes(datos.repair.status)
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : datos.repair.status === 'cancelled'
                                                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                }`}
                                            >
                                                {etiquetasEstado[datos.repair.status] || datos.repair.status}
                                            </span>
                                        </div>
                                        <h2 className="text-2xl font-black text-white">
                                            {datos.repair.vehicle_brand} {datos.repair.vehicle_model} {datos.repair.vehicle_year}
                                        </h2>
                                        {datos.repair.vehicle_plate && (
                                            <span className="inline-block mt-2 bg-white/10 text-white px-3 py-1 rounded text-sm font-mono font-black tracking-widest border border-white/10">
                                                {datos.repair.vehicle_plate.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-zinc-800/30 border border-white/5 rounded-xl p-4 mb-4">
                                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Motivo de Ingreso</p>
                                    <p className="text-sm text-zinc-300 leading-relaxed">{datos.repair.reported_issue}</p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        Ingresó: {new Date(datos.repair.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                    </div>
                                    {datos.repair.estimated_completion && (
                                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            Entrega est.: {new Date(datos.repair.estimated_completion).toLocaleDateString('es-CO', { day: '2-digit', month: 'long' })}
                                        </div>
                                    )}
                                    {datos.repair.mechanic_name && (
                                        <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400">
                                            <User className="w-3.5 h-3.5" />
                                            Mecánico: {datos.repair.mechanic_name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Barra de progreso */}
                        <div className="tarjeta-rastreo bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-5 sm:p-6">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Progreso del Servicio</h3>
                            <div className="flex items-center justify-between relative">
                                <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-zinc-800 rounded-full">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: `${Math.max(0, pasoActual / (PASOS_ESTADO.length - 1) * 100)}%`,
                                            backgroundColor: primaryColor,
                                            boxShadow: `0 0 10px ${primaryColor}50`,
                                        }}
                                    />
                                </div>

                                {PASOS_ESTADO.map((paso, i) => {
                                    const activo  = i <= pasoActual
                                    const esActual = i === pasoActual
                                    return (
                                        <div
                                            key={paso.key}
                                            className="flex flex-col items-center relative z-10"
                                            style={{ width: `${100 / PASOS_ESTADO.length}%` }}
                                        >
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500"
                                                style={{
                                                    backgroundColor: activo ? primaryColor : undefined,
                                                    transform: esActual ? 'scale(1.1)' : 'scale(1)',
                                                    boxShadow: esActual ? `0 0 20px ${primaryColor}50` : 'none',
                                                    border: activo ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                                    background: activo ? primaryColor : '#27272a',
                                                }}
                                            >
                                                <paso.icon className={`w-4 h-4 ${activo ? 'text-white' : 'text-zinc-600'}`} />
                                            </div>
                                            <p className={`text-[11px] font-bold mt-2 text-center transition-colors duration-300 ${esActual ? 'text-white' : activo ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                                {paso.label}
                                            </p>
                                            {esActual && (
                                                <div
                                                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full animate-ping"
                                                    style={{ backgroundColor: primaryColor }}
                                                />
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Bitácora / Timeline */}
                        <div className="tarjeta-rastreo bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-5 sm:p-6">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4" style={{ color: primaryColor }} />
                                Bitácora de Procesos
                                {datos.updates.length > 0 && (
                                    <span className="ml-auto text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded-full text-zinc-500">
                                        {datos.updates.length} {datos.updates.length === 1 ? 'entrada' : 'entradas'}
                                    </span>
                                )}
                            </h3>

                            {datos.updates.length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-xl">
                                    <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-500 font-medium">El taller aún no ha publicado actualizaciones.</p>
                                    {enVivo && (
                                        <p className="text-xs mt-2" style={{ color: `${primaryColor}60` }}>
                                            Recibirás una notificación cuando haya novedades.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="relative">
                                    <div
                                        className="absolute left-[15px] top-3 bottom-3 w-px"
                                        style={{ background: `linear-gradient(to bottom, ${primaryColor}40, rgba(255,255,255,0.03), transparent)` }}
                                    />
                                    <div className="space-y-5">
                                        {datos.updates.map((upd, idx) => {
                                            const fecha = new Date(upd.created_at)
                                            return (
                                                <div key={upd.id} className="entrada-timeline relative flex gap-4 group">
                                                    <div className="shrink-0 z-10 pt-1">
                                                        <div
                                                            className="w-3 h-3 rounded-full border-2 border-zinc-950 transition-colors"
                                                            style={{
                                                                backgroundColor: idx === 0 ? primaryColor : '#3f3f46',
                                                                boxShadow: idx === 0 ? `0 0 8px ${primaryColor}60` : 'none',
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex-1 bg-zinc-800/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                                        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                                            <span
                                                                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                                                                style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}20`, color: primaryColor }}
                                                            >
                                                                {etiquetasEstado[upd.status] || upd.status}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · {fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        {upd.notes && (
                                                            <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{upd.notes}</p>
                                                        )}
                                                        {upd.photos && upd.photos.length > 0 && (
                                                            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                {upd.photos.map((foto, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => setLightbox({ photos: upd.photos!, idx: i })}
                                                                        className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-white/30 transition-all group/foto relative"
                                                                        style={{ borderColor: i === 0 ? `${primaryColor}20` : undefined }}
                                                                    >
                                                                        <img src={foto} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover group-hover/foto:scale-105 transition-transform duration-300" />
                                                                        <div className="absolute inset-0 bg-black/0 group-hover/foto:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover/foto:opacity-100">
                                                                            <ZoomIn className="w-6 h-6 text-white" />
                                                                        </div>
                                                                        {i === upd.photos!.length - 1 && upd.photos!.length > 1 && (
                                                                            <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
                                                                                {upd.photos!.length} fotos
                                                                            </div>
                                                                        )}
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
                <p className="text-xs text-zinc-600">
                    Powered by <span className="font-bold" style={{ color: primaryColor }}>MotoFix Platform</span> · Seguimiento en tiempo real
                </p>
            </footer>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[200] bg-black/97 flex items-center justify-center p-4"
                    onClick={() => setLightbox(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all z-10"
                        onClick={() => setLightbox(null)}
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {lightbox.photos.length > 1 && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white text-sm font-bold px-4 py-1.5 rounded-full border border-white/10 z-10">
                            {lightbox.idx + 1} / {lightbox.photos.length}
                        </div>
                    )}

                    <img
                        src={lightbox.photos[lightbox.idx]}
                        alt={`Evidencia ${lightbox.idx + 1}`}
                        className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />

                    {lightbox.photos.length > 1 && (
                        <>
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-xl text-white disabled:opacity-20 disabled:pointer-events-none transition-all"
                                onClick={e => { e.stopPropagation(); setLightbox(prev => prev && prev.idx > 0 ? { ...prev, idx: prev.idx - 1 } : prev) }}
                                disabled={lightbox.idx === 0}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                className="absolute right-16 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-xl text-white disabled:opacity-20 disabled:pointer-events-none transition-all"
                                onClick={e => { e.stopPropagation(); setLightbox(prev => prev && prev.idx < prev.photos.length - 1 ? { ...prev, idx: prev.idx + 1 } : prev) }}
                                disabled={lightbox.idx === lightbox.photos.length - 1}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
