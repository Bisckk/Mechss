'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { gsap } from 'gsap'
import {
    Plus, UserCog, Wrench, Mail, Phone, Calendar,
    MoreVertical, Power, KeyRound, Users, ShieldCheck, Loader2,
    Copy, Check, X, MessageSquare
} from 'lucide-react'
import { toggleEmployeeStatusAction, resetEmployeePasswordAction } from '@/lib/actions/admin'
import NewEmployeeDrawer from './NewEmployeeDrawer'

type Employee = {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: 'mechanic' | 'receptionist'
    is_active: boolean
    avatar_url: string | null
    created_at: string
}

interface Props {
    initialEmployees: Employee[]
}

const ROLE_CONFIG = {
    mechanic: { label: 'Mecánico', icon: Wrench, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', avatar: 'from-orange-600 to-orange-400' },
    receptionist: { label: 'Recepcionista', icon: UserCog, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', avatar: 'from-blue-600 to-blue-400' },
}

type Filter = 'all' | 'mechanic' | 'receptionist'

export default function EmpleadosClient({ initialEmployees }: Props) {
    const headerRef = useRef<HTMLDivElement>(null)
    const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
    const [filter, setFilter] = useState<Filter>('all')
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [menuOpen, setMenuOpen] = useState<string | null>(null)
    const [resetting, setResetting] = useState<string | null>(null)
    const [toggling, setToggling] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()
    const [pwdModal, setPwdModal] = useState<{ name: string; email: string; phone: string | null; password: string } | null>(null)
    const [copied, setCopied] = useState(false)

    const mechanics = employees.filter(e => e.role === 'mechanic')
    const receptionists = employees.filter(e => e.role === 'receptionist')
    const active = employees.filter(e => e.is_active)

    const filtered = filter === 'all' ? employees
        : filter === 'mechanic' ? mechanics
        : receptionists

    // Entrance animations
    useEffect(() => {
        if (headerRef.current) {
            gsap.fromTo(headerRef.current,
                { opacity: 0, y: -16 },
                { opacity: 1, y: 0, duration: 0.45, ease: 'expo.out', force3D: true }
            )
        }
        gsap.fromTo('.emp-stat-card',
            { opacity: 0, y: 20, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.06, ease: 'expo.out', force3D: true, delay: 0.1 }
        )
    }, [])

    useEffect(() => {
        gsap.fromTo('.emp-card',
            { opacity: 0, y: 24, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: 'expo.out', force3D: true }
        )
    }, [filter])

    const handleToggleStatus = (emp: Employee) => {
        setMenuOpen(null)
        setToggling(emp.id)
        startTransition(async () => {
            const res = await toggleEmployeeStatusAction(emp.id, !emp.is_active)
            if (res.ok) {
                setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_active: !emp.is_active } : e))
            }
            setToggling(null)
        })
    }

    const handleResetPassword = (emp: Employee) => {
        setMenuOpen(null)
        const newPwd = Array.from({ length: 12 }, () => 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$'[Math.floor(Math.random() * 64)]).join('')
        setResetting(emp.id)
        startTransition(async () => {
            const res = await resetEmployeePasswordAction(emp.id, newPwd)
            if (res.ok) {
                setPwdModal({ name: emp.full_name, email: emp.email, phone: emp.phone, password: newPwd })
            }
            setResetting(null)
        })
    }

    const handleCopyPassword = () => {
        if (!pwdModal) return
        navigator.clipboard.writeText(pwdModal.password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCreated = () => {
        // Reload the page to get updated list
        window.location.reload()
    }

    return (
        <>
            <div className="space-y-6 max-w-6xl mx-auto">

                {/* Header */}
                <div ref={headerRef} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Empleados</h1>
                        <p className="text-zinc-400 text-sm mt-1">Gestiona el acceso de mecánicos y recepcionistas.</p>
                    </div>
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Empleado
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Total empleados', value: employees.length, icon: Users, color: 'text-zinc-300' },
                        { label: 'Mecánicos', value: mechanics.length, icon: Wrench, color: 'text-orange-400' },
                        { label: 'Recepcionistas', value: receptionists.length, icon: UserCog, color: 'text-blue-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="emp-stat-card bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold text-white leading-none">{value}</p>
                                <p className="text-zinc-500 text-xs mt-1 truncate">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 flex-wrap">
                    {([
                        { key: 'all', label: `Todos (${employees.length})` },
                        { key: 'mechanic', label: `Mecánicos (${mechanics.length})` },
                        { key: 'receptionist', label: `Recepcionistas (${receptionists.length})` },
                    ] as { key: Filter; label: string }[]).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95
                                ${filter === key
                                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
                                    : 'bg-white/[0.03] text-zinc-500 border border-white/8 hover:text-zinc-300 hover:bg-white/[0.06]'
                                }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* Empty state */}
                {filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/8 flex items-center justify-center mb-4">
                            <Users className="w-7 h-7 text-zinc-600" />
                        </div>
                        <p className="text-zinc-400 font-medium mb-1">Sin empleados</p>
                        <p className="text-zinc-600 text-sm">Agrega tu primer empleado usando el botón de arriba.</p>
                    </div>
                )}

                {/* Cards grid */}
                {filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filtered.map(emp => {
                            const cfg = ROLE_CONFIG[emp.role]
                            const RoleIcon = cfg.icon
                            const initials = emp.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

                            return (
                                <div
                                    key={emp.id}
                                    className="emp-card group bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-white/10 hover:bg-zinc-800/60 transition-all duration-300 relative overflow-hidden"
                                >
                                    {/* Glow on hover */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl bg-gradient-to-br from-white/[0.02] to-transparent" />

                                    {/* Top row */}
                                    <div className="flex items-start justify-between mb-4 relative">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${cfg.avatar} flex items-center justify-center shadow-md flex-shrink-0`}>
                                                <span className="text-sm font-bold text-white">{initials}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[14px] font-semibold text-white truncate leading-tight">{emp.full_name}</p>
                                                <div className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                                    <RoleIcon className="w-2.5 h-2.5" />
                                                    {cfg.label}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status + Menu */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border
                                                ${emp.is_active
                                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                    : 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                                }`}>
                                                {emp.is_active ? 'Activo' : 'Inactivo'}
                                            </span>

                                            <div className="relative">
                                                <button
                                                    onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)}
                                                    className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-white/8 transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>

                                                {menuOpen === emp.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                                                        <div className="absolute right-0 top-8 z-20 w-48 bg-zinc-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1">
                                                            <button
                                                                onClick={() => handleResetPassword(emp)}
                                                                disabled={!!resetting}
                                                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-white/5 transition-colors text-left"
                                                            >
                                                                {resetting === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                                                                Resetear contraseña
                                                            </button>
                                                            <button
                                                                onClick={() => handleToggleStatus(emp)}
                                                                disabled={!!toggling}
                                                                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors text-left
                                                                    ${emp.is_active ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/5' : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/5'}`}
                                                            >
                                                                {toggling === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                                                                {emp.is_active ? 'Desactivar' : 'Activar'}
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact info */}
                                    <div className="space-y-2 relative">
                                        <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                            <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span className="truncate">{emp.email}</span>
                                        </div>
                                        {emp.phone && (
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>{emp.phone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-zinc-600 text-xs">
                                            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                            <span>Desde {new Date(emp.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Permissions info box */}
                <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <ShieldCheck className="w-5 h-5 text-zinc-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-zinc-300 mb-2">Permisos por rol</p>
                            <div className="space-y-1.5 text-xs text-zinc-500">
                                <div className="flex items-center gap-2">
                                    <Wrench className="w-3.5 h-3.5 text-orange-400/60 flex-shrink-0" />
                                    <span><span className="text-orange-400 font-medium">Mecánico</span> — Ve y alimenta únicamente los servicios asignados a él (fotos, texto, actualizaciones).</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <UserCog className="w-3.5 h-3.5 text-blue-400/60 flex-shrink-0" />
                                    <span><span className="text-blue-400 font-medium">Recepcionista</span> — Crea servicios, asigna mecánicos y puede agregar texto a cualquier servicio.</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <NewEmployeeDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onCreated={handleCreated}
            />

            {/* Password Reset Modal */}
            {pwdModal && (
                <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setPwdModal(null)}>
                    <div className="bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                                    <KeyRound className="w-4 h-4 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">Contraseña restablecida</p>
                                    <p className="text-xs text-zinc-500">{pwdModal.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setPwdModal(null)} className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/8 rounded-lg transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            <p className="text-xs text-zinc-500 leading-relaxed">
                                La próxima vez que el empleado inicie sesión, deberá elegir su propia contraseña.
                            </p>

                            {/* Password display */}
                            <div className="bg-zinc-900 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
                                <code className="flex-1 text-sm font-mono text-orange-300 tracking-wider break-all">{pwdModal.password}</code>
                                <button
                                    onClick={handleCopyPassword}
                                    className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                                    title="Copiar contraseña"
                                >
                                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Send options */}
                            <div className="grid grid-cols-2 gap-2">
                                <a
                                    href={`mailto:${pwdModal.email}?subject=Acceso a MotoFix&body=Hola ${pwdModal.name},%0D%0A%0D%0ATu contraseña temporal es: ${pwdModal.password}%0D%0A%0D%0ADeberás cambiarla al iniciar sesión.`}
                                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                    Enviar por email
                                </a>
                                {pwdModal.phone ? (
                                    <a
                                        href={`sms:${pwdModal.phone}?body=Hola ${pwdModal.name}, tu contraseña temporal es: ${pwdModal.password}. Deberás cambiarla al iniciar sesión.`}
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Enviar por SMS
                                    </a>
                                ) : (
                                    <button disabled className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/5 text-xs font-medium text-zinc-600 cursor-not-allowed">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        Sin teléfono
                                    </button>
                                )}
                            </div>

                            <button onClick={() => setPwdModal(null)} className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-sm font-semibold text-white transition-all active:scale-95">
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
