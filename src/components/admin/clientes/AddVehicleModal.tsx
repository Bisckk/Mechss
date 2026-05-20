'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Car, Loader2, Plus } from 'lucide-react'
import { createVehicleAction } from '@/lib/actions/admin'

interface AddVehicleModalProps {
    isOpen: boolean
    onClose: () => void
    clientId: string
    onSuccess: () => void
}

export default function AddVehicleModal({ isOpen, onClose, clientId, onSuccess }: AddVehicleModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [plate, setPlate] = useState('')
    const [brand, setBrand] = useState('')
    const [model, setModel] = useState('')
    const [year, setYear] = useState('')
    const [fuelType, setFuelType] = useState<'FI' | 'Carburada' | ''>('')
    const [error, setError] = useState('')
    const [montado, setMontado] = useState(false)

    useEffect(() => { setMontado(true) }, [])

    if (!montado || !isOpen) return null

    const resetForm = () => {
        setPlate(''); setBrand(''); setModel(''); setYear(''); setFuelType(''); setError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!plate.trim() || !brand.trim() || !model.trim()) return

        setIsSubmitting(true)
        setError('')

        const res = await createVehicleAction({
            client_id: clientId,
            plate: plate.trim(),
            brand: brand.trim(),
            model: model.trim(),
            year: year ? parseInt(year) : null,
            fuel_type: fuelType || null,
        })

        setIsSubmitting(false)

        if (res.ok) {
            resetForm()
            onSuccess()
            onClose()
        } else {
            setError(res.error)
        }
    }

    return createPortal(
        <div className="fixed inset-0 z-[155] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-zinc-900/50">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Car className="w-5 h-5 text-orange-500" /> Registrar Vehículo
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-xl p-3 font-medium">
                            {error}
                        </div>
                    )}

                    {/* Plate */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Placa <span className="text-rose-500">*</span></label>
                        <input
                            required
                            type="text"
                            placeholder="Ej. ABC123"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value.toUpperCase())}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600 font-mono tracking-widest uppercase"
                        />
                    </div>

                    {/* Brand + Model */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Marca <span className="text-rose-500">*</span></label>
                            <input
                                required
                                type="text"
                                placeholder="Ej. Yamaha"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Modelo <span className="text-rose-500">*</span></label>
                            <input
                                required
                                type="text"
                                placeholder="Ej. FZ 250"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Year + Fuel */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Año</label>
                            <input
                                type="number"
                                placeholder="Ej. 2023"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tipo Motor</label>
                            <div className="flex rounded-xl overflow-hidden border border-white/10 bg-zinc-900">
                                <button
                                    type="button"
                                    onClick={() => setFuelType(fuelType === 'FI' ? '' : 'FI')}
                                    className={`flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${fuelType === 'FI'
                                            ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                        }`}
                                >
                                    FI
                                </button>
                                <div className="w-px bg-white/10"></div>
                                <button
                                    type="button"
                                    onClick={() => setFuelType(fuelType === 'Carburada' ? '' : 'Carburada')}
                                    className={`flex-1 py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2 ${fuelType === 'Carburada'
                                            ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                                            : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                        }`}
                                >
                                    Carburada
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || !plate.trim() || !brand.trim() || !model.trim()}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {isSubmitting ? 'Registrando...' : 'Registrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
