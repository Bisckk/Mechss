'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import {
    X, Wrench, Loader2, Send, Clock, User, Hash,
    Eye, EyeOff, ChevronDown, Trash2, AlertCircle, Camera, ZoomIn, Package
} from 'lucide-react'
import {
    getRepairUpdatesAction, createRepairUpdateAction, updateRepairStatusAction,
    uploadRepairPhotoAction
} from '@/lib/actions/admin'
import { compressImage } from '@/lib/utils/imageCompression'

type Repair = {
    id: string
    tracking_code: string
    status: string
    reported_issue: string
    created_at: string
    estimated_cost: number | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_plate: string | null
    clients: { id: string; full_name: string; phone: string | null } | null
}

type RepairUpdate = {
    id: string
    status: string
    notes: string
    photos: string[]
    parts: { item_id: string; name: string; quantity: number; sale_price: number }[]
    is_client_visible: boolean
    created_at: string
    author: { full_name: string } | null
}

type PhotoPreview = {
    id: string
    dataUrl: string
    fileName: string
    sizeKB: number
    uploading: boolean
    uploadedUrl?: string
    error?: string
}

interface RepairLogModalProps {
    isOpen: boolean
    onClose: () => void
    repair: Repair | null
    userRole?: string
    readOnly?: boolean
}

