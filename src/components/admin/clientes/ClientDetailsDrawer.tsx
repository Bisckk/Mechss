'use client'

import { useState, useEffect } from 'react'
import { X, User, Car, CalendarIcon, PenLine, Plus, Phone, Mail, FileText, Loader2, Thermometer, Zap } from 'lucide-react'
import { getClientVehiclesAction } from '@/lib/actions/admin'
import VehicleHistoryModal from './VehicleHistoryModal'
import AddVehicleModal from './AddVehicleModal'

type DbClient = {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    created_at: string;
    is_active: boolean;
}

type DbVehicle = {
    id: string;
    plate: string;
    brand: string;
    model: string;
    year: number | null;
    fuel_type: 'FI' | 'Carburada' | null;
}

interface ClientDetailsDrawerProps {
    isOpen: boolean
    onClose: () => void
    client: DbClient | null
}

export default function ClientDetailsDrawer({ isOpen, onClose, client }: ClientDetailsDrawerProps) {
    const [vehicles, setVehicles] = useState<DbVehicle[]>([])
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false)
    const [selectedVehicleHistory, setSelectedVehicleHistory] = useState<DbVehicle | null>(null)
    const [showAddVehicle, setShowAddVehicle] = useState(false)

    useEffect(() => {
        if (isOpen && client) {
            loadVehicles()
        }
    }, [isOpen, client])

    const loadVehicles = async () => {
        if (!client) return
        setIsLoadingVehicles(true)
        const res = await getClientVehiclesAction(client.id)
        if (res.ok) {
            setVehicles(res.data as DbVehicle[])
        }
        setIsLoadingVehicles(false)
    }

    if (!isOpen || !client) return null

    const colors = ['orange', 'blue', 'emerald', 'violet', 'rose', 'cyan']
    const color = colors[client.full_name.charCodeAt(0) % colors.length]

    return (
        <div className="fixed inset-x-0 bottom-0 top-16 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-zinc-900/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${Object.fromEntries([
                            ['orange', 'from-orange-500/30 to-amber-600/20 text-orange-400'],
                            ['blue', 'from-blue-500/30 to-indigo-600/20 text-blue-400'],
                            ['emerald', 'from-emerald-500/30 to-teal-600/20 text-emerald-400'],
                            ['violet', 'from-violet-500/30 to-purple-600/20 text-violet-400'],
                            ['rose', 'from-rose-500/30 to-pink-600/20 text-rose-400'],
                            ['cyan', 'from-cyan-500/30 to-sky-600/20 text-cyan-400']
                        ])[color]} flex items-center justify-center text-xl font-black shrink-0 shadow-inner border border-white/5`}>
                            {client.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                {client.full_name}
                                {!client.is_active && (
                                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Inactivo</span>
                                )}
                            </h2>
                            <p className="text-sm text-zinc-400 mt-1">Registrado el {new Date(client.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">

                        {/* --- Client Info Section --- */}
                        <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-5">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <User className="w-4 h-4 text-orange-500" /> Datos de Contacto
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                        <Phone className="w-4 h-4 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Teléfono</p>
                                        <p className="text-sm text-white font-medium">{client.phone || <span className="text-zinc-600 italic">No registrado</span>}</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block w-px bg-white/5 h-10 self-center"></div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                                        <Mail className="w-4 h-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Correo Electrónico</p>
                                        <p className="text-sm text-white font-medium">{client.email || <span className="text-zinc-600 italic">No registrado</span>}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Vehicles Section --- */}
                        <div className="space-y-4 pt-2">
                            <div className="flex justify-between items-end mb-4 px-1">
                                <div>
                                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                                        Flota de Vehículos
                                        <span className="bg-zinc-800 text-zinc-400 text-xs px-2 py-0.5 rounded-full border border-white/5">{vehicles.length}</span>
                                    </h3>
                                    <p className="text-xs text-zinc-500 mt-1">Motos registradas en el taller para este cliente</p>
                                </div>
                                <button
                                    onClick={() => setShowAddVehicle(true)}
                                    className="flex items-center gap-2 bg-zinc-900 hover:bg-orange-600 hover:text-white hover:border-orange-500 text-orange-500 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-orange-500/30 group shadow-[0_0_10px_rgba(249,115,22,0.1)] hover:shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                                >
                                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                                    <span className="hidden sm:inline">Añadir Vehículo</span>
                                    <span className="sm:hidden">Nuevo</span>
                                </button>
                            </div>

                            {isLoadingVehicles ? (
                                <div className="flex justify-center py-12 bg-zinc-900/40 rounded-2xl border border-white/5">
                                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                                </div>
                            ) : vehicles.length > 0 ? (
                                <div className="grid grid-cols-1 gap-4">
                                    {vehicles.map((v) => (
                                        <div key={v.id} className="relative bg-zinc-900 border-l-2 border-l-orange-500 border-y border-r border-white/5 rounded-2xl p-5 hover:border-r-white/10 hover:border-y-white/10 transition-all group overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                                            {/* Glowing subtle background */}
                                            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-colors pointer-events-none"></div>

                                            <div className="flex items-center gap-5 relative z-10">
                                                <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:border-orange-500/30 transition-colors">
                                                    <Car className="w-7 h-7 text-zinc-500 group-hover:text-orange-400 transition-colors" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1.5">
                                                        <h4 className="font-bold text-white text-lg group-hover:text-orange-300 transition-colors">{v.brand} {v.model}</h4>
                                                        <div className="bg-black/50 backdrop-blur-md text-white px-2.5 py-0.5 rounded text-[11px] font-black font-mono tracking-widest border border-white/10 shadow-inner">
                                                            {v.plate.toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500">
                                                        {v.year && <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-zinc-400" /> Modelo {v.year}</span>}
                                                        {v.fuel_type === 'FI' && <span className="flex items-center gap-1.5 text-emerald-400/90"><Zap className="w-3.5 h-3.5" /> Full Injection</span>}
                                                        {v.fuel_type === 'Carburada' && <span className="flex items-center gap-1.5 text-rose-400/90"><Thermometer className="w-3.5 h-3.5" /> Carburador</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative z-10 flex sm:flex-col justify-end sm:items-end gap-2 border-t border-white/5 pt-4 sm:pt-0 sm:border-0 w-full sm:w-auto">
                                                <button
                                                    onClick={() => setSelectedVehicleHistory(v)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center sm:justify-start gap-2 bg-white/5 hover:bg-orange-500 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5 hover:border-orange-500 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                                                >
                                                    <FileText className="w-4 h-4" /> Historial
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 px-6 bg-zinc-900/40 border border-white/5 rounded-2xl border-dashed">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800/50 border border-white/5 flex items-center justify-center mx-auto mb-4">
                                        <Car className="w-7 h-7 text-zinc-500" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-2">Sin vehículos registrados</h4>
                                    <p className="text-sm text-zinc-400 mb-6 max-w-sm mx-auto leading-relaxed">Este cliente aún no tiene ninguna flota. Comienza agregando su primer vehículo.</p>
                                    <button
                                        onClick={() => setShowAddVehicle(true)}
                                        className="text-orange-500 text-sm font-bold bg-orange-500/10 hover:bg-orange-500 hover:text-white px-6 py-2.5 rounded-xl transition-all border border-orange-500/20 items-center justify-center gap-2 inline-flex shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                                    >
                                        <Plus className="w-4 h-4" /> Registrar Primer Vehículo
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Vehicle History Sub-Modal */}
            <VehicleHistoryModal
                isOpen={!!selectedVehicleHistory}
                onClose={() => setSelectedVehicleHistory(null)}
                vehicle={selectedVehicleHistory}
                clientId={client.id}
            />

            {/* Add Vehicle Sub-Modal */}
            <AddVehicleModal
                isOpen={showAddVehicle}
                onClose={() => setShowAddVehicle(false)}
                clientId={client.id}
                onSuccess={loadVehicles}
            />
        </div>
    )
}
