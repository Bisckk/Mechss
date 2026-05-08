'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { X, User, Phone, Mail, MapPin, FileText, Loader2, UserPlus } from 'lucide-react'
import { gsap } from 'gsap'
import { createClientAction, type CreateClientData } from '@/lib/actions/admin'

interface NewClientModalProps {
    isOpen: boolean
    onClose: () => void
    onCreated: (client: {
        id: string
        full_name: string
        phone: string | null
        email: string | null
        created_at: string
        is_active: boolean
        vehicles_count: number
        appointments_count: number
    }) => void
}

const EMPTY_FORM: CreateClientData = {
    full_name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
}

export default function NewClientModal({ isOpen, onClose, onCreated }: NewClientModalProps) {
    const [form, setForm] = useState<CreateClientData>(EMPTY_FORM)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const backdropRef = useRef<HTMLDivElement>(null)
    const modalRef    = useRef<HTMLDivElement>(null)

    // Animate in on open
    useEffect(() => {
        if (!isOpen) return
        setError(null)
        if (backdropRef.current && modalRef.current) {
            gsap.fromTo(backdropRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.22, ease: 'expo.out', force3D: true }
            )
            gsap.fromTo(modalRef.current,
                { opacity: 0, scale: 0.95, y: 16 },
                { opacity: 1, scale: 1, y: 0, duration: 0.32, ease: 'expo.out', force3D: true }
            )
        }
    }, [isOpen])

    const handleClose = () => {
        if (!backdropRef.current || !modalRef.current) { onClose(); return }
        gsap.to(modalRef.current,   { opacity: 0, scale: 0.95, y: 12, duration: 0.2, ease: 'expo.in', force3D: true })
        gsap.to(backdropRef.current, { opacity: 0, duration: 0.18, ease: 'expo.in', onComplete: onClose })
    }

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!form.full_name.trim()) { setError('El nombre es obligatorio.'); return }
        if (!form.phone.trim())     { setError('El teléfono es obligatorio.'); return }

        startTransition(async () => {
            const res = await createClientAction({
                full_name: form.full_name.trim(),
                phone:     form.phone.trim(),
                email:     form.email?.trim()   || undefined,
                address:   form.address?.trim() || undefined,
                notes:     form.notes?.trim()   || undefined,
            })

            if (!res.ok) { setError(res.error); return }

            onCreated({
                id:                 (res as any).data.id,
                full_name:          form.full_name.trim(),
                phone:              form.phone.trim() || null,
                email:              form.email?.trim() || null,
                created_at:         new Date().toISOString(),
                is_active:          true,
                vehicles_count:     0,
                appointments_count: 0,
            })

            setForm(EMPTY_FORM)
            handleClose()
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                ref={backdropRef}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal — bottom sheet on mobile, centered card on sm+ */}
            <div
                ref={modalRef}
                className="
                    relative w-full bg-zinc-950 shadow-2xl flex flex-col
                    /* mobile: bottom sheet */
                    rounded-t-2xl max-h-[92dvh]
                    /* sm+: centered card */
                    sm:rounded-2xl sm:max-w-lg sm:max-h-[90vh]
                    border border-white/10
                "
            >
                {/* Drag handle — visible only on mobile */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-zinc-900/50 shrink-0 sm:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                            <UserPlus className="w-4 h-4 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white leading-tight">Nuevo Cliente</h2>
                            <p className="text-xs text-zinc-500 mt-0.5">Completa los datos del cliente</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isPending}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-colors shrink-0 disabled:opacity-40"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable form body */}
                <form
                    id="new-client-form"
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto px-5 py-5 space-y-4"
                >
                    {/* Nombre + Teléfono — side by side on sm+ */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                Nombre completo
                                <span className="text-orange-500 ml-0.5">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.full_name}
                                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                                placeholder="Juan Pérez García"
                                autoFocus
                                className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5" />
                                Teléfono
                                <span className="text-orange-500 ml-0.5">*</span>
                            </label>
                            <input
                                type="tel"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                placeholder="3001234567"
                                inputMode="tel"
                                className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            Correo electrónico
                            <span className="text-zinc-600 font-normal ml-0.5">(opcional)</span>
                        </label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            placeholder="cliente@ejemplo.com"
                            inputMode="email"
                            autoCapitalize="none"
                            className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Dirección */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            Dirección
                            <span className="text-zinc-600 font-normal ml-0.5">(opcional)</span>
                        </label>
                        <input
                            type="text"
                            value={form.address}
                            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                            placeholder="Barrio, ciudad..."
                            className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors"
                        />
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="text-xs font-semibold text-zinc-400 mb-1.5 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Notas internas
                            <span className="text-zinc-600 font-normal ml-0.5">(opcional)</span>
                        </label>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                            placeholder="Observaciones sobre el cliente..."
                            rows={3}
                            className="w-full bg-zinc-900 border border-white/10 focus:border-orange-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none transition-colors resize-none"
                        />
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm px-4 py-3 rounded-xl leading-snug">
                            {error}
                        </div>
                    )}
                </form>

                {/* Footer actions */}
                <div className="px-5 py-4 border-t border-white/5 bg-zinc-900/40 shrink-0 flex gap-3 sm:rounded-b-2xl">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isPending}
                        className="flex-1 py-3 sm:py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 text-sm font-semibold rounded-xl transition-colors disabled:opacity-40"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="new-client-form"
                        disabled={isPending}
                        className="flex-1 py-3 sm:py-2.5 bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isPending
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</>
                            : <><UserPlus className="w-4 h-4" /> Crear Cliente</>
                        }
                    </button>
                </div>
            </div>
        </div>
    )
}
