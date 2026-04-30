'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import { X, UserCog, Wrench, Eye, EyeOff, Loader2, RefreshCw, Phone, Mail, User } from 'lucide-react'
import { createEmployeeAction } from '@/lib/actions/admin'

interface Props {
    open: boolean
    onClose: () => void
    onCreated: () => void
}

const ROLES = [
    { value: 'mechanic', label: 'Mecánico', icon: Wrench, color: 'orange' },
    { value: 'receptionist', label: 'Recepcionista', icon: UserCog, color: 'blue' },
] as const

function generatePassword() {
    const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function NewEmployeeDrawer({ open, onClose, onCreated }: Props) {
    const backdropRef = useRef<HTMLDivElement>(null)
    const drawerRef = useRef<HTMLDivElement>(null)
    const [isPending, startTransition] = useTransition()

    const [form, setForm] = useState({
        full_name: '', email: '', phone: '',
        role: 'mechanic' as 'mechanic' | 'receptionist',
        password: '', confirm_password: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const backdrop = backdropRef.current
        const drawer = drawerRef.current
        if (!backdrop || !drawer) return

        if (open) {
            gsap.set(backdrop, { display: 'block', opacity: 0 })
            gsap.set(drawer, { x: '100%' })
            gsap.to(backdrop, { opacity: 1, duration: 0.3, ease: 'expo.out', force3D: true })
            gsap.to(drawer, { x: '0%', duration: 0.38, ease: 'expo.out', force3D: true })
        } else {
            gsap.to(backdrop, { opacity: 0, duration: 0.22, ease: 'expo.in', onComplete: () => { gsap.set(backdrop, { display: 'none' }) } })
            gsap.to(drawer, { x: '100%', duration: 0.26, ease: 'expo.in', force3D: true })
        }
    }, [open])

    const handleClose = () => {
        setForm({ full_name: '', email: '', phone: '', role: 'mechanic', password: '', confirm_password: '' })
        setError(null)
        onClose()
    }

    const handleGenerate = () => {
        const pwd = generatePassword()
        setForm(f => ({ ...f, password: pwd, confirm_password: pwd }))
        setShowPassword(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!form.full_name.trim()) return setError('El nombre completo es obligatorio.')
        if (!form.email.trim()) return setError('El email es obligatorio.')
        if (form.password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
        if (form.password !== form.confirm_password) return setError('Las contraseñas no coinciden.')

        startTransition(async () => {
            const res = await createEmployeeAction({
                full_name: form.full_name.trim(),
                email: form.email.trim().toLowerCase(),
                phone: form.phone.trim() || undefined,
                role: form.role,
                password: form.password,
            })
            if (!res.ok) return setError(res.error)
            onCreated()
            handleClose()
        })
    }

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(f => ({ ...f, [k]: e.target.value }))

    return (
        <>
            <div
                ref={backdropRef}
                className="fixed inset-0 z-[160] bg-black/50 backdrop-blur-sm"
                style={{ display: 'none' }}
                onClick={handleClose}
            />

            <div
                ref={drawerRef}
                className="fixed top-0 right-0 z-[170] h-full w-full sm:w-[480px] flex flex-col"
                style={{ transform: 'translateX(100%)' }}
            >
                <div className="flex flex-col h-full bg-zinc-950 border-l border-white/8 shadow-2xl overflow-y-auto">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-white/6 flex-shrink-0">
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-tight">Nuevo Empleado</h2>
                            <p className="text-zinc-500 text-xs mt-0.5">Crea acceso para un mecánico o recepcionista</p>
                        </div>
                        <button onClick={handleClose} className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/8 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex-1 px-6 py-6 space-y-6">

                        {/* Role selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Rol</label>
                            <div className="grid grid-cols-2 gap-3">
                                {ROLES.map(({ value, label, icon: Icon, color }) => {
                                    const active = form.role === value
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, role: value }))}
                                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all duration-200 active:scale-95
                                                ${active
                                                    ? value === 'mechanic'
                                                        ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                                                        : 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                                    : 'bg-white/[0.02] border-white/8 text-zinc-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            {label}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Personal info */}
                        <div className="space-y-4">
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Información personal</label>

                            <div className="space-y-3">
                                <InputField
                                    icon={User}
                                    type="text"
                                    placeholder="Nombre completo"
                                    value={form.full_name}
                                    onChange={set('full_name')}
                                    autoComplete="off"
                                />
                                <InputField
                                    icon={Mail}
                                    type="email"
                                    placeholder="Correo electrónico"
                                    value={form.email}
                                    onChange={set('email')}
                                    autoComplete="off"
                                />
                                <InputField
                                    icon={Phone}
                                    type="tel"
                                    placeholder="Teléfono (opcional)"
                                    value={form.phone}
                                    onChange={set('phone')}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Contraseña de acceso</label>
                                <button
                                    type="button"
                                    onClick={handleGenerate}
                                    className="flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Generar
                                </button>
                            </div>

                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Contraseña (mín. 8 caracteres)"
                                    value={form.password}
                                    onChange={set('password')}
                                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all pr-11 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Confirmar contraseña"
                                value={form.confirm_password}
                                onChange={set('confirm_password')}
                                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all font-mono"
                            />

                            {form.password && form.confirm_password && form.password !== form.confirm_password && (
                                <p className="text-xs text-rose-400">Las contraseñas no coinciden</p>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3 text-sm text-rose-400">
                                {error}
                            </div>
                        )}

                        {/* Info tip */}
                        <div className="bg-white/[0.02] border border-white/6 rounded-xl px-4 py-3 text-xs text-zinc-500 leading-relaxed">
                            El empleado recibirá acceso a la plataforma con estas credenciales. Compártelas de forma segura.
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="flex-shrink-0 px-6 py-4 border-t border-white/6 flex gap-3">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 py-3 rounded-xl border border-white/10 text-sm text-zinc-400 hover:text-white hover:bg-white/5 transition-all font-medium active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="employee-form"
                            onClick={handleSubmit}
                            disabled={isPending}
                            className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/25 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Creando...</> : 'Crear Empleado'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

function InputField({ icon: Icon, ...props }: { icon: React.ElementType } & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <div className="relative">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 pointer-events-none" />
            <input
                {...props}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.06] transition-all"
            />
        </div>
    )
}
