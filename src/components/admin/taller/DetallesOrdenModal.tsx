'use client'

import { useState, useEffect } from 'react'
import {
    X, Wrench, Loader2, Save, User, UserCog,
    DollarSign, FileText, Clock, AlertCircle
} from 'lucide-react'
import {
    getWorkshopMechanicsAction,
    updateRepairDetailsAction
} from '@/lib/actions/admin'
import CalendarioPicker from '@/components/ui/CalendarioPicker'

type ReparacionBase = {
    id: string
    tracking_code: string
    status: string
    reported_issue: string
    created_at: string
    estimated_completion: string | null
    estimated_cost: number | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_plate: string | null
    mechanic_id: string | null
    clients: { id: string; full_name: string; phone: string | null } | null
    mechanic: { id: string; full_name: string } | null
}

type Mecanico = { id: string; full_name: string; email: string }

function fechaHoy(): string {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

interface Props {
    isOpen:   boolean
    onClose:  () => void
    repair:   ReparacionBase | null
    onSaved:  () => void
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    received:      { label: 'Recibido',            color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/20' },
    in_progress:   { label: 'En Diagnóstico',      color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    repairing:     { label: 'En Reparación',       color: 'text-purple-400',  bg: 'bg-purple-500/10 border-purple-500/20' },
    waiting_parts: { label: 'Esp. Repuestos',      color: 'text-rose-400',    bg: 'bg-rose-500/10 border-rose-500/20' },
    completed:     { label: 'Completado',          color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    delivered:     { label: 'Entregado',           color: 'text-zinc-400',    bg: 'bg-zinc-500/10 border-zinc-500/20' },
    cancelled:     { label: 'Cancelado',           color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
}

export default function DetallesOrdenModal({ isOpen, onClose, repair, onSaved }: Props) {
    const [mecanicos, setMecanicos]         = useState<Mecanico[]>([])
    const [cargandoMecanicos, setCargandoMecanicos] = useState(false)
    const [guardando, setGuardando]         = useState(false)
    const [error, setError]                 = useState<string | null>(null)

    // Campos editables
    const [motivo, setMotivo]               = useState('')
    const [presupuesto, setPresupuesto]     = useState('')
    const [mecanicoId, setMecanicoId]       = useState<string>('')
    const [fechaEstimada, setFechaEstimada] = useState('')

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (!isOpen || !repair) return

        setMotivo(repair.reported_issue || '')
        setPresupuesto(repair.estimated_cost != null ? String(repair.estimated_cost) : '')
        setMecanicoId(repair.mechanic_id || '')
        setFechaEstimada(
            repair.estimated_completion
                ? new Date(repair.estimated_completion).toISOString().split('T')[0]
                : fechaHoy()
        )
        setError(null)
        cargarMecanicos()
    }, [isOpen, repair])

    const cargarMecanicos = async () => {
        setCargandoMecanicos(true)
        const res = await getWorkshopMechanicsAction()
        if (res.ok) setMecanicos(res.data as Mecanico[])
        setCargandoMecanicos(false)
    }

    const guardar = async () => {
        if (!repair || !motivo.trim()) return
        setGuardando(true)
        setError(null)

        const costo = presupuesto.trim() ? parseFloat(presupuesto.replace(/[^0-9.]/g, '')) : null

        const res = await updateRepairDetailsAction(repair.id, {
            reported_issue:       motivo.trim(),
            estimated_cost:       costo,
            mechanic_id:          mecanicoId || null,
            estimated_completion: fechaEstimada || null,
        })

        if (res.ok) {
            onSaved()
            onClose()
        } else {
            setError((res as any).error || 'Error al guardar cambios')
        }
        setGuardando(false)
    }

    if (!isOpen || !repair) return null

    const sc = statusConfig[repair.status] || { label: repair.status, color: 'text-zinc-400', bg: 'bg-zinc-800' }
    const fechaOriginal = repair.estimated_completion
        ? new Date(repair.estimated_completion).toISOString().split('T')[0]
        : null

    const hayCambios =
        motivo.trim() !== (repair.reported_issue || '') ||
        (presupuesto.trim() ? parseFloat(presupuesto.replace(/[^0-9.]/g, '')) : null) !== repair.estimated_cost ||
        (mecanicoId || null) !== (repair.mechanic_id || null) ||
        (fechaEstimada || null) !== fechaOriginal

    return (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-lg" onClick={onClose} />

            <div className="relative w-full max-w-xl bg-zinc-950 border-0 sm:border border-white/10 rounded-t-2xl sm:rounded-2xl flex flex-col shadow-[0_0_60px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[93dvh] sm:max-h-[88vh] overflow-hidden">

                {/* Drag handle móvil */}
                <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 bg-white/15 rounded-full" />
                </div>

                {/* Header */}
                <div className="p-5 border-b border-white/5 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                <Wrench className="w-5 h-5 text-orange-500" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <h2 className="text-base font-black text-white">Detalles del Servicio</h2>
                                    <span className="font-mono text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                        #{repair.tracking_code}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-400 flex-wrap">
                                    <span>{repair.vehicle_brand} {repair.vehicle_model} {repair.vehicle_year}</span>
                                    {repair.vehicle_plate && (
                                        <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 tracking-widest">
                                            {repair.vehicle_plate.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all border border-transparent flex-shrink-0"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Info strip */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                            {sc.label}
                        </span>
                        {repair.clients && (
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-xs text-zinc-400">
                                <User className="w-3 h-3" /> {repair.clients.full_name}
                                {repair.clients.phone && <span className="text-zinc-600">· {repair.clients.phone}</span>}
                            </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-xs text-zinc-500">
                            <Clock className="w-3 h-3" />
                            {new Date(repair.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* Motivo de ingreso */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            <FileText className="w-3.5 h-3.5" /> Motivo de Ingreso
                        </label>
                        <textarea
                            value={motivo}
                            onChange={e => setMotivo(e.target.value)}
                            rows={3}
                            placeholder="Describe el problema reportado por el cliente..."
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600 resize-none"
                        />
                    </div>

                    {/* Presupuesto */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            <DollarSign className="w-3.5 h-3.5" /> Presupuesto Estimado (COP)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <span className="text-zinc-500 font-bold text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                min="0"
                                step="1000"
                                value={presupuesto}
                                onChange={e => setPresupuesto(e.target.value)}
                                placeholder="0"
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600"
                            />
                        </div>
                        {presupuesto && !isNaN(parseFloat(presupuesto)) && (
                            <p className="text-xs text-zinc-500 mt-1.5 pl-1">
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(presupuesto))}
                            </p>
                        )}
                    </div>

                    {/* Mecánico */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            <UserCog className="w-3.5 h-3.5" /> Mecánico Asignado
                        </label>
                        {cargandoMecanicos ? (
                            <div className="flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-zinc-500">
                                <Loader2 className="w-4 h-4 animate-spin" /> Cargando mecánicos...
                            </div>
                        ) : (
                            <select
                                value={mecanicoId}
                                onChange={e => setMecanicoId(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">Sin asignar</option>
                                {mecanicos.map(m => (
                                    <option key={m.id} value={m.id}>{m.full_name}</option>
                                ))}
                            </select>
                        )}
                        {!cargandoMecanicos && mecanicos.length === 0 && (
                            <p className="text-xs text-zinc-600 mt-1.5 pl-1">No hay mecánicos activos en el taller.</p>
                        )}
                    </div>

                    {/* Fecha estimada de entrega */}
                    <div>
                        <label className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            <Clock className="w-3.5 h-3.5" /> Fecha Estimada de Entrega
                        </label>
                        <CalendarioPicker
                            value={fechaEstimada}
                            onChange={setFechaEstimada}
                            placeholder="Seleccionar fecha de entrega"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            <p className="text-sm text-rose-400">{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="shrink-0 p-5 border-t border-white/5 bg-zinc-900/30 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={guardar}
                        disabled={guardando || !motivo.trim() || !hayCambios}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                    >
                        {guardando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {guardando ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    )
}
