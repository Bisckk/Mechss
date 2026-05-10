'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Wrench, Clock, RefreshCw, FileText, ChevronDown,
    Check, AlertTriangle, User, Hash, CalendarCheck2,
    CheckCircle2, Loader2, ChevronRight, Eye
} from 'lucide-react'
import { gsap } from 'gsap'
import {
    getActiveRepairsAction, updateRepairStatusAction,
    solicitarCompletarAction
} from '@/lib/actions/admin'
import BitacoraMecanico from '@/components/admin/taller/BitacoraMecanico'
import RepairLogModal from '@/components/admin/taller/RepairLogModal'

type Reparacion = {
    id: string
    tracking_code: string
    status: string
    reported_issue: string
    created_at: string
    estimated_completion: string | null
    estimated_cost: number | null
    vehicle_brand: string | null
    vehicle_model: string | null
    vehicle_year: number | null
    vehicle_plate: string | null
    mechanic_id: string | null
    clients: { id: string; full_name: string; phone: string | null } | null
    mechanic: { id: string; full_name: string } | null
}

interface Props {
    userId: string
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    received:           { label: 'Recibido',              color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
    in_progress:        { label: 'En Diagnóstico',        color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    repairing:          { label: 'En Reparación',         color: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20' },
    waiting_parts:      { label: 'Esperando Repuestos',   color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20' },
    pending_completion: { label: 'Pend. Aprobación',      color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/20' },
    completed:          { label: 'Completado',            color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    delivered:          { label: 'Entregado',             color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    border: 'border-zinc-500/20' },
}

// Estados que el mecánico puede seleccionar manualmente (sin completar)
const OPCIONES_ESTADO = [
    { key: 'received',      label: 'Recibido' },
    { key: 'in_progress',   label: 'En Diagnóstico' },
    { key: 'repairing',     label: 'En Reparación' },
    { key: 'waiting_parts', label: 'Esperando Repuestos' },
]

const ESTADOS_TERMINADOS = ['completed', 'delivered', 'cancelled']
const ESTADO_BLOQUEADO   = 'pending_completion'

export default function MisOrdenesClient({ userId }: Props) {
    const [reparaciones, setReparaciones]         = useState<Reparacion[]>([])
    const [cargando, setCargando]                 = useState(true)
    const [errorCarga, setErrorCarga]             = useState<string | null>(null)
    const [reparacionSel, setReparacionSel]       = useState<Reparacion | null>(null)
    const [detallesRep, setDetallesRep]           = useState<Reparacion | null>(null)
    const [dropdownAbierto, setDropdownAbierto]   = useState<string | null>(null)
    const [solicitandoId, setSolicitandoId]       = useState<string | null>(null)
    const [completadasAbiertas, setCompletadasAbiertas] = useState(false)

    const hasCargadoRef = useRef(false)
    const listaRef      = useRef<HTMLDivElement>(null)

    useEffect(() => { cargarOrdenes() }, [])

    useEffect(() => {
        const cerrar = (e: MouseEvent) => {
            if (!(e.target as Element).closest('.dropdown-estado')) setDropdownAbierto(null)
        }
        document.addEventListener('click', cerrar)
        return () => document.removeEventListener('click', cerrar)
    }, [])

    useEffect(() => {
        if (!cargando && listaRef.current && listaRef.current.children.length > 0) {
            gsap.fromTo(
                listaRef.current.children,
                { opacity: 0, y: 18, scale: 0.98 },
                { opacity: 1, y: 0, scale: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.2)', force3D: true }
            )
        }
    }, [cargando])

    const cargarOrdenes = async () => {
        if (!hasCargadoRef.current) setCargando(true)
        setErrorCarga(null)
        const res = await getActiveRepairsAction(userId)
        if (res.ok) setReparaciones(res.data as Reparacion[])
        else setErrorCarga((res as any).error ?? 'Error al cargar órdenes')
        setCargando(false)
        hasCargadoRef.current = true
    }

    const cambiarEstado = async (repairId: string, nuevoEstado: string) => {
        const rep = reparaciones.find(r => r.id === repairId)
        if (!rep || rep.status === nuevoEstado) return
        setDropdownAbierto(null)
        setReparaciones(prev => prev.map(r => r.id === repairId ? { ...r, status: nuevoEstado } : r))
        const res = await updateRepairStatusAction(repairId, nuevoEstado)
        if (!res.ok) setReparaciones(prev => prev.map(r => r.id === repairId ? { ...r, status: rep.status } : r))
    }

    const solicitarCompletar = async (repairId: string) => {
        setSolicitandoId(repairId)
        setReparaciones(prev => prev.map(r => r.id === repairId ? { ...r, status: 'pending_completion' } : r))
        const res = await solicitarCompletarAction(repairId)
        if (!res.ok) {
            const rep = reparaciones.find(r => r.id === repairId)
            if (rep) setReparaciones(prev => prev.map(r => r.id === repairId ? { ...r, status: rep.status } : r))
        }
        setSolicitandoId(null)
    }

    const activas     = reparaciones.filter(r => !ESTADOS_TERMINADOS.includes(r.status))
    const completadas = reparaciones.filter(r => ESTADOS_TERMINADOS.includes(r.status))

    // Contadores
    const enProceso   = activas.filter(r => !['pending_completion'].includes(r.status) && !ESTADOS_TERMINADOS.includes(r.status)).length
    const enReparacion    = reparaciones.filter(r => r.status === 'repairing').length
    const esperandoPiezas = reparaciones.filter(r => r.status === 'waiting_parts').length
    const completadasCount = completadas.length

    if (cargando) {
        return (
            <div className="space-y-6">
                <div className="h-9 w-52 bg-white/5 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">

            {/* Encabezado */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                            <Wrench className="w-6 h-6 text-emerald-400" />
                        </div>
                        Mis Órdenes
                    </h1>
                    <p className="text-sm text-zinc-400 mt-1.5 ml-[60px]">
                        {activas.length} {activas.length === 1 ? 'orden activa' : 'órdenes activas'} · Vista de Mecánico
                    </p>
                </div>
                <button
                    onClick={cargarOrdenes}
                    className="p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-all flex-shrink-0"
                    title="Refrescar"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* Banner */}
            <div className="flex items-center gap-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl px-5 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <p className="text-sm text-emerald-400/80">
                    Solo ves las órdenes asignadas a ti. Usa <span className="font-bold">Bitácora</span> para registrar el proceso y subir fotos.
                </p>
            </div>

            {/* Error */}
            {errorCarga && (
                <div className="flex items-center gap-3 bg-rose-500/8 border border-rose-500/20 rounded-2xl px-5 py-4">
                    <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                    <p className="text-sm font-semibold text-rose-400 flex-1">{errorCarga}</p>
                    <button onClick={cargarOrdenes} className="text-sm text-rose-400 font-bold px-3 py-1.5 bg-rose-500/10 rounded-lg">
                        Reintentar
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <TarjetaStat label="En Proceso"      valor={enProceso}        color="text-orange-400" />
                <TarjetaStat label="En Reparación"   valor={enReparacion}     color="text-purple-400" />
                <TarjetaStat label="Esp. Repuestos"  valor={esperandoPiezas}  color="text-rose-400" />
                <TarjetaStat label="Completadas"     valor={completadasCount} color="text-emerald-400" />
            </div>

            {/* ── Órdenes activas ── */}
            {activas.length === 0 && completadas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-2xl bg-zinc-900/20">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                        <Wrench className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Sin Órdenes Asignadas</h3>
                    <p className="text-sm text-zinc-500 max-w-sm text-center">
                        Cuando el taller te asigne un servicio, aparecerá aquí.
                    </p>
                </div>
            ) : activas.length === 0 ? (
                <div className="flex items-center gap-3 bg-zinc-900/50 border border-white/5 rounded-2xl px-5 py-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <p className="text-sm text-zinc-400">Todas tus órdenes activas están completadas. ¡Buen trabajo!</p>
                </div>
            ) : (
                <div ref={listaRef} className="space-y-3">
                    {activas.map(rep => {
                        const sc = ESTADO_CONFIG[rep.status] || ESTADO_CONFIG.received
                        const bloqueado = rep.status === ESTADO_BLOQUEADO
                        const solicitando = solicitandoId === rep.id

                        return (
                            <div
                                key={rep.id}
                                className={`bg-zinc-900 border rounded-2xl p-4 sm:p-5 transition-all shadow-sm hover:shadow-xl
                                    ${bloqueado ? 'border-orange-500/20 bg-orange-500/5' : 'border-white/5 hover:border-white/10'}`}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                                    {/* Info del vehículo */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <span className="font-mono text-xs font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                                                #{rep.tracking_code}
                                            </span>
                                            {rep.vehicle_plate && (
                                                <span className="text-[10px] font-mono font-black text-white bg-white/10 px-2 py-0.5 rounded border border-white/10 tracking-widest">
                                                    {rep.vehicle_plate.toUpperCase()}
                                                </span>
                                            )}
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sc.bg} ${sc.border} ${sc.color}`}>
                                                {sc.label}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-white leading-tight">
                                            {rep.vehicle_brand} {rep.vehicle_model} {rep.vehicle_year}
                                        </h3>
                                        {rep.clients && (
                                            <div className="flex items-center gap-1.5 text-sm text-zinc-400 mt-1">
                                                <User className="w-3.5 h-3.5" />
                                                <span>{rep.clients.full_name}</span>
                                                {rep.clients.phone && (
                                                    <>
                                                        <span className="text-zinc-700">·</span>
                                                        <Hash className="w-3 h-3" />
                                                        <span>{rep.clients.phone}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <p className="text-xs text-zinc-500 mt-1.5 line-clamp-1 leading-relaxed">{rep.reported_issue}</p>
                                    </div>

                                    {/* Fechas */}
                                    <div className="flex sm:flex-col items-end gap-1 shrink-0">
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
                                            <Clock className="w-3 h-3 flex-shrink-0" />
                                            <span className="whitespace-nowrap">
                                                {new Date(rep.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                                            </span>
                                        </div>
                                        {rep.estimated_completion ? (
                                            <div className="flex items-center gap-1.5 text-xs text-orange-400/80">
                                                <CalendarCheck2 className="w-3 h-3 flex-shrink-0" />
                                                <span className="whitespace-nowrap">
                                                    {new Date(rep.estimated_completion).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-xs text-zinc-700">
                                                <CalendarCheck2 className="w-3 h-3 flex-shrink-0" />
                                                <span className="whitespace-nowrap">Sin fecha est.</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Acciones */}
                                    <div className={`flex items-center gap-2 shrink-0 border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0 ${bloqueado ? 'justify-center' : ''}`}>
                                        {bloqueado ? (
                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-semibold">
                                                <Clock className="w-4 h-4 animate-pulse" />
                                                Esperando aprobación del taller
                                            </div>
                                        ) : (
                                            <>
                                                {/* Bitácora */}
                                                <button
                                                    onClick={() => setReparacionSel(rep)}
                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-semibold border border-emerald-500/20 transition-all"
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    Bitácora
                                                </button>

                                                {/* Dropdown estado */}
                                                <div className="relative dropdown-estado flex-1 sm:flex-none">
                                                    <button
                                                        onClick={() => setDropdownAbierto(dropdownAbierto === rep.id ? null : rep.id)}
                                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold border border-white/5 transition-all"
                                                    >
                                                        Estado <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                                                    </button>
                                                    {dropdownAbierto === rep.id && (
                                                        <div className="absolute right-0 bottom-full mb-2 w-52 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 origin-bottom-right animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 px-2 pt-1">Cambiar Estado</div>
                                                            <div className="space-y-1">
                                                                {OPCIONES_ESTADO.map(opt => (
                                                                    <button
                                                                        key={opt.key}
                                                                        onClick={() => cambiarEstado(rep.id, opt.key)}
                                                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left
                                                                            ${rep.status === opt.key
                                                                                ? 'bg-white/5 text-white font-bold cursor-default'
                                                                                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rep.status === opt.key ? 'bg-orange-400' : 'bg-zinc-600'}`} />
                                                                        <span className="flex-1">{opt.label}</span>
                                                                        {rep.status === opt.key && <Check className="w-3.5 h-3.5 text-white/50" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Solicitar completar */}
                                                <button
                                                    onClick={() => solicitarCompletar(rep.id)}
                                                    disabled={solicitando}
                                                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-all disabled:opacity-50 shrink-0"
                                                    title="Solicitar aprobación de completado"
                                                >
                                                    {solicitando
                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                        : <CheckCircle2 className="w-4 h-4" />
                                                    }
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ── Órdenes completadas (acordeón) ── */}
            {completadas.length > 0 && (
                <div className="border border-white/8 rounded-2xl overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setCompletadasAbiertas(v => !v)}
                        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-white/3 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Órdenes Completadas</p>
                                <p className="text-xs text-zinc-500">{completadas.length} {completadas.length === 1 ? 'servicio finalizado' : 'servicios finalizados'}</p>
                            </div>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-200 ${completadasAbiertas ? 'rotate-180' : ''}`} />
                    </button>

                    {completadasAbiertas && (
                        <div className="border-t border-white/5 divide-y divide-white/5">
                            {completadas.map(rep => {
                                const sc = ESTADO_CONFIG[rep.status] || ESTADO_CONFIG.completed
                                return (
                                    <div key={rep.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-mono text-xs font-black text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">
                                                    #{rep.tracking_code}
                                                </span>
                                                {rep.vehicle_plate && (
                                                    <span className="text-[10px] font-mono font-black text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded tracking-widest">
                                                        {rep.vehicle_plate.toUpperCase()}
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sc.bg} ${sc.border} ${sc.color}`}>
                                                    {sc.label}
                                                </span>
                                            </div>
                                            <p className="text-sm font-semibold text-zinc-400 truncate">
                                                {rep.vehicle_brand} {rep.vehicle_model} {rep.vehicle_year}
                                            </p>
                                            {rep.clients && (
                                                <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                                                    <User className="w-3 h-3" /> {rep.clients.full_name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-zinc-600 shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {new Date(rep.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: '2-digit' })}
                                        </div>
                                        <button
                                            onClick={() => setDetallesRep(rep)}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold transition-all shrink-0"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Ver</span>
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Modal bitácora mecánico (solo para órdenes activas) */}
            <BitacoraMecanico
                isOpen={!!reparacionSel}
                onClose={() => { setReparacionSel(null); cargarOrdenes() }}
                repair={reparacionSel}
            />

            {/* Modal detalles para órdenes completadas (solo lectura) */}
            <RepairLogModal
                isOpen={!!detallesRep}
                onClose={() => setDetallesRep(null)}
                repair={detallesRep}
                userRole="mechanic"
                readOnly
            />
        </div>
    )
}

function TarjetaStat({ label, valor, color }: { label: string; valor: number; color: string }) {
    return (
        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4">
            <p className={`text-2xl font-black tabular-nums ${color}`}>{valor}</p>
            <p className="text-xs text-zinc-500 mt-1 font-medium leading-snug">{label}</p>
        </div>
    )
}
