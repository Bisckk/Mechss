'use client'

import { useState, useTransition } from 'react'
import {
    Vault, Play, Square, AlertCircle, Info, ChevronDown,
    TrendingUp, TrendingDown, History, BadgeCheck, BadgeAlert, BadgeX,
} from 'lucide-react'
import CardV2 from '@/components/ui/CardV2'
import BadgeV2 from '@/components/ui/BadgeV2'
import EmptyState from '@/components/ui/EmptyState'
import SpinnerMinimal from '@/components/ui/SpinnerMinimal'
import {
    abrirCajaAction,
    cerrarCajaAction,
    getCajaActivaAction,
    getHistorialCajaAction,
} from '@/lib/actions/caja'
import type { SesionCaja, ArqueoCaja, RolContabilidad } from '@/lib/types/contabilidad'

// ── Denominaciones COP ──────────────────────────────────────

const BILLETES = [
    { key: 'b_100000', label: '$100.000', valor: 100_000 },
    { key: 'b_50000',  label: '$50.000',  valor:  50_000 },
    { key: 'b_20000',  label: '$20.000',  valor:  20_000 },
    { key: 'b_10000',  label: '$10.000',  valor:  10_000 },
    { key: 'b_5000',   label: '$5.000',   valor:   5_000 },
    { key: 'b_2000',   label: '$2.000',   valor:   2_000 },
    { key: 'b_1000',   label: '$1.000',   valor:   1_000 },
]

const MONEDAS = [
    { key: 'm_1000', label: '$1.000', valor: 1_000 },
    { key: 'm_500',  label: '$500',   valor:   500 },
    { key: 'm_200',  label: '$200',   valor:   200 },
    { key: 'm_100',  label: '$100',   valor:   100 },
    { key: 'm_50',   label: '$50',    valor:    50 },
]

const TODAS_DENOM = [...BILLETES, ...MONEDAS]

function calcTotalDenom(denom: Record<string, string>): number {
    return TODAS_DENOM.reduce((sum, { key, valor }) =>
        sum + valor * (parseInt(denom[key] ?? '0', 10) || 0), 0)
}

// ── Helpers ────────────────────────────────────────────────

function formatCOP(val: number): string {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val)
}

function formatFechaHora(iso: string): string {
    return new Date(iso).toLocaleString('es-CO', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })
}

function formatMilesInput(val: string): string {
    if (!val) return ''
    const num = parseInt(val, 10)
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('es-CO').format(num)
}

// ── Clases reutilizables ───────────────────────────────────

const inputCls  = 'w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-orange-500/60 focus:outline-none transition-colors'
const labelCls  = 'block text-[11px] font-medium tracking-wide uppercase text-zinc-500 mb-1.5'
const denomInp  = 'w-16 bg-zinc-900/80 border border-zinc-800 rounded-lg px-2 py-1.5 text-sm text-white text-center tabular-nums focus:border-orange-500/60 focus:outline-none transition-colors'

// ── SeccionDenominado ──────────────────────────────────────

function SeccionDenominado({ denom, onCambiar, total }: {
    denom:     Record<string, string>
    onCambiar: (key: string, val: string) => void
    total:     number
}) {
    const Filas = ({ items }: { items: typeof BILLETES }) => (
        <div className="space-y-1.5">
            {items.map(({ key, label, valor }) => {
                const cant     = parseInt(denom[key] ?? '0', 10) || 0
                const subtotal = cant * valor
                return (
                    <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-mono w-16 text-right flex-shrink-0">{label}</span>
                        <span className="text-zinc-700 text-xs flex-shrink-0">×</span>
                        <input
                            type="text"
                            inputMode="numeric"
                            value={denom[key] ?? ''}
                            onChange={e => onCambiar(key, e.target.value)}
                            placeholder="0"
                            className={denomInp}
                        />
                        <span className="text-zinc-700 text-xs flex-shrink-0">=</span>
                        <span className={`text-xs tabular-nums ml-auto ${subtotal > 0 ? 'text-zinc-300' : 'text-zinc-700'}`}>
                            {subtotal > 0 ? formatCOP(subtotal) : '—'}
                        </span>
                    </div>
                )
            })}
        </div>
    )

    return (
        <div className="space-y-3">
            <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 mb-2">Billetes</p>
                <Filas items={BILLETES} />
            </div>
            <div>
                <p className="text-[10px] font-semibold tracking-widest uppercase text-zinc-700 mb-2">Monedas</p>
                <Filas items={MONEDAS} />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total contado</span>
                <span className={`text-base font-bold tabular-nums tracking-tight ${total > 0 ? 'text-white' : 'text-zinc-700'}`}>
                    {formatCOP(total)}
                </span>
            </div>
        </div>
    )
}

