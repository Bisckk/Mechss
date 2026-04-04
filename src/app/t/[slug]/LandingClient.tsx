'use client'

import { useState } from 'react'
import { Search, Loader2, Wrench, Clock, CheckCircle, Package, AlertTriangle, ArrowLeft, Camera, ChevronDown, MapPin, Phone, Zap } from 'lucide-react'
import { lookupTrackingCodeAction } from '@/lib/actions/tracking'

type LandingConfig = {
    theme_preset: string
    font_family: string
    button_radius: string
    primary_color: string
    bg_color: string
    blocks: any[]
}

type Workshop = {
    name: string
    phone: string | null
    map_url: string | null
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

export default function LandingClient({ config, workshop }: { config: LandingConfig, workshop: Workshop }) {
    const [code, setCode] = useState('')
    const [isSearching, setIsSearching] = useState(false)
    const [trackingData, setTrackingData] = useState<any>(null)
    const [error, setError] = useState('')

    const heroBlock = config.blocks.find(b => b.type === 'hero')
    const trackBlock = config.blocks.find(b => b.type === 'tracking')

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!code.trim()) return
        setIsSearching(true)
        setError('')
        setTrackingData(null)

        const res = await lookupTrackingCodeAction(code.trim())
        if (res.ok) {
            setTrackingData(res.data)
        } else {
            setError(res.error)
        }
        setIsSearching(false)
    }

    const currentStepIndex = trackingData ? STATUS_STEPS.findIndex(s => s.key === trackingData.repair.status) : -1

    return (
        <div
            className="min-h-screen text-white relative overflow-hidden"
            style={{ fontFamily: config.font_family, backgroundColor: config.bg_color || '#09090b' }}
        >
            {/* Ambient Base Light */}
            <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] blur-[150px] opacity-10 pointer-events-none"
                style={{ backgroundColor: config.primary_color }}
            ></div>

            {/* Optional Hero Banner Image */}
            {heroBlock?.content.image_url && (
                <div className="absolute top-0 left-0 w-full h-[500px] sm:h-[600px] pointer-events-none overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 transition-all duration-700"
                        style={{ backgroundImage: `url(${heroBlock.content.image_url})` }}
                    ></div>
                    {/* Gradient to fade into the background color */}
                    <div
                        className="absolute inset-0"
                        style={{ background: `linear-gradient(to bottom, transparent 0%, transparent 40%, ${config.bg_color || '#09090b'} 100%)` }}
                    ></div>
                </div>
            )}

            {/* Header */}
            <header className="px-6 py-6 border-b border-white/5 relative z-10 backdrop-blur-md max-w-5xl mx-auto flex items-center justify-between">
                <div className="font-black text-2xl tracking-tight flex items-center gap-3">
                    <Zap className="w-6 h-6" style={{ color: config.primary_color }} />
                    {workshop.name}
                </div>
                {workshop.phone && (
                    <div className="text-zinc-400 text-sm flex items-center gap-2 font-medium">
                        <Phone className="w-4 h-4" /> {workshop.phone}
                    </div>
                )}
            </header>

            <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24">

                {/* Hero Section */}
                {heroBlock && heroBlock.visible && !trackingData && (
                    <section className="text-center mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                            {heroBlock.content.title}
                        </h1>
                        <p className="text-zinc-400 text-xl max-w-2xl mx-auto leading-relaxed">
                            {heroBlock.content.subtitle}
                        </p>
                    </section>
                )}

                {/* Tracking Input Area */}
                {trackBlock && trackBlock.visible && !trackingData && (
                    <section className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 p-8 sm:p-10 rounded-3xl shadow-2xl relative overflow-hidden">
                            {/* Subtle internal glow */}
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${config.primary_color}, transparent)` }}></div>

                            <div className="flex flex-col items-center text-center mb-8">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6" style={{ backgroundColor: `${config.primary_color}20` }}>
                                    <Search className="w-8 h-8" style={{ color: config.primary_color }} />
                                </div>
                                <h3 className="text-2xl font-bold text-white tracking-tight mb-2">{trackBlock.content.title || 'Rastreo en Tiempo Real'}</h3>
                                <p className="text-zinc-400 font-medium">{trackBlock.content.subtitle || 'Ingresa tu código para ver estadísticas de tu vehículo.'}</p>
                            </div>

                            <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-zinc-500 font-mono font-bold">#</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                                        placeholder="REP-XXXXXXX"
                                        className={`w-full bg-black/60 border border-white/10 ${config.button_radius} pl-10 pr-4 py-4 text-lg font-mono font-bold text-white tracking-widest focus:outline-none transition-colores placeholder:text-zinc-700`}
                                        style={{ outlineColor: config.primary_color }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSearching || !code.trim()}
                                    className={`px-8 py-4 font-bold text-white text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 ${config.button_radius}`}
                                    style={{ backgroundColor: config.primary_color, boxShadow: `0 0 20px ${config.primary_color}40` }}
                                >
                                    {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                                </button>
                            </form>

                            {error && (
                                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold text-center animate-in fade-in">
                                    {error}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* --- TRACKING RESULTS (Same as previous component, but adapted to custom colors) --- */}
                {trackingData && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl mx-auto">
                        <button
                            onClick={() => { setTrackingData(null); setCode('') }}
                            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4"
                        >
                            <ArrowLeft className="w-4 h-4" /> Volver a buscar
                        </button>

                        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-3xl p-6 sm:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: `${config.primary_color}15` }}></div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="font-mono text-sm font-black text-black px-3 py-1 rounded-lg" style={{ backgroundColor: config.primary_color }}>
                                            #{trackingData.repair.tracking_code}
                                        </span>
                                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-white">
                                            {statusLabels[trackingData.repair.status] || trackingData.repair.status}
                                        </span>
                                    </div>
                                    <h2 className="text-3xl font-black text-white">
                                        {trackingData.repair.vehicle_brand} {trackingData.repair.vehicle_model}
                                    </h2>
                                    {trackingData.repair.vehicle_plate && (
                                        <span className="inline-block mt-3 bg-white/5 text-zinc-300 px-4 py-1.5 rounded-lg text-sm font-mono font-black tracking-widest border border-white/10">
                                            Placa: {trackingData.repair.vehicle_plate.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 flex gap-3 text-xs text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Ingreso: {new Date(trackingData.repair.created_at).toLocaleDateString('es-ES')}
                                </div>
                            </div>
                        </div>

                        {/* Progress */}
                        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-3xl p-6 sm:p-8">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-8">Etapa Actual</h3>
                            <div className="flex items-center justify-between relative">
                                <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-zinc-800 rounded-full">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{ width: `${Math.max(0, currentStepIndex / (STATUS_STEPS.length - 1) * 100)}%`, backgroundColor: config.primary_color, boxShadow: `0 0 10px ${config.primary_color}` }}
                                    ></div>
                                </div>

                                {STATUS_STEPS.map((step, i) => {
                                    const isActive = i <= currentStepIndex
                                    const isCurrent = i === currentStepIndex
                                    return (
                                        <div key={step.key} className="flex flex-col items-center relative z-10" style={{ width: `${100 / STATUS_STEPS.length}%` }}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${isCurrent ? 'scale-110' : ''}`}
                                                style={{ backgroundColor: isCurrent ? config.primary_color : isActive ? `${config.primary_color}AA` : '#27272a', border: `1px solid ${isActive ? 'transparent' : '#3f3f46'}` }}
                                            >
                                                <step.icon className={`w-5 h-5 ${isActive ? (isCurrent ? 'text-black' : 'text-zinc-900') : 'text-zinc-600'}`} />
                                            </div>
                                            <p className={`text-xs font-bold mt-3 text-center ${isCurrent ? 'text-white' : isActive ? 'text-zinc-300' : 'text-zinc-600'}`}>
                                                {step.label}
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Updates Log */}
                        <div className="bg-zinc-900/60 backdrop-blur-sm border border-white/5 rounded-3xl p-6 sm:p-8">
                            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Clock className="w-4 h-4" /> Bitácora de Procesos
                            </h3>

                            <div className="space-y-6">
                                {trackingData.updates.map((upd: any, idx: number) => {
                                    const date = new Date(upd.created_at)
                                    return (
                                        <div key={upd.id} className="relative flex gap-4">
                                            <div className="shrink-0 flex flex-col items-center z-10 pt-1">
                                                <div className="w-3 h-3 rounded-full border-2 border-zinc-950" style={{ backgroundColor: idx === 0 ? config.primary_color : '#3f3f46', boxShadow: idx === 0 ? `0 0 8px ${config.primary_color}` : 'none' }}></div>
                                                {idx !== trackingData.updates.length - 1 && <div className="w-px h-full bg-zinc-800 mt-2"></div>}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex items-center gap-2 border border-white/5 rounded-2xl p-5 bg-zinc-800/30">
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10 text-zinc-300 bg-white/5">
                                                                {statusLabels[upd.status] || upd.status}
                                                            </span>
                                                            <span className="text-[10px] text-zinc-500 font-mono">
                                                                {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} · {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-white leading-relaxed">{upd.notes}</p>
                                                        {upd.photos && upd.photos.length > 0 && (
                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                {upd.photos.map((photo: string, i: number) => (
                                                                    <a key={i} href={photo} target="_blank" rel="noopener noreferrer" className="block w-24 h-24 rounded-xl bg-zinc-950 border border-white/10 overflow-hidden hover:border-white/30 transition-colors">
                                                                        <img src={photo} alt={`Evidencia`} className="w-full h-full object-cover" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>
                )}
            </main>
        </div>
    )
}
