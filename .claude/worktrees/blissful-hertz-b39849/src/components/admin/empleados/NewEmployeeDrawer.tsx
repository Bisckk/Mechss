'use client'

import { useState, useRef, useEffect } from 'react'
import { X, User, Mail, Phone, Eye, EyeOff, Loader2, UserPlus, Wrench, ShieldCheck } from 'lucide-react'
import { gsap } from 'gsap'
import { createEmployeeAction } from '@/lib/actions/admin'

type Role = 'mechanic' | 'receptionist'

interface Props {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export default function NewEmployeeDrawer({ isOpen, onClose, onSuccess }: Props) {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [role, setRole] = useState<Role>('mechanic')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const drawerRef = useRef<HTMLDivElement>(null)
    const backdropRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const drawer = drawerRef.current
        const backdrop = backdropRef.current
        if (!drawer || !backdrop) return

        if (isOpen) {
            gsap.set(backdrop, { display: 'block', opacity: 0 })
            gsap.set(drawer, { x: '100%' })
            gsap.to(backdrop, { opacity: 1, duration: 0.25, ease: 'expo.out' })
            gsap.to(drawer, { x: '0%', duration: 0.35, ease: 'expo.out', force3D: true })
        } else {
            gsap.to(backdrop, { opacity: 0, duration: 0.2, ease: 'expo.in', onComplete: () => { gsap.set(backdrop, { display: 'none' }) } })
            gsap.to(drawer, { x: '100%', duration: 0.25, ease: 'expo.in', force3D: true })
        }
    }, [isOpen])

    const reset = () => {
        setFullName('')
        setEmail('')
        setPhone('')
        setRole('mechanic')
        setPassword('')
        setShowPassword(false)
        setError('')
    }

    const handleClose = () => {
        reset()
        onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.')
            return
        }

        setIsSubmitting(true)
        const res = await createEmployeeAction({
            full_name: fullName.trim(),
            email: email.trim(),
            phone: phone.trim() || undefined,
            role,
            password,
        })
        setIsSubmitting(false)

        if (res.ok) {
            reset()
            onSuccess()
        } else {
            setError(res.error)
        }
    }

    const roles = [
        { value: 'mechanic' as Role, label: 'Mecánico', Icon: Wrench, active: 'bg-purple-500/10 border-purple-500/40 text-purple-400', inactive: 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10' },
        { value: 'receptionist' as Role, label: 'Recepcionista', Icon: ShieldCheck, active: 'bg-blue-500/10 border-blue-500/40 text-blue-400', inactive: 'bg-zinc-900 border-white/5 text-zinc-500 hover:border-white/10' },
    ]

    return (
        <>
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[140] bg-black/60 backdrop-blur-sm"
                style={{ display: 'none' }}
                onClick={handleClose}
            />

            <div
                ref={drawerRef}
                className="fixed top-0 right-0 z-[150] h-full w-full max-w-md bg-zinc-950 border-l border-white/10 flex flex-col shadow-2xl"
                style={{ transform: 'translateX(100%)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-white">Nuevo Empleado</h2>
                            <p className="text-xs text-zinc-500">Crear cuenta de acceso al taller</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable form body */}
                <form id="new-employee-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {/* Role */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Rol</label>
                        <div className="grid grid-cols-2 gap-3">
                            {roles.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setRole(opt.value)}
                                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all ${role === opt.value ? opt.active : opt.inactive}`}
                                >
                                    <opt.Icon className="w-4 h-4" />
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Full name */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Nombre completo <span className="text-orange-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                                type="text"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                placeholder="Carlos Rodríguez"
                                required
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Correo electrónico <span className="text-orange-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="carlos@taller.com"
                                required
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Teléfono <span className="text-zinc-600 font-normal normal-case">(opcional)</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+57 300 000 0000"
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                            Contraseña temporal <span className="text-orange-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Mín. 8 caracteres"
                                required
                                minLength={8}
                                className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-4 pr-11 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-zinc-600"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        <p className="text-[11px] text-zinc-600 mt-1.5">El empleado podrá cambiarla desde su perfil.</p>
                    </div>

                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-400">
                            {error}
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="shrink-0 p-6 border-t border-white/5 flex gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        form="new-employee-form"
                        disabled={isSubmitting || !fullName.trim() || !email.trim() || !password}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all disabled:opacity-40 disabled:pointer-events-none shadow-[0_0_20px_rgba(249,115,22,0.15)]"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        Crear Empleado
                    </button>
                </div>
            </div>
        </>
    )
}
