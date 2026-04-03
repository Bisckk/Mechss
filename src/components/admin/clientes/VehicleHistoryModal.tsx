'use client'

import { useState, useEffect } from 'react'
import { X, Wrench, CalendarIcon, Loader2, ChevronRight, FileText, AlertCircle, Clock, Plus } from 'lucide-react'
import { getVehicleRepairsAction } from '@/lib/actions/admin'
import CreateServiceOrderModal from './CreateServiceOrderModal'

type DbVehicle = {
    id: string;
    plate: string;
    brand: string;
    model: string;
    year: number | null;
}

type RepairLog = {
    id: string;
    tracking_code: string;
    status: 'received' | 'in_progress' | 'waiting_parts' | 'repairing' | 'completed' | 'delivered' | 'cancelled';
    reported_issue: string;
    created_at: string;
    estimated_completion: string | null;
}

interface VehicleHistoryModalProps {
    isOpen: boolean
    onClose: () => void
    vehicle: DbVehicle | null
    clientId: string
}

const statusConfig: Record<string, { label: string, color: string, bg: string }> = {
    'received': { label: 'Recibido', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    'in_progress': { label: 'En Diagnóstico', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    'waiting_parts': { label: 'Esperando Repuestos', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
    'repairing': { label: 'En Reparación', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    'completed': { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    'delivered': { label: 'Entregado', color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20' },
    'cancelled': { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' },
}

export default function VehicleHistoryModal({ isOpen, onClose, vehicle, clientId }: VehicleHistoryModalProps) {
    const [repairs, setRepairs] = useState<RepairLog[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        if (isOpen && vehicle) {
            loadRepairs()
        }
    }, [isOpen, vehicle])

    const loadRepairs = async () => {
        if (!vehicle) return
        setIsLoading(true)
        const res = await getVehicleRepairsAction(vehicle.id)
        if (res.ok) {
            setRepairs(res.data as RepairLog[])
        }
        setIsLoading(false)
    }

    if (!isOpen || !vehicle) return null

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-3xl bg-zinc-950 border border-white/10 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
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
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-orange-500 hover:bg-orange-400 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                        >
                            <Plus className="w-4 h-4" /> Nueva Orden
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-zinc-500 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/50 rounded-xl transition-all border border-transparent"
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
                            <p className="text-sm text-zinc-500 font-semibold animate-pulse">Consultando bitácora de reparaciones...</p>
                        </div>
                    ) : repairs.length > 0 ? (
                        <div className="relative">
                            {/* Timeline Line */}
                            <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-orange-500/50 via-white/5 to-transparent hidden sm:block"></div>

                            <div className="space-y-6">
                                {repairs.map((repair, idx) => {
                                    const config = statusConfig[repair.status] || { label: repair.status, color: 'text-zinc-400', bg: 'bg-zinc-800' }
                                    const date = new Date(repair.created_at)

                                    return (
                                        <div key={repair.id} className="relative flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                                            {/* Timeline Node */}
                                            <div className="hidden sm:flex shrink-0 w-14 flex-col items-center z-10 pt-1">
                                                <div className={`w-4 h-4 rounded-full border-2 border-zinc-950 ${idx === 0 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-zinc-700 group-hover:bg-zinc-500'} transition-colors`}></div>
                                            </div>

                                            {/* Repair Card */}
                                            <div className="flex-1 bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all cursor-pointer group-hover:-translate-y-0.5 group-hover:shadow-xl relative overflow-hidden">
                                                {/* Hover Glow */}
                                                <div className={`absolute -inset-20 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full duration-1000 transition-all pointer-events-none -skew-x-12`}></div>

                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <span className="font-mono text-sm font-black text-white bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                                                #{repair.tracking_code}
                                                            </span>
                                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.bg} ${config.color}`}>
                                                                {config.label}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-medium text-zinc-300 line-clamp-2 pr-8">{repair.reported_issue}</h4>
                                                    </div>

                                                    <div className="shrink-0 flex flex-col sm:items-end gap-1">
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-semibold">
                                                            <CalendarIcon className="w-3.5 h-3.5" />
                                                            {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                                        <Wrench className="w-3.5 h-3.5" />
                                                        <span>Ver bitácora detallada del proceso</span>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white text-zinc-500 transition-colors">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-zinc-900/40 border border-white/5 rounded-2xl border-dashed h-full flex flex-col items-center justify-center">
                            <div className="w-20 h-20 rounded-full bg-zinc-800/50 border border-white/5 flex items-center justify-center mx-auto mb-5 relative">
                                <FileText className="w-8 h-8 text-zinc-500" />
                                <div className="absolute -bottom-2 -right-2 bg-zinc-950 p-1.5 rounded-full">
                                    <AlertCircle className="w-5 h-5 text-orange-500" />
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-white mb-2">Historial Limpio</h4>
                            <p className="text-sm text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">
                                Este vehículo aún no tiene ninguna orden de reparación registrada en el sistema del taller.
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="text-orange-950 text-sm font-bold bg-orange-500 hover:bg-orange-400 px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] items-center justify-center gap-2 inline-flex"
                            >
                                <Wrench className="w-4 h-4" /> Crear Primera Orden de Servicio
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Service Order Sub-Modal */}
            <CreateServiceOrderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                vehicleId={vehicle.id}
                clientId={clientId}
                vehicleBrand={vehicle.brand}
                vehicleModel={vehicle.model}
                vehicleYear={vehicle.year || undefined}
                vehiclePlate={vehicle.plate}
                onSuccess={() => {
                    loadRepairs(); // Reload repairing list
                }}
            />
        </div>
    )
}