// ── ResultadoArqueo ────────────────────────────────────────

function ResultadoArqueo({ arqueo, onCerrar }: { arqueo: ArqueoCaja; onCerrar: () => void }) {
    const { diferencia, estado, total_efectivo_sistema, total_efectivo_real } = arqueo

    const colores = {
        cuadrado: { bg: 'bg-emerald-500/8', border: 'border-emerald-500/15', text: 'text-emerald-400', Icono: BadgeCheck },
        sobrante: { bg: 'bg-amber-500/8',   border: 'border-amber-500/15',   text: 'text-amber-400',   Icono: BadgeAlert },
        faltante: { bg: 'bg-rose-500/8',    border: 'border-rose-500/15',    text: 'text-rose-400',    Icono: BadgeX    },
    }

    const c = colores[estado]
    const { Icono } = c

    return (
        <div className={`rounded-2xl border p-6 ${c.bg} ${c.border}`}>
            <div className="flex items-center gap-3 mb-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} border ${c.border}`}>
                    <Icono className={`w-5 h-5 ${c.text}`} />
                </div>
                <div>
                    <p className={`font-bold text-base ${c.text}`}>
                        {estado === 'cuadrado' ? 'Caja cuadrada' : estado === 'sobrante' ? 'Sobrante en caja' : 'Faltante en caja'}
                    </p>
                    <p className="text-zinc-600 text-[11px]">Arqueo completado</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[
                    { label: 'Sistema registra',  valor: formatCOP(total_efectivo_sistema),                color: 'text-white' },
                    { label: 'Contado físico',    valor: formatCOP(total_efectivo_real),                   color: 'text-white' },
                    { label: 'Ingresos efectivo', valor: formatCOP(arqueo.sesion.total_ingresos_efectivo), color: 'text-emerald-400' },
                    { label: 'Egresos efectivo',  valor: formatCOP(arqueo.sesion.total_egresos_efectivo),  color: 'text-rose-400' },
                ].map(({ label, valor, color }) => (
                    <div key={label} className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-3">
                        <p className="text-[11px] text-zinc-600 mb-1 font-medium">{label}</p>
                        <p className={`font-bold tabular-nums tracking-tight text-sm ${color}`}>{valor}</p>
                    </div>
                ))}
            </div>

            <div className={`flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border ${c.border} mb-4`}>
                <span className="text-zinc-500 text-sm font-medium">Diferencia</span>
                <span className={`font-bold text-lg tabular-nums tracking-tight ${c.text}`}>
                    {diferencia >= 0 ? '+' : ''}{formatCOP(diferencia)}
                </span>
            </div>

            <button
                onClick={onCerrar}
                className="w-full py-2 rounded-xl text-sm font-medium text-zinc-400 bg-zinc-800/60 hover:bg-zinc-800 transition-all"
            >
                Entendido
            </button>
        </div>
    )
}

// ── Props ──────────────────────────────────────────────────

interface Props {
    cajaActiva:    SesionCaja | null
    historialCaja: SesionCaja[]
    rol:           RolContabilidad
    onCajaChange?: (caja: SesionCaja | null) => void
}

// ── Componente principal ───────────────────────────────────

