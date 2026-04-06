'use client'

import { useState, useMemo, useEffect, useTransition } from 'react'
import { Plus, Calendar as CalendarIcon, ListTodo, ChevronLeft, ChevronRight, Clock, User, Car, FileText, CheckCircle2, X } from 'lucide-react'
import AppointmentFormDrawer from './AppointmentFormDrawer'
import { updateAppointmentStatusAction, updateAppointmentAction } from '@/lib/actions/admin'

// Local UI type for calendar rendering
export type Appointment = {
    id: string
    clientName: string
    vehicle: string
    date: Date
    reason: string
    status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
}

interface AgendaClientProps {
    initialAppointments?: Appointment[]
}

export default function AgendaClient({ initialAppointments = [] }: AgendaClientProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [viewMode, setViewMode] = useState<'month' | 'daily'>('daily')
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    const [appointments, setAppointments] = useState<Appointment[]>([])
    // Optionally selected date for the new appointment form
    const [selectedDateForNew, setSelectedDateForNew] = useState<Date>(currentDate)
    const [isPending, startTransition] = useTransition()

    // Edit modal states
    const [editAppt, setEditAppt] = useState<Appointment | null>(null)
    const [editForm, setEditForm] = useState({ date: new Date(), time: '09:00', title: '' })
    const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

    useEffect(() => {
        setAppointments(initialAppointments.filter(a => a.status !== 'cancelled'))
    }, [initialAppointments])

    const handleCancel = () => {
        if (!confirmCancelId) return
        startTransition(async () => {
            const res = await updateAppointmentStatusAction(confirmCancelId, 'cancelled')
            if (res.ok) setConfirmCancelId(null)
        })
    }

    const handleSaveEdit = () => {
        if (!editAppt) return
        startTransition(async () => {
            const [hours, minutes] = editForm.time.split(':').map(Number)
            const scheduledDate = new Date(editForm.date.getFullYear(), editForm.date.getMonth(), editForm.date.getDate(), hours, minutes)
            const res = await updateAppointmentAction(editAppt.id, {
                title: editForm.title,
                description: editForm.title,
                scheduled_at: scheduledDate.toISOString(),
            })
            if (res.ok) {
                setEditAppt(null)
                alert('Cita actualizada')
            }
        })
    }

    // ── Month Math Helpers ──────────────────────────────────────────
    const { daysInMonth, firstDayOfWeek, monthName, year } = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()

        const daysInMonth = new Date(year, month + 1, 0).getDate()
        // 0 is Sunday, 1 is Monday ... 6 is Saturday
        let firstDayOfWeek = new Date(year, month, 1).getDay()
        // adjust to make Monday = 0
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

        const monthName = new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(currentDate)

        return { daysInMonth, firstDayOfWeek, monthName, year }
    }, [currentDate])

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1)
    const blanksBefore = Array.from({ length: firstDayOfWeek }, (_, i) => i)

    // ── View Transitions ────────────────────────────────────────────
    const nextPeriod = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
        } else {
            setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 1)))
        }
    }

    const prevPeriod = () => {
        if (viewMode === 'month') {
            setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
        } else {
            setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 1)))
        }
    }

    const handleDayClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 9, 0)
        setSelectedDateForNew(clickedDate)
        if (viewMode === 'month') setViewMode('daily')
        setCurrentDate(clickedDate)
    }

    const handleOpenNewAppointment = () => {
        setSelectedDateForNew(currentDate)
        setIsDrawerOpen(true)
    }

    // ── Render Helpers ──────────────────────────────────────────────
    const renderMonthView = () => (
        <div className="bg-zinc-950 border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[700px] mb-8">
            {/* Week days header */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-zinc-900/80 text-center backdrop-blur-md shrink-0">
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((d, i) => (
                    <div key={d} className={`py-4 text-xs font-bold uppercase tracking-wider ${i >= 5 ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        <span className="hidden sm:inline">{d}</span>
                        <span className="inline sm:hidden">{d.substring(0, 3)}</span>
                    </div>
                ))}
            </div>

            {/* Grid days */}
            <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#0a0a0a]">
                {blanksBefore.map((b) => (
                    <div key={`blank-${b}`} className="border-b border-r border-white/[0.03] bg-zinc-900/20"></div>
                ))}
                {daysArray.map((day) => {
                    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)

                    // Find appointments for this day
                    const dayAppointments = appointments.filter(a =>
                        a.date.getFullYear() === dayDate.getFullYear() &&
                        a.date.getMonth() === dayDate.getMonth() &&
                        a.date.getDate() === dayDate.getDate()
                    ).sort((a, b) => a.date.getTime() - b.date.getTime())

                    const isToday = dayDate.toDateString() === new Date().toDateString()
                    const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6

                    return (
                        <div
                            key={day}
                            onClick={() => handleDayClick(day)}
                            className={`border-b border-r border-white/[0.03] p-1.5 sm:p-2.5 flex flex-col relative group cursor-pointer transition-all duration-300 hover:bg-zinc-900/50 ${isToday ? 'bg-orange-500/5 hover:bg-orange-500/10' : ''}`}
                        >
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            {/* Header row of the cell */}
                            <div className="flex justify-between items-start mb-2 relative z-10 w-full">
                                <span className={`flex items-center justify-center text-xs sm:text-sm font-bold w-6 h-6 sm:w-7 sm:h-7 rounded-lg transition-colors ${isToday
                                    ? 'bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                                    : isWeekend
                                        ? 'text-zinc-600 group-hover:text-zinc-400'
                                        : 'text-zinc-400 group-hover:text-zinc-200 group-hover:bg-white/5'
                                    }`}>
                                    {day}
                                </span>

                                <button
                                    onClick={(e) => { e.stopPropagation(); setSelectedDateForNew(dayDate); setIsDrawerOpen(true); }}
                                    className="p-1 rounded-md bg-white/5 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 shadow-sm"
                                    title="Nueva cita"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* Appointments list in cell */}
                            <div className="flex-1 flex flex-col gap-1.5 overflow-hidden w-full relative z-10">
                                {dayAppointments.slice(0, 3).map((app, idx) => (
                                    <div
                                        key={app.id}
                                        className={`px-1.5 py-1 rounded-md text-[9px] sm:text-[10px] truncate border flex items-center gap-1 sm:gap-1.5 shadow-sm transition-transform hover:scale-[1.02] ${idx % 2 === 0 ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                                            }`}
                                    >
                                        <div className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full shrink-0 ${idx % 2 === 0 ? 'bg-blue-400' : 'bg-emerald-400'}`}></div>
                                        <span className="font-semibold shrink-0">{String(app.date.getHours()).padStart(2, '0')}:{String(app.date.getMinutes()).padStart(2, '0')}</span>
                                        <span className="truncate">{app.clientName}</span>
                                    </div>
                                ))}
                                {dayAppointments.length > 3 && (
                                    <div className="text-[9px] text-zinc-500 font-bold px-2 mt-auto mb-1 mx-auto bg-white/5 rounded-full py-0.5 w-max">
                                        +{dayAppointments.length - 3} citas
                                    </div>
                                )}
                            </div>

                            {/* Today glow indicator bottom */}
                            {isToday && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-50"></div>}
                        </div>
                    )
                })}
            </div>
        </div>
    )

    const renderDailyView = () => {
        // Show one day timeline
        const todayAppointments = appointments.filter(a =>
            a.date.getFullYear() === currentDate.getFullYear() &&
            a.date.getMonth() === currentDate.getMonth() &&
            a.date.getDate() === currentDate.getDate()
        ).sort((a, b) => a.date.getTime() - b.date.getTime())

        const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8am to 7pm

        return (
            <div className="bg-zinc-900/40 border border-white/5 rounded-xl backdrop-blur-md flex flex-col h-[650px]">
                {/* Header info */}
                <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-xl z-20 border-b border-white/5 p-5 flex items-center justify-between rounded-t-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500/10 rounded-xl border border-orange-500/20 flex flex-col items-center justify-center text-orange-400">
                            <span className="text-xs font-bold uppercase">{new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(currentDate)}</span>
                            <span className="text-lg font-black leading-none">{currentDate.getDate()}</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white capitalize">
                                {new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(currentDate)}
                            </h2>
                            <p className="text-xs text-zinc-400 font-medium tracking-wide">
                                {todayAppointments.length} {todayAppointments.length === 1 ? 'cita programada' : 'citas programadas'} hoy.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none p-4 pb-20 relative">
                    <div className="absolute top-0 bottom-0 left-[68px] w-px bg-gradient-to-b from-white/5 via-white/10 to-white/5 z-0"></div>

                    {hours.map(hour => {
                        const appsInHour = todayAppointments.filter(a => a.date.getHours() === hour)

                        return (
                            <div key={hour} className="relative z-10 flex gap-4 min-h-[90px] group">
                                <div className="w-14 text-right pt-2 shrink-0">
                                    <span className="text-xs font-bold text-zinc-500 transition-colors group-hover:text-zinc-300 block">{String(hour).padStart(2, '0')}:00</span>
                                </div>

                                <div className="relative pt-2.5 shrink-0">
                                    <div className={`w-2.5 h-2.5 rounded-full border-2 border-zinc-900 absolute top-3.5 left-1/2 -translate-x-1/2 transition-colors duration-300 ${appsInHour.length > 0 ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]' : 'bg-zinc-700 group-hover:bg-zinc-600'}`}></div>
                                </div>

                                <div className="flex-1 pt-1 pb-6 pl-2 pr-4 space-y-3">
                                    {appsInHour.length === 0 ? (
                                        <div className="h-full flex items-center border border-dashed border-white/5 rounded-xl px-4 py-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs text-zinc-600 italic">Sin agenda</p>
                                        </div>
                                    ) : (
                                        appsInHour.map(app => (
                                            <div key={app.id} className="relative group/card bg-gradient-to-br from-zinc-800/80 to-zinc-900 border border-white/10 rounded-2xl p-4 shadow-lg hover:shadow-xl hover:border-orange-500/30 transition-all overflow-hidden flex flex-col md:flex-row md:items-center gap-4">
                                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-orange-600"></div>

                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="bg-orange-500/10 text-orange-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-orange-500/20 shadow-sm shrink-0 uppercase tracking-wider">
                                                            {String(app.date.getHours()).padStart(2, '0')}:{String(app.date.getMinutes()).padStart(2, '0')} {app.date.getHours() >= 12 ? 'PM' : 'AM'}
                                                        </span>
                                                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 shrink-0"></span>
                                                        <p className="text-sm font-bold text-white leading-tight truncate">{app.clientName}</p>
                                                    </div>

                                                    <div className="flex items-center gap-3 text-xs text-zinc-400 mb-2">
                                                        <div className="flex items-center gap-1.5 font-medium px-2 py-1 bg-black/30 rounded-lg border border-white/5">
                                                            <Car className="w-3.5 h-3.5 text-blue-400" />
                                                            {app.vehicle}
                                                        </div>
                                                    </div>

                                                    <p className="text-xs text-zinc-500 flex items-start gap-1.5 leading-relaxed bg-white/5 p-2 rounded-lg italic">
                                                        <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5 text-zinc-400" />
                                                        "{app.reason}"
                                                    </p>
                                                </div>

                                                <div className="flex gap-2 justify-start md:flex-col md:opacity-0 md:-translate-x-2 md:group-hover/card:opacity-100 md:group-hover/card:translate-x-0 transition-all duration-300">
                                                    <button
                                                        onClick={() => {
                                                            setEditForm({ date: app.date, time: `${String(app.date.getHours()).padStart(2, '0')}:${String(app.date.getMinutes()).padStart(2, '0')}`, title: app.reason })
                                                            setEditAppt(app)
                                                        }}
                                                        className="text-xs text-zinc-400 hover:text-white bg-black/40 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 font-medium text-center shadow-sm"
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmCancelId(app.id)}
                                                        className="text-xs text-red-500 hover:text-white bg-red-500/10 hover:bg-red-500 px-3 py-1.5 rounded-lg border border-red-500/20 hover:border-transparent font-medium text-center shadow-sm transition-colors"
                                                    >
                                                        Cancelar
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }

    // ── Render Component ────────────────────────────────────────────
    return (
        <>
            <div className={`space-y-6 max-w-6xl mx-auto animate-in fade-in zoom-in-95 duration-500 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Agenda y Citas</h1>
                        <p className="text-zinc-400 text-sm mt-1">Gestiona las citas programadas y tu calendario diario.</p>
                    </div>
                    <button
                        onClick={handleOpenNewAppointment}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-orange-500/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4 text-white" /> Nueva Cita
                    </button>
                </div>

                {/* Calendar Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-zinc-900 border border-white/5 p-4 rounded-xl backdrop-blur-md gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={prevPeriod} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-semibold text-white min-w-[150px] text-center capitalize">
                            {viewMode === 'month'
                                ? `${monthName} ${year}`
                                : new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long' }).format(currentDate)
                            }
                        </span>
                        <button onClick={nextPeriod} className="p-2 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* View Toggle */}
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5 w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode('daily')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'daily' ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <ListTodo className="w-4 h-4" /> Diaria
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'month' ? 'text-white bg-white/10 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            <CalendarIcon className="w-4 h-4" /> Mes
                        </button>
                    </div>
                </div>

                {/* Dynamic View rendering */}
                {viewMode === 'month' ? renderMonthView() : renderDailyView()}

            </div>

            {/* Appointment Creation Drawer */}
            <AppointmentFormDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                initialDate={selectedDateForNew}
                onSave={(newAppt: any) => {
                    setAppointments([...appointments, { ...newAppt, id: Math.random().toString(36).substr(2, 9) } as Appointment])
                }}
            />

            {/* QUICK EDIT MODAL */}
            {editAppt && (
                <div className="fixed inset-x-0 bottom-0 top-16 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50">
                            <h3 className="text-white font-bold text-lg">Editar Detalles de Cita</h3>
                            <button onClick={() => setEditAppt(null)} className="text-zinc-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Motivo / Título</label>
                                <input type="text" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Hora</label>
                                    <input type="time" value={editForm.time} onChange={e => setEditForm({ ...editForm, time: e.target.value })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-zinc-400 mb-1.5 block uppercase tracking-wider">Fecha</label>
                                    <input type="date" value={editForm.date.toISOString().slice(0, 10)} onChange={e => setEditForm({ ...editForm, date: new Date(e.target.value + 'T12:00:00') })} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:border-orange-500/50 outline-none transition-colors" />
                                </div>
                            </div>
                            <button onClick={handleSaveEdit} disabled={isPending} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-orange-500/20 mt-2">
                                {isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM CONFIRM CANCEL MODAL */}
            {confirmCancelId && (
                <div className="fixed inset-x-0 bottom-0 top-16 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center animate-in zoom-in-95 font-sans">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <X className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2">¿Cancelar Cita?</h3>
                        <p className="text-zinc-400 text-sm mb-6">Esta acción no se puede deshacer. La cita desaparecerá de la agenda temporalmente y pasará al historial de canceladas.</p>
                        <div className="flex gap-3">
                            <button disabled={isPending} onClick={() => setConfirmCancelId(null)} className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-colors">
                                Volver
                            </button>
                            <button disabled={isPending} onClick={handleCancel} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20">
                                {isPending ? 'Cancelando...' : 'Sí, Cancelar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
