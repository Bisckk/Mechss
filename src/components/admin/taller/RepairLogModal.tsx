'use client'

import { useState, useEffect, useRef } from 'react'
import {
    X, Wrench, Loader2, Camera, Send, Clock, User, Hash,
    Eye, EyeOff, ChevronDown, ImageIcon, Trash2, AlertCircle
} from 'lucide-react'
import {
    getRepairUpdatesAction, createRepairUpdateAction, updateRepairStatusAction
} from '@/lib/actions/admin'

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
    is_client_visible: boolean
    created_at: string
}

interface RepairLogModalProps {
    isOpen: boolean
    onClose: () => void
    repair: Repair | null
}

const statusConfig: Record<string, { label: string, color: string, bg: string }> = {
    'received': { label: 'Recibido', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    'in_progress': { label: 'En Diagnóstico', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    'repairing': { label: 'En Reparación', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    'waiting_parts': { label: 'Esperando Repuestos', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    'completed': { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    'delivered': { label: 'Entregado', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
    'cancelled': { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
}

const STATUS_OPTIONS = [
    { key: 'received', label: 'Recibido' },
    { key: 'in_progress', label: 'En Diagnóstico' },
    { key: 'repairing', label: 'En Reparación' },
    { key: 'waiting_parts', label: 'Esperando Repuestos' },
    { key: 'completed', label: 'Completado' },
    { key: 'delivered', label: 'Entregado' },
]

export default function RepairLogModal({ isOpen, onClose, repair }: RepairLogModalProps) {
    const [updates, setUpdates] = useState<RepairUpdate[]>([])
    const [isLoadingUpdates, setIsLoadingUpdates] = useState(false)
    const [newNote, setNewNote] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isClientVisible, setIsClientVisible] = useState(true)
    const [currentStatus, setCurrentStatus] = useState('')
    const [showStatusDropdown, setShowStatusDropdown] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        if (isOpen && repair) {
            setCurrentStatus(repair.status)
            loadUpdates()
        }
    }, [isOpen, repair])

    const loadUpdates = async () => {
        if (!repair) return
        setIsLoadingUpdates(true)
        const res = await getRepairUpdatesAction(repair.id)
        if (res.ok) setUpdates(res.data as RepairUpdate[])
        setIsLoadingUpdates(false)
    }

    const handleSubmitUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!repair || !newNote.trim()) return

        setIsSubmitting(true)
        const res = await createRepairUpdateAction(repair.id, newNote, [], isClientVisible)
        if (res.ok) {
            setNewNote('')
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

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={onClose} />

            <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-2xl flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.6)] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
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
                                    className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border ${config.bg} ${config.color} flex items-center gap-2 transition-all hover:opacity-80`}
                                >
                                    {config.label}
                                    <ChevronDown className="w-3 h-3" />
                                </button>

                                {showStatusDropdown && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                                        <p className="px-4 py-1 text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cambiar Estado</p>
                                        {STATUS_OPTIONS.map(opt => (
                                            <button
                                                key={opt.key}
                                                onClick={() => handleStatusChange(opt.key)}
                                                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left ${opt.key === currentStatus
                                                        ? 'text-orange-400 bg-orange-500/10'
                                                        : 'text-zinc-300 hover:bg-white/5'
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${opt.key === currentStatus ? 'bg-orange-500' : 'bg-zinc-600'}`}></div>
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all border border-transparent">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Repair info strip */}
                    <div className="mt-4 flex flex-wrap gap-3">
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
                            <Clock className="w-3.5 h-3.5" /> Ingresó: {new Date(repair.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {repair.estimated_cost && (
                            <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10 text-xs text-emerald-400 font-bold">
                                $ {new Intl.NumberFormat('es-CO').format(repair.estimated_cost)} COP
                            </div>
                        )}
                    </div>

                    {/* Issue Summary */}
                    <div className="mt-3 bg-zinc-800/30 border border-white/5 rounded-xl p-3">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Motivo de Ingreso</p>
                        <p className="text-sm text-zinc-300 leading-relaxed">{repair.reported_issue}</p>
                    </div>
                </div>

                {/* Compose Area */}
                <div className="shrink-0 p-5 border-b border-white/5 bg-zinc-900/30">
                    <form onSubmit={handleSubmitUpdate}>
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg">
                                M
                            </div>
                            <div className="flex-1">
                                <textarea
                                    ref={textareaRef}
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder="Documenta el proceso: ¿Qué hiciste? ¿Qué encontraste? ¿Qué repuesto instalaste?..."
                                    rows={2}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600 resize-none"
                                />
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-3">
                                        {/* Toggle Visibility */}
                                        <button
                                            type="button"
                                            onClick={() => setIsClientVisible(!isClientVisible)}
                                            className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${isClientVisible
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                    : 'bg-zinc-800 border-white/5 text-zinc-500'
                                                }`}
                                        >
                                            {isClientVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                            {isClientVisible ? 'Visible al Cliente' : 'Nota Interna'}
                                        </button>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newNote.trim()}
                                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-bold text-sm px-5 py-2 rounded-xl transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Publicar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

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
                            <p className="text-sm text-zinc-500 max-w-sm">Comienza documentando el proceso de reparación. Describe los hallazgos, repuestos usados o estado actual del vehículo.</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-[19px] top-4 bottom-4 w-px bg-gradient-to-b from-orange-500/40 via-white/5 to-transparent"></div>

                            <div className="space-y-6">
                                {updates.map((upd, idx) => {
                                    const sc = statusConfig[upd.status] || { label: upd.status, color: 'text-zinc-400', bg: 'bg-zinc-800' }
                                    const date = new Date(upd.created_at)

                                    return (
                                        <div key={upd.id} className="relative flex gap-4 group">
                                            {/* Node */}
                                            <div className="shrink-0 flex flex-col items-center z-10 pt-1">
                                                <div className={`w-3 h-3 rounded-full border-2 border-zinc-950 ${idx === 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-zinc-700 group-hover:bg-zinc-500'
                                                    } transition-colors`}></div>
                                            </div>

                                            {/* Card */}
                                            <div className="flex-1 bg-zinc-900/60 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color}`}>
                                                            {sc.label}
                                                        </span>
                                                        {!upd.is_client_visible && (
                                                            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full border border-white/5 flex items-center gap-1">
                                                                <EyeOff className="w-2.5 h-2.5" /> Interna
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                                                        <Clock className="w-3 h-3" />
                                                        {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{upd.notes}</p>

                                                {/* Photos */}
                                                {upd.photos && upd.photos.length > 0 && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {upd.photos.map((photo, i) => (
                                                            <div key={i} className="w-20 h-20 rounded-lg bg-zinc-800 border border-white/5 overflow-hidden">
                                                                <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                                                            </div>
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
        </div>
    )
}
