'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import {
    X, Wrench, Loader2, Send, Clock, User, Hash,
    ChevronDown, Camera, ZoomIn, Search, Plus, Trash2,
    Package, AlertCircle, CheckCircle2, History, XCircle,
    Pencil, Images, Check
} from 'lucide-react'
import {
    getRepairUpdatesAction, createRepairUpdateAction,
    uploadRepairPhotoAction, buscarRepuestosAction,
    updateRepairUpdateAction,
} from '@/lib/actions/admin'
import { compressImage } from '@/lib/utils/imageCompression'

type Reparacion = {
    id: string
    tracking_code: string
    status: string
    reported_issue: string
    created_at: string
    estimated_cost: number | null
    estimated_completion: string | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_plate: string | null
    clients: { id: string; full_name: string; phone: string | null } | null
    mechanic: { id: string; full_name: string } | null
}

type Actualizacion = {
    id: string
    status: string
    notes: string
    photos: string[]
    parts: ParteUsada[]
    is_client_visible: boolean
    created_at: string
    author: { full_name: string } | null
}

type ParteUsada = {
    item_id: string
    name: string
    quantity: number
    sale_price: number
}

type RepuestoInventario = {
    id: string
    name: string
    sku: string | null
    category: string
    sale_price: number
    stock_quantity: number
    image_url: string | null
}

type FotoPreview = {
    id: string
    dataUrl: string
    fileName: string
    sizeKB: number
    comprimiendo: boolean
}