const statusConfig: Record<string, { label: string, color: string, bg: string }> = {
    'received':      { label: 'Recibido',           color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
    'in_progress':   { label: 'En Diagnóstico',     color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
    'repairing':     { label: 'En Reparación',      color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    'waiting_parts': { label: 'Esperando Repuestos',color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20' },
    'completed':     { label: 'Completado',         color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
    'delivered':     { label: 'Entregado',          color: 'text-zinc-400',   bg: 'bg-zinc-500/10 border-zinc-500/20' },
    'cancelled':     { label: 'Cancelado',          color: 'text-red-500',    bg: 'bg-red-500/10 border-red-500/20' },
}

const STATUS_OPTIONS = [
    { key: 'received',      label: 'Recibido' },
    { key: 'in_progress',   label: 'En Diagnóstico' },
    { key: 'repairing',     label: 'En Reparación' },
    { key: 'waiting_parts', label: 'Esperando Repuestos' },
    { key: 'completed',     label: 'Completado' },
    { key: 'delivered',     label: 'Entregado' },
]

const MAX_PHOTOS = 5

export default function RepairLogModal({ isOpen, onClose, repair, userRole = 'admin', readOnly = false }: RepairLogModalProps) {
    const isMechanic = userRole === 'mechanic'

    const [updates, setUpdates] = useState<RepairUpdate[]>([])
    const [isLoadingUpdates, setIsLoadingUpdates] = useState(false)
    const [newNote, setNewNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isClientVisible, setIsClientVisible] = useState(true)
    const [currentStatus, setCurrentStatus] = useState('')
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)
    const [photos, setPhotos] = useState<PhotoPreview[]>([])
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const [montado, setMontado] = useState(false)

    useEffect(() => { setMontado(true) }, [])

    useEffect(() => {
        if (isOpen && repair) {
            setCurrentStatus(repair.status)
            loadUpdates()
        }
        if (!isOpen) {
            setPhotos([])
            setNewNote('')
        }
    }, [isOpen, repair])

    const loadUpdates = async () => {
        if (!repair) return
        setIsLoadingUpdates(true)
        const res = await getRepairUpdatesAction(repair.id)
        if (res.ok) setUpdates(res.data as RepairUpdate[])
        setIsLoadingUpdates(false)
    }

    // ── Photo handling ─────────────────────────────────────

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || !repair) return
        const remaining = MAX_PHOTOS - photos.length
        const toProcess = Array.from(files).slice(0, remaining)

        for (const file of toProcess) {
            if (!file.type.startsWith('image/')) continue

            const tempId = `${Date.now()}_${Math.random()}`

            // Add placeholder immediately
            setPhotos(prev => [...prev, {
                id: tempId, dataUrl: '', fileName: file.name,
                sizeKB: 0, uploading: true
            }])

            try {
                const { dataUrl, sizeKB } = await compressImage(file, {
                    maxWidth: 1200, maxHeight: 900, quality: 0.8, maxSizeKB: 300
                })

                // Update preview
                setPhotos(prev => prev.map(p => p.id === tempId ? { ...p, dataUrl, sizeKB, uploading: false } : p))

            } catch {
                setPhotos(prev => prev.filter(p => p.id !== tempId))
            }
        }
    }, [photos.length, repair])

    const removePhoto = (id: string) => {
        setPhotos(prev => prev.filter(p => p.id !== id))
    }

    // ── Submit ─────────────────────────────────────────────

    const handleSubmitUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!repair || (!newNote.trim() && photos.length === 0)) return

        setIsSubmitting(true)

        // Upload photos to Supabase Storage
        const uploadedUrls: string[] = []
        for (const photo of photos) {
            if (!photo.dataUrl) continue
            const res = await uploadRepairPhotoAction(repair.id, photo.dataUrl, photo.fileName)
            if (res.ok) uploadedUrls.push(res.data.url)
        }

        const visibility = isMechanic ? true : isClientVisible
        const res = await createRepairUpdateAction(repair.id, newNote, uploadedUrls, visibility)

        if (res.ok) {
            setNewNote('')
            setPhotos([])
            await loadUpdates()
            if (textareaRef.current) textareaRef.current.focus()
        } else {
            alert('Error: ' + res.error)
        }
        setIsSubmitting(false)
    }

    const handleStatusChange = async (newStatus: string) => {
        if (!repair || newStatus === currentStatus) return
        setShowStatusDropdown(false)
        setCurrentStatus(newStatus)
        await updateRepairStatusAction(repair.id, newStatus)
        await loadUpdates()
    }

    if (!isOpen || !repair) return null

    const config = statusConfig[currentStatus] || { label: currentStatus, color: 'text-zinc-400', bg: 'bg-zinc-800' }
    const canSubmit = newNote.trim() || photos.some(p => p.dataUrl && !p.uploading)

    if (!montado) return null

    return (
        <>
            {createPortal(
            <div className="fixed inset-0 z-[155] flex items-end sm:items-center justify-center p-0 sm:p-6">
                <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={onClose} />

                <div className="relative w-full max-w-4xl bg-zinc-950 border-0 sm:border border-white/10 rounded-t-2xl sm:rounded-2xl flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 h-[93dvh] sm:max-h-[90vh] overflow-hidden">

                    {/* Mobile drag handle */}
                    <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                        <div className="w-10 h-1 bg-white/15 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="p-5 border-b border-white/5 bg-gradient-to-r from-zinc-900 via-zinc-900/50 to-zinc-950 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                    <Wrench className="w-6 h-6 text-orange-500" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-lg font-black text-white">Bitácora de Reparación</h2>
                                        <span className="font-mono text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                            #{repair.tracking_code}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-zinc-400">{repair.vehicle_brand} {repair.vehicle_model} {repair.vehicle_year}</span>
                                        {repair.vehicle_plate && (
                                            <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 tracking-widest">
                                                {repair.vehicle_plate.toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Status Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                                        className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${config.bg} ${config.color} flex items-center gap-2 hover:opacity-80 transition-all`}
                                    >
                                        {config.label}
                                        <ChevronDown className="w-3 h-3" />
                                    </button>

                                    {showStatusDropdown && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowStatusDropdown(false)} />
                                            <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 z-20">
                                                <p className="px-4 py-1 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cambiar Estado</p>
                                                {STATUS_OPTIONS.map(opt => (
                                                    <button
                                                        key={opt.key}
                                                        onClick={() => handleStatusChange(opt.key)}
                                                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left ${opt.key === currentStatus ? 'text-orange-400 bg-orange-500/10' : 'text-zinc-300 hover:bg-white/5'}`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${opt.key === currentStatus ? 'bg-orange-500' : 'bg-zinc-600'}`} />
                                                        {opt.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all border border-transparent">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Info strip */}
                        <div className="mt-4 flex flex-wrap gap-2">
                            {repair.clients && (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400">
                                    <User className="w-3.5 h-3.5" /> {repair.clients.full_name}
                                </div>
                            )}
                            {repair.clients?.phone && (
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400">
                                    <Hash className="w-3.5 h-3.5" /> {repair.clients.phone}
                                </div>
                            )}
                            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400">
                                <Clock className="w-3.5 h-3.5" />
                                {new Date(repair.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            {repair.estimated_cost && (
                                <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 text-xs text-emerald-400 font-bold">
                                    $ {new Intl.NumberFormat('es-CO').format(repair.estimated_cost)} COP
                                </div>
                            )}
                        </div>

                        <div className="mt-3 bg-zinc-800/30 border border-white/5 rounded-xl p-3">
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Motivo de Ingreso</p>
                            <p className="text-sm text-zinc-300 leading-relaxed">{repair.reported_issue}</p>
                        </div>
                    </div>

                    {/* Compose Area */}
                    {!readOnly && <div className="shrink-0 p-5 border-b border-white/5 bg-zinc-900/30">
                        <form onSubmit={handleSubmitUpdate}>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
                                    {isMechanic ? 'M' : 'R'}
                                </div>
                                <div className="flex-1">
                                    <textarea
                                        ref={textareaRef}
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder={isMechanic
                                            ? "Documenta el proceso: ¿Qué hiciste? ¿Qué encontraste? ¿Qué instalaste?..."
                                            : "Agrega una nota al servicio..."
                                        }
                                        rows={2}
                                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600 resize-none"
                                    />

                                    {/* Photo previews */}
                                    {photos.length > 0 && (
                                        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
                                            {photos.map(photo => (
                                                <div
                                                    key={photo.id}
                                                    className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group cursor-pointer"
                                                    onClick={() => photo.dataUrl && !photo.uploading && setLightboxUrl(photo.dataUrl)}
                                                    ref={(el) => {
                                                        if (el && !el.dataset.animated) {
                                                            el.dataset.animated = 'true'
                                                            gsap.fromTo(el,
                                                                { scale: 0, opacity: 0 },
                                                                { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)', force3D: true }
                                                            )
                                                        }
                                                    }}
                                                >
                                                    {photo.uploading || !photo.dataUrl ? (
                                                        <div className="w-full h-full bg-zinc-800 flex flex-col items-center justify-center gap-1.5">
                                                            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                                                            <div className="w-10 h-0.5 bg-zinc-700 rounded-full overflow-hidden">
                                                                <div className="h-full bg-orange-500 rounded-full animate-[progress_1s_ease-in-out_infinite]" style={{ width: '60%' }} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <img src={photo.dataUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                                                <ZoomIn className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 text-[9px] text-white font-mono pointer-events-none">
                                                                {photo.sizeKB}KB
                                                            </div>
                                                        </>
                                                    )}

                                                    {!photo.uploading && (
                                                        <button
                                                            type="button"
                                                            onClick={e => { e.stopPropagation(); removePhoto(photo.id) }}
                                                            className="absolute top-1.5 right-1.5 p-1 bg-rose-500/90 hover:bg-rose-500 rounded-lg shadow-lg transition-colors z-10"
                                                        >
                                                            <Trash2 className="w-3 h-3 text-white" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center gap-2">
                                            {/* Photo upload button */}
                                            {photos.length < MAX_PHOTOS && (
                                                <>
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => handleFileSelect(e.target.files)}
                                                        onClick={(e) => (e.currentTarget.value = '')}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-white/10 bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/8 transition-all"
                                                    >
                                                        <Camera className="w-3.5 h-3.5" />
                                                        Fotos {photos.length > 0 && `(${photos.length}/${MAX_PHOTOS})`}
                                                    </button>
                                                </>
                                            )}

                                            {/* Visibility toggle */}
                                            {!isMechanic ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsClientVisible(!isClientVisible)}
                                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all
                                                        ${isClientVisible ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-800 border-white/5 text-zinc-500'}`}
                                                >
                                                    {isClientVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                    {isClientVisible ? 'Visible al Cliente' : 'Nota Interna'}
                                                </button>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-xs text-emerald-400/70 font-medium">
                                                    <Eye className="w-3.5 h-3.5" /> Visible al cliente
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting || !canSubmit}
                                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-5 py-2 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                                        >
                                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            {isSubmitting ? 'Publicando...' : 'Publicar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>}

                    {/* Timeline */}
                    <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {isLoadingUpdates ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                <p className="text-sm text-zinc-500 font-medium">Cargando bitácora...</p>
                            </div>
                        ) : updates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="w-16 h-16 rounded-full bg-zinc-800/50 border border-white/5 flex items-center justify-center mb-4">
                                    <AlertCircle className="w-7 h-7 text-zinc-600" />
                                </div>
                                <h4 className="text-lg font-bold text-white mb-2">Sin Entradas</h4>
                                <p className="text-sm text-zinc-500 max-w-sm">
                                    Comienza documentando el proceso de reparación con notas y fotos.
                                </p>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-orange-500/40 via-white/5 to-transparent" />
                                <div className="space-y-6">
                                    {updates.map((upd, idx) => {
                                        const sc = statusConfig[upd.status] || { label: upd.status, color: 'text-zinc-400', bg: 'bg-zinc-800' }
                                        const date = new Date(upd.created_at)

                                        return (
                                            <div key={upd.id} className="relative flex gap-4 group">
                                                <div className="shrink-0 z-10 pt-1">
                                                    <div className={`w-3 h-3 rounded-full border-2 border-zinc-950 transition-colors
                                                        ${idx === 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-zinc-700 group-hover:bg-zinc-500'}`}
                                                    />
                                                </div>

                                                <div className="flex-1 bg-zinc-900/60 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                                    <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                                                                {sc.label}
                                                            </span>
                                                            {upd.author && (
                                                                <span className="flex items-center gap-1 text-[10px] text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full border border-white/5">
                                                                    <User className="w-2.5 h-2.5" /> {upd.author.full_name}
                                                                </span>
                                                            )}
                                                            {!upd.is_client_visible && (
                                                                <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1">
                                                                    <EyeOff className="w-2.5 h-2.5" /> Interna
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] text-zinc-600 shrink-0">
                                                            <Clock className="w-3 h-3" />
                                                            {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    {upd.notes && (
                                                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{upd.notes}</p>
                                                    )}

                                                    {/* Partes utilizadas */}
                                                    {upd.parts && upd.parts.length > 0 && (
                                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                                            {upd.parts.map((p, i) => (
                                                                <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-medium">
                                                                    <Package className="w-2.5 h-2.5" />
                                                                    {p.quantity}× {p.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Photos grid */}
                                                    {upd.photos && upd.photos.length > 0 && (
                                                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                            {upd.photos.map((photo, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => setLightboxUrl(photo)}
                                                                    className="aspect-square rounded-xl overflow-hidden border border-white/8 hover:border-orange-500/40 transition-all group/photo relative"
                                                                >
                                                                    <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300" />
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
            </div>,
            document.body
            )}

            {/* Lightbox */}
            {lightboxUrl && createPortal(
                <div
                    className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        className="absolute top-4 right-4 p-2.5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <img
                        src={lightboxUrl}
                        alt="Vista completa"
                        className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    />
                </div>,
                document.body
            )}
        </>
    )
}
