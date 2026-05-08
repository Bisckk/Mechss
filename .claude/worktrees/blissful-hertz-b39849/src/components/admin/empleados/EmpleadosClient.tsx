'use client'

import { useState, useEffect } from 'react'
import {
    Plus, UserCog, Wrench, ShieldCheck, Mail, Phone,
    Loader2, ToggleLeft, ToggleRight, KeyRound, CheckCircle2
} from 'lucide-react'
import { gsap } from 'gsap'
import {
    getWorkshopEmployeesAction,
    toggleEmployeeStatusAction,
    resetEmployeePasswordAction,
} from '@/lib/actions/admin'
import NewEmployeeDrawer from './NewEmployeeDrawer'

type Employee = {
    id: string
    full_name: string
    email: string
    phone: string | null
    role: 'mechanic' | 'receptionist'
    is_active: boolean
    created_at: string
}

const ROLE_CONFIG = {
    mechanic: {
        label: 'Mecánico',
        Icon: Wrench,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/20',
        avatar: 'from-purple-600 to-purple-900',
    },
    receptionist: {
        label: 'Recepcionista',
        Icon: ShieldCheck,
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
        avatar: 'from-blue-600 to-blue-900',
    },
}

export default function EmpleadosClient() {
    const [employees, setEmployees] = useState<Employee[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [togglingId, setTogglingId] = useState<string | null>(null)
    const [resettingId, setResettingId] = useState<string | null>(null)
    const [resetDone, setResetDone] = useState<string | null>(null)

    useEffect(() => { loadEmployees() }, [])

    useEffect(() => {
        if (isLoading || employees.length === 0) return
        gsap.fromTo(
            '.emp-card',
            { opacity: 0, y: 20, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.07, ease: 'expo.out', force3D: true }
        )
    }, [isLoading])

    const loadEmployees = async () => {
        setIsLoading(true)
        const res = await getWorkshopEmployeesAction()
        if (res.ok) setEmployees(res.data as Employee[])
        setIsLoading(false)
    }

    const handleToggle = async (emp: Employee) => {
        setTogglingId(emp.id)
        const next = !emp.is_active
        const res = await toggleEmployeeStatusAction(emp.id, next)
        if (res.ok) setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_active: next } : e))
        setTogglingId(null)
    }

    const handleReset = async (emp: Employee) => {
        setResettingId(emp.id)
        const res = await resetEmployeePasswordAction(emp.email)
        if (res.ok) {
            setResetDone(emp.id)
            setTimeout(() => setResetDone(null), 3000)
        }
        setResettingId(null)
    }

    const mechanics = employees.filter(e => e.role === 'mechanic')
    const receptionists = employees.filter(e => e.role === 'receptionist')

    return (
        <>
            <div className="space-y-6 max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Empleados</h1>
                        <p className="text-zinc-400 text-sm mt-1">
                            {employees.length === 0
                                ? 'Crea cuentas de acceso para tu personal'
                                : `${employees.length} ${employees.length === 1 ? 'empleado' : 'empleados'} · ${mechanics.length} mecánicos · ${receptionists.length} recepcionistas`
                            }
                        </p>
                    </div>
                    <button
                        onClick={() => setDrawerOpen(true)}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.15)] hover:shadow-orange-500/30 active:scale-95"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Empleado
                    </button>
                </div>

                {/* Loading */}
                {isLoading && (
                    <div className="flex items-center justify-center h-60">
                        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    </div>
                )}

                {/* Empty state */}
                {!isLoading && employees.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-5 shadow-inner">
                            <UserCog className="w-9 h-9 text-zinc-600" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">Sin empleados</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mb-7 leading-relaxed">
                            Crea las cuentas de acceso para tus mecánicos y recepcionistas. Cada uno verá solo lo que necesita.
                        </p>
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                        >
                            <Plus className="w-4 h-4" /> Crear primer empleado
                        </button>
                    </div>
                )}

                {/* Cards grid */}
                {!isLoading && employees.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {employees.map(emp => {
                            const rc = ROLE_CONFIG[emp.role] ?? ROLE_CONFIG.mechanic
                            const isToggling = togglingId === emp.id
                            const isResetting = resettingId === emp.id
                            const justReset = resetDone === emp.id

                            return (
                                <div
                                    key={emp.id}
                                    className={`emp-card flex flex-col bg-zinc-900 border rounded-2xl p-5 transition-all relative overflow-hidden ${emp.is_active ? 'border-white/5 hover:border-white/10' : 'border-white/[0.03] opacity-55'}`}
                                >
                                    {/* Top accent line */}
                                    <div className={`absolute top-0 left-0 right-0 h-px ${emp.role === 'mechanic' ? 'bg-gradient-to-r from-transparent via-purple-500/40 to-transparent' : 'bg-gradient-to-r from-transparent via-blue-500/40 to-transparent'}`} />

                                    {/* Status badge */}
                                    <div className={`absolute top-3.5 right-3.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${emp.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {emp.is_active ? 'Activo' : 'Inactivo'}
                                    </div>

                                    {/* Avatar + info */}
                                    <div className="flex items-center gap-4 mb-4 pr-16">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${rc.avatar} flex items-center justify-center text-xl font-black text-white shadow-lg shrink-0`}>
                                            {emp.full_name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-white font-bold truncate leading-tight">{emp.full_name}</p>
                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border mt-1.5 ${rc.bg} ${rc.color}`}>
                                                <rc.Icon className="w-3 h-3" />
                                                {rc.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="space-y-1.5 mb-4 flex-1">
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            <Mail className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
                                            <span className="truncate">{emp.email}</span>
                                        </div>
                                        {emp.phone && (
                                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                <Phone className="w-3.5 h-3.5 shrink-0 text-zinc-600" />
                                                <span>{emp.phone}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-3 border-t border-white/5">
                                        <button
                                            onClick={() => handleReset(emp)}
                                            disabled={isResetting}
                                            title="Enviar email de recuperación de contraseña"
                                            className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all disabled:opacity-50"
                                        >
                                            {isResetting
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : justReset
                                                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                                    : <KeyRound className="w-3.5 h-3.5" />
                                            }
                                            {justReset ? '¡Enviado!' : 'Reset pass'}
                                        </button>
                                        <button
                                            onClick={() => handleToggle(emp)}
                                            disabled={isToggling}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all disabled:opacity-50 ${emp.is_active
                                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                            }`}
                                        >
                                            {isToggling
                                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                : emp.is_active
                                                    ? <ToggleRight className="w-3.5 h-3.5" />
                                                    : <ToggleLeft className="w-3.5 h-3.5" />
                                            }
                                            {emp.is_active ? 'Desactivar' : 'Activar'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <NewEmployeeDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSuccess={() => {
                    setDrawerOpen(false)
                    loadEmployees()
                }}
            />
        </>
    )
}
