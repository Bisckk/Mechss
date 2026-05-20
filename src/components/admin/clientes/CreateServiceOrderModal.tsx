'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Wrench, FileText, Loader2, DollarSign, PenTool, Hash } from 'lucide-react'
import { createServiceOrderAction } from '@/lib/actions/admin'

interface CreateServiceOrderModalProps {
    isOpen: boolean
    onClose: () => void
    vehicleId: string
    clientId: string
    vehicleBrand?: string
    vehicleModel?: string
    vehicleYear?: number
    vehiclePlate?: string
    onSuccess: () => void
}

export default function CreateServiceOrderModal({ isOpen, onClose, vehicleId, clientId, vehicleBrand, vehicleModel, vehicleYear, vehiclePlate, onSuccess }: CreateServiceOrderModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [reportedIssue, setReportedIssue] = useState('')
    const [estimatedCost, setEstimatedCost] = useState('')
    const [montado, setMontado] = useState(false)

    useEffect(() => { setMontado(true) }, [])

    if (!montado || !isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!reportedIssue.trim()) return

        setIsSubmitting(true)
        const parsedCost = estimatedCost ? parseFloat(estimatedCost.replace(/\D/g, '')) : undefined

        const res = await createServiceOrderAction({
            client_id: clientId,
            vehicle_id: vehicleId,
            reported_issue: reportedIssue,
            estimated_cost: parsedCost,
            vehicle_brand: vehicleBrand,
            vehicle_model: vehicleModel,
            vehicle_year: vehicleYear,
            vehicle_plate: vehiclePlate,
        })
        setIsSubmitting(false)

        if (res.ok) {
            setReportedIssue('')
            setEstimatedCost('')
            onSuccess()
            onClose()
        } else {
            alert('Error al crear la orden: ' + res.error)
        }
    }

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '')
        if (!val) {
            setEstimatedCost('')
            return
        }
        const formatted = new Intl.NumberFormat('es-CO').format(parseInt(val, 10))
        setEstimatedCost(formatted)
    }

    return createPortal(
        <div className="fixed inset-0 z-[155] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-5 border-b border-white/5 bg-zinc-900/50">
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Wrench className="w-5 h-5 text-orange-500" /> Nueva Orden de Servicio
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-2">
                        <h4 className="text-sm font-bold text-orange-500 mb-1">Ingreso a Taller</h4>
                        <p className="text-xs text-zinc-400">Al crear esta orden, el vehículo ingresará oficialmente a la línea de trabajo y generará un ID de seguimiento único.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <PenTool className="w-3.5 h-3.5" /> Motivo de Ingreso / Fallos reportados <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            required
                            rows={3}
                            placeholder="Ej. Cambio de aceite, revisión de frenos, no enciende..."
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600 resize-none"
                            value={reportedIssue}
                            onChange={(e) => setReportedIssue(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                            <DollarSign className="w-3.5 h-3.5" /> Presupuesto Estimado (COP)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-zinc-500 font-bold">$</span>
                            </div>
                            <input
                                type="text"
                                placeholder="0"
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-12 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-colors placeholder:text-zinc-600"
                                value={estimatedCost}
                                onChange={handleCostChange}
                            />
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <span className="text-zinc-600 text-xs font-bold">COP</span>
                            </div>
                        </div>
                    </div>

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
                            disabled={isSubmitting || !reportedIssue.trim()}
                            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-orange-500 hover:bg-orange-400 border border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 transition-all"
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                            {isSubmitting ? 'Generando...' : 'Crear Orden'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    )
}
