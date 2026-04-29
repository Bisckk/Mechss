'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Wrench, Loader2, Package, CheckCircle, Clock, AlertTriangle,
    Search, RefreshCw, ChevronRight, User, Phone, Hash, FileText
} from 'lucide-react'
import { gsap } from 'gsap'
import { getActiveRepairsAction, updateRepairStatusAction } from '@/lib/actions/admin'
import RepairLogModal from '@/components/admin/taller/RepairLogModal'

type Repair = {
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
    vehicle_id: string | null
    clients: { id: string; full_name: string; phone: string | null } | null
}

const COLUMNS = [
    { key: 'received', label: 'Recibidos', icon: Package, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
    { key: 'in_progress', label: 'En Diagnóstico', icon: Search, color: 'amber', gradient: 'from-amber-500 to-amber-600' },
    { key: 'repairing', label: 'En Reparación', icon: Wrench, color: 'purple', gradient: 'from-purple-500 to-purple-600' },
    { key: 'waiting_parts', label: 'Esperando Repuestos', icon: AlertTriangle, color: 'rose', gradient: 'from-rose-500 to-rose-600' },
    { key: 'completed', label: 'Completados', icon: CheckCircle, color: 'emerald', gradient: 'from-emerald-500 to-emerald-600' },
]

export default function TallerClient() {
    const [repairs, setRepairs] = useState<Repair[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [dragOverCol, setDragOverCol] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)

    useEffect(() => { loadRepairs() }, [])

    // Animate columns + header once data loads
    useEffect(() => {
        if (isLoading) return
        gsap.fromTo('.taller-header',
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.35, ease: 'expo.out', force3D: true }
        )
        gsap.fromTo('.kanban-col',
            { opacity: 0, y: 22, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: 'expo.out', force3D: true, delay: 0.05 }
        )
    }, [isLoading])

    const loadRepairs = async () => {
        setIsLoading(true)
        const res = await getActiveRepairsAction()
        if (res.ok) setRepairs(res.data as Repair[])
        setIsLoading(false)
    }

    const handleDragStart = (e: React.DragEvent, repairId: string) => {
        e.dataTransfer.setData('repairId', repairId)
        setIsDragging(true)
    }

    const handleDragEnd = () => {
        setIsDragging(false)
        setDragOverCol(null)
    }

    const handleDrop = async (e: React.DragEvent, newStatus: string) => {
        e.preventDefault()
        setDragOverCol(null)
        setIsDragging(false)
        const repairId = e.dataTransfer.getData('repairId')
        if (!repairId) return

        const repair = repairs.find(r => r.id === repairId)
        if (!repair || repair.status === newStatus) return

        // Optimistic update
        setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: newStatus } : r))

        const res = await updateRepairStatusAction(repairId, newStatus)
        if (!res.ok) {
            // Revert on failure
            setRepairs(prev => prev.map(r => r.id === repairId ? { ...r, status: repair.status } : r))
        }
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

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="text-zinc-500 font-semibold animate-pulse">Cargando órdenes activas del taller...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="taller-header flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                            <Wrench className="w-5 h-5 text-orange-500" />
                        </div>
                        Taller Activo
                    </h1>
                    <p className="text-sm text-zinc-500 mt-1 ml-[52px]">
                        {repairs.length} {repairs.length === 1 ? 'orden' : 'órdenes'} en proceso · Arrastra las tarjetas para cambiar su estado
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Buscar por placa, código, cliente..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                    <button
                        onClick={loadRepairs}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                        title="Refrescar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent -mx-2 px-2">
                {COLUMNS.map(col => {
                    const colRepairs = filteredRepairs.filter(r => r.status === col.key)
                    const isOver = dragOverCol === col.key

                    return (
                        <div
                            key={col.key}
                            className={`kanban-col flex-shrink-0 w-[300px] flex flex-col rounded-2xl border transition-[border-color,background-color,box-shadow] duration-200 ${isOver
                                    ? `border-${col.color}-500/50 bg-${col.color}-500/5 shadow-[0_0_30px_rgba(0,0,0,0.3)]`
                                    : 'border-white/5 bg-zinc-900/30'
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key) }}
                            onDragLeave={() => setDragOverCol(null)}
                            onDrop={(e) => handleDrop(e, col.key)}
                        >
                            {/* Column Header */}
                            <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${col.gradient} flex items-center justify-center shadow-lg`}>
                                        <col.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-white">{col.label}</h3>
                                    </div>
                                </div>
                                <span className={`text-xs font-black bg-white/5 border border-white/10 px-2.5 py-1 rounded-full text-zinc-400`}>
                                    {colRepairs.length}
                                </span>
                            </div>

                            {/* Cards Container */}
                            <div className={`flex-1 p-3 space-y-3 min-h-[200px] transition-all ${isOver ? 'bg-white/[0.02]' : ''}`}>
                                {colRepairs.length === 0 ? (
                                    <div className={`flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-xl transition-all ${isOver ? `border-${col.color}-500/30` : 'border-white/5'
                                        }`}>
                                        <col.icon className={`w-6 h-6 mb-2 ${isOver ? `text-${col.color}-400` : 'text-zinc-700'}`} />
                                        <p className="text-xs text-zinc-600 font-medium">
                                            {isDragging ? 'Soltar aquí' : 'Sin órdenes'}
                                        </p>
                                    </div>
                                ) : (
                                    colRepairs.map(repair => (
                                        <div
                                            key={repair.id}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, repair.id)}
                                            onDragEnd={handleDragEnd}
                                            onClick={() => setSelectedRepair(repair)}
                                            className="bg-zinc-900 border border-white/5 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-white/10 hover:shadow-lg transition-all group relative overflow-hidden"
                                        >
                                            {/* Top hover glow */}
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                            {/* Tracking Code & Plate */}
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-mono text-[11px] font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                                    #{repair.tracking_code}
                                                </span>
                                                {repair.vehicle_plate && (
                                                    <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 tracking-widest">
                                                        {repair.vehicle_plate.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Vehicle Info */}
                                            <p className="text-sm font-bold text-white mb-1 leading-tight">
                                                {repair.vehicle_brand} {repair.vehicle_model}
                                                {repair.vehicle_year ? ` ${repair.vehicle_year}` : ''}
                                            </p>

                                            {/* Issue */}
                                            <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
                                                {repair.reported_issue}
                                            </p>

                                            {/* Client */}
                                            {repair.clients && (
                                                <div className="flex items-center gap-2 mb-3 text-xs text-zinc-500">
                                                    <User className="w-3 h-3" />
                                                    <span className="truncate">{repair.clients.full_name}</span>
                                                </div>
                                            )}

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                                <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(repair.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                </div>
                                                <div className="flex items-center gap-1 text-[10px] text-orange-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <FileText className="w-3 h-3" /> Bitácora
                                                    <ChevronRight className="w-3 h-3" />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Repair Log Modal */}
            <RepairLogModal
                isOpen={!!selectedRepair}
                onClose={() => { setSelectedRepair(null); loadRepairs() }}
                repair={selectedRepair}
            />
        </div>
    )
}
