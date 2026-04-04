'use client'

import { useState } from 'react'
import { Search, Loader2, Wrench, Clock, CheckCircle, Package, AlertTriangle, ArrowLeft, Camera, ChevronDown, MapPin, Phone } from 'lucide-react'
import Link from 'next/link'
import { lookupTrackingCodeAction } from '@/lib/actions/tracking'

type TrackingData = {
    repair: {
        id: string; tracking_code: string; status: string; reported_issue: string;
        created_at: string; estimated_completion: string | null;
        vehicle_brand: string | null; vehicle_model: string | null;
        vehicle_year: number | null; vehicle_plate: string | null;
    }
    updates: { id: string; status: string; notes: string; photos: string[]; created_at: string }[]
    workshop: { name: string; phone: string | null } | null
}

const STATUS_STEPS = [
    { key: 'received', label: 'Recibido', icon: Package },
    { key: 'in_progress', label: 'Diagnóstico', icon: Search },
    { key: 'repairing', label: 'En Reparación', icon: Wrench },
    { key: 'completed', label: 'Completado', icon: CheckCircle },
]

const statusLabels: Record<string, string> = {
    'received': 'Recibido', 'in_progress': 'En Diagnóstico', 'repairing': 'En Reparación',
    'waiting_parts': 'Esperando Repuestos', 'completed': 'Completado',
    'delivered': 'Entregado', 'cancelled': 'Cancelado',
}

export default function TrackingClient() {
    const [code, setCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [data, setData] = useState<TrackingData | null>(null)
    const [error, setError] = useState('')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return
        setIsSearching(true)
        setError('')
        setData(null)

        const res = await lookupTrackingCodeAction(code.trim())
        if (res.ok) {
            setData(res.data)
        } else {
            setError(res.error)
        }
        setIsSearching(false)
    }

    const getStepIndex = (status: string): number => {
        const idx = STATUS_STEPS.findIndex(s => s.key === status)
        return idx >= 0 ? idx : -1
    }

    const currentStepIndex = data ? getStepIndex(data.repair.status) : -1

    return (
        <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-blue-500/3 rounded-full blur-[100px]"></div>
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
                    <Link
                        href="/"
                        className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </Link>
                </div>
            </header>

            <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
                {/* Hero Section */}
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
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Vehicle + Workshop Card */}
                        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="font-mono text-sm font-black text-orange-400 bg-orange-500/10 px-3 py-1 rounded-lg border border-orange-500/20">
                                            #{data.repair.tracking_code}
                                        </span>
                                        <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${data.repair.status === 'completed' || data.repair.status === 'delivered'
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
                                    <div className="bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-right shrink-0">
                                        <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-1">Taller</p>
                                        <p className="text-sm text-white font-bold flex items-center gap-2 justify-end">
                                            <MapPin className="w-3.5 h-3.5 text-orange-400" /> {data.workshop.name}
                                        </p>
                                        {data.workshop.phone && (
                                            <p className="text-xs text-zinc-400 flex items-center gap-2 justify-end mt-1">
                                                <Phone className="w-3 h-3" /> {data.workshop.phone}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Issue */}
                            <div className="mt-5 bg-zinc-800/30 border border-white/5 rounded-xl p-4">
                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Motivo de Ingreso</p>
                                <p className="text-sm text-zinc-300 leading-relaxed">{data.repair.reported_issue}</p>
                            </div>

                            {/* Date Info */}
                            <div className="mt-4 flex flex-wrap gap-3">
                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-zinc-400 font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    Ingresó: {new Date(data.repair.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6">Progreso del Servicio</h3>
                            <div className="flex items-center justify-between relative">
                                {/* Progress Line */}
                                <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-zinc-800 rounded-full">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                        style={{ width: `${Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1) * 100)}%` }}
                                    ></div>
                                </div>

                                {STATUS_STEPS.map((step, i) => {
                                    const isActive = i <= currentStepIndex
                                    const isCurrent = i === currentStepIndex
                                    return (
                                        <div key={step.key} className="flex flex-col items-center relative z-10" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isCurrent
                                                    ? 'bg-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] scale-110'
                                                    : isActive
                                                        ? 'bg-orange-500/80'
                                                        : 'bg-zinc-800 border border-white/10'
                                                }`}>
                                                <step.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-zinc-600'}`} />
                                            </div>
                                            <p className={`text-[11px] font-bold mt-2 text-center ${isCurrent ? 'text-orange-400' : isActive ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-orange-500 rounded-full animate-ping"></div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                Bitácora de Procesos
                            </h3>

                            {data.updates.length === 0 ? (
                                <div className="text-center py-10 bg-zinc-800/20 border border-white/5 rounded-xl border-dashed">
                                    <Clock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                                    <p className="text-sm text-zinc-500 font-medium">El taller aún no ha publicado actualizaciones visibles.</p>
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="absolute left-[15px] top-3 bottom-3 w-px bg-gradient-to-b from-orange-500/40 via-white/5 to-transparent"></div>

                                    <div className="space-y-5">
                                        {data.updates.map((upd, idx) => {
                                            const date = new Date(upd.created_at)
                                            return (
                                                <div key={upd.id} className="relative flex gap-4 group">
                                                    <div className="shrink-0 flex flex-col items-center z-10 pt-1">
                                                        <div className={`w-3 h-3 rounded-full border-2 border-zinc-950 ${idx === 0 ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'bg-zinc-700'
                                                            }`}></div>
                                                    </div>
                                                    <div className="flex-1 bg-zinc-800/30 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-orange-500/10 border-orange-500/20 text-orange-400">
                                                                {statusLabels[upd.status] || upd.status}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{upd.notes}</p>

                                                        {upd.photos && upd.photos.length > 0 && (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {upd.photos.map((photo, i) => (
                                                                    <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-lg bg-zinc-800 border border-white/5 overflow-hidden hover:border-orange-500/30 transition-colors">
                                                                        <img src={photo} alt={`Evidencia ${i + 1}`} className="w-full h-full object-cover" />
                                                                    </a>
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

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-8 text-center">
                <p className="text-xs text-zinc-600">Powered by <span className="text-orange-500 font-bold">MotoFix Platform</span> · Seguimiento en tiempo real</p>
            </footer>
        </div>
    )
}
