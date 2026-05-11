'use client'

import { useState, useTransition } from 'react'
import { X, Truck, Shield, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { entregarOrdenAction } from '@/lib/actions/garantias'

interface Repair {
    id: string
    tracking_code: string
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_plate: string | null
    clients: { id: string; full_name: string; phone: string | null } | null
}

interface Props {
    repair: Repair | null
    isOpen: boolean
    onClose: () => void
    onEntregado: (garantiaId: string) => void
}

const WARRANTY_OPTIONS = [
    { days: 30,  label: '30 días' },
    { days: 60,  label: '60 días' },
    { days: 90,  label: '90 días' },
    { days: 180, label: '6 meses' },
]

export default function GarantiaModal({ repair, isOpen, onClose, onEntregado }: Props) {
    const [validDays, setValidDays] = useState(30)
    const [terms, setTerms] = useState('')
    const [error, setError] = useState('')
    const [successId, setSuccessId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    if (!isOpen || !repair) return null

    const handleSubmit = () => {
        setError('')
        startTransition(async () => {
            const res = await entregarOrdenAction({
                repairId: repair.id,
                validDays,
                terms: terms.trim() || undefined,
            })
            if (!res.ok) { setError(res.error); return }
            setSuccessId(res.data.garantiaId)
        })
    }

    const handleClose = () => {
        if (successId) onEntregado(successId)
        else onClose()
        setSuccessId(null)
        setError('')
        setTerms('')
        setValidDays(30)
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validDays)

    return (
        <div className="fixed inset-0 z-[200] flex">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative ml-auto h-full w-full max-w-md bg-zinc-950 border-l border-white/10 shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <Truck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h2 className="font-bold text-white">Entregar Vehículo</h2>
                    </div>
                    <button onClick={handleClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {successId ? (
                    /* ── Success state ── */
                    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-5">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-black text-white">¡Vehículo Entregado!</h3>
                            <p className="text-sm text-zinc-400">Garantía generada correctamente.</p>
                        </div>
                        <div className="w-full bg-zinc-900 border border-white/5 rounded-2xl p-4 text-left space-y-3">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Orden</span>
                                <span className="text-orange-400 font-bold font-mono">#{repair.tracking_code}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Garantía</span>
                                <span className="text-emerald-400 font-bold">{validDays} días</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500">Vence el</span>
                                <span className="text-white font-semibold">
                                    {expiresAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </div>
                        <button onClick={handleClose} className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all">
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 scrollbar-none">

                            {/* Repair card */}
                            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                        #{repair.tracking_code}
                                    </span>
                                    {repair.vehicle_plate && (
                                        <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 tracking-widest">
                                            {repair.vehicle_plate.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm font-bold text-white">{repair.vehicle_brand} {repair.vehicle_model} {repair.vehicle_year}</p>
                                {repair.clients && <p className="text-xs text-zinc-500">{repair.clients.full_name}</p>}
                            </div>

                            {/* Warranty duration */}
                            <div className="space-y-2.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> Duración de Garantía
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {WARRANTY_OPTIONS.map(opt => (
                                        <button
                                            key={opt.days}
                                            onClick={() => setValidDays(opt.days)}
                                            className={`py-3 rounded-xl text-xs font-bold border transition-all ${validDays === opt.days
                                                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                                                : 'bg-zinc-900 border-white/8 text-zinc-500 hover:text-white hover:border-white/15'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-zinc-600">
                                    Vence el {expiresAt.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                                </p>
                            </div>

                            {/* Terms */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Términos de Garantía <span className="text-zinc-600 normal-case">(opcional)</span>
                                </label>
                                <textarea
                                    value={terms}
                                    onChange={e => setTerms(e.target.value)}
                                    placeholder="La garantía cubre los trabajos realizados. No aplica para daños por mal uso, accidentes, o desgaste natural..."
                                    rows={4}
                                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700 resize-none"
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 bg-red-500/8 border border-red-500/20 rounded-xl px-3 py-2.5">
                                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                    <p className="text-xs text-red-400">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-4 border-t border-white/5 flex-shrink-0 flex gap-3">
                            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-white/8 text-sm text-zinc-400 hover:text-white font-semibold transition-all">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isPending}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                                Entregar y Garantía
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
