'use client'

import { useState, useEffect, useRef } from 'react'
import {
    X, Wrench, CalendarIcon, Loader2, ChevronRight, FileText,
    AlertCircle, Clock, Plus, Printer, Share2, Eye, User
} from 'lucide-react'
import { getVehicleRepairsAction } from '@/lib/actions/admin'
import CreateServiceOrderModal from './CreateServiceOrderModal'
import RepairLogModal from '@/components/admin/taller/RepairLogModal'

type DbVehicle = {
    id: string
    plate: string
    brand: string
    model: string
    year: number | null
}

type RepairLog = {
    id: string
    tracking_code: string
    status: string
    reported_issue: string
    created_at: string
    estimated_completion: string | null
    estimated_cost: number | null
    final_cost: number | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_plate: string | null
    clients: { id: string; full_name: string; phone: string | null } | null
    mechanic: { id: string; full_name: string } | null
}

interface Props {
    isOpen: boolean
    onClose: () => void
    vehicle: DbVehicle | null
    clientId: string
    clientName?: string
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    received:      { label: 'Recibido',            color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20' },
    in_progress:   { label: 'En Diagnóstico',      color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
    waiting_parts: { label: 'Esperando Repuestos', color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/20' },
    repairing:     { label: 'En Reparación',       color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    completed:     { label: 'Completado',          color: 'text-emerald-400',bg: 'bg-emerald-500/10 border-emerald-500/20' },
    delivered:     { label: 'Entregado',           color: 'text-zinc-400',   bg: 'bg-zinc-500/10 border-zinc-500/20' },
    cancelled:     { label: 'Cancelado',           color: 'text-red-500',    bg: 'bg-red-500/10 border-red-500/20' },
}

export default function VehicleHistoryModal({ isOpen, onClose, vehicle, clientId, clientName }: Props) {
    const [repairs, setRepairs] = useState<RepairLog[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [selectedRepair, setSelectedRepair] = useState<RepairLog | null>(null)

    useEffect(() => {
        if (isOpen && vehicle) loadRepairs()
    }, [isOpen, vehicle])

    const loadRepairs = async () => {
        if (!vehicle) return
        setIsLoading(true)
        const res = await getVehicleRepairsAction(vehicle.id)
        if (res.ok) setRepairs(res.data as RepairLog[])
        setIsLoading(false)
    }

    const handlePrintHistory = () => window.print()

    const handleShare = (repair: RepairLog) => {
        const url = `${window.location.origin}/rastreo`
        navigator.clipboard.writeText(`Código de seguimiento: ${repair.tracking_code}\nConsulta el estado en: ${url}`)
            .then(() => alert('¡Enlace copiado! Compártelo con el cliente.'))
            .catch(() => alert(`Código: ${repair.tracking_code}`))
    }

    if (!isOpen || !vehicle) return null

    return (
        <>
            {/* Print styles */}
            <style>{`
                @media print {
                    body > * { display: none !important; }
                    #vehicle-history-print { display: block !important; position: fixed; inset: 0; z-index: 9999; background: white; padding: 24px; }
                }
                @media screen { #vehicle-history-print { display: none; } }
            `}</style>

            {/* Print-only version */}
            <div id="vehicle-history-print" className="p-6 bg-white text-black font-sans">
                <h1 className="text-2xl font-black mb-1">Historial Clínico Vehicular</h1>
                <p className="text-gray-500 mb-4">
                    {vehicle.brand} {vehicle.model} {vehicle.year} · {vehicle.plate}
                    {clientName && ` · Cliente: ${clientName}`}
                </p>
                {repairs.map((r, i) => {
                    const sc = statusConfig[r.status] || { label: r.status, color: '', bg: '' }
                    return (
                        <div key={r.id} className="border border-gray-200 rounded-xl p-4 mb-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-mono font-black text-orange-600">#{r.tracking_code}</span>
                                    <span className="ml-3 text-xs font-bold text-gray-500 uppercase">{sc.label}</span>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('es-CO')}</span>
                            </div>
                            <p className="text-sm text-gray-700">{r.reported_issue}</p>
                            {r.mechanic && <p className="text-xs text-gray-400 mt-1">Mecánico: {r.mechanic.full_name}</p>}
                            {(r.final_cost || r.estimated_cost) && (
                                <p className="text-xs font-bold text-gray-600 mt-1">
                                    Costo: $ {new Intl.NumberFormat('es-CO').format(r.final_cost || r.estimated_cost || 0)} COP
                                </p>
                            )}
                        </div>
                    )
                })}
                <p className="text-xs text-gray-400 mt-8 text-center">Generado el {new Date().toLocaleDateString('es-CO')}</p>
            </div>

            {/* Screen modal */}
            <div className="fixed inset-x-0 bottom-0 top-16 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

                <div className="relative w-full max-w-3xl bg-zinc-950 border-0 sm:border border-white/10 rounded-t-2xl sm:rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 h-[93dvh] sm:max-h-[90vh] overflow-hidden">

                    {/* Mobile drag handle */}
                    <div className="sm:hidden flex justify-center pt-3 pb-1 shrink-0">
                        <div className="w-10 h-1 bg-white/15 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between p-5 border-b border-white/5 bg-gradient-to-r from-zinc-900 via-zinc-900/50 to-zinc-950 shrink-0">
                        <div>
                            <h2 className="text-xl font-black text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                                    <FileText className="w-5 h-5 text-orange-500" />
                                </div>
                                Historial Clínico Vehicular
                            </h2>
                            <div className="flex items-center gap-2 mt-2 ml-1">
                                <span className="text-zinc-400 font-medium text-sm">{vehicle.brand} {vehicle.model} {vehicle.year}</span>
                                <span className="bg-white/10 text-white px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-widest border border-white/10">
                                    {vehicle.plate.toUpperCase()}
                                </span>
                                {repairs.length > 0 && (
                                    <span className="text-zinc-600 text-xs">{repairs.length} {repairs.length === 1 ? 'servicio' : 'servicios'}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            {repairs.length > 0 && (
                                <button
                                    onClick={handlePrintHistory}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/8 transition-all"
                                    title="Imprimir historial"
                                >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Imprimir</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-orange-500 hover:bg-orange-400 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                            >
                                <Plus className="w-3.5 h-3.5" /> Nueva Orden
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all border border-transparent"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                                <p className="text-sm text-zinc-500 font-semibold animate-pulse">Consultando historial...</p>
                            </div>
                        ) : repairs.length > 0 ? (
                            <div className="relative">
                                <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-orange-500/50 via-white/5 to-transparent hidden sm:block" />

                                <div className="space-y-5">
                                    {repairs.map((repair, idx) => {
                                        const config = statusConfig[repair.status] || { label: repair.status, color: 'text-zinc-400', bg: 'bg-zinc-800' }
                                        const date = new Date(repair.created_at)

                                        return (
                                            <div key={repair.id} className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                                                {/* Timeline Node */}
                                                <div className="hidden sm:flex shrink-0 w-14 flex-col items-center z-10 pt-2">
                                                    <div className={`w-4 h-4 rounded-full border-2 border-zinc-950 transition-colors
                                                        ${idx === 0 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-zinc-700 group-hover:bg-zinc-500'}`}
                                                    />
                                                </div>

                                                {/* Card */}
                                                <div className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap mb-2">
                                                                <span className="font-mono text-sm font-black text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                                                    #{repair.tracking_code}
                                                                </span>
                                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                                                                    {config.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-zinc-300 line-clamp-2">{repair.reported_issue}</p>
                                                        </div>

                                                        <div className="shrink-0 flex flex-col sm:items-end gap-1 text-xs text-zinc-500">
                                                            <div className="flex items-center gap-1.5 font-semibold">
                                                                <CalendarIcon className="w-3.5 h-3.5" />
                                                                {date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-zinc-600">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Meta row */}
                                                    <div className="flex items-center gap-3 flex-wrap text-xs text-zinc-600">
                                                        {repair.mechanic && (
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-4 h-4 rounded-full bg-orange-500/20 flex items-center justify-center">
                                                                    <span className="text-[8px] font-bold text-orange-400">{repair.mechanic.full_name.charAt(0)}</span>
                                                                </div>
                                                                <span className="text-orange-400/70">{repair.mechanic.full_name}</span>
                                                            </div>
                                                        )}
                                                        {(repair.final_cost || repair.estimated_cost) && (
                                                            <span className="text-emerald-400/70 font-semibold">
                                                                $ {new Intl.NumberFormat('es-CO').format(repair.final_cost || repair.estimated_cost || 0)} COP
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleShare(repair)}
                                                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 transition-all"
                                                            >
                                                                <Share2 className="w-3.5 h-3.5" />
                                                                Compartir código
                                                            </button>
                                                            <button
                                                                onClick={() => handleShare(repair)}
                                                                className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 px-2.5 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/8 transition-all"
                                                            >
                                                                <Printer className="w-3.5 h-3.5" />
                                                                Imprimir
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => setSelectedRepair(repair)}
                                                            className="flex items-center gap-2 text-xs font-semibold text-orange-400 hover:text-orange-300 px-3 py-1.5 rounded-xl bg-orange-500/8 hover:bg-orange-500/15 border border-orange-500/20 transition-all"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            Ver detalle
                                                            <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 px-6 bg-zinc-900/40 border border-white/5 rounded-2xl border-dashed flex flex-col items-center justify-center min-h-[300px]">
                                <div className="w-20 h-20 rounded-full bg-zinc-800/50 border border-white/5 flex items-center justify-center mx-auto mb-5 relative">
                                    <FileText className="w-8 h-8 text-zinc-500" />
                                    <div className="absolute -bottom-2 -right-2 bg-zinc-950 p-1.5 rounded-full">
                                        <AlertCircle className="w-5 h-5 text-orange-500" />
                                    </div>
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">Historial Limpio</h4>
                                <p className="text-sm text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
                                    Este vehículo aún no tiene ninguna orden de reparación registrada.
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="text-white text-sm font-bold bg-orange-500 hover:bg-orange-400 px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] inline-flex items-center gap-2"
                                >
                                    <Wrench className="w-4 h-4" /> Crear Primera Orden de Servicio
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Repair Detail Modal */}
            <RepairLogModal
                isOpen={!!selectedRepair}
                onClose={() => setSelectedRepair(null)}
                repair={selectedRepair}
                userRole="admin"
            />

            {/* Create Service Order Modal */}
            <CreateServiceOrderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                vehicleId={vehicle.id}
                clientId={clientId}
                vehicleBrand={vehicle.brand}
                vehicleModel={vehicle.model}
                vehicleYear={vehicle.year || undefined}
                vehiclePlate={vehicle.plate}
                onSuccess={loadRepairs}
            />
        </>
    )
}
