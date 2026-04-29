'use client'

import { useState, useTransition } from 'react'
import { X, Calendar, Clock, User, Car, FileText } from 'lucide-react'
import { createAppointmentAction } from '@/lib/actions/admin'

interface AppointmentFormDrawerProps {
    isOpen: boolean
    onClose: () => void
    initialDate: Date
    onSave: (newAppt: {
        clientName: string
        vehicle: string
        date: Date
        reason: string
        status: 'pending'
    }) => void
}

export default function AppointmentFormDrawer({ isOpen, onClose, initialDate, onSave }: AppointmentFormDrawerProps) {
    const [isPending, startTransition] = useTransition()
    const [form, setForm] = useState({
        clientName: '',
        vehicle: '',
        date: initialDate.toISOString().slice(0, 10),
        time: `${String(initialDate.getHours()).padStart(2, '0')}:${String(initialDate.getMinutes()).padStart(2, '0')}`,
        reason: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.clientName.trim() || !form.reason.trim()) return

        const [hours, minutes] = form.time.split(':').map(Number)
        const scheduledDate = new Date(`${form.date}T${form.time}:00`)

        startTransition(async () => {
            await createAppointmentAction({
                client_id: crypto.randomUUID(),
                vehicle_info: form.vehicle || null,
                title: form.reason,
                description: `Cliente: ${form.clientName}. Vehículo: ${form.vehicle}`,
                scheduled_at: scheduledDate.toISOString(),
                status: 'pending',
            })

            onSave({
                clientName: form.clientName,
                vehicle: form.vehicle,
                date: scheduledDate,
                reason: form.reason,
                status: 'pending',
            })

            setForm({ clientName: '', vehicle: '', date: initialDate.toISOString().slice(0, 10), time: '09:00', reason: '' })
            onClose()
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative w-full sm:max-w-md bg-zinc-900 border border-zinc-800 sm:rounded-2xl rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-orange-400" />
                        </div>
                        <h2 className="text-white font-bold text-base">Nueva Cita</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {/* Client Name */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                            <User className="w-3.5 h-3.5" /> Nombre del cliente
                        </label>
                        <input
                            type="text"
                            value={form.clientName}
                            onChange={e => setForm({ ...form, clientName: e.target.value })}
                            placeholder="Ej: Juan García"
                            required
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:border-orange-500/50 outline-none transition-colors"
                        />
                    </div>

                    {/* Vehicle */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                            <Car className="w-3.5 h-3.5" /> Vehículo
                        </label>
                        <input
                            type="text"
                            value={form.vehicle}
                            onChange={e => setForm({ ...form, vehicle: e.target.value })}
                            placeholder="Ej: Honda CB150 2022"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:border-orange-500/50 outline-none transition-colors"
                        />
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                                <Calendar className="w-3.5 h-3.5" /> Fecha
                            </label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                                <Clock className="w-3.5 h-3.5" /> Hora
                            </label>
                            <input
                                type="time"
                                value={form.time}
                                onChange={e => setForm({ ...form, time: e.target.value })}
                                required
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5" /> Motivo
                        </label>
                        <textarea
                            value={form.reason}
                            onChange={e => setForm({ ...form, reason: e.target.value })}
                            placeholder="Ej: Cambio de aceite y revisión general"
                            required
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:border-orange-500/50 outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20 text-sm"
                        >
                            {isPending ? 'Guardando...' : 'Agendar Cita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