export default function TabCaja({ cajaActiva: cajaInit, historialCaja: histInit, rol, onCajaChange }: Props) {
    const [cajaActiva, setCajaActiva] = useState<SesionCaja | null>(cajaInit)
    const [historial, setHistorial]   = useState<SesionCaja[]>(histInit)
    const [arqueo, setArqueo]         = useState<ArqueoCaja | null>(null)
    const [error, setError]           = useState<string | null>(null)
    const [cargando, startTransition] = useTransition()

    // ── Estado apertura ────────────────────────────────────
    const [saldoApertura, setSaldoApertura]           = useState('')
    const [notasApertura, setNotasApertura]           = useState('')
    const [denomApertura, setDenomApertura]           = useState<Record<string, string>>({})
    const [mostrarDenomApert, setMostrarDenomApert]   = useState(false)

    // ── Estado cierre ──────────────────────────────────────
    const [saldoCierre, setSaldoCierre]               = useState('')
    const [notasCierre, setNotasCierre]               = useState('')
    const [denomCierre, setDenomCierre]               = useState<Record<string, string>>({})
    const [mostrarDenomCierre, setMostrarDenomCierre] = useState(false)

    const esAdmin = rol === 'admin' || rol === 'superadmin'

    // Referencia: último turno cerrado
    const ultimaSesion        = historial.find(s => s.estado !== 'open') ?? null
    const saldoEsperadoPrevio = ultimaSesion != null
        ? (ultimaSesion.saldo_inicial ?? 0)
          + (ultimaSesion.total_ingresos_efectivo ?? 0)
          - (ultimaSesion.total_egresos_efectivo ?? 0)
        : null

    // Efectivo estimado en caja (turno activo)
    const saldoActual = cajaActiva
        ? cajaActiva.saldo_inicial
          + cajaActiva.total_ingresos_efectivo
          - cajaActiva.total_egresos_efectivo
        : 0

    // ── Handlers denominado ────────────────────────────────
    const actualizarDenomApert = (key: string, val: string) => {
        const nuevo = { ...denomApertura, [key]: val.replace(/\D/g, '') }
        setDenomApertura(nuevo)
        const total = calcTotalDenom(nuevo)
        if (total > 0) setSaldoApertura(String(total))
    }

    const actualizarDenomCierre = (key: string, val: string) => {
        const nuevo = { ...denomCierre, [key]: val.replace(/\D/g, '') }
        setDenomCierre(nuevo)
        const total = calcTotalDenom(nuevo)
        if (total > 0) setSaldoCierre(String(total))
    }

    // Resetear denominado cuando se activa (empezar conteo limpio)
    const toggleDenomApert = () => {
        setMostrarDenomApert(prev => {
            if (!prev) { setDenomApertura({}); setSaldoApertura('') }
            return !prev
        })
    }

    const toggleDenomCierre = () => {
        setMostrarDenomCierre(prev => {
            if (!prev) { setDenomCierre({}); setSaldoCierre('') }
            return !prev
        })
    }

    // ── Acciones ───────────────────────────────────────────
    const refrescar = async () => {
        const [caja, hist] = await Promise.all([
            getCajaActivaAction(),
            getHistorialCajaAction(10),
        ])
        if (caja.ok) {
            setCajaActiva(caja.data)
            onCajaChange?.(caja.data)
        }
        if (hist.ok) setHistorial(hist.data)
    }

    const abrirCaja = () => {
        const saldo = parseFloat(saldoApertura)
        if (isNaN(saldo) || saldo < 0) { setError('Ingresa un fondo inicial válido.'); return }
        setError(null)
        startTransition(async () => {
            const res = await abrirCajaAction({ saldo_inicial: saldo, notas: notasApertura || undefined })
            if (!res.ok) { setError(res.error); return }
            setSaldoApertura('')
            setNotasApertura('')
            setDenomApertura({})
            setMostrarDenomApert(false)
            await refrescar()
        })
    }

    const cerrarCaja = () => {
        if (!cajaActiva) return
        const saldo = parseFloat(saldoCierre)
        if (isNaN(saldo) || saldo < 0) { setError('Ingresa el saldo físico contado.'); return }
        setError(null)
        startTransition(async () => {
            const res = await cerrarCajaAction({ sesion_id: cajaActiva.id, saldo_final: saldo, notas: notasCierre || undefined })
            if (!res.ok) { setError(res.error); return }
            setArqueo(res.data)
            setSaldoCierre('')
            setNotasCierre('')
            setDenomCierre({})
            setMostrarDenomCierre(false)
            await refrescar()
        })
    }

    return (
        <div className="space-y-5">
            {/* Resultado de arqueo */}
            {arqueo && <ResultadoArqueo arqueo={arqueo} onCerrar={() => setArqueo(null)} />}

            {cajaActiva ? (
                /* ─────────────────────────────────────────────────────
                   ESTADO: CAJA ABIERTA
                ───────────────────────────────────────────────────── */
                <CardV2 relleno="lg">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
                            <Vault className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-white">Turno en curso</h3>
                            <p className="text-[11px] text-zinc-600 truncate">
                                {cajaActiva.usuario_nombre} · Apertura: {formatFechaHora(cajaActiva.apertura_at)}
                            </p>
                        </div>
                        <BadgeV2 variante="exito" etiqueta="Activa" />
                    </div>

                    {/* KPIs — 4 métricas */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                        <div className="bg-zinc-900/60 border border-white/[0.06] rounded-xl p-4">
                            <p className="text-[10px] font-medium tracking-wide uppercase text-zinc-600 mb-2">Fondo inicial</p>
                            <p className="text-sm font-bold text-white tabular-nums tracking-tight">{formatCOP(cajaActiva.saldo_inicial)}</p>
                        </div>
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                            <div className="flex items-center gap-1 mb-2">
                                <TrendingUp className="w-3 h-3 text-emerald-500" />
                                <p className="text-[10px] font-medium tracking-wide uppercase text-zinc-600">Ingresos</p>
                            </div>
                            <p className="text-sm font-bold text-emerald-400 tabular-nums tracking-tight">{formatCOP(cajaActiva.total_ingresos_efectivo)}</p>
                        </div>
                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-xl p-4">
                            <div className="flex items-center gap-1 mb-2">
                                <TrendingDown className="w-3 h-3 text-rose-500" />
                                <p className="text-[10px] font-medium tracking-wide uppercase text-zinc-600">Egresos</p>
                            </div>
                            <p className="text-sm font-bold text-rose-400 tabular-nums tracking-tight">{formatCOP(cajaActiva.total_egresos_efectivo)}</p>
                        </div>
                        <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4">
                            <p className="text-[10px] font-medium tracking-wide uppercase text-zinc-600 mb-2">Efectivo en caja</p>
                            <p className="text-sm font-bold text-orange-400 tabular-nums tracking-tight">{formatCOP(saldoActual)}</p>
                        </div>
                    </div>

                    {/* Formulario de cierre */}
                    <div className="border-t border-white/[0.06] pt-5 space-y-4">
                        <p className="text-[11px] font-medium tracking-wide uppercase text-zinc-600">Cerrar turno</p>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={labelCls}>Saldo físico contado ($)</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMilesInput(saldoCierre)}
                                    readOnly={mostrarDenomCierre}
                                    onChange={e => {
                                        if (!mostrarDenomCierre) { setSaldoCierre(e.target.value.replace(/\D/g, '')); setError(null) }
                                    }}
                                    placeholder="0"
                                    className={`${inputCls} tabular-nums${mostrarDenomCierre ? ' opacity-60 cursor-default' : ''}`}
                                />
                            </div>
                            <div>
                                <label className={labelCls}>Notas de cierre</label>
                                <input
                                    type="text"
                                    value={notasCierre}
                                    onChange={e => setNotasCierre(e.target.value)}
                                    placeholder="Observaciones..."
                                    className={inputCls}
                                />
                            </div>
                        </div>

                        {/* Toggle denominado cierre */}
                        <button
                            type="button"
                            onClick={toggleDenomCierre}
                            className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mostrarDenomCierre ? 'rotate-180' : ''}`} />
                            {mostrarDenomCierre ? 'Ocultar desglose de billetes/monedas' : 'Contar con desglose de billetes y monedas'}
                        </button>

                        {mostrarDenomCierre && (
                            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-xl p-4">
                                <SeccionDenominado
                                    denom={denomCierre}
                                    onCambiar={actualizarDenomCierre}
                                    total={calcTotalDenom(denomCierre)}
                                />
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={cerrarCaja}
                            disabled={cargando}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-500 hover:bg-rose-400 disabled:opacity-50 transition-all"
                        >
                            {cargando ? <SpinnerMinimal className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                            Cerrar caja y hacer arqueo
                        </button>
                    </div>
                </CardV2>
            ) : (
                /* ─────────────────────────────────────────────────────
                   ESTADO: CAJA CERRADA
                ───────────────────────────────────────────────────── */
                <CardV2 relleno="lg">
                    {/* Referencia del turno anterior (solo admin) */}
                    {esAdmin && ultimaSesion && saldoEsperadoPrevio !== null && (
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-blue-500/5 border border-blue-500/10 rounded-xl mb-5">
                            <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-semibold text-blue-400">Saldo esperado del turno anterior</p>
                                <p className="text-[10px] text-zinc-600 mt-0.5 truncate">
                                    {ultimaSesion.usuario_nombre} · Verifica que el efectivo físico coincida
                                </p>
                            </div>
                            <span className="text-sm font-bold text-blue-400 tabular-nums flex-shrink-0">
                                {formatCOP(saldoEsperadoPrevio)}
                            </span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-white/[0.06] flex items-center justify-center">
                            <Vault className="w-5 h-5 text-zinc-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">Abrir Turno de Caja</h3>
                            <p className="text-[11px] text-zinc-600">Registra el fondo base antes de comenzar operaciones</p>
                        </div>
                        <BadgeV2 variante="peligro" etiqueta="Cerrada" className="ml-auto" />
                    </div>

                    <div className="space-y-4">
                        {/* Fondo inicial */}
                        <div>
                            <label className={labelCls}>
                                Fondo inicial en efectivo ($) <span className="text-orange-500">*</span>
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={formatMilesInput(saldoApertura)}
                                readOnly={mostrarDenomApert}
                                onChange={e => {
                                    if (!mostrarDenomApert) { setSaldoApertura(e.target.value.replace(/\D/g, '')); setError(null) }
                                }}
                                placeholder="0"
                                className={`${inputCls} tabular-nums text-base font-semibold${mostrarDenomApert ? ' opacity-60 cursor-default' : ''}`}
                            />
                        </div>

                        {/* Toggle denominado apertura */}
                        <button
                            type="button"
                            onClick={toggleDenomApert}
                            className="flex items-center gap-1.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${mostrarDenomApert ? 'rotate-180' : ''}`} />
                            {mostrarDenomApert ? 'Ocultar desglose de billetes/monedas' : 'Contar con desglose de billetes y monedas'}
                        </button>

                        {mostrarDenomApert && (
                            <div className="bg-zinc-900/40 border border-white/[0.04] rounded-xl p-4">
                                <SeccionDenominado
                                    denom={denomApertura}
                                    onCambiar={actualizarDenomApert}
                                    total={calcTotalDenom(denomApertura)}
                                />
                            </div>
                        )}

                        {/* Notas */}
                        <div>
                            <label className={labelCls}>
                                Notas de apertura <span className="normal-case text-zinc-700 font-normal">(opcional)</span>
                            </label>
                            <input
                                type="text"
                                value={notasApertura}
                                onChange={e => setNotasApertura(e.target.value)}
                                placeholder="Observaciones del turno..."
                                className={inputCls}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /><span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={abrirCaja}
                            disabled={cargando}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 transition-all"
                        >
                            {cargando ? <SpinnerMinimal className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            Abrir turno
                        </button>
                    </div>
                </CardV2>
            )}

            {/* Historial de turnos */}
            <CardV2 relleno="ninguno" className="overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.06]">
                    <History className="w-3.5 h-3.5 text-zinc-600" />
                    <h3 className="text-sm font-semibold text-white">Historial de Turnos</h3>
                </div>

                {historial.length === 0 ? (
                    <EmptyState Icono={Vault} titulo="Sin historial" descripcion="Los turnos de caja cerrados aparecerán aquí." />
                ) : (
                    <ul className="divide-y divide-white/[0.04]">
                        {historial.map(s => {
                            const diferenciaAbs = Math.abs(s.diferencia ?? 0)
                            const estadoDif = s.diferencia == null ? null
                                : s.diferencia === 0 ? 'cuadrado'
                                : s.diferencia > 0  ? 'sobrante'
                                : 'faltante'

                            return (
                                <li key={s.id} className="px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-zinc-300">{s.usuario_nombre}</p>
                                            <p className="text-[11px] text-zinc-600">{formatFechaHora(s.apertura_at)}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            {s.estado === 'open' ? (
                                                <BadgeV2 variante="exito" etiqueta="Abierta" />
                                            ) : estadoDif === 'cuadrado' ? (
                                                <BadgeV2 variante="exito" etiqueta="Cuadrada" />
                                            ) : estadoDif === 'sobrante' ? (
                                                <BadgeV2 variante="alerta" etiqueta={`+${formatCOP(diferenciaAbs)}`} />
                                            ) : estadoDif === 'faltante' ? (
                                                <BadgeV2 variante="peligro" etiqueta={`-${formatCOP(diferenciaAbs)}`} />
                                            ) : (
                                                <BadgeV2 variante="neutro" etiqueta="Cerrada" />
                                            )}
                                            <p className="text-[11px] text-zinc-700 mt-0.5 tabular-nums">
                                                Inicial: {formatCOP(s.saldo_inicial)}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </CardV2>
        </div>
    )
}