interface Props {
    isOpen:  boolean
    onClose: () => void
    repair:  Reparacion | null
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    received:      { label: 'Recibido',            color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    in_progress:   { label: 'En Diagnóstico',      color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    repairing:     { label: 'En Reparación',       color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
    waiting_parts: { label: 'Esperando Repuestos', color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
    completed:     { label: 'Completado',          color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    delivered:     { label: 'Entregado',           color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    border: 'border-zinc-500/20' },
    cancelled:     { label: 'Cancelado',           color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20' },
}

export default function BitacoraMecanico({ isOpen, onClose, repair }: Props) {
    // ── Main form state ──
    const [observaciones, setObservaciones]   = useState('')
    const [fotos, setFotos]                   = useState<FotoPreview[]>([])
    const [partes, setPartes]                 = useState<ParteUsada[]>([])
    const [enviando, setEnviando]             = useState(false)
    const [error, setError]                   = useState<string | null>(null)
    const [exito, setExito]                   = useState(false)

    // ── Historial ──
    const [historialAbierto, setHistorialAbierto]   = useState(false)
    const [actualizaciones, setActualizaciones]     = useState<Actualizacion[]>([])
    const [cargandoHistorial, setCargandoHistorial] = useState(false)
    const historialCargado                          = useRef(false)

    // ── Parts search (new entry) ──
    const [busquedaRepuesto, setBusquedaRepuesto]           = useState('')
    const [resultadosRepuestos, setResultadosRepuestos]     = useState<RepuestoInventario[]>([])
    const [buscandoRepuestos, setBuscandoRepuestos]         = useState(false)
    const [panelRepuestosAbierto, setPanelRepuestosAbierto] = useState(false)
    const busquedaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Inline edit state ──
    const [editandoId, setEditandoId]         = useState<string | null>(null)
    const [editNotes, setEditNotes]           = useState('')
    const [editPartes, setEditPartes]         = useState<ParteUsada[]>([])
    const [guardandoEdicion, setGuardandoEdicion] = useState(false)
    const [editError, setEditError]           = useState<string | null>(null)

    // ── Lightbox ──
    const [fotoAmpliada, setFotoAmpliada] = useState<string | null>(null)

    const galleryInputRef = useRef<HTMLInputElement>(null)
    const cameraInputRef  = useRef<HTMLInputElement>(null)
    const modalRef        = useRef<HTMLDivElement>(null)

    // Reset on open
    useEffect(() => {
        if (!isOpen) return
        setObservaciones('')
        setFotos([])
        setPartes([])
        setError(null)
        setExito(false)
        setHistorialAbierto(false)
        setActualizaciones([])
        historialCargado.current = false
        setBusquedaRepuesto('')
        setResultadosRepuestos([])
        setPanelRepuestosAbierto(false)
        setEditandoId(null)

        if (modalRef.current) {
            gsap.fromTo(modalRef.current,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.3, ease: 'back.out(1.2)' }
            )
        }
    }, [isOpen])

    // ── Historial ──────────────────────────────────────────────

    const cargarHistorial = async () => {
        if (!repair || historialCargado.current) return
        setCargandoHistorial(true)
        const res = await getRepairUpdatesAction(repair.id)
        if (res.ok) {
            setActualizaciones(res.data as Actualizacion[])
            historialCargado.current = true
        }
        setCargandoHistorial(false)
    }

    const toggleHistorial = () => {
        const siguiente = !historialAbierto
        setHistorialAbierto(siguiente)
        if (siguiente) cargarHistorial()
    }

    // ── Parts search ───────────────────────────────────────────

    const buscarRepuestos = useCallback(async (texto: string) => {
        setBuscandoRepuestos(true)
        const res = await buscarRepuestosAction(texto)
        if (res.ok) setResultadosRepuestos(res.data as RepuestoInventario[])
        setBuscandoRepuestos(false)
    }, [])

    useEffect(() => {
        if (!panelRepuestosAbierto) return
        if (busquedaTimerRef.current) clearTimeout(busquedaTimerRef.current)
        busquedaTimerRef.current = setTimeout(() => buscarRepuestos(busquedaRepuesto), 300)
        return () => { if (busquedaTimerRef.current) clearTimeout(busquedaTimerRef.current) }
    }, [busquedaRepuesto, panelRepuestosAbierto, buscarRepuestos])

    const abrirPanelRepuestos = () => {
        setPanelRepuestosAbierto(true)
        buscarRepuestos('')
    }

    const agregarParte = (item: RepuestoInventario) => {
        const existe = partes.find(p => p.item_id === item.id)
        if (existe) {
            setPartes(prev => prev.map(p => p.item_id === item.id ? { ...p, quantity: p.quantity + 1 } : p))
        } else {
            setPartes(prev => [...prev, { item_id: item.id, name: item.name, quantity: 1, sale_price: item.sale_price }])
        }
    }

    const cambiarCantidad = (itemId: string, delta: number) => {
        setPartes(prev => prev.map(p => p.item_id === itemId ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p))
    }

    const quitarParte = (itemId: string) => {
        setPartes(prev => prev.filter(p => p.item_id !== itemId))
    }

    const totalPartes = partes.reduce((sum, p) => sum + p.sale_price * p.quantity, 0)

    // ── Photos ─────────────────────────────────────────────────

    const procesarArchivos = async (archivos: FileList | null) => {
        if (!archivos) return
        for (const archivo of Array.from(archivos)) {
            if (!archivo.type.startsWith('image/') && !archivo.name.match(/\.(jpg|jpeg|png|webp|gif|heic|heif)$/i)) continue
            const id = Math.random().toString(36).slice(2)
            setFotos(prev => [...prev, { id, dataUrl: '', fileName: archivo.name, sizeKB: 0, comprimiendo: true }])
            try {
                const { dataUrl, sizeKB } = await compressImage(archivo, { maxSizeKB: 800, maxWidth: 1600 })
                setFotos(prev => prev.map(f => f.id === id ? { ...f, dataUrl, sizeKB, comprimiendo: false } : f))
            } catch {
                setFotos(prev => prev.filter(f => f.id !== id))
            }
        }
    }

    const eliminarFoto = (id: string) => setFotos(prev => prev.filter(f => f.id !== id))

    // ── Submit ─────────────────────────────────────────────────

    const enviar = async () => {
        if (!repair || !observaciones.trim()) return
        if (fotos.some(f => f.comprimiendo)) {
            setError('Espera a que terminen de procesar las fotos.')
            return
        }
        setEnviando(true)
        setError(null)

        const urlsFotos: string[] = []
        for (const foto of fotos) {
            if (!foto.dataUrl) continue
            const res = await uploadRepairPhotoAction(repair.id, foto.dataUrl, foto.fileName)
            if (res.ok) urlsFotos.push((res.data as any).url)
        }

        const res = await createRepairUpdateAction(repair.id, observaciones.trim(), urlsFotos, true, partes)

        if (res.ok) {
            setExito(true)
            setTimeout(onClose, 1200)
        } else {
            setError((res as any).error || 'Error al guardar la bitácora')
        }
        setEnviando(false)
    }

    // ── Inline edit ────────────────────────────────────────────

    const iniciarEdicion = (act: Actualizacion) => {
        setEditandoId(act.id)
        setEditNotes(act.notes || '')
        setEditPartes(act.parts ? [...act.parts] : [])
        setEditError(null)
    }

    const cancelarEdicion = () => {
        setEditandoId(null)
        setEditError(null)
    }

    const cambiarCantidadEdit = (itemId: string, delta: number) => {
        setEditPartes(prev => prev.map(p => p.item_id === itemId ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p))
    }

    const quitarParteEdit = (itemId: string) => {
        setEditPartes(prev => prev.filter(p => p.item_id !== itemId))
    }

    const guardarEdicion = async () => {
        if (!editandoId) return
        setGuardandoEdicion(true)
        setEditError(null)
        const res = await updateRepairUpdateAction(editandoId, editNotes.trim(), editPartes)
        if (res.ok) {
            setActualizaciones(prev => prev.map(a =>
                a.id === editandoId
                    ? { ...a, notes: editNotes.trim(), parts: editPartes }
                    : a
            ))
            setEditandoId(null)
        } else {
            setEditError((res as any).error || 'Error al guardar cambios')
        }
        setGuardandoEdicion(false)
    }

    if (!isOpen || !repair) return null

    const sc = ESTADO_CONFIG[repair.status] || ESTADO_CONFIG.received

    return (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={onClose} />

            <div
                ref={modalRef}
                className="relative w-full max-w-2xl bg-zinc-950 border-0 sm:border border-white/10 rounded-t-2xl sm:rounded-2xl flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.6)] max-h-[94dvh] sm:max-h-[90vh] overflow-hidden"
            >
                {/* Drag handle */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 bg-white/15 rounded-full" />
                </div>

                {/* ── Header ── */}
                <div className="px-5 pt-4 pb-4 border-b border-white/5 shrink-0">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                <Wrench className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                        #{repair.tracking_code}
                                    </span>
                                    {repair.vehicle_plate && (
                                        <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 tracking-widest">
                                            {repair.vehicle_plate.toUpperCase()}
                                        </span>
                                    )}
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sc.bg} ${sc.border} ${sc.color}`}>
                                        {sc.label}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-white mt-0.5 truncate">
                                    {repair.vehicle_brand} {repair.vehicle_model} {repair.vehicle_year}
                                </p>
                                {repair.clients && (
                                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                                        <User className="w-3 h-3" />
                                        <span>{repair.clients.full_name}</span>
                                        {repair.clients.phone && (
                                            <>
                                                <span className="text-zinc-700">·</span>
                                                <Hash className="w-3 h-3" />
                                                <span>{repair.clients.phone}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all border border-transparent shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-5 space-y-6">

                        {/* Observaciones */}
                        <div>
                            <label className="block text-xs font-black text-white uppercase tracking-widest mb-2">
                                ¿Qué se le hizo a la moto?
                            </label>
                            <textarea
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                rows={4}
                                placeholder="Describe detalladamente el trabajo realizado, diagnóstico, hallazgos..."
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 transition-all placeholder:text-zinc-600 resize-none leading-relaxed"
                            />
                            <p className="text-[10px] text-zinc-700 mt-1.5 text-right">{observaciones.length} caracteres</p>
                        </div>

                        {/* ── Evidencia fotográfica ── */}
                        <div>
                            <label className="block text-xs font-black text-white uppercase tracking-widest mb-3">
                                Evidencia Fotográfica
                            </label>

                            {/* Two-button split: gallery + camera */}
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => galleryInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center gap-2 border border-dashed border-white/15 hover:border-orange-500/40 bg-white/3 hover:bg-orange-500/5 rounded-2xl py-5 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center group-hover:border-orange-500/30 group-hover:bg-orange-500/10 transition-all">
                                        <Images className="w-5 h-5 text-zinc-400 group-hover:text-orange-400 transition-colors" />
                                    </div>
                                    <p className="text-xs font-bold text-zinc-400 group-hover:text-orange-400 transition-colors">Galería</p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-orange-500/30 hover:border-orange-500/60 bg-orange-500/5 hover:bg-orange-500/10 rounded-2xl py-5 transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                                        <Camera className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <p className="text-xs font-bold text-orange-400">Cámara</p>
                                </button>
                            </div>

                            {/* Gallery input: multiple, no capture */}
                            <input
                                ref={galleryInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={e => { procesarArchivos(e.target.files); e.target.value = '' }}
                            />
                            {/* Camera input: single, capture */}
                            <input
                                ref={cameraInputRef}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={e => { procesarArchivos(e.target.files); e.target.value = '' }}
                            />

                            {/* Photo previews */}
                            {fotos.length > 0 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-3">
                                    {fotos.map(foto => (
                                        <div key={foto.id} className="relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-white/10 group">
                                            {foto.comprimiendo ? (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                                    <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                                                </div>
                                            ) : foto.dataUrl ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setFotoAmpliada(foto.dataUrl)}
                                                    className="w-full h-full"
                                                >
                                                    <img
                                                        src={foto.dataUrl}
                                                        alt={foto.fileName}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        draggable={false}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                        <ZoomIn className="w-5 h-5 text-white" />
                                                    </div>
                                                </button>
                                            ) : (
                                                <div className="w-full h-full bg-zinc-800 animate-pulse" />
                                            )}

                                            {!foto.comprimiendo && (
                                                <button
                                                    type="button"
                                                    onClick={() => eliminarFoto(foto.id)}
                                                    className="absolute top-1.5 right-1.5 p-1 bg-rose-500/90 hover:bg-rose-500 rounded-lg shadow-lg transition-colors z-10"
                                                >
                                                    <X className="w-3 h-3 text-white" />
                                                </button>
                                            )}

                                            {!foto.comprimiendo && foto.sizeKB > 0 && (
                                                <div className="absolute bottom-1 left-1 text-[8px] font-bold text-white/60 bg-black/60 rounded px-1 py-0.5 pointer-events-none">
                                                    {foto.sizeKB}KB
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Repuestos ── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-black text-white uppercase tracking-widest">
                                    Repuestos Utilizados
                                </label>
                                {partes.length > 0 && (
                                    <span className="text-xs font-bold text-orange-400">
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(totalPartes)}
                                    </span>
                                )}
                            </div>

                            {partes.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {partes.map(parte => (
                                        <div key={parte.item_id} className="flex items-center gap-3 bg-zinc-900 border border-white/8 rounded-xl px-3 py-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                                                <Package className="w-3.5 h-3.5 text-orange-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">{parte.name}</p>
                                                <p className="text-xs text-zinc-500">
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parte.sale_price)} c/u
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button type="button" onClick={() => cambiarCantidad(parte.item_id, -1)} className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-base leading-none transition-colors">−</button>
                                                <span className="text-sm font-bold text-white w-5 text-center tabular-nums">{parte.quantity}</span>
                                                <button type="button" onClick={() => cambiarCantidad(parte.item_id, +1)} className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-base leading-none transition-colors">+</button>
                                            </div>
                                            <button type="button" onClick={() => quitarParte(parte.item_id)} className="p-1.5 text-zinc-600 hover:text-rose-400 transition-colors shrink-0">
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!panelRepuestosAbierto ? (
                                <button
                                    type="button"
                                    onClick={abrirPanelRepuestos}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-white/15 hover:border-orange-500/40 text-zinc-500 hover:text-orange-400 text-sm font-semibold transition-all hover:bg-orange-500/5"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar repuesto del inventario
                                </button>
                            ) : (
                                <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                                        <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <input
                                            type="text"
                                            autoFocus
                                            placeholder="Buscar repuesto por nombre..."
                                            value={busquedaRepuesto}
                                            onChange={e => setBusquedaRepuesto(e.target.value)}
                                            className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                                        />
                                        <button type="button" onClick={() => setPanelRepuestosAbierto(false)} className="text-zinc-600 hover:text-zinc-400 transition-colors shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="max-h-52 overflow-y-auto">
                                        {buscandoRepuestos ? (
                                            <div className="flex items-center justify-center py-6 gap-2 text-sm text-zinc-500">
                                                <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
                                            </div>
                                        ) : resultadosRepuestos.length === 0 ? (
                                            <div className="py-6 text-center text-sm text-zinc-600">
                                                {busquedaRepuesto ? 'Sin resultados' : 'No hay repuestos en inventario'}
                                            </div>
                                        ) : (
                                            resultadosRepuestos.map(item => {
                                                const yaAgregado = partes.some(p => p.item_id === item.id)
                                                return (
                                                    <button
                                                        key={item.id}
                                                        type="button"
                                                        onClick={() => agregarParte(item)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-b-0"
                                                    >
                                                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                                                            {item.image_url
                                                                ? <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                                                : <Package className="w-4 h-4 text-zinc-500" />
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                                                            <p className="text-xs text-zinc-500">
                                                                Stock: {item.stock_quantity} · {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(item.sale_price)}
                                                            </p>
                                                        </div>
                                                        {yaAgregado
                                                            ? <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">Agregado</span>
                                                            : <Plus className="w-4 h-4 text-zinc-500 shrink-0" />
                                                        }
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Error / Éxito */}
                        {error && (
                            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                <p className="text-sm text-rose-400">{error}</p>
                            </div>
                        )}
                        {exito && (
                            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <p className="text-sm text-emerald-400 font-semibold">¡Bitácora guardada correctamente!</p>
                            </div>
                        )}

                        {/* ── Historial (desplegable) ── */}
                        <div className="border border-white/8 rounded-2xl overflow-hidden">
                            <button
                                type="button"
                                onClick={toggleHistorial}
                                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <History className="w-4 h-4 text-zinc-500" />
                                    <span className="text-sm font-bold text-zinc-400">Historial de Registros</span>
                                    {actualizaciones.length > 0 && (
                                        <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                                            {actualizaciones.length}
                                        </span>
                                    )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-zinc-600 transition-transform duration-200 ${historialAbierto ? 'rotate-180' : ''}`} />
                            </button>

                            {historialAbierto && (
                                <div className="border-t border-white/5">
                                    {cargandoHistorial ? (
                                        <div className="flex items-center justify-center gap-2 py-8 text-sm text-zinc-500">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Cargando historial...
                                        </div>
                                    ) : actualizaciones.length === 0 ? (
                                        <div className="py-8 text-center text-sm text-zinc-600">Sin registros anteriores.</div>
                                    ) : (
                                        <div className="divide-y divide-white/5">
                                            {actualizaciones.map(act => {
                                                const sc2 = ESTADO_CONFIG[act.status] || ESTADO_CONFIG.received
                                                const editando = editandoId === act.id

                                                return (
                                                    <div key={act.id} className="p-5">
                                                        {/* Row header (always visible) */}
                                                        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sc2.bg} ${sc2.border} ${sc2.color}`}>
                                                                    {sc2.label}
                                                                </span>
                                                                {act.author && (
                                                                    <span className="text-xs text-zinc-500">{act.author.full_name}</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                                                    <Clock className="w-3 h-3" />
                                                                    {new Date(act.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}{' '}
                                                                    {new Date(act.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                                {!editando && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => iniciarEdicion(act)}
                                                                        className="p-1.5 text-zinc-600 hover:text-orange-400 hover:bg-orange-500/10 rounded-lg transition-all"
                                                                        title="Editar registro"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {editando ? (
                                                            /* ── Edit form ── */
                                                            <div className="space-y-3 bg-zinc-900 border border-orange-500/20 rounded-xl p-4">
                                                                <textarea
                                                                    value={editNotes}
                                                                    onChange={e => setEditNotes(e.target.value)}
                                                                    rows={3}
                                                                    autoFocus
                                                                    placeholder="Observaciones..."
                                                                    className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600 resize-none leading-relaxed"
                                                                />

                                                                {/* Edit parts list */}
                                                                {editPartes.length > 0 && (
                                                                    <div className="space-y-2">
                                                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Repuestos</p>
                                                                        {editPartes.map(parte => (
                                                                            <div key={parte.item_id} className="flex items-center gap-3 bg-zinc-800 border border-white/8 rounded-xl px-3 py-2">
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-xs font-semibold text-white truncate">{parte.name}</p>
                                                                                    <p className="text-[10px] text-zinc-500">
                                                                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parte.sale_price)} c/u
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                                    <button type="button" onClick={() => cambiarCantidadEdit(parte.item_id, -1)} className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 flex items-center justify-center text-sm leading-none transition-colors">−</button>
                                                                                    <span className="text-xs font-bold text-white w-4 text-center tabular-nums">{parte.quantity}</span>
                                                                                    <button type="button" onClick={() => cambiarCantidadEdit(parte.item_id, +1)} className="w-5 h-5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-300 flex items-center justify-center text-sm leading-none transition-colors">+</button>
                                                                                </div>
                                                                                <button type="button" onClick={() => quitarParteEdit(parte.item_id)} className="p-1 text-zinc-600 hover:text-rose-400 transition-colors">
                                                                                    <XCircle className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {editError && (
                                                                    <p className="text-xs text-rose-400">{editError}</p>
                                                                )}

                                                                <div className="flex gap-2 pt-1">
                                                                    <button
                                                                        type="button"
                                                                        onClick={cancelarEdicion}
                                                                        className="px-3 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                                                                    >
                                                                        Cancelar
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={guardarEdicion}
                                                                        disabled={guardandoEdicion}
                                                                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-all disabled:opacity-50"
                                                                    >
                                                                        {guardandoEdicion
                                                                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando...</>
                                                                            : <><Check className="w-3.5 h-3.5" /> Guardar cambios</>
                                                                        }
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            /* ── Read view ── */
                                                            <div className="space-y-2">
                                                                {act.notes && (
                                                                    <p className="text-sm text-zinc-300 leading-relaxed">{act.notes}</p>
                                                                )}

                                                                {act.parts && act.parts.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {act.parts.map((p, i) => (
                                                                            <span key={i} className="text-[11px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                                                                                {p.quantity}× {p.name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {act.photos && act.photos.length > 0 && (
                                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                                                                        {act.photos.map((url, i) => (
                                                                            <button
                                                                                key={i}
                                                                                type="button"
                                                                                onClick={() => setFotoAmpliada(url)}
                                                                                className="aspect-square rounded-xl overflow-hidden border border-white/10 hover:border-orange-500/40 transition-all group relative"
                                                                            >
                                                                                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                                                    <ZoomIn className="w-4 h-4 text-white" />
                                                                                </div>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* ── Footer ── */}
                <div className="shrink-0 px-5 py-4 border-t border-white/5 bg-zinc-900/40 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={enviar}
                        disabled={enviando || !observaciones.trim() || exito}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                        {enviando
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                            : exito
                                ? <><CheckCircle2 className="w-4 h-4" /> ¡Guardado!</>
                                : <><Send className="w-4 h-4" /> Guardar en Bitácora</>
                        }
                    </button>
                </div>
            </div>

            {/* Lightbox */}
            {fotoAmpliada && (
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setFotoAmpliada(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-xl transition-colors"
                        onClick={() => setFotoAmpliada(null)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={fotoAmpliada}
                        alt="Foto ampliada"
                        className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    )
}
